import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "28c8bab516194c20a346b7db3d987bd6";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAN_LIMITS: Record<string, number> = {
  trial: 4000,
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

    console.log("[search-listings] request received, isPreview:", isPreview);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let user: any = null;
    let currentUsage = 0;
    let limit = 4000;

    // ── AUTH + PLAN CHECK ──────────────────────────────────────────────────────
    if (!isPreview) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("[search-listings] no auth header");
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }

      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(SUPABASE_URL, token);
      const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();

      if (authError || !authUser) {
        console.error("[search-listings] auth failed:", authError?.message);
        return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), { status: 401, headers: corsHeaders });
      }

      user = authUser;
      console.log("[search-listings] authenticated user:", user.id);

      let { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("plan, plan_status, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (profileError) console.error("[search-listings] profile fetch error:", profileError.message);

      if (!profileData) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const { data: newProfile, error: upsertErr } = await supabase
          .from("users")
          .upsert({ id: user.id, email: user.email, plan: "trial", plan_status: "active", trial_ends_at: trialEndsAt.toISOString(), created_at: new Date().toISOString() }, { onConflict: "id" })
          .select("plan, plan_status, trial_ends_at").single();
        if (upsertErr) console.error("[search-listings] profile upsert error:", upsertErr.message);
        profileData = newProfile ?? { plan: "trial", plan_status: "active", trial_ends_at: trialEndsAt.toISOString() };
      }

      console.log("[search-listings] plan:", profileData?.plan, "status:", profileData?.plan_status);

      if (profileData?.plan === "trial" && profileData?.trial_ends_at) {
        if (new Date(profileData.trial_ends_at) < new Date()) {
          return new Response(JSON.stringify({ error: "Trial expired", code: "TRIAL_EXPIRED" }), { status: 403, headers: corsHeaders });
        }
      }

      const inactiveStatuses = ["canceled", "past_due", "unpaid", "inactive"];
      if (profileData?.plan !== "trial" && inactiveStatuses.includes(profileData?.plan_status?.toLowerCase() ?? "")) {
        return new Response(JSON.stringify({ error: "Subscription inactive", code: "SUBSCRIPTION_INACTIVE" }), { status: 403, headers: corsHeaders });
      }

      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: usageData, error: usageError } = await supabase
        .from("usage_tracking").select("listings_fetched, searches_run")
        .eq("user_id", user.id).eq("month_year", monthYear).single();

      if (usageError && usageError.code !== "PGRST116") console.error("[search-listings] usage fetch error:", usageError.message);

      currentUsage = usageData?.listings_fetched ?? 0;
      limit = PLAN_LIMITS[profileData?.plan ?? "trial"] ?? 4000;
      console.log("[search-listings] usage:", currentUsage, "/", limit);

      if (currentUsage >= limit) {
        return new Response(JSON.stringify({ error: "Monthly listing limit reached", code: "LIMIT_REACHED", limit, used: currentUsage }), { status: 429, headers: corsHeaders });
      }
    }

    // ── PARSE BODY ────────────────────────────────────────────────────────────
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseErr: any) {
      console.error("[search-listings] body parse failed:", parseErr.message);
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: corsHeaders });
    }

    const { listingType = "sale", address, city, state, zipCode, latitude, longitude, radius,
      propertyType, bedrooms, bathrooms, squareFootage, lotSize, yearBuilt, daysOld,
      minPrice, maxPrice, status = "Active", limit: resultLimit = 500, offset = 0 } = body;

    console.log("[search-listings] search params:", JSON.stringify({ city, state, zipCode, address, propertyType, status }));

    // ── BUILD RENTCAST REQUEST ────────────────────────────────────────────────
    // RentCast Sale Listings: GET https://api.rentcast.io/v1/listings/sale
    const endpoint = listingType === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (zipCode) params.set("zipCode", zipCode);
    if (latitude != null) params.set("latitude", String(latitude));
    if (longitude != null) params.set("longitude", String(longitude));
    if (radius != null) params.set("radius", String(radius));
    if (propertyType) params.set("propertyType", propertyType);
    if (bedrooms != null && bedrooms !== "") params.set("bedrooms", String(bedrooms));
    if (bathrooms != null && bathrooms !== "") params.set("bathrooms", String(bathrooms));
    if (squareFootage) params.set("squareFootage", String(squareFootage));
    if (lotSize) params.set("lotSize", String(lotSize));
    if (yearBuilt) params.set("yearBuilt", String(yearBuilt));
    if (daysOld != null && daysOld !== "") params.set("daysOld", String(daysOld));

    // Price: RentCast uses a range string e.g. "200000-500000" or "200000+"
    if (minPrice != null && maxPrice != null) params.set("price", `${minPrice}-${maxPrice}`);
    else if (minPrice != null) params.set("price", `${minPrice}+`);
    else if (maxPrice != null) params.set("price", `0-${maxPrice}`);

    params.set("status", status || "Active");
    params.set("limit", String(isPreview ? Math.min(resultLimit, 5) : Math.min(resultLimit, 500)));
    params.set("offset", String(offset));

    const rentcastUrl = `${endpoint}?${params.toString()}`;
    console.log("[search-listings] calling RentCast:", rentcastUrl);

    // ── CALL RENTCAST ─────────────────────────────────────────────────────────
    const rentcastRes = await fetch(rentcastUrl, {
      method: "GET",
      headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
    });

    console.log("[search-listings] RentCast response status:", rentcastRes.status);

    if (!rentcastRes.ok) {
      const errorText = await rentcastRes.text();
      console.error("[search-listings] RentCast error:", rentcastRes.status, errorText);
      return new Response(JSON.stringify({ error: `RentCast API error ${rentcastRes.status}`, detail: errorText }), { status: 502, headers: corsHeaders });
    }

    const listings = await rentcastRes.json();
    const listingArray = Array.isArray(listings) ? listings : [];
    console.log("[search-listings] RentCast returned", listingArray.length, "listings");

    // ── CACHE TO listings TABLE ───────────────────────────────────────────────
    if (!isPreview && listingArray.length > 0) {
      const rows = listingArray.map((l: any) => ({
        id: l.id,
        formatted_address: l.formattedAddress ?? null,
        address_line1: l.addressLine1 ?? null,
        address_line2: l.addressLine2 ?? null,
        city: l.city ?? null,
        state: l.state ?? null,
        zip_code: l.zipCode ?? null,
        county: l.county ?? null,
        state_fips: l.stateFips ?? null,
        county_fips: l.countyFips ?? null,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
        listing_type: listingType,
        listing_type_detail: l.listingType ?? null,
        status: l.status ?? null,
        mls_number: l.mlsNumber ?? null,
        mls_name: l.mlsName ?? null,
        price: l.price ?? null,
        price_reduced: l.priceReduced ?? false,
        listed_date: l.listedDate ?? null,
        removed_date: l.removedDate ?? null,
        created_date: l.createdDate ?? null,
        last_seen_date: l.lastSeenDate ?? null,
        days_on_market: l.daysOnMarket ?? null,
        property_type: l.propertyType ?? null,
        bedrooms: l.bedrooms ?? null,
        bathrooms: l.bathrooms ?? null,
        square_footage: l.squareFootage ?? null,
        lot_size: l.lotSize ?? null,
        year_built: l.yearBuilt ?? null,
        garage: l.garage ?? null,
        garage_spaces: l.garageSpaces ?? null,
        pool: l.pool ?? null,
        stories: l.stories ?? null,
        hoa_fee: l.hoa?.fee ?? null,
        description: l.description ?? null,
        virtual_tour_url: l.virtualTourUrl ?? null,
        photo_count: l.photos?.length ?? 0,
        agent_name: l.listingAgent?.name ?? null,
        agent_phone: l.listingAgent?.phone ?? null,
        agent_email: l.listingAgent?.email ?? null,
        agent_website: l.listingAgent?.website ?? null,
        office_name: l.listingOffice?.name ?? null,
        office_phone: l.listingOffice?.phone ?? null,
        office_email: l.listingOffice?.email ?? null,
        office_website: l.listingOffice?.website ?? null,
        broker_name: l.listingOffice?.name ?? null,
        broker_email: l.listingOffice?.email ?? null,
        broker_phone: l.listingOffice?.phone ?? null,
        broker_website: l.listingOffice?.website ?? null,
        history_json: l.history ?? null,
        photos_json: l.photos ?? [],
        raw_json: l,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: cacheErr } = await supabase.from("listings").upsert(rows, { onConflict: "id" });
      if (cacheErr) console.error("[search-listings] listings cache upsert error:", cacheErr.message);
      else console.log("[search-listings] cached", rows.length, "listings");
    }

    // ── UPDATE USAGE TRACKING ─────────────────────────────────────────────────
    if (!isPreview && user) {
      const monthYear = new Date().toISOString().slice(0, 7);
      const newListingsTotal = currentUsage + listingArray.length;

      const { data: existingUsage } = await supabase
        .from("usage_tracking").select("searches_run")
        .eq("user_id", user.id).eq("month_year", monthYear).single();

      const newSearchCount = (existingUsage?.searches_run ?? 0) + 1;

      const { error: usageUpsertErr } = await supabase.from("usage_tracking").upsert({
        user_id: user.id,
        month_year: monthYear,
        listings_fetched: newListingsTotal,
        searches_run: newSearchCount,
      }, { onConflict: "user_id,month_year" });

      if (usageUpsertErr) console.error("[search-listings] usage_tracking upsert error:", usageUpsertErr.message);
      else console.log("[search-listings] usage updated:", newListingsTotal, "fetched,", newSearchCount, "searches");
    }

    return new Response(
      JSON.stringify({ listings: listingArray, count: listingArray.length, usage: { used: currentUsage + listingArray.length, limit } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[search-listings] unhandled exception:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error", stack: err.stack }),
      { status: 500, headers: corsHeaders }
    );
  }
});
