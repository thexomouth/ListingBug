import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const PRICE_IDS: Record<string, string> = {
  starter: "price_1TDod6A3dmARSc7xs4IGkHwB",
  professional: "price_1TDog0A3dmARSc7xuoR2gRUh",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("[checkout] ── NEW REQUEST ──");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    console.log("[checkout] token present:", !!token, "length:", token.length);

    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), { status: 401, headers: corsHeaders });
    }

    // Correct: anon key as API key, user JWT in Authorization header
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    console.log("[checkout] getUser:", user?.id ?? "null", "error:", authError?.message ?? "none");

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token", detail: authError?.message }), { status: 401, headers: corsHeaders });
    }

    let body: any = {};
    try { body = await req.json(); } catch (_) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: corsHeaders });
    }

    const plan = body.plan?.toLowerCase();
    console.log("[checkout] plan:", plan);

    if (!plan || !PRICE_IDS[plan]) {
      return new Response(JSON.stringify({ error: `Invalid plan '${plan}'` }), { status: 400, headers: corsHeaders });
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("[checkout] STRIPE_SECRET_KEY not set!");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: corsHeaders });
    }
    console.log("[checkout] Stripe key:", STRIPE_SECRET_KEY.substring(0, 7) + "...");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: userData, error: userDbErr } = await adminClient
      .from("users").select("stripe_customer_id, email").eq("id", user.id).single();
    if (userDbErr) console.error("[checkout] user DB error:", userDbErr.message);
    console.log("[checkout] existing customer:", userData?.stripe_customer_id ?? "none");

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log("[checkout] created customer:", customerId);
      const { error: updateErr } = await adminClient.from("users")
        .update({ stripe_customer_id: customerId }).eq("id", user.id);
      if (updateErr) console.error("[checkout] save customer error:", updateErr.message);
    }

    const origin = req.headers.get("origin") || "https://www.thelistingbug.com";
    console.log("[checkout] creating session, customer:", customerId, "plan:", plan, "price:", PRICE_IDS[plan]);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${origin}/account?billing=success`,
      cancel_url: `${origin}/account?billing=canceled`,
      subscription_data: { metadata: { supabase_user_id: user.id, plan } },
      allow_promotion_codes: true,
    });

    console.log("[checkout] session created:", session.id);
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[checkout] exception:", err.message);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500, headers: corsHeaders,
    });
  }
});
