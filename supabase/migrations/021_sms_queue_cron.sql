-- Cron: drain sms_queue every minute
SELECT cron.schedule(
  'run-sms-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-sms-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
