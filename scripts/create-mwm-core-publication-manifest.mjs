#!/usr/bin/env node
/**
 * Creates a derived, unsigned MWM Core publication manifest from the immutable
 * offline receipt file. It is deliberately offline-only: it does not sign,
 * stage, geocode, call an API, connect to a database, or publish a record.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";

const POLICY_VERSION = "source-receipted-directory-publication-v1";
const CHAMBER_COHORT = "mwm_chamber_backed_candidate";
const INSTITUTIONAL_COHORT = "mwm_institutional_directory_candidate";
const SOURCE_REPUTABLE_LISTING_COHORT = "source_reputable_listing_candidate";
const AUTOMATIC_PUBLICATION_COHORTS = new Set([
  CHAMBER_COHORT,
  INSTITUTIONAL_COHORT,
  SOURCE_REPUTABLE_LISTING_COHORT,
]);

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function requiredArg(name) {
  const value = argValue(name);
  if (!value) throw new Error(`Missing required ${name}.`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  // JSON.stringify(undefined) returns JavaScript undefined rather than JSON
  // text. Manifest rows must always remain parseable JSONL even when a source
  // package omits an optional field such as a social URL.
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return "null";
  if (typeof value === "number" && !Number.isFinite(value)) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseJsonl(value, label) {
  return value.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSONL in ${label} at line ${index + 1}.`);
    }
  });
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isWithin(root, target) {
  return target === root || target.startsWith(`${root}/`);
}

async function main() {
  const receiptsPath = resolve(requiredArg("--receipts"));
  const sourceRoot = resolve(argValue("--source-root", "data/founder-imports"));
  const out = resolve(requiredArg("--out"));
  const summaryOut = resolve(argValue("--summary", `${out}.summary.json`));
  const expectedRootHash = requiredArg("--expected-receipt-root-hash").toLowerCase();
  const expectedCandidateCount = Number(requiredArg("--expected-candidate-count"));
  const expectedChamberCount = Number(requiredArg("--expected-chamber-count"));
  const expectedInstitutionalCount = Number(requiredArg("--expected-institutional-directory-count"));
  const expectedSourceListingCount = Number(requiredArg("--expected-source-listing-count"));

  if (!isSha256(expectedRootHash)) throw new Error("--expected-receipt-root-hash must be a SHA-256 hash.");
  for (const [name, value] of [
    ["--expected-candidate-count", expectedCandidateCount],
    ["--expected-chamber-count", expectedChamberCount],
    ["--expected-institutional-directory-count", expectedInstitutionalCount],
    ["--expected-source-listing-count", expectedSourceListingCount],
  ]) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
  }
  if (expectedCandidateCount < 1 || expectedCandidateCount !== expectedChamberCount + expectedInstitutionalCount + expectedSourceListingCount) {
    throw new Error("Expected total must equal the Chamber, institutional-directory, and reputable-source lane counts.");
  }

  const receipts = parseJsonl(await readFile(receiptsPath, "utf8"), receiptsPath);
  const actualRootHash = sha256(receipts.map((receipt) => String(receipt.receiptHash ?? "")).join("\n"));
  if (actualRootHash !== expectedRootHash) {
    throw new Error(`Receipt root mismatch: expected ${expectedRootHash}, received ${actualRootHash}.`);
  }

  const candidates = receipts.filter((receipt) =>
    receipt.receiptVersion === POLICY_VERSION
    && AUTOMATIC_PUBLICATION_COHORTS.has(receipt.cohort)
    && receipt.eligibleForReleasePreview === true,
  );
  if (candidates.length !== expectedCandidateCount) {
    throw new Error(`Candidate count mismatch: expected ${expectedCandidateCount}, received ${candidates.length}.`);
  }

  const manifestCache = new Map();
  async function sourceRows(sourceManifest, expectedHash) {
    const sourcePath = resolve(process.cwd(), String(sourceManifest));
    if (!isWithin(sourceRoot, sourcePath)) {
      throw new Error(`Receipt source manifest is outside --source-root: ${sourceManifest}`);
    }
    if (!manifestCache.has(sourcePath)) {
      const raw = await readFile(sourcePath, "utf8");
      const actualHash = sha256(raw);
      if (actualHash !== expectedHash) {
        throw new Error(`Source manifest hash mismatch for ${sourceManifest}.`);
      }
      const byFingerprint = new Map();
      for (const row of parseJsonl(raw, sourceManifest)) {
        const fingerprint = sha256(canonicalJson(row));
        if (byFingerprint.has(fingerprint)) {
          throw new Error(`Ambiguous duplicate source row fingerprint in ${sourceManifest}.`);
        }
        byFingerprint.set(fingerprint, row);
      }
      manifestCache.set(sourcePath, byFingerprint);
    }
    return manifestCache.get(sourcePath);
  }

  const output = [];
  let physicalCount = 0;
  let onlineOnlyCount = 0;
  const evidenceLaneCounts = { chamber: 0, institutional_directory: 0, reputable_source: 0 };
  for (const receipt of candidates) {
    if (!isSha256(receipt.receiptHash) || !isSha256(receipt.sourceManifestSha256) ||
        !isSha256(receipt.recordFingerprint) || !Number.isInteger(receipt.sourceRow) ||
        receipt.sourceRow < 1 || !String(receipt.sourceRowId ?? "").trim()) {
      throw new Error(`Incomplete source receipt metadata for ${receipt.sourceManifest}:${receipt.sourceRow}.`);
    }
    const targetKind = receipt.evidence?.targetKind;
    const evidenceLane = receipt.evidenceLane;
    if (targetKind !== "business" && targetKind !== "online_business") {
      throw new Error(`Unexpected target kind in publication candidate: ${String(targetKind)}.`);
    }
    const expectedCohort = evidenceLane === "chamber"
      ? CHAMBER_COHORT
      : evidenceLane === "institutional_directory"
        ? INSTITUTIONAL_COHORT
        : evidenceLane === "reputable_source" || evidenceLane === "editorial_or_promotional"
          ? SOURCE_REPUTABLE_LISTING_COHORT
        : null;
    if (!expectedCohort || receipt.cohort !== expectedCohort) {
      throw new Error(`Invalid evidence-lane/cohort pairing for ${receipt.sourceManifest}:${receipt.sourceRow}.`);
    }
    const rows = await sourceRows(receipt.sourceManifest, receipt.sourceManifestSha256);
    const sourceRecord = rows.get(receipt.recordFingerprint);
    if (!sourceRecord) {
      throw new Error(`Source record fingerprint not found for ${receipt.sourceManifest}:${receipt.sourceRow}.`);
    }
    // Normalize the signed source row to the protected ingress wire contract.
    // The original camelCase source fields remain embedded in source_record for
    // audit, but the publisher consumes only these canonical snake_case values.
    const derived = {
      ...sourceRecord,
      target_kind: sourceRecord.target_kind ?? sourceRecord.targetKind,
      // The source package may omit optional wire aliases. Use the immutable
      // receipt values for identity rather than emitting JavaScript `undefined`
      // into canonical JSONL, which would make the protected manifest invalid.
      source_row: sourceRecord.source_row ?? sourceRecord.sourceRow ?? receipt.sourceRow,
      source_row_id: sourceRecord.source_row_id ?? sourceRecord.sourceRowId ?? String(receipt.sourceRowId),
      source_name: sourceRecord.source_name ?? sourceRecord.sourceName ?? receipt.evidence?.sourceName ?? null,
      source_url: sourceRecord.source_url ?? sourceRecord.sourceUrl ?? receipt.evidence?.sourceUrl ?? null,
      source_status: sourceRecord.source_status ?? sourceRecord.sourceStatus ?? null,
      social_source_url: sourceRecord.social_source_url ?? sourceRecord.socialSourceUrl,
      ownership_designations: sourceRecord.ownership_designations ?? sourceRecord.ownershipDesignations ?? [],
      ownership_evidence: sourceRecord.ownership_evidence ?? sourceRecord.ownershipEvidence ?? null,
      regulated_profession: sourceRecord.regulated_profession ?? sourceRecord.regulatedProfession ?? false,
      destination_reachable: sourceRecord.destination_reachable ?? sourceRecord.destinationReachable ?? true,
      mwm_core_policy_version: POLICY_VERSION,
      mwm_core_cohort: receipt.cohort,
      mwm_core_evidence_lane: evidenceLane,
      mwm_publication_classification: receipt.publicationClassification,
      mwm_core_receipt_root_hash: expectedRootHash,
      mwm_core_receipt_hash: receipt.receiptHash,
      mwm_core_source_manifest: receipt.sourceManifest,
      mwm_core_source_manifest_sha256: receipt.sourceManifestSha256,
      mwm_core_source_row: receipt.sourceRow,
      mwm_core_source_row_id: String(receipt.sourceRowId),
    };
    output.push(canonicalJson(derived));
    evidenceLaneCounts[evidenceLane] += 1;
    if (targetKind === "business") physicalCount += 1;
    else onlineOnlyCount += 1;
  }

  const body = `${output.join("\n")}\n`;
  if (evidenceLaneCounts.chamber !== expectedChamberCount ||
      evidenceLaneCounts.institutional_directory !== expectedInstitutionalCount ||
      evidenceLaneCounts.reputable_source !== expectedSourceListingCount) {
    throw new Error(`Evidence lane count mismatch: expected Chamber ${expectedChamberCount} / institutional ${expectedInstitutionalCount} / reputable source ${expectedSourceListingCount}, received Chamber ${evidenceLaneCounts.chamber} / institutional ${evidenceLaneCounts.institutional_directory} / reputable source ${evidenceLaneCounts.reputable_source}.`);
  }
  const manifestSha256 = sha256(body);
  const summary = {
    policyVersion: POLICY_VERSION,
    cohorts: [CHAMBER_COHORT, INSTITUTIONAL_COHORT, SOURCE_REPUTABLE_LISTING_COHORT],
    evidenceLaneCounts,
    sourceReceiptRootHash: expectedRootHash,
    sourceReceiptFile: relative(process.cwd(), receiptsPath),
    sourceRoot: relative(process.cwd(), sourceRoot),
    outputManifest: relative(process.cwd(), out),
    outputManifestSha256: manifestSha256,
    candidateCount: output.length,
    physicalCandidateCount: physicalCount,
    onlineOnlyCandidateCount: onlineOnlyCount,
    sideEffects: "none",
    signed: false,
    stagingPerformed: false,
    publicationPerformed: false,
    nextStep: "Sign and submit this immutable source-receipted manifest only through the isolated directory-review ingress. Source-reported designations remain unverified until owner or approved-verifier confirmation.",
  };

  await mkdir(dirname(out), { recursive: true });
  await mkdir(dirname(summaryOut), { recursive: true });
  await writeFile(out, body);
  await writeFile(summaryOut, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
