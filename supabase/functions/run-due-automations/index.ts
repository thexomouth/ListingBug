/**
 * run-due-automations
 *
 * Called by pg_cron every hour: `0 * * * *`
 * Finds all active automations where next_run_at <= now(), runs them,
 * then sets next_run_at to the CORRECT next wall-clock time in
 * America/Los_Angeles.
 *
 * Schedule: 3:00 AM PST / 3:00 AM PDT daily.
 * This captures a full American workday's worth of new listings
 * without firing during business hours.
 *
 * IMPORTANT: automation_runs table does NOT have error_message column.
 * Only use columns: id, automation_id, user_id, automation_name, run_date,
 * status, listings_found, listings_sent, destination, details
 *
 * KEY DESIGN: next_run_at is set BEFORE the run executes so even if the
 * function crashes or times out, the automation won't re-run next hour.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nextRunAtPacific(scheduleTime: string, afterMs = Date.now()): Date {
  const [h, m] = scheduleTime.split(":").map(Number);
  for (let daysAhead = 0; daysAhead <= 2; daysAhead++) {
    const probeDay = new Date(afterMs + daysAhead * 86_400_000);
    const pacificDateStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Los_Angeles",
    }).format(probeDay);
    const noonUTC = new Date(`${pacificDateStr}T12:00:00Z`);
    const pacHourAtNoon = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        hour12: false,
      }).format(noonUTC),
      10
    );
    const offsetHours = 12 - pacHourAtNoon;
    const [yr, mo, dy] = pacificDateStr.split("-").map(Number);
    const utcMs = Date.UTC(yr, mo - 1, dy, h + offsetHours, m, 0, 0);
    const candidate = new Date(utcMs);
    if (candidate.getTime() > afterMs + 30_000) {
      return candidate;
    }
  }
  return new Date(afterMs + 25 * 3_600_000);
}

async function fetchListings(searchCriteria: Record<string, unknown>): Promise<unknown[]> {
  const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "";
  const {
    listingType = "sale",
    city, state, zipCode, address,
    latitude, longitude, radius,
    propertyType, bedrooms, bathrooms,
    minPrice, maxPrice,
    daysOld: rawDaysOld,
    status = "Active",
    limit: resultLimit = 500,
  } = searchCriteria as Record<string, unknown>;

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
  if (bedrooms != null && bedrooms !== "")   params.set("bedrooms", String(bedrooms));
  if (bathrooms != null && bathrooms !== "") params.set("bathrooms", String(bathrooms));
  if (minPrice != null && maxPrice != null)  params.set("price", `${minPrice}-${maxPrice}`);
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
  console.log("[run-due-automations] RentCast:", url);

  const res = await fetch(url, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RentCast ${res.status}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function sendToDestination(
  supabase: ReturnType<typeof createClient>,
  automation: Record<string, unknown>,
  listings: unknown[]
): Promise<{ sent: number; error?: string }> {
  const destType = String(automation.destination_type ?? "");
  const userId = String(automation.user_id);
  const snapshotConfig = (automation.destination_config ?? {}) as Record<string, unknown>;

  const { data: connRow } = await supabase
    .from("integration_connections")
    .select("credentials, config")
    .eq("user_id", userId)
    .eq("integration_id", destType)
    .maybeSingle();

  const credentials = (connRow?.credentials ?? {}) as Record<string, unknown>;
  const liveConfig = (connRow?.config ?? {}) as Record<string, unknown>;
  const config = { ...snapshotConfig, ...liveConfig };

  console.log(`[run-due-automations] dispatch destType=${destType} list_id=${config.list_id ?? "n/a"}`);

  switch (destType) {
    case "twilio": {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-twilio`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: listings.length } : { sent: 0, error: b.error ?? `send-to-twilio ${r.status}` };
    }
    case "mailchimp": {
      if (!config.list_id) return { sent: 0, error: "Mailchimp audience not configured" };
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-mailchimp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config, list_id: config.list_id }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: listings.length } : { sent: 0, error: b.error ?? "Mailchimp error" };
    }
    case "hubspot": {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-hubspot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: listings.length } : { sent: 0, error: b.error ?? "HubSpot error" };
    }
    case "sheets": {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: listings.length } : { sent: 0, error: b.error ?? "Sheets error" };
    }
    case "sendgrid": {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-sendgrid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, config, credentials }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: listings.length } : { sent: 0, error: b.error ?? "SendGrid error" };
    }
    case "webhook": case "zapier": case "make": case "n8n": {
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
    default:
      return { sent: 0, error: `Unsupported destination: ${destType}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  console.log("[run-due-automations] tick at", now.toISOString());

  const { data: dueAutomations, error: fetchErr } = await supabase
    .from("automations")
    .select("*")
    .eq("active", true)
    .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`);

  if (fetchErr) {
    console.error("[run-due-automations] fetch error:", fetchErr.message);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[run-due-automations] running ${dueAutomations?.length ?? 0} automations`);
  const results: { id: string; name: string; status: string; sent: number }[] = [];

  for (const automation of dueAutomations ?? []) {
    const automationId = automation.id as string;
    const automationName = automation.name as string;
    // Default 03:00 PST — captures full prior workday, fires before business hours
    const scheduleTime: string = (automation.schedule_time as string | null) ?? "03:00";

    console.log(`[run-due-automations] running "${automationName}"`);

    // Set next_run_at FIRST — before executing — so a crash can't cause a re-run next hour
    const nextRunAt = nextRunAtPacific(scheduleTime, now.getTime());
    console.log(`[run-due-automations] next_run_at="${nextRunAt.toISOString()}" (${scheduleTime} PT)`);
    await supabase.from("automations").update({
      next_run_at: nextRunAt.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", automationId);

    let runStatus: "success" | "failed" | "partial" = "success";
    let listings: unknown[] = [];
    let listingsSent = 0;
    let errorMsg: string | undefined;

    try {
      listings = await fetchListings((automation.search_criteria ?? {}) as Record<string, unknown>);
      console.log(`[run-due-automations] "${automationName}" fetched ${listings.length} listings`);

      if (listings.length > 0) {
        const result = await sendToDestination(supabase, automation as Record<string, unknown>, listings);
        listingsSent = result.sent;
        if (result.error) { runStatus = "partial"; errorMsg = result.error; }
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error(`[run-due-automations] "${automationName}" failed:`, e.message);
      runStatus = "failed";
      errorMsg = e.message;
    }

    // Log — only valid automation_runs columns (no error_message)
    const { error: logErr } = await supabase.from("automation_runs").insert({
      automation_id: automationId,
      user_id: automation.user_id,
      automation_name: automationName,
      run_date: now.toISOString(),
      status: runStatus,
      listings_found: listings.length,
      listings_sent: listingsSent,
      destination: automation.destination_type,
      details: runStatus === "success"
        ? `Sent ${listingsSent} listings to ${automation.destination_label ?? automation.destination_type}`
        : `Completed with issues: ${errorMsg ?? "unknown"}`,
    });
    if (logErr) console.error(`[run-due-automations] log insert error:`, logErr.message);

    // Update last_run_at (next_run_at already set above)
    await supabase.from("automations").update({
      last_run_at: now.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", automationId);

    results.push({ id: automationId, name: automationName, status: runStatus, sent: listingsSent });
  }

  return new Response(
    JSON.stringify({ ran: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
