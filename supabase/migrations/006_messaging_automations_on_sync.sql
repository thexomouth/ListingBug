-- Add 'on_sync' schedule option to messaging_automations
-- Drop old constraint and add new one that includes on_sync
ALTER TABLE messaging_automations
  DROP CONSTRAINT IF EXISTS messaging_automations_schedule_check;

ALTER TABLE messaging_automations
  ADD CONSTRAINT messaging_automations_schedule_check
  CHECK (schedule IN ('on_sync', 'manual', 'daily', 'weekly', 'monthly'));

-- Update default so new automations default to on_sync
ALTER TABLE messaging_automations
  ALTER COLUMN schedule SET DEFAULT 'on_sync';
