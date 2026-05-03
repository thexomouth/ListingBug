/**
 * test-smtp-connection
 * Tests SMTP server connection and validates credentials by sending a test email.
 * Uses nodemailer which correctly handles both implicit SSL (465) and STARTTLS (587).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.9";

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

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { host, port, username, password, from_email, from_name } = body as SMTPConfig;

    if (!host || !port || !username || !password || !from_email || !from_name) {
      return json(
        { success: false, error: "Missing required fields: host, port, username, password, from_email, from_name" },
        400
      );
    }

    // Port 465 = implicit SSL; everything else (587, 25, 2525) = STARTTLS
    const secure = port === 465;

    console.log(`[test-smtp-connection] Testing ${username}@${host}:${port} secure=${secure}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        // Accept self-signed / mismatched certs so private mail servers still work
        rejectUnauthorized: false,
      },
    });

    try {
      // Verify credentials before sending
      await transporter.verify();
      console.log("[test-smtp-connection] SMTP verified successfully");

      await transporter.sendMail({
        from: `"${from_name}" <${from_email}>`,
        to: from_email,
        subject: "ListingBug SMTP Test",
        text: "This is a test email from ListingBug to verify your SMTP configuration. If you received this, your settings are working correctly!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #342e37;">SMTP Test Successful!</h2>
            <p>This is a test email from <strong>ListingBug</strong> to verify your SMTP configuration.</p>
            <p>If you received this email, your SMTP settings are working correctly and you're ready to start sending outreach campaigns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Sent via ListingBug SMTP Test</p>
          </div>
        `,
      });

      console.log("[test-smtp-connection] Test email sent successfully");

      return json({
        success: true,
        message: `Successfully sent test email to ${from_email}. Check your inbox!`,
      });
    } catch (smtpError: any) {
      console.error("[test-smtp-connection] Error:", smtpError.message);

      let errorMessage: string = smtpError.message || "Unknown SMTP error";

      if (/auth|login|credentials|535|534|530/i.test(errorMessage)) {
        errorMessage = "Authentication failed — check your username and password. For Gmail/Outlook, use an App Password.";
      } else if (/connect|timeout|ECONNREFUSED|ETIMEDOUT/i.test(errorMessage)) {
        errorMessage = "Could not connect to SMTP server — check your host and port.";
      } else if (/certificate|TLS|SSL|SELF_SIGNED/i.test(errorMessage)) {
        errorMessage = "TLS/SSL error — the server certificate could not be verified.";
      }

      return json({ success: false, error: errorMessage });
    }
  } catch (err: any) {
    console.error("[test-smtp-connection] Unexpected error:", err.message);
    return json({ success: false, error: err.message || "Failed to test SMTP connection" }, 500);
  }
});
