#!/usr/bin/env tsx
/**
 * Read-only VIBESNOW taxonomy dry run.
 *
 * This utility intentionally never executes INSERT, UPDATE, DELETE, ALTER, or
 * migration statements. It classifies records only when the existing stored
 * category/subcategory supplies an unambiguous, founder-approved equivalent.
 * Everything else is returned for human review rather than guessed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import {
  FOUNDER_TAXONOMY_BY_CATEGORY,
  isCanonicalBusinessCategory,
  isCanonicalSubcategoryForCategory,
  normalizeOwnerExperienceKey,
  getBusinessExperiencePolicy,
} from "@workspace/constants";

type DirectoryRecord = Readonly<{
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  website: string | null;
  socialProfiles: unknown;
  tags: unknown;
  vibes: unknown;
  verified: boolean;
  listingStatus: string | null;
}>;

type ClassificationStatus = "already_correct" | "confidently_remapped" | "requires_review";

export type ReclassificationProposal = Readonly<{
  id: string;
  name: string;
  currentCategory: string;
  currentSubcategory: string | null;
  proposedCategory: string | null;
  proposedSubcategory: string | null;
  status: ClassificationStatus;
  rationale: string;
  evidenceAvailable: Readonly<{
    verified: boolean;
    description: boolean;
    website: boolean;
    officialSocial: boolean;
    tags: boolean;
  }>;
  invalidStoredVibes: string[];
}>;

const LEGACY_SUBCATEGORY_ALIASES: Readonly<Record<string, readonly [string, string]>> = {
  restaurant: ["Food & Drink", "Restaurants"],
  restaurants: ["Food & Drink", "Restaurants"],
  cafe: ["Food & Drink", "Cafés & Coffee Shops"],
  coffee_shop: ["Food & Drink", "Cafés & Coffee Shops"],
  caterer: ["Food & Drink", "Catering"],
  catering: ["Food & Drink", "Catering"],
  barbershop: ["Beauty & Personal Care", "Barbershops"],
  barber: ["Beauty & Personal Care", "Barbershops"],
  braider: ["Beauty & Personal Care", "Braiding"],
  loctician: ["Beauty & Personal Care", "Locs & Natural Hair"],
  wig_installer: ["Beauty & Personal Care", "Wigs & Extensions"],
  mechanic: ["Automotive", "Auto Repair & Mechanics"],
  car_dealer: ["Automotive", "Car Dealerships"],
  car_dealership: ["Automotive", "Car Dealerships"],
  daycare: ["Children & Family", "Childcare"],
  childcare: ["Children & Family", "Childcare"],
  bookstore: ["Shopping & Retail", "Books & Bookstores"],
  books: ["Shopping & Retail", "Books & Bookstores"],
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function hasOfficialSocial(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).some(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}

function exactCategory(value: string): string | null {
  const key = normalize(value);
  return Object.keys(FOUNDER_TAXONOMY_BY_CATEGORY).find((category) => normalize(category) === key) ?? null;
}

function exactSubcategory(value: string): readonly [string, string] | null {
  const key = normalize(value);
  const matches = Object.entries(FOUNDER_TAXONOMY_BY_CATEGORY).flatMap(([category, definition]) =>
    definition.subcategories
      .filter((subcategory) => normalize(subcategory) === key)
      .map((subcategory): [string, string] => [category, subcategory]),
  );
  return matches.length === 1 ? matches[0] : null;
}

function invalidStoredVibesForCategory(
  record: DirectoryRecord,
  category: string | null,
  subcategory: string | null,
): string[] {
  if (!category || !isCanonicalBusinessCategory(category)) return [];
  const policy = getBusinessExperiencePolicy(category, subcategory);
  const allowed = new Set(policy.vibeChoices.map((choice) => choice.key));
  return strings(record.vibes).filter((vibe) => !allowed.has(normalizeOwnerExperienceKey(vibe)));
}

export function classifyForFounderTaxonomy(record: DirectoryRecord): ReclassificationProposal {
  const currentCategory = record.category.trim();
  const currentSubcategory = record.subcategory?.trim() || null;
  const category = exactCategory(currentCategory);
  const directSubcategory = currentSubcategory ? exactSubcategory(currentSubcategory) : null;
  const alias = LEGACY_SUBCATEGORY_ALIASES[normalize(currentSubcategory)];
  const evidenceAvailable = {
    verified: record.verified,
    description: record.description.trim().length > 0,
    website: Boolean(record.website?.trim()),
    officialSocial: hasOfficialSocial(record.socialProfiles),
    tags: strings(record.tags).length > 0,
  } as const;

  if (category && (!currentSubcategory || isCanonicalSubcategoryForCategory(category, currentSubcategory))) {
    return {
      id: record.id,
      name: record.name,
      currentCategory,
      currentSubcategory,
      proposedCategory: category,
      proposedSubcategory: currentSubcategory,
      status: "already_correct",
      rationale: currentSubcategory
        ? "Existing category/subcategory is an exact founder-approved pair."
        : "Existing category is founder-approved; no subcategory was stored.",
      evidenceAvailable,
      invalidStoredVibes: invalidStoredVibesForCategory(record, category, currentSubcategory),
    };
  }

  const candidate = directSubcategory ?? alias;
  if (candidate) {
    const [proposedCategory, proposedSubcategory] = candidate;
    return {
      id: record.id,
      name: record.name,
      currentCategory,
      currentSubcategory,
      proposedCategory,
      proposedSubcategory,
      status: "confidently_remapped",
      rationale: directSubcategory
        ? "Stored subcategory has one exact founder-approved destination."
        : "Stored subcategory matches an explicit conservative legacy alias.",
      evidenceAvailable,
      invalidStoredVibes: invalidStoredVibesForCategory(record, proposedCategory, proposedSubcategory),
    };
  }

  return {
    id: record.id,
    name: record.name,
    currentCategory,
    currentSubcategory,
    proposedCategory: null,
    proposedSubcategory: null,
    status: "requires_review",
    rationale: isCanonicalBusinessCategory(currentCategory)
      ? "Founder category is valid but the stored subcategory has no safe equivalent."
      : "Stored classification has no unambiguous founder-approved equivalent; review verified evidence before any change.",
    evidenceAvailable,
    invalidStoredVibes: invalidStoredVibesForCategory(record, category, currentSubcategory),
  };
}

export function analyzeFounderTaxonomyDryRun(records: readonly DirectoryRecord[]) {
  const proposals = records.map(classifyForFounderTaxonomy);
  const currentValuesWithoutSafeEquivalent = [...new Set(
    proposals
      .filter((proposal) => proposal.status === "requires_review")
      .map((proposal) => `${proposal.currentCategory} › ${proposal.currentSubcategory ?? "(none)"}`),
  )].sort();
  const vibeCorrections = proposals
    .filter((proposal) => proposal.invalidStoredVibes.length > 0)
    .map((proposal) => ({ id: proposal.id, name: proposal.name, invalidStoredVibes: proposal.invalidStoredVibes }));

  return {
    generatedAt: new Date().toISOString(),
    taxonomyVersion: "vibesnow-2026-10-15",
    mode: "read_only_dry_run",
    totals: {
      businesses: proposals.length,
      requiringReclassification: proposals.filter((proposal) => proposal.status !== "already_correct").length,
      confidentlyRemapped: proposals.filter((proposal) => proposal.status === "confidently_remapped").length,
      requiringReview: proposals.filter((proposal) => proposal.status === "requires_review").length,
      alreadyCorrect: proposals.filter((proposal) => proposal.status === "already_correct").length,
      businessesWithVibesRequiringCorrectionOrRemoval: vibeCorrections.length,
    },
    currentValuesWithoutSafeEquivalent,
    vibeCorrections,
    proposals,
  };
}

function markdown(report: ReturnType<typeof analyzeFounderTaxonomyDryRun>): string {
  const rows = [
    ["Total businesses", report.totals.businesses],
    ["Requiring reclassification", report.totals.requiringReclassification],
    ["Confidently remapped", report.totals.confidentlyRemapped],
    ["Requiring human review", report.totals.requiringReview],
    ["Already correct", report.totals.alreadyCorrect],
    ["Businesses with VIBES needing correction/removal", report.totals.businessesWithVibesRequiringCorrectionOrRemoval],
  ];
  return [
    "# VIBESNOW Taxonomy Reclassification Dry Run",
    "",
    `- **Generated:** ${report.generatedAt}`,
    `- **Taxonomy version:** ${report.taxonomyVersion}`,
    "- **Mode:** read-only analysis; no production data was written.",
    "",
    "## Summary",
    "",
    "| Measure | Count |",
    "|---|---:|",
    ...rows.map(([label, count]) => `| ${label} | ${count} |`),
    "",
    "## Deterministic rules",
    "",
    "- Records already using a founder-approved category/subcategory pair are retained unchanged.",
    "- A record is remapped only when its stored subcategory uniquely identifies a founder-approved destination or matches an explicit conservative alias.",
    "- Everything else is listed as **requires review**; descriptions, verified site, official social profiles, and tags are supplied as evidence indicators for the reviewer, never as a basis for invented services.",
    "- Stored VIBES are only reported when they are no longer permitted by the business's resulting category. This dry run never removes them.",
    "",
    "## Existing values with no safe equivalent",
    "",
    ...(report.currentValuesWithoutSafeEquivalent.length
      ? report.currentValuesWithoutSafeEquivalent.map((value) => `- ${value}`)
      : ["- None"]),
    "",
    "## Exact database changes required after founder approval",
    "",
    "No database changes have been executed. After review and explicit authorization, apply only the `confidently_remapped` and approved `requires_review` proposal rows in the adjacent JSON artifact, updating `businesses.category` and `businesses.subcategory` in one audited transaction. Preserve the original values in a rollback ledger; do not change `id`, verification, ownership, publication status, reviews, map coordinates, or user-authored text. Remove or replace a stored VIBE only when an approved proposal specifies it and the category policy permits the final value.",
    "",
    "## Rollback plan",
    "",
    "1. Write pre-change `category`, `subcategory`, and `vibes` values to an immutable, run-scoped rollback ledger before any authorized update.",
    "2. Apply proposals by business ID in a transaction, validating the approved category/subcategory pair and allowed VIBE keys on every row.",
    "3. Re-run this dry run and category/VIBE regression suites before release.",
    "4. If acceptance checks fail, restore only the recorded classification/VIBE fields from that ledger; never recreate, delete, or re-key businesses, reviews, ownership evidence, or map pins.",
    "",
  ].join("\n");
}

async function main() {
  const outIndex = process.argv.indexOf("--out");
  const outDirectory = resolve(outIndex >= 0 ? (process.argv[outIndex + 1] ?? "reports/vibesnow-taxonomy-dry-run") : "reports/vibesnow-taxonomy-dry-run");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the read-only dry run; no database connection was attempted.");

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '30s'");
    const result = await client.query<DirectoryRecord>(`
      SELECT
        b.id::text AS id,
        COALESCE(to_jsonb(b)->>'name', '') AS name,
        COALESCE(to_jsonb(b)->>'category', '') AS category,
        NULLIF(BTRIM(COALESCE(to_jsonb(b)->>'subcategory', '')), '') AS subcategory,
        COALESCE(to_jsonb(b)->>'description', '') AS description,
        NULLIF(BTRIM(COALESCE(to_jsonb(b)->>'website', '')), '') AS website,
        COALESCE(to_jsonb(b)->'social_profiles', '{}'::jsonb) AS "socialProfiles",
        COALESCE(to_jsonb(b)->'tags', '[]'::jsonb) AS tags,
        COALESCE(to_jsonb(b)->'vibes', '[]'::jsonb) AS vibes,
        COALESCE((to_jsonb(b)->>'verified')::boolean, false) AS verified,
        NULLIF(BTRIM(COALESCE(to_jsonb(b)->>'listing_status', '')), '') AS "listingStatus"
      FROM public.businesses AS b
      ORDER BY b.id
    `);
    await client.query("ROLLBACK");

    const report = analyzeFounderTaxonomyDryRun(result.rows);
    await mkdir(outDirectory, { recursive: true });
    await writeFile(resolve(outDirectory, "reclassification-proposals.json"), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(resolve(outDirectory, "dry-run-report.md"), markdown(report));
    console.log(JSON.stringify({ outputDirectory: outDirectory, totals: report.totals }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
