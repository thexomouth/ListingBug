import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
const SUPPORT_EMAIL = "support@thelistingbug.com";
const FROM_EMAIL = "noreply@thelistingbug.com";
const FROM_NAME = "ListingBug Support";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { name, email, category, subject, message, ticketId, timestamp } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryLabel: Record<string, string> = {
      technical: "Technical Support",
      billing: "Billing & Payments",
      general: "General Question",
      feature: "Feature Request",
      bug: "Report a Bug",
      data: "Data Accuracy",
      account: "Account Management",
    };

    const emailBody = `
New support request received via thelistingbug.com/support

Ticket ID:  ${ticketId}
Submitted:  ${timestamp}

--- CONTACT ---
Name:       ${name}
Email:      ${email}
Category:   ${categoryLabel[category] ?? category}
Subject:    ${subject}

--- MESSAGE ---
${message}

---
Reply directly to this email to respond to ${name} at ${email}.
    `.trim();

    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #342e37; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h2 style="color: #FFCE0A; margin: 0; font-size: 18px;">New Support Request</h2>
    <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">via thelistingbug.com/support</p>
  </div>
  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 100px;">Ticket ID</td><td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${ticketId}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Name</td><td style="padding: 6px 0; font-size: 13px;">${name}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 6px 0; font-size: 13px;"><a href="mailto:${email}" style="color: #342e37;">${email}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Category</td><td style="padding: 6px 0; font-size: 13px;">${categoryLabel[category] ?? category}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Subject</td><td style="padding: 6px 0; font-size: 13px; font-weight: bold;">${subject}</td></tr>
    </table>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
      <p style="color: #111827; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
    <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">Reply directly to this email to respond to ${name}.</p>
  </div>
</div>
    `.trim();

    const sendgridRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: SUPPORT_EMAIL, name: "ListingBug Support" }],
          reply_to: { email, name },
        }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `[${ticketId}] ${subject}`,
        content: [
          { type: "text/plain", value: emailBody },
          { type: "text/html", value: htmlBody },
        ],
      }),
    });

    if (!sendgridRes.ok) {
      const errText = await sendgridRes.text();
      console.error("[send-support-email] SendGrid error:", sendgridRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[send-support-email] Sent ticket ${ticketId} from ${email}`);
    return new Response(JSON.stringify({ success: true, ticketId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[send-support-email] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
