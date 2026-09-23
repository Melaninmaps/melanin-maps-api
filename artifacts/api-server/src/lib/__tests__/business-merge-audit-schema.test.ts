import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrations = readFileSync(
  new URL("../startup-migrations.ts", import.meta.url),
  "utf8",
);
const adminRoute = readFileSync(
  new URL("../../routes/admin.ts", import.meta.url),
  "utf8",
);

describe("business merge audit schema", () => {
  it("uses the established varchar business key for immutable audit references", () => {
    const start = migrations.indexOf("CREATE TABLE IF NOT EXISTS business_merge_audit_events");
    const end = migrations.indexOf("CREATE INDEX IF NOT EXISTS business_merge_audit_review_idx", start);
    const table = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(table).toContain("duplicate_business_id varchar NOT NULL REFERENCES businesses(id)");
    expect(table).toContain("canonical_business_id varchar NOT NULL REFERENCES businesses(id)");
    expect(table).not.toContain("duplicate_business_id uuid");
    expect(table).not.toContain("canonical_business_id uuid");
  });

  it("does not cast public business keys to UUID during merge or restore", () => {
    const mergeStart = adminRoute.indexOf('"/admin/business-review/:id",');
    const restoreStart = adminRoute.indexOf('"/admin/business-review/:id/restore-merge"');
    const mergeRoute = adminRoute.slice(mergeStart, restoreStart);
    const restoreRoute = adminRoute.slice(restoreStart);

    expect(mergeStart).toBeGreaterThan(-1);
    expect(restoreStart).toBeGreaterThan(-1);
    expect(mergeRoute).toContain("'merge',$3,$4");
    expect(mergeRoute).not.toContain("'merge',$3::uuid,$4::uuid");
    expect(restoreRoute).toContain("WHERE id = $1\n          FOR UPDATE");
    expect(restoreRoute).toContain("WHERE id = $7");
    expect(restoreRoute).toContain("'restore',$3,$4");
    expect(restoreRoute).not.toContain("'restore',$3::uuid,$4::uuid");
  });
});
