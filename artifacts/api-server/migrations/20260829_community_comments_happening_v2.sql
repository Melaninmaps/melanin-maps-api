BEGIN;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS comment_policy varchar(20) NOT NULL DEFAULT 'everyone';

ALTER TABLE community_post_comments
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS community_post_comments_active_idx
  ON community_post_comments (post_id, created_at DESC)
  WHERE status = 'active';

ALTER TABLE happening_now_stories
  ADD COLUMN IF NOT EXISTS topic_tags text[],
  ADD COLUMN IF NOT EXISTS scope varchar(20) NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS city varchar(120),
  ADD COLUMN IF NOT EXISTS state varchar(80),
  ADD COLUMN IF NOT EXISTS country varchar(80) NOT NULL DEFAULT 'United States',
  ADD COLUMN IF NOT EXISTS source_publisher varchar(180),
  ADD COLUMN IF NOT EXISTS source_status varchar(24) NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS community_post_id varchar(100);

CREATE INDEX IF NOT EXISTS happening_now_status_scope_created_idx
  ON happening_now_stories (status, scope, created_at DESC);

CREATE INDEX IF NOT EXISTS happening_now_city_state_idx
  ON happening_now_stories (lower(city), lower(state));

CREATE TABLE IF NOT EXISTS kinfolk_private_memories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  purpose varchar(40) NOT NULL DEFAULT 'personalization',
  source_session_id varchar(100),
  is_sensitive boolean NOT NULL DEFAULT false,
  consent_granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kinfolk_private_memories
  ADD COLUMN IF NOT EXISTS consent_granted_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS kinfolk_private_memories_user_active_idx
  ON kinfolk_private_memories (user_id, revoked_at, expires_at);

COMMIT;
