#!/usr/bin/env node
/**
 * One explicit source-receipted directory staging operation.
 *
 * This command never enables a worker, deploys an API, changes Railway variables,
 * or deletes/hides a listing. It regenerates the deterministic source receipt and
 * immutable manifest, verifies their exact expected values, then sends that
 * manifest to the protected isolated-review ingress only when --apply is present.
 *
 * Start the single-concurrency worker separately only after this command returns
 * a staged batch receipt. Read aggregate receipts with the paired reader script.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_ENV = ["DIRECTORY_REVIEW_SIGNING_SECRET", "DIRECTORY_SERVICE_TOKEN"];
const EXPECTED = Object.freeze({
  candidateCount: 4183,
  chamber: 16,
  institutionalDirectory: 1120,
  reputableSource: 3047,
});

function value(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : undefined;
}

function required(name) {
  const result = value(name);
  if (!result) throw new Error(`Missing ${name}.`);
  return result;
}

function execute(script, args) {
  const result = spawnSync(process.execPath, [resolve(script), ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status ?? "unknown"}.`);
}

function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} is invalid.`);
  return value;
}

function main() {
  if (!process.argv.includes("--apply")) {
    throw new Error("Refusing to stage without --apply. This command has no implicit mutation mode.");
  }
  const apiUrl = required("--api-url").replace(/\/$/, "");
  const outDir = resolve(value("--out-dir") ?? "/tmp/mwm-source-receipted-publication");
  for (const key of REQUIRED_ENV) {
    if ((process.env[key] ?? "").length < 32) {
      throw new Error(`${key} must be available in the execution environment; never paste it into this command.`);
    }
  }

  mkdirSync(outDir, { recursive: true });
  const receipts = resolve(outDir, "receipts.jsonl");
  const summary = resolve(outDir, "summary.json");
  const manifest = resolve(outDir, "source-receipted-publication-candidates.unsigned.jsonl");
  const manifestSummary = resolve(outDir, "manifest-summary.json");

  execute("scripts/generate-inventory-cohort-receipts.mjs", [
    "--out", receipts,
    "--summary", summary,
  ]);
  const receiptSummary = JSON.parse(readFileSync(summary, "utf8"));
  const rootHash = String(receiptSummary.rootReceiptHash ?? "").toLowerCase();
  const candidateCount = positiveInteger(
    Number(receiptSummary.cohortCounts?.mwm_chamber_backed_candidate ?? 0)
      + Number(receiptSummary.cohortCounts?.mwm_institutional_directory_candidate ?? 0)
      + Number(receiptSummary.cohortCounts?.source_reputable_listing_candidate ?? 0),
    "candidate count",
  );
  const laneCounts = {
    chamber: Number(receiptSummary.evidenceLaneCounts?.chamber ?? 0),
    institutionalDirectory: Number(receiptSummary.evidenceLaneCounts?.institutional_directory ?? 0),
    reputableSource: Number(receiptSummary.evidenceLaneCounts?.reputable_source ?? 0),
  };
  if (!/^[a-f0-9]{64}$/.test(rootHash) || candidateCount !== EXPECTED.candidateCount ||
      laneCounts.chamber !== EXPECTED.chamber ||
      laneCounts.institutionalDirectory !== EXPECTED.institutionalDirectory ||
      laneCounts.reputableSource !== EXPECTED.reputableSource) {
    throw new Error(
      `Source receipt changed. Expected ${EXPECTED.candidateCount} rows `
      + `(${EXPECTED.chamber} Chamber / ${EXPECTED.institutionalDirectory} institutional / ${EXPECTED.reputableSource} reputable); `
      + `received ${candidateCount} (${laneCounts.chamber} / ${laneCounts.institutionalDirectory} / ${laneCounts.reputableSource}). Stop and review the new signed-source cohort.`,
    );
  }

  execute("scripts/create-mwm-core-publication-manifest.mjs", [
    "--receipts", receipts,
    "--out", manifest,
    "--summary", manifestSummary,
    "--expected-receipt-root-hash", rootHash,
    "--expected-candidate-count", String(candidateCount),
    "--expected-chamber-count", String(laneCounts.chamber),
    "--expected-institutional-directory-count", String(laneCounts.institutionalDirectory),
    "--expected-source-listing-count", String(laneCounts.reputableSource),
  ]);
  if (!existsSync(manifest)) throw new Error("Immutable publication manifest was not created.");
  // This is the protected ingress checksum and therefore the exact batch
  // selector required by the single-concurrency publication worker. It is
  // derived locally from the bytes that will be signed and submitted below.
  const manifestChecksum = createHash("sha256").update(readFileSync(manifest, "utf8")).digest("hex");

  execute("scripts/submit-mwm-core-publication-manifest.mjs", [
    "--apply",
    "--manifest", manifest,
    "--api-url", apiUrl,
    "--expected-receipt-root-hash", rootHash,
    "--expected-candidate-count", String(candidateCount),
    "--expected-chamber-count", String(laneCounts.chamber),
    "--expected-institutional-directory-count", String(laneCounts.institutionalDirectory),
    "--expected-source-listing-count", String(laneCounts.reputableSource),
  ]);

  const receipt = {
    staged: true,
    sideEffects: "isolated_review_staging_only",
    expectedReceiptRootHash: rootHash,
    candidateCount,
    evidenceLanes: laneCounts,
    manifest,
    manifestChecksum,
    nextStep: "Keep DIRECTORY_PUBLICATION_WORKER_ENABLED=0 until this staged receipt is retained. Then set DIRECTORY_PUBLICATION_BATCH_SHA256 to manifestChecksum, deploy one worker with DIRECTORY_PUBLISHER_CONCURRENCY=1, and read aggregate receipts after terminal statuses.",
  };
  writeFileSync(resolve(outDir, "staging-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
