-- Cron: trigger daily campaign sends at 14:00 UTC (6:00 AM PST)
SELECT cron.schedule(
  'run-campaign-schedule',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-campaign-schedule',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
