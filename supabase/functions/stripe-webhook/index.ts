/**
 * stripe-webhook
 * Handles Stripe subscription lifecycle events and writes plan/status/period to users table.
 *
 * Events handled:
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.payment_succeeded
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   (from Stripe dashboard → Webhooks → signing secret)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STRIPE_PRICE_CITY       (optional — used to resolve price_id → plan name)
 *   STRIPE_PRICE_MARKET
 *   STRIPE_PRICE_REGION
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const STRIPE_SECRET_KEY    = Deno.env.get("STRIPE_SECRET_KEY")!;
const WEBHOOK_SECRET       = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Price ID → plan name map (falls back to metadata.plan if price not matched)
const PRICE_TO_PLAN: Record<string, string> = {
  [Deno.env.get("STRIPE_PRICE_CITY")   ?? ""]: "city",
  [Deno.env.get("STRIPE_PRICE_MARKET") ?? ""]: "market",
  [Deno.env.get("STRIPE_PRICE_REGION") ?? ""]: "region",
  // Legacy price IDs keep resolving
  "price_1TDod6A3dmARSc7xs4IGkHwB": "city",
  "price_1TDog0A3dmARSc7xuoR2gRUh": "market",
};

function resolvePlan(subscription: Stripe.Subscription): string {
  // 1. Try subscription metadata (set at checkout)
  const metaPlan = subscription.metadata?.plan?.toLowerCase();
  if (metaPlan && ["city", "market", "region"].includes(metaPlan)) return metaPlan;

  // 2. Legacy metadata names
  if (metaPlan === "starter" || metaPlan === "home") return "city";
  if (metaPlan === "professional" || metaPlan === "pro") return "market";
  if (metaPlan === "enterprise") return "region";

  // 3. Resolve from price ID on first line item
  const priceId = subscription.items?.data?.[0]?.price?.id ?? "";
  if (PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];

  return "city"; // safe fallback
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log("[stripe-webhook] event:", event.type);

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn("[stripe-webhook] No supabase_user_id in subscription metadata");
        return new Response("ok", { status: 200 });
      }

      const plan = resolvePlan(sub);
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      const planStatus = sub.status; // active | trialing | past_due | canceled | etc.

      console.log(`[stripe-webhook] Updating user ${userId}: plan=${plan}, status=${planStatus}, period_end=${periodEnd}`);

      const { error } = await supabase.from("users").update({
        plan,
        plan_status: planStatus,
        stripe_subscription_end: periodEnd,
        stripe_customer_id: sub.customer as string,
      }).eq("id", userId);

      if (error) console.error("[stripe-webhook] DB update error:", error.message);
    }

    else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) return new Response("ok", { status: 200 });

      console.log(`[stripe-webhook] Subscription canceled for user ${userId}`);

      const { error } = await supabase.from("users").update({
        plan: "trial",
        plan_status: "canceled",
        stripe_subscription_end: null,
      }).eq("id", userId);

      if (error) console.error("[stripe-webhook] DB update error:", error.message);
    }

    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.subscription
        ? await stripe.subscriptions.retrieve(invoice.subscription as string)
        : null;

      if (!sub) return new Response("ok", { status: 200 });

      const userId = sub.metadata?.supabase_user_id;
      if (!userId) return new Response("ok", { status: 200 });

      const plan = resolvePlan(sub);
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

      console.log(`[stripe-webhook] Payment succeeded for user ${userId}: plan=${plan}, period_end=${periodEnd}`);

      const { error } = await supabase.from("users").update({
        plan,
        plan_status: "active",
        stripe_subscription_end: periodEnd,
      }).eq("id", userId);

      if (error) console.error("[stripe-webhook] DB update error:", error.message);
    }
  } catch (err: any) {
    console.error("[stripe-webhook] Handler error:", err.message);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
