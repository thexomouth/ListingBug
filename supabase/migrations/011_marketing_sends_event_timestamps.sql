-- Add per-event timestamp columns to marketing_sends.
-- Each column records the first time that event was received from SendGrid.
-- status column continues to reflect the latest/most severe status.

ALTER TABLE marketing_sends
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at        timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at       timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at       timestamptz,
  ADD COLUMN IF NOT EXISTS dropped_at       timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS spam_reported_at timestamptz;

-- Index on sg_message_id for fast webhook lookups
CREATE INDEX IF NOT EXISTS marketing_sends_sg_message_id_idx
  ON marketing_sends (sg_message_id)
  WHERE sg_message_id IS NOT NULL;
