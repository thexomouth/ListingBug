/**
 * send-campaign-sms
 * Enqueues SMS messages for a campaign into sms_queue.
 * Does NOT send directly — run-sms-queue drips sends at 1 per 10s (6/min rate limit).
 *
 * Flow:
 *  1. Load campaign + search criteria + user
 *  2. Fetch agents (test_contacts if city='test', else RentCast)
 *  3. Filter suppressions + dedup
 *  4. Insert campaign_sends (status: queued) for each agent
 *  5. Find current queue tail, assign scheduled_at slots 10s apart
 *  6. Insert into sms_queue
 *  7. Return { queued: N, first_send_at }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RENTCAST_API_KEY     = Deno.env.get("RENTCAST_API_KEY") ?? "";
const FROM_NUMBER          = Deno.env.get("TELNYX_FROM_NUMBER") ?? "";

const DRIP_INTERVAL_MS = 10_000; // 10 seconds = 6/min

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

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// ---------------------------------------------------------------------------
// RentCast fetch (mirrored from send-campaign-emails)
// ---------------------------------------------------------------------------
async function fetchListings(criteria: Record<string, unknown>): Promise<unknown[]> {
  const {
    listing_type = "sale", city, state, property_type,
    active_status = "Active", days_old, price_min, price_max,
    beds_min, baths_min, year_built_min, year_built_max,
  } = criteria;

  const endpoint = listing_type === "rental"
    ? "https://api.rentcast.io/v1/listings/rental/long-term"
    : "https://api.rentcast.io/v1/listings/sale";

  const params = new URLSearchParams();
  if (city)  params.set("city", String(city));
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

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`RentCast ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
// NOTE: This function uses SERVICE_ROLE_KEY and does NOT require JWT verification.
// It can be called from:
// - Frontend (user-initiated campaign creation)
// - send-campaign-emails function (when channel is SMS)
// - Cron jobs (scheduled campaigns)
// JWT verification can be disabled in Supabase Edge Function settings.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Use service role key for all database operations
    // This bypasses RLS and does not require user JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    const { campaign_id } = body;
    if (!campaign_id) return json({ error: "campaign_id is required" }, 400);

    // 1. Load campaign
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (campErr || !campaign) return json({ error: "Campaign not found" }, 404);
    if (campaign.channel !== "sms") return json({ error: "Campaign channel is not sms" }, 400);

    // 2. Load search criteria
    const { data: criteria } = await supabase
      .from("campaign_search_criteria")
      .select("*")
      .eq("campaign_id", campaign_id)
      .single();
    if (!criteria) return json({ error: "Campaign search criteria not found" }, 404);

    // 3. Load user
    const { data: user } = await supabase
      .from("users")
      .select("id, stripe_subscription_end, plan")
      .eq("id", campaign.user_id)
      .single();
    if (!user) return json({ error: "User not found" }, 404);

    const stripePeriodEnd: string = user.stripe_subscription_end
      ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const planType: string = user.plan ?? "trial";

    // 4. Fetch agents
    const isTestMode = criteria.city?.toString().toLowerCase() === "test";
    let agents: Array<{
      phone: string; name: string; email: string;
      listingId: string; address: string; city: string; state: string;
      price: number; listingType: string; listedDate: string;
    }> = [];

    if (isTestMode) {
      const { data: contacts } = await supabase.from("test_contacts").select("*");
      agents = (contacts ?? [])
        .filter((c: any) => c.agent_phone)
        .map((c: any) => ({
          phone:       c.agent_phone,
          name:        c.agent_name ?? "",
          email:       c.agent_email ?? "",
          listingId:   c.id,
          address:     c.listing_address ?? "",
          city:        c.city ?? "",
          state:       c.state ?? "",
          price:       c.price ?? 0,
          listingType: c.listing_type ?? "",
          listedDate:  c.listed_date
            ? new Date(c.listed_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
        }));
    } else {
      const listings = await fetchListings(criteria);
      const seenPhones = new Set<string>();
      for (const l: any of listings) {
        const phone = l.listingAgent?.phone?.replace(/\D/g, "");
        if (!phone || phone.length < 10 || seenPhones.has(phone)) continue;
        seenPhones.add(phone);
        agents.push({
          phone:       `+1${phone.slice(-10)}`,
          name:        l.listingAgent?.name ?? "",
          email:       l.listingAgent?.email ?? "",
          listingId:   l.id ?? l.formattedAddress ?? "",
          address:     l.addressLine1 ?? l.formattedAddress ?? "",
          city:        l.city ?? "",
          state:       l.state ?? "",
          price:       l.price ?? 0,
          listingType: l.listingType ?? "",
          listedDate:  l.listedDate
            ? new Date(l.listedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
        });
      }
    }

    if (agents.length === 0) return json({ queued: 0, details: "No agents with phone numbers found" });

    // 5. Load suppressions
    const { data: suppressions } = await supabase
      .from("user_suppressions")
      .select("agent_phone")
      .eq("user_id", campaign.user_id)
      .not("agent_phone", "is", null);

    const suppressedPhones = new Set(
      (suppressions ?? []).map((s: any) => s.agent_phone?.trim()).filter(Boolean)
    );

    // 6. Load today's sends for dedup
    const { data: todaySends } = await supabase
      .from("campaign_sends")
      .select("agent_phone")
      .eq("campaign_id", campaign_id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const alreadySentToday = new Set(
      (todaySends ?? []).map((s: any) => s.agent_phone?.trim()).filter(Boolean)
    );

    const queue = agents.filter(a => {
      if (suppressedPhones.has(a.phone)) return false;
      if (alreadySentToday.has(a.phone)) return false;
      return true;
    });

    if (queue.length === 0) return json({ queued: 0, details: "All agents already contacted today or suppressed" });

    // 7. Find current queue tail to schedule after existing pending messages
    const { data: tailRow } = await supabase
      .from("sms_queue")
      .select("scheduled_at")
      .eq("status", "pending")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tailTime = tailRow?.scheduled_at
      ? new Date(tailRow.scheduled_at).getTime()
      : Date.now();

    // Start 10s after the current tail (or now if queue is empty)
    let nextSlot = Math.max(tailTime + DRIP_INTERVAL_MS, Date.now() + DRIP_INTERVAL_MS);

    // 8. Insert campaign_sends + sms_queue entries
    let queued = 0;
    const firstSendAt = new Date(nextSlot).toISOString();

    for (const agent of queue) {
      const vars: Record<string, string> = {
        agent_name:   agent.name || "there",
        address:      agent.address,
        city:         agent.city,
        price:        agent.price ? `$${agent.price.toLocaleString()}` : "",
        listing_date: agent.listedDate,
      };
      const messageBody = interpolate(campaign.body, vars);

      // Insert campaign_send record
      const { data: sendRecord, error: insertErr } = await supabase
        .from("campaign_sends")
        .insert({
          campaign_id,
          user_id:         campaign.user_id,
          agent_email:     agent.email,
          agent_name:      agent.name,
          agent_phone:     agent.phone,
          listing_id:      agent.listingId,
          listing_address: agent.address,
          listing_city:    agent.city,
          listing_state:   agent.state,
          listing_price:   agent.price || null,
          listing_type:    agent.listingType,
          status:          "queued",
          channel:         "sms",
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") continue; // dedup constraint
        console.error(`[send-campaign-sms] Insert error for ${agent.phone}:`, insertErr.message);
        continue;
      }

      // Insert into shared queue
      const { error: qErr } = await supabase.from("sms_queue").insert({
        campaign_id,
        send_id:           sendRecord.id,
        user_id:           campaign.user_id,
        to_phone:          agent.phone,
        body:              messageBody,
        scheduled_at:      new Date(nextSlot).toISOString(),
        stripe_period_end: stripePeriodEnd,
        plan_type:         planType,
      });

      if (qErr) {
        console.error(`[send-campaign-sms] Queue insert error for ${agent.phone}:`, qErr.message);
        continue;
      }

      nextSlot += DRIP_INTERVAL_MS;
      queued++;
    }

    console.log(`[send-campaign-sms] Queued ${queued} messages for campaign ${campaign_id}, first send at ${firstSendAt}`);
    return json({ queued, first_send_at: firstSendAt });

  } catch (err: any) {
    console.error("[send-campaign-sms] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
