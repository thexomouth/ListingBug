-- ============================================================
-- 003_fix_next_run_at.sql
-- Immediately corrects drifted next_run_at values for all
-- active automations.
--
-- Root cause: next_run_at was set to actual_run_time + 24h.
-- Because the run finishes a few seconds after the hour mark,
-- each iteration misses the correct pg_cron tick and fires
-- at the NEXT hour, drifting by +1 hour per day.
--
-- Fix: anchor next_run_at to the stored schedule_time
-- (HH:MM in America/Los_Angeles) using Postgres timezone math.
-- After deploying the corrected run-due-automations edge function
-- this drift can never recur.
--
-- Run this once in the Supabase SQL editor.
-- ============================================================

UPDATE automations
SET next_run_at = (
  -- Take tomorrow's date in Pacific time,
  -- add the stored schedule_time (e.g. '05:00'),
  -- interpret the whole thing as America/Los_Angeles,
  -- which Postgres converts to UTC for storage.
  (
    (now() AT TIME ZONE 'America/Los_Angeles')::date  -- today in Pacific
    + INTERVAL '1 day'                                 -- → tomorrow in Pacific
    + (schedule_time::time)                            -- → tomorrow 05:00 Pacific
  ) AT TIME ZONE 'America/Los_Angeles'                 -- → UTC timestamptz
)
WHERE
  active = true
  AND schedule_time IS NOT NULL;

-- For automations without a schedule_time, default to tomorrow 05:00 Pacific
UPDATE automations
SET next_run_at = (
  (
    (now() AT TIME ZONE 'America/Los_Angeles')::date
    + INTERVAL '1 day'
    + TIME '05:00:00'
  ) AT TIME ZONE 'America/Los_Angeles'
)
WHERE
  active = true
  AND schedule_time IS NULL;
