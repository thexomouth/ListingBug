-- campaign_automations: search automations whose delivery function is "Send Messaging"
-- Links a saved search (criteria + schedule) to a messaging_automation (which holds
-- the template, sender, and contact list). No schedule lives on the campaign itself —
-- schedule is set here, on the automation.

create table if not exists campaign_automations (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  name             text        not null,
  search_name      text,
  search_criteria  jsonb       not null default '{}',
  messaging_automation_id uuid not null references messaging_automations(id) on delete cascade,
  schedule         text        not null default 'daily'
                               check (schedule in ('daily', 'weekly')),
  schedule_time    text        not null default '08:00',
  active           boolean     not null default true,
  last_run_at      timestamptz,
  next_run_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table campaign_automations enable row level security;

create policy "Users manage own campaign automations"
  on campaign_automations for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index campaign_automations_user_id_idx    on campaign_automations (user_id);
create index campaign_automations_next_run_at_idx on campaign_automations (next_run_at)
  where active = true;
