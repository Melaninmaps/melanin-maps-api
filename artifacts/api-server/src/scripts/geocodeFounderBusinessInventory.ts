import { Pool } from "pg";
import { assertDirectoryReviewLocalStaging } from "../directoryImport/localStagingGuard";
import {
  isValidPinCoordinates,
  resolvePreciseBusinessLocation,
} from "../businessIntake/communityPublicationPolicy";

const POLICY_VERSION = "founder-precise-pin-v1";
const PUBLICATION_ACTOR = "founder-authorized-bulk-searchable-2026-09-06";
const AUTHORIZED_SOURCES = [
  { source_name: "directory-import-candidates.jsonl", source_sha256: "e4c5921ed460535cdc5355a40799b01017a3cd77fca40c78fd03e3ffc852db34", source_row_count: 18_051 },
  { source_name: "kinfolk-poc-business-candidates.jsonl", source_sha256: "a1981d62915bad12ce076dea670f6d12eaa95aa39517aa8bdc89c02a2ded8502", source_row_count: 115 },
  { source_name: "cumulative-content-global-candidates.jsonl", source_sha256: "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8", source_row_count: 7_315 },
];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 10_000,
  query_timeout: 120_000,
  statement_timeout: 90_000,
});

type BusinessRow = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  website: string | null;
  candidate_ids: string[];
};

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadPending(limit: number): Promise<BusinessRow[]> {
  const { rows } = await pool.query<BusinessRow>(`
    WITH authorized_sources AS (
      SELECT * FROM jsonb_to_recordset($2::jsonb) AS s(
        source_name text, source_sha256 text, source_row_count integer
      )
    )
    SELECT b.id, b.name, b.category, b.subcategory, b.description, b.address, b.city, b.state,
           b.country, b.postal_code, b.website, provenance.candidate_ids
      FROM public.public_businesses b
      JOIN LATERAL (
        SELECT array_agg(c.id::text ORDER BY c.id) AS candidate_ids
          FROM directory_import_publications p
          JOIN directory_import_candidates c ON c.id = p.candidate_id
          JOIN directory_import_batches batch ON batch.id = c.batch_id
          JOIN authorized_sources s
            ON s.source_name = batch.source_name
           AND s.source_sha256 = batch.source_sha256
           AND s.source_row_count = batch.source_row_count
         WHERE p.record_type = 'business'
           AND p.record_id = b.id
           AND p.publication_action = 'create'
           AND p.actor_id = $3
        HAVING COUNT(*) > 0
      ) provenance ON true
     WHERE b.data_source = 'founder_directory_import'
       AND b.listing_status = 'live_unclaimed'
       AND b.latitude IS NULL
       AND b.longitude IS NULL
       AND NULLIF(btrim(b.address), '') IS NOT NULL
       AND b.address ~ '[0-9]'
       AND b.address ~ '[[:alpha:]]'
     ORDER BY b.created_at, b.id
     LIMIT $1
  `, [limit, JSON.stringify(AUTHORIZED_SOURCES), PUBLICATION_ACTOR]);
  return rows;
}

async function persistPin(business: BusinessRow, location: Awaited<ReturnType<typeof resolvePreciseBusinessLocation>>): Promise<boolean> {
  if (!location || !isValidPinCoordinates(location.lat, location.lng)) return false;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${POLICY_VERSION}:${business.id}`]);
    const updated = await client.query(`
      UPDATE businesses
         SET latitude = $2,
             longitude = $3,
             public_location_kind = 'address',
             source_evidence = CASE
               WHEN jsonb_typeof(COALESCE(source_evidence, '[]'::jsonb)) = 'array'
               THEN COALESCE(source_evidence, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                 'sourceType', $4,
                 'field', 'precise_location',
                 'supports', true,
                 'verifiedByMwm', false,
                 'excerpt', $5,
                 'policyVersion', $6
               ))
               ELSE jsonb_build_array(source_evidence, jsonb_build_object(
                 'sourceType', $4,
                 'field', 'precise_location',
                 'supports', true,
                 'verifiedByMwm', false,
                 'excerpt', $5,
                 'policyVersion', $6
               ))
             END,
             updated_at = NOW()
       WHERE id = $1
         AND latitude IS NULL
         AND longitude IS NULL
         AND listing_status = 'live_unclaimed'
         AND data_source = 'founder_directory_import'
         AND address IS NOT DISTINCT FROM $7
         AND city IS NOT DISTINCT FROM $8
         AND state IS NOT DISTINCT FROM $9
         AND country IS NOT DISTINCT FROM $10
         AND postal_code IS NOT DISTINCT FROM $11
         AND EXISTS (
           SELECT 1
             FROM directory_import_publications p
             JOIN directory_import_candidates c ON c.id = p.candidate_id
             JOIN directory_import_batches batch ON batch.id = c.batch_id
             JOIN jsonb_to_recordset($13::jsonb) AS s(
               source_name text, source_sha256 text, source_row_count integer
             ) ON s.source_name = batch.source_name
                AND s.source_sha256 = batch.source_sha256
                AND s.source_row_count = batch.source_row_count
            WHERE p.record_type = 'business'
              AND p.record_id = businesses.id
              AND p.publication_action = 'create'
              AND p.actor_id = $14
              AND c.id = ANY($12::uuid[])
         )
       RETURNING id
    `, [
      business.id, location.lat, location.lng, location.source, location.formattedAddress, POLICY_VERSION,
      business.address, business.city, business.state, business.country, business.postal_code,
      business.candidate_ids, JSON.stringify(AUTHORIZED_SOURCES), PUBLICATION_ACTOR,
    ]);
    if (!updated.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }

    const existingLocation = UUID_PATTERN.test(business.id) ? await client.query<{ id: string }>(`
      UPDATE canonical_record_locations
         SET latitude = $4,
             longitude = $5,
             updated_at = NOW()
       WHERE record_type = 'business'
         AND record_id = $1::uuid
         AND lower(city_name) = lower($2)
         AND COALESCE(upper(state_code), '') = COALESCE(upper($3), '')
         AND COALESCE(neighborhood_name, '') = ''
       RETURNING id
    `, [business.id, business.city, business.state, location.lat, location.lng]) : { rowCount: 0, rows: [] };

    if (!existingLocation.rowCount && UUID_PATTERN.test(business.id)) {
      await client.query(`
        INSERT INTO canonical_record_locations
          (record_type, record_id, city_name, state_code, neighborhood_name,
           latitude, longitude, is_primary, verified_at, created_at, updated_at)
        VALUES ('business', $1::uuid, $2, $3, NULL, $4, $5, true, NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [business.id, business.city, business.state, location.lat, location.lng]);
    }

    const candidateEvidence = await client.query(`
      UPDATE directory_import_candidates c
         SET review_evidence = COALESCE(review_evidence, '{}'::jsonb) || jsonb_build_object(
               'mapPin', true,
               'locationSource', $2,
               'locationPolicyVersion', $3,
               'verified', false
             ),
             review_note = 'Founder-authorized searchable listing with a server-confirmed precise map pin; listing remains unclaimed and not verified.',
             review_revision = review_revision + 1,
             updated_at = NOW()
       WHERE c.id = ANY($4::uuid[])
         AND c.published_record_type = 'business'
         AND c.published_record_id = $1
         AND EXISTS (
           SELECT 1
             FROM directory_import_publications p
             JOIN directory_import_batches batch ON batch.id = c.batch_id
             JOIN jsonb_to_recordset($5::jsonb) AS s(
               source_name text, source_sha256 text, source_row_count integer
             ) ON s.source_name = batch.source_name
                AND s.source_sha256 = batch.source_sha256
                AND s.source_row_count = batch.source_row_count
            WHERE p.candidate_id = c.id
              AND p.record_id = $1
              AND p.record_type = 'business'
              AND p.publication_action = 'create'
              AND p.actor_id = $6
         )
    `, [business.id, location.source, POLICY_VERSION, business.candidate_ids, JSON.stringify(AUTHORIZED_SOURCES), PUBLICATION_ACTOR]);
    if (candidateEvidence.rowCount !== business.candidate_ids.length) {
      throw new Error("FOUNDER_PIN_CANDIDATE_PROVENANCE_MISMATCH");
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const limit = positiveInteger(option("--limit"), 5_000);
  if (!assertDirectoryReviewLocalStaging(process.env)) {
    throw new Error("Founder pin geocoding requires the guarded local staging environment.");
  }
  const rows = await loadPending(limit);
  if (!apply) {
    console.log(JSON.stringify({ mode: "dry_run", policyVersion: POLICY_VERSION, pendingStreetAddresses: rows.length }, null, 2));
    return;
  }

  let pinned = 0;
  let unresolved = 0;
  let errors = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const business = rows[index];
    try {
      const location = await resolvePreciseBusinessLocation({
        name: business.name,
        category: business.category,
        subcategory: business.subcategory,
        description: business.description,
        address: business.address,
        city: business.city,
        state: business.state,
        postalCode: business.postal_code,
        country: business.country,
        website: business.website,
      });
      if (await persistPin(business, location)) pinned += 1;
      else unresolved += 1;
    } catch {
      errors += 1;
    }
    if ((index + 1) % 50 === 0 || index + 1 === rows.length) {
      console.log(JSON.stringify({ processed: index + 1, total: rows.length, pinned, unresolved, errors }));
    }
  }
  console.log(JSON.stringify({ mode: "applied", policyVersion: POLICY_VERSION, processed: rows.length, pinned, unresolved, errors }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
