import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidAccessToken } from "../_shared/crypto.ts";
import nodemailer from "npm:nodemailer@6.9.9";

const RESEND_API_KEY    = Deno.env.get("SHARED_MAILBOX_RESEND_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL        = "hello@listingping.com";

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

function buildHtml(text: string): string {
  const body = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline">${t}</a>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<div style="font-size:15px;line-height:1.6;max-width:580px;color:#222"><p>${body}</p></div>`;
}

async function refreshGmailToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GMAIL_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("GMAIL_REFRESH_FAILED");
  const data = await response.json();
  return { access_token: data.access_token, expires_in: data.expires_in };
}

async function refreshOutlookToken(refreshToken: string) {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("OUTLOOK_CLIENT_ID")!,
      client_secret: Deno.env.get("OUTLOOK_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("OUTLOOK_REFRESH_FAILED");
  const data = await response.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

async function sendViaGmail(sender: any, supabase: any, params: { to: string; fromName: string; subject: string; htmlBody: string }) {
  const accessToken = await getValidAccessToken(sender, supabase, refreshGmailToken);
  const fromEmail = sender.sending_email || sender.from_email || sender.credentials?.email || "";
  const message = [
    `To: ${params.to}`,
    `From: ${params.fromName} <${fromEmail}>`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    params.htmlBody,
  ].join("\r\n");
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encodedMessage }),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
}

async function sendViaOutlook(sender: any, supabase: any, params: { to: string; fromName: string; subject: string; htmlBody: string }) {
  const accessToken = await getValidAccessToken(sender, supabase, refreshOutlookToken);
  const fromEmail = sender.sending_email || sender.from_email || "";
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: { contentType: "HTML", content: params.htmlBody },
        toRecipients: [{ emailAddress: { address: params.to } }],
        from: { emailAddress: { name: params.fromName, address: fromEmail } },
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) throw new Error(`Outlook API error: ${await res.text()}`);
}

async function sendViaSmtp(sender: any, params: { to: string; fromName: string; subject: string; htmlBody: string }) {
  const host: string = sender.config?.host;
  const port: number = Number(sender.config?.port ?? 587);
  const username: string = sender.credentials?.username;
  const password: string = sender.credentials?.password;
  const fromEmail: string = sender.from_email || username;

  if (!host || !username || !password) {
    throw new Error("Incomplete SMTP credentials — host, username, password required");
  }

  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user: username, pass: password },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"${params.fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.htmlBody,
  });
}

async function sendViaResend(params: { to: string; fromName: string; subject: string; htmlBody: string; textBody: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    `${params.fromName} <${FROM_EMAIL}>`,
      to:      [params.to],
      subject: params.subject,
      html:    params.htmlBody,
      text:    params.textBody,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Resend error");
  return data.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    const { to, subject, body: rawBody, from_name, user_id, sender_id } = body;
    if (!to || !rawBody) return json({ error: "to and body are required" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Resolve from name — prefer explicit from_name, else derive from user record
    let fromName = from_name || "ListingBug";
    let stripePeriodEnd: string | null = null;
    let planType: string | null = null;

    if (user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("stripe_subscription_end, plan, contact_name, business_name")
        .eq("id", user_id)
        .single();
      if (userData) {
        stripePeriodEnd = userData.stripe_subscription_end ?? null;
        planType = userData.plan ?? "trial";
        if (!from_name) fromName = userData.business_name || userData.contact_name || 'ListingBug';
      }
    }

    // Load test contact to populate merge tags
    const { data: contacts } = await supabase
      .from("test_contacts")
      .select("agent_name, agent_email, listing_address, city, state, price, listed_date")
      .limit(1);

    const contact = contacts?.[0];
    const vars: Record<string, string> = contact ? {
      agent_name:   contact.agent_name ?? "",
      address:      contact.listing_address ?? "",
      city:         contact.city ?? "",
      price:        contact.price ? `$${Number(contact.price).toLocaleString()}` : "",
      listing_date: contact.listed_date
        ? new Date(contact.listed_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "",
    } : {
      agent_name: "Sarah Smith",
      address: "1842 Maple Street",
      city: "Denver",
      price: "$485,000",
      listing_date: "Jan 15, 2024",
    };

    const renderedSubject = interpolate(subject ?? "(no subject)", vars);
    const renderedBody    = interpolate(rawBody, vars);
    const htmlBody        = buildHtml(renderedBody);
    const textBody        = renderedBody.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `${t} (${u})`);

    const params = { to, fromName, subject: renderedSubject, htmlBody, textBody };

    // Route via the user's actual sender when sender_id is provided
    if (sender_id) {
      const { data: sender } = await supabase
        .from("integration_connections")
        .select("id, integration_id, sending_email, from_email, credentials, status")
        .eq("id", sender_id)
        .single();

      if (sender && sender.status === "active") {
        try {
          if (sender.integration_id === "gmail") {
            await sendViaGmail(sender, supabase, params);
            return json({ ok: true });
          } else if (sender.integration_id === "outlook") {
            await sendViaOutlook(sender, supabase, params);
            return json({ ok: true });
          } else if (sender.integration_id === "smtp") {
            await sendViaSmtp(sender, params);
            return json({ ok: true });
          }
        } catch (err: any) {
          console.error("[send-test-email] Sender routing failed, falling back to Resend:", err.message);
        }
      }
    }

    // Fallback: Resend shared mailbox
    const resendId = await sendViaResend(params);

    if (user_id) {
      await supabase.from("usage_logs").insert({
        user_id,
        channel: "email",
        stripe_period_end: stripePeriodEnd,
        plan_type: planType,
      });
    }

    return json({ ok: true, id: resendId });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
