import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY")!;
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
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Get user plan
    const { data: profile } = await supabase.from("users").select("plan, plan_status, trial_ends_at").eq("id", user.id).single();
    if (!profile) return new Response(JSON.stringify({ error: "User profile not found" }), { status: 404, headers: corsHeaders });

    // Check trial expiry
    if (profile.plan === "trial" && profile.trial_ends_at) {
      if (new Date(profile.trial_ends_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Trial expired", code: "TRIAL_EXPIRED" }), { status: 403, headers: corsHeaders });
      }
    }

    // Check usage limits
    const monthYear = new Date().toISOString().slice(0, 7); // "2026-03"
    const { data: usage } = await supabase.from("usage_tracking").select("listings_fetched").eq("user_id", user.id).eq("month_year", monthYear).single();
    const currentUsage = usage?.listings_fetched ?? 0;
    const limit = PLAN_LIMITS[profile.plan] ?? 500;

    if (currentUsage >= limit) {
      return new Response(JSON.stringify({ error: "Monthly listing limit reached", code: "LIMIT_REACHED", limit, used: currentUsage }), { status: 429, headers: corsHeaders });
    }

    // Parse search params
    const body = await req.json();
    const {
      listingType = "sale", // 'sale' | 'rental'
      address, city, state, zipCode, latitude, longitude, radius,
      propertyType, bedrooms, bathrooms, minPrice, maxPrice,
      minSquareFootage, maxSquareFootage, minYearBuilt, maxYearBuilt,
      minDaysOnMarket, maxDaysOnMarket,
      status = "Active",
      limit: resultLimit = 50,
      offset = 0,
    } = body;

    // Build RentCast URL
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
    params.set("limit", String(Math.min(resultLimit, 500)));
    params.set("offset", String(offset));

    // Call RentCast
    const rentcastRes = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
    });

    if (!rentcastRes.ok) {
      const errText = await rentcastRes.text();
      return new Response(JSON.stringify({ error: "RentCast API error", details: errText }), { status: rentcastRes.status, headers: corsHeaders });
    }

    const listings = await rentcastRes.json();
    const listingArray = Array.isArray(listings) ? listings : [];

    // Upsert listings into DB
    if (listingArray.length > 0) {
      const rows = listingArray.map((l: any) => ({
        id: l.id,
        formatted_address: l.formattedAddress,
        address_line1: l.addressLine1,
        address_line2: l.addressLine2,
        city: l.city,
        state: l.state,
        zip_code: l.zipCode,
        county: l.county,
        state_fips: l.stateFips,
        county_fips: l.countyFips,
        latitude: l.latitude,
        longitude: l.longitude,
        listing_type: listingType,
        status: l.status,
        mls_number: l.mlsNumber,
        price: l.price,
        price_per_square_foot: l.pricePerSquareFoot,
        price_reduced: l.priceReduced,
        listed_date: l.listedDate,
        removed_date: l.removedDate,
        days_on_market: l.daysOnMarket,
        created_date: l.createdDate,
        last_seen_date: l.lastSeenDate,
        property_type: l.propertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        square_footage: l.squareFootage,
        lot_size: l.lotSize,
        year_built: l.yearBuilt,
        garage: l.garage,
        garage_spaces: l.garageSpaces,
        pool: l.pool,
        stories: l.stories,
        hoa_fee: l.hoa?.fee,
        agent_name: l.agent?.name,
        agent_phone: l.agent?.phone,
        agent_email: l.agent?.email,
        agent_website: l.agent?.website,
        broker_name: l.broker?.name,
        broker_phone: l.broker?.phone,
        broker_website: l.broker?.website,
        office_name: l.office?.name,
        office_phone: l.office?.phone,
        office_email: l.office?.email,
        office_website: l.office?.website,
        description: l.description,
        virtual_tour_url: l.virtualTourUrl,
        photo_count: l.photoCount,
        photos_json: l.photos ?? [],
        raw_json: l,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("listings").upsert(rows, { onConflict: "id" });
    }

    // Update usage tracking
    await supabase.from("usage_tracking").upsert({
      user_id: user.id,
      month_year: monthYear,
      listings_fetched: currentUsage + listingArray.length,
      searches_run: 1,
    }, { onConflict: "user_id,month_year", ignoreDuplicates: false });

    return new Response(JSON.stringify({
      listings: listingArray,
      count: listingArray.length,
      usage: { used: currentUsage + listingArray.length, limit },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", details: err.message }), { status: 500, headers: corsHeaders });
  }
});