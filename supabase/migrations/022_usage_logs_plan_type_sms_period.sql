-- Add plan_type to usage_logs for per-plan metering and reporting.
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS plan_type text;

-- Add stripe_period_end to sms_queue so run-sms-queue can write usage_logs
-- without a separate users lookup on every send.
ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS stripe_period_end timestamptz;
ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS plan_type text;
