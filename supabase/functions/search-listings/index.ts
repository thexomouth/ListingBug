import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fallback to hardcoded key if secret not set in Supabase dashboard
const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "28c8bab516194c20a346b7db3d987bd6";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAN_LIMITS: Record<string, number> = {
  trial: 500,
  starter: 4000,
  professional: 10000,
  enterprise: 999999,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isPreview = url.searchParams.get("preview") === "true";

    let supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let user: any = null;
    let currentUsage = 0;
    let limit = 500;

    if (!isPreview) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }

      // Extract token and verify it
      const token = authHeader.replace("Bearer ", "");
      
      // Create a client with the user's token to get their info
      const userClient = createClient(SUPABASE_URL, token);
      const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
      
      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }

      user = authUser;

      // Get or auto-create user profile
      let { data: profileData } = await supabase
        .from("users")
        .select("plan, plan_status, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const { data: newProfile } = await supabase
          .from("users")
          .upsert({
            id: user.id,
            email: user.email,
            plan: "trial",
            plan_status: "active",
            trial_ends_at: trialEndsAt.toISOString(),
            created_at: new Date().toISOString(),
          }, { onConflict: "id" })
          .select("plan, plan_status, trial_ends_at")
          .single();
        profileData = newProfile ?? { plan: "trial", plan_status: "active", trial_ends_at: trialEndsAt.toISOString() };
      }

      // Check trial expiry
      if (profileData.plan === "trial" && profileData.trial_ends_at) {
        if (new Date(profileData.trial_ends_at) < new Date()) {
          return new Response(JSON.stringify({ error: "Trial expired", code: "TRIAL_EXPIRED" }), { status: 403, headers: corsHeaders });
        }
      }

      // Check usage limits
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: usageData } = await supabase
        .from("usage_tracking")
        .select("listings_fetched")
        .eq("user_id", user.id)
        .eq("month_year", monthYear)
        .single();
      currentUsage = usageData?.listings_fetched ?? 0;
      limit = PLAN_LIMITS[profileData.plan] ?? 500;

      if (currentUsage >= limit) {
        return new Response(JSON.stringify({ error: "Monthly listing limit reached", code: "LIMIT_REACHED", limit, used: currentUsage }), { status: 429, headers: corsHeaders });
      }
    }

    // Parse search params
    const body = await req.json();
    const {
      listingType = "sale",
      address, city, state, zipCode, latitude, longitude, radius,
      propertyType, bedrooms, bathrooms, minPrice, maxPrice,
      minSquareFootage, maxSquareFootage, minYearBuilt, maxYearBuilt,
      minDaysOnMarket, maxDaysOnMarket,
      status = "Active",
      limit: resultLimit = 50,
      offset = 0,
    } = body;

    const endpoint = listingType === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (zipCode) params.set("zipCode", zipCode);
    if (latitude) params.set("latitude", String(latitude));
    if (longitude) params.set("longitude", String(longitude));
    if (radius) params.set("radius", String(radius));
    if (propertyType) params.set("propertyType", propertyType);
    if (bedrooms) params.set("bedrooms", String(bedrooms));
    if (bathrooms) params.set("bathrooms", String(bathrooms));
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (minSquareFootage) params.set("minSquareFootage", String(minSquareFootage));
    if (maxSquareFootage) params.set("maxSquareFootage", String(maxSquareFootage));
    if (minYearBuilt) params.set("minYearBuilt", String(minYearBuilt));
    if (maxYearBuilt) params.set("maxYearBuilt", String(maxYearBuilt));
    if (minDaysOnMarket) params.set("minDaysOnMarket", String(minDaysOnMarket));
    if (maxDaysOnMarket) params.set("maxDaysOnMarket", String(maxDaysOnMarket));
    if (status) params.set("status", status);

    const cappedLimit = isPreview ? Math.min(resultLimit, 10) : Math.min(resultLimit, 500);
    params.set("limit", String(cappedLimit));
    params.set("offset", String(offset));

    const rentcastRes = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
    });

    if (!rentcastRes.ok) {
      const errorText = await rentcastRes.text();
      return new Response(JSON.stringify({ error: `Rentcast API error: ${errorText}` }), { status: rentcastRes.status, headers: corsHeaders });
    }

    const listings = await rentcastRes.json();
    const listingArray = Array.isArray(listings) ? listings : [];

    if (!isPreview && listingArray.length > 0 && supabase) {
      const rows = listingArray.map((l: any) => ({
        id: l.id,
        formatted_address: l.formattedAddress,
        address_line1: l.addressLine1,
        city: l.city,
        state: l.state,
        zip_code: l.zipCode,
        latitude: l.latitude,
        longitude: l.longitude,
        listing_type: listingType,
        status: l.status,
        price: l.price,
        listed_date: l.listedDate,
        days_on_market: l.daysOnMarket,
        property_type: l.propertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        square_footage: l.squareFootage,
        year_built: l.yearBuilt,
        agent_name: l.agent?.name,
        agent_phone: l.agent?.phone,
        agent_email: l.agent?.email,
        photos_json: l.photos ?? [],
        raw_json: l,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("listings").upsert(rows, { onConflict: "id" }).catch(() => {});
    }

    if (!isPreview && supabase && user) {
      const monthYear = new Date().toISOString().slice(0, 7);
      await supabase.from("usage_tracking").upsert({
        user_id: user.id,
        month_year: monthYear,
        listings_fetched: currentUsage + listingArray.length,
        searches_run: 1,
      }, { onConflict: "user_id,month_year", ignoreDuplicates: false }).catch(() => {});
    }

    return new Response(JSON.stringify({
      listings: listingArray,
      count: listingArray.length,
      usage: { used: currentUsage + listingArray.length, limit },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
