import type { Pool } from "pg";
import {
  isValidPinCoordinates,
  resolvePreciseBusinessLocation,
  type ResolvedBusinessLocation,
} from "../businessIntake/communityPublicationPolicy";
import {
  LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
  assertLatinxLehighValleyDirectoryDataset,
} from "./latinxLehighValleyDirectory";

/**
 * Founder-authorized, source-scoped publication for the 2026-09-24 supplied
 * Lehigh Valley directory. It creates only the immutable source profiles;
 * it never edits, deduplicates, deletes, or reclassifies an existing listing.
 */
export const LATINX_LEHIGH_VALLEY_PUBLICATION_ACTOR =
  "founder-authorized-latinx-lehigh-valley-publication-20260925" as const;

export type LatinxLehighValleyPublicationSummary = Readonly<{
  sourceProfiles: number;
  addressedProfiles: number;
  alreadyActivated: number;
  pending: number;
  created: number;
  existingSameSourceId: number;
  mapPinsCreated: 0;
}>;

export type LatinxLehighValleyPinSummary = Readonly<{
  eligibleStreetAddresses: number;
  attempted: number;
  pinned: number;
  unresolved: number;
  errors: number;
}>;

type PublicationClient = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    values?: readonly unknown[],
  ) => Promise<{ rows: T[]; rowCount?: number | null }>;
  release: () => void;
};

type PublicationPool = Pick<Pool, "query" | "connect">;
type Log = (message: string, details?: Record<string, unknown>) => void;
type LocationResolver = (input: {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string | null;
}) => Promise<ResolvedBusinessLocation | null>;

const PIN_POLICY_VERSION = "latinx-lehigh-valley-exact-pin-v1" as const;

async function ensureLatinxLehighValleyDirectoryAudit(
  productionPool: Pick<Pool, "query">,
): Promise<void> {
  for (const statement of [
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS research_source_label VARCHAR(255)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS research_source_url TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS kinfolk_recommendation_reason TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS intake_batch_reference VARCHAR(255)`,
  ]) {
    await productionPool.query(statement);
  }
  await productionPool.query(`
    CREATE TABLE IF NOT EXISTS user_supplied_directory_import_receipts (
      source_key TEXT NOT NULL,
      source_sha256 TEXT NOT NULL,
      profile_id VARCHAR NOT NULL,
      source_row INTEGER NOT NULL,
      business_id VARCHAR NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('created', 'existing_same_source_id')),
      policy_version TEXT NOT NULL,
      activated_by TEXT,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source_key, source_sha256, profile_id)
    )
  `);
  await productionPool.query(`
    CREATE INDEX IF NOT EXISTS user_supplied_directory_import_business_idx
      ON user_supplied_directory_import_receipts (business_id, activated_at DESC)
  `);
}

/**
 * Atomically adds only the requested source-backed profiles. Existing receipts
 * make the operation safe to run again after a restart or a partial release.
 */
export async function publishLatinxLehighValleyDirectory(
  productionPool: PublicationPool,
  actorId: string = LATINX_LEHIGH_VALLEY_PUBLICATION_ACTOR,
): Promise<LatinxLehighValleyPublicationSummary> {
  const profiles = assertLatinxLehighValleyDirectoryDataset();
  const summary: {
    sourceProfiles: number;
    addressedProfiles: number;
    alreadyActivated: number;
    pending: number;
    created: number;
    existingSameSourceId: number;
    mapPinsCreated: 0;
  } = {
    sourceProfiles: profiles.length,
    addressedProfiles: profiles.filter((profile) => profile.address).length,
    alreadyActivated: 0,
    pending: profiles.length,
    created: 0,
    existingSameSourceId: 0,
    mapPinsCreated: 0,
  };

  await ensureLatinxLehighValleyDirectoryAudit(productionPool);
  const priorReceipts = await productionPool.query<{ profile_id: string }>(
    `SELECT profile_id
       FROM user_supplied_directory_import_receipts
      WHERE source_key=$1 AND source_sha256=$2`,
    [
      LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
      LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
    ],
  );
  const priorProfileIds = new Set(priorReceipts.rows.map((row) => row.profile_id));
  const pending = profiles.filter((profile) => !priorProfileIds.has(profile.id));
  summary.alreadyActivated = profiles.length - pending.length;
  summary.pending = pending.length;
  if (pending.length === 0) return summary;

  const client = await productionPool.connect() as unknown as PublicationClient;
  try {
    await client.query("BEGIN");
    for (let offset = 0; offset < pending.length; offset += 50) {
      const batch = pending.slice(offset, offset + 50);
      const values: unknown[] = [];
      const tuples = batch.map((profile, index) => {
        const base = index * 22;
        values.push(
          profile.id, profile.name, profile.category, profile.subcategory,
          profile.address, profile.city, profile.state, profile.country,
          false, JSON.stringify(profile.ownershipDesignations), profile.ownershipClaim,
          profile.description, profile.phone, profile.website, profile.instagram, profile.facebook,
          profile.dedupeKey, profile.sourceLabel, profile.sourceUrl,
          profile.recommendationReason, profile.intakeBatchReference,
          JSON.stringify(["source-reported", "hispanic-owned", "latinx-owned", "lehigh-valley"]),
        );
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},
          'live_unclaimed','unclaimed',false,$${base + 10}::jsonb,'[]'::jsonb,$${base + 11},false,$${base + 12},NULL,NULL,
          $${base + 13},$${base + 14},NULL,$${base + 15},NULL,$${base + 16},$${base + 17},'active','community_listed','${LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE}',false,false,
          $${base + 18},$${base + 19},$${base + 20},$${base + 21},$${base + 22}::jsonb)`;
      });
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO businesses
          (id,name,category,subcategory,address,city,state,country,is_online_only,
           listing_status,owner_claim_status,verified,ownership_designations,verified_designations,
           ownership_claim,black_owned,description,latitude,longitude,phone,website,tiktok,instagram,youtube,facebook,
           dedupe_key,status,profile_status,data_source,is_duplicate,permanently_hidden,
           research_source_label,research_source_url,kinfolk_recommendation_reason,intake_batch_reference,tags)
         VALUES ${tuples.join(",")}
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        values,
      );
      const createdIds = new Set(inserted.rows.map((row) => row.id));
      summary.created += createdIds.size;
      summary.existingSameSourceId += batch.length - createdIds.size;

      const receiptValues: unknown[] = [];
      const receiptTuples = batch.map((profile, index) => {
        const base = index * 8;
        receiptValues.push(
          LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
          LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
          profile.id,
          profile.sourceRow,
          profile.id,
          createdIds.has(profile.id) ? "created" : "existing_same_source_id",
          LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
          actorId,
        );
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
      });
      await client.query(
        `INSERT INTO user_supplied_directory_import_receipts
          (source_key,source_sha256,profile_id,source_row,business_id,outcome,policy_version,activated_by)
         VALUES ${receiptTuples.join(",")}
         ON CONFLICT (source_key,source_sha256,profile_id) DO NOTHING`,
        receiptValues,
      );
    }
    await client.query("COMMIT");
    return summary;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

type PinCandidate = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string | null;
};

/**
 * Runs after the HTTP listener is ready. It attempts only strict, exact-address
 * geocodes for this founder-authorized source and preserves every unresolved
 * record as a searchable directory profile without a fabricated map location.
 */
export async function resolveLatinxLehighValleyPins(
  productionPool: Pick<Pool, "query">,
  log: Log,
  resolveLocation: LocationResolver = resolvePreciseBusinessLocation,
): Promise<LatinxLehighValleyPinSummary> {
  const candidates = await productionPool.query<PinCandidate>(
    `SELECT id,name,category,subcategory,description,address,city,state,country,website
       FROM businesses
      WHERE data_source=$1
        AND status='active'
        AND listing_status='live_unclaimed'
        AND latitude IS NULL
        AND longitude IS NULL
        AND COALESCE(is_online_only, false)=false
        AND NULLIF(BTRIM(address), '') IS NOT NULL
        AND address ~ '[0-9]'
        AND address ~ '[[:alpha:]]'
      ORDER BY id`,
    [LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE],
  );
  const summary = {
    eligibleStreetAddresses: candidates.rows.length,
    attempted: 0,
    pinned: 0,
    unresolved: 0,
    errors: 0,
  };

  for (const candidate of candidates.rows) {
    summary.attempted += 1;
    try {
      const location = await resolveLocation(candidate);
      if (!location || !isValidPinCoordinates(location.lat, location.lng)) {
        summary.unresolved += 1;
        continue;
      }
      const updated = await productionPool.query<{ id: string }>(
        `UPDATE businesses
            SET latitude=$2,
                longitude=$3,
                public_location_kind='address',
                source_evidence=CASE
                  WHEN jsonb_typeof(COALESCE(source_evidence, '[]'::jsonb))='array'
                    THEN COALESCE(source_evidence, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                      'sourceType',$4,'field','precise_location','supports',true,
                      'verifiedByMwm',false,'excerpt',$5,'policyVersion',$6
                    ))
                  ELSE jsonb_build_array(source_evidence,jsonb_build_object(
                    'sourceType',$4,'field','precise_location','supports',true,
                    'verifiedByMwm',false,'excerpt',$5,'policyVersion',$6
                  ))
                END,
                updated_at=NOW()
          WHERE id=$1
            AND data_source=$7
            AND status='active'
            AND listing_status='live_unclaimed'
            AND latitude IS NULL
            AND longitude IS NULL
            AND address IS NOT DISTINCT FROM $8
            AND city IS NOT DISTINCT FROM $9
            AND state IS NOT DISTINCT FROM $10
            AND country IS NOT DISTINCT FROM $11
          RETURNING id`,
        [
          candidate.id, location.lat, location.lng, location.source,
          location.formattedAddress ?? candidate.address, PIN_POLICY_VERSION,
          LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE, candidate.address, candidate.city,
          candidate.state, candidate.country,
        ],
      );
      if (updated.rows.length > 0) summary.pinned += 1;
      else summary.unresolved += 1;
    } catch {
      summary.errors += 1;
    }
    if (summary.attempted % 10 === 0 || summary.attempted === candidates.rows.length) {
      log("Latinx Lehigh Valley exact-pin progress", { ...summary });
    }
  }
  return summary;
}

export function startLatinxLehighValleyPinResolution(
  productionPool: Pick<Pool, "query">,
  log: Log,
): void {
  setTimeout(() => {
    resolveLatinxLehighValleyPins(productionPool, log)
      .then((summary) => log("Latinx Lehigh Valley exact-pin resolution complete", summary))
      .catch((error: unknown) => log("Latinx Lehigh Valley exact-pin resolution failed", {
        error: error instanceof Error ? error.message : String(error),
      }));
  }, 1_000).unref();
}

/**
 * Starts the approved one-time publication independently of optional startup
 * migrations. The HTTP listener is already live when this is called; a slow or
 * failed unrelated migration must never prevent this receipt-idempotent work.
 */
export function startLatinxLehighValleyPublication(
  productionPool: PublicationPool,
  log: Log,
): void {
  void (async () => {
    try {
      const publication = await publishLatinxLehighValleyDirectory(productionPool);
      log("Latinx Lehigh Valley directory publication complete", publication);
      startLatinxLehighValleyPinResolution(productionPool, log);
    } catch (error) {
      log("Latinx Lehigh Valley directory publication failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}
