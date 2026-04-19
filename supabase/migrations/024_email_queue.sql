-- Email queue for drip sends.
-- send-campaign-emails enqueues rows with scheduled_at spaced by drip_delay_minutes.
-- run-email-queue (cron, every minute) drains whatever is due.

CREATE TABLE IF NOT EXISTS email_queue (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  send_id           uuid        NOT NULL REFERENCES campaign_sends(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL,
  to_email          text        NOT NULL,
  from_name         text        NOT NULL DEFAULT '',
  reply_to          text        NOT NULL DEFAULT '',
  subject           text        NOT NULL,
  body_html         text        NOT NULL,
  body_text         text        NOT NULL,
  scheduled_at      timestamptz NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz,
  error_message     text,
  stripe_period_end timestamptz,
  plan_type         text
);

-- Index for the cron drain query
CREATE INDEX idx_email_queue_pending ON email_queue (scheduled_at)
  WHERE status = 'pending';

-- RLS off — only accessed by service role from edge functions
ALTER TABLE email_queue DISABLE ROW LEVEL SECURITY;
