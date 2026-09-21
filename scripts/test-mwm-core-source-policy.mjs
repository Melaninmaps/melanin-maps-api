#!/usr/bin/env node
/**
 * Fixture test for first-launch MWM Core classification. It makes a temporary
 * local manifest, invokes the offline receipt generator, and asserts that only
 * explicit Black/African American or Latino/a/x/Hispanic designations enter
 * MWM support filters. Other signed-source rows may be listed as unverified,
 * but no identity is inferred from a name, source, cuisine, or location.
 */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = await mkdtemp(join(tmpdir(), "mwm-core-policy-"));
try {
  const packageDirectory = join(root, "fixture", "review-package");
  await mkdir(packageDirectory, { recursive: true });
  const manifest = join(packageDirectory, "fixture-review-only-candidates.jsonl");
  const sourceUrl = "https://source.example.test/directory";
  const physical = (sourceRow, designation) => ({
    sourceRow,
    name: `Fixture ${sourceRow}`,
    targetKind: "business",
    address: `${sourceRow} Evidence Avenue`,
    city: "Philadelphia",
    state: "PA",
    country: "United States",
    website: `https://fixture-${sourceRow}.example.test`,
    sourceUrl,
    ownershipDesignations: [designation],
  });
  const records = [
    physical(1, "Black-owned"),
    physical(2, "African American owned"),
    physical(3, "Latina-owned"),
    physical(4, "Hispanic-owned"),
    physical(5, "Caribbean-owned"),
    physical(6, "Indigenous-owned"),
    physical(7, "BIPOC-owned"),
    physical(8, "minority-owned"),
    physical(9, "LGBTQIA+-owned"),
    physical(10, "woman-owned"),
  ];
  await writeFile(manifest, `${records.map(JSON.stringify).join("\n")}\n`);
  const out = join(root, "receipts.jsonl");
  const summary = join(root, "summary.json");
  const run = spawnSync(
    process.execPath,
    [
      resolve("scripts/generate-inventory-cohort-receipts.mjs"),
      "--root", root,
      "--out", out,
      "--summary", summary,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const receipts = (await readFile(out, "utf8")).trim().split("\n").map(JSON.parse);
  const designatedRows = receipts
    .filter((receipt) => receipt.publicationClassification === "source_reported_mwm_designation")
    .map((receipt) => receipt.sourceRow);
  assert.deepEqual(designatedRows, [1, 2, 3, 4]);
  for (const unverifiedRow of [5, 6, 7, 8, 9, 10]) {
    const receipt = receipts.find((item) => item.sourceRow === unverifiedRow);
    assert.equal(receipt.cohort, "source_reputable_listing_candidate");
    assert.equal(receipt.publicationClassification, "unverified_source_listing");
    assert.equal(receipt.eligibleForReleasePreview, true);
    assert.equal(receipt.directoryOutcome, "auto_ready");
    assert.equal(receipt.preAdmissionDirectoryOutcome, "needs_review");
  }
  process.stdout.write("MWM Core source-policy fixture test passed.\n");
} finally {
  await rm(root, { recursive: true, force: true });
}
