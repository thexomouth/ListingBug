-- Migration 029: Add OAuth-specific fields for Gmail/Outlook sender integrations
-- Purpose: Support user-owned OAuth sending identities with token refresh and rate limiting

-- Add OAuth and sender management fields to integration_connections
ALTER TABLE integration_connections
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT,           -- Stable provider-side user ID (Gmail: email, Outlook: UPN)
  ADD COLUMN IF NOT EXISTS sending_email TEXT,                -- Email address used for sending
  ADD COLUMN IF NOT EXISTS is_primary_sender BOOLEAN DEFAULT false,  -- Primary sender for this user
  ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 500,   -- Daily send limit (Gmail: 500, Outlook: varies)
  ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0,  -- Current day's send count
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ,         -- Last daily counter reset
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,          -- Last time this sender was used
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW(),  -- When OAuth connection was established
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';      -- 'active' | 'expired' | 'revoked'

-- Create unique constraint on provider account (prevent duplicate connections)
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_connections_provider_account
  ON integration_connections(user_id, integration_id, provider_account_id)
  WHERE provider_account_id IS NOT NULL;

-- Create index for primary sender lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_primary_sender
  ON integration_connections(user_id, is_primary_sender)
  WHERE is_primary_sender = true AND status = 'active';

-- Create index for active OAuth senders
CREATE INDEX IF NOT EXISTS idx_integration_connections_oauth_active
  ON integration_connections(user_id, integration_id, status)
  WHERE integration_id IN ('gmail', 'outlook') AND status = 'active';

-- Comment for documentation
COMMENT ON COLUMN integration_connections.provider_account_id IS 'Stable provider-side user ID - prevents duplicate OAuth connections';
COMMENT ON COLUMN integration_connections.sending_email IS 'Email address used for sending messages (may differ from from_email)';
COMMENT ON COLUMN integration_connections.is_primary_sender IS 'If true, this is the user''s default sending identity';
COMMENT ON COLUMN integration_connections.daily_limit IS 'Maximum emails per day (Gmail: 500, Outlook: varies by account type)';
COMMENT ON COLUMN integration_connections.emails_sent_today IS 'Count of emails sent today - resets daily based on last_reset_at';
COMMENT ON COLUMN integration_connections.status IS 'Connection status: active (working), expired (needs reauth), revoked (user revoked access)';
