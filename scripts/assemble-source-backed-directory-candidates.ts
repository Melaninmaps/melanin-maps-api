#!/usr/bin/env tsx
/**
 * Rebuild the protected source-backed directory manifest from independently
 * extracted, founder-authorized public directory artifacts. The manifest is
 * source code so the admin-only intake route always has a reviewable, stable
 * source receipt for every candidate it can publish.
 *
 * Usage:
 *   pnpm exec tsx scripts/assemble-source-backed-directory-candidates.ts
 *
 * This command never connects to the production database and never publishes
 * records. Publication remains the explicit, authenticated admin action.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  sourceBackedDirectoryCandidates,
  type SourceBackedDirectoryCandidate,
} from "../artifacts/api-server/src/directoryIntake/sourceBackedDirectoryCandidates";

type ExtractedCandidate = Readonly<{
  name?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  address?: unknown;
  phone?: unknown;
  officialUrl?: unknown;
  sourceUrl?: unknown;
  sourceListingUrl?: unknown;
  sourceLabel?: unknown;
  ownershipDesignations?: unknown;
  ownershipEvidence?: unknown;
  category?: unknown;
  subcategory?: unknown;
  serviceTerms?: unknown;
  sourceDescription?: unknown;
  socialLinks?: unknown;
  sourceRecordKey?: unknown;
  batch?: unknown;
}>;

const extractionDirectory = "/home/ubuntu/mwm-audits/directory-source-extraction";
const manifestPath = path.resolve(
  "artifacts/api-server/src/directoryIntake/sourceBackedDirectoryCandidates.ts",
);
const reportPath = "/home/ubuntu/mwm-audits/directory-source-extraction/ASSEMBLY_REPORT.json";
const publicEmailPattern = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i;
const requiredFields = [
  "name",
  "city",
  "state",
  "country",
  "address",
  "phone",
  "officialUrl",
  "sourceUrl",
  "sourceListingUrl",
  "sourceLabel",
  "ownershipDesignations",
  "ownershipEvidence",
  "category",
  "subcategory",
  "serviceTerms",
  "sourceRecordKey",
] as const;

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.replace(new RegExp(publicEmailPattern.source, "gi"), "[email removed]") : null;
}

function normalizedHttpUrl(value: unknown): string | null {
  if (typeof value === "string" && publicEmailPattern.test(value)) return null;
  const trimmed = stringOrNull(value);
  if (!trimmed) return null;
  const normalized = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((entry) => stringOrNull(entry))
    .filter((entry): entry is string => Boolean(entry)))];
}

function verifiedSocialLinks(value: unknown): SourceBackedDirectoryCandidate["socialLinks"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const supported = new Set(["facebook", "instagram", "tiktok", "twitter", "youtube", "pinterest"]);
  const entries = Object.entries(value)
    .filter(([platform, url]) => supported.has(platform) && Boolean(normalizedHttpUrl(url)))
    .map(([platform, url]) => [platform, normalizedHttpUrl(url)!] as const);
  return entries.length ? Object.fromEntries(entries) : null;
}

function normalizeDesignation(value: string): string | null {
  const compact = value.toLowerCase().replace(/[^a-z]/g, "");
  if (compact.includes("black") || compact.includes("africanamerican")) {
    return "Black / African American-Owned";
  }
  if (compact.includes("hispanic") || compact.includes("latino") || compact.includes("latinx")) {
    return "Latino / Hispanic-Owned";
  }
  return null;
}

function sourceReceiptKey(sourceUrl: string, sourceRecordKey: string, sourceListingUrl: string | null): string {
  if (sourceRecordKey.startsWith("source-receipt:")) return sourceRecordKey;
  const fingerprint = `${sourceUrl}\n${sourceListingUrl ?? ""}\n${sourceRecordKey}`;
  return `source-receipt:${createHash("sha256").update(fingerprint).digest("hex")}`;
}

/**
 * A receipt key is immutable. When its crawl evidence is re-read, keep the
 * original business identity and source values and fill only facts that were
 * missing: a business-specific detail description and direct official socials.
 */
function mergeMissingCrawlEvidence(
  existing: SourceBackedDirectoryCandidate,
  incoming: SourceBackedDirectoryCandidate,
): SourceBackedDirectoryCandidate {
  const existingSocial = existing.socialLinks ?? {};
  const incomingSocial = incoming.socialLinks ?? {};
  const socialLinks = Object.keys(existingSocial).length || Object.keys(incomingSocial).length
    ? { ...incomingSocial, ...existingSocial }
    : null;
  return {
    ...existing,
    sourceDescription: existing.sourceDescription ?? incoming.sourceDescription ?? null,
    socialLinks,
  };
}

function safeCandidate(input: ExtractedCandidate, sourceFile: string): {
  candidate: SourceBackedDirectoryCandidate | null;
  reason?: string;
} {
  for (const field of requiredFields) {
    if (!(field in input)) return { candidate: null, reason: `missing_${field}` };
  }

  const name = stringOrNull(input.name);
  const city = stringOrNull(input.city);
  const sourceUrl = normalizedHttpUrl(input.sourceUrl);
  const sourceLabel = stringOrNull(input.sourceLabel);
  const originalKey = stringOrNull(input.sourceRecordKey);
  if (!name || !city || !sourceUrl || !sourceLabel || !originalKey) {
    return { candidate: null, reason: "missing_required_identity" };
  }
  if (name.length > 255) return { candidate: null, reason: "name_exceeds_database_limit" };
  if (city.length > 120) return { candidate: null, reason: "city_exceeds_database_limit" };

  const designations = asStringArray(input.ownershipDesignations)
    .map(normalizeDesignation)
    .filter((designation): designation is string => Boolean(designation));
  const category = stringOrNull(input.category) ?? "Community business";
  const subcategory = stringOrNull(input.subcategory) ?? category;
  const sourceListingUrl = normalizedHttpUrl(input.sourceListingUrl);
  const officialUrl = normalizedHttpUrl(input.officialUrl);
  const country = stringOrNull(input.country) ?? "US";
  const state = stringOrNull(input.state)?.toUpperCase() ?? null;

  return {
    candidate: {
      name,
      category,
      subcategory,
      address: stringOrNull(input.address),
      city,
      state,
      country,
      phone: stringOrNull(input.phone),
      officialUrl,
      sourceDescription: stringOrNull(input.sourceDescription),
      socialLinks: verifiedSocialLinks(input.socialLinks),
      ownershipDesignations: [...new Set(designations)],
      serviceTerms: asStringArray(input.serviceTerms),
      sourceLabel,
      sourceUrl,
      sourceListingUrl,
      sourceRecordKey: sourceReceiptKey(sourceUrl, originalKey, sourceListingUrl),
      ownershipEvidence: stringOrNull(input.ownershipEvidence)
        ?? `Public source listing retained from ${sourceLabel}.`,
      batch: stringOrNull(input.batch) ?? "founder_city_directories_2026_09_27",
    },
  };
}

async function extractedArtifacts(): Promise<Array<{ file: string; row: ExtractedCandidate }>> {
  const names = (await fs.readdir(extractionDirectory))
    .filter((name) => /^\d{2}-.*\.json$/i.test(name))
    .filter((name) => !name.endsWith("-sample.json"));
  const result: Array<{ file: string; row: ExtractedCandidate }> = [];
  for (const name of names.sort()) {
    const parsed = JSON.parse(await fs.readFile(path.join(extractionDirectory, name), "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${name} must be a strict JSON array`);
    for (const row of parsed) result.push({ file: name, row });
  }
  return result;
}

async function main(): Promise<void> {
  const rejected: Array<{ file: string; reason: string }> = [];
  const byReceipt = new Map<string, SourceBackedDirectoryCandidate>();
  const allInputs: Array<{ file: string; row: ExtractedCandidate }> = [
    ...sourceBackedDirectoryCandidates.map((row) => ({ file: "existing-protected-manifest", row })),
    ...await extractedArtifacts(),
  ];

  for (const { file, row } of allInputs) {
    const normalized = safeCandidate(row, file);
    if (!normalized.candidate) {
      rejected.push({ file, reason: normalized.reason ?? "invalid_row" });
      continue;
    }
    // The receipt is the preservation boundary. Cross-source records stay in
    // this protected manifest so no supplied provenance is discarded; the
    // intake planner decides whether exact same-place records can publish.
    const existing = byReceipt.get(normalized.candidate.sourceRecordKey);
    if (!existing) byReceipt.set(normalized.candidate.sourceRecordKey, normalized.candidate);
    else byReceipt.set(
      normalized.candidate.sourceRecordKey,
      mergeMissingCrawlEvidence(existing, normalized.candidate),
    );
  }

  const candidates = [...byReceipt.values()].sort((left, right) =>
    left.city.localeCompare(right.city)
      || (left.state ?? "").localeCompare(right.state ?? "")
      || left.name.localeCompare(right.name)
      || left.sourceRecordKey.localeCompare(right.sourceRecordKey),
  );

  const encodedCandidates = JSON.stringify(JSON.stringify(candidates));
  const output = `/**\n * Internal source-backed directory intake candidates.\n * Generated from founder-provided public-directory reviews and source-receipted\n * city extraction artifacts. This module is consumed only by an admin-protected\n * reconciliation route.\n */\nexport type SourceBackedDirectoryCandidate = {\n  name: string; category: string; subcategory: string; address: string | null; city: string; state: string | null; country: string; phone: string | null; officialUrl: string | null; socialLinks?: Partial<Record<"facebook" | "instagram" | "tiktok" | "twitter" | "youtube" | "pinterest", string>> | null; sourceDescription?: string | null; ownershipDesignations: string[]; serviceTerms: string[]; sourceLabel: string; sourceUrl: string; sourceListingUrl: string | null; sourceRecordKey: string; ownershipEvidence: string; batch: string;\n};\n\nexport const sourceBackedDirectoryCandidates: readonly SourceBackedDirectoryCandidate[] = JSON.parse(${encodedCandidates}) as SourceBackedDirectoryCandidate[];\n`;
  await fs.writeFile(manifestPath, output);
  await fs.writeFile(reportPath, JSON.stringify({
    existingManifestRows: sourceBackedDirectoryCandidates.length,
    extractedRowsRead: allInputs.length - sourceBackedDirectoryCandidates.length,
    receiptUniqueRows: byReceipt.size,
    finalManifestRows: candidates.length,
    sourceReceiptDuplicatesRemoved: allInputs.length - byReceipt.size,
    crossSourceSamePlaceRecordsRetained: true,
    rejectedRows: rejected,
  }, null, 2) + "\n");
  console.log(JSON.stringify({ finalManifestRows: candidates.length, rejectedRows: rejected.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
