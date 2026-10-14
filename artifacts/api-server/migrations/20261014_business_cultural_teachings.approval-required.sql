-- APPROVAL REQUIRED — SOURCE ONLY. Do not execute from application startup.
-- Optional owner-confirmed Business Cultural Teachings. This additive schema
-- creates no backfill, publication job, provider call, member memory, analytics,
-- targeting, recommendation, notification, or cross-business aggregation.
BEGIN;

CREATE TABLE business_cultural_teachings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  creator_owner_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(120) NOT NULL,
  teaching_body VARCHAR(700) NOT NULL,
  owner_confirmed_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_cultural_teachings_creator_key
    UNIQUE (business_id, creator_owner_user_id)
);

-- At most one active teaching may be available on a business detail surface.
CREATE UNIQUE INDEX business_cultural_teachings_one_active_business_key
  ON business_cultural_teachings (business_id)
  WHERE withdrawn_at IS NULL;
CREATE INDEX business_cultural_teachings_active_owner_idx
  ON business_cultural_teachings (business_id, creator_owner_user_id, withdrawn_at);

COMMIT;
