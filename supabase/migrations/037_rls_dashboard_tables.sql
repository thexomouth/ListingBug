-- Migration 037: Enable RLS on all dashboard-created tables flagged by advisors
-- Previously these were created via Supabase dashboard with no RLS.

-- ── CAMPAIGNS & RELATED ────────────────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own campaigns" ON campaigns;
CREATE POLICY "Users manage own campaigns"
  ON campaigns FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE campaign_search_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own campaign search criteria" ON campaign_search_criteria;
CREATE POLICY "Users manage own campaign search criteria"
  ON campaign_search_criteria FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = (select auth.uid())))
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE user_id = (select auth.uid())));

ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own campaign sends" ON campaign_sends;
CREATE POLICY "Users read own campaign sends"
  ON campaign_sends FOR SELECT
  USING ((select auth.uid()) = user_id);

ALTER TABLE campaign_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own campaign replies" ON campaign_replies;
CREATE POLICY "Users read own campaign replies"
  ON campaign_replies FOR SELECT
  USING ((select auth.uid()) = user_id);

ALTER TABLE campaign_sms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own campaign sms config" ON campaign_sms_config;
CREATE POLICY "Users manage own campaign sms config"
  ON campaign_sms_config FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = (select auth.uid())))
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE user_id = (select auth.uid())));

-- ── USER DATA ─────────────────────────────────────────────────────────────────

ALTER TABLE user_suppressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own suppressions" ON user_suppressions;
CREATE POLICY "Users manage own suppressions"
  ON user_suppressions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own usage logs" ON usage_logs;
CREATE POLICY "Users read own usage logs"
  ON usage_logs FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ── SHARED LISTING CACHE (public RentCast data — authenticated read only) ─────

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read listings" ON listings;
CREATE POLICY "Authenticated users can read listings"
  ON listings FOR SELECT
  USING ((select auth.role()) = 'authenticated');

ALTER TABLE market_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read market statistics" ON market_statistics;
CREATE POLICY "Authenticated users can read market statistics"
  ON market_statistics FOR SELECT
  USING ((select auth.role()) = 'authenticated');

ALTER TABLE property_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read property records" ON property_records;
CREATE POLICY "Authenticated users can read property records"
  ON property_records FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- ── SYSTEM / ADMIN ONLY (service role bypasses RLS — no permissive policies) ──

ALTER TABLE signup_fingerprints ENABLE ROW LEVEL SECURITY;

ALTER TABLE hook_logs ENABLE ROW LEVEL SECURITY;

-- email_queue and sms_queue had DISABLE RLS in their original migrations (020, 024).
-- Switching to ENABLE + no policies: service role (edge functions) still has full
-- access via bypass, and the advisor warnings are resolved.
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;
