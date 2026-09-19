-- Reversible existing-directory reconciliation. Never delete a business row.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dedupe_key varchar(500);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_duplicate boolean NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS duplicate_of_id varchar(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS permanently_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS data_source varchar(100);

CREATE TABLE IF NOT EXISTS business_duplicate_resolutions (
  job_id uuid NOT NULL,
  canonical_business_id varchar(255) NOT NULL REFERENCES businesses(id),
  superseded_business_id varchar(255) PRIMARY KEY REFERENCES businesses(id),
  identity_evidence jsonb NOT NULL,
  policy_version varchar(80) NOT NULL,
  scoring jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_duplicate_resolutions_canonical_idx
  ON business_duplicate_resolutions (canonical_business_id);
CREATE INDEX IF NOT EXISTS businesses_dedupe_key_idx ON businesses (dedupe_key);

-- Every existing public surface reads this view, so one predicate governs all
-- search/map/discovery/Kinfolk consumers.
CREATE OR REPLACE VIEW public.public_businesses AS
SELECT b.* FROM public.businesses b
WHERE COALESCE(b.status, '') = 'active'
  AND COALESCE(b.listing_status, '') IN ('live_unclaimed', 'live_claimed')
  AND COALESCE(b.permanently_hidden, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM public.business_duplicate_resolutions d
    WHERE d.superseded_business_id = b.id
  );