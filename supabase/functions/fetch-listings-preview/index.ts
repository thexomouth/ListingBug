/**
 * fetch-listings-preview
 * Lightweight read-only function: takes raw search criteria, hits RentCast,
 * and returns the listing count + unique agent-with-email count.
 * Used by the onboarding/new-campaign flows to populate the send button
 * ("Email 47 Listing Agents →") before the campaign is created.
 * Does NOT touch the database.
 * Body: { criteria: { city, state, listing_type, price_min, price_max, ... } }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchListings(criteria: Record<string, unknown>): Promise<unknown[]> {
  const {
    listing_type = "sale",
    city,
    state,
    property_type,
    active_status = "Active",
    days_old,
    price_min,
    price_max,
    beds_min,
    baths_min,
    year_built_min,
    year_built_max,
  } = criteria;

  const endpoint =
    listing_type === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

  const params = new URLSearchParams();
  if (city) params.set("city", String(city));
  if (state) params.set("state", String(state));
  if (property_type) params.set("propertyType", String(property_type));
  if (price_min != null) params.set("priceMin", String(price_min));
  if (price_max != null) params.set("priceMax", String(price_max));
  if (beds_min != null && beds_min !== "") params.set("bedroomsMin", String(beds_min));
  if (baths_min != null && baths_min !== "") params.set("bathroomsMin", String(baths_min));

  if (days_old != null && days_old !== "") {
    const n = parseInt(String(days_old), 10);
    if (n > 0) params.set("daysOld", `${Math.max(0.1, n - 0.1)}-${n + 0.9}`);
  }

  if (year_built_min != null) params.set("yearBuiltMin", String(year_built_min));
  if (year_built_max != null) params.set("yearBuiltMax", String(year_built_max));

  params.set("status", String(active_status));
  params.set("limit", "500");

  const url = `${endpoint}?${params.toString()}`;
  console.log("[fetch-listings-preview] RentCast request:", url);

  const res = await fetch(url, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RentCast ${res.status}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { criteria } = body;
    if (!criteria) return json({ error: "criteria is required" }, 400);

    const listings = await fetchListings(criteria) as any[];

    const seenEmails = new Set<string>();
    for (const l of listings) {
      const email = (l.listingAgent?.email ?? "").toLowerCase().trim();
      if (email && email.includes("@")) seenEmails.add(email);
    }

    return json({ count: listings.length, agent_count: seenEmails.size, listings });
  } catch (err: any) {
    console.error("[fetch-listings-preview] Error:", err.message);
    return json({ error: err.message }, 500);
  }
});
