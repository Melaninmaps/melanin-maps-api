-- Mapping With Melanin — Website-Aware Canonical Place Migration
-- Purpose: Link duplicate source records to one canonical place without deleting data.
-- Run only through the repository-controlled migration/startup-migration mechanism.
-- Do NOT run this directly in a browser SQL console.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalizes place names/cities consistently across SQL matching logic.
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

-- Normalizes web URLs to a host/domain only. The caller must separately decide
-- whether a URL is official/verified; this function never makes that claim.
CREATE OR REPLACE FUNCTION public.mwm_normalize_website_domain(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  host text;
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN NULL;
  END IF;

  host := lower(btrim(value));
  host := regexp_replace(host, '^https?://', '');
  host := regexp_replace(host, '^www\.', '');
  host := split_part(host, '/', 1);
  host := split_part(host, '?', 1);
  host := split_part(host, '#', 1);
  host := split_part(host, ':', 1);

  -- Require a plausible hostname. Exclude social, directory, delivery,
  -- reservation, and link-aggregator platforms from automatic merge evidence.
  IF host = ''
     OR host !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
     OR host ~ '(^|\.)(facebook\.com|instagram\.com|tiktok\.com|yelp\.com|google\.com|maps\.google\.com|tripadvisor\.com|doordash\.com|ubereats\.com|grubhub\.com|opentable\.com|resy\.com|linktr\.ee)$'
  THEN
    RETURN NULL;
  END IF;

  RETURN host;
END;
$$;

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
  official_domain text,
  official_domain_verified_at timestamptz,
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
  source_url text,
  normalized_domain text,
  domain_verified_at timestamptz,
  match_confidence numeric(5,4) NOT NULL DEFAULT 1.0000,
  match_method varchar(48) NOT NULL
    CHECK (match_method IN (
      'seed_primary',
      'exact_name_city',
      'exact_name_coordinate',
      'exact_official_domain_location',
      'reviewed_merge',
      'manual_split'
    )),
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
  left_official_domain text,
  right_official_domain text,
  official_domain_match boolean NOT NULL DEFAULT false,
  proposed_confidence numeric(5,4) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'auto_linked', 'approved', 'rejected', 'split')),
  reviewed_by_id text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (left_source_type, left_source_id, right_source_type, right_source_id)
);

CREATE INDEX IF NOT EXISTS canonical_places_name_trgm_idx
  ON public.canonical_places USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS canonical_places_city_idx
  ON public.canonical_places (normalized_city, state)
  WHERE match_status = 'confirmed';
CREATE INDEX IF NOT EXISTS canonical_places_domain_idx
  ON public.canonical_places (official_domain)
  WHERE official_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS canonical_place_sources_canonical_idx
  ON public.canonical_place_sources (canonical_place_id);
CREATE INDEX IF NOT EXISTS canonical_place_candidates_status_idx
  ON public.canonical_place_merge_candidates (status, proposed_confidence DESC);
CREATE INDEX IF NOT EXISTS canonical_place_candidates_domain_idx
  ON public.canonical_place_merge_candidates (official_domain_match, status)
  WHERE official_domain_match = true;

-- Seed active, member-visible businesses as primary canonical places.
-- A nonempty website is stored as evidence but is not marked verified unless existing
-- product logic has independently verified it.
INSERT INTO public.canonical_places (
  canonical_name,
  normalized_name,
  city,
  normalized_city,
  state,
  country,
  latitude,
  longitude,
  official_domain,
  official_domain_verified_at,
  primary_source_type,
  primary_source_id,
  match_status
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
  public.mwm_normalize_website_domain(b.website),
  NULL,
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
  official_domain = EXCLUDED.official_domain,
  updated_at = now();

INSERT INTO public.canonical_place_sources (
  canonical_place_id,
  source_type,
  source_id,
  source_url,
  normalized_domain,
  domain_verified_at,
  match_confidence,
  match_method,
  is_primary
)
SELECT
  cp.id,
  'business',
  b.id::text,
  b.website,
  public.mwm_normalize_website_domain(b.website),
  NULL,
  1.0000,
  'seed_primary',
  true
FROM public.businesses b
JOIN public.canonical_places cp
  ON cp.primary_source_type = 'business'
 AND cp.primary_source_id = b.id::text
WHERE b.status = 'active'
ON CONFLICT (source_type, source_id) DO UPDATE
SET
  source_url = EXCLUDED.source_url,
  normalized_domain = EXCLUDED.normalized_domain;

-- Build reversible Business ↔ Cultural Site candidates. `verified_source` is used
-- as website evidence only if it normalizes to an eligible non-platform domain.
-- Same domain but different city is deliberately review-only.
INSERT INTO public.canonical_place_merge_candidates (
  left_source_type,
  left_source_id,
  right_source_type,
  right_source_id,
  normalized_name_similarity,
  coordinate_distance_miles,
  city_match,
  left_official_domain,
  right_official_domain,
  official_domain_match,
  proposed_confidence,
  status
)
WITH pairs AS (
  SELECT
    b.id::text AS business_id,
    cs.id::text AS cultural_site_id,
    b.name AS business_name,
    cs.name AS cultural_site_name,
    b.city AS business_city,
    cs.city AS cultural_site_city,
    b.latitude AS business_latitude,
    b.longitude AS business_longitude,
    cs.latitude AS cultural_latitude,
    cs.longitude AS cultural_longitude,
    public.mwm_normalize_website_domain(b.website) AS business_domain,
    public.mwm_normalize_website_domain(cs.verified_source) AS cultural_domain,
    similarity(
      public.mwm_normalize_place_text(b.name),
      public.mwm_normalize_place_text(
        regexp_replace(
          cs.name,
          '\\m' || regexp_replace(cs.city, '([\\.^$|()\\[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M',
          '',
          'gi'
        )
      )
    ) AS name_similarity,
    public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city) AS same_city,
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
    END AS distance_miles
  FROM public.businesses b
  JOIN public.cultural_sites cs
    ON public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city)
    OR (
      public.mwm_normalize_website_domain(b.website) IS NOT NULL
      AND public.mwm_normalize_website_domain(b.website)
          = public.mwm_normalize_website_domain(cs.verified_source)
    )
  WHERE b.status = 'active'
    AND (
      similarity(public.mwm_normalize_place_text(b.name), public.mwm_normalize_place_text(cs.name)) >= 0.90
      OR (
        public.mwm_normalize_website_domain(b.website) IS NOT NULL
        AND public.mwm_normalize_website_domain(b.website)
            = public.mwm_normalize_website_domain(cs.verified_source)
      )
    )
)
SELECT
  'business',
  business_id,
  'cultural_site',
  cultural_site_id,
  name_similarity,
  distance_miles,
  same_city,
  business_domain,
  cultural_domain,
  business_domain IS NOT NULL AND business_domain = cultural_domain,
  CASE
    WHEN business_domain IS NOT NULL
     AND business_domain = cultural_domain
     AND (same_city OR distance_miles <= 0.25)
    THEN 0.9990
    WHEN same_city
     AND name_similarity >= 0.98
     AND distance_miles <= 0.25
    THEN 0.9950
    WHEN business_domain IS NOT NULL
     AND business_domain = cultural_domain
    THEN 0.8500
    WHEN same_city AND name_similarity >= 0.98
    THEN 0.9000
    ELSE 0.0000
  END,
  'pending'
FROM pairs
WHERE name_similarity >= 0.90
   OR (business_domain IS NOT NULL AND business_domain = cultural_domain)
ON CONFLICT (left_source_type, left_source_id, right_source_type, right_source_id) DO UPDATE
SET
  normalized_name_similarity = EXCLUDED.normalized_name_similarity,
  coordinate_distance_miles = EXCLUDED.coordinate_distance_miles,
  city_match = EXCLUDED.city_match,
  left_official_domain = EXCLUDED.left_official_domain,
  right_official_domain = EXCLUDED.right_official_domain,
  official_domain_match = EXCLUDED.official_domain_match,
  proposed_confidence = EXCLUDED.proposed_confidence;

COMMIT;

-- Required post-migration checks (read-only):
-- SELECT to_regclass('public.canonical_places'), to_regclass('public.canonical_place_sources'), to_regclass('public.canonical_place_merge_candidates');
-- SELECT count(*) FROM public.canonical_places WHERE match_status = 'confirmed';
-- SELECT status, official_domain_match, count(*) FROM public.canonical_place_merge_candidates GROUP BY 1, 2 ORDER BY 1, 2;
