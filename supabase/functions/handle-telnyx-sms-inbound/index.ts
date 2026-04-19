/**
 * handle-telnyx-sms-inbound
 * Receives inbound SMS replies from Telnyx.
 * - STOP/UNSUBSCRIBE → adds to user_suppressions
 * - All replies → stored in campaign_replies linked to the original send
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

// Telnyx uses Ed25519 signatures
async function verifySignature(payload: string, headers: Headers): Promise<boolean> {
  try {
    const signature = headers.get("telnyx-signature-ed25519");
    const timestamp = headers.get("telnyx-timestamp");
    if (!signature || !timestamp) return false;

    // Reject stale webhooks (> 5 min)
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

const STOP_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const payload = await req.text();

  const valid = await verifySignature(payload, req.headers);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let event: any;
  try { event = JSON.parse(payload); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (event.data?.event_type !== "message.received") return json({ ok: true });

  const msg     = event.data.payload;
  const fromNum = msg?.from?.phone_number?.trim();
  const toNum   = msg?.to?.[0]?.phone_number?.trim();
  const text    = (msg?.text ?? "").trim();

  if (!fromNum || !text) return json({ ok: true });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Find the most recent campaign_send to this phone number to link the reply
  const { data: sends } = await supabase
    .from("campaign_sends")
    .select("id, campaign_id, user_id, agent_email")
    .eq("agent_phone", fromNum)
    .eq("channel", "sms")
    .order("sent_at", { ascending: false })
    .limit(1);

  const send = sends?.[0];

  // Handle opt-out
  if (STOP_WORDS.has(text.toLowerCase())) {
    if (send?.user_id) {
      await supabase.from("user_suppressions").upsert({
        user_id:     send.user_id,
        agent_phone: fromNum,
        agent_email: send.agent_email ?? null,
      }, { onConflict: "agent_phone,user_id", ignoreDuplicates: true });
    }
    console.log(`[telnyx-inbound] STOP from ${fromNum} — suppressed`);
    return json({ ok: true });
  }

  // Store reply
  if (send) {
    await supabase.from("campaign_replies").insert({
      send_id:     send.id,
      campaign_id: send.campaign_id,
      user_id:     send.user_id,
      reply_body:  text,
      from_phone:  fromNum,
      replied_at:  new Date().toISOString(),
      channel:     "sms",
    });

    // Mark the original send as replied
    await supabase.from("campaign_sends")
      .update({ status: "replied" })
      .eq("id", send.id);
  }

  console.log(`[telnyx-inbound] Reply from ${fromNum}: "${text}"`);
  return json({ ok: true });
});
