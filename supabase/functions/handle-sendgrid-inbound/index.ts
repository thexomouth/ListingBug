/**
 * handle-sendgrid-inbound
 * verify_jwt = false — triggered by SendGrid Inbound Parse webhook
 *
 * Flow:
 *  1. Parse incoming multipart/form-data from SendGrid
 *  2. Extract In-Reply-To header
 *  3. Look up matching sendgrid_message_id in campaign_sends
 *  4. Write reply to campaign_replies
 *  5. Forward reply to campaign/user forward_to address via SendGrid
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const FROM_EMAIL = "outreach@listingping.com";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function forwardReply(params: {
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
  agentName: string;
}): Promise<void> {
  const payload = {
    personalizations: [{ to: [{ email: params.toEmail }] }],
    from: { email: FROM_EMAIL, name: "ListingBug Replies" },
    subject: `Reply from ${params.agentName || params.fromEmail}: ${params.subject}`,
    content: [
      {
        type: "text/plain",
        value: `You received a reply from ${params.agentName || params.fromEmail} (${params.fromEmail}):\n\n${params.body}`,
      },
      {
        type: "text/html",
        value: `<p><strong>Reply from ${params.agentName || params.fromEmail}</strong> (<a href="mailto:${params.fromEmail}">${params.fromEmail}</a>):</p><hr/><div>${params.body.replace(/\n/g, "<br>")}</div>`,
      },
    ],
  };

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse multipart form data from SendGrid Inbound Parse
    const formData = await req.formData();
    const inReplyTo = formData.get("headers")
      ?.toString()
      .split("\n")
      .find((h) => h.toLowerCase().startsWith("in-reply-to:"))
      ?.replace(/^in-reply-to:\s*/i, "")
      .trim();

    const fromEmail = formData.get("from")?.toString() ?? "";
    const subject = formData.get("subject")?.toString() ?? "";
    const replyBody = formData.get("text")?.toString() ?? formData.get("html")?.toString() ?? "";

    console.log(`[handle-sendgrid-inbound] From: ${fromEmail}, In-Reply-To: ${inReplyTo}`);

    // Look up the original send by sendgrid_message_id
    let sendRecord: any = null;
    if (inReplyTo) {
      const { data } = await supabase
        .from("campaign_sends")
        .select("id, campaign_id, user_id, agent_name, agent_email")
        .eq("sendgrid_message_id", inReplyTo.replace(/[<>]/g, "").trim())
        .maybeSingle();
      sendRecord = data;
    }

    const now = new Date().toISOString();

    if (sendRecord) {
      // Load forward_to from campaign then user
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("forward_to, user_id")
        .eq("id", sendRecord.campaign_id)
        .single();

      let forwardTo = campaign?.forward_to;
      if (!forwardTo) {
        const { data: user } = await supabase
          .from("users")
          .select("forward_to, email")
          .eq("id", sendRecord.user_id)
          .single();
        forwardTo = user?.forward_to || user?.email;
      }

      // Write reply record
      await supabase.from("campaign_replies").insert({
        send_id: sendRecord.id,
        campaign_id: sendRecord.campaign_id,
        user_id: sendRecord.user_id,
        in_reply_to: inReplyTo,
        from_email: fromEmail,
        reply_body: replyBody,
        channel: "email",
        replied_at: now,
        forwarded_to: forwardTo ?? null,
        forwarded_at: forwardTo ? now : null,
      });

      // Update send record
      await supabase
        .from("campaign_sends")
        .update({ status: "replied" })
        .eq("id", sendRecord.id);

      // Forward to customer
      if (forwardTo) {
        await forwardReply({
          toEmail: forwardTo,
          fromEmail,
          subject,
          body: replyBody,
          agentName: sendRecord.agent_name ?? "",
        });
        console.log(`[handle-sendgrid-inbound] Forwarded reply to ${forwardTo}`);
      }
    } else {
      // No matching send found — log unmatched
      console.warn(`[handle-sendgrid-inbound] No matching send for In-Reply-To: ${inReplyTo}, from: ${fromEmail}`);
      await supabase.from("campaign_replies").insert({
        in_reply_to: inReplyTo ?? null,
        from_email: fromEmail,
        reply_body: replyBody,
        channel: "email",
        replied_at: now,
      });
    }

    // SendGrid expects a 200 response
    return json({ ok: true });
  } catch (err: any) {
    console.error("[handle-sendgrid-inbound] Error:", err.message);
    // Still return 200 so SendGrid doesn't retry
    return json({ ok: false, error: err.message });
  }
});
