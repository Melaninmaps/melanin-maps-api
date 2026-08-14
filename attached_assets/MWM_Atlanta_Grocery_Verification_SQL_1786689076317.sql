-- ============================================================
-- MWM Atlanta Black-Owned Grocery Stores — SQL Verification
-- Audit Package v3 | August 14, 2026
-- ============================================================
-- Run each query in order. Check the PASS condition after each.
-- All queries are READ-ONLY (SELECT only).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- QUERY 1: Confirm all 4 stores exist and are publicly visible
-- ─────────────────────────────────────────────────────────────
-- Uses the public_businesses VIEW which enforces:
--   is_duplicate = false, listing_status IN ('live_unclaimed','live_claimed'),
--   status NOT IN ('duplicate','permanently_hidden','removed','deleted')
--
-- PASS: Exactly 4 rows returned, all with listing_status = 'live_unclaimed'

SELECT
  id,
  name,
  address,
  city,
  state,
  listing_status,
  is_duplicate,
  black_owned
FROM public_businesses
WHERE
  lower(city) = 'atlanta'
  AND lower(state) IN ('ga', 'georgia')
  AND category = 'Grocery'
ORDER BY name;

-- Expected rows:
--   Goodr Community Market on Edgewood
--   Nourish + Bloom Market — Cascade
--   Sevananda Natural Foods Market
--   Wadada Healthy Market & Juice Bar


-- ─────────────────────────────────────────────────────────────
-- QUERY 2: Confirm website URLs are present and non-empty
-- ─────────────────────────────────────────────────────────────
-- PASS: All 4 rows show url_status = 'HAS URL'
-- FAIL signal: any row shows 'MISSING URL'

SELECT
  name,
  website,
  CASE
    WHEN website IS NULL OR trim(website) = '' THEN '❌ MISSING URL'
    ELSE '✅ HAS URL'
  END AS url_status
FROM public_businesses
WHERE
  lower(city) = 'atlanta'
  AND category = 'Grocery'
ORDER BY name;


-- ─────────────────────────────────────────────────────────────
-- QUERY 3: Confirm Black-owned flag is set on all 4 stores
-- ─────────────────────────────────────────────────────────────
-- PASS: All 4 rows show black_owned = true AND own_status = 'HAS OWNERSHIP'

SELECT
  name,
  black_owned,
  ownership_designations,
  CASE
    WHEN black_owned = true THEN '✅ BLACK OWNED'
    ELSE '❌ NOT MARKED BLACK OWNED'
  END AS ownership_status,
  CASE
    WHEN ownership_designations IS NULL OR ownership_designations = '[]'::jsonb THEN '❌ MISSING DESIGNATIONS'
    ELSE '✅ HAS OWNERSHIP DESIGNATIONS'
  END AS designation_status
FROM public_businesses
WHERE
  lower(city) = 'atlanta'
  AND category = 'Grocery'
ORDER BY name;


-- ─────────────────────────────────────────────────────────────
-- QUERY 4: Confirm profiles are complete (key fields populated)
-- ─────────────────────────────────────────────────────────────
-- PASS: All rows show HAS for website, description, and coords.
-- NOTE: Nourish + Bloom and Goodr have no phone number by design
--       (both are cashierless/contactless stores without a published phone line).

SELECT
  name,
  CASE WHEN website IS NOT NULL AND website <> '' THEN '✅ HAS URL' ELSE '❌ MISSING' END AS website,
  CASE WHEN phone IS NOT NULL AND phone <> '' THEN '✅ ' || phone ELSE 'ℹ️ NO PHONE (contactless)' END AS phone,
  CASE WHEN description IS NOT NULL AND length(description) > 50 THEN '✅ HAS DESC' ELSE '❌ MISSING' END AS description,
  CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN '✅ HAS COORDS' ELSE '❌ MISSING COORDS' END AS map_pin,
  CASE WHEN dedupe_key IS NOT NULL THEN '✅ DEDUPED' ELSE '❌ NO DEDUPE KEY' END AS dedupe_status
FROM public_businesses
WHERE
  lower(city) = 'atlanta'
  AND category = 'Grocery'
ORDER BY name;


-- ─────────────────────────────────────────────────────────────
-- QUERY 5: Confirm no duplicate rows for these 4 stores
-- ─────────────────────────────────────────────────────────────
-- PASS: Zero rows returned (no dedupe key collisions)
-- FAIL signal: any row returned means two non-duplicate rows share a key

SELECT
  dedupe_key,
  COUNT(*) AS occurrences,
  array_agg(name ORDER BY name) AS matching_names
FROM businesses
WHERE
  lower(city) = 'atlanta'
  AND category = 'Grocery'
  AND dedupe_key IS NOT NULL
  AND COALESCE(is_duplicate, false) = false
  AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
GROUP BY dedupe_key
HAVING COUNT(*) > 1;


-- ─────────────────────────────────────────────────────────────
-- QUERY 6: Confirm stores are NOT leaking as duplicates
-- ─────────────────────────────────────────────────────────────
-- PASS: All 4 rows show is_duplicate = false and status = 'active'
-- FAIL signal: any row shows is_duplicate = true (would hide the store from public)

SELECT
  id,
  name,
  status,
  listing_status,
  is_duplicate,
  duplicate_of_id
FROM businesses
WHERE id IN (
  'c09df6ab-c5de-458a-b314-282fc90ec53d',  -- Wadada
  'c14dfa48-edd7-44f1-8d07-c8363289bd83',  -- Sevananda
  '4e6be83f-f5f0-4c11-a196-7cc9f465988d',  -- Nourish + Bloom Cascade
  '71bf880e-8bce-4d45-8c97-5c7918fd4ec8'   -- Goodr
)
ORDER BY name;


-- ─────────────────────────────────────────────────────────────
-- QUERY 7: Confirm map coordinates are within Atlanta bounding box
-- ─────────────────────────────────────────────────────────────
-- Atlanta bounding box: lat 33.64–33.89, lon -84.55 to -84.28
-- PASS: All 4 rows show coord_status = 'VALID ATLANTA COORDS'
-- FAIL signal: any 'OUT OF RANGE' means the map pin would land outside Atlanta

SELECT
  name,
  round(latitude::numeric, 5) AS lat,
  round(longitude::numeric, 5) AS lon,
  CASE
    WHEN latitude BETWEEN 33.64 AND 33.89
     AND longitude BETWEEN -84.55 AND -84.28
    THEN '✅ VALID ATLANTA COORDS'
    ELSE '❌ OUT OF RANGE'
  END AS coord_status
FROM public_businesses
WHERE
  lower(city) = 'atlanta'
  AND category = 'Grocery'
ORDER BY name;


-- ─────────────────────────────────────────────────────────────
-- QUERY 8: Full profile display — what the app shows per store
-- ─────────────────────────────────────────────────────────────
-- This is the complete record as the MWM app would retrieve it.
-- Review each row for content quality, description accuracy, and data completeness.

SELECT
  id,
  name,
  address,
  city,
  state,
  phone,
  website,
  round(latitude::numeric, 5) AS lat,
  round(longitude::numeric, 5) AS lon,
  category,
  subcategory,
  black_owned,
  ownership_designations,
  listing_status,
  source_provider,
  left(description, 300) AS description_preview
FROM businesses
WHERE id IN (
  'c09df6ab-c5de-458a-b314-282fc90ec53d',  -- Wadada
  'c14dfa48-edd7-44f1-8d07-c8363289bd83',  -- Sevananda
  '4e6be83f-f5f0-4c11-a196-7cc9f465988d',  -- Nourish + Bloom Cascade
  '71bf880e-8bce-4d45-8c97-5c7918fd4ec8'   -- Goodr
)
ORDER BY name;
