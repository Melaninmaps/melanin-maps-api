-- Replit business deduplication migration.
-- PostgreSQL. Run the SELECT audit first. Do not hard-delete rows.

BEGIN;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS normalized_name text,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS duplicate_of_id uuid NULL REFERENCES businesses(id),
  ADD COLUMN IF NOT EXISTS is_duplicate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_reason text,
  ADD COLUMN IF NOT EXISTS duplicate_marked_at timestamptz;

-- Populate normalized identity fields. Coordinates are rounded to 5 decimals.
UPDATE businesses
SET normalized_name = trim(regexp_replace(lower(unaccent(coalesce(name, ''))), '[^a-z0-9]+', ' ', 'g'));

UPDATE businesses
SET dedupe_key = CASE
  WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN
    normalized_name || '|geo:' || round(latitude::numeric, 5) || ',' || round(longitude::numeric, 5)
  WHEN nullif(trim(address), '') IS NOT NULL THEN
    normalized_name || '|' || trim(regexp_replace(lower(unaccent(coalesce(city, ''))), '[^a-z0-9]+', ' ', 'g')) || '|' ||
    trim(regexp_replace(lower(unaccent(coalesce(state, ''))), '[^a-z0-9]+', ' ', 'g')) || '|addr:' ||
    trim(regexp_replace(lower(unaccent(address)), '[^a-z0-9]+', ' ', 'g'))
  ELSE
    normalized_name || '|' || trim(regexp_replace(lower(unaccent(coalesce(city, ''))), '[^a-z0-9]+', ' ', 'g')) || '|' ||
    trim(regexp_replace(lower(unaccent(coalesce(state, ''))), '[^a-z0-9]+', ' ', 'g')) || '|no-location'
END;

-- DRY RUN: inspect proposed duplicate groups before applying.
SELECT dedupe_key, count(*) AS records,
       array_agg(id ORDER BY id) AS record_ids,
       min(name) AS example_name
FROM businesses
WHERE coalesce(is_duplicate, false) = false
GROUP BY dedupe_key
HAVING count(*) > 1
ORDER BY records DESC;

-- APPLY: keep the most complete row; mark all other rows as duplicates.
WITH ranked AS (
  SELECT id,
         first_value(id) OVER (
           PARTITION BY dedupe_key
           ORDER BY
             (CASE WHEN nullif(trim(website), '') IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN nullif(trim(phone), '') IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN nullif(trim(address), '') IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN longitude IS NOT NULL THEN 1 ELSE 0 END) DESC,
             id
         ) AS canonical_id,
         count(*) OVER (PARTITION BY dedupe_key) AS group_size
  FROM businesses
  WHERE coalesce(is_duplicate, false) = false
), to_mark AS (
  SELECT id, canonical_id
  FROM ranked
  WHERE group_size > 1 AND id <> canonical_id
)
UPDATE businesses b
SET is_duplicate = true,
    duplicate_of_id = t.canonical_id,
    duplicate_reason = 'same normalized name and identical coordinates, or exact normalized address/city/state',
    duplicate_marked_at = now(),
    status = 'duplicate'
FROM to_mark t
WHERE b.id = t.id;

-- Prevent future duplicates. The partial unique index allows only one active canonical row per key.
CREATE UNIQUE INDEX IF NOT EXISTS businesses_active_dedupe_key_unique
ON businesses (dedupe_key)
WHERE coalesce(is_duplicate, false) = false;

COMMIT;

-- Reversal example for a mistakenly marked row:
-- UPDATE businesses SET is_duplicate=false, duplicate_of_id=NULL, duplicate_reason=NULL,
-- duplicate_marked_at=NULL, status='active' WHERE id='REPLACE_WITH_ID';
