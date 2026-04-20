-- Migration 028: Add per-user drip scheduling to email_queue
-- Purpose: Support user-specific sending identities and drip scheduling with human-like variance

-- Add sender and drip position tracking to email_queue
ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_drip_position INT DEFAULT 0;

-- Create index for per-user queue processing (ordered by user, drip position, scheduled time)
CREATE INDEX IF NOT EXISTS idx_email_queue_user_drip
  ON email_queue(user_id, user_drip_position, scheduled_at)
  WHERE status = 'pending';

-- Create index for sender-based queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_sender
  ON email_queue(sender_id, status)
  WHERE sender_id IS NOT NULL;

-- Add same fields to sms_queue for consistency
ALTER TABLE sms_queue
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_drip_position INT DEFAULT 0;

-- Create index for per-user SMS queue processing
CREATE INDEX IF NOT EXISTS idx_sms_queue_user_drip
  ON sms_queue(user_id, user_drip_position, scheduled_at)
  WHERE status = 'pending';
