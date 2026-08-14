-- MWM visibility and dedupe hardening patch
-- PostgreSQL. Run once through the normal migration runner.
-- This patch is intentionally non-destructive: it does not delete rows.

BEGIN;

-- One canonical definition of a publicly visible business.
CREATE OR REPLACE FUNCTION public.business_is_public(
  p_status text,
  p_listing_status text,
  p_is_duplicate boolean
) RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_is_duplicate, false) = false
     AND COALESCE(p_status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
     AND COALESCE(p_listing_status, '') IN ('live_unclaimed', 'live_claimed');
$$;

-- Public-only relation. Application read queries should use this view rather
-- than businesses directly for map pins, public lists, and public detail.
CREATE OR REPLACE VIEW public.public_businesses AS
SELECT b.*
FROM public.businesses b
WHERE public.business_is_public(b.status, b.listing_status, b.is_duplicate);

-- Makes public filtering and canonical dedupe lookups inexpensive.
CREATE INDEX IF NOT EXISTS businesses_public_visibility_idx
  ON public.businesses (listing_status, status, is_duplicate, created_at DESC)
  WHERE COALESCE(is_duplicate, false) = false
    AND listing_status IN ('live_unclaimed', 'live_claimed')
    AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted');

-- Prevent two non-duplicate records from claiming the same populated identity key.
-- This covers active, pending-review, and other non-deleted canonical records.
CREATE UNIQUE INDEX IF NOT EXISTS businesses_canonical_dedupe_key_unique
  ON public.businesses (dedupe_key)
  WHERE dedupe_key IS NOT NULL
    AND btrim(dedupe_key) <> ''
    AND COALESCE(is_duplicate, false) = false
    AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted');

-- Detect existing live leakage before release. This must return zero rows.
-- It is a validation query, not a cleanup operation.
-- SELECT id, name, status, listing_status, is_duplicate
-- FROM public.businesses
-- WHERE NOT public.business_is_public(status, listing_status, is_duplicate)
--   AND listing_status IN ('live_unclaimed', 'live_claimed');

COMMIT;

-- Required application query replacements:
--
-- Map pins:
--   FROM public.public_businesses
--   WHERE latitude IS NOT NULL AND longitude IS NOT NULL
--     AND latitude <> 0 AND longitude <> 0
--
-- Public list/search:
--   FROM public.public_businesses
--   WHERE <search/category/city predicates>
--
-- Public detail:
--   FROM public.public_businesses
--   WHERE id = $1
--
-- Do not use this view for admin/audit queries; admins need an explicit
-- all-records view with duplicate and visibility status displayed.
