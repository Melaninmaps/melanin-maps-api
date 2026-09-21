#!/usr/bin/env node
/**
 * Deterministic fixture test for source-receipted directory publication lanes.
 * It uses an isolated temporary signed-manifest-shaped input and has no network,
 * database, staging, or publication side effect.
 */
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(new URL("..", import.meta.url).pathname);
const scriptDirectory = resolve(new URL(".", import.meta.url).pathname);
const generator = resolve(scriptDirectory, "generate-inventory-cohort-receipts.mjs");

function record(overrides) {
  return {
    source_row: 1,
    source_row_id: "fixture-1",
    name: "Proven Example Business",
    city: "Philadelphia",
    state: "PA",
    country: "United States",
    target_kind: "business",
    address: "100 Main Street",
    website: "https://example.test/",
    source_url: "https://source.example.test/directory",
    ownership_designations: ["Black-owned"],
    ...overrides,
  };
}

async function main() {
  const temporary = await mkdtemp(join(tmpdir(), "mwm-evidence-lanes-"));
  try {
    const sourceRoot = join(temporary, "data", "founder-imports", "fixture");
    await mkdir(sourceRoot, { recursive: true });
    const input = join(sourceRoot, "fixture-review-only-candidates.jsonl");
    const rows = [
      record({
        source_row: 1,
        source_row_id: "chamber",
        source_name: "African American Chamber of Commerce — Active Member Directory",
      }),
      record({
        source_row: 2,
        source_row_id: "institutional",
        name: "Institutional Example Business",
        address: "101 Main Street",
        source_name: "City of Philadelphia Black-Owned Business Directory",
      }),
      record({
        source_row: 3,
        source_row_id: "editorial",
        name: "Editorial Example Business",
        address: "102 Main Street",
        source_name: "Neighborhood Magazine — Black-Owned Places to Visit",
      }),
      record({
        source_row: 4,
        source_row_id: "proxy-only",
        name: "Proxy Example Business",
        address: "103 Main Street",
        source_name: "City of Philadelphia Business Directory",
        ownership_designations: ["BIPOC-owned"],
      }),
    ];
    await writeFile(input, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
    const out = join(temporary, "receipts.jsonl");
    const summary = join(temporary, "summary.json");
    await execFileAsync(process.execPath, [generator, "--root", join(temporary, "data", "founder-imports"), "--out", out, "--summary", summary], {
      cwd: repositoryRoot,
    });
    const receipts = (await readFile(out, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const byRow = new Map(receipts.map((receipt) => [receipt.sourceRowId, receipt]));
    const chamber = byRow.get("chamber");
    const institutional = byRow.get("institutional");
    const editorial = byRow.get("editorial");
    const proxyOnly = byRow.get("proxy-only");

    if (chamber?.cohort !== "mwm_chamber_backed_candidate" || chamber?.evidenceLane !== "chamber" || !chamber?.eligibleForReleasePreview) {
      throw new Error("Expected explicit Chamber source to enter the Chamber automatic lane.");
    }
    if (institutional?.cohort !== "mwm_institutional_directory_candidate" || institutional?.evidenceLane !== "institutional_directory" || !institutional?.eligibleForReleasePreview) {
      throw new Error("Expected official institutional directory source to enter the institutional automatic lane.");
    }
    if (editorial?.cohort !== "source_reputable_listing_candidate" || editorial?.evidenceLane !== "reputable_source" || !editorial?.eligibleForReleasePreview || editorial?.publicationClassification !== "source_reported_mwm_designation") {
      throw new Error("Expected an explicit source-reported designation to remain unverified while becoming publishable through the reputable-source lane.");
    }
    if (proxyOnly?.cohort !== "source_reputable_listing_candidate" || proxyOnly?.publicationClassification !== "unverified_source_listing" || !proxyOnly?.eligibleForReleasePreview) {
      throw new Error("Expected proxy-only designation to publish only as an unverified source listing, without identity inference.");
    }
    process.stdout.write("Source-receipted directory publication fixture test passed.\n");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
