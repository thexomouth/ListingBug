/**
 * run-due-automations
 *
 * Called by pg_cron every hour: `0 * * * *`
 * Finds all active automations where next_run_at <= now(), runs them,
 * then sets next_run_at to the CORRECT next wall-clock time in
 * America/Los_Angeles — never drifting regardless of when the run finishes.
 *
 * THE DRIFT BUG (fixed here):
 *   Old code: next_run_at = actual_run_timestamp + 24h
 *   Problem:  run fires at 08:00:03 → next_run_at = tomorrow 08:00:03
 *             pg_cron at 08:00:00 sees 08:00:03 > now → skips
 *             pg_cron at 09:00:00 fires → run at 09:00:03 → drift +1h/day
 *
 *   Fix:      next_run_at = nextOccurrenceOf(schedule_time, 'America/Los_Angeles')
 *             Always anchored to the wall-clock target, not the actual run time.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Timezone-aware next-run computation
// ---------------------------------------------------------------------------

/**
 * Returns the next UTC timestamp at which `scheduleTime` (HH:MM, Pacific)
 * will occur, always in the future.
 *
 * Handles PST (UTC-8) and PDT (UTC-7) automatically via Intl — no hardcoded
 * offsets, no DST bugs.
 *
 * @param scheduleTime  "HH:MM" in America/Los_Angeles, e.g. "05:00"
 * @param afterMs       reference point (defaults to now). next run must be > afterMs.
 */
function nextRunAtPacific(scheduleTime: string, afterMs = Date.now()): Date {
  const [h, m] = scheduleTime.split(":").map(Number);

  // Try today, tomorrow, and the day after — pick the first occurrence that
  // is strictly in the future relative to `afterMs`.
  for (let daysAhead = 0; daysAhead <= 2; daysAhead++) {
    const probeDay = new Date(afterMs + daysAhead * 86_400_000);

    // Get this probe day's date in Pacific (gives "YYYY-MM-DD")
    const pacificDateStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Los_Angeles",
    }).format(probeDay);

    // Determine Pacific UTC offset on that date by probing noon UTC.
    // noon UTC is always within the same Pacific calendar day for any timezone
    // offset between -12 and +12, so it's safe to use as the anchor.
    const noonUTC = new Date(`${pacificDateStr}T12:00:00Z`);
    const pacHourAtNoon = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        hour12: false,
      }).format(noonUTC),
      10
    );
    // Offset in hours: e.g. noon UTC → 5 AM PDT  → offset = 12 - 5 = 7h
    //                       noon UTC → 4 AM PST  → offset = 12 - 4 = 8h
    const offsetHours = 12 - pacHourAtNoon;

    // Build the UTC timestamp for h:m Pacific on pacificDateStr
    const [yr, mo, dy] = pacificDateStr.split("-").map(Number);
    const utcMs = Date.UTC(yr, mo - 1, dy, h + offsetHours, m, 0, 0);
    const candidate = new Date(utcMs);

    // Accept only if it's still in the future (with a 30-second buffer so a
    // run that started just before the mark doesn't schedule for today again)
    if (candidate.getTime() > afterMs + 30_000) {
      return candidate;
    }
  }

  // Fallback: 25 hours from now (should never be reached)
  return new Date(afterMs + 25 * 3_600_000);
}

// ---------------------------------------------------------------------------
// RentCast search helper (mirrors search-listings edge function logic)
// ---------------------------------------------------------------------------

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
  if (latitude != null)  params.set("latitude", String(latitude));
  if (longitude != null) params.set("longitude", String(longitude));
  if (radius != null)    params.set("radius", String(radius));
  if (propertyType) params.set("propertyType", String(propertyType));
  if (bedrooms != null && bedrooms !== "") params.set("bedrooms", String(bedrooms));
  if (bathrooms != null && bathrooms !== "") params.set("bathrooms", String(bathrooms));
  if (minPrice != null && maxPrice != null) params.set("price", `${minPrice}-${maxPrice}`);
  else if (minPrice != null) params.set("price", `${minPrice}+`);
  else if (maxPrice != null) params.set("price", `0-${maxPrice}`);

  // daysOld: convert integer N → decimal range trick (same as search-listings)
  if (rawDaysOld != null && rawDaysOld !== "") {
    const n = parseInt(String(rawDaysOld), 10);
    if (n > 0) {
      const lo = Math.max(0.1, n - 0.1);
      const hi = n + 0.9;
      params.set("daysOld", `${lo}-${hi}`);
    }
  }

  params.set("status", String(status));
  params.set("limit", String(Math.min(Number(resultLimit) || 500, 500)));

  const url = `${endpoint}?${params.toString()}`;
  console.log("[run-due-automations] RentCast request:", url);

  const res = await fetch(url, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[run-due-automations] RentCast error:", res.status, text);
    throw new Error(`RentCast ${res.status}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// Destination dispatcher
// ---------------------------------------------------------------------------

async function sendToDestination(
  supabase: ReturnType<typeof createClient>,
  automation: Record<string, unknown>,
  listings: unknown[]
): Promise<{ sent: number; error?: string }> {
  const destType = String(automation.destination_type ?? "");
  const config = (automation.destination_config ?? {}) as Record<string, unknown>;
  const userId = String(automation.user_id);

  // Load stored credentials for this integration
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("integration_id", destType)
    .maybeSingle();

  const credentials = (conn?.credentials ?? {}) as Record<string, unknown>;

  switch (destType) {
    case "twilio": {
      const sid = String(credentials.accountSid ?? Deno.env.get("TWILIO_ACCOUNT_SID") ?? "");
      const token = String(credentials.authToken ?? Deno.env.get("TWILIO_AUTH_TOKEN") ?? "");
      const from = String(credentials.fromNumber ?? Deno.env.get("TWILIO_FROM_NUMBER") ?? "");
      const to = String(config.to_number ?? config.phone ?? "");

      if (!sid || !token || !from || !to) {
        return { sent: 0, error: "Twilio credentials or destination number missing" };
      }

      const body =
        listings.length === 0
          ? `ListingBug: No new listings matched your "${automation.name}" automation today.`
          : `ListingBug: ${listings.length} new listing${listings.length > 1 ? "s" : ""} matched "${automation.name}". Log in to view details.`;

      const form = new URLSearchParams({
        From: from, To: to, Body: body,
      });
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
        console.error("[run-due-automations] Twilio error:", err);
        return { sent: 0, error: err };
      }
      return { sent: listings.length };
    }

    case "sendgrid": {
      const apiKey = String(credentials.apiKey ?? "");
      const toEmail = String(config.to_email ?? config.email ?? "");

      if (!apiKey || !toEmail) {
        return { sent: 0, error: "SendGrid API key or destination email missing" };
      }

      const subject =
        listings.length === 0
          ? `No new listings — ${automation.name}`
          : `${listings.length} new listing${listings.length > 1 ? "s" : ""} — ${automation.name}`;

      const rows = (listings as Record<string, unknown>[])
        .map(
          (l) =>
            `<tr><td>${l.formatted_address ?? ""}</td><td>$${(l.price as number)?.toLocaleString() ?? ""}</td><td>${l.bedrooms ?? ""}bd/${l.bathrooms ?? ""}ba</td><td>${l.agent_name ?? ""}</td><td>${l.agent_email ?? ""}</td></tr>`
        )
        .join("");

      const html =
        listings.length === 0
          ? `<p>No listings matched your search for <strong>${automation.name}</strong> today.</p>`
          : `<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
               <thead><tr><th>Address</th><th>Price</th><th>Beds/Baths</th><th>Agent</th><th>Agent Email</th></tr></thead>
               <tbody>${rows}</tbody>
             </table>`;

      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
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

      return res.ok
        ? { sent: listings.length }
        : { sent: 0, error: `HTTP ${res.status}` };
    }

    default:
      console.warn("[run-due-automations] Unknown destination type:", destType);
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  console.log("[run-due-automations] tick at", now.toISOString());

  // ── 1. Find all due automations ─────────────────────────────────────────
  const { data: dueAutomations, error: fetchErr } = await supabase
    .from("automations")
    .select("*")
    .eq("active", true)
    .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`);

  if (fetchErr) {
    console.error("[run-due-automations] fetch error:", fetchErr.message);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[run-due-automations] due automations:", dueAutomations?.length ?? 0);

  const results: { id: string; name: string; status: string; sent: number }[] = [];

  for (const automation of dueAutomations ?? []) {
    const automationId = automation.id as string;
    const automationName = automation.name as string;
    const scheduleTime: string = (automation.schedule_time as string | null) ?? "05:00";

    console.log(`[run-due-automations] running automation "${automationName}" (${automationId})`);

    // ── 2. Compute next_run_at NOW (before the run, so drift can't accumulate)
    //       Base the computation on the SCHEDULED time, not the actual run time.
    // ────────────────────────────────────────────────────────────────────────
    const nextRunAt = nextRunAtPacific(scheduleTime, now.getTime());
    console.log(
      `[run-due-automations] next_run_at for "${automationName}": ${nextRunAt.toISOString()} (schedule: ${scheduleTime} PT)`
    );

    let runStatus: "success" | "failed" | "partial" = "success";
    let listingsSent = 0;
    let errorMsg: string | undefined;

    try {
      // ── 3. Fetch listings ──────────────────────────────────────────────
      const listings = await fetchListings(
        (automation.search_criteria ?? {}) as Record<string, unknown>
      );
      console.log(`[run-due-automations] "${automationName}" fetched ${listings.length} listings`);

      // ── 4. Send to destination ─────────────────────────────────────────
      const result = await sendToDestination(supabase, automation as Record<string, unknown>, listings);
      listingsSent = result.sent;
      if (result.error) {
        runStatus = "partial";
        errorMsg = result.error;
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.error(`[run-due-automations] "${automationName}" failed:`, e.message);
      runStatus = "failed";
      errorMsg = e.message;
    }

    // ── 5. Log run ─────────────────────────────────────────────────────
    await supabase.from("automation_runs").insert({
      automation_id: automationId,
      user_id: automation.user_id,
      automation_name: automationName,
      run_date: now.toISOString(),
      status: runStatus,
      listings_sent: listingsSent,
      destination: automation.destination_type,
      details: runStatus === "success"
        ? `Sent ${listingsSent} listings to ${automation.destination_label ?? automation.destination_type}`
        : `Completed with issues: ${errorMsg ?? "unknown"}`,
      error_message: errorMsg ?? null,
    });

    // ── 6. Update automation — last_run_at AND next_run_at ─────────────
    //       CRITICAL: Set next_run_at from the SCHEDULED wall-clock time,
    //       NOT from now(). This prevents the 1-hour/day drift.
    // ────────────────────────────────────────────────────────────────────
    await supabase
      .from("automations")
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRunAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", automationId);

    results.push({ id: automationId, name: automationName, status: runStatus, sent: listingsSent });
  }

  return new Response(
    JSON.stringify({ ran: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
