-- Add queue_position to drip_runs for ordered queue activation
ALTER TABLE drip_runs ADD COLUMN IF NOT EXISTS queue_position integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS drip_runs_queued_idx ON drip_runs (queue_position, created_at)
  WHERE status = 'queued';
