/**
 * send-campaign-emails
 * Called on new campaign creation (immediate) or by run-campaign-schedule (scheduled).
 * Body: { campaign_id: string }
 *
 * Flow:
 *  1. Load campaign, search criteria, and user record
 *  2. Fetch listings from RentCast using campaign search criteria
 *  3. Extract agents with email addresses
 *  4. Check user_suppressions — skip suppressed agents
 *  5. Check campaign_sends dedup index — skip if already sent today (Central Time)
 *  6. Render subject/body/unsub URL for each agent
 *  7. Insert campaign_sends (status: queued) + email_queue rows with scheduled_at
 *     spaced by drip_delay_minutes — returns immediately (no blocking sleep)
 *  8. run-email-queue cron drains the queue and writes usage_logs on actual send
 *  9. Return { queued: N, first_send_at }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatSenderName } from "../_shared/senderName.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RENTCAST_API_KEY     = Deno.env.get("RENTCAST_API_KEY") ?? "";

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

// ---------------------------------------------------------------------------
// RentCast listing fetch
// ---------------------------------------------------------------------------
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
  if (price_min != null && price_max != null) params.set("price", `${price_min}-${price_max}`);
  else if (price_min != null) params.set("price", `${price_min}+`);
  else if (price_max != null) params.set("price", `0-${price_max}`);
  if (beds_min != null && beds_min !== "") params.set("bedrooms", String(beds_min));
  if (baths_min != null && baths_min !== "") params.set("bathrooms", String(baths_min));

  if (days_old != null && days_old !== "") {
    const n = parseInt(String(days_old), 10);
    if (n > 0) params.set("daysOld", `${Math.max(0.1, n - 0.1)}-${n + 0.9}`);
  }

  if (year_built_min != null || year_built_max != null) {
    const ybMin = year_built_min ?? year_built_max;
    const ybMax = year_built_max ?? year_built_min;
    params.set("yearBuilt", `${ybMin}-${ybMax}`);
  }

  params.set("status", String(active_status));
  params.set("limit", "500");

  const url = `${endpoint}?${params.toString()}`;
  console.log("[send-campaign-emails] RentCast request:", url);

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

// ---------------------------------------------------------------------------
// Variable interpolation
// ---------------------------------------------------------------------------
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// Generates path-based URL: /unsubscribe/{userId}/{campaignId}?email=...
// UnsubscribePage parses this and calls campaign-unsubscribe edge function.
function buildUnsubUrl(userId: string, campaignId: string, agentEmail: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  const encoded = encodeURIComponent(agentEmail);
  return `https://thelistingbug.com/unsubscribe/${userId}/${campaignId}?email=${encoded}`;
}

// ---------------------------------------------------------------------------
// Render email body for a single agent
// ---------------------------------------------------------------------------
function renderEmail(
  bodyText: string,
  unsubUrl: string,
  mailingAddress: string
): { bodyHtml: string; bodyTextWithUnsub: string } {
  const bodyHtmlContent = bodyText
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline">${t}</a>`
    )
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  const footerAddress = mailingAddress
    ? `<br>${mailingAddress.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}`
    : "";

  const bodyHtml = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222">${bodyHtmlContent}<p style="margin-top:2em;font-size:12px;color:#999"><a href="${unsubUrl}" style="color:#999">Unsubscribe</a>${footerAddress}</p></div>`;

  const bodyTextPlain = bodyText.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, t, u) => `${t} (${u})`
  );
  const bodyTextWithUnsub = mailingAddress
    ? `${bodyTextPlain}\n\nUnsubscribe: ${unsubUrl}\n${mailingAddress}`
    : `${bodyTextPlain}\n\nUnsubscribe: ${unsubUrl}`;

  return { bodyHtml, bodyTextWithUnsub };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
// NOTE: This function uses SERVICE_ROLE_KEY and does NOT require JWT verification.
// It can be called from:
// - Frontend (user-initiated campaign creation)
// - Cron jobs (scheduled campaigns)
// - Other edge functions
// JWT verification can be disabled in Supabase Edge Function settings.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Use service role key for all database operations
    // This bypasses RLS and does not require user JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { campaign_id } = body;
    if (!campaign_id) return json({ error: "campaign_id is required" }, 400);

    // 1. Load campaign
    const { data: campaign, error: campaignErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignErr || !campaign) return json({ error: "Campaign not found" }, 404);
    if (campaign.channel === "sms") {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ campaign_id }),
      });
      const b = await r.json().catch(() => ({}));
      return json(b, r.status);
    }

    // 2. Load search criteria
    const { data: criteria, error: criteriaErr } = await supabase
      .from("campaign_search_criteria")
      .select("*")
      .eq("campaign_id", campaign_id)
      .single();

    if (criteriaErr || !criteria) return json({ error: "Campaign search criteria not found" }, 404);

    // 3. Load user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, business_name, contact_name, forward_to, stripe_subscription_end, plan, mailing_address")
      .eq("id", campaign.user_id)
      .single();

    if (userErr || !user) return json({ error: "User not found" }, 404);

    const replyTo = campaign.forward_to || user.forward_to || user.email;
    const fromName = formatSenderName(user.contact_name, user.business_name);
    const stripePeriodEnd = user.stripe_subscription_end
      ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const planType: string = user.plan ?? "trial";
    const mailingAddress: string = user.mailing_address ?? "";

    // 4. Fetch listings — test mode bypasses RentCast
    let listings: any[] = [];
    const isTestMode = criteria.city?.toString().toLowerCase() === "test";

    if (isTestMode) {
      console.log(`[send-campaign-emails] TEST MODE — loading from test_contacts`);
      const { data: testContacts, error: tcErr } = await supabase
        .from("test_contacts")
        .select("*");
      if (tcErr) return json({ error: `test_contacts query failed: ${tcErr.message}` }, 500);
      listings = (testContacts ?? []).map((tc: any) => ({
        id: tc.id,
        formattedAddress: `${tc.listing_address}, ${tc.city}, ${tc.state}`,
        addressLine1: tc.listing_address,
        city: tc.city,
        state: tc.state,
        zipCode: tc.zip,
        price: tc.price,
        listingType: tc.listing_type,
        propertyType: tc.property_type,
        listedDate: tc.listed_date,
        bedrooms: tc.beds,
        bathrooms: tc.baths,
        squareFootage: tc.sqft,
        yearBuilt: tc.year_built,
        photos: tc.photo_url ? [tc.photo_url] : [],
        brokerage: tc.brokerage,
        mlsNumber: tc.mls_number,
        daysOnMarket: tc.days_on_market,
        listingAgent: {
          email: tc.agent_email,
          name: tc.agent_name,
          phone: tc.agent_phone ?? "",
          office: tc.brokerage ?? "",
        },
        listingOffice: { name: tc.office_name ?? "" },
      }));
      console.log(`[send-campaign-emails] Test mode: ${listings.length} test contacts loaded`);
    } else {
      try {
        listings = (await fetchListings(criteria)) as any[];
        console.log(`[send-campaign-emails] Fetched ${listings.length} listings for campaign ${campaign_id}`);
      } catch (e: any) {
        return json({ error: `RentCast error: ${e.message}` }, 502);
      }
    }

    if (listings.length === 0) {
      return json({ queued: 0, details: "No listings matched search criteria" });
    }

    // 5. Extract unique agents with emails
    const seenEmails = new Set<string>();
    const agents: Array<{
      email: string; name: string; phone: string; listingId: string;
      address: string; city: string; state: string; zip: string;
      price: number; listingType: string; propertyType: string; listedDate: string;
      beds: number | null; baths: number | null; sqft: number | null;
      yearBuilt: number | null; photoUrl: string | null;
      brokerage: string; mlsNumber: string; daysOnMarket: number | null;
    }> = [];

    for (const l of listings) {
      const email = (l.listingAgent?.email ?? "").toLowerCase().trim();
      if (!email || !email.includes("@") || seenEmails.has(email)) continue;
      seenEmails.add(email);
      agents.push({
        email,
        name: l.listingAgent?.name ?? "",
        phone: l.listingAgent?.phone ?? "",
        listingId: l.id ?? l.formattedAddress ?? "",
        address: l.addressLine1 ?? l.formattedAddress ?? "",
        city: l.city ?? "",
        state: l.state ?? "",
        zip: l.zipCode ?? l.zip ?? "",
        price: l.price ?? 0,
        listingType: l.listingType ?? "",
        propertyType: l.propertyType ?? "",
        listedDate: l.listedDate ? new Date(l.listedDate).toLocaleDateString("en-US") : "",
        beds: l.bedrooms ?? l.beds ?? null,
        baths: l.bathrooms ?? l.baths ?? null,
        sqft: l.squareFootage ?? l.sqft ?? null,
        yearBuilt: l.yearBuilt ?? null,
        photoUrl: Array.isArray(l.photos) && l.photos.length > 0 ? l.photos[0] : (l.photo_url ?? null),
        brokerage: l.listingAgent?.office ?? l.listingOffice?.name ?? l.brokerage ?? "",
        mlsNumber: l.mlsNumber ?? l.mls_number ?? "",
        daysOnMarket: l.daysOnMarket ?? l.days_on_market ?? null,
      });
    }

    if (agents.length === 0) {
      return json({ queued: 0, details: "No agents with email addresses found in listings" });
    }

    // 6. Load suppressions for this user
    const { data: suppressions } = await supabase
      .from("user_suppressions")
      .select("agent_email")
      .eq("user_id", campaign.user_id);

    const suppressedEmails = new Set(
      (suppressions ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 7. Load today's sends for dedup
    const { data: todaySends } = await supabase
      .from("campaign_sends")
      .select("agent_email")
      .eq("campaign_id", campaign_id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const alreadySentToday = new Set(
      (todaySends ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 8. Build filtered queue
    const queue = agents.filter((a) => {
      if (suppressedEmails.has(a.email)) {
        console.log(`[send-campaign-emails] Skipping suppressed: ${a.email}`);
        return false;
      }
      if (alreadySentToday.has(a.email)) {
        console.log(`[send-campaign-emails] Skipping already sent today: ${a.email}`);
        return false;
      }
      return true;
    });

    console.log(`[send-campaign-emails] Queue: ${queue.length} agents after suppression + dedup filter`);

    if (queue.length === 0) {
      return json({ queued: 0, details: "All agents already contacted today or suppressed" });
    }

    // 9. Enqueue — schedule each email spaced by drip_delay_minutes
    const dripDelayMs = (campaign.drip_delay_minutes ?? 2) * 60 * 1000;
    let queued = 0;
    const firstSendAt = new Date(Date.now()).toISOString();

    for (let i = 0; i < queue.length; i++) {
      const agent = queue[i];

      const vars: Record<string, string> = {
        agent_name: agent.name || "there",
        address: agent.address,
        city: agent.city,
        price: agent.price ? `$${agent.price.toLocaleString()}` : "",
        listing_date: agent.listedDate,
      };

      const subject = interpolate(campaign.subject, vars);
      const bodyText = interpolate(campaign.body, vars);
      const unsubUrl = buildUnsubUrl(
        campaign.user_id,
        campaign_id,
        agent.email,
        campaign.unsub_type === "custom" ? campaign.custom_unsub_url : undefined
      );
      const { bodyHtml, bodyTextWithUnsub } = renderEmail(bodyText, unsubUrl, mailingAddress);

      // Insert campaign_sends record
      const { data: sendRecord, error: insertErr } = await supabase
        .from("campaign_sends")
        .insert({
          campaign_id,
          user_id: campaign.user_id,
          agent_email: agent.email,
          agent_name: agent.name,
          agent_phone: agent.phone,
          listing_id: agent.listingId,
          listing_address: agent.address,
          listing_city: agent.city,
          listing_state: agent.state,
          listing_price: agent.price || null,
          listing_type: agent.listingType,
          listing_beds: agent.beds,
          listing_baths: agent.baths,
          listing_sqft: agent.sqft,
          listing_year_built: agent.yearBuilt,
          listing_zip: agent.zip || null,
          listing_property_type: agent.propertyType || null,
          listing_photo_url: agent.photoUrl,
          listing_brokerage: agent.brokerage || null,
          listing_mls_number: agent.mlsNumber || null,
          listing_days_on_market: agent.daysOnMarket,
          status: "queued",
          channel: "email",
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          console.log(`[send-campaign-emails] Dedup constraint hit for ${agent.email}, skipping`);
          continue;
        }
        console.error(`[send-campaign-emails] Insert error for ${agent.email}:`, insertErr.message);
        continue;
      }

      const scheduledAt = new Date(Date.now() + i * dripDelayMs).toISOString();

      const { error: qErr } = await supabase.from("email_queue").insert({
        campaign_id,
        send_id: sendRecord.id,
        user_id: campaign.user_id,
        to_email: agent.email,
        from_name: fromName,
        reply_to: replyTo,
        subject,
        body_html: bodyHtml,
        body_text: bodyTextWithUnsub,
        scheduled_at: scheduledAt,
        stripe_period_end: stripePeriodEnd,
        plan_type: planType,
      });

      if (qErr) {
        console.error(`[send-campaign-emails] Queue insert error for ${agent.email}:`, qErr.message);
        continue;
      }

      queued++;
    }

    console.log(`[send-campaign-emails] Queued ${queued} emails for campaign ${campaign_id}, first send at ${firstSendAt}`);
    return json({ queued, first_send_at: firstSendAt });

  } catch (err: any) {
    console.error("[send-campaign-emails] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
