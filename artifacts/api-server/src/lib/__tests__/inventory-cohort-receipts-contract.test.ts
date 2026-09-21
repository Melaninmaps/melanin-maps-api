import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../../../../", import.meta.url));
const migrationSource = readFileSync(
  resolve(repositoryRoot, "artifacts/api-server/src/lib/startup-migrations.ts"),
  "utf8",
);
const applySource = readFileSync(
  resolve(repositoryRoot, "scripts/apply-inventory-cohort-receipts.mjs"),
  "utf8",
);
const preflightSource = readFileSync(
  resolve(repositoryRoot, "scripts/generate-inventory-cohort-receipts.mjs"),
  "utf8",
);

describe("inventory cohort receipts", () => {
  it("creates a receipt table without making it a public visibility rule", () => {
    expect(migrationSource).toContain("business_inventory_cohort_receipts_v1");
    expect(migrationSource).toContain("CREATE TABLE IF NOT EXISTS business_inventory_cohort_receipts");
    expect(migrationSource).toContain("observation only, never a visibility rule");
    expect(migrationSource).not.toContain("business_inventory_cohort_visible");
  });

  it("requires explicit apply plus a complete source and live-inventory proof", () => {
    expect(applySource).toContain('process.argv.includes("--apply")');
    expect(applySource).toContain("--expected-live-count");
    expect(applySource).toContain("--expected-source-root-hash");
    expect(applySource).toContain("Live public inventory count mismatch");
    expect(applySource).toContain("Refusing to write receipts without --apply");
  });

  it("does not mutate business visibility, a worker, or a listing in receipt application", () => {
    expect(applySource).not.toMatch(/UPDATE\s+(?:public\.)?businesses\b/i);
    expect(applySource).not.toMatch(/DELETE\s+FROM\s+(?:public\.)?businesses\b/i);
    expect(applySource).not.toMatch(/INSERT\s+INTO\s+(?:public\.)?businesses\b/i);
    expect(applySource).not.toContain("DIRECTORY_PUBLICATION_WORKER_ENABLED");
    expect(applySource).toContain("receipt_table_upsert_only");
  });

  it("uses explicit source evidence rather than identity proxies in preflight", () => {
    expect(preflightSource).toContain("explicit_black_or_latino_hispanic_designation_required");
    expect(preflightSource).toContain("mwm-core-black-latino-source-evidence-v2");
    expect(preflightSource).toContain("Generic \"minority-owned\", BIPOC, diaspora, Indigenous");
    expect(preflightSource).not.toContain("/\\bindigenous\\b/");
    expect(preflightSource).not.toContain("/\\bcaribbean\\b/");
    expect(preflightSource).not.toContain("/\\bbipoc\\b/");
    expect(preflightSource).toContain("traceable_source_directory_required");
    expect(preflightSource).toContain("No identity is inferred from a");
    expect(preflightSource).toContain("mwm_source_backed_candidate");
  });
});
