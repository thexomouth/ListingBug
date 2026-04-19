/**
 * handle-telnyx-sms-status
 * Receives delivery status webhooks from Telnyx.
 * Updates campaign_sends with delivered / failed status.
 *
 * Telnyx event type: message.finalized
 * Statuses mapped: delivered → "delivered", sending_failed / delivery_failed → "failed"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELNYX_PUBLIC_KEY    = Deno.env.get("TELNYX_PUBLIC_KEY") ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifySignature(payload: string, headers: Headers): Promise<boolean> {
  try {
    const signature = headers.get("telnyx-signature-ed25519");
    const timestamp = headers.get("telnyx-timestamp");
    if (!signature || !timestamp) return false;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const keyBytes = Uint8Array.from(atob(TELNYX_PUBLIC_KEY), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "Ed25519" }, false, ["verify"]
    );

    const message = new TextEncoder().encode(`${timestamp}|${payload}`);
    return await crypto.subtle.verify("Ed25519", key, sigBytes, message);
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const payload = await req.text();

  const valid = await verifySignature(payload, req.headers);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let event: any;
  try { event = JSON.parse(payload); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (event.data?.event_type !== "message.finalized") return json({ ok: true });

  const msg       = event.data.payload;
  const messageId = msg?.id;
  const toEntry   = msg?.to?.[0];
  const status    = toEntry?.status ?? msg?.status ?? "";

  if (!messageId) return json({ ok: true });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Look up the send by Telnyx message ID (stored in twilio_message_sid column)
  const { data: sends } = await supabase
    .from("campaign_sends")
    .select("id, status")
    .eq("twilio_message_sid", messageId)
    .limit(1);

  const send = sends?.[0];
  if (!send) return json({ ok: true });

  const now = new Date().toISOString();

  if (status === "delivered") {
    await supabase.from("campaign_sends")
      .update({ status: "delivered", sent_at: now })
      .eq("id", send.id);
  } else if (["sending_failed", "delivery_failed", "expired"].includes(status)) {
    await supabase.from("campaign_sends")
      .update({ status: "failed", error_message: `Telnyx: ${status}` })
      .eq("id", send.id);
  }

  console.log(`[telnyx-status] ${messageId} → ${status}`);
  return json({ ok: true });
});
