create table if not exists messaging_automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  template_id uuid references marketing_templates(id) on delete set null,
  subject text,
  body text,
  list_id uuid references marketing_lists(id) on delete cascade,
  sender_id text not null,
  schedule text not null default 'manual' check (schedule in ('manual', 'daily', 'weekly', 'monthly')),
  last_run_at timestamptz,
  total_sent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table messaging_automations enable row level security;

create policy "Users manage own messaging automations"
  on messaging_automations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
