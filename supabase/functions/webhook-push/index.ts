import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("[webhook-push] request received");

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      listings = [],
      webhook_url,
      send_mode = "batch",
      metadata = {},
    } = body;

    console.log(`[webhook-push] user=${user.id} url=${webhook_url} mode=${send_mode} count=${listings.length}`);

    if (!webhook_url || !webhook_url.startsWith("https://")) {
      return new Response(JSON.stringify({ error: "Invalid webhook URL — must start with https://" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!listings.length) {
      return new Response(JSON.stringify({ error: "No listings provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestMeta = {
      source: "listingbug",
      sent_at: new Date().toISOString(),
      total_count: listings.length,
      ...metadata,
    };

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    if (send_mode === "individual") {
      // One POST per listing
      for (const listing of listings) {
        try {
          const res = await fetch(webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": "ListingBug/1.0" },
            body: JSON.stringify({ listing, meta: requestMeta }),
          });
          if (res.ok) {
            sent++;
          } else {
            failed++;
            errors.push(`HTTP ${res.status} for listing ${listing.id ?? listing.formatted_address ?? "unknown"}`);
          }
        } catch (e: any) {
          failed++;
          errors.push(e.message ?? "Network error");
        }
      }
    } else {
      // Batch — all listings in one POST
      const res = await fetch(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "ListingBug/1.0" },
        body: JSON.stringify({ listings, meta: requestMeta }),
      });
      if (res.ok) {
        sent = listings.length;
      } else {
        failed = listings.length;
        errors.push(`HTTP ${res.status}: ${res.statusText}`);
      }
    }

    console.log(`[webhook-push] done — sent=${sent} failed=${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, errors: errors.length ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[webhook-push] error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
