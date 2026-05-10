-- Migration 034: Enable RLS on test_contacts
-- test_contacts has no user_id (shared test data). With RLS on and no permissive
-- policies for anon/authenticated roles, only the service role (edge functions) can
-- access it — which is the correct access model.

ALTER TABLE test_contacts ENABLE ROW LEVEL SECURITY;
