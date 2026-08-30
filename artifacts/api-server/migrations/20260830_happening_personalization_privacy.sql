BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS home_state varchar(2);
UPDATE users
SET home_state = upper((regexp_match(home_city, ',\s*([A-Za-z]{2})(?:\s|$)'))[1])
WHERE home_state IS NULL AND home_city ~ ',\s*[A-Za-z]{2}(?:\s|$)';

CREATE TABLE IF NOT EXISTS happening_topic_interest_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category varchar(50),
  topic_id varchar(100),
  consented_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT happening_topic_interest_identifier CHECK (category IS NOT NULL OR topic_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS happening_topic_interest_events_active_idx
  ON happening_topic_interest_events (user_id, revoked_at, created_at DESC);

COMMIT;