#!/usr/bin/env node
/**
 * Creates a derived, unsigned MWM Core publication manifest from the immutable
 * offline receipt file. It is deliberately offline-only: it does not sign,
 * stage, geocode, call an API, connect to a database, or publish a record.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";

const POLICY_VERSION = "mwm-core-black-latino-source-evidence-v2";
const SOURCE_BACKED_COHORT = "mwm_source_backed_candidate";

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

  if (!isSha256(expectedRootHash)) throw new Error("--expected-receipt-root-hash must be a SHA-256 hash.");
  if (!Number.isInteger(expectedCandidateCount) || expectedCandidateCount < 1) {
    throw new Error("--expected-candidate-count must be a positive integer.");
  }

  const receipts = parseJsonl(await readFile(receiptsPath, "utf8"), receiptsPath);
  const actualRootHash = sha256(receipts.map((receipt) => String(receipt.receiptHash ?? "")).join("\n"));
  if (actualRootHash !== expectedRootHash) {
    throw new Error(`Receipt root mismatch: expected ${expectedRootHash}, received ${actualRootHash}.`);
  }

  const candidates = receipts.filter((receipt) =>
    receipt.receiptVersion === POLICY_VERSION
    && receipt.cohort === SOURCE_BACKED_COHORT
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
  for (const receipt of candidates) {
    if (!isSha256(receipt.receiptHash) || !isSha256(receipt.sourceManifestSha256) ||
        !isSha256(receipt.recordFingerprint) || !Number.isInteger(receipt.sourceRow) ||
        receipt.sourceRow < 1 || !String(receipt.sourceRowId ?? "").trim()) {
      throw new Error(`Incomplete source receipt metadata for ${receipt.sourceManifest}:${receipt.sourceRow}.`);
    }
    const targetKind = receipt.evidence?.targetKind;
    if (targetKind !== "business" && targetKind !== "online_business") {
      throw new Error(`Unexpected target kind in publication candidate: ${String(targetKind)}.`);
    }
    const rows = await sourceRows(receipt.sourceManifest, receipt.sourceManifestSha256);
    const sourceRecord = rows.get(receipt.recordFingerprint);
    if (!sourceRecord) {
      throw new Error(`Source record fingerprint not found for ${receipt.sourceManifest}:${receipt.sourceRow}.`);
    }
    const derived = {
      ...sourceRecord,
      mwm_core_policy_version: POLICY_VERSION,
      mwm_core_cohort: SOURCE_BACKED_COHORT,
      mwm_core_receipt_root_hash: expectedRootHash,
      mwm_core_receipt_hash: receipt.receiptHash,
      mwm_core_source_manifest: receipt.sourceManifest,
      mwm_core_source_manifest_sha256: receipt.sourceManifestSha256,
      mwm_core_source_row: receipt.sourceRow,
      mwm_core_source_row_id: String(receipt.sourceRowId),
    };
    output.push(canonicalJson(derived));
    if (targetKind === "business") physicalCount += 1;
    else onlineOnlyCount += 1;
  }

  const body = `${output.join("\n")}\n`;
  const manifestSha256 = sha256(body);
  const summary = {
    policyVersion: POLICY_VERSION,
    cohort: SOURCE_BACKED_COHORT,
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
    nextStep: "Review this manifest, then sign and submit it only through the isolated directory-review ingress.",
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
