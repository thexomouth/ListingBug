-- Track which onboarding modals a user has seen.
-- Stored per-account so clearing the users row resets the sequence.
-- Keys: "a", "b", "c", "d" — set to true when the modal is dismissed.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_seen jsonb NOT NULL DEFAULT '{}'::jsonb;
