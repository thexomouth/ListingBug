/**
 * handle-click
 * Click-tracking redirect endpoint.
 * GET ?s=<send_id>&u=<base64url_encoded_target_url>
 *
 * Records clicked_at on campaign_sends (first click only), then 302 redirects.
 * The DB update is fire-and-forget so the redirect is not delayed.
 *
 * Route this via click.thelistingbug.com CNAME → Supabase custom domain,
 * or via a Vercel rewrite rule proxying /click/r to this function.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function b64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const rem = padded.length % 4;
  return atob(rem ? padded + "=".repeat(4 - rem) : padded);
}

serve(async (req) => {
  // Support both GET and HEAD (some email clients prefetch)
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url     = new URL(req.url);
  const sendId  = url.searchParams.get("s");
  const encoded = url.searchParams.get("u");

  if (!sendId || !encoded) {
    return new Response("Missing parameters", { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = b64urlDecode(encoded);
    new URL(targetUrl); // throws if not a valid URL
  } catch {
    return new Response("Invalid redirect target", { status: 400 });
  }

  // Fire-and-forget — don't block the redirect on the DB round-trip
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  supabase
    .from("campaign_sends")
    .update({ clicked_at: new Date().toISOString() })
    .eq("id", sendId)
    .is("clicked_at", null) // only stamp the first click
    .then(() => {});

  return Response.redirect(targetUrl, 302);
});
