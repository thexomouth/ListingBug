/**
 * run-campaign-schedule
 * verify_jwt = false — triggered by Supabase cron at 14:00 UTC (6:00 AM PST) daily
 *
 * Queries all active campaigns and calls send-campaign-emails for each.
 * Entirely separate from run-due-automations — never merge these.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Load all active campaigns
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("id, campaign_name, channel, user_id")
      .eq("status", "active");

    if (error) return json({ error: error.message }, 500);
    if (!campaigns || campaigns.length === 0) {
      return json({ processed: 0, reason: "No active campaigns" });
    }

    console.log(`[run-campaign-schedule] Processing ${campaigns.length} active campaign(s)`);

    const summary: Array<{ campaign_id: string; campaign_name: string; result: unknown }> = [];

    for (const campaign of campaigns) {
      const fnName = campaign.channel === "sms" ? "send-campaign-sms" : "send-campaign-emails";

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ campaign_id: campaign.id }),
        });

        const result = await res.json().catch(() => ({}));
        console.log(`[run-campaign-schedule] Campaign "${campaign.campaign_name}": ${JSON.stringify(result)}`);
        summary.push({ campaign_id: campaign.id, campaign_name: campaign.campaign_name, result });
      } catch (e: any) {
        console.error(`[run-campaign-schedule] Error for campaign ${campaign.id}:`, e.message);
        summary.push({ campaign_id: campaign.id, campaign_name: campaign.campaign_name, result: { error: e.message } });
      }
    }

    return json({ ok: true, processed: campaigns.length, summary });
  } catch (err: any) {
    console.error("[run-campaign-schedule] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
