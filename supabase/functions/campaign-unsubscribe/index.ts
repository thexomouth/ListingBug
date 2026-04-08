/**
 * campaign-unsubscribe
 * Public endpoint — no JWT required.
 * Handles campaign-specific unsubscribes for ListingBug-generated URLs.
 * Body: { user_id, campaign_id, email }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  let user_id: string | null = null;
  let campaign_id: string | null = null;
  let email: string | null = null;

  try {
    const body = await req.json();
    user_id = body.user_id ?? null;
    campaign_id = body.campaign_id ?? null;
    email = body.email ?? null;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!user_id || !campaign_id || !email || !email.includes("@")) {
    return json({ error: "user_id, campaign_id, and a valid email are required" }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Add to campaign-specific suppression list
  const { error: supErr } = await supabase
    .from("campaign_suppressions")
    .upsert(
      { user_id, campaign_id, email: normalizedEmail },
      { onConflict: "user_id,campaign_id,email", ignoreDuplicates: true }
    );

  if (supErr) {
    console.error("[campaign-unsubscribe] insert error:", supErr.message);
    return json({ error: "Server error" }, 500);
  }

  // Also mark the contact as unsubscribed in marketing_contacts for this user
  const { error: updateErr } = await supabase
    .from("marketing_contacts")
    .update({ unsubscribed: true })
    .eq("user_id", user_id)
    .eq("email", normalizedEmail);

  if (updateErr) {
    console.error("[campaign-unsubscribe] contact update error:", updateErr.message);
    // Non-fatal
  }

  console.log(`[campaign-unsubscribe] ${normalizedEmail} unsubscribed from campaign ${campaign_id}`);
  return json({ success: true });
});
