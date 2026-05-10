-- Migration 035: Add INSERT and DELETE policies to campaign_suppressions
-- Only a SELECT policy existed (migration 010); INSERT/DELETE were silently blocked.

DROP POLICY IF EXISTS "Users insert own campaign suppressions" ON campaign_suppressions;
CREATE POLICY "Users insert own campaign suppressions"
  ON campaign_suppressions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own campaign suppressions" ON campaign_suppressions;
CREATE POLICY "Users delete own campaign suppressions"
  ON campaign_suppressions FOR DELETE
  USING (auth.uid() = user_id);
