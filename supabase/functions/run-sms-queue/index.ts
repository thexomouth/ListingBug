/**
 * run-sms-queue
 * Cron function — fires every minute.
 * Sends all sms_queue rows where scheduled_at <= now() and status = 'pending'.
 * Updates campaign_sends with Telnyx message SID and status.
 * Cleans up sent/failed rows older than 24 hours.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELNYX_API_KEY       = Deno.env.get("TELNYX_API_KEY") ?? "";
const FROM_NUMBER          = Deno.env.get("TELNYX_FROM_NUMBER") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendSms(to: string, body: string): Promise<{ ok: boolean; messageId: string | null; error?: string }> {
  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_NUMBER, to, text: body }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, messageId: null, error: data?.errors?.[0]?.detail ?? `HTTP ${res.status}` };
    return { ok: true, messageId: data?.data?.id ?? null };
  } catch (e: any) {
    return { ok: false, messageId: null, error: e.message };
  }
}

// NOTE: This function uses SERVICE_ROLE_KEY and does NOT require JWT verification.
// Called by pg_cron every minute to drain the SMS queue.
// JWT verification can be disabled in Supabase Edge Function settings.
serve(async (req) => {
  try {
    // Use service role key for all database operations
    // This bypasses RLS and does not require user JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date().toISOString();

    // Fetch due messages — capped at 6 (rate limit: 6/min).
    // scheduled_at <= now ensures we don't pull future slots early.
    const { data: due, error: fetchErr } = await supabase
      .from("sms_queue")
      .select("id, send_id, user_id, campaign_id, to_phone, body, stripe_period_end, plan_type")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(6);

    // Early exit — nothing to do, keep invocation cost minimal
    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!due || due.length === 0) return json({ sent: 0 });

    console.log(`[run-sms-queue] ${due.length} messages due`);
    let sent = 0;

    for (const row of due) {
      // Mark as sending to prevent double-processing on concurrent invocations
      const { error: lockErr } = await supabase
        .from("sms_queue")
        .update({ status: "sending" })
        .eq("id", row.id)
        .eq("status", "pending"); // only update if still pending

      if (lockErr) {
        console.error(`[run-sms-queue] Lock error for ${row.id}:`, lockErr.message);
        continue;
      }

      const result = await sendSms(row.to_phone, row.body);
      const sentAt = new Date().toISOString();

      if (result.ok) {
        // Update queue row
        await supabase.from("sms_queue")
          .update({ status: "sent", sent_at: sentAt })
          .eq("id", row.id);

        // Update campaign_send
        await supabase.from("campaign_sends")
          .update({ status: "sent", sent_at: sentAt, twilio_message_sid: result.messageId })
          .eq("id", row.send_id);

        // Write usage log
        await supabase.from("usage_logs").insert({
          user_id:           row.user_id,
          campaign_id:       row.campaign_id,
          send_id:           row.send_id,
          channel:           "sms",
          stripe_period_end: row.stripe_period_end,
          plan_type:         row.plan_type,
        });

        sent++;
        console.log(`[run-sms-queue] Sent to ${row.to_phone} — SID: ${result.messageId}`);
      } else {
        await supabase.from("sms_queue")
          .update({ status: "failed", error_message: result.error })
          .eq("id", row.id);

        await supabase.from("campaign_sends")
          .update({ status: "failed", error_message: result.error ?? "Unknown error" })
          .eq("id", row.send_id);

        console.error(`[run-sms-queue] Failed to send to ${row.to_phone}: ${result.error}`);
      }
    }

    // Clean up sent/failed rows older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("sms_queue")
      .delete()
      .in("status", ["sent", "failed"])
      .lt("created_at", cutoff);

    console.log(`[run-sms-queue] Complete — ${sent}/${due.length} sent`);
    return json({ sent, total: due.length });

  } catch (err: any) {
    console.error("[run-sms-queue] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
