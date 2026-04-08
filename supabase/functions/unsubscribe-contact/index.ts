/**
 * unsubscribe-contact
 * Public endpoint — no JWT required.
 * Takes { email } and:
 *   1. Sets unsubscribed=true on all marketing_contacts rows with that email
 *   2. Adds to suppression_list for every user who has that contact
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

  let email: string | null = null;

  // Support both GET (?email=...) and POST ({ email })
  if (req.method === "GET") {
    const url = new URL(req.url);
    email = url.searchParams.get("email");
  } else {
    try {
      const body = await req.json();
      email = body.email ?? null;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
  }

  if (!email || !email.includes("@")) {
    return json({ error: "Valid email is required" }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Find all marketing_contacts rows with this email
  const { data: contacts, error: contactsErr } = await supabase
    .from("marketing_contacts")
    .select("id, user_id")
    .eq("email", normalizedEmail);

  if (contactsErr) {
    console.error("[unsubscribe-contact] contacts lookup error:", contactsErr.message);
    return json({ error: "Server error" }, 500);
  }

  if (!contacts || contacts.length === 0) {
    // Email not found — still return success so we don't leak info
    return json({ success: true });
  }

  // 2. Mark all contacts as unsubscribed
  const { error: updateErr } = await supabase
    .from("marketing_contacts")
    .update({ unsubscribed: true })
    .eq("email", normalizedEmail);

  if (updateErr) {
    console.error("[unsubscribe-contact] update error:", updateErr.message);
    return json({ error: "Server error" }, 500);
  }

  // 3. Add to suppression_list for every user who has this contact
  const userIds = [...new Set(contacts.map((c: any) => c.user_id))];
  const suppressionRows = userIds.map((uid) => ({
    user_id: uid,
    email: normalizedEmail,
  }));

  if (suppressionRows.length > 0) {
    const { error: supErr } = await supabase
      .from("suppression_list")
      .upsert(suppressionRows, { onConflict: "user_id,email", ignoreDuplicates: true });

    if (supErr) {
      console.error("[unsubscribe-contact] suppression insert error:", supErr.message);
      // Non-fatal — unsubscribed flag is already set
    }
  }

  console.log(`[unsubscribe-contact] ${normalizedEmail} unsubscribed across ${userIds.length} account(s)`);
  return json({ success: true });
});
