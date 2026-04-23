-- Migration 030: Atomic sender counter increment function
-- Purpose: Atomically increment emails_sent_today to prevent race conditions

CREATE OR REPLACE FUNCTION increment_sender_count(sender_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE integration_connections
  SET
    emails_sent_today = emails_sent_today + 1,
    last_used_at = NOW()
  WHERE id = sender_id;
END;
$$ LANGUAGE plpgsql;
