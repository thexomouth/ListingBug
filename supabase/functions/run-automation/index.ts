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
// Normalize raw RentCast listing to the camelCase shape stored in search_runs
// (mirrors the mapping in SearchListings.tsx so AgentsPage can read it)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Messaging list destination + on_sync trigger
// ---------------------------------------------------------------------------
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
  if (!apiKey) {
    console.warn("[run-automation] on_sync: no SendGrid key for user", userId);
    return;
  }

  // Resolve sender info for each automation (all share same user, cache once)
  const sendersRes = await fetch("https://api.sendgrid.com/v3/senders", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const sendersData: any[] = sendersRes.ok ? await sendersRes.json() : [];

  for (const auto of msgAutos) {
    const sender = sendersData.find((s: any) => String(s.id) === String(auto.sender_id));
    if (!sender) { console.warn("[run-automation] on_sync: sender not found for auto", auto.id); continue; }

    const { data: memberships } = await supabase
      .from("marketing_contacts_lists")
      .select("contact_id")
      .eq("list_id", listId);

    if (!memberships || memberships.length === 0) continue;

    const contactIds = memberships.map((m: any) => m.contact_id);
    const { data: contacts } = await supabase
      .from("marketing_contacts")
      .select("id, email, first_name, last_name, city, company")
      .in("id", contactIds)
      .eq("user_id", userId)
      .eq("unsubscribed", false);

    if (!contacts || contacts.length === 0) continue;

    const campaignId = crypto.randomUUID();
    await supabase.from("marketing_campaigns").insert({
      id: campaignId,
      user_id: userId,
      name: `${auto.name} (On Sync)`,
      subject: auto.subject,
      channel: "email",
      sender_id: String(auto.sender_id),
      recipient_count: contacts.length,
    });

    let sent = 0;
    for (const contact of contacts) {
      const mergeData: Record<string, string> = {
        first_name: contact.first_name ?? "there",
        last_name: contact.last_name ?? "",
        city: contact.city ?? "",
        company: contact.company ?? "",
      };
      const payload = {
        personalizations: [{ to: [{ email: contact.email }] }],
        from: { email: sender.from?.email, name: sender.from?.name },
        subject: applyMergeTags(auto.subject ?? "", mergeData),
        content: [{ type: "text/html", value: applyMergeTags(auto.body ?? "", mergeData) }],
      };
      try {
        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const sgMsgId = sgRes.headers.get("X-Message-Id");
        const status = (sgRes.ok || sgRes.status === 202) ? "pending" : "failed";
        if (status === "pending") sent++;
        await supabase.from("marketing_sends").insert({
          campaign_id: campaignId, contact_id: contact.id, email: contact.email,
          status, sg_message_id: sgMsgId, sent_at: new Date().toISOString(),
        });
      } catch (e: any) {
        console.error("[run-automation] on_sync send error:", e?.message);
      }
    }

    await supabase.from("messaging_automations").update({
      last_run_at: new Date().toISOString(),
      total_sent: (auto.total_sent ?? 0) + sent,
      updated_at: new Date().toISOString(),
    }).eq("id", auto.id);

    console.log(`[run-automation] on_sync: sent ${sent} for messaging auto "${auto.name}"`);
  }
}

async function sendToMessagingList(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  listings: unknown[],
  config: Record<string, unknown>,
  destType: string
): Promise<{ sent: number; skipped?: number; error?: string }> {
  // Extract agents with emails from listings
  const seen = new Set<string>();
  const agents: any[] = [];
  for (const l of listings as any[]) {
    const email = (l.agentEmail ?? l.agent_email ?? l.listingAgent?.email ?? "").toLowerCase().trim();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    const name: string = l.agentName ?? l.agent_name ?? l.listingAgent?.name ?? "";
    const parts = name.trim().split(/\s+/);
    agents.push({
      user_id: userId,
      email,
      first_name: parts[0] ?? "",
      last_name: parts.slice(1).join(" ") || null,
      city: l.city ?? null,
      company: l.officeName ?? l.brokerage ?? l.listingOffice?.name ?? null,
      phone: l.agentPhone ?? l.agent_phone ?? l.listingAgent?.phone ?? null,
      source: "automation",
    });
  }

  const skippedNoEmail = (listings as any[]).length - agents.length;
  if (agents.length === 0) return { sent: 0, skipped: skippedNoEmail, error: "No agents with email addresses found in listings" };

  // Resolve or create the list
  let listId: string;
  if (destType === "messaging-list-new") {
    const listName = String(config.list_name ?? "Automation List").trim();
    const { data: existing } = await supabase.from("marketing_lists").select("id").eq("user_id", userId).eq("name", listName).maybeSingle();
    if (existing) {
      listId = existing.id;
    } else {
      const { data: newList, error: listErr } = await supabase.from("marketing_lists").insert({ user_id: userId, name: listName }).select("id").single();
      if (listErr || !newList) return { sent: 0, error: listErr?.message ?? "Failed to create list" };
      listId = newList.id;
    }
  } else {
    listId = String(config.list_id ?? "");
    if (!listId) return { sent: 0, error: "No list selected" };
  }

  // Upsert agents as marketing_contacts
  const { data: upserted, error: upsertErr } = await supabase
    .from("marketing_contacts")
    .upsert(agents, { onConflict: "user_id,email", ignoreDuplicates: false })
    .select("id, email");
  if (upsertErr) return { sent: 0, error: upsertErr.message };

  // Re-fetch IDs to get definitive IDs after upsert
  const { data: freshContacts } = await supabase
    .from("marketing_contacts")
    .select("id")
    .eq("user_id", userId)
    .in("email", agents.map((a: any) => a.email));

  const contactIds = (freshContacts ?? []).map((c: any) => c.id);
  const memberships = contactIds.map((cid: string) => ({ contact_id: cid, list_id: listId }));
  if (memberships.length > 0) {
    await supabase.from("marketing_contacts_lists").upsert(memberships, { onConflict: "contact_id,list_id", ignoreDuplicates: true });
  }

  // Trigger any on_sync messaging automations watching this list
  await triggerOnSyncMessagingAutomations(supabase, userId, listId);

  return { sent: agents.length, skipped: skippedNoEmail };
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
      const b = await res.json().catch(() => ({}));
      if (!res.ok) return { sent: 0, error: b.error ?? "HubSpot error" };
      const skipped = b.skipped_no_contact ?? b.skipped_no_email ?? 0;
      const failed = b.failed ?? 0;
      return { sent: b.confirmed ?? b.sent ?? listings.length, skipped, failed };
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

    case "messaging-list-new":
    case "messaging-list-existing":
      return sendToMessagingList(supabase, userId, listings, mergedConfig, destType);

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

    // 8a. Write to search_runs so AgentsPage (and Search History) reflects this run
    if (listings.length > 0) {
      const criteria = (automation.search_criteria ?? {}) as Record<string, unknown>;
      const locationParts = [criteria.city, criteria.state].filter(Boolean);
      const location = locationParts.length > 0
        ? locationParts.join(", ")
        : criteria.zipCode ? String(criteria.zipCode) : "Custom search";
      const normalizedListings = normalizeListings(listings);
      await supabase.from("search_runs").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        location,
        criteria_description: String(automation.name ?? "Automation"),
        criteria_json: criteria,
        results_json: normalizedListings,
        results_count: normalizedListings.length,
        searched_at: now.toISOString(),
        automation_name: String(automation.name ?? ""),
      });
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
