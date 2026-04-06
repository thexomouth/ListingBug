-- Add is_admin flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Promote the primary admin account
UPDATE users SET is_admin = true WHERE id = 'c7b3040c-941d-417a-b6a1-910b72c48e09';
