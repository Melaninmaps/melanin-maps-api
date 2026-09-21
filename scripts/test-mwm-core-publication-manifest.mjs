#!/usr/bin/env node
/**
 * Regression test: signed source manifests may reuse local source_row_id values
 * such as `1`. The derived combined JSONL must use a unique batch ingress ID
 * while retaining each source-local identifier in immutable receipt provenance.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const temporaryRoot = await mkdtemp(join(tmpdir(), "mwm-manifest-jsonl-"));
try {
  const packageRoot = join(temporaryRoot, "fixture", "review-package");
  await mkdir(packageRoot, { recursive: true });

  const sourceRecord = (name, address, website, sourceUrl) => ({
    // Intentional: each signed-source-shaped row lacks source_row_id and uses
    // its own local row 1. Source-local identity must survive the derived batch.
    sourceRow: 1,
    name,
    targetKind: "business",
    address,
    city: "Philadelphia",
    state: "PA",
    country: "United States",
    website,
    sourceUrl,
    ownershipDesignations: ["Black-owned"],
  });
  await writeFile(
    join(packageRoot, "alpha-review-only-candidates.jsonl"),
    `${JSON.stringify(sourceRecord("Alpha Receipt Fixture", "101 Evidence Avenue", "https://alpha.example.test", "https://source.example.test/alpha"))}\n`,
  );
  await writeFile(
    join(packageRoot, "beta-review-only-candidates.jsonl"),
    `${JSON.stringify(sourceRecord("Beta Receipt Fixture", "102 Evidence Avenue", "https://beta.example.test", "https://source.example.test/beta"))}\n`,
  );

  const receipts = join(temporaryRoot, "receipts.jsonl");
  const summary = join(temporaryRoot, "summary.json");
  const manifest = join(temporaryRoot, "publication.jsonl");
  const manifestSummary = join(temporaryRoot, "publication-summary.json");
  const generator = resolve("scripts/generate-inventory-cohort-receipts.mjs");
  const manifestGenerator = resolve("scripts/create-mwm-core-publication-manifest.mjs");
  execFileSync(process.execPath, [generator, "--root", temporaryRoot, "--out", receipts, "--summary", summary], {
    cwd: process.cwd(), stdio: "pipe",
  });
  const rootHash = JSON.parse(await readFile(summary, "utf8")).rootReceiptHash;
  execFileSync(process.execPath, [
    manifestGenerator,
    "--receipts", receipts,
    "--source-root", temporaryRoot,
    "--out", manifest,
    "--summary", manifestSummary,
    "--expected-receipt-root-hash", rootHash,
    "--expected-candidate-count", "2",
    "--expected-chamber-count", "0",
    "--expected-institutional-directory-count", "0",
    "--expected-source-listing-count", "2",
  ], { cwd: process.cwd(), stdio: "pipe" });

  const rows = (await readFile(manifest, "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.source_row), [1, 2]);
  assert.equal(new Set(rows.map((row) => row.source_row_id)).size, 2);
  assert.ok(rows.every((row) => row.source_row_id.startsWith("mwm-ingress:")));
  assert.deepEqual(rows.map((row) => row.mwm_core_source_row), [1, 1]);
  assert.deepEqual(rows.map((row) => row.mwm_core_source_row_id), ["1", "1"]);
  assert.deepEqual(rows.map((row) => row.mwm_core_ingress_row), [1, 2]);
  assert.deepEqual(rows.map((row) => row.mwm_core_ingress_row_id), rows.map((row) => row.source_row_id));
  assert.equal(JSON.stringify(rows).includes("undefined"), false);
  process.stdout.write("Source-receipted publication manifest identity fixture test passed.\n");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
