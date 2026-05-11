-- 039: A/B/C/D message variants for campaigns
-- Adds optional variant columns (B, C, D) to campaigns so each campaign
-- can carry up to 4 alternate message versions.
-- Adds a variant column to campaign_sends to record which variant was sent.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS variant_b_subject       TEXT,
  ADD COLUMN IF NOT EXISTS variant_b_preview_text  TEXT,
  ADD COLUMN IF NOT EXISTS variant_b_body          TEXT,
  ADD COLUMN IF NOT EXISTS variant_c_subject       TEXT,
  ADD COLUMN IF NOT EXISTS variant_c_preview_text  TEXT,
  ADD COLUMN IF NOT EXISTS variant_c_body          TEXT,
  ADD COLUMN IF NOT EXISTS variant_d_subject       TEXT,
  ADD COLUMN IF NOT EXISTS variant_d_preview_text  TEXT,
  ADD COLUMN IF NOT EXISTS variant_d_body          TEXT;

ALTER TABLE campaign_sends
  ADD COLUMN IF NOT EXISTS variant TEXT NOT NULL DEFAULT 'A';
