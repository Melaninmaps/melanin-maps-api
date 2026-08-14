-- SURGICAL PATCH 05 — beta safety and public visibility
-- Run in a transaction on staging first. This is reversible except for index creation.

BEGIN;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_duplicate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of_id uuid NULL,
  ADD COLUMN IF NOT EXISTS permanently_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS businesses_public_visibility_idx
  ON businesses (status, listing_status, is_duplicate, permanently_hidden)
  WHERE status = 'active'
    AND COALESCE(is_duplicate, false) = false
    AND COALESCE(permanently_hidden, false) = false;

CREATE INDEX IF NOT EXISTS businesses_search_name_lower_idx
  ON businesses (lower(name));

-- Do not physically delete duplicate records.
-- Preserve canonical IDs and mark confirmed duplicates consistently.
UPDATE businesses
SET is_duplicate = true,
    permanently_hidden = true
WHERE COALESCE(is_duplicate, false) = true
   OR COALESCE(permanently_hidden, false) = true;

-- Public view used by list/map/detail queries.
CREATE OR REPLACE VIEW public_businesses AS
SELECT b.*
FROM businesses b
WHERE b.status = 'active'
  AND COALESCE(b.is_duplicate, false) = false
  AND COALESCE(b.permanently_hidden, false) = false
  AND COALESCE(b.listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed');

COMMIT;

-- Verification queries (must return zero rows for the public leak checks).
-- 1. Active duplicate leakage:
SELECT id, name, city, listing_status, is_duplicate, permanently_hidden
FROM businesses
WHERE status = 'active'
  AND (COALESCE(is_duplicate, false) = true OR COALESCE(permanently_hidden, false) = true);

-- 2. Duplicate rows lacking a canonical pointer:
SELECT id, name
FROM businesses
WHERE is_duplicate = true AND duplicate_of_id IS NULL;

-- 3. Duke canonical consistency:
SELECT name, COUNT(*) AS rows,
       COUNT(*) FILTER (WHERE is_duplicate = false AND permanently_hidden = false) AS visible_rows,
       COUNT(*) FILTER (WHERE is_duplicate = true) AS duplicate_rows
FROM businesses
WHERE lower(regexp_replace(name, '[^a-z0-9]', '', 'g')) LIKE '%duke%cafe%'
GROUP BY name;

-- 4. Public view leakage:
SELECT id, name
FROM public_businesses
WHERE is_duplicate = true OR permanently_hidden = true;
