-- Community Intelligence (SOURCE-ONLY REVIEW MIGRATION)
--
-- Do not apply without separate written approval for a staging/production
-- database change and explicit feature activation. This migration is additive;
-- it is intentionally not called from application code, startup hooks, or any
-- automatic migration path.
--
-- Privacy boundary: no question text, free-form feedback, message IDs, location,
-- profile, memory, document, calendar, or sensitive-category fields are stored.

CREATE TABLE IF NOT EXISTS kinfolk_community_intelligence_preferences (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  participation_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kinfolk_community_intelligence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_type VARCHAR(24) NOT NULL CHECK (journey_type IN ('wedding', 'birthday')),
  journey_stage VARCHAR(24) NOT NULL CHECK (journey_stage IN ('inspiration')),
  intent VARCHAR(24) NOT NULL CHECK (intent IN ('planning')),
  category_key VARCHAR(80) NOT NULL,
  action VARCHAR(24) NOT NULL CHECK (action IN ('helpful', 'not_relevant', 'already_handled')),
  collection_version VARCHAR(24) NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '180 days'),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS kinfolk_ci_events_active_aggregate_idx
  ON kinfolk_community_intelligence_events (journey_type, journey_stage, category_key, action, created_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS kinfolk_ci_events_user_active_idx
  ON kinfolk_community_intelligence_events (user_id, created_at DESC)
  WHERE revoked_at IS NULL;
