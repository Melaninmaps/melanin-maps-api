#!/usr/bin/env node
/**
 * Fixture test for first-launch MWM Core classification. It makes a temporary
 * local manifest, invokes the offline receipt generator, and asserts that only
 * explicit Black/African American or Latino/a/x/Hispanic designations qualify.
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
  const candidateRows = receipts
    .filter((receipt) => receipt.cohort === "mwm_source_backed_candidate")
    .map((receipt) => receipt.sourceRow);
  assert.deepEqual(candidateRows, [1, 2, 3, 4]);
  for (const heldRow of [5, 6, 7, 8, 9, 10]) {
    const receipt = receipts.find((item) => item.sourceRow === heldRow);
    assert.equal(receipt.cohort, "hold_mission_evidence_required");
    assert.deepEqual(receipt.reasonCodes, ["explicit_black_or_latino_hispanic_designation_required"]);
  }
  process.stdout.write("MWM Core source-policy fixture test passed.\n");
} finally {
  await rm(root, { recursive: true, force: true });
}
