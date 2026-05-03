/**
 * send-via-smtp
 * Called by run-email-queue for campaigns using an SMTP sender connection.
 * Reads credentials from integration_connections.credentials and
 * config (host/port) from integration_connections.config.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.9";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { emailQueueId } = await req.json();
    if (!emailQueueId) return json({ error: "emailQueueId is required" }, 400);

    // Fetch the queued email + full sender row
    const { data: email, error: fetchErr } = await supabase
      .from("email_queue")
      .select("*, sender:integration_connections!sender_id(id, integration_id, from_email, from_name, credentials, config, status)")
      .eq("id", emailQueueId)
      .single();

    if (fetchErr || !email) return json({ error: "Email queue item not found" }, 404);

    const sender = email.sender;
    if (!sender || sender.integration_id !== "smtp") {
      return json({ error: "Sender is not an SMTP connection" }, 400);
    }

    const host: string = sender.config?.host;
    const port: number = Number(sender.config?.port ?? 587);
    const username: string = sender.credentials?.username;
    const password: string = sender.credentials?.password;
    const fromEmail: string = sender.from_email || username;
    const fromName: string = email.from_name || sender.from_name || fromEmail;

    if (!host || !username || !password) {
      return json({ error: "Incomplete SMTP credentials — host, username, password required" }, 400);
    }

    // Port 465 = implicit TLS; 587/25/2525 = STARTTLS
    const secure = port === 465;

    console.log(`[send-via-smtp] Sending to ${email.to_email} via ${username}@${host}:${port} secure=${secure}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email.to_email,
      replyTo: email.reply_to || undefined,
      subject: email.subject,
      html: email.body_html,
      text: email.body_text,
    });

    console.log(`[send-via-smtp] Sent to ${email.to_email} — messageId: ${info.messageId}`);

    return json({ ok: true, messageId: info.messageId ?? null });

  } catch (err: any) {
    console.error("[send-via-smtp] Error:", err.message);
    return json({ ok: false, error: err.message }, 500);
  }
});
