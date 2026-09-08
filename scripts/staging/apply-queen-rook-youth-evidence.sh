#!/usr/bin/env bash
set -euo pipefail

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
elif [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--apply]" >&2
  exit 2
fi

: "${DATABASE_URL:?DATABASE_URL is required}"
TARGET_ID="665781f0-3144-4c06-815a-81dd63c824a9"
OFFICIAL_SOURCE="https://www.queenandrookcafe.com/youth-programs/"

if [[ "${DEPLOYMENT_TIER:-}" != "local_staging" || "${DIRECTORY_IMPORT_LOCAL_STAGING:-}" != "1" ]]; then
  echo "QUEEN_ROOK_EVIDENCE_BLOCKED: isolated staging environment markers are required" >&2
  exit 1
fi
DATABASE_IDENTITY="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc \
  "SELECT current_database() || '|' || COALESCE(inet_server_addr()::text, '')")"
if [[ "$DATABASE_IDENTITY" != "mwm_directory_staging|127.0.0.1" ]]; then
  echo "QUEEN_ROOK_EVIDENCE_BLOCKED: database identity is not approved isolated staging" >&2
  exit 1
fi
if [[ "$APPLY" == "1" && "${KINFOLK_FAMILY_EVIDENCE_APPLY_ACK:-}" != "isolated-staging-reviewed" ]]; then
  echo "QUEEN_ROOK_EVIDENCE_BLOCKED: explicit isolated-staging apply acknowledgment is required" >&2
  exit 1
fi

TARGET_COUNT="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "
  SELECT COUNT(*)
  FROM public.public_businesses
  WHERE id = '$TARGET_ID'
    AND name = 'Queen & Rook Game Cafe'
    AND lower(city) = 'philadelphia'
    AND upper(state) = 'PA'
    AND listing_status = 'live_unclaimed'
    AND COALESCE(verified, false) = false
")"

if [[ "$TARGET_COUNT" != "1" ]]; then
  echo "QUEEN_ROOK_EVIDENCE_BLOCKED: expected exactly one live_unclaimed, unverified canonical target; found $TARGET_COUNT" >&2
  exit 1
fi

if [[ "$APPLY" != "1" ]]; then
  echo "QUEEN_ROOK_EVIDENCE_DRY_RUN_OK target_count=1 apply_required=true"
  exit 0
fi

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  --set=target_id="$TARGET_ID" \
  --set=official_source="$OFFICIAL_SOURCE" <<'SQL'
BEGIN;

UPDATE public.businesses
SET source_url = COALESCE(NULLIF(BTRIM(source_url), ''), :'official_source'),
    updated_at = NOW()
WHERE id = :'target_id'
  AND name = 'Queen & Rook Game Cafe'
  AND lower(city) = 'philadelphia'
  AND upper(state) = 'PA'
  AND listing_status = 'live_unclaimed'
  AND COALESCE(verified, false) = false;

INSERT INTO public.business_identity (business_id, audiences_served, updated_at)
VALUES (
  :'target_id',
  '["youth ages 6-16", "teen programs ages 13-16"]'::jsonb,
  NOW()
)
ON CONFLICT (business_id) DO UPDATE
SET audiences_served = (
      SELECT COALESCE(jsonb_agg(value ORDER BY value), '[]'::jsonb)
      FROM (
        SELECT DISTINCT value
        FROM jsonb_array_elements_text(
          COALESCE(public.business_identity.audiences_served, '[]'::jsonb)
          || EXCLUDED.audiences_served
        ) AS expanded(value)
      ) AS unique_values
    ),
    updated_at = NOW();

SELECT (COUNT(*) = 1)::int AS postcondition_ok
  FROM public.businesses b
  JOIN public.business_identity bi ON bi.business_id = b.id
  WHERE b.id = :'target_id'
    AND b.listing_status = 'live_unclaimed'
    AND COALESCE(b.verified, false) = false
    AND b.source_url = :'official_source'
    AND bi.audiences_served @> '["youth ages 6-16", "teen programs ages 13-16"]'::jsonb
\gset

\if :postcondition_ok
  COMMIT;
\else
  ROLLBACK;
  \echo 'QUEEN_ROOK_EVIDENCE_POSTCONDITION_FAILED'
  \quit 3
\endif
SQL

echo "QUEEN_ROOK_EVIDENCE_APPLIED target_count=1 listing_status=live_unclaimed verified=false"
