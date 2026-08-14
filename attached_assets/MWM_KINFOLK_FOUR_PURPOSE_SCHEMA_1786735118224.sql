-- MWM KinfolkAI Four-Purpose Schema Patch
-- Idempotent and additive. Run in staging first; do not delete existing data.

CREATE TABLE IF NOT EXISTS kinfolk_flywheel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'business_view','business_save','business_checkin','business_vibe',
    'library_follow','library_open','kinfolk_query'
  )),
  canonical_subject text NOT NULL,
  source_surface text NOT NULL,
  event_day date NOT NULL DEFAULT CURRENT_DATE,
  learning_eligible boolean NOT NULL DEFAULT false,
  is_load_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS kinfolk_flywheel_event_dedupe_idx
  ON kinfolk_flywheel_events(user_id, event_type, canonical_subject, source_surface, event_day);

CREATE INDEX IF NOT EXISTS kinfolk_flywheel_subject_idx
  ON kinfolk_flywheel_events(canonical_subject, event_type, event_day);

ALTER TABLE business_review_items
  ADD COLUMN IF NOT EXISTS evidence_status text NOT NULL DEFAULT 'pending';

ALTER TABLE business_review_items
  ADD COLUMN IF NOT EXISTS source_evidence jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE business_review_items
  ADD COLUMN IF NOT EXISTS review_reason text;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS promotion_status text NOT NULL DEFAULT 'organic';

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS promotion_source_url text;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS promotion_disclosure text;

-- Safety: server-authoritative public business index. Adapt column names only if
-- the current schema uses a different permanent-hidden field.
CREATE INDEX IF NOT EXISTS businesses_public_kinfolk_idx
  ON businesses(city, category, verified)
  WHERE status = 'active'
    AND COALESCE(is_duplicate, false) = false
    AND COALESCE(permanently_hidden, false) = false;

-- Source evidence is append-only per URL/business pair.
CREATE TABLE IF NOT EXISTS kinfolk_answer_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  user_id uuid,
  purpose text NOT NULL CHECK (purpose IN ('education','safety','promotion')),
  title text NOT NULL,
  url text NOT NULL,
  source_label text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, url)
);

CREATE INDEX IF NOT EXISTS kinfolk_answer_sources_request_idx
  ON kinfolk_answer_sources(request_id, purpose);
