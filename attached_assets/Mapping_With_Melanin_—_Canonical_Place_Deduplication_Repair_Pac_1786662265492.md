# Mapping With Melanin — Canonical Place Deduplication Repair Package

## Decision

**Yes, the inflated “2,600+ businesses” claim can be corrected.** The Sabor search proves the present count is not a unique-place count:

| Source | Live row | Place shown to member |
| --- | --- | --- |
| `businesses` | `Sabor Latin Street Grill`, Charlotte, NC | One business card |
| `cultural_sites` | `Sabor Latin Street Grill Charlotte`, Charlotte, NC, same coordinates | Duplicate cultural card |
| `cultural_sites` | `Sabor Latin Street Grill`, Charlotte, NC, same description | Duplicate cultural card |

The member should see **one canonical Sabor result**, not three cards. The cultural information must be retained as source provenance/context on that place; it must not be destroyed.

> Do not delete, overwrite, or merge source rows in bulk. First create a reversible canonical-place layer, suppress only high-confidence duplicates from search, and report the number of unique canonical places—not the sum of raw ingestion rows.

---

# 1. Exact database migration

**File:** `artifacts/api-server/src/lib/startup-migrations.ts`

Add the following idempotent migration as `canonical_places_v1`, after the source tables already exist. Use the project’s normal controlled startup-migration registry; do not run it by hand in a browser console.

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- One stable formatting rule used by all matching and search code.
CREATE OR REPLACE FUNCTION public.mwm_normalize_place_text(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(regexp_replace(
    regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', ' ', 'g'),
    '\s+', ' ', 'g'
  ));
$$;

-- A canonical place is the member-facing identity. It does not replace or delete
-- any original business, cultural-site, tour-site, organization, or event row.
CREATE TABLE IF NOT EXISTS public.canonical_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  city text,
  normalized_city text,
  state text,
  country text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  primary_source_type varchar(40) NOT NULL,
  primary_source_id text NOT NULL,
  match_status varchar(24) NOT NULL DEFAULT 'confirmed'
    CHECK (match_status IN ('confirmed', 'needs_review', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (primary_source_type, primary_source_id)
);

CREATE TABLE IF NOT EXISTS public.canonical_place_sources (
  canonical_place_id uuid NOT NULL REFERENCES public.canonical_places(id) ON DELETE CASCADE,
  source_type varchar(40) NOT NULL
    CHECK (source_type IN ('business', 'cultural_site', 'tour_cultural_site', 'community_org', 'event')),
  source_id text NOT NULL,
  match_confidence numeric(5,4) NOT NULL DEFAULT 1.0000,
  match_method varchar(40) NOT NULL
    CHECK (match_method IN ('seed_primary', 'exact_name_city', 'exact_name_coordinate', 'reviewed_merge', 'manual_split')),
  is_primary boolean NOT NULL DEFAULT false,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_type, source_id),
  UNIQUE (canonical_place_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS public.canonical_place_merge_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_source_type varchar(40) NOT NULL,
  left_source_id text NOT NULL,
  right_source_type varchar(40) NOT NULL,
  right_source_id text NOT NULL,
  normalized_name_similarity numeric(5,4) NOT NULL,
  coordinate_distance_miles numeric(8,3),
  city_match boolean NOT NULL,
  proposed_confidence numeric(5,4) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'auto_linked', 'approved', 'rejected', 'split')),
  reviewed_by_id text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (left_source_type, left_source_id, right_source_type, right_source_id)
);

CREATE INDEX IF NOT EXISTS canonical_places_city_idx
  ON public.canonical_places (normalized_city, state)
  WHERE match_status = 'confirmed';
CREATE INDEX IF NOT EXISTS canonical_places_name_trgm_idx
  ON public.canonical_places USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS canonical_place_sources_canonical_idx
  ON public.canonical_place_sources (canonical_place_id);
CREATE INDEX IF NOT EXISTS canonical_place_candidates_status_idx
  ON public.canonical_place_merge_candidates (status, proposed_confidence DESC);

-- Every active business begins as a canonical place. These are primary identities.
INSERT INTO public.canonical_places (
  canonical_name, normalized_name, city, normalized_city, state, country,
  latitude, longitude, primary_source_type, primary_source_id, match_status
)
SELECT
  b.name,
  public.mwm_normalize_place_text(b.name),
  b.city,
  public.mwm_normalize_place_text(b.city),
  b.state,
  b.country,
  b.latitude,
  b.longitude,
  'business',
  b.id::text,
  'confirmed'
FROM public.businesses b
WHERE b.status = 'active'
  AND coalesce(b.listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed')
ON CONFLICT (primary_source_type, primary_source_id) DO UPDATE
SET
  canonical_name = EXCLUDED.canonical_name,
  normalized_name = EXCLUDED.normalized_name,
  city = EXCLUDED.city,
  normalized_city = EXCLUDED.normalized_city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = now();

INSERT INTO public.canonical_place_sources (
  canonical_place_id, source_type, source_id, match_confidence, match_method, is_primary
)
SELECT cp.id, 'business', cp.primary_source_id, 1.0000, 'seed_primary', true
FROM public.canonical_places cp
WHERE cp.primary_source_type = 'business'
ON CONFLICT (source_type, source_id) DO NOTHING;

-- Candidate detection is conservative. It only considers a cultural-site row
-- duplicate when the city matches AND name similarity is high. Coordinate agreement
-- raises confidence; absent coordinates never auto-link on their own.
INSERT INTO public.canonical_place_merge_candidates (
  left_source_type, left_source_id, right_source_type, right_source_id,
  normalized_name_similarity, coordinate_distance_miles, city_match,
  proposed_confidence, status
)
SELECT
  'business', b.id::text,
  'cultural_site', cs.id::text,
  similarity(
    public.mwm_normalize_place_text(b.name),
    public.mwm_normalize_place_text(
      regexp_replace(cs.name, '\\m' || regexp_replace(cs.city, '([\\.^$|()\\[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M', '', 'gi')
    )
  ) AS normalized_name_similarity,
  CASE
    WHEN b.latitude IS NOT NULL AND b.longitude IS NOT NULL
     AND cs.latitude IS NOT NULL AND cs.longitude IS NOT NULL
    THEN 3959 * acos(LEAST(1.0, GREATEST(-1.0,
      cos(radians(b.latitude::double precision))
      * cos(radians(cs.latitude::double precision))
      * cos(radians(cs.longitude::double precision) - radians(b.longitude::double precision))
      + sin(radians(b.latitude::double precision))
      * sin(radians(cs.latitude::double precision))
    )))
    ELSE NULL
  END AS coordinate_distance_miles,
  public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city) AS city_match,
  CASE
    WHEN public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city)
     AND similarity(
       public.mwm_normalize_place_text(b.name),
       public.mwm_normalize_place_text(
         regexp_replace(cs.name, '\\m' || regexp_replace(cs.city, '([\\.^$|()\\[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M', '', 'gi')
       )
     ) >= 0.98
     AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
     AND cs.latitude IS NOT NULL AND cs.longitude IS NOT NULL
     AND 3959 * acos(LEAST(1.0, GREATEST(-1.0,
       cos(radians(b.latitude::double precision))
       * cos(radians(cs.latitude::double precision))
       * cos(radians(cs.longitude::double precision) - radians(b.longitude::double precision))
       + sin(radians(b.latitude::double precision))
       * sin(radians(cs.latitude::double precision))
     ))) <= 0.25 THEN 0.9950
    WHEN public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city)
     AND similarity(
       public.mwm_normalize_place_text(b.name),
       public.mwm_normalize_place_text(
         regexp_replace(cs.name, '\\m' || regexp_replace(cs.city, '([\\.^$|()\\[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M', '', 'gi')
       )
     ) >= 0.98 THEN 0.9000
    ELSE 0.0000
  END AS proposed_confidence,
  'pending'
FROM public.businesses b
JOIN public.cultural_sites cs
  ON public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city)
 AND similarity(
       public.mwm_normalize_place_text(b.name),
       public.mwm_normalize_place_text(
         regexp_replace(cs.name, '\\m' || regexp_replace(cs.city, '([\\.^$|()\\[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M', '', 'gi')
     ) >= 0.90
WHERE b.status = 'active'
ON CONFLICT (left_source_type, left_source_id, right_source_type, right_source_id) DO UPDATE
SET
  normalized_name_similarity = EXCLUDED.normalized_name_similarity,
  coordinate_distance_miles = EXCLUDED.coordinate_distance_miles,
  city_match = EXCLUDED.city_match,
  proposed_confidence = EXCLUDED.proposed_confidence;

COMMIT;
```

## 2. Exact review and auto-link procedure

### 2.1 Replit must provide these counts before changing the public headline

```sql
-- Raw active business rows: this is NOT the marketing headline.
SELECT count(*) AS raw_active_business_rows
FROM public.businesses
WHERE status = 'active'
  AND coalesce(listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed');

-- Candidate distribution. This reveals how inflated the combined search inventory is.
SELECT
  status,
  count(*) AS candidate_count,
  min(proposed_confidence) AS minimum_confidence,
  max(proposed_confidence) AS maximum_confidence
FROM public.canonical_place_merge_candidates
GROUP BY status
ORDER BY status;

-- This is the candidate list for manual review; never auto-delete it.
SELECT
  c.id,
  b.name AS business_name,
  b.city,
  b.state,
  cs.name AS cultural_site_name,
  c.normalized_name_similarity,
  c.coordinate_distance_miles,
  c.proposed_confidence,
  c.status
FROM public.canonical_place_merge_candidates c
JOIN public.businesses b ON b.id::text = c.left_source_id
JOIN public.cultural_sites cs ON cs.id::text = c.right_source_id
WHERE c.status = 'pending'
ORDER BY c.proposed_confidence DESC, c.coordinate_distance_miles NULLS LAST
LIMIT 500;

-- A defensible unique-place count after confirmed/approved source links exist.
SELECT count(*) AS canonical_unique_places
FROM public.canonical_places
WHERE match_status = 'confirmed';
```

### 2.2 Auto-link threshold

Only a candidate with all three properties may auto-link:

1. Same normalized city;
2. Name similarity **≥ 0.98** after removing a trailing city name from cultural-site title; and
3. Both rows have coordinates within **0.25 miles**.

Everything else stays `pending` for review. This avoids merging different branches, different restaurants with similar names, and unrelated historic references.

```sql
WITH approved AS (
  UPDATE public.canonical_place_merge_candidates
  SET status = 'auto_linked', reviewed_at = now(), review_note = 'High-confidence same-city, same-place coordinate match'
  WHERE status = 'pending'
    AND proposed_confidence >= 0.9950
    AND coordinate_distance_miles <= 0.25
  RETURNING *
)
INSERT INTO public.canonical_place_sources (
  canonical_place_id, source_type, source_id, match_confidence, match_method, is_primary, review_note
)
SELECT
  cp.id,
  'cultural_site',
  a.right_source_id,
  a.proposed_confidence,
  'exact_name_coordinate',
  false,
  a.review_note
FROM approved a
JOIN public.canonical_places cp
  ON cp.primary_source_type = 'business'
 AND cp.primary_source_id = a.left_source_id
ON CONFLICT (source_type, source_id) DO NOTHING;
```

## 3. Exact public-search suppression patch

**File:** `artifacts/api-server/src/routes/universal-search.ts`

The canonical database layer gives durable provenance. The following route patch immediately prevents a user from seeing the same place as a business and cultural card while the historical review queue is processed.

### 3.1 Add these types and helpers before `searchHeritage`

```ts
type HeritageResult = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  source_table?: string;
  [key: string]: unknown;
};

function normalizePlaceText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizedPlaceName(name: unknown, city: unknown): string {
  const normalizedCity = normalizePlaceText(city);
  const normalizedName = normalizePlaceText(name);
  return normalizedCity
    ? normalizedName.replace(new RegExp(`\\b${normalizedCity.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "g"), "").trim()
    : normalizedName;
}

function withinQuarterMile(
  leftLat: unknown, leftLng: unknown, rightLat: unknown, rightLng: unknown,
): boolean {
  const values = [leftLat, leftLng, rightLat, rightLng].map(Number);
  if (!values.every(Number.isFinite)) return false;
  const [lat1, lng1, lat2, lng2] = values.map((value) => value * Math.PI / 180);
  const a = Math.sin((lat2 - lat1) / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2;
  return 3959 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) <= 0.25;
}

function sameCanonicalPlace(business: BusinessResult, heritage: HeritageResult): boolean {
  const sameCity = normalizePlaceText(business.city) === normalizePlaceText(heritage.city);
  if (!sameCity) return false;

  const businessName = normalizedPlaceName(business.name, business.city);
  const heritageName = normalizedPlaceName(heritage.name, heritage.city);
  const exactName = businessName === heritageName;
  const coordinateMatch = withinQuarterMile(
    business.latitude, business.longitude, heritage.latitude, heritage.longitude,
  );

  // Require exact normalized name plus coordinates, or exact names where the cultural
  // row is a title variant such as "Sabor Latin Street Grill Charlotte".
  return exactName && (coordinateMatch || heritageName.length >= 5);
}

function suppressCrossSourceDuplicates(
  businesses: BusinessResult[],
  heritage: HeritageResult[],
): HeritageResult[] {
  return heritage.filter((site) => !businesses.some((business) => sameCanonicalPlace(business, site)));
}
```

### 3.2 Apply suppression after the heritage expansion ladder and before `totalResults`

Immediately after the `if (requestedTypes.includes("heritage")) { ... }` block ends, add:

```ts
heritage = suppressCrossSourceDuplicates(
  businesses,
  heritage as HeritageResult[],
);
```

### 3.3 Recalculate counts after suppression

Keep the existing `totalResults` calculation where it is, after the suppression line. It will now count one user-facing Sabor result instead of three.

### 3.4 Preserve context rather than hiding history

Add this field on a matching business result before returning JSON:

```ts
const duplicateCulturalSources = (heritageBeforeSuppression as HeritageResult[])
  .filter((site) => sameCanonicalPlace(business, site))
  .map((site) => ({ id: site.id, sourceType: site.source_table ?? "cultural_sites" }));
```

If a frontend context chip is desired later, label it **“Cultural context available”**; it must not claim an unverified rating, safety score, ownership identity, or endorsement.

## 4. Directory headline correction

**Do not display “2,600+ businesses” until the business count and canonical count are separately calculated and labeled.**

Use these labels:

| Metric | Allowed member-facing label |
| --- | --- |
| `raw_active_business_rows` | Do not use as a marketing headline. Internal ingestion count only. |
| `canonical_unique_places` | `Explore [N] unique places` after canonicalization/review. |
| `canonical_place_sources` linked count | `Built from verified business and cultural references`—only if source provenance is real. |

## 5. Exact verification

1. Query `Sabor Latin Street Grill` in production.
2. Expected: **one** business/place card, not three cards. No cultural card duplicates under the result.
3. Confirm no source row was deleted:

```sql
SELECT source_type, source_id, canonical_place_id, is_primary, match_confidence
FROM public.canonical_place_sources cps
JOIN public.canonical_places cp ON cp.id = cps.canonical_place_id
WHERE cp.canonical_name ILIKE '%Sabor Latin Street Grill%';
```

4. Test known same-name different-city businesses; both must remain visible.
5. Test same-city similar but different businesses; both must remain visible unless manually approved.
6. Recalculate and report: raw business rows, raw cultural-site rows, auto-linked duplicate sources, manually approved duplicates, and canonical unique places.

## 6. Rollback

Search suppression can be disabled by removing the single `suppressCrossSourceDuplicates` call. No source data is deleted.

To reverse one canonical merge:

```sql
DELETE FROM public.canonical_place_sources
WHERE source_type = 'cultural_site' AND source_id = $1;

UPDATE public.canonical_place_merge_candidates
SET status = 'split', reviewed_at = now(), review_note = 'Reversed after review'
WHERE right_source_type = 'cultural_site' AND right_source_id = $1;
```

The original business and cultural-site records remain intact at every stage.
