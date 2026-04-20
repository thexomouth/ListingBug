-- Migration 027: Add sender identity fields to integration_connections and campaigns
-- Purpose: Support user-owned sending identities (Gmail, Outlook, SMTP, etc.)

-- Add sender identity fields to integration_connections
ALTER TABLE integration_connections
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS from_name TEXT,
  ADD COLUMN IF NOT EXISTS is_sender BOOLEAN DEFAULT false;

-- Add default sender tracking to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_sender_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL;

-- Add sender tracking to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL;

-- Create index for efficient sender lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_sender
  ON integration_connections(user_id, is_sender)
  WHERE is_sender = true;

-- Create index for user default sender lookups
CREATE INDEX IF NOT EXISTS idx_users_default_sender
  ON users(default_sender_id)
  WHERE default_sender_id IS NOT NULL;

-- Create index for campaign sender lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_sender
  ON campaigns(sender_id)
  WHERE sender_id IS NOT NULL;
