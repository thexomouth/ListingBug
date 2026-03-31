-- Suppression list: emails that should never be synced to marketing destinations
CREATE TABLE IF NOT EXISTS suppression_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, email)
);

ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own suppression list"
  ON suppression_list
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
