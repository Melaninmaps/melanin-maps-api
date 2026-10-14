-- SOURCE-ONLY REVIEW MIGRATION — DO NOT AUTO-APPLY
--
-- Purpose: complete the private member-to-business-owner lifecycle with
-- auditable owner links, private claim-code verification records, and
-- expiring manager invitations. This migration is deliberately excluded from
-- runtime/startup migration execution and must be reviewed and applied
-- explicitly in isolated staging before any production approval.
--
-- Privacy rules:
--   * claim contact addresses and phone numbers remain in private claim tables;
--     no migration copies them into public business records.
--   * one-time codes and invitations are stored only as HMAC hashes.
--   * no migration assigns any owner, manager, business eligibility,
--     verification designation, promotion, or public profile value.

BEGIN;

-- Lifecycle state stays distinct from public verification, eligibility,
-- promotion, ranking, and ownership-designation claims. Nullable values keep
-- legacy listing behavior on the route's explicit compatibility fallback.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS ownership_control_status varchar(32),
  ADD COLUMN IF NOT EXISTS publication_status varchar(32),
  ADD COLUMN IF NOT EXISTS verification_status varchar(32);

-- `business_claims` predates the reviewed ownership-control flow. These
-- additive fields retain the evidence, attestation, private-review decision,
-- and audit timestamps used by the protected route; they grant no access on
-- their own and no column is copied back to a public business profile.
ALTER TABLE business_claims
  ADD COLUMN IF NOT EXISTS claim_type varchar(64) NOT NULL DEFAULT 'ownership_control',
  ADD COLUMN IF NOT EXISTS verification_method varchar(64),
  ADD COLUMN IF NOT EXISTS evidence_url varchar(500),
  ADD COLUMN IF NOT EXISTS evidence_summary varchar(255),
  ADD COLUMN IF NOT EXISTS attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_reason varchar(1000),
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(255),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

ALTER TABLE business_owner_links
  ADD COLUMN IF NOT EXISTS claim_id varchar(255),
  ADD COLUMN IF NOT EXISTS approved_by varchar(255),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by varchar(255),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revocation_reason varchar(1000),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS business_owner_links_active_lookup_idx
  ON business_owner_links (business_id, user_id, role, status)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS business_claim_verification_challenges (
  id varchar(255) PRIMARY KEY,
  claim_id varchar(255) NOT NULL REFERENCES business_claims(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel varchar(16) NOT NULL CHECK (channel IN ('email', 'sms')),
  target varchar(255) NOT NULL,
  code_hash varchar(128),
  provider_reference varchar(255),
  status varchar(32) NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'verified', 'expired', 'locked', 'delivery_failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  delivery_error varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((channel = 'email' AND code_hash IS NOT NULL) OR (channel = 'sms' AND provider_reference IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS business_claim_verification_active_idx
  ON business_claim_verification_challenges (claim_id, user_id, status, expires_at DESC);

CREATE TABLE IF NOT EXISTS business_manager_invitations (
  id varchar(255) PRIMARY KEY,
  business_id varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  inviter_user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invited_email varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'manager' CHECK (role = 'manager'),
  code_hash varchar(128) NOT NULL UNIQUE,
  status varchar(32) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked', 'delivery_failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  expires_at timestamptz NOT NULL,
  accepted_by_user_id varchar(255) REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_by varchar(255) REFERENCES users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_manager_invitations_pending_email_idx
  ON business_manager_invitations (business_id, lower(invited_email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS business_manager_invitations_owner_idx
  ON business_manager_invitations (business_id, status, expires_at DESC);

COMMIT;
