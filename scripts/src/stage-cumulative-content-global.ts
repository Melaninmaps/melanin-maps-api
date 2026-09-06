import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

const DEFAULT_MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-05-cumulative-content-global/cumulative-content-global-candidates.jsonl",
  import.meta.url,
));
const EXPECTED_ROWS = 7_315;
const EXPECTED_SHA256 = "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8";
const ALLOWED_TARGETS = new Set(["business", "community_resource", "regulated_review", "manual_review"]);

type Candidate = {
  sourceRow: number;
  sourceWorkbook: string;
  sourceSheet: string;
  sourceWorkbookRow: number;
  targetKind: string;
  dedupeKey: string;
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory?: string | null;
  culturalSpecialty?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sourceStatus?: string | null;
  ownershipDesignations?: string[];
  ownershipEvidence?: string | null;
  regulatedProfession?: boolean;
  publicDisplayRecommendation?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  socialSourceUrl?: string | null;
  priceRange?: string | null;
  priceBasis?: string | null;
  notes?: string | null;
  reviewGates: string[];
  rawRecord: Record<string, unknown>;
};

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function loadManifest(path: string): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  const lines = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const candidate = JSON.parse(line) as Candidate;
    if (
      !Number.isInteger(candidate.sourceRow)
      || !Number.isInteger(candidate.sourceWorkbookRow)
      || !ALLOWED_TARGETS.has(candidate.targetKind)
      || !candidate.dedupeKey
      || !candidate.name
      || !candidate.city
      || !candidate.state
      || !candidate.category
      || !candidate.sourceWorkbook
      || !candidate.sourceSheet
      || !Array.isArray(candidate.reviewGates)
      || candidate.reviewGates.length === 0
    ) {
      throw new Error(`Invalid candidate at synthetic source row ${String(candidate.sourceRow ?? "unknown")}`);
    }
    candidates.push(candidate);
  }
  return candidates;
}

function linkEntry(url: string | null | undefined) {
  if (!url) return undefined;
  let host: string | null = null;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    host = null;
  }
  return { url, result: "not_checked", status: null, finalUrl: null, finalHost: host, checkedAt: null };
}

function stagedRecord(candidate: Candidate) {
  const policy = getBusinessExperiencePolicy(candidate.category, candidate.subcategory);
  const linkValidation = Object.fromEntries([
    ["website", linkEntry(candidate.website)],
    ["source", linkEntry(candidate.sourceUrl)],
    ["instagram", linkEntry(candidate.instagramUrl)],
    ["facebook", linkEntry(candidate.facebookUrl)],
    ["tiktok", linkEntry(candidate.tiktokUrl)],
    ["socialSource", linkEntry(candidate.socialSourceUrl)],
  ].filter((entry): entry is [string, NonNullable<ReturnType<typeof linkEntry>>] => Boolean(entry[1])));
  return {
    source_row: candidate.sourceRow,
    target_kind: candidate.targetKind,
    status: "needs_research",
    dedupe_key: candidate.dedupeKey,
    name: candidate.name,
    city: candidate.city,
    state: candidate.state,
    category: candidate.category,
    subcategory: candidate.subcategory ?? null,
    cultural_specialty: candidate.culturalSpecialty ?? null,
    address: candidate.address ?? null,
    phone: candidate.phone ?? null,
    website: candidate.website ?? null,
    source_url: candidate.sourceUrl ?? null,
    source_name: candidate.sourceName ?? null,
    source_status: candidate.sourceStatus ?? null,
    ownership_designations: candidate.ownershipDesignations ?? [],
    ownership_evidence: candidate.ownershipEvidence ?? null,
    regulated_profession: candidate.regulatedProfession === true,
    public_display_recommendation: candidate.publicDisplayRecommendation ?? null,
    instagram_url: candidate.instagramUrl ?? null,
    facebook_url: candidate.facebookUrl ?? null,
    tiktok_url: candidate.tiktokUrl ?? null,
    social_source_url: candidate.socialSourceUrl ?? null,
    price_range: candidate.priceRange ?? null,
    price_basis: candidate.priceBasis ?? null,
    suggested_experience_keys: {
      policyCategory: policy.category,
      atmosphereLabel: policy.atmosphereLabel,
      reactionLabel: policy.reactionLabel,
      vibes: policy.vibeChoices.map((choice) => choice.key),
      reactions: policy.reactionChoices.map((choice) => choice.key),
      prices: policy.priceChoices.map((choice) => choice.key),
    },
    link_validation: { ...linkValidation, reviewGates: candidate.reviewGates },
    notes: candidate.notes ?? null,
    raw_record: {
      sourceWorkbook: candidate.sourceWorkbook,
      sourceSheet: candidate.sourceSheet,
      sourceWorkbookRow: candidate.sourceWorkbookRow,
      reviewGates: candidate.reviewGates,
      ...candidate.rawRecord,
    },
  };
}

async function insertChunk(client: PoolClient, batchId: string, rows: ReturnType<typeof stagedRecord>[]): Promise<number> {
  const result = await client.query(
    `INSERT INTO directory_import_candidates (
       batch_id, source_row, target_kind, status, dedupe_key, name, city, state, category,
       subcategory, cultural_specialty, address, phone, website, source_url,
       source_name, source_status, ownership_designations, ownership_evidence,
       regulated_profession, public_display_recommendation, instagram_url,
       facebook_url, tiktok_url, social_source_url, price_range, price_basis,
       suggested_experience_keys, link_validation, notes, raw_record
     )
     SELECT $1::uuid, x.source_row, x.target_kind, x.status, x.dedupe_key, x.name, x.city,
            x.state, x.category, x.subcategory, x.cultural_specialty, x.address,
            x.phone, x.website, x.source_url, x.source_name, x.source_status,
            x.ownership_designations, x.ownership_evidence, x.regulated_profession,
            x.public_display_recommendation, x.instagram_url, x.facebook_url,
            x.tiktok_url, x.social_source_url, x.price_range, x.price_basis,
            x.suggested_experience_keys, x.link_validation, x.notes, x.raw_record
       FROM jsonb_to_recordset($2::jsonb) AS x(
         source_row integer, target_kind text, status text, dedupe_key text, name text, city text,
         state text, category text, subcategory text, cultural_specialty text,
         address text, phone text, website text, source_url text, source_name text,
         source_status text, ownership_designations jsonb, ownership_evidence text,
         regulated_profession boolean, public_display_recommendation text,
         instagram_url text, facebook_url text, tiktok_url text, social_source_url text,
         price_range text, price_basis text, suggested_experience_keys jsonb,
         link_validation jsonb, notes text, raw_record jsonb
       )
     ON CONFLICT (batch_id, source_row) DO NOTHING`,
    [batchId, JSON.stringify(rows)],
  );
  return result.rowCount ?? 0;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const manifest = resolve(option("--manifest") ?? DEFAULT_MANIFEST);
  const createdBy = option("--created-by");
  if (!existsSync(manifest)) throw new Error(`Manifest not found: ${manifest}`);
  const manifestHash = sha256(manifest);
  if (manifestHash !== EXPECTED_SHA256) {
    throw new Error(`Manifest checksum mismatch: expected ${EXPECTED_SHA256}, received ${manifestHash}`);
  }
  const candidates = await loadManifest(manifest);
  if (candidates.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, received ${candidates.length}`);
  }
  const sourceRows = new Set(candidates.map((candidate) => candidate.sourceRow));
  if (sourceRows.size !== EXPECTED_ROWS) throw new Error("Synthetic source rows are not unique");
  const targetCounts = Object.fromEntries([...ALLOWED_TARGETS].sort().map((target) => [
    target,
    candidates.filter((candidate) => candidate.targetKind === target).length,
  ]));
  const gateCounts = candidates
    .flatMap((candidate) => candidate.reviewGates)
    .reduce<Record<string, number>>((counts, gate) => {
      counts[gate] = (counts[gate] ?? 0) + 1;
      return counts;
    }, {});
  console.log(JSON.stringify({
    mode: apply ? "stage_candidates" : "dry_run",
    manifest: basename(manifest),
    manifestHash,
    rows: candidates.length,
    targetCounts,
    reviewGateCounts: gateCounts,
    publicationWrites: 0,
  }, null, 2));
  if (!apply) return;

  assertLocalDirectoryStagingFromProcess();
  const stagingPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 120_000,
    query_timeout: 130_000,
  });
  const client = await stagingPool.connect().catch(async (error) => {
    await stagingPool.end().catch(() => undefined);
    throw error;
  });
  try {
    await client.query("BEGIN");
    const batch = await client.query<{ id: string; status: string }>(
      `INSERT INTO directory_import_batches
         (source_name, source_sha256, source_row_count, status, created_by)
       VALUES ($1,$2,$3,'staged',$4)
       ON CONFLICT (source_sha256) DO UPDATE SET updated_at=NOW()
       RETURNING id,status`,
      [basename(manifest), manifestHash, candidates.length, createdBy],
    );
    const batchId = batch.rows[0]!.id;
    if (batch.rows[0]!.status === "cancelled") {
      throw new Error("The matching workbook batch is cancelled and cannot be restaged");
    }
    let inserted = 0;
    for (let index = 0; index < candidates.length; index += 250) {
      const chunk = candidates.slice(index, index + 250).map(stagedRecord);
      inserted += await insertChunk(client, batchId, chunk);
      if ((index + chunk.length) % 2_500 === 0 || index + chunk.length === candidates.length) {
        console.log(`staged ${index + chunk.length}/${candidates.length}`);
      }
    }
    await client.query("SET LOCAL statement_timeout='120s'");
    await client.query({
      text: `WITH candidate_scope AS MATERIALIZED (
        SELECT c.id, c.dedupe_key, lower(trim(c.name)) AS normalized_name,
               lower(trim(c.city)) AS normalized_city,
               upper(trim(COALESCE(c.state,''))) AS normalized_state
          FROM directory_import_candidates c
         WHERE c.batch_id=$1
           AND c.target_kind IN ('business','regulated_review')
      ), eligible_businesses AS MATERIALIZED (
        SELECT b.id, b.dedupe_key, lower(trim(b.name)) AS normalized_name,
               lower(trim(b.city)) AS normalized_city,
               upper(trim(COALESCE(b.state,''))) AS normalized_state
          FROM businesses b
         WHERE COALESCE(b.is_duplicate,false)=false
           AND COALESCE(b.permanently_hidden,false)=false
           AND COALESCE(b.status,'active') NOT IN ('duplicate','permanently_hidden','removed','deleted')
      ), possible_matches AS (
        SELECT c.id AS candidate_id, b.id AS business_id
          FROM candidate_scope c
          JOIN eligible_businesses b ON b.dedupe_key=c.dedupe_key
        UNION
        SELECT c.id AS candidate_id, b.id AS business_id
          FROM candidate_scope c
          JOIN eligible_businesses b
            ON b.normalized_name=c.normalized_name
           AND b.normalized_city=c.normalized_city
           AND b.normalized_state=c.normalized_state
      ), candidate_matches AS (
        SELECT c.id AS candidate_id,
               COUNT(p.business_id)::integer AS match_count,
               MIN(p.business_id) AS sole_business_id,
               COALESCE(
                 ARRAY_AGG(p.business_id ORDER BY p.business_id) FILTER (WHERE p.business_id IS NOT NULL),
                 ARRAY[]::varchar[]
               ) AS business_ids
          FROM candidate_scope c
          LEFT JOIN possible_matches p ON p.candidate_id=c.id
         GROUP BY c.id
      ), desired_match_state AS (
        SELECT c.id AS candidate_id,
               CASE WHEN m.match_count=1 THEN m.sole_business_id ELSE NULL END AS matched_business_id,
               jsonb_set(
                 COALESCE(c.link_validation,'{}'::jsonb),
                 '{reviewGates}',
                 (
                   SELECT COALESCE(jsonb_agg(gate ORDER BY gate),'[]'::jsonb)
                     FROM (
                       SELECT gate
                         FROM jsonb_array_elements_text(
                           COALESCE(c.link_validation->'reviewGates','[]'::jsonb)
                         ) AS existing(gate)
                        WHERE gate NOT IN ('existing_record_match','ambiguous_existing_record_matches')
                       UNION
                       SELECT CASE
                         WHEN m.match_count=1 THEN 'existing_record_match'
                         WHEN m.match_count>1 THEN 'ambiguous_existing_record_matches'
                         ELSE NULL
                       END
                     ) normalized
                    WHERE gate IS NOT NULL
                 ),
                 true
               ) AS link_validation,
               CASE
                 WHEN m.match_count>1 THEN jsonb_set(
                   COALESCE(c.review_evidence,'{}'::jsonb),
                   '{existingRecordMatches}',
                   jsonb_build_object('count',m.match_count,'businessIds',to_jsonb(m.business_ids)),
                   true
                 )
                 ELSE COALESCE(c.review_evidence,'{}'::jsonb) - 'existingRecordMatches'
               END AS review_evidence
          FROM directory_import_candidates c
          JOIN candidate_matches m ON m.candidate_id=c.id
      )
       UPDATE directory_import_candidates c
          SET matched_business_id=d.matched_business_id,
              link_validation=d.link_validation,
              review_evidence=d.review_evidence,
              updated_at=NOW()
         FROM desired_match_state d
        WHERE c.id=d.candidate_id
          AND (
            c.matched_business_id IS DISTINCT FROM d.matched_business_id
            OR c.link_validation IS DISTINCT FROM d.link_validation
            OR c.review_evidence IS DISTINCT FROM d.review_evidence
          )`,
      values: [batchId],
    });
    const stagedCount = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM directory_import_candidates WHERE batch_id=$1`,
      [batchId],
    );
    if (Number(stagedCount.rows[0]?.count ?? 0) !== EXPECTED_ROWS) {
      throw new Error(`Atomic staging count mismatch: expected ${EXPECTED_ROWS}, received ${stagedCount.rows[0]?.count ?? 0}`);
    }
    const readyBatch = await client.query<{ status: string }>(
      `UPDATE directory_import_batches
          SET status=CASE WHEN status='completed' THEN status ELSE 'in_review' END,
              source_row_count=$2,
              updated_at=NOW()
        WHERE id=$1
        RETURNING status`,
      [batchId, EXPECTED_ROWS],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({
      batchId,
      inserted,
      stagedRows: EXPECTED_ROWS,
      batchStatus: readyBatch.rows[0]?.status ?? "unknown",
      publicationWrites: 0,
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await stagingPool.end();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
