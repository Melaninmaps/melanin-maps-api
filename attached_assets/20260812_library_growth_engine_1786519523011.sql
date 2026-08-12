-- Mapping With Melanin — Privacy-Safe Library Growth Engine
-- Purpose: let Kinfolk turn aggregate unmet information needs into governed
-- Books, volumes, chapters, subchapters, and related-topic webs.
--
-- Safety rule: this schema intentionally does NOT copy raw user searches into
-- the Library growth queue. Only a sanitized, canonical subject is stored after
-- the chat/search policy layer has classified the request as eligible.
--
-- Run through the project migration runner. Verify live ID types before applying.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Sanitized signals created by Kinfolk after intent/privacy evaluation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_growth_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_subject TEXT NOT NULL,
  canonical_subject_key TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  suggested_node_type TEXT NOT NULL DEFAULT 'chapter'
    CHECK (suggested_node_type IN ('book', 'volume', 'chapter', 'subchapter', 'geography', 'general')),
  suggested_parent_topic_id TEXT NULL,
  geography_scope TEXT NULL,
  source_surface TEXT NOT NULL DEFAULT 'kinfolk_chat'
    CHECK (source_surface IN ('kinfolk_chat', 'universal_search', 'library_search', 'map_search')),
  user_fingerprint TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  learning_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  sensitivity_tier TEXT NOT NULL DEFAULT 'standard'
    CHECK (sensitivity_tier IN ('standard', 'professional', 'sensitive', 'excluded')),
  is_load_test BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT library_growth_signals_parent_fk
    FOREIGN KEY (suggested_parent_topic_id) REFERENCES knowledge_topics(id)
    ON DELETE SET NULL
);

-- Prevent repeat browser retries from inflating a subject signal for a person.
CREATE UNIQUE INDEX IF NOT EXISTS library_growth_signals_one_signal_per_subject_user_day
  ON library_growth_signals (
    canonical_subject_key,
    user_fingerprint,
    (occurred_at::date)
  )
  WHERE learning_eligible = TRUE AND is_load_test = FALSE;

CREATE INDEX IF NOT EXISTS library_growth_signals_aggregate_idx
  ON library_growth_signals (
    canonical_subject_key,
    suggested_category,
    suggested_parent_topic_id,
    occurred_at DESC
  )
  WHERE learning_eligible = TRUE AND is_load_test = FALSE;

-- -----------------------------------------------------------------------------
-- 2. Thresholded, reviewable requests for a new node or branch
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_growth_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_subject TEXT NOT NULL,
  canonical_subject_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  desired_node_type TEXT NOT NULL
    CHECK (desired_node_type IN ('book', 'volume', 'chapter', 'subchapter', 'geography', 'general')),
  parent_topic_id TEXT NULL,
  geography_scope TEXT NULL,
  distinct_user_count INTEGER NOT NULL DEFAULT 0,
  signal_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  sensitivity_tier TEXT NOT NULL DEFAULT 'standard'
    CHECK (sensitivity_tier IN ('standard', 'professional', 'sensitive')),
  proposed_status TEXT NOT NULL DEFAULT 'pending_threshold'
    CHECK (proposed_status IN (
      'pending_threshold', 'pending_review', 'approved', 'materialized', 'rejected', 'expired'
    )),
  rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT library_growth_candidates_parent_fk
    FOREIGN KEY (parent_topic_id) REFERENCES knowledge_topics(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS library_growth_candidates_review_idx
  ON library_growth_candidates (proposed_status, distinct_user_count DESC, last_seen_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Immutable governance record for promotion/rejection/materialization
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_growth_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES library_growth_candidates(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'materialized', 'merged', 'expired')),
  decided_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  materialized_topic_id TEXT NULL REFERENCES knowledge_topics(id) ON DELETE SET NULL,
  evidence_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_growth_decisions_candidate_idx
  ON library_growth_decisions (candidate_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Keep `updated_at` current without relying on caller discipline
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_library_growth_candidate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_library_growth_candidate_updated_at ON library_growth_candidates;
CREATE TRIGGER trg_library_growth_candidate_updated_at
  BEFORE UPDATE ON library_growth_candidates
  FOR EACH ROW EXECUTE FUNCTION set_library_growth_candidate_updated_at();

COMMIT;

-- Verification queries (run after migration):
-- SELECT to_regclass('public.library_growth_signals');
-- SELECT to_regclass('public.library_growth_candidates');
-- SELECT to_regclass('public.library_growth_decisions');
-- SELECT conrelid::regclass, conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid IN ('library_growth_signals'::regclass, 'library_growth_candidates'::regclass, 'library_growth_decisions'::regclass)
-- ORDER BY conrelid::text, conname;
