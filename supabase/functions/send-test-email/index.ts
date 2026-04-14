import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@0.12.0/mod.ts";

const ZOHO_SMTP_PASSWORD = Deno.env.get("ZOHO_SMTP_PASSWORD") ?? "";
const FROM_EMAIL = "hello@listingping.com";

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
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    const { to, subject, html_body, from_name } = body;
    if (!to || !html_body) return json({ error: "to and html_body are required" }, 400);

    const fromName = from_name || "ListingBug";

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.zoho.com",
        port: 587,
        tls: false,
        auth: { username: FROM_EMAIL, password: ZOHO_SMTP_PASSWORD },
      },
    });

    try {
      await client.send({
        from: `${fromName} <${FROM_EMAIL}>`,
        to,
        subject: subject || "(Test email)",
        html: html_body,
        content: html_body.replace(/<[^>]+>/g, ""),
      });
      await client.close();
      return json({ ok: true });
    } catch (e: any) {
      await client.close().catch(() => {});
      return json({ ok: false, error: e.message }, 500);
    }
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
