-- Ensure campaign_search_criteria has all columns that NewCampaign inserts
-- and send-campaign-emails reads. These may or may not already exist depending
-- on how the table was originally created in the dashboard.
alter table campaign_search_criteria
  add column if not exists active_status   text    not null default 'Active',
  add column if not exists year_built_min  integer,
  add column if not exists year_built_max  integer;
