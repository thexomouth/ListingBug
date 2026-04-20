/**
 * test-smtp-connection
 * Tests SMTP server connection and validates credentials
 * Does NOT require user authentication (used during onboarding)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
  use_tls: boolean;
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

    const { host, port, username, password, from_email, from_name, use_tls } = body as SMTPConfig;

    // Validation
    if (!host || !port || !username || !password || !from_email || !from_name) {
      return json(
        { success: false, error: "Missing required fields: host, port, username, password, from_email, from_name" },
        400
      );
    }

    // Test SMTP connection
    console.log(`[test-smtp-connection] Testing ${username}@${host}:${port} (TLS: ${use_tls})`);

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: use_tls,
        auth: {
          username,
          password,
        },
      },
    });

    try {
      // Connect to SMTP server
      await client.connect();
      console.log("[test-smtp-connection] Connected successfully");

      // Send a test email to verify end-to-end functionality
      await client.send({
        from: `${from_name} <${from_email}>`,
        to: from_email, // Send test email to self
        subject: "ListingBug SMTP Test",
        content: "This is a test email from ListingBug to verify your SMTP configuration. If you received this, your SMTP settings are working correctly!",
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

      // Close connection
      await client.close();

      return json({
        success: true,
        message: `Successfully sent test email to ${from_email}. Check your inbox!`,
      });
    } catch (smtpError: any) {
      console.error("[test-smtp-connection] SMTP error:", smtpError.message);

      // Try to close connection gracefully
      try {
        await client.close();
      } catch {}

      // Return user-friendly error messages
      let errorMessage = smtpError.message || "Unknown SMTP error";

      if (errorMessage.includes("authentication") || errorMessage.includes("login")) {
        errorMessage = "Authentication failed. Please check your username and password.";
      } else if (errorMessage.includes("connection") || errorMessage.includes("timeout")) {
        errorMessage = "Could not connect to SMTP server. Please check host and port.";
      } else if (errorMessage.includes("certificate") || errorMessage.includes("TLS")) {
        errorMessage = "TLS/SSL error. Try toggling the TLS setting.";
      }

      return json({
        success: false,
        error: errorMessage,
      });
    }
  } catch (err: any) {
    console.error("[test-smtp-connection] Unexpected error:", err.message);
    return json({
      success: false,
      error: err.message || "Failed to test SMTP connection",
    }, 500);
  }
});
