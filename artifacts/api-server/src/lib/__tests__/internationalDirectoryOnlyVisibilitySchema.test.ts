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

describe("international directory-only visibility schema", () => {
  it("is an additive, receipt-only, reversible schema", () => {
    const start = migrations.indexOf("async function ensureInternationalDirectoryOnlyVisibilitySchema(");
    const end = migrations.indexOf("async function ensureSaborWebsiteCorrection(", start);
    const schema = migrations.slice(start, end);
    expect(migrations).toContain("international directory-only visibility receipts v1");
    expect(start).toBeGreaterThan(-1);
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS international_directory_only_visibility_receipts");
    expect(schema).toContain("valid_until");
    expect(schema).toContain("revoked_at");
    expect(schema).toContain("ON DELETE CASCADE");
    expect(schema).not.toContain("UPDATE businesses");
  });

  it("accepts only the fixed audit manifest and does not mutate business fields", () => {
    const start = adminRoute.indexOf('router.post("/admin/public-directory-only/international-activate"');
    const end = adminRoute.indexOf("Founder-authorized, source-backed intake", start);
    const route = adminRoute.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(route).toContain("matchesInternationalDirectoryOnlyManifest");
    expect(route).toContain("INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_SHA256");
    expect(route).toContain("international_directory_only_visibility_receipts");
    expect(route).toContain("ordinary_public_directory_only");
    expect(route).not.toContain("UPDATE businesses");
    expect(route).not.toContain("business_catalog_cohort_memberships");
  });
});
