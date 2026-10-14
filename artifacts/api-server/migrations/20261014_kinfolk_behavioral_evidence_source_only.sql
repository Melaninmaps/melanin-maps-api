-- SOURCE-ONLY / APPROVAL REQUIRED: do not execute automatically or apply without
-- explicit database approval in an isolated, authorized environment.
-- Kinfolk V1 behavioral evidence is separate from memories, preferences,
-- Current Chapter, sessions, analytics, Directory, Map, Community, and Library.
BEGIN;

CREATE TABLE IF NOT EXISTS kinfolk_behavioral_evidence_settings (
  user_id varchar(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mode varchar(12) NOT NULL DEFAULT 'off',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_behavioral_evidence_settings_mode_check
    CHECK (mode IN ('off', 'review', 'on'))
);

CREATE TABLE IF NOT EXISTS kinfolk_behavioral_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_key varchar(64) NOT NULL,
  stance varchar(16) NOT NULL,
  count integer NOT NULL DEFAULT 1,
  status varchar(16) NOT NULL,
  provenance varchar(48) NOT NULL,
  first_observed_at timestamptz NOT NULL DEFAULT now(),
  last_observed_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kinfolk_behavioral_evidence_owner_signal_stance_key
    UNIQUE (user_id, signal_key, stance),
  CONSTRAINT kinfolk_behavioral_evidence_signal_key_check
    CHECK (signal_key IN ('business_discovery', 'culture_entertainment', 'travel_planning', 'education_discovery', 'hobby_lifestyle')),
  CONSTRAINT kinfolk_behavioral_evidence_stance_check
    CHECK (stance IN ('helpful', 'not_helpful')),
  CONSTRAINT kinfolk_behavioral_evidence_status_check
    CHECK (status IN ('pending', 'active')),
  CONSTRAINT kinfolk_behavioral_evidence_count_check
    CHECK (count > 0 AND count <= 1000000),
  CONSTRAINT kinfolk_behavioral_evidence_provenance_check
    CHECK (provenance = 'response_feedback_v1')
);

CREATE INDEX IF NOT EXISTS kinfolk_behavioral_evidence_owner_review_idx
  ON kinfolk_behavioral_evidence (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS kinfolk_behavioral_evidence_owner_active_signal_idx
  ON kinfolk_behavioral_evidence (user_id, status, signal_key);

COMMIT;
