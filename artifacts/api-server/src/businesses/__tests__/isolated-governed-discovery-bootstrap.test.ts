import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("isolated governed discovery bootstrap", () => {
  it("provisions every schema relation required by public source-backed directory reads", () => {
    const migrationsFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../lib/startup-migrations.ts",
    );
    const source = readFileSync(migrationsFile, "utf8");
    const start = source.indexOf("const ISOLATED_GOVERNED_DISCOVERY_SCHEMA_MIGRATIONS");
    const end = source.indexOf("export const COMMUNITY_PUBLICATION_REQUIRED_COLUMNS", start);
    const bootstrap = source.slice(start, end);

    expect(bootstrap).toContain('"business_member_feedback_table_v1"');
    expect(bootstrap).toContain('"business_member_feedback_index_v1"');
    expect(bootstrap).toContain('"business_profile_evidence_receipts_v1"');
    expect(bootstrap).toContain('"business_discovery_eligibility_v1"');
    expect(bootstrap).toContain('"business_discovery_eligibility_audit_events_v1"');
    expect(bootstrap).toContain('"founder_source_presence_publication_v1"');
    expect(bootstrap).toContain('"founder_source_receipt_integrity_review_v1"');
    expect(bootstrap).toContain(
      "SELECT business_id, member_id, kind, key, status FROM business_member_feedback LIMIT 0",
    );
    expect(bootstrap).toContain(
      "SELECT business_id, source_record_key FROM business_source_directory_receipts LIMIT 0",
    );
    expect(bootstrap).toContain('process.env.RAILWAY_ENVIRONMENT_NAME !== "staging"');
    expect(bootstrap).toContain('process.env.KINFOLK_MEMORY_STAGING_ISOLATION !== "true"');
  });

  it("does not re-add the existing source-receipt status constraint after a restart", () => {
    const migrationsFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../lib/startup-migrations.ts",
    );
    const source = readFileSync(migrationsFile, "utf8");
    const start = source.indexOf('name: "founder_source_receipt_integrity_review_v1"');
    const end = source.indexOf('name: "business_directory_reconciliation_ledger_v1"', start);
    const migration = source.slice(start, end);

    expect(migration).toContain("FROM pg_constraint");
    expect(migration).toContain("conrelid = 'business_source_directory_receipts'::regclass");
    expect(migration).toContain("business_source_directory_receipts_mapping_status_check");
    expect(migration).toContain("WHEN duplicate_object THEN");
    expect(migration).toContain("VALIDATE CONSTRAINT business_source_directory_receipts_mapping_status_check");
    expect(migration).not.toContain("DROP CONSTRAINT");
  });
});
