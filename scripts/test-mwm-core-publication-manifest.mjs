#!/usr/bin/env node
/**
 * Regression test: source packages can omit source_row_id. The derived JSONL
 * must use the immutable receipt ID and remain parseable before any protected
 * ingress request can be attempted.
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
  const source = join(packageRoot, "fixture-review-only-candidates.jsonl");
  // Intentional: source_row_id is absent in this signed-source-shaped row.
  await writeFile(source, `${JSON.stringify({
    sourceRow: 1,
    name: "Receipt ID Fixture",
    targetKind: "business",
    address: "101 Evidence Avenue",
    city: "Philadelphia",
    state: "PA",
    country: "United States",
    website: "https://fixture.example.test",
    sourceUrl: "https://source.example.test/directory",
    ownershipDesignations: ["Black-owned"],
  })}\n`);

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
    "--expected-candidate-count", "1",
    "--expected-chamber-count", "0",
    "--expected-institutional-directory-count", "0",
    "--expected-source-listing-count", "1",
  ], { cwd: process.cwd(), stdio: "pipe" });

  const [row] = (await readFile(manifest, "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(row.source_row, 1);
  assert.equal(row.source_row_id, "1");
  assert.equal(row.mwm_core_source_row_id, "1");
  assert.equal(JSON.stringify(row).includes("undefined"), false);
  process.stdout.write("Source-receipted publication manifest fixture test passed.\n");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
