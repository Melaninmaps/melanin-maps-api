import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

const DEFAULT_MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-04/directory-import-candidates.jsonl",
  import.meta.url,
));
const DEFAULT_LINK_RESULTS = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-04/directory-import-link-validation.json",
  import.meta.url,
));
const EXPECTED_ROWS = 18_051;
const EXPECTED_SHA256 = "e4c5921ed460535cdc5355a40799b01017a3cd77fca40c78fd03e3ffc852db34";
const EXPECTED_LINK_ROWS = 7_455;
const EXPECTED_LINK_SHA256 = "bdeb98fb8044863d550c7cc9f6feae9c54f2d23fe4ab090fcd2814b3e47eb31d";
const PINNED_LINK_CHECKED_AT = "2026-09-04T00:00:00.000Z";
const ALLOWED_TARGETS = new Set([
  "business",
  "community_resource",
  "regulated_review",
  "manual_review",
  "internal_only",
]);

type Candidate = {
  sourceRow: number;
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
  [key: string]: unknown;
};

type LinkResult = {
  url: string;
  result: string;
  status: number | null;
  finalUrl?: string | null;
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
      || !ALLOWED_TARGETS.has(candidate.targetKind)
      || !candidate.dedupeKey
      || !candidate.name
      || !candidate.city
      || !candidate.state
      || !candidate.category
    ) {
      throw new Error(`Invalid candidate at source row ${String(candidate.sourceRow ?? "unknown")}`);
    }
    candidates.push(candidate);
  }
  return candidates;
}

function loadLinks(path: string): Map<string, LinkResult> {
  if (!existsSync(path)) throw new Error(`Link validation results not found: ${path}`);
  const resultHash = sha256(path);
  if (resultHash !== EXPECTED_LINK_SHA256) {
    throw new Error(`Link validation checksum mismatch: expected ${EXPECTED_LINK_SHA256}, received ${resultHash}`);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as LinkResult[];
  if (parsed.length !== EXPECTED_LINK_ROWS) {
    throw new Error(`Link validation row count mismatch: expected ${EXPECTED_LINK_ROWS}, received ${parsed.length}`);
  }
  return new Map(parsed.map((item) => [item.url, item]));
}

function linkSummary(candidate: Candidate, links: Map<string, LinkResult>) {
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
    const finalUrl = result?.finalUrl ?? result?.url ?? url;
    let finalHost: string | null = null;
    try {
      finalHost = new URL(finalUrl).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      finalHost = null;
    }
    return [[field, result
      ? { url, result: result.result, status: result.status, finalUrl, finalHost, checkedAt: PINNED_LINK_CHECKED_AT }
      : { url, result: "not_checked", status: null, finalUrl: null, finalHost: null, checkedAt: null }]];
  }));
}

const REVIEW_REQUIRED_LINK_RESULTS = new Set([
  "broken",
  "server_error",
  "timeout",
  "network_error",
  "other",
  "not_checked",
]);

function reviewAssessment(
  candidate: Candidate,
  links: Map<string, LinkResult>,
  duplicateWithinBatch: boolean,
) {
  const validation = linkSummary(candidate, links);
  const reasons: string[] = [];
  if (Object.values(validation).some((entry) => REVIEW_REQUIRED_LINK_RESULTS.has(entry.result))) {
    reasons.push("link_requires_research");
  }
  if (candidate.regulatedProfession) reasons.push("regulated_profession");
  if (["manual_review", "regulated_review", "internal_only"].includes(candidate.targetKind)) {
    reasons.push(`target_kind:${candidate.targetKind}`);
  }
  if ((candidate.ownershipDesignations ?? []).length > 0) reasons.push("ownership_evidence_review");
  if (duplicateWithinBatch) reasons.push("duplicate_within_batch");
  if (
    candidate.offlineProductionNameMatch === "YES"
    || candidate.requestedAction === "RECONCILE_EXISTING_RECORD"
  ) reasons.push("existing_record_reconciliation");
  return {
    status: reasons.length > 0 ? "needs_research" : "pending_review",
    validation: { ...validation, reviewGates: reasons },
    reasons,
  } as const;
}

function stagedRecord(candidate: Candidate, links: Map<string, LinkResult>, duplicateWithinBatch: boolean) {
  const policy = getBusinessExperiencePolicy(candidate.category, candidate.subcategory);
  const assessment = reviewAssessment(candidate, links, duplicateWithinBatch);
  return {
    source_row: candidate.sourceRow,
    target_kind: candidate.targetKind,
    status: assessment.status,
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
    link_validation: assessment.validation,
    notes: candidate.notes ?? null,
    raw_record: candidate,
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
  const linkResultsPath = resolve(option("--link-results") ?? DEFAULT_LINK_RESULTS);
  const createdBy = option("--created-by");

  if (!existsSync(manifest)) throw new Error(`Manifest not found: ${manifest}`);
  const manifestHash = sha256(manifest);
  if (manifestHash !== EXPECTED_SHA256) {
    throw new Error(`Manifest checksum mismatch: expected ${EXPECTED_SHA256}, received ${manifestHash}`);
  }

  const candidates = await loadManifest(manifest);
  if (candidates.length !== EXPECTED_ROWS) {
    throw new Error(`Manifest row count mismatch: expected ${EXPECTED_ROWS}, received ${candidates.length}`);
  }

  const counts = Object.fromEntries([...ALLOWED_TARGETS].map((target) => [
    target,
    candidates.filter((candidate) => candidate.targetKind === target).length,
  ]));
  const sourceRows = new Set(candidates.map((candidate) => candidate.sourceRow));
  const exactKeys = new Set(candidates.map((candidate) => candidate.dedupeKey));
  const dedupeCounts = candidates.reduce<Map<string, number>>((counts, candidate) => {
    counts.set(candidate.dedupeKey, (counts.get(candidate.dedupeKey) ?? 0) + 1);
    return counts;
  }, new Map());
  const linkResults = loadLinks(linkResultsPath);
  const linkResultCounts = [...linkResults.values()].reduce<Record<string, number>>((counts, result) => {
    counts[result.result] = (counts[result.result] ?? 0) + 1;
    return counts;
  }, {});
  const reviewStatusCounts = candidates.reduce<Record<string, number>>((statusCounts, candidate) => {
    const assessment = reviewAssessment(candidate, linkResults, (dedupeCounts.get(candidate.dedupeKey) ?? 0) > 1);
    statusCounts[assessment.status] = (statusCounts[assessment.status] ?? 0) + 1;
    return statusCounts;
  }, {});
  const reconciliationCandidates = candidates.filter((candidate) => (
    candidate.offlineProductionNameMatch === "YES"
    || candidate.requestedAction === "RECONCILE_EXISTING_RECORD"
  ));
  const reconciliationHeld = reconciliationCandidates.filter((candidate) => (
    reviewAssessment(candidate, linkResults, (dedupeCounts.get(candidate.dedupeKey) ?? 0) > 1).status === "needs_research"
  ));
  if (reconciliationHeld.length !== reconciliationCandidates.length) {
    throw new Error("Every known production reconciliation candidate must be held for research.");
  }

  console.log(JSON.stringify({
    mode: apply ? "stage_candidates" : "dry_run",
    manifest: basename(manifest),
    manifestHash,
    rows: candidates.length,
    uniqueSourceRows: sourceRows.size,
    uniqueDedupeKeys: exactKeys.size,
    targetCounts: counts,
    checkedLinks: linkResults.size,
    linkResultCounts,
    reviewStatusCounts,
    reconciliationCandidates: reconciliationCandidates.length,
    reconciliationHeld: reconciliationHeld.length,
    publicationWrites: 0,
  }, null, 2));

  if (!apply) return;
  assertLocalDirectoryStagingFromProcess();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batch = await client.query<{ id: string; status: string }>(
      `INSERT INTO directory_import_batches
         (source_name, source_sha256, source_row_count, status, created_by)
       VALUES ($1,$2,$3,'staged',$4)
       ON CONFLICT (source_sha256) DO UPDATE SET updated_at = NOW()
       RETURNING id, status`,
      [basename(manifest), manifestHash, candidates.length, createdBy],
    );
    const batchId = batch.rows[0]!.id;
    if (batch.rows[0]!.status === "cancelled") {
      throw new Error("The matching directory import batch is cancelled and cannot be restaged.");
    }

    let inserted = 0;
    const chunkSize = 250;
    for (let index = 0; index < candidates.length; index += chunkSize) {
      const chunk = candidates.slice(index, index + chunkSize).map((candidate) => stagedRecord(
        candidate,
        linkResults,
        (dedupeCounts.get(candidate.dedupeKey) ?? 0) > 1,
      ));
      inserted += await insertChunk(client, batchId, chunk);
      if ((index + chunk.length) % 2_500 === 0 || index + chunk.length === candidates.length) {
        console.log(`staged ${index + chunk.length}/${candidates.length}`);
      }
    }

    await client.query(
      `UPDATE directory_import_candidates c
          SET matched_business_id = b.id,
              status = 'needs_research',
              link_validation = jsonb_set(
                COALESCE(c.link_validation, '{}'::jsonb),
                '{reviewGates}',
                COALESCE(c.link_validation->'reviewGates', '[]'::jsonb) || '["existing_record_match"]'::jsonb,
                true
              ),
              updated_at = NOW()
         FROM businesses b
        WHERE c.batch_id = $1
          AND c.target_kind IN ('business', 'regulated_review')
          AND c.status IN ('pending_review', 'needs_research')
          AND c.matched_business_id IS NULL
          AND b.dedupe_key = c.dedupe_key
          AND COALESCE(b.is_duplicate, false) = false
          AND COALESCE(b.status, '') NOT IN ('duplicate','permanently_hidden','removed','deleted')`,
      [batchId],
    );

    const stagedCount = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM directory_import_candidates
        WHERE batch_id = $1`,
      [batchId],
    );
    if (Number(stagedCount.rows[0]?.count ?? 0) !== EXPECTED_ROWS) {
      throw new Error(`Atomic staging count mismatch: expected ${EXPECTED_ROWS}, received ${stagedCount.rows[0]?.count ?? 0}`);
    }
    const readyBatch = await client.query<{ status: string }>(
      `UPDATE directory_import_batches
          SET status = CASE WHEN status = 'completed' THEN status ELSE 'in_review' END,
              source_row_count = $2,
              updated_at = NOW()
        WHERE id = $1
        RETURNING status`,
      [batchId, EXPECTED_ROWS],
    );
    await client.query("COMMIT");

    console.log(JSON.stringify({ batchId, inserted, stagedRows: EXPECTED_ROWS, batchStatus: readyBatch.rows[0]?.status ?? "unknown", publicationWrites: 0 }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.argv.includes("--apply") && process.env.DATABASE_URL) await pool.end();
  });
