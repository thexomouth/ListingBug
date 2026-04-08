CREATE TABLE IF NOT EXISTS campaign_suppressions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  campaign_id uuid       NOT NULL,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, email)
);

ALTER TABLE campaign_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign suppressions"
  ON campaign_suppressions FOR SELECT
  USING (auth.uid() = user_id);
