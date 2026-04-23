/**
 * run-email-queue
 * Cron function — fires every minute.
 * Sends all email_queue rows where scheduled_at <= now() and status = 'pending'.
 * Updates campaign_sends with Resend message-ID and status.
 * Writes usage_logs on successful send.
 * Cleans up sent/failed rows older than 24 hours.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY       = Deno.env.get("SHARED_MAILBOX_RESEND_API_KEY") ?? "";
const FROM_EMAIL           = "hello@listingping.com";

// Cap per invocation — prevents runaway sends if queue backs up.
// Resend has no per-minute hard cap but 50/invocation keeps each cron tick snappy.
const BATCH_LIMIT = 50;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendEmail(params: {
  toEmail: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  replyTo: string;
}): Promise<{ ok: boolean; messageId: string | null; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:     `${params.fromName} <${FROM_EMAIL}>`,
        to:       [params.toEmail],
        reply_to: params.replyTo,
        subject:  params.subject,
        html:     params.bodyHtml,
        text:     params.bodyText,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, messageId: null, error: data?.message ?? "Resend error" };
    return { ok: true, messageId: data.id ?? null };
  } catch (e: any) {
    return { ok: false, messageId: null, error: e.message };
  }
}

// NOTE: This function uses SERVICE_ROLE_KEY and does NOT require JWT verification.
// Called by pg_cron every minute to drain the email queue.
// JWT verification can be disabled in Supabase Edge Function settings.
serve(async () => {
  try {
    // Use service role key for all database operations
    // This bypasses RLS and does not require user JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date().toISOString();

    // Fetch due messages with sender information
    const { data: due, error: fetchErr } = await supabase
      .from("email_queue")
      .select(`
        id, send_id, user_id, campaign_id, to_email, from_name, reply_to, subject, body_html, body_text, stripe_period_end, plan_type,
        sender:integration_connections!sender_id(
          id,
          integration_id,
          sending_email,
          credentials,
          daily_limit,
          emails_sent_today,
          last_reset_at,
          status
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!due || due.length === 0) return json({ sent: 0 });

    console.log(`[run-email-queue] ${due.length} emails due`);
    let sent = 0;

    for (const row of due) {
      // Check sender daily limit if using OAuth sender
      const sender = (row as any).sender;
      if (sender) {
        // Reset counter if last_reset_at is a previous day
        const lastReset = new Date(sender.last_reset_at || 0);
        const today = new Date();

        if (lastReset.toDateString() !== today.toDateString()) {
          await supabase
            .from('integration_connections')
            .update({
              emails_sent_today: 0,
              last_reset_at: today.toISOString(),
            })
            .eq('id', sender.id);

          sender.emails_sent_today = 0;
        }

        // Check daily limit
        if (sender.emails_sent_today >= sender.daily_limit) {
          console.log(`[run-email-queue] Sender ${sender.id} over daily limit`);
          // Mark email as deferred, will retry tomorrow
          await supabase
            .from('email_queue')
            .update({
              status: 'deferred',
              scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', row.id);
          continue;
        }
      }

      // Optimistic lock — prevents double-send on concurrent invocations
      const { error: lockErr } = await supabase
        .from("email_queue")
        .update({ status: "sending" })
        .eq("id", row.id)
        .eq("status", "pending");

      if (lockErr) {
        console.error(`[run-email-queue] Lock error for ${row.id}:`, lockErr.message);
        continue;
      }

      // Route to appropriate sender
      let result: { ok: boolean; messageId: string | null; error?: string };

      if (sender?.integration_id === 'gmail') {
        try {
          const { data, error } = await supabase.functions.invoke('send-via-gmail', {
            body: { emailQueueId: row.id, senderId: sender.id },
          });
          if (error) throw error;
          result = { ok: true, messageId: data?.messageId || null };
        } catch (err: any) {
          result = { ok: false, messageId: null, error: err.message };
        }
      } else if (sender?.integration_id === 'outlook') {
        try {
          const { data, error } = await supabase.functions.invoke('send-via-outlook', {
            body: { emailQueueId: row.id, senderId: sender.id },
          });
          if (error) throw error;
          result = { ok: true, messageId: data?.messageId || null };
        } catch (err: any) {
          result = { ok: false, messageId: null, error: err.message };
        }
      } else {
        // Fallback to Resend (shared mailbox)
        result = await sendEmail({
          toEmail:  row.to_email,
          fromName: row.from_name,
          subject:  row.subject,
          bodyHtml: row.body_html,
          bodyText: row.body_text,
          replyTo:  row.reply_to,
        });
      }

      const sentAt = new Date().toISOString();

      if (result.ok) {
        await supabase.from("email_queue")
          .update({ status: "sent", sent_at: sentAt })
          .eq("id", row.id);

        await supabase.from("campaign_sends")
          .update({ status: "sent", sent_at: sentAt, sendgrid_message_id: result.messageId })
          .eq("id", row.send_id);

        await supabase.from("usage_logs").insert({
          user_id:           row.user_id,
          campaign_id:       row.campaign_id,
          send_id:           row.send_id,
          channel:           "email",
          stripe_period_end: row.stripe_period_end,
          plan_type:         row.plan_type,
        });

        // Increment sender counter if using OAuth sender
        if (sender) {
          await supabase.rpc('increment_sender_count', { sender_id: sender.id });
        }

        sent++;
        console.log(`[run-email-queue] Sent to ${row.to_email} — ID: ${result.messageId}`);
      } else {
        await supabase.from("email_queue")
          .update({ status: "failed", error_message: result.error })
          .eq("id", row.id);

        await supabase.from("campaign_sends")
          .update({ status: "failed", error_message: result.error ?? "Unknown error" })
          .eq("id", row.send_id);

        console.error(`[run-email-queue] Failed to send to ${row.to_email}: ${result.error}`);
      }
    }

    // Clean up sent/failed rows older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("email_queue")
      .delete()
      .in("status", ["sent", "failed"])
      .lt("created_at", cutoff);

    console.log(`[run-email-queue] Complete — ${sent}/${due.length} sent`);
    return json({ sent, total: due.length });

  } catch (err: any) {
    console.error("[run-email-queue] Unhandled error:", err.message);
    return json({ error: err.message }, 500);
  }
});
