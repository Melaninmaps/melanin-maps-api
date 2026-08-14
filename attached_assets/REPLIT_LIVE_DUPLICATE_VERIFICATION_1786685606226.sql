-- Read-only verification. Run against the Railway production database.
-- Do not modify data with this file.

-- 1. Overall state reconciliation
SELECT
  COUNT(*) AS raw_rows,
  COUNT(*) FILTER (WHERE COALESCE(is_duplicate,false)) AS duplicate_rows,
  COUNT(*) FILTER (WHERE status = 'permanently_hidden') AS permanently_hidden_rows,
  COUNT(*) FILTER (WHERE status = 'duplicate') AS duplicate_status_rows,
  COUNT(*) FILTER (WHERE listing_status IN ('live_unclaimed','live_claimed')) AS live_listing_rows,
  COUNT(*) FILTER (WHERE COALESCE(is_duplicate,false) = false
                    AND COALESCE(status,'active') NOT IN ('duplicate','permanently_hidden')
                    AND listing_status IN ('live_unclaimed','live_claimed')) AS active_canonical_live_rows
FROM businesses;

-- 2. Duke's Cafe: all variants and canonical targets
SELECT id, name, city, state, address, latitude, longitude,
       status, listing_status, is_duplicate, duplicate_of_id,
       duplicate_reason, duplicate_marked_at
FROM businesses
WHERE lower(regexp_replace(name, '[^a-z0-9]+', '', 'gi')) LIKE '%dukescafe%'
   OR lower(regexp_replace(name, '[^a-z0-9]+', '', 'gi')) LIKE '%dukecafe%'
ORDER BY is_duplicate DESC, created_at;

-- 3. Confirm all duplicate rows point to an existing non-duplicate canonical row.
SELECT d.id AS duplicate_id, d.name AS duplicate_name, d.duplicate_of_id,
       c.name AS canonical_name, c.status AS canonical_status,
       c.is_duplicate AS canonical_is_duplicate,
       CASE WHEN c.id IS NULL THEN 'MISSING_CANONICAL'
            WHEN COALESCE(c.is_duplicate,false) THEN 'CANONICAL_IS_ALSO_DUPLICATE'
            WHEN c.status IN ('duplicate','permanently_hidden') THEN 'CANONICAL_NOT_PUBLIC_CANONICAL'
            ELSE 'OK' END AS result
FROM businesses d
LEFT JOIN businesses c ON c.id = d.duplicate_of_id
WHERE COALESCE(d.is_duplicate,false) = true
ORDER BY result, d.name;

-- 4. Confirm no active/public rows are marked duplicates or permanently hidden.
SELECT id, name, city, state, status, listing_status, is_duplicate
FROM businesses
WHERE (listing_status IN ('live_unclaimed','live_claimed') OR status = 'active')
  AND (COALESCE(is_duplicate,false) = true OR status IN ('duplicate','permanently_hidden'))
ORDER BY name;

-- 5. All normalized/dedupe-key collisions among rows that are supposed to be canonical.
SELECT dedupe_key, COUNT(*) AS canonical_count,
       ARRAY_AGG(id ORDER BY created_at) AS ids,
       ARRAY_AGG(name ORDER BY created_at) AS names
FROM businesses
WHERE dedupe_key IS NOT NULL
  AND COALESCE(is_duplicate,false) = false
  AND COALESCE(status,'active') NOT IN ('duplicate','permanently_hidden')
GROUP BY dedupe_key
HAVING COUNT(*) > 1
ORDER BY canonical_count DESC;

-- 6. Canonical rows missing the fields required by the ingestion contract.
SELECT id, name, city, state, address, latitude, longitude,
       normalized_name, dedupe_key, source_provider, source_url,
       retrieved_at, evidence
FROM businesses
WHERE COALESCE(is_duplicate,false) = false
  AND COALESCE(status,'active') NOT IN ('duplicate','permanently_hidden')
  AND (
    normalized_name IS NULL OR normalized_name = '' OR
    dedupe_key IS NULL OR dedupe_key = '' OR
    source_provider IS NULL OR source_provider = ''
  )
ORDER BY name;

-- 7. Review queue counts and exact possible-duplicate records.
SELECT review_type, status, COUNT(*)
FROM business_review_items
GROUP BY review_type, status
ORDER BY review_type, status;

SELECT id, review_type, status, candidate_name, candidate_address,
       candidate_city, candidate_state, matched_business_id, reason
FROM business_review_items
WHERE review_type = 'possible_duplicate'
ORDER BY created_at;

-- 8. Expected duplicate-group count by canonical target.
SELECT duplicate_of_id, COUNT(*) AS duplicate_count,
       MIN(name) AS sample_name
FROM businesses
WHERE COALESCE(is_duplicate,false) = true
GROUP BY duplicate_of_id
ORDER BY duplicate_count DESC;

-- PASS CONDITIONS
-- A. Duke's Cafe: 1 canonical row + 93 duplicate rows, all 93 pointing to the same actual canonical ID.
-- B. Confirmed duplicate rows: 110 total, unless the production database has an explicitly documented newer audit.
-- C. No public/live row appears in query 4.
-- D. Query 5 returns zero rows.
-- E. Query 7 shows four possible-duplicate review pairs (or eight rows if stored one-per-record), all pending until resolved.
-- F. Query 6 returns zero canonical rows after the final fix; legacy/exempt records must be explicitly documented.
