-- Drip campaign system: runs, contact queue, notifications

CREATE TABLE drip_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name     text NOT NULL,
  subject           text NOT NULL,
  body              text NOT NULL,
  sender_id         text NOT NULL,
  unsubscribe_url   text,
  daily_limit       integer NOT NULL DEFAULT 500,
  status            text NOT NULL DEFAULT 'active',   -- active | paused | completed | stopped
  pause_reason      text,
  sends_today       integer NOT NULL DEFAULT 0,
  sends_today_date  date,
  total_sent        integer NOT NULL DEFAULT 0,
  total_failed      integer NOT NULL DEFAULT 0,
  total_contacts    integer NOT NULL DEFAULT 0,
  current_list_name text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE drip_contacts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid REFERENCES drip_runs(id) ON DELETE CASCADE NOT NULL,
  list_name      text NOT NULL,
  list_order     integer NOT NULL DEFAULT 0,
  email          text NOT NULL,
  first_name     text,
  last_name      text,
  business_name  text,
  city           text,
  state          text,
  status         text NOT NULL DEFAULT 'pending',   -- pending | sent | failed
  sent_at        timestamptz,
  error_message  text,
  sg_message_id  text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX drip_contacts_run_pending_idx ON drip_contacts (run_id, list_order, created_at)
  WHERE status = 'pending';

CREATE INDEX drip_contacts_run_status_idx ON drip_contacts (run_id, status, created_at);

CREATE TABLE drip_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid REFERENCES drip_runs(id) ON DELETE CASCADE NOT NULL,
  level      text NOT NULL,   -- info | warning | error | critical
  message    text NOT NULL,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- pg_cron job: fire run-drip edge function every 15 minutes
SELECT cron.schedule(
  'run-drip-every-15-min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-drip',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);
