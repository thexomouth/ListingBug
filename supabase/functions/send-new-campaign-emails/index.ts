/**
 * send-new-campaign-emails
 * Called only on new campaign creation from the front end.
 * Receives the listings array already fetched by fetch-listings-preview,
 * so no second RentCast call is needed.
 * Body: { campaign_id: string, listings: unknown[] }
 *
 * Flow:
 *  1. Load campaign, search criteria, and user record
 *  2. Use the provided listings array (no RentCast call)
 *  3. Extract agents with email addresses
 *  4. Check user_suppressions — skip suppressed agents
 *  5. Check campaign_sends dedup index — skip if already sent today
 *  6. Render subject/body/unsub URL for each agent
 *  7. Insert campaign_sends (status: queued) + email_queue rows
 *  8. Return { queued: N, first_send_at }
 *
 * Daily cron sends use send-campaign-emails (unchanged).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

function isHtmlBody(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}

function interpolate(template: string, vars: Record<string, string>): string {
  // Replace merge tag chip spans first: <span data-merge-tag="{{var}}" ...>Label</span>
  let result = template.replace(
    /<span[^>]*data-merge-tag="?\{\{(\w+)\}\}"?[^>]*>[^<]*<\/span>/g,
    (_, key) => vars[key] ?? ""
  );
  // Then replace any raw {{}} tokens (legacy or subject line)
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
  return result;
}

function buildUnsubUrl(userId: string, campaignId: string, agentEmail: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  const encoded = encodeURIComponent(agentEmail);
  return `https://thelistingbug.com/unsubscribe/${userId}/${campaignId}?email=${encoded}`;
}

function applyInline(text: string): string {
  return text
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline">${t}</a>`
    );
}

function convertMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const raw of lines) {
    const isBullet = raw.startsWith("- ");
    const isOrdered = /^\d+\.\s/.test(raw);

    if (!isBullet && inUl) { out.push("</ul>"); inUl = false; }
    if (!isOrdered && inOl) { out.push("</ol>"); inOl = false; }

    if (raw === "---") {
      out.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:1em 0">');
      continue;
    }
    if (raw.startsWith("# ")) {
      out.push(`<h1 style="font-size:1.5em;font-weight:700;margin:0.5em 0;line-height:1.2">${applyInline(raw.slice(2))}</h1>`);
      continue;
    }
    if (raw.startsWith("## ")) {
      out.push(`<h2 style="font-size:1.2em;font-weight:700;margin:0.5em 0;line-height:1.2">${applyInline(raw.slice(3))}</h2>`);
      continue;
    }
    if (raw.startsWith("&gt; ")) {
      out.push(`<blockquote style="border-left:3px solid #d1d5db;margin:0.5em 0;padding:0.25em 0.75em;color:#6b7280">${applyInline(raw.slice(5))}</blockquote>`);
      continue;
    }
    if (raw.startsWith("[center]") && raw.includes("[/center]")) {
      const inner = raw.slice(8, raw.indexOf("[/center]"));
      out.push(`<div style="text-align:center">${applyInline(inner)}</div>`);
      continue;
    }
    if (isBullet) {
      if (!inUl) { out.push('<ul style="margin:0.5em 0;padding-left:1.5em">'); inUl = true; }
      out.push(`<li>${applyInline(raw.slice(2))}</li>`);
      continue;
    }
    if (isOrdered) {
      if (!inOl) { out.push('<ol style="margin:0.5em 0;padding-left:1.5em">'); inOl = true; }
      out.push(`<li>${applyInline(raw.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }
    if (raw === "") {
      out.push("<br>");
      continue;
    }
    out.push(applyInline(raw) + "<br>");
  }

  if (inUl) out.push("</ul>");
  if (inOl) out.push("</ol>");

  return out.join("");
}

// ---------------------------------------------------------------------------
// Click-tracking link wrapping
// ---------------------------------------------------------------------------
const CLICK_TRACKING_BASE = Deno.env.get("CLICK_TRACKING_BASE") ?? "https://click.thelistingbug.com/r";

function b64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function wrapLinksForTracking(html: string, sendId: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (match, url) => {
      if (
        url.includes("thelistingbug.com/unsubscribe") ||
        url.includes("click.thelistingbug.com")
      ) {
        return match;
      }
      return `href="${CLICK_TRACKING_BASE}?s=${sendId}&u=${b64urlEncode(url)}"`;
    }
  );
}

function renderEmail(
  bodyContent: string,
  unsubUrl: string,
  mailingAddress: string
): { bodyHtml: string; bodyTextWithUnsub: string } {
  const bodyHtmlContent = isHtmlBody(bodyContent)
    ? bodyContent
    : convertMarkdown(bodyContent);

  const footerAddress = mailingAddress
    ? `<br>${mailingAddress.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}`
    : "";

  const bodyHtml = `<div style="font-size:15px;line-height:1.6;max-width:580px;color:#222">${bodyHtmlContent}<p style="margin-top:2em;font-size:12px;color:#999"><a href="${unsubUrl}" style="color:#999">Unsubscribe</a>${footerAddress}</p></div>`;

  const bodyTextPlain = bodyContent.replace(/<[^>]*>/g, "").trim();
  const bodyTextWithUnsub = mailingAddress
    ? `${bodyTextPlain}\n\nUnsubscribe: ${unsubUrl}\n${mailingAddress}`
    : `${bodyTextPlain}\n\nUnsubscribe: ${unsubUrl}`;

  return { bodyHtml, bodyTextWithUnsub };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { campaign_id, listings: rawListings } = body;
    if (!campaign_id) return json({ error: "campaign_id is required" }, 400);
    if (!Array.isArray(rawListings) || rawListings.length === 0) {
      return json({ error: "listings array is required and must be non-empty" }, 400);
    }

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

    // 2. Load user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, business_name, contact_name, forward_to, stripe_subscription_end, plan, mailing_address")
      .eq("id", campaign.user_id)
      .single();

    if (userErr || !user) return json({ error: "User not found" }, 404);

    const replyTo = campaign.forward_to || user.forward_to || user.email;
    const fromName = user.business_name || user.contact_name || 'ListingBug';
    const stripePeriodEnd = user.stripe_subscription_end
      ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const planType: string = user.plan ?? "trial";
    const mailingAddress: string = user.mailing_address ?? "";

    console.log(`[send-new-campaign-emails] Using ${rawListings.length} pre-fetched listings for campaign ${campaign_id}`);

    // 3. Extract unique agents with emails from the provided listings
    const seenEmails = new Set<string>();
    const agents: Array<{
      email: string; name: string; phone: string; listingId: string;
      address: string; city: string; state: string; zip: string;
      price: number; listingType: string; propertyType: string; listedDate: string;
      beds: number | null; baths: number | null; sqft: number | null;
      yearBuilt: number | null; photoUrl: string | null;
      brokerage: string; mlsNumber: string; daysOnMarket: number | null;
    }> = [];

    for (const l of rawListings as any[]) {
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

    // 4. Load suppressions
    const { data: suppressions } = await supabase
      .from("user_suppressions")
      .select("agent_email")
      .eq("user_id", campaign.user_id);

    const suppressedEmails = new Set(
      (suppressions ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 5. Load today's sends for dedup
    const { data: todaySends } = await supabase
      .from("campaign_sends")
      .select("agent_email")
      .eq("campaign_id", campaign_id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const alreadySentToday = new Set(
      (todaySends ?? []).map((s: any) => s.agent_email?.toLowerCase().trim()).filter(Boolean)
    );

    // 6. Build filtered queue
    const queue = agents.filter((a) => {
      if (suppressedEmails.has(a.email)) {
        console.log(`[send-new-campaign-emails] Skipping suppressed: ${a.email}`);
        return false;
      }
      if (alreadySentToday.has(a.email)) {
        console.log(`[send-new-campaign-emails] Skipping already sent today: ${a.email}`);
        return false;
      }
      return true;
    });

    console.log(`[send-new-campaign-emails] Queue: ${queue.length} agents after suppression + dedup filter`);

    if (queue.length === 0) {
      return json({ queued: 0, details: "All agents already contacted today or suppressed" });
    }

    // 7. Enqueue with randomized human-like delays
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
          console.log(`[send-new-campaign-emails] Dedup constraint hit for ${agent.email}, skipping`);
          continue;
        }
        console.error(`[send-new-campaign-emails] Insert error for ${agent.email}:`, insertErr.message);
        continue;
      }

      const baseDripMinutes = 2 + Math.random() * 3;
      const jitterMinutes = Math.random() * 3;
      const totalDelayMs = (i * baseDripMinutes * 60 * 1000) + (jitterMinutes * 60 * 1000);
      const scheduledAt = new Date(Date.now() + totalDelayMs).toISOString();

      const { error: qErr } = await supabase.from("email_queue").insert({
        campaign_id,
        send_id: sendRecord.id,
        user_id: campaign.user_id,
        sender_id: campaign.sender_id || null,
        user_drip_position: i,
        to_email: agent.email,
        from_name: fromName,
        reply_to: replyTo,
        subject,
        body_html: wrapLinksForTracking(bodyHtml, sendRecord.id),
        body_text: bodyTextWithUnsub,
        scheduled_at: scheduledAt,
        stripe_period_end: stripePeriodEnd,
        plan_type: planType,
      });

      if (qErr) {
        console.error(`[send-new-campaign-emails] Queue insert error for ${agent.email}:`, qErr.message);
        continue;
      }

      queued++;
    }

    console.log(`[send-new-campaign-emails] Queued ${queued} emails for campaign ${campaign_id}, first send at ${firstSendAt}`);
    return json({ queued, first_send_at: firstSendAt });

  } catch (err: any) {
    console.error("[send-new-campaign-emails] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
