-- Shared SMS queue for all users.
-- Rate limit: 6 messages/minute on the shared Telnyx number = 1 per 10 seconds.
-- send-campaign-sms enqueues messages with scheduled_at spaced 10s apart from
-- the current queue tail. run-sms-queue (cron, every minute) drains what's due.

CREATE TABLE IF NOT EXISTS sms_queue (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  send_id      uuid        NOT NULL REFERENCES campaign_sends(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL,
  to_phone     text        NOT NULL,
  body         text        NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  error_message text
);

-- Index for the cron drain query
CREATE INDEX idx_sms_queue_pending ON sms_queue (scheduled_at)
  WHERE status = 'pending';

-- RLS off — only accessed by service role from edge functions
ALTER TABLE sms_queue DISABLE ROW LEVEL SECURITY;
