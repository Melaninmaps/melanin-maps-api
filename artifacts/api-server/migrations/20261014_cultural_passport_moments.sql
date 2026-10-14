-- Cultural Passport is a private, member-confirmed record of meaningful moments.
-- This source migration is intentionally not applied by this change.
-- It contains no points, levels, streaks, achievement state, completion state,
-- or inferred engagement activity.
BEGIN;

CREATE TABLE IF NOT EXISTS cultural_passport_moments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind varchar(40) NOT NULL CHECK (kind IN (
    'place',
    'event',
    'food',
    'music',
    'story',
    'community_voice',
    'learning'
  )),
  title varchar(180) NOT NULL,
  note text,
  source_label varchar(180),
  source_url text,
  member_confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

CREATE INDEX IF NOT EXISTS cultural_passport_moments_owner_active_created_idx
  ON cultural_passport_moments (user_id, removed_at, created_at DESC);

COMMIT;
