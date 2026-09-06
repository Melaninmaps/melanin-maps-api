import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";
import { assertKinfolkPocCandidatePrivacy } from "./lib/kinfolk-poc-privacy";

const DEFAULT_MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-05-kinfolk-poc-businesses/kinfolk-poc-business-candidates.jsonl",
  import.meta.url,
));
const DEFAULT_LINKS = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-05-kinfolk-poc-businesses/kinfolk-poc-link-validation.json",
  import.meta.url,
));
const EXPECTED_ROWS = 115;
const EXPECTED_MANIFEST_SHA256 = "a1981d62915bad12ce076dea670f6d12eaa95aa39517aa8bdc89c02a2ded8502";
const EXPECTED_LINK_ROWS = 171;
const EXPECTED_LINK_SHA256 = "0e711957db6f77e2e6d9839b44e611580b1bacd44a0c81c87fe4c9838673cfc9";
const ALLOWED_TARGETS = new Set(["business", "community_resource", "regulated_review", "manual_review", "internal_only"]);
const ACCEPTED_LINK_RESULTS = new Set(["working", "reachable_restricted"]);

type Candidate = {
  sourceRow: number;
  sourceRecordId: string;
  targetKind: string;
  dedupeKey: string;
  name: string;
  city: string;
  state: string;
  country: string;
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
  searchTags?: string[];
  reviewHoldReasons?: string[];
  notes?: string | null;
  [key: string]: unknown;
};

type LinkValidation = {
  inputUrl: string;
  result: "working" | "reachable_restricted" | "unresolved";
  finalUrl: string | null;
  finalHost: string | null;
  status: number | null;
  checkedAt: string;
};

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function loadManifest(path: string): Promise<Candidate[]> {
  const rows: Candidate[] = [];
  const lines = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Candidate;
    if (
      !Number.isInteger(row.sourceRow)
      || !row.sourceRecordId
      || !ALLOWED_TARGETS.has(row.targetKind)
      || !row.dedupeKey
      || !row.name
      || !row.city
      || !row.state
      || !row.category
      || row.personaDataIncluded !== false
    ) throw new Error(`Invalid or privacy-unsafe candidate at source row ${String(row.sourceRow ?? "unknown")}`);
    assertKinfolkPocCandidatePrivacy(row as unknown as Record<string, unknown>);
    rows.push(row);
  }
  return rows;
}

function loadLinks(path: string): Map<string, LinkValidation> {
  if (sha256(path) !== EXPECTED_LINK_SHA256) throw new Error("Workbook link-validation checksum mismatch.");
  const rows = JSON.parse(readFileSync(path, "utf8")) as LinkValidation[];
  if (rows.length !== EXPECTED_LINK_ROWS) throw new Error(`Expected ${EXPECTED_LINK_ROWS} link results, received ${rows.length}.`);
  return new Map(rows.map((row) => [row.inputUrl, row]));
}

function linkEvidence(candidate: Candidate, links: Map<string, LinkValidation>) {
  const fields = [
    ["website", candidate.website],
    ["source", candidate.sourceUrl],
    ["instagram", candidate.instagramUrl],
    ["facebook", candidate.facebookUrl],
    ["tiktok", candidate.tiktokUrl],
    ["socialSource", candidate.socialSourceUrl],
  ] as const;
  return Object.fromEntries(fields.flatMap(([field, url]) => {
    if (!url) return [];
    const result = links.get(url);
    return [[field, result
      ? { url, result: result.result, status: result.status, finalUrl: result.finalUrl, finalHost: result.finalHost, checkedAt: result.checkedAt }
      : { url, result: "not_checked", status: null, finalUrl: null, finalHost: null, checkedAt: null }]];
  }));
}

function stagedRecord(candidate: Candidate, links: Map<string, LinkValidation>, duplicateWithinBatch: boolean) {
  const evidence = linkEvidence(candidate, links);
  const reviewGates = new Set(candidate.reviewHoldReasons ?? []);
  if (Object.values(evidence).some((entry) => !ACCEPTED_LINK_RESULTS.has(String(entry.result)))) reviewGates.add("link_requires_research");
  if (candidate.regulatedProfession) reviewGates.add("regulated_profession");
  if (["manual_review", "internal_only"].includes(candidate.targetKind)) reviewGates.add(`target_kind:${candidate.targetKind}`);
  if ((candidate.ownershipDesignations ?? []).length > 0) reviewGates.add("ownership_evidence_review");
  if (!candidate.address) reviewGates.add("street_address_required_before_publication");
  if (candidate.country !== "USA") reviewGates.add("country_aware_publication_required");
  if (duplicateWithinBatch) reviewGates.add("duplicate_within_batch");
  const policy = getBusinessExperiencePolicy(candidate.category, candidate.subcategory);
  return {
    source_row: candidate.sourceRow,
    target_kind: candidate.targetKind,
    status: reviewGates.size > 0 ? "needs_research" : "pending_review",
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
    link_validation: { ...evidence, reviewGates: [...reviewGates].sort() },
    notes: candidate.notes ?? null,
    raw_record: candidate,
  };
}

async function insertChunk(client: PoolClient, batchId: string, rows: ReturnType<typeof stagedRecord>[]): Promise<number> {
  const result = await client.query(
    `INSERT INTO directory_import_candidates (
       batch_id, source_row, target_kind, status, dedupe_key, name, city, state, category,
       subcategory, cultural_specialty, address, phone, website, source_url, source_name,
       source_status, ownership_designations, ownership_evidence, regulated_profession,
       public_display_recommendation, instagram_url, facebook_url, tiktok_url,
       social_source_url, price_range, price_basis, suggested_experience_keys,
       link_validation, notes, raw_record
     ) SELECT $1::uuid, x.source_row, x.target_kind, x.status, x.dedupe_key, x.name, x.city,
              x.state, x.category, x.subcategory, x.cultural_specialty, x.address, x.phone,
              x.website, x.source_url, x.source_name, x.source_status, x.ownership_designations,
              x.ownership_evidence, x.regulated_profession, x.public_display_recommendation,
              x.instagram_url, x.facebook_url, x.tiktok_url, x.social_source_url,
              x.price_range, x.price_basis, x.suggested_experience_keys, x.link_validation,
              x.notes, x.raw_record
       FROM jsonb_to_recordset($2::jsonb) AS x(
         source_row integer, target_kind text, status text, dedupe_key text, name text,
         city text, state text, category text, subcategory text, cultural_specialty text,
         address text, phone text, website text, source_url text, source_name text,
         source_status text, ownership_designations jsonb, ownership_evidence text,
         regulated_profession boolean, public_display_recommendation text,
         instagram_url text, facebook_url text, tiktok_url text, social_source_url text,
         price_range text, price_basis text, suggested_experience_keys jsonb,
         link_validation jsonb, notes text, raw_record jsonb
       ) ON CONFLICT (batch_id, source_row) DO NOTHING`,
    [batchId, JSON.stringify(rows)],
  );
  return result.rowCount ?? 0;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const manifest = resolve(option("--manifest") ?? DEFAULT_MANIFEST);
  const linksPath = resolve(option("--link-results") ?? DEFAULT_LINKS);
  const createdBy = option("--created-by");
  if (sha256(manifest) !== EXPECTED_MANIFEST_SHA256) throw new Error("Workbook manifest checksum mismatch.");
  const candidates = await loadManifest(manifest);
  if (candidates.length !== EXPECTED_ROWS) throw new Error(`Expected ${EXPECTED_ROWS} candidates, received ${candidates.length}.`);
  if (new Set(candidates.map((row) => row.sourceRow)).size !== EXPECTED_ROWS) throw new Error("Workbook source rows are not unique.");
  if (new Set(candidates.map((row) => row.dedupeKey)).size !== EXPECTED_ROWS) throw new Error("Workbook dedupe keys are not unique.");
  const links = loadLinks(linksPath);
  const dedupeCounts = candidates.reduce<Map<string, number>>((counts, row) => counts.set(row.dedupeKey, (counts.get(row.dedupeKey) ?? 0) + 1), new Map());
  const staged = candidates.map((row) => stagedRecord(row, links, (dedupeCounts.get(row.dedupeKey) ?? 0) > 1));
  const targetCounts = Object.fromEntries([...ALLOWED_TARGETS].map((target) => [target, candidates.filter((row) => row.targetKind === target).length]));
  const reviewStatusCounts = Object.fromEntries(["pending_review", "needs_research"].map((status) => [status, staged.filter((row) => row.status === status).length]));
  const linkResultCounts = [...links.values()].reduce<Record<string, number>>((counts, row) => {
    counts[row.result] = (counts[row.result] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({
    mode: apply ? "stage_candidates" : "dry_run",
    manifest: basename(manifest),
    manifestHash: EXPECTED_MANIFEST_SHA256,
    rows: candidates.length,
    targetCounts,
    reviewStatusCounts,
    linkResultCounts,
    personaDataIncluded: false,
    publicationWrites: 0,
  }, null, 2));
  if (!apply) return;
  assertLocalDirectoryStagingFromProcess();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batch = await client.query<{ id: string; status: string }>(
      `INSERT INTO directory_import_batches (source_name, source_sha256, source_row_count, status, created_by)
       VALUES ($1,$2,$3,'staged',$4)
       ON CONFLICT (source_sha256) DO UPDATE SET updated_at=NOW()
       RETURNING id,status`,
      [basename(manifest), EXPECTED_MANIFEST_SHA256, EXPECTED_ROWS, createdBy],
    );
    const batchId = batch.rows[0]!.id;
    if (batch.rows[0]!.status === "cancelled") throw new Error("The matching workbook batch is cancelled.");
    let inserted = 0;
    for (let index = 0; index < staged.length; index += 100) inserted += await insertChunk(client, batchId, staged.slice(index, index + 100));
    await client.query(
      `UPDATE directory_import_candidates c
          SET matched_business_id=b.id, status='needs_research',
              link_validation=jsonb_set(COALESCE(c.link_validation,'{}'::jsonb),'{reviewGates}',
                COALESCE(c.link_validation->'reviewGates','[]'::jsonb) || '["existing_record_match"]'::jsonb,true),
              updated_at=NOW()
         FROM businesses b
        WHERE c.batch_id=$1 AND c.target_kind IN ('business','regulated_review')
          AND c.matched_business_id IS NULL
          AND COALESCE(b.is_duplicate,false)=false
          AND COALESCE(b.status,'active') NOT IN ('duplicate','permanently_hidden','removed','deleted')
          AND (b.dedupe_key=c.dedupe_key OR (
            lower(trim(b.name))=lower(trim(c.name))
            AND lower(trim(b.city))=lower(trim(c.city))
            AND upper(trim(COALESCE(b.state,'')))=upper(trim(COALESCE(c.state,'')))
          ))`,
      [batchId],
    );
    const count = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM directory_import_candidates WHERE batch_id=$1", [batchId]);
    if (Number(count.rows[0]?.count ?? 0) !== EXPECTED_ROWS) throw new Error("Atomic workbook staging count mismatch.");
    const ready = await client.query<{ status: string }>(
      `UPDATE directory_import_batches SET status=CASE WHEN status='completed' THEN status ELSE 'in_review' END,
       source_row_count=$2,updated_at=NOW() WHERE id=$1 RETURNING status`,
      [batchId, EXPECTED_ROWS],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ batchId, inserted, stagedRows: EXPECTED_ROWS, batchStatus: ready.rows[0]?.status, publicationWrites: 0 }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => {
  if (process.argv.includes("--apply") && process.env.DATABASE_URL) await pool.end();
});
