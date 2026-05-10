-- Migration 036: Fix notifications INSERT policy and lock down the table
-- The original INSERT policy used WITH CHECK (true), allowing any authenticated user
-- to insert notifications for any user_id. Notifications are also not currently used
-- in the frontend. Dropping the permissive INSERT policy so only the service role
-- (edge functions) can insert — service role bypasses RLS so no explicit policy needed.

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
