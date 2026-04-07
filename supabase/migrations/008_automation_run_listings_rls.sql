-- automation_run_listings was created manually in the dashboard without RLS read
-- policies, so the frontend Supabase client gets silently blocked and the Results
-- page always shows "No listing data stored for this run."
-- This migration enables RLS (idempotent) and adds a read policy scoped to the
-- row's user_id so authenticated users can read their own run listings.

alter table if exists automation_run_listings enable row level security;

-- Drop first so this migration is re-runnable
drop policy if exists "Users read own automation run listings" on automation_run_listings;

create policy "Users read own automation run listings"
  on automation_run_listings for select
  using (auth.uid() = user_id);
