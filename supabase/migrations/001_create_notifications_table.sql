-- Create notifications table for user notifications
-- Migration: Add notifications table with RLS policies
-- Purpose: Store notifications for automations, search saves, and integration events

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists notifications_user_id_created_at_idx 
  on public.notifications(user_id, created_at desc);

-- Enable row level security
alter table public.notifications enable row level security;

-- Create policy: Users can see their own notifications
create policy "Users see own notifications" on public.notifications
  for select
  using (auth.uid() = user_id);

-- Create policy: Users can update their own notifications (mark as read)
create policy "Users can update own notifications" on public.notifications
  for update
  using (auth.uid() = user_id);

-- Create policy: Users can delete their own notifications
create policy "Users can delete own notifications" on public.notifications
  for delete
  using (auth.uid() = user_id);

-- Create policy: Service role can insert notifications (for creating notifications from triggers/functions)
create policy "Service role can insert notifications" on public.notifications
  for insert
  with check (true);
