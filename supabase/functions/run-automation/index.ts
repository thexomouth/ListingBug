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
    city, state, zipCode, address,
    latitude, longitude, radius,
    propertyType, bedrooms, bathrooms,
    minPrice, maxPrice,
    daysOld: rawDaysOld,
    status = "Active",
    limit: resultLimit = 500,
  } = searchCriteria;

  const endpoint =
    listingType === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

  const params = new URLSearchParams();
  if (address)      params.set("address", String(address));
  if (city)         params.set("city", String(city));
  if (state)        params.set("state", String(state));
  if (zipCode)      params.set("zipCode", String(zipCode));
  if (latitude != null)  params.set("latitude", String(latitude));
  if (longitude != null) params.set("longitude", String(longitude));
  if (radius != null)    params.set("radius", String(radius));
  if (propertyType) params.set("propertyType", String(propertyType));
  if (bedrooms != null && bedrooms !== "") params.set("bedrooms", String(bedrooms));
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
): Promise<{ sent: number; error?: string }> {
  const destType = String(automation.destination_type ?? "");
  const config = (automation.destination_config ?? {}) as Record<string, unknown>;
  const userId = String(automation.user_id);

  // Load stored credentials
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("integration_id", destType)
    .maybeSingle();

  const credentials = (conn?.credentials ?? {}) as Record<string, unknown>;

  switch (destType) {
    case "twilio": {
      const sid   = String(credentials.accountSid   ?? Deno.env.get("TWILIO_ACCOUNT_SID")   ?? "");
      const token = String(credentials.authToken    ?? Deno.env.get("TWILIO_AUTH_TOKEN")    ?? "");
      const from  = String(credentials.fromNumber   ?? Deno.env.get("TWILIO_FROM_NUMBER")   ?? "");
      const to    = String(config.to_number ?? config.phone ?? "");

      if (!sid || !token || !from || !to) {
        return { sent: 0, error: "Twilio credentials or destination number missing" };
      }

      const body = listings.length === 0
        ? `ListingBug: No new listings matched your "${automation.name}" automation today.`
        : `ListingBug: ${listings.length} new listing${listings.length > 1 ? "s" : ""} matched "${automation.name}". Log in to view details.`;

      const form = new URLSearchParams({ From: from, To: to, Body: body });
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form,
        }
      );
      if (!twilioRes.ok) {
        const err = await twilioRes.text();
        console.error("[run-automation] Twilio error:", err);
        return { sent: 0, error: err };
      }
      return { sent: listings.length };
    }

    case "sendgrid": {
      const apiKey  = String(credentials.apiKey ?? "");
      const toEmail = String(config.to_email ?? config.email ?? "");
      if (!apiKey || !toEmail) return { sent: 0, error: "SendGrid API key or destination email missing" };

      const subject = listings.length === 0
        ? `No new listings — ${automation.name}`
        : `${listings.length} new listing${listings.length > 1 ? "s" : ""} — ${automation.name}`;

      const rows = (listings as Record<string, unknown>[])
        .map(l => `<tr><td>${l.formatted_address ?? ""}</td><td>$${(l.price as number)?.toLocaleString() ?? ""}</td><td>${l.bedrooms ?? ""}bd/${l.bathrooms ?? ""}ba</td><td>${l.agent_name ?? ""}</td><td>${l.agent_email ?? ""}</td></tr>`)
        .join("");

      const html = listings.length === 0
        ? `<p>No listings matched your search for <strong>${automation.name}</strong> today.</p>`
        : `<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
             <thead><tr><th>Address</th><th>Price</th><th>Beds/Baths</th><th>Agent</th><th>Agent Email</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;

      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: "noreply@thelistingbug.com", name: "ListingBug" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      if (!sgRes.ok && sgRes.status !== 202) {
        const err = await sgRes.text();
        return { sent: 0, error: err };
      }
      return { sent: listings.length };
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
      const fnUrl = `${SUPABASE_URL}/functions/v1/send-to-mailchimp`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const body = await res.json();
      if (!res.ok) return { sent: 0, error: body.error ?? "Mailchimp error" };
      return { sent: listings.length };
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

    case "sheets": {
      const fnUrl = `${SUPABASE_URL}/functions/v1/send-to-sheets`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const body = await res.json();
      if (!res.ok) return { sent: 0, error: body.error ?? "Sheets error" };
      return { sent: listings.length };
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
          error_message: null,
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
      if (result.error) {
        runStatus = "partial";
        errorMsg = result.error;
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error(`[run-automation] Error:`, e.message);
      runStatus = "failed";
      errorMsg = e.message;
    }

    // 7. Log run
    await supabase.from("automation_runs").insert({
      automation_id: automation.id,
      user_id: user.id,
      automation_name: automation.name,
      run_date: now.toISOString(),
      status: runStatus,
      listings_found: listings.length,
      listings_sent: listingsSent,
      destination: automation.destination_type,
      details: runStatus === "success"
        ? `Sent ${listingsSent} listings to ${automation.destination_label ?? automation.destination_type}`
        : `Completed with issues: ${errorMsg ?? "unknown"}`,
      error_message: errorMsg ?? null,
    });

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
        details: errorMsg ?? `Sent ${listingsSent} listings to ${automation.destination_label ?? automation.destination_type}`,
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
