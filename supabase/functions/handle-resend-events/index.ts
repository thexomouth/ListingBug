import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET   = Deno.env.get("SHARED_MAILBOX_RESEND_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Svix signature verification (Resend uses Svix for webhooks)
async function verifySignature(payload: string, headers: Headers): Promise<boolean> {
  const msgId        = headers.get("svix-id");
  const msgTimestamp = headers.get("svix-timestamp");
  const msgSignature = headers.get("svix-signature");

  if (!msgId || !msgTimestamp || !msgSignature) return false;

  // Reject if timestamp is more than 5 minutes old
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(msgTimestamp)) > 300) return false;

  // Decode secret: strip "whsec_" prefix, base64 decode
  const secretBytes = Uint8Array.from(
    atob(WEBHOOK_SECRET.replace(/^whsec_/, "")),
    c => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    "raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = "v1," + btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // Header may contain multiple space-separated signatures
  return msgSignature.split(" ").some(s => s === expected);
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const payload = await req.text();

  const valid = await verifySignature(payload, req.headers);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let event: any;
  try { event = JSON.parse(payload); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { type, data } = event;
  const emailId = data?.email_id;
  if (!emailId) return json({ ok: true }); // nothing to act on

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date().toISOString();

  // Find the campaign_send by Resend message ID (stored in sendgrid_message_id column)
  const { data: sends } = await supabase
    .from("campaign_sends")
    .select("id, status, user_id, agent_email")
    .eq("sendgrid_message_id", emailId)
    .limit(1);

  const send = sends?.[0];
  if (!send) return json({ ok: true }); // not a campaign send, ignore

  switch (type) {
    case "email.delivered":
      if (send.status === "queued" || send.status === "sent") {
        await supabase.from("campaign_sends")
          .update({ status: "sent", sent_at: now })
          .eq("id", send.id);
      }
      break;

    case "email.opened":
      await supabase.from("campaign_sends")
        .update({ status: "opened", opened_at: now })
        .eq("id", send.id);
      break;

    case "email.clicked":
      await supabase.from("campaign_sends")
        .update({ status: "opened", clicked_at: now })
        .eq("id", send.id);
      break;

    case "email.bounced":
      await supabase.from("campaign_sends")
        .update({ status: "failed", error_message: `Bounced: ${data?.bounce?.message ?? "hard bounce"}` })
        .eq("id", send.id);
      break;

    case "email.complained":
      await supabase.from("campaign_sends")
        .update({ status: "failed", error_message: "Spam complaint" })
        .eq("id", send.id);
      // Suppress this address for the owning user so we never email them again
      if (send.user_id && send.agent_email) {
        await supabase.from("user_suppressions").upsert({
          user_id:     send.user_id,
          agent_email: send.agent_email.toLowerCase().trim(),
        }, { onConflict: "agent_email,user_id", ignoreDuplicates: true });
      }
      break;
  }

  return json({ ok: true });
});
