/**
 * run-automation
 * Manual "Run Now" triggered from the frontend.
 * Body: { automation_id: string }
 *
 * Flow:
 *  1. Auth: extract user_id from JWT
 *  2. Load automation row (must belong to this user)
 *  3. Fetch listings from RentCast using search_criteria
 *  4. Guard: if 0 listings, log + return success (never call integrations with empty array)
 *  5. Dispatch to integration (twilio, sendgrid, webhook, mailchimp, hubspot, sheets)
 *  6. Log to automation_runs
 *  7. Update automations.last_run_at
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// RentCast listing fetch
// ---------------------------------------------------------------------------
async function fetchListings(searchCriteria: Record<string, unknown>): Promise<unknown[]> {
  const {
    listingType = "sale",
    city, state, address,
    latitude, longitude, radius,
    propertyType,
    minPrice, maxPrice,
    daysOld: rawDaysOld,
    status = "Active",
    limit: resultLimit = 500,
  } = searchCriteria;

  // Support both camelCase (zipCode/bedrooms/bathrooms) and SearchListings shorthand (zip/beds/baths)
  const zipCode   = (searchCriteria.zipCode   ?? searchCriteria.zip)      as string | undefined;
  const bedrooms  = (searchCriteria.bedrooms  ?? searchCriteria.beds)     as string | number | undefined;
  const bathrooms = (searchCriteria.bathrooms ?? searchCriteria.baths)    as string | number | undefined;

  const endpoint =
    listingType === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

  const params = new URLSearchParams();
  if (address)      params.set("address", String(address));
  if (city)         params.set("city", String(city));
  if (state)        params.set("state", String(state));
  if (zipCode)      params.set("zipCode", String(zipCode));
  if (latitude != null && latitude !== "")   params.set("latitude", String(latitude));
  if (longitude != null && longitude !== "") params.set("longitude", String(longitude));
  if (radius != null && radius !== "")       params.set("radius", String(radius));
  if (propertyType) params.set("propertyType", String(propertyType));
  if (bedrooms  != null && bedrooms  !== "") params.set("bedrooms",  String(bedrooms));
  if (bathrooms != null && bathrooms !== "") params.set("bathrooms", String(bathrooms));
  if (minPrice != null && maxPrice != null) params.set("price", `${minPrice}-${maxPrice}`);
  else if (minPrice != null) params.set("price", `${minPrice}+`);
  else if (maxPrice != null) params.set("price", `0-${maxPrice}`);

  if (rawDaysOld != null && rawDaysOld !== "") {
    const n = parseInt(String(rawDaysOld), 10);
    if (n > 0) {
      params.set("daysOld", `${Math.max(0.1, n - 0.1)}-${n + 0.9}`);
    }
  }

  params.set("status", String(status));
  params.set("limit", String(Math.min(Number(resultLimit) || 500, 500)));

  const url = `${endpoint}?${params.toString()}`;
  console.log("[run-automation] RentCast request:", url);

  const res = await fetch(url, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[run-automation] RentCast error:", res.status, text);
    throw new Error(`RentCast ${res.status}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// Integration dispatcher
// ---------------------------------------------------------------------------
async function sendToDestination(
  supabase: ReturnType<typeof createClient>,
  automation: Record<string, unknown>,
  listings: unknown[]
): Promise<{ sent: number; skipped?: number; failed?: number; reason?: string; error?: string }> {
  const destType = String(automation.destination_type ?? "");
  const config = (automation.destination_config ?? {}) as Record<string, unknown>;
  const userId = String(automation.user_id);

  // Load stored credentials + config
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("credentials, config")
    .eq("user_id", userId)
    .eq("integration_id", destType)
    .maybeSingle();

  const credentials = (conn?.credentials ?? {}) as Record<string, unknown>;
  const connConfig  = (conn?.config      ?? {}) as Record<string, unknown>;
  // Merge: connection config provides live values (e.g. spreadsheet_id), destination_config overrides if set
  const mergedConfig = { ...connConfig, ...config };

  switch (destType) {
    case "twilio": {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-twilio`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({
          user_id: userId,
          listings,
          list_unique_name: mergedConfig.list_unique_name,
          sync_service_sid: mergedConfig.sync_service_sid,
        }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) return { sent: 0, error: b.error ?? `send-to-twilio ${r.status}` };
      const skipped = b.skipped_no_phone ?? 0;
      const reason = skipped > 0
        ? `${skipped} listing${skipped !== 1 ? "s" : ""} skipped — listing data did not include an agent phone number`
        : undefined;
      return { sent: b.confirmed ?? b.sent ?? listings.length, skipped, reason };
    }

    case "sendgrid": {
      const listIds: string[] = mergedConfig.list_ids ?? (mergedConfig.list_id ? [String(mergedConfig.list_id)] : []);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-sendgrid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, list_ids: listIds }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) return { sent: 0, error: b.error ?? "SendGrid error" };
      const skipped = b.skipped_no_email ?? 0;
      const reason = skipped > 0
        ? `${skipped} listing${skipped !== 1 ? "s" : ""} skipped — listing data did not include an agent email address`
        : undefined;
      return { sent: b.confirmed ?? b.sent ?? b.accepted ?? listings.length, skipped, reason };
    }

    case "webhook": {
      const webhookUrl = String(config.webhook_url ?? "");
      if (!webhookUrl) return { sent: 0, error: "No webhook URL configured" };
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "ListingBug/1.0" },
        body: JSON.stringify({
          automation_name: automation.name,
          listings,
          count: listings.length,
          sent_at: new Date().toISOString(),
        }),
      });
      return res.ok ? { sent: listings.length } : { sent: 0, error: `HTTP ${res.status}` };
    }

    case "mailchimp": {
      if (!mergedConfig.list_id) return { sent: 0, error: "Mailchimp audience not configured" };
      const fnUrl = `${SUPABASE_URL}/functions/v1/send-to-mailchimp`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({
          user_id: userId,
          listings,
          list_id: mergedConfig.list_id,
          tags: mergedConfig.tags,
        }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) return { sent: 0, error: b.error ?? "Mailchimp error" };
      const skipped = b.skipped_no_email ?? 0;
      const failed = b.failed ?? 0;
      const reason = skipped > 0
        ? `${skipped} listing${skipped !== 1 ? "s" : ""} skipped — listing data did not include an agent email address`
        : undefined;
      return { sent: b.confirmed ?? b.sent ?? listings.length, skipped, failed, reason };
    }

    case "hubspot": {
      const fnUrl = `${SUPABASE_URL}/functions/v1/send-to-hubspot`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const body = await res.json();
      if (!res.ok) return { sent: 0, error: body.error ?? "HubSpot error" };
      return { sent: listings.length };
    }

    case "google": {
      if (!mergedConfig.spreadsheet_id) return { sent: 0, error: "No spreadsheet configured. Set one in Integrations → Google Sheets settings." };
      const fnUrl = `${SUPABASE_URL}/functions/v1/send-to-sheets`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({
          user_id: userId,
          listings,
          spreadsheet_id: mergedConfig.spreadsheet_id,
          sheet_name: mergedConfig.sheet_name ?? "Sheet1",
          write_mode: mergedConfig.write_mode ?? "append",
        }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) return { sent: 0, error: b.error ?? "Sheets error" };
      return { sent: b.rows_written ?? listings.length };
    }

    default:
      console.warn("[run-automation] Unknown destination type:", destType);
      return { sent: 0, error: `Unsupported destination: ${destType}` };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth — get user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse body
    const { automation_id } = await req.json();
    if (!automation_id) {
      return new Response(JSON.stringify({ error: "automation_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Load automation (service role, but verify ownership)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: automation, error: autoErr } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automation_id)
      .eq("user_id", user.id)
      .single();

    if (autoErr || !automation) {
      return new Response(JSON.stringify({ error: "Automation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    console.log(`[run-automation] Running "${automation.name}" for user ${user.id}`);

    // 4. Fetch listings from RentCast
    let listings: unknown[] = [];
    let runStatus: "success" | "failed" | "partial" = "success";
    let errorMsg: string | undefined;
    let listingsSent = 0;
    let listingsSkipped = 0;
    let listingsFailed = 0;
    let skipReason: string | undefined;

    try {
      listings = await fetchListings(
        (automation.search_criteria ?? {}) as Record<string, unknown>
      );
      console.log(`[run-automation] Fetched ${listings.length} listings`);

      // 5. Guard: nothing to send — log and return cleanly (do NOT call integrations)
      if (listings.length === 0) {
        console.log("[run-automation] No listings found — skipping integration dispatch");

        await supabase.from("automation_runs").insert({
          automation_id: automation.id,
          user_id: user.id,
          automation_name: automation.name,
          run_date: now.toISOString(),
          status: "success",
          listings_found: 0,
          listings_sent: 0,
          destination: automation.destination_type,
          details: "No listings matched the search criteria",
        });

        await supabase.from("automations").update({
          last_run_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", automation.id);

        return new Response(
          JSON.stringify({ status: "success", listings_found: 0, listings_sent: 0, details: "No listings matched the search criteria" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 6. Dispatch to integration — listings is guaranteed non-empty here
      const result = await sendToDestination(supabase, automation as Record<string, unknown>, listings);
      listingsSent = result.sent;
      listingsSkipped = result.skipped ?? 0;
      listingsFailed = result.failed ?? 0;
      skipReason = result.reason;
      if (result.error) {
        runStatus = listingsSent > 0 ? "partial" : "failed";
        errorMsg = result.error;
      } else if (listingsSkipped > 0 && listingsSent === 0) {
        runStatus = "partial";
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error(`[run-automation] Error:`, e.message);
      runStatus = "failed";
      errorMsg = e.message;
    }

    // 7. Log run — build human-readable details that explain any skips/failures
    const destLabel = String(automation.destination_label ?? automation.destination_type);
    let runDetails: string;
    if (runStatus === "failed") {
      runDetails = `Export failed: ${errorMsg ?? "unknown error"}`;
    } else if (listingsSkipped > 0 && listingsSent === 0) {
      runDetails = skipReason
        ? `0 exported — ${skipReason}`
        : `0 exported — listings did not contain the required contact data for this destination`;
    } else if (listingsSkipped > 0) {
      runDetails = `${listingsSent} exported to ${destLabel}${skipReason ? `; ${skipReason}` : `, ${listingsSkipped} skipped`}`;
    } else if (runStatus === "partial") {
      runDetails = `Partial export: ${listingsSent} sent, error — ${errorMsg ?? "unknown"}`;
    } else {
      runDetails = `${listingsSent} listing${listingsSent !== 1 ? "s" : ""} exported to ${destLabel}`;
    }

    // 7a. Pre-generate run ID so we can reference it in automation_run_listings
    const runId = crypto.randomUUID();

    await supabase.from("automation_runs").insert({
      id: runId,
      automation_id: automation.id,
      user_id: user.id,
      automation_name: automation.name,
      run_date: now.toISOString(),
      status: runStatus,
      listings_found: listings.length,
      listings_sent: listingsSent,
      contacts_skipped: listingsSkipped,
      contacts_failed: listingsFailed,
      destination: automation.destination_type,
      details: runDetails,
      error_message: errorMsg ?? null,
    });

    // 7b. Persist each listing so the Results page can display them
    if (listings.length > 0) {
      const transferred = runStatus !== "failed" && listingsSent > 0;
      await supabase.from("automation_run_listings").insert(
        (listings as any[]).map((listing) => ({
          automation_run_id: runId,
          user_id: user.id,
          listing_id: String((listing as any).id ?? (listing as any).formattedAddress ?? ""),
          listing_data: listing,
          transferred,
        }))
      );
    }

    // 8. Update last_run_at
    await supabase.from("automations").update({
      last_run_at: now.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", automation.id);

    return new Response(
      JSON.stringify({
        status: runStatus,
        listings_found: listings.length,
        listings_sent: listingsSent,
        listings_skipped: listingsSkipped,
        details: runDetails,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[run-automation] Unhandled error:", e.message);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
