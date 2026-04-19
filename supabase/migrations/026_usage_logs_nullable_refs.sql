-- Allow test sends to write usage_logs without a campaign or send record
ALTER TABLE usage_logs ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE usage_logs ALTER COLUMN send_id DROP NOT NULL;
