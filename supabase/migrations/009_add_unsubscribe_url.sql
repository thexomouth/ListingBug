-- Add unsubscribe_url to messaging_automations
-- Required for legal compliance when sending outbound marketing emails
ALTER TABLE messaging_automations ADD COLUMN IF NOT EXISTS unsubscribe_url text;
