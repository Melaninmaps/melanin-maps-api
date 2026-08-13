-- Mapping With Melanin — Website-Aware Duplicate Cleanup and Verification
-- Prerequisite: MWM_Domain_Deduplication_Migration.sql completed successfully.
-- Safety rule: This file does NOT DELETE FROM businesses, cultural_sites,
-- tour_cultural_sites, community_organizations, events, reviews, media, or claims.
-- It only links confirmed duplicate source records to canonical places and updates
-- candidate review state. Execute each section in order; stop on an unexpected result.

-- ============================================================================
-- 0. Pre-cleanup facts — copy results into the release proof package
-- ============================================================================

SELECT
  count(*) AS raw_active_business_rows
FROM public.businesses
WHERE status = 'active'
  AND coalesce(listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed');

SELECT
  count(*) AS raw_cultural_site_rows
FROM public.cultural_sites;

SELECT
  count(*) AS raw_tour_cultural_site_rows
FROM public.tour_cultural_sites
WHERE coalesce(is_active, true) = true;

SELECT
  status,
  official_domain_match,
  count(*) AS candidates
FROM public.canonical_place_merge_candidates
GROUP BY status, official_domain_match
ORDER BY status, official_domain_match;

-- Display all candidates eligible for automatic linking. This is a review report;
-- it changes no data. Inspect at least the first 100 before running Section 1.
SELECT
  c.id,
  c.left_source_id AS business_id,
  b.name AS business_name,
  b.city AS business_city,
  b.website AS business_website,
  c.right_source_id AS cultural_site_id,
  cs.name AS cultural_site_name,
  cs.city AS cultural_site_city,
  cs.verified_source AS cultural_site_source_url,
  c.left_official_domain,
  c.right_official_domain,
  c.official_domain_match,
  c.normalized_name_similarity,
  c.coordinate_distance_miles,
  c.proposed_confidence,
  c.status
FROM public.canonical_place_merge_candidates c
JOIN public.businesses b ON b.id::text = c.left_source_id
JOIN public.cultural_sites cs ON cs.id::text = c.right_source_id
WHERE c.status = 'pending'
  AND c.proposed_confidence >= 0.9950
  AND (
    (c.official_domain_match = true AND (c.city_match = true OR c.coordinate_distance_miles <= 0.25))
    OR (c.official_domain_match = false AND c.city_match = true AND c.coordinate_distance_miles <= 0.25)
  )
ORDER BY c.proposed_confidence DESC, c.coordinate_distance_miles NULLS LAST, b.name
LIMIT 500;

-- ============================================================================
-- 1. Safe automatic linking — high-confidence candidates only
-- ============================================================================

BEGIN;

WITH auto_approved AS (
  UPDATE public.canonical_place_merge_candidates c
  SET
    status = 'auto_linked',
    reviewed_at = now(),
    review_note = CASE
      WHEN c.official_domain_match THEN
        'Auto-linked: same official domain and same city/coordinate area'
      ELSE
        'Auto-linked: exact normalized name, same city, coordinate distance <= 0.25 mi'
    END
  WHERE c.status = 'pending'
    AND (
      -- Same verified-looking official website domain plus place-level location evidence.
      (c.official_domain_match = true AND (c.city_match = true OR c.coordinate_distance_miles <= 0.25))
      OR
      -- No website evidence, but exact name/location agreement is still sufficient.
      (c.official_domain_match = false
       AND c.city_match = true
       AND c.normalized_name_similarity >= 0.9800
       AND c.coordinate_distance_miles <= 0.25)
    )
  RETURNING c.*
), linked AS (
  INSERT INTO public.canonical_place_sources (
    canonical_place_id,
    source_type,
    source_id,
    source_url,
    normalized_domain,
    domain_verified_at,
    match_confidence,
    match_method,
    is_primary,
    review_note
  )
  SELECT
    cp.id,
    'cultural_site',
    a.right_source_id,
    cs.verified_source,
    public.mwm_normalize_website_domain(cs.verified_source),
    NULL,
    a.proposed_confidence,
    CASE
      WHEN a.official_domain_match THEN 'exact_official_domain_location'
      ELSE 'exact_name_coordinate'
    END,
    false,
    a.review_note
  FROM auto_approved a
  JOIN public.canonical_places cp
    ON cp.primary_source_type = 'business'
   AND cp.primary_source_id = a.left_source_id
  JOIN public.cultural_sites cs
    ON cs.id::text = a.right_source_id
  ON CONFLICT (source_type, source_id) DO NOTHING
  RETURNING source_type, source_id, canonical_place_id
)
SELECT count(*) AS newly_linked_cultural_sources FROM linked;

COMMIT;

-- ============================================================================
-- 2. Manual review queue — include, reject, or split; do not bulk-merge it
-- ============================================================================

-- Review candidates which share an official domain but are in different cities.
-- These may be valid multi-location places and MUST NOT be merged automatically.
SELECT
  c.id,
  b.name AS business_name,
  b.city AS business_city,
  b.website AS business_website,
  cs.name AS cultural_site_name,
  cs.city AS cultural_site_city,
  cs.verified_source AS cultural_site_source_url,
  c.left_official_domain,
  c.right_official_domain,
  c.normalized_name_similarity,
  c.coordinate_distance_miles,
  c.proposed_confidence
FROM public.canonical_place_merge_candidates c
JOIN public.businesses b ON b.id::text = c.left_source_id
JOIN public.cultural_sites cs ON cs.id::text = c.right_source_id
WHERE c.status = 'pending'
  AND c.official_domain_match = true
  AND c.city_match = false
ORDER BY c.proposed_confidence DESC, b.name;

-- APPROVE one reviewed same-place candidate only after a curator verifies it.
-- Replace :candidate_id and :reviewer_user_id. The candidate must be same-city or
-- the reviewer must document why distinct-city records represent the same location.
/*
BEGIN;
WITH approved AS (
  UPDATE public.canonical_place_merge_candidates
  SET
    status = 'approved',
    reviewed_by_id = :reviewer_user_id,
    reviewed_at = now(),
    review_note = :review_note
  WHERE id = :candidate_id
    AND status = 'pending'
  RETURNING *
)
INSERT INTO public.canonical_place_sources (
  canonical_place_id, source_type, source_id, source_url, normalized_domain,
  match_confidence, match_method, is_primary, review_note
)
SELECT
  cp.id,
  'cultural_site',
  a.right_source_id,
  cs.verified_source,
  public.mwm_normalize_website_domain(cs.verified_source),
  a.proposed_confidence,
  'reviewed_merge',
  false,
  a.review_note
FROM approved a
JOIN public.canonical_places cp
  ON cp.primary_source_type = 'business'
 AND cp.primary_source_id = a.left_source_id
JOIN public.cultural_sites cs ON cs.id::text = a.right_source_id
ON CONFLICT (source_type, source_id) DO NOTHING;
COMMIT;
*/

-- REJECT one candidate; it remains a separate place and stays searchable.
/*
UPDATE public.canonical_place_merge_candidates
SET
  status = 'rejected',
  reviewed_by_id = :reviewer_user_id,
  reviewed_at = now(),
  review_note = :review_note
WHERE id = :candidate_id
  AND status = 'pending';
*/

-- ============================================================================
-- 3. Correct the public inventory count — no more raw-row headline
-- ============================================================================

-- This is the canonical unique-place count that may be used after migration/review.
SELECT count(*) AS canonical_unique_places
FROM public.canonical_places cp
WHERE cp.match_status = 'confirmed';

-- Full audit table for the founder/release proof package.
SELECT
  (SELECT count(*) FROM public.businesses
    WHERE status = 'active'
      AND coalesce(listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed')) AS raw_active_business_rows,
  (SELECT count(*) FROM public.cultural_sites) AS raw_cultural_site_rows,
  (SELECT count(*) FROM public.canonical_places WHERE match_status = 'confirmed') AS canonical_unique_places,
  (SELECT count(*) FROM public.canonical_place_sources WHERE source_type = 'cultural_site') AS linked_cultural_sources,
  (SELECT count(*) FROM public.canonical_place_merge_candidates WHERE status = 'pending') AS unresolved_candidates,
  (SELECT count(*) FROM public.canonical_place_merge_candidates WHERE status = 'auto_linked') AS auto_linked_candidates,
  (SELECT count(*) FROM public.canonical_place_merge_candidates WHERE status = 'approved') AS curator_approved_candidates,
  (SELECT count(*) FROM public.canonical_place_merge_candidates WHERE status = 'rejected') AS rejected_candidates;

-- ============================================================================
-- 4. Sabor acceptance check — one place, preserved source records
-- ============================================================================

SELECT
  cp.id AS canonical_place_id,
  cp.canonical_name,
  cp.city,
  cp.official_domain,
  cps.source_type,
  cps.source_id,
  cps.is_primary,
  cps.match_method,
  cps.match_confidence,
  cps.review_note
FROM public.canonical_places cp
JOIN public.canonical_place_sources cps ON cps.canonical_place_id = cp.id
WHERE cp.canonical_name ILIKE '%Sabor Latin Street Grill%'
ORDER BY cp.id, cps.is_primary DESC, cps.source_type, cps.source_id;

-- ============================================================================
-- 5. Roll back one mistaken link — original records are never deleted
-- ============================================================================

-- Replace :cultural_site_id and :reviewer_user_id. This reverses only the link;
-- it does not delete the cultural-site, business, media, reviews, or source record.
/*
BEGIN;
DELETE FROM public.canonical_place_sources
WHERE source_type = 'cultural_site'
  AND source_id = :cultural_site_id;

UPDATE public.canonical_place_merge_candidates
SET
  status = 'split',
  reviewed_by_id = :reviewer_user_id,
  reviewed_at = now(),
  review_note = 'Split after review; source remains a separate place'
WHERE right_source_type = 'cultural_site'
  AND right_source_id = :cultural_site_id
  AND status IN ('auto_linked', 'approved');
COMMIT;
*/
