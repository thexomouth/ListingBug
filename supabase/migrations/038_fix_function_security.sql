-- Migration 038: Fix SECURITY DEFINER function search path and revoke anon EXECUTE
-- Advisors flagged: mutable search_path on increment functions, handle_new_user,
-- new_user_alert; and anon/authenticated being able to call them directly via REST.

-- ── FIX SEARCH PATH ───────────────────────────────────────────────────────────
-- Adding SET search_path = '' prevents search path injection attacks.

ALTER FUNCTION public.increment_listings_fetched(uuid, integer)
  SET search_path = '';

ALTER FUNCTION public.increment_total_listings_fetched(uuid, integer)
  SET search_path = '';

ALTER FUNCTION public.increment_total_listings_exported(uuid, integer)
  SET search_path = '';

ALTER FUNCTION public.increment_sender_count(uuid)
  SET search_path = '';

ALTER FUNCTION public.new_user_alert(event jsonb)
  SET search_path = '';

ALTER FUNCTION public.handle_new_user()
  SET search_path = '';

-- ── REVOKE ANON EXECUTE ON SENSITIVE FUNCTIONS ────────────────────────────────
-- These are called only from edge functions (service role) or auth triggers.
-- Revoking from anon and authenticated prevents direct REST API abuse.

-- Revoke from PUBLIC (the default grant); revoking specific roles alone is insufficient
-- since anon/authenticated inherit EXECUTE from PUBLIC.
REVOKE EXECUTE ON FUNCTION public.increment_listings_fetched(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_total_listings_fetched(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_total_listings_exported(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_sender_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.new_user_alert(jsonb) FROM PUBLIC;

-- ── FIX PERMISSIVE ALWAYS-TRUE POLICIES ──────────────────────────────────────
-- automation_run_listings and marketing_sends have USING(true) WITH CHECK(true)
-- "service role" policies. Service role bypasses RLS anyway — no such policy needed.
-- The user-scoped policy on automation_run_listings already exists (migration 008).

DROP POLICY IF EXISTS "Service role can manage run listings" ON automation_run_listings;
DROP POLICY IF EXISTS "Service role manages sends" ON marketing_sends;
