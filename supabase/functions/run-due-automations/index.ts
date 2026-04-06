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
    city, state, address,
    latitude, longitude, radius,
    propertyType,
    minPrice, maxPrice,
    daysOld: rawDaysOld,
    status = "Active",
    limit: resultLimit = 500,
  } = searchCriteria as Record<string, unknown>;

  // Support both camelCase (zipCode/bedrooms/bathrooms) and SearchListings shorthand (zip/beds/baths)
  const zipCode   = (searchCriteria.zipCode   ?? searchCriteria.zip)   as string | undefined;
  const bedrooms  = (searchCriteria.bedrooms  ?? searchCriteria.beds)  as string | number | undefined;
  const bathrooms = (searchCriteria.bathrooms ?? searchCriteria.baths) as string | number | undefined;

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

function normalizeListings(raw: unknown[]): unknown[] {
  return raw.map((l: any, i: number) => ({
    id: l.id || l.formattedAddress || String(i),
    address: l.addressLine1 || l.formattedAddress || "",
    formattedAddress: l.formattedAddress || "",
    city: l.city || "",
    state: l.state || "",
    zip: l.zipCode || "",
    county: l.county || "",
    propertyType: l.propertyType || "Single Family",
    bedrooms: l.bedrooms || 0,
    bathrooms: l.bathrooms || 0,
    sqft: l.squareFootage || 0,
    lotSize: l.lotSize || 0,
    yearBuilt: l.yearBuilt || 0,
    status: l.status || "Active",
    price: l.price || 0,
    daysListed: l.daysOnMarket || 0,
    listedDate: l.listedDate || "",
    removedDate: l.removedDate || "",
    createdDate: l.createdDate || "",
    lastSeenDate: l.lastSeenDate || "",
    listingType: l.listingType || "",
    mlsNumber: l.mlsNumber || "",
    mlsName: l.mlsName || "",
    hoaFee: l.hoa?.fee ?? null,
    agentName: l.listingAgent?.name || "",
    agentPhone: l.listingAgent?.phone || "",
    agentEmail: l.listingAgent?.email || "",
    agentWebsite: l.listingAgent?.website || "",
    officeName: l.listingOffice?.name || "",
    officePhone: l.listingOffice?.phone || "",
    officeEmail: l.listingOffice?.email || "",
    officeWebsite: l.listingOffice?.website || "",
    brokerage: l.listingAgent?.office || l.listingOffice?.name || "",
    priceDrop: l.priceReduced || false,
    latitude: l.latitude || 0,
    longitude: l.longitude || 0,
    description: l.description || "",
    photos: l.photos || [],
  }));
}

function applyMergeTags(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

async function resolveSendGridKey(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data: mc } = await supabase.from("messaging_config").select("config").eq("user_id", userId).eq("platform", "sendgrid").maybeSingle();
  if (mc?.config?.api_key) return mc.config.api_key;
  const { data: conn } = await supabase.from("integration_connections").select("credentials").eq("user_id", userId).eq("integration_id", "sendgrid").maybeSingle();
  if ((conn?.credentials as any)?.api_key) return (conn.credentials as any).api_key;
  return null;
}

async function triggerOnSyncMessagingAutomations(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  listId: string
): Promise<void> {
  const { data: msgAutos } = await supabase
    .from("messaging_automations")
    .select("*")
    .eq("user_id", userId)
    .eq("list_id", listId)
    .eq("schedule", "on_sync")
    .eq("status", "active");

  if (!msgAutos || msgAutos.length === 0) return;

  const apiKey = await resolveSendGridKey(supabase, userId);
  if (!apiKey) { console.warn("[run-due-automations] on_sync: no SendGrid key for user", userId); return; }

  const sendersRes = await fetch("https://api.sendgrid.com/v3/senders", { headers: { Authorization: `Bearer ${apiKey}` } });
  const sendersData: any[] = sendersRes.ok ? await sendersRes.json() : [];

  for (const auto of msgAutos) {
    const sender = sendersData.find((s: any) => String(s.id) === String(auto.sender_id));
    if (!sender) continue;

    const { data: memberships } = await supabase.from("marketing_contacts_lists").select("contact_id").eq("list_id", listId);
    if (!memberships || memberships.length === 0) continue;

    const { data: contacts } = await supabase
      .from("marketing_contacts")
      .select("id, email, first_name, last_name, city, company")
      .in("id", memberships.map((m: any) => m.contact_id))
      .eq("user_id", userId)
      .eq("unsubscribed", false);

    if (!contacts || contacts.length === 0) continue;

    const campaignId = crypto.randomUUID();
    await supabase.from("marketing_campaigns").insert({
      id: campaignId, user_id: userId, name: `${auto.name} (On Sync)`,
      subject: auto.subject, channel: "email", sender_id: String(auto.sender_id), recipient_count: contacts.length,
    });

    let sent = 0;
    for (const contact of contacts) {
      const mergeData: Record<string, string> = {
        first_name: contact.first_name ?? "there", last_name: contact.last_name ?? "",
        city: contact.city ?? "", company: contact.company ?? "",
      };
      try {
        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: contact.email }] }],
            from: { email: sender.from?.email, name: sender.from?.name },
            subject: applyMergeTags(auto.subject ?? "", mergeData),
            content: [{ type: "text/html", value: applyMergeTags(auto.body ?? "", mergeData) }],
          }),
        });
        const sgMsgId = sgRes.headers.get("X-Message-Id");
        const status = (sgRes.ok || sgRes.status === 202) ? "pending" : "failed";
        if (status === "pending") sent++;
        await supabase.from("marketing_sends").insert({
          campaign_id: campaignId, contact_id: contact.id, email: contact.email,
          status, sg_message_id: sgMsgId, sent_at: new Date().toISOString(),
        });
      } catch (e: any) { console.error("[run-due-automations] on_sync send error:", e?.message); }
    }

    await supabase.from("messaging_automations").update({
      last_run_at: new Date().toISOString(),
      total_sent: (auto.total_sent ?? 0) + sent,
      updated_at: new Date().toISOString(),
    }).eq("id", auto.id);
  }
}

async function sendToMessagingList(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  listings: unknown[],
  config: Record<string, unknown>,
  destType: string
): Promise<{ sent: number; skipped?: number; error?: string }> {
  const seen = new Set<string>();
  const agents: any[] = [];
  for (const l of listings as any[]) {
    const email = (l.agentEmail ?? l.agent_email ?? l.listingAgent?.email ?? "").toLowerCase().trim();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    const name: string = l.agentName ?? l.agent_name ?? l.listingAgent?.name ?? "";
    const parts = name.trim().split(/\s+/);
    agents.push({
      user_id: userId, email,
      first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") || null,
      city: l.city ?? null,
      company: l.officeName ?? l.brokerage ?? l.listingOffice?.name ?? null,
      phone: l.agentPhone ?? l.agent_phone ?? l.listingAgent?.phone ?? null,
      source: "automation",
    });
  }

  const skippedNoEmail = (listings as any[]).length - agents.length;
  if (agents.length === 0) return { sent: 0, skipped: skippedNoEmail, error: "No agents with email addresses found in listings" };

  let listId: string;
  if (destType === "messaging-list-new") {
    const listName = String(config.list_name ?? "Automation List").trim();
    const { data: existing } = await supabase.from("marketing_lists").select("id").eq("user_id", userId).eq("name", listName).maybeSingle();
    if (existing) { listId = existing.id; } else {
      const { data: newList, error: listErr } = await supabase.from("marketing_lists").insert({ user_id: userId, name: listName }).select("id").single();
      if (listErr || !newList) return { sent: 0, error: listErr?.message ?? "Failed to create list" };
      listId = newList.id;
    }
  } else {
    listId = String(config.list_id ?? "");
    if (!listId) return { sent: 0, error: "No list selected" };
  }

  await supabase.from("marketing_contacts").upsert(agents, { onConflict: "user_id,email", ignoreDuplicates: false });

  const { data: freshContacts } = await supabase.from("marketing_contacts").select("id").eq("user_id", userId).in("email", agents.map((a: any) => a.email));
  const memberships = (freshContacts ?? []).map((c: any) => ({ contact_id: c.id, list_id: listId }));
  if (memberships.length > 0) {
    await supabase.from("marketing_contacts_lists").upsert(memberships, { onConflict: "contact_id,list_id", ignoreDuplicates: true });
  }

  await triggerOnSyncMessagingAutomations(supabase, userId, listId);
  return { sent: agents.length, skipped: skippedNoEmail };
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
    case "google": {
      if (!config.spreadsheet_id) return { sent: 0, error: "No spreadsheet configured. Set one in Integrations → Google Sheets settings." };
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({
          user_id: userId,
          listings,
          spreadsheet_id: config.spreadsheet_id,
          sheet_name: config.sheet_name ?? "Sheet1",
          write_mode: config.write_mode ?? "append",
        }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok ? { sent: b.rows_written ?? listings.length } : { sent: 0, error: b.error ?? "Sheets error" };
    }
    case "sendgrid": {
      const listIds: string[] = config.list_ids ?? (config.list_id ? [String(config.list_id)] : []);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-to-sendgrid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ user_id: userId, listings, list_ids: listIds }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) return { sent: 0, error: b.error ?? "SendGrid error" };
      return { sent: b.confirmed ?? b.sent ?? b.accepted ?? listings.length };
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
    case "messaging-list-new":
    case "messaging-list-existing":
      return sendToMessagingList(supabase, userId, listings, config, destType);

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

    // Write to search_runs so AgentsPage reflects this automation's results
    if (listings.length > 0) {
      const criteria = (automation.search_criteria ?? {}) as Record<string, unknown>;
      const locationParts = [criteria.city, criteria.state].filter(Boolean);
      const location = locationParts.length > 0
        ? locationParts.join(", ")
        : criteria.zipCode ? String(criteria.zipCode) : "Custom search";
      const normalizedListings = normalizeListings(listings);
      const { error: srErr } = await supabase.from("search_runs").insert({
        id: crypto.randomUUID(),
        user_id: automation.user_id,
        location,
        criteria_description: String(automationName),
        criteria_json: criteria,
        results_json: normalizedListings,
        results_count: normalizedListings.length,
        searched_at: now.toISOString(),
        automation_name: String(automationName),
      });
      if (srErr) console.error(`[run-due-automations] search_runs insert error:`, srErr.message);
    }

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
