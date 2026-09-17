import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { pool } from "@workspace/db";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import type { PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

/**
 * Stages the 2026-09-17 global research manifest for human review only.
 *
 * This adapter intentionally does not share the fixed checksum contract used by
 * stage-directory-import.ts. That script remains pinned to the prior approved
 * founder manifest. This adapter has its own integrity contract: it requires a
 * matching review summary and link-health report, preserves original evidence,
 * marks every regulated/resource/cultural/duplicate/existing-record case for
 * review, and rejects any attempt to run outside a local review database.
 * It never inserts or updates a public business, resource, map entity, user,
 * authentication record, session, waitlist row, or access entitlement.
 */

const DEFAULT_MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-17-global-review/global-review-only-candidates.jsonl",
  import.meta.url,
));
const DEFAULT_SUMMARY = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-17-global-review/global-review-summary.json",
  import.meta.url,
));
const DEFAULT_LINK_HEALTH = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-17-global-review/destination-health.json",
  import.meta.url,
));

const TARGET_KINDS = new Set([
  "business",
  "community_resource",
  "cultural_place",
  "regulated_review",
  "manual_review",
]);
const REVIEW_REQUIRED_OUTCOMES = new Set(["review_required", "timeout", "network_error"]);

type GlobalCandidate = {
  sourceRow: number;
  targetKind: string;
  dedupeKey: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  category: string;
  subcategory?: string | null;
  address: string;
  phone?: string | null;
  website?: string | null;
  sourceUrl: string;
  sourceName?: string | null;
  sourceStatus?: string | null;
  ownershipDesignations?: string[];
  ownershipEvidence?: string | null;
  regulatedProfession?: boolean;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  socialSourceUrl: string;
  notes?: string | null;
  servicesSearchTerms?: string | null;
};

type Summary = {
  accepted_review_only_candidates: number;
  manifest_sha256: string;
  publication_status?: string;
};

type HealthResult = {
  url: string;
  status: number | null;
  finalUrl: string | null;
  outcome: "reachable" | "review_required" | "timeout" | "network_error";
};

type LinkHealth = {
  candidates: number;
  results: HealthResult[];
  publication?: string;
};

type StagedCandidate = {
  source_row: number;
  target_kind: string;
  status: "pending_review" | "needs_research";
  dedupe_key: string;
  name: string;
  city: string;
  state: string | null;
  category: string;
  subcategory: string | null;
  cultural_specialty: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  source_url: string;
  source_name: string;
  source_status: string | null;
  ownership_designations: string[];
  ownership_evidence: string | null;
  regulated_profession: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  social_source_url: string;
  suggested_experience_keys: Record<string, unknown>;
  link_validation: Record<string, unknown>;
  notes: string;
  raw_record: Record<string, unknown>;
};

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalDedupeKey(candidate: Pick<GlobalCandidate, "name" | "city" | "state" | "address">): string {
  return `${normalizeText(candidate.name)}|${normalizeText(candidate.city)}|${normalizeText(candidate.state)}|addr:${normalizeText(candidate.address)}`;
}

function asHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Converts a legacy stringified address object into a readable street address. */
function canonicalAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("{")) return trimmed;

  const field = (name: string): string | null => {
    const match = trimmed.match(new RegExp(`["']${name}["']\\s*:\\s*["']([^"']+)["']`, "i"));
    return match?.[1]?.trim() || null;
  };
  const street = field("street") ?? field("address") ?? field("address1");
  const city = field("city");
  const region = field("region") ?? field("state") ?? field("province");
  const postalCode = field("postal_code") ?? field("postalCode") ?? field("zip");
  const country = field("country");
  const parts = [street, city, region, postalCode, country].filter(Boolean);
  return parts.length >= 2 ? parts.join(", ") : null;
}

function parseNotes(value: string | null | undefined): Record<string, unknown> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : { unparsed_notes: value };
  } catch {
    return { unparsed_notes: value };
  }
}

async function readManifest(path: string): Promise<GlobalCandidate[]> {
  const result: GlobalCandidate[] = [];
  const lines = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
  let lineNumber = 0;
  for await (const line of lines) {
    if (!line.trim()) continue;
    lineNumber += 1;
    const row = JSON.parse(line) as GlobalCandidate;
    const address = canonicalAddress(row.address);
    if (
      !Number.isInteger(row.sourceRow)
      || !TARGET_KINDS.has(row.targetKind)
      || !row.name?.trim()
      || !row.city?.trim()
      || !row.country?.trim()
      || !row.category?.trim()
      || !address
      || !asHttpUrl(row.sourceUrl)
      || !asHttpUrl(row.socialSourceUrl)
    ) {
      throw new Error(`Invalid global review candidate at manifest line ${lineNumber}.`);
    }
    result.push({ ...row, address, website: asHttpUrl(row.website), sourceUrl: asHttpUrl(row.sourceUrl)!, socialSourceUrl: asHttpUrl(row.socialSourceUrl)! });
  }
  return result;
}

function loadSummary(path: string, manifestPath: string, rowCount: number): Summary {
  const summary = JSON.parse(readFileSync(path, "utf8")) as Summary;
  if (!Number.isInteger(summary.accepted_review_only_candidates) || summary.accepted_review_only_candidates !== rowCount) {
    throw new Error("Review summary candidate count does not match the manifest.");
  }
  if (!/^[a-f0-9]{64}$/i.test(summary.manifest_sha256) || summary.manifest_sha256 !== sha256(manifestPath)) {
    throw new Error("Review summary manifest checksum does not match the manifest.");
  }
  if (summary.publication_status?.toUpperCase().includes("NOT PUBLISHED") !== true) {
    throw new Error("The supplied summary is not explicitly a review-only publication status.");
  }
  return summary;
}

function loadLinkHealth(path: string, rowCount: number): Map<string, HealthResult> {
  const report = JSON.parse(readFileSync(path, "utf8")) as LinkHealth;
  if (!Number.isInteger(report.candidates) || report.candidates !== rowCount || !Array.isArray(report.results)) {
    throw new Error("Destination-health report does not match the manifest candidate count.");
  }
  return new Map(report.results.map((result) => [result.url, result]));
}

function candidateLinkAssessment(candidate: GlobalCandidate, linkHealth: Map<string, HealthResult>): {
  validation: Record<string, unknown>;
  reviewGates: string[];
} {
  const fields = [
    ["officialWebsite", candidate.website],
    ["officialSocial", candidate.socialSourceUrl],
  ] as const;
  const destinations = Object.fromEntries(fields.flatMap(([key, url]) => {
    if (!url) return [];
    const result = linkHealth.get(url);
    return [[key, result ?? { url, status: null, finalUrl: null, outcome: "not_checked" }]];
  }));
  const reviewGates: string[] = [];
  for (const [key, value] of Object.entries(destinations)) {
    const outcome = (value as { outcome: string }).outcome;
    if (outcome === "not_checked" || REVIEW_REQUIRED_OUTCOMES.has(outcome)) {
      reviewGates.push(`${key}_link_requires_review`);
    }
  }
  return { validation: { destinations, reviewGates }, reviewGates };
}

function stagedCandidate(
  candidate: GlobalCandidate,
  manifestRow: number,
  linkHealth: Map<string, HealthResult>,
  duplicateWithinBatch: boolean,
): StagedCandidate {
  const links = candidateLinkAssessment(candidate, linkHealth);
  const notes = parseNotes(candidate.notes);
  const reviewGates = [...links.reviewGates];
  if (candidate.targetKind === "regulated_review" || candidate.regulatedProfession) reviewGates.push("regulated_credential_review");
  if (candidate.targetKind === "community_resource") reviewGates.push("resource_queue_only");
  if (candidate.targetKind === "cultural_place") reviewGates.push("cultural_queue_only");
  if (candidate.targetKind === "manual_review") reviewGates.push("manual_review_target");
  if ((candidate.ownershipDesignations ?? []).length > 0) reviewGates.push("ownership_evidence_review");
  if (duplicateWithinBatch) reviewGates.push("duplicate_within_batch");

  const policy = getBusinessExperiencePolicy(candidate.category, candidate.subcategory);
  const rawRecord = {
    ...candidate,
    stage_global_review: {
      manifest_row: manifestRow,
      original_source_row: candidate.sourceRow,
      country: candidate.country,
      original_dedupe_key: candidate.dedupeKey,
      normalized_address: candidate.address,
      source_notes: notes,
    },
  };

  return {
    source_row: manifestRow,
    target_kind: candidate.targetKind,
    status: reviewGates.length > 0 ? "needs_research" : "pending_review",
    dedupe_key: canonicalDedupeKey(candidate),
    name: candidate.name.trim(),
    city: candidate.city.trim(),
    state: candidate.state?.trim() || null,
    category: candidate.category.trim(),
    subcategory: candidate.subcategory?.trim() || null,
    cultural_specialty: typeof notes.cultural_specialty === "string" ? notes.cultural_specialty : null,
    address: candidate.address,
    phone: candidate.phone?.trim() || null,
    website: candidate.website ?? null,
    source_url: candidate.sourceUrl,
    source_name: candidate.sourceName?.trim() || "Official public listing source",
    source_status: candidate.sourceStatus?.trim() || null,
    ownership_designations: candidate.ownershipDesignations ?? [],
    ownership_evidence: candidate.ownershipEvidence?.trim() || null,
    regulated_profession: candidate.regulatedProfession === true || candidate.targetKind === "regulated_review",
    instagram_url: asHttpUrl(candidate.instagramUrl),
    facebook_url: asHttpUrl(candidate.facebookUrl),
    tiktok_url: asHttpUrl(candidate.tiktokUrl),
    social_source_url: candidate.socialSourceUrl,
    suggested_experience_keys: {
      policyCategory: policy.category,
      atmosphereLabel: policy.atmosphereLabel,
      reactionLabel: policy.reactionLabel,
      vibes: policy.vibeChoices.map((choice) => choice.key),
      reactions: policy.reactionChoices.map((choice) => choice.key),
      prices: policy.priceChoices.map((choice) => choice.key),
      servicesSearchTerms: candidate.servicesSearchTerms ?? "",
    },
    link_validation: { ...links.validation, reviewGates },
    notes: JSON.stringify({
      review_only: true,
      country: candidate.country,
      description: notes.description ?? null,
      public_hours: notes.public_hours ?? null,
      specialties: notes.specialties ?? [],
      languages: notes.languages ?? [],
      accessibility: notes.accessibility ?? [],
      audiences_served: notes.audiences_served ?? [],
      source_notes: notes,
    }),
    raw_record: rawRecord,
  };
}

async function insertChunk(client: PoolClient, batchId: string, rows: StagedCandidate[]): Promise<number> {
  const result = await client.query(
    `INSERT INTO directory_import_candidates (
       batch_id, source_row, target_kind, status, dedupe_key, name, city, state,
       category, subcategory, cultural_specialty, address, phone, website,
       source_url, source_name, source_status, ownership_designations,
       ownership_evidence, regulated_profession, instagram_url, facebook_url,
       tiktok_url, social_source_url, suggested_experience_keys,
       link_validation, notes, raw_record
     )
     SELECT $1::uuid, x.source_row, x.target_kind, x.status, x.dedupe_key,
            x.name, x.city, x.state, x.category, x.subcategory,
            x.cultural_specialty, x.address, x.phone, x.website, x.source_url,
            x.source_name, x.source_status, x.ownership_designations,
            x.ownership_evidence, x.regulated_profession, x.instagram_url,
            x.facebook_url, x.tiktok_url, x.social_source_url,
            x.suggested_experience_keys, x.link_validation, x.notes, x.raw_record
       FROM jsonb_to_recordset($2::jsonb) AS x(
         source_row integer, target_kind text, status text, dedupe_key text,
         name text, city text, state text, category text, subcategory text,
         cultural_specialty text, address text, phone text, website text,
         source_url text, source_name text, source_status text,
         ownership_designations jsonb, ownership_evidence text,
         regulated_profession boolean, instagram_url text, facebook_url text,
         tiktok_url text, social_source_url text, suggested_experience_keys jsonb,
         link_validation jsonb, notes text, raw_record jsonb
       )
     ON CONFLICT (batch_id, source_row) DO NOTHING`,
    [batchId, JSON.stringify(rows)],
  );
  return result.rowCount ?? 0;
}

async function markExistingBusinessMatches(client: PoolClient, batchId: string): Promise<number> {
  const result = await client.query(
    `UPDATE directory_import_candidates c
        SET matched_business_id = b.id,
            status = 'needs_research',
            link_validation = jsonb_set(
              COALESCE(c.link_validation, '{}'::jsonb),
              '{reviewGates}',
              COALESCE(c.link_validation->'reviewGates', '[]'::jsonb)
                || '["existing_record_reconciliation"]'::jsonb,
              true
            ),
            updated_at = NOW()
       FROM businesses b
      WHERE c.batch_id = $1
        AND c.target_kind IN ('business', 'regulated_review')
        AND c.matched_business_id IS NULL
        AND COALESCE(b.is_duplicate, false) = false
        AND COALESCE(b.status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
        AND (
          b.dedupe_key = c.dedupe_key
          OR (
            LOWER(REGEXP_REPLACE(COALESCE(b.name, ''), '[^a-z0-9]+', '', 'g'))
              = LOWER(REGEXP_REPLACE(c.name, '[^a-z0-9]+', '', 'g'))
            AND LOWER(REGEXP_REPLACE(COALESCE(b.address, ''), '[^a-z0-9]+', '', 'g'))
              = LOWER(REGEXP_REPLACE(c.address, '[^a-z0-9]+', '', 'g'))
            AND LOWER(REGEXP_REPLACE(COALESCE(b.city, ''), '[^a-z0-9]+', '', 'g'))
              = LOWER(REGEXP_REPLACE(c.city, '[^a-z0-9]+', '', 'g'))
            AND LOWER(REGEXP_REPLACE(COALESCE(b.state, ''), '[^a-z0-9]+', '', 'g'))
              = LOWER(REGEXP_REPLACE(COALESCE(c.state, ''), '[^a-z0-9]+', '', 'g'))
          )
        )`,
    [batchId],
  );
  return result.rowCount ?? 0;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const manifestPath = resolve(option("--manifest") ?? DEFAULT_MANIFEST);
  const summaryPath = resolve(option("--review-summary") ?? DEFAULT_SUMMARY);
  const linkHealthPath = resolve(option("--link-health") ?? DEFAULT_LINK_HEALTH);
  const createdBy = option("--created-by")?.trim();
  if (!createdBy) throw new Error("--created-by is required to attribute review-only staging.");
  for (const path of [manifestPath, summaryPath, linkHealthPath]) {
    if (!existsSync(path)) throw new Error(`Required review artifact not found: ${path}`);
  }

  const candidates = await readManifest(manifestPath);
  const summary = loadSummary(summaryPath, manifestPath, candidates.length);
  const linkHealth = loadLinkHealth(linkHealthPath, candidates.length);
  const dedupeCounts = candidates.reduce<Map<string, number>>((counts, candidate) => {
    const key = canonicalDedupeKey(candidate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map());
  const staged = candidates.map((candidate, index) => stagedCandidate(
    candidate,
    index + 1,
    linkHealth,
    (dedupeCounts.get(canonicalDedupeKey(candidate)) ?? 0) > 1,
  ));
  const statusCounts = staged.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.status] = (counts[candidate.status] ?? 0) + 1;
    return counts;
  }, {});
  const kindCounts = staged.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.target_kind] = (counts[candidate.target_kind] ?? 0) + 1;
    return counts;
  }, {});

  console.log(JSON.stringify({
    mode: apply ? "stage_review_candidates" : "dry_run",
    manifest: basename(manifestPath),
    manifestHash: summary.manifest_sha256,
    rows: candidates.length,
    targetCounts: kindCounts,
    reviewStatusCounts: statusCounts,
    linkHealthDestinations: linkHealth.size,
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
       VALUES ($1, $2, $3, 'staged', $4)
       ON CONFLICT (source_sha256) DO UPDATE SET updated_at = NOW()
       RETURNING id, status`,
      [basename(manifestPath), summary.manifest_sha256, staged.length, createdBy],
    );
    const batchId = batch.rows[0]?.id;
    if (!batchId) throw new Error("Could not create the review batch.");
    if (batch.rows[0]?.status === "cancelled") throw new Error("The matching review batch is cancelled and cannot be restaged.");

    let inserted = 0;
    const chunkSize = 250;
    for (let index = 0; index < staged.length; index += chunkSize) {
      inserted += await insertChunk(client, batchId, staged.slice(index, index + chunkSize));
    }
    const existingMatches = await markExistingBusinessMatches(client, batchId);
    const count = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM directory_import_candidates WHERE batch_id = $1",
      [batchId],
    );
    if (Number(count.rows[0]?.count ?? 0) !== staged.length) {
      throw new Error(`Atomic staging count mismatch: expected ${staged.length}, received ${count.rows[0]?.count ?? "unknown"}.`);
    }
    await client.query(
      `UPDATE directory_import_batches
          SET status = CASE WHEN status = 'completed' THEN status ELSE 'in_review' END,
              updated_at = NOW()
        WHERE id = $1`,
      [batchId],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ batchId, inserted, existingMatches, stagedRows: staged.length, publicationWrites: 0 }, null, 2));
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
