-- APPROVAL REQUIRED — SOURCE ONLY. Do not execute from application startup.
--
-- Organization Transparency is a separate, additive model for factual
-- organization identity, locations, ownership claims, member experience,
-- clinical-information source receipts, and audit history. It intentionally
-- creates no profile backfill, publication job, map pin, Kinfolk answer,
-- notification, recommendation, promotion, analytics process, or provider call.
-- Existing businesses, reviews, users, member uploads, source records, and
-- production/staging services are not modified by this migration.
BEGIN;

CREATE TABLE organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  organization_type VARCHAR(40) NOT NULL,
  ownership_status VARCHAR(40) NOT NULL DEFAULT 'unknown',
  website VARCHAR(512),
  phone VARCHAR(40),

  -- Each surface is independently moderated. A factual listing can be public
  -- without a map pin, Kinfolk use, or promotion.
  factual_status VARCHAR(40) NOT NULL DEFAULT 'pending_moderation',
  search_status VARCHAR(40) NOT NULL DEFAULT 'not_eligible',
  map_pin_status VARCHAR(40) NOT NULL DEFAULT 'not_eligible',
  kinfolk_status VARCHAR(40) NOT NULL DEFAULT 'not_eligible',
  promotion_status VARCHAR(40) NOT NULL DEFAULT 'not_eligible',
  experience_status VARCHAR(40) NOT NULL DEFAULT 'review_required',

  submitted_by_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  submission_relationship VARCHAR(40),
  client_request_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT organization_profiles_type_check CHECK (organization_type IN (
    'business', 'employer', 'healthcare_facility', 'hospital', 'school',
    'professional_service', 'retailer', 'nonprofit', 'government_service', 'other'
  )),
  CONSTRAINT organization_profiles_ownership_check CHECK (ownership_status IN (
    'unknown', 'self_identified_minority_owned', 'verified_minority_owned', 'non_minority_owned'
  )),
  CONSTRAINT organization_profiles_factual_status_check CHECK (factual_status IN (
    'pending_moderation', 'factual_approved', 'correction_requested', 'hidden', 'rejected'
  )),
  CONSTRAINT organization_profiles_surface_status_check CHECK (
    search_status IN ('not_eligible', 'review_required', 'eligible', 'suppressed')
    AND map_pin_status IN ('not_eligible', 'review_required', 'eligible', 'suppressed')
    AND kinfolk_status IN ('not_eligible', 'review_required', 'eligible', 'suppressed')
    AND promotion_status IN ('not_eligible', 'review_required', 'eligible', 'suppressed')
    AND experience_status IN ('not_eligible', 'review_required', 'eligible', 'suppressed')
  )
);

CREATE UNIQUE INDEX organization_profiles_member_request_key
  ON organization_profiles (submitted_by_member_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
CREATE INDEX organization_profiles_exact_name_status_idx
  ON organization_profiles (LOWER(BTRIM(legal_name)), factual_status);
CREATE INDEX organization_profiles_surface_states_idx
  ON organization_profiles (factual_status, search_status, map_pin_status, kinfolk_status, promotion_status);

CREATE TABLE organization_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  location_name VARCHAR(255),
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(32),
  country VARCHAR(100),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  location_status VARCHAR(40) NOT NULL DEFAULT 'pending_moderation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT organization_locations_status_check CHECK (location_status IN (
    'pending_moderation', 'factual_approved', 'correction_requested', 'hidden', 'rejected'
  ))
);
CREATE UNIQUE INDEX organization_locations_one_primary_per_organization
  ON organization_locations (organization_id) WHERE is_primary = TRUE;
CREATE INDEX organization_locations_exact_city_state_idx
  ON organization_locations (LOWER(BTRIM(city)), state, organization_id);

CREATE TABLE organization_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  organization_location_id UUID REFERENCES organization_locations(id) ON DELETE RESTRICT,
  author_member_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  relationship VARCHAR(40) NOT NULL,
  experience_context VARCHAR(20) NOT NULL,
  category_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative TEXT,
  privacy_level VARCHAR(40) NOT NULL DEFAULT 'pseudonymous_public',
  moderation_status VARCHAR(40) NOT NULL DEFAULT 'pending_moderation',
  reviewer_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  moderated_at TIMESTAMPTZ,
  moderation_note VARCHAR(2000),
  client_request_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT organization_experiences_relationship_check CHECK (relationship IN (
    'current_employee', 'former_employee', 'contractor', 'job_applicant',
    'customer', 'patient', 'caregiver'
  )),
  CONSTRAINT organization_experiences_context_check CHECK (experience_context IN ('workplace', 'customer', 'care')),
  CONSTRAINT organization_experiences_relationship_context_check CHECK (
    (relationship IN ('patient', 'caregiver') AND experience_context = 'care') OR
    (relationship IN ('current_employee', 'former_employee', 'contractor', 'job_applicant') AND experience_context = 'workplace') OR
    (relationship = 'customer' AND experience_context = 'customer')
  ),
  CONSTRAINT organization_experiences_categories_array_check CHECK (jsonb_typeof(category_codes) = 'array'),
  CONSTRAINT organization_experiences_privacy_check CHECK (privacy_level IN ('pseudonymous_public', 'private_to_moderators')),
  CONSTRAINT organization_experiences_moderation_check CHECK (moderation_status IN (
    'pending_moderation', 'published', 'held', 'rejected', 'withdrawn'
  ))
);
CREATE UNIQUE INDEX organization_experiences_member_request_key
  ON organization_experiences (organization_id, author_member_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
CREATE INDEX organization_experiences_public_summary_idx
  ON organization_experiences (organization_id, moderation_status, privacy_level, created_at DESC);

-- A claim establishes a limited ability to submit correction, response, and
-- dispute requests after human verification. It never changes experience state.
CREATE TABLE organization_owner_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  claimant_member_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  claim_note VARCHAR(2000),
  status VARCHAR(40) NOT NULL DEFAULT 'pending_verification',
  reviewer_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  review_note VARCHAR(2000),
  reviewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_owner_claims_status_check CHECK (status IN (
    'pending_verification', 'approved', 'rejected', 'revoked'
  ))
);
CREATE UNIQUE INDEX organization_owner_claims_one_pending_per_member
  ON organization_owner_claims (organization_id, claimant_member_id)
  WHERE status = 'pending_verification';
CREATE INDEX organization_owner_claims_access_idx
  ON organization_owner_claims (organization_id, claimant_member_id, status, revoked_at);

CREATE TABLE organization_owner_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  actor_member_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action_type VARCHAR(40) NOT NULL,
  target_experience_id UUID REFERENCES organization_experiences(id) ON DELETE RESTRICT,
  field_name VARCHAR(100),
  corrected_value VARCHAR(1000),
  body VARCHAR(2000) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending_moderation',
  reviewer_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_owner_actions_type_check CHECK (action_type IN (
    'public_response', 'factual_correction', 'dispute'
  )),
  CONSTRAINT organization_owner_actions_status_check CHECK (status IN (
    'pending_moderation', 'published', 'held', 'rejected', 'withdrawn'
  )),
  CONSTRAINT organization_owner_actions_shape_check CHECK (
    (action_type = 'public_response' AND target_experience_id IS NOT NULL) OR
    (action_type = 'factual_correction' AND field_name IS NOT NULL AND corrected_value IS NOT NULL) OR
    (action_type = 'dispute')
  )
);
CREATE INDEX organization_owner_actions_review_idx
  ON organization_owner_actions (organization_id, status, created_at DESC);

-- Separate source-backed clinical information. Patient/caregiver and staff
-- experience is never inserted here and cannot become a medical-quality claim.
CREATE TABLE organization_clinical_information_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  organization_location_id UUID REFERENCES organization_locations(id) ON DELETE RESTRICT,
  source_type VARCHAR(40) NOT NULL,
  publisher_name VARCHAR(255) NOT NULL,
  source_title VARCHAR(500) NOT NULL,
  source_url VARCHAR(1024) NOT NULL,
  source_published_at TIMESTAMPTZ,
  source_observed_at TIMESTAMPTZ NOT NULL,
  reviewed_by_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  review_status VARCHAR(40) NOT NULL DEFAULT 'pending_moderation',
  notes VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_clinical_information_source_type_check CHECK (source_type IN (
    'official_facility', 'government', 'accreditor', 'licensing_board', 'professional_association', 'other_authoritative'
  )),
  CONSTRAINT organization_clinical_information_review_check CHECK (review_status IN (
    'pending_moderation', 'published', 'held', 'rejected', 'withdrawn'
  ))
);
CREATE UNIQUE INDEX organization_clinical_information_source_url_key
  ON organization_clinical_information_sources (organization_id, source_url);
CREATE INDEX organization_clinical_information_public_idx
  ON organization_clinical_information_sources (organization_id, review_status, source_observed_at DESC);

CREATE TABLE organization_transparency_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE RESTRICT,
  actor_member_id VARCHAR(255) REFERENCES users(id) ON DELETE RESTRICT,
  actor_kind VARCHAR(20) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_transparency_audit_actor_kind_check CHECK (actor_kind IN ('member', 'owner', 'admin', 'system'))
);
CREATE INDEX organization_transparency_audit_organization_idx
  ON organization_transparency_audit_events (organization_id, created_at DESC);

COMMIT;
