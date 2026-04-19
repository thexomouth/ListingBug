-- Allow user_id to be nullable so shared (platform-owned) templates have no user owner
ALTER TABLE marketing_templates ALTER COLUMN user_id DROP NOT NULL;

-- Mark shared/platform templates
ALTER TABLE marketing_templates ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

-- Drop old policy and replace with one that also exposes shared templates to all authenticated users
DROP POLICY IF EXISTS "Users manage own templates" ON marketing_templates;

-- Read: own templates OR any shared template
CREATE POLICY "Users read own and shared templates"
  ON marketing_templates FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

-- Insert/update/delete: only own templates
CREATE POLICY "Users write own templates"
  ON marketing_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own templates"
  ON marketing_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own templates"
  ON marketing_templates FOR DELETE
  USING (auth.uid() = user_id);
