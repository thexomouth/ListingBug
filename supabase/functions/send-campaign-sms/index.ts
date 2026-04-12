/**
 * send-campaign-sms
 * Foundation for SMS campaign sending — intentionally minimal.
 * Sends and logs. Reply forwarding and full threading are future iterations.
 *
 * Called by send-campaign-emails when channel = 'sms', or directly.
 * Body: { campaign_id: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

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

async function sendSms(params: {
  to: string;
  from: string;
  body: string;
}): Promise<{ ok: boolean; sid: string | null; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: false, sid: null, error: "Twilio credentials not configured" };
  }

  const formBody = new URLSearchParams({
    To: params.to,
    From: params.from,
    Body: params.body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, sid: data.sid ?? null };
  return { ok: false, sid: null, error: data.message ?? `HTTP ${res.status}` };
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

    const { campaign_id } = body;
    if (!campaign_id) return json({ error: "campaign_id is required" }, 400);

    // Load campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (!campaign) return json({ error: "Campaign not found" }, 404);

    // Load SMS config
    const { data: smsConfig } = await supabase
      .from("campaign_sms_config")
      .select("*")
      .eq("campaign_id", campaign_id)
      .maybeSingle();

    const fromNumber = smsConfig?.twilio_from_number;
    if (!fromNumber) return json({ error: "No Twilio from number configured for this campaign" }, 400);

    // Load search criteria
    const { data: criteria } = await supabase
      .from("campaign_search_criteria")
      .select("*")
      .eq("campaign_id", campaign_id)
      .single();
    if (!criteria) return json({ error: "Campaign search criteria not found" }, 404);

    // Load suppressions
    const { data: suppressions } = await supabase
      .from("user_suppressions")
      .select("agent_phone")
      .eq("user_id", campaign.user_id)
      .not("agent_phone", "is", null);

    const suppressedPhones = new Set(
      (suppressions ?? []).map((s: any) => s.agent_phone?.trim()).filter(Boolean)
    );

    // NOTE: RentCast fetch is omitted here — send-campaign-emails handles the listing
    // fetch and passes agent data. For direct SMS campaign sends, extend this function
    // to call fetchListings (same pattern as send-campaign-emails) in a future iteration.
    // For now this function processes a pre-built queue passed in the request body.
    const agentQueue: Array<{ phone: string; name: string; email: string; address: string; city: string; price: number; listedDate: string; listingId: string; listingType: string; listingState: string }> = body.agents ?? [];

    if (agentQueue.length === 0) {
      return json({ sms_sent: 0, details: "No agents in queue" });
    }

    let smsSent = 0;

    for (const agent of agentQueue) {
      if (!agent.phone || suppressedPhones.has(agent.phone)) continue;

      const vars: Record<string, string> = {
        agent_name: agent.name || "there",
        address: agent.address,
        city: agent.city,
        price: agent.price ? `$${agent.price.toLocaleString()}` : "",
        listing_date: agent.listedDate,
      };

      const messageBody = interpolate(campaign.body, vars);

      const { data: sendRecord } = await supabase
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
          listing_state: agent.listingState,
          listing_price: agent.price || null,
          listing_type: agent.listingType,
          status: "queued",
          channel: "sms",
        })
        .select("id")
        .single();

      if (!sendRecord) continue;

      const result = await sendSms({ to: agent.phone, from: fromNumber, body: messageBody });
      const now = new Date().toISOString();

      if (result.ok) {
        await supabase
          .from("campaign_sends")
          .update({ status: "sent", sent_at: now, twilio_message_sid: result.sid })
          .eq("id", sendRecord.id);
        smsSent++;
      } else {
        await supabase
          .from("campaign_sends")
          .update({ status: "failed" })
          .eq("id", sendRecord.id);
        console.error(`[send-campaign-sms] Failed to send to ${agent.phone}: ${result.error}`);
      }
    }

    return json({ sms_sent: smsSent });
  } catch (err: any) {
    console.error("[send-campaign-sms] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
