-- Migration 033: Add from_name to users table
-- Purpose: Allow users to set a display "From Name" shown in outgoing emails

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS from_name TEXT;
