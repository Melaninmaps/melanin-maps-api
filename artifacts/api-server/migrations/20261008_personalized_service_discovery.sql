-- REVIEW-ONLY MIGRATION. This file is intentionally not invoked by production
-- startup code. Apply only after separate production migration approval.
BEGIN;

CREATE TABLE IF NOT EXISTS business_service_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_key VARCHAR(64) NOT NULL,
  service_label VARCHAR(160) NOT NULL,
  policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_text VARCHAR(120),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 1440),
  booking_url TEXT,
  evidence_state VARCHAR(40) NOT NULL DEFAULT 'unverified'
    CHECK (evidence_state IN ('owner_confirmed', 'official_source_documented', 'unverified')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'held')),
  source_url TEXT,
  source_label VARCHAR(255),
  observed_at TIMESTAMPTZ,
  confidence VARCHAR(12) CHECK (confidence IS NULL OR confidence IN ('high', 'medium', 'low')),
  last_confirmed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, service_key),
  CHECK (
    evidence_state = 'unverified'
    OR (source_url IS NOT NULL AND source_label IS NOT NULL AND observed_at IS NOT NULL AND confidence IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS business_service_offerings_match_idx
  ON business_service_offerings (service_key, status, evidence_state);

CREATE TABLE IF NOT EXISTS business_service_offering_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  actor_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(20) NOT NULL CHECK (actor_role IN ('admin', 'owner')),
  change_note TEXT NOT NULL CHECK (char_length(trim(change_note)) BETWEEN 3 AND 1000),
  before_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  after_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit history is append-only. Operational rollback is a new audited change.
CREATE OR REPLACE FUNCTION prohibit_business_service_offering_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'business_service_offering_audit_events are append-only';
END; $$;
DROP TRIGGER IF EXISTS business_service_offering_audit_events_immutable ON business_service_offering_audit_events;
CREATE TRIGGER business_service_offering_audit_events_immutable
  BEFORE UPDATE OR DELETE ON business_service_offering_audit_events
  FOR EACH ROW EXECUTE FUNCTION prohibit_business_service_offering_audit_mutation();

COMMIT;
