-- Migration 033: Add user_id + RLS to drip_runs, drip_contacts, drip_notifications
-- drip_runs was created (013) without a user_id column so cross-user reads were possible.
-- drip_contacts and drip_notifications join through drip_runs so they scope via subquery.

ALTER TABLE drip_runs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE drip_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_notifications ENABLE ROW LEVEL SECURITY;

-- drip_runs: scoped directly by user_id
DROP POLICY IF EXISTS "Users manage own drip runs" ON drip_runs;
CREATE POLICY "Users manage own drip runs"
  ON drip_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- drip_contacts: scoped through drip_runs
DROP POLICY IF EXISTS "Users manage own drip contacts" ON drip_contacts;
CREATE POLICY "Users manage own drip contacts"
  ON drip_contacts FOR ALL
  USING (
    run_id IN (SELECT id FROM drip_runs WHERE user_id = auth.uid())
  )
  WITH CHECK (
    run_id IN (SELECT id FROM drip_runs WHERE user_id = auth.uid())
  );

-- drip_notifications: scoped through drip_runs
DROP POLICY IF EXISTS "Users manage own drip notifications" ON drip_notifications;
CREATE POLICY "Users manage own drip notifications"
  ON drip_notifications FOR ALL
  USING (
    run_id IN (SELECT id FROM drip_runs WHERE user_id = auth.uid())
  )
  WITH CHECK (
    run_id IN (SELECT id FROM drip_runs WHERE user_id = auth.uid())
  );
