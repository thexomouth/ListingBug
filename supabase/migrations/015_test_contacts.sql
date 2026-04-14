-- Test contacts for sandbox campaign testing.
-- When a campaign's city = 'test', send-campaign-emails queries this table
-- instead of calling RentCast. Allows end-to-end email workflow testing
-- without hitting real data or spamming live agents.

create table if not exists test_contacts (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  agent_email text not null,
  agent_phone text,
  listing_address text not null,
  city text not null default 'Denver',
  state text not null default 'CO',
  price integer,
  listing_type text not null default 'For Sale',
  listed_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Seed with Jake Harris + three fake listings
insert into test_contacts (agent_name, agent_email, agent_phone, listing_address, city, state, price, listing_type, listed_date) values
  ('Jake Harris', 'emailjakeharris@gmail.com', '7203232744', '1234 Maple Drive', 'Denver', 'CO', 525000, 'For Sale', current_date),
  ('Jake Harris', 'emailjakeharris@gmail.com', '7203232744', '567 Oak Street',   'Denver', 'CO', 389000, 'For Sale', current_date - interval '1 day'),
  ('Jake Harris', 'emailjakeharris@gmail.com', '7203232744', '890 Pine Avenue',  'Denver', 'CO', 645000, 'For Sale', current_date - interval '2 days');
