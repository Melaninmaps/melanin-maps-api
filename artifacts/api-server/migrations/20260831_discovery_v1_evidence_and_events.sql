-- DOCUMENTATION-ONLY MIRROR. Do not execute this file independently.
-- Runtime authority is the idempotent discovery_v1_evidence_and_events entry in
-- src/lib/startup-migrations.ts, which is applied by the guarded startup path.
BEGIN;
CREATE TABLE IF NOT EXISTS discovery_taxonomy_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind varchar(32) NOT NULL CHECK (kind IN ('category','specialty','offering','community_tag')),
  canonical_label varchar(200) NOT NULL, normalized_label varchar(200) NOT NULL, status varchar(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','retired')),
  created_by varchar(100), reviewed_by varchar(100), reviewed_at timestamptz, audit_note text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind, normalized_label)
);
CREATE TABLE IF NOT EXISTS discovery_taxonomy_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), concept_id uuid NOT NULL REFERENCES discovery_taxonomy_concepts(id) ON DELETE CASCADE,
  synonym varchar(200) NOT NULL, normalized_synonym varchar(200) NOT NULL, status varchar(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','retired')),
  source_kind varchar(32) NOT NULL CHECK (source_kind IN ('owner','approved_source','governed_community','curator')), reviewed_by varchar(100), reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(concept_id, normalized_synonym)
);
CREATE TABLE IF NOT EXISTS business_offering_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id varchar(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, concept_id uuid REFERENCES discovery_taxonomy_concepts(id),
  normalized_label varchar(200) NOT NULL, label varchar(200) NOT NULL, kind varchar(32) NOT NULL CHECK (kind IN ('owner_offering','menu_or_offering_source','community_tag')),
  source_url text, as_of timestamptz, confidence varchar(32) NOT NULL DEFAULT 'supported' CHECK (confidence IN ('exact','supported','contextual')), status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  submitted_by varchar(100), reviewed_by varchar(100), reviewed_at timestamptz, audit_note text, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offering_evidence_source_required CHECK (kind = 'owner_offering' OR source_url IS NOT NULL),
  CONSTRAINT offering_evidence_https_source CHECK (source_url IS NULL OR source_url ~* '^https://')
);
ALTER TABLE business_offering_evidence ADD COLUMN IF NOT EXISTS confidence varchar(32);
UPDATE business_offering_evidence SET confidence = 'supported' WHERE confidence IS NULL OR confidence NOT IN ('exact','supported','contextual');
ALTER TABLE business_offering_evidence ALTER COLUMN confidence SET DEFAULT 'supported', ALTER COLUMN confidence SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_offering_evidence_confidence_check') THEN
    ALTER TABLE business_offering_evidence
      ADD CONSTRAINT business_offering_evidence_confidence_check
      CHECK (confidence IN ('exact','supported','contextual'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS business_offering_evidence_approved_search_idx ON business_offering_evidence (normalized_label, business_id) WHERE status = 'approved';
CREATE TABLE IF NOT EXISTS discovery_events_v1 (
  event_id uuid PRIMARY KEY, idempotency_key varchar(200) NOT NULL UNIQUE, event_name varchar(32) NOT NULL, consent_version varchar(50) NOT NULL,
  member_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surface varchar(32) NOT NULL, platform varchar(32) NOT NULL, entry_point varchar(100) NOT NULL, app_version varchar(64) NOT NULL,
  request_id uuid, result_set_id uuid, normalized_intent varchar(160), structured_filters jsonb NOT NULL DEFAULT '{}'::jsonb, coarse_location_bucket varchar(160), radius_miles smallint,
  result_id varchar(160), rank integer, record_type varchar(32), result_count integer, zero_result boolean, latency_ms integer, fallback_state varchar(80),
  created_at timestamptz NOT NULL DEFAULT now(), retention_expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'), deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS discovery_events_v1_aggregate_idx ON discovery_events_v1 (event_name, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS discovery_events_v1_member_retention_idx ON discovery_events_v1 (member_id, retention_expires_at) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS discovery_member_preferences (
  member_id varchar(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  search_improvement boolean NOT NULL DEFAULT false, consent_version varchar(50) NOT NULL DEFAULT 'v1',
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;