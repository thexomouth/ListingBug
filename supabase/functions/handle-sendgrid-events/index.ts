/**
 * handle-sendgrid-events
 * verify_jwt = false — triggered by SendGrid Event Webhook
 *
 * Handles: open, bounce, spamreport, unsubscribe
 * All suppressions are scoped to user_id — never global.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const events: any[] = await req.json();

    if (!Array.isArray(events)) return json({ error: "Expected array of events" }, 400);

    console.log(`[handle-sendgrid-events] Processing ${events.length} event(s)`);

    for (const event of events) {
      const eventType: string = event.event ?? "";
      const messageId: string = event.sg_message_id?.split(".")?.[0] ?? "";
      const email: string = (event.email ?? "").toLowerCase().trim();
      const timestamp = event.timestamp
        ? new Date(event.timestamp * 1000).toISOString()
        : new Date().toISOString();

      if (!messageId && !email) continue;

      // Look up the send record
      let sendRecord: any = null;
      if (messageId) {
        const { data } = await supabase
          .from("campaign_sends")
          .select("id, campaign_id, user_id, agent_email")
          .eq("sendgrid_message_id", messageId)
          .maybeSingle();
        sendRecord = data;
      }

      const userId = sendRecord?.user_id;
      const sendId = sendRecord?.id;
      const agentEmail = sendRecord?.agent_email ?? email;

      switch (eventType) {
        case "open": {
          if (sendId) {
            await supabase
              .from("campaign_sends")
              .update({ opened_at: timestamp })
              .eq("id", sendId)
              .is("opened_at", null); // only set first open
          }
          console.log(`[handle-sendgrid-events] open: ${agentEmail}`);
          break;
        }

        case "bounce": {
          if (sendId) {
            await supabase
              .from("campaign_sends")
              .update({ status: "bounced" })
              .eq("id", sendId);
          }
          if (userId && agentEmail) {
            await supabase.from("user_suppressions").upsert(
              { user_id: userId, agent_email: agentEmail, reason: "bounce", suppressed_at: timestamp },
              { onConflict: "user_id,agent_email", ignoreDuplicates: false }
            );
          }
          console.log(`[handle-sendgrid-events] bounce: ${agentEmail}`);
          break;
        }

        case "spamreport": {
          if (sendId) {
            await supabase
              .from("campaign_sends")
              .update({ status: "failed" })
              .eq("id", sendId);
          }
          if (userId && agentEmail) {
            await supabase.from("user_suppressions").upsert(
              { user_id: userId, agent_email: agentEmail, reason: "complaint", suppressed_at: timestamp },
              { onConflict: "user_id,agent_email", ignoreDuplicates: false }
            );
          }
          console.log(`[handle-sendgrid-events] spamreport: ${agentEmail}`);
          break;
        }

        case "unsubscribe":
        case "group_unsubscribe": {
          if (sendId) {
            await supabase
              .from("campaign_sends")
              .update({ status: "suppressed" })
              .eq("id", sendId);
          }
          if (userId && agentEmail) {
            await supabase.from("user_suppressions").upsert(
              { user_id: userId, agent_email: agentEmail, reason: "unsubscribe", suppressed_at: timestamp },
              { onConflict: "user_id,agent_email", ignoreDuplicates: false }
            );
          }
          console.log(`[handle-sendgrid-events] unsubscribe: ${agentEmail}`);
          break;
        }

        default:
          // open_tracking, click, delivered, etc. — no action needed
          break;
      }
    }

    // SendGrid expects 200
    return json({ ok: true, processed: events.length });
  } catch (err: any) {
    console.error("[handle-sendgrid-events] Error:", err.message);
    return json({ ok: false, error: err.message });
  }
});
