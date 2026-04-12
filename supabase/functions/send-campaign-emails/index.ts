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
 *  6. Send via drip — respect drip_delay_minutes between each send
 *  7. For each send: interpolate variables, send via SendGrid (listingping.com), store Message-ID, write send record
 *  8. Write to usage_logs with stripe_period_end
 *  9. Return { emails_sent: N }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY") ?? "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const SENDGRID_API = "https://api.sendgrid.com/v3/mail/send";
const FROM_EMAIL = "outreach@listingping.com";

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// RentCast listing fetch — adapted from run-automation
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

  // yearBuilt: format as "YYYY-YYYY" for RentCast if either bound is set
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

function buildUnsubUrl(userId: string, agentEmail: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  const encoded = encodeURIComponent(agentEmail);
  return `https://thelistingbug.com/unsubscribe?user=${userId}&email=${encoded}`;
}

// ---------------------------------------------------------------------------
// SendGrid send — adapted from run-drip
// ---------------------------------------------------------------------------
async function sendEmail(params: {
  toEmail: string;
  toName: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  replyTo: string;
}): Promise<{ ok: boolean; messageId: string | null; error?: string }> {
  const payload = {
    personalizations: [{ to: [{ email: params.toEmail, name: params.toName }] }],
    from: { email: FROM_EMAIL, name: params.fromName },
    reply_to: { email: params.replyTo },
    subject: params.subject,
    content: [
      { type: "text/plain", value: params.bodyText },
      { type: "text/html", value: params.bodyHtml },
    ],
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true },
    },
  };

  const res = await fetch(SENDGRID_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok || res.status === 202) {
    const messageId = res.headers.get("X-Message-Id") ?? null;
    return { ok: true, messageId };
  }

  const errData = await res.json().catch(() => ({}));
  const errMsg = errData?.errors?.[0]?.message ?? `HTTP ${res.status}`;
  return { ok: false, messageId: null, error: errMsg };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse body
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
      // Delegate to send-campaign-sms
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
      .select("id, email, business_name, contact_name, forward_to, stripe_subscription_end")
      .eq("id", campaign.user_id)
      .single();

    if (userErr || !user) return json({ error: "User not found" }, 404);

    const replyTo = campaign.forward_to || user.forward_to || user.email;
    const fromName = user.business_name
      ? `${user.business_name}`
      : (user.contact_name || "ListingBug");
    const stripePeriodEnd = user.stripe_subscription_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Fetch listings from RentCast
    let listings: any[] = [];
    try {
      listings = (await fetchListings(criteria)) as any[];
      console.log(`[send-campaign-emails] Fetched ${listings.length} listings for campaign ${campaign_id}`);
    } catch (e: any) {
      return json({ error: `RentCast error: ${e.message}` }, 502);
    }

    if (listings.length === 0) {
      return json({ emails_sent: 0, details: "No listings matched search criteria" });
    }

    // 5. Extract unique agents with emails
    const seenEmails = new Set<string>();
    const agents: Array<{
      email: string;
      name: string;
      phone: string;
      listingId: string;
      address: string;
      city: string;
      state: string;
      price: number;
      listingType: string;
      listedDate: string;
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
        price: l.price ?? 0,
        listingType: l.listingType ?? "",
        listedDate: l.listedDate ? new Date(l.listedDate).toLocaleDateString("en-US") : "",
      });
    }

    if (agents.length === 0) {
      return json({ emails_sent: 0, details: "No agents with email addresses found in listings" });
    }

    // 6. Load suppressions for this user
    const { data: suppressions } = await supabase
      .from("user_suppressions")
      .select("agent_email")
      .eq("user_id", campaign.user_id);

    const suppressedEmails = new Set(
      (suppressions ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 7. Load today's sends for this campaign to handle dedup in memory as fallback
    const { data: todaySends } = await supabase
      .from("campaign_sends")
      .select("agent_email")
      .eq("campaign_id", campaign_id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const alreadySentToday = new Set(
      (todaySends ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 8. Build send queue — filtered
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
      return json({ emails_sent: 0, details: "All agents already contacted today or suppressed" });
    }

    // 9. Drip send
    const delayMs = (campaign.drip_delay_minutes ?? 2) * 60 * 1000;
    let emailsSent = 0;

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
        agent.email,
        campaign.unsub_type === "custom" ? campaign.custom_unsub_url : undefined
      );

      const bodyHtml = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222">${
        bodyText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")
      }<p style="margin-top:2em;font-size:12px;color:#999"><a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p></div>`;

      const bodyTextWithUnsub = `${bodyText}\n\nUnsubscribe: ${unsubUrl}`;

      // Write send record first (queued status)
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
          status: "queued",
          channel: "email",
        })
        .select("id")
        .single();

      // If dedup constraint fires, skip silently
      if (insertErr) {
        if (insertErr.code === "23505") {
          console.log(`[send-campaign-emails] Dedup constraint hit for ${agent.email}, skipping`);
          continue;
        }
        console.error(`[send-campaign-emails] Insert error for ${agent.email}:`, insertErr.message);
        continue;
      }

      const sendId = sendRecord.id;

      // Send via SendGrid
      const result = await sendEmail({
        toEmail: agent.email,
        toName: agent.name,
        fromName,
        subject,
        bodyHtml,
        bodyText: bodyTextWithUnsub,
        replyTo,
      });

      const now = new Date().toISOString();

      if (result.ok) {
        await supabase
          .from("campaign_sends")
          .update({
            status: "sent",
            sent_at: now,
            sendgrid_message_id: result.messageId,
          })
          .eq("id", sendId);

        // Write usage log
        await supabase.from("usage_logs").insert({
          user_id: campaign.user_id,
          campaign_id,
          send_id: sendId,
          channel: "email",
          stripe_period_end: stripePeriodEnd,
        });

        emailsSent++;
        console.log(`[send-campaign-emails] Sent to ${agent.email} (${emailsSent}/${queue.length})`);
      } else {
        await supabase
          .from("campaign_sends")
          .update({ status: "failed" })
          .eq("id", sendId);
        console.error(`[send-campaign-emails] Failed to send to ${agent.email}: ${result.error}`);
      }

      // Drip delay between sends (skip after last)
      if (i < queue.length - 1) {
        await sleep(delayMs);
      }
    }

    console.log(`[send-campaign-emails] Complete — ${emailsSent} sent for campaign ${campaign_id}`);

    return json({ emails_sent: emailsSent, queued: queue.length });
  } catch (err: any) {
    console.error("[send-campaign-emails] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
