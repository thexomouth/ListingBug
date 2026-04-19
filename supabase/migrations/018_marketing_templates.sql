-- Marketing templates: save/load campaign message templates
CREATE TABLE IF NOT EXISTS marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  subject text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates"
  ON marketing_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
