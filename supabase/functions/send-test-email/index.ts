import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatSenderName } from "../_shared/senderName.ts";

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
  return `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222"><p>${body}</p></div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    const { to, subject, body: rawBody, from_name, user_id } = body;
    if (!to || !rawBody) return json({ error: "to and body are required" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Load user info for sender name and usage logging
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
        // Use formatSenderName if we have user data
        fromName = formatSenderName(userData.contact_name, userData.business_name);
      }
    }

    // Load first test contact to populate merge tags (gracefully handle errors)
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    `${fromName} <${FROM_EMAIL}>`,
        to:      [to],
        subject: renderedSubject,
        html:    htmlBody,
        text:    textBody,
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ ok: false, error: data?.message ?? "Resend error" }, 500);

    // Write usage log so test sends appear in dashboard counts
    if (user_id) {
      await supabase.from("usage_logs").insert({
        user_id,
        channel: "email",
        stripe_period_end: stripePeriodEnd,
        plan_type: planType,
      });
    }

    return json({ ok: true, id: data.id });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
