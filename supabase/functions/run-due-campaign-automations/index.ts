/**
 * run-due-campaign-automations
 * Cron function — finds all active campaign_automations where next_run_at <= now()
 * and invokes run-campaign-automation for each.
 *
 * Schedule this the same way as run-due-automations (e.g. every hour via pg_cron
 * or a Supabase scheduled function).
 *
 * verify_jwt = false
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const now = new Date().toISOString();

    // Find all active campaign_automations that are due
    const { data: due, error } = await supabase
      .from("campaign_automations")
      .select("id, name")
      .eq("active", true)
      .lte("next_run_at", now)
      .not("next_run_at", "is", null);

    if (error) {
      console.error("[run-due-campaign-automations] query error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!due || due.length === 0) {
      console.log("[run-due-campaign-automations] no automations due");
      return new Response(JSON.stringify({ ran: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    console.log(`[run-due-campaign-automations] running ${due.length} automation(s)`);

    const results: Array<{ id: string; name: string; ok: boolean; error?: string }> = [];

    for (const auto of due) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/run-campaign-automation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ automation_id: auto.id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error(`[run-due-campaign-automations] automation ${auto.id} failed:`, body);
          results.push({ id: auto.id, name: auto.name, ok: false, error: body.error ?? `HTTP ${res.status}` });
        } else {
          console.log(`[run-due-campaign-automations] automation ${auto.id} ok:`, body);
          results.push({ id: auto.id, name: auto.name, ok: true });
        }
      } catch (e: any) {
        console.error(`[run-due-campaign-automations] automation ${auto.id} exception:`, e?.message);
        results.push({ id: auto.id, name: auto.name, ok: false, error: e?.message });
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed    = results.filter((r) => !r.ok).length;

    return new Response(
      JSON.stringify({ ran: due.length, succeeded, failed, results }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[run-due-campaign-automations] unhandled error:", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
