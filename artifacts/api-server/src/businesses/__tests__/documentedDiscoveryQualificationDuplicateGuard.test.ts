import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = () => readFileSync(
  fileURLToPath(new URL("../registerDocumentedDiscoveryReviewRoutes.ts", import.meta.url)),
  "utf8",
);

describe("documented discovery qualification duplicate protection", () => {
  it("rejects retained duplicate rows before receipts, eligibility, or ledger state can change", () => {
    const source = route();
    const start = source.indexOf('app.put("/api/admin/businesses/:id/documented-discovery-eligibility"');
    const end = source.indexOf('app.put("/api/admin/businesses/:id/stored-address-evidence"', start);
    const section = source.slice(start, end);
    expect(section).toContain("COALESCE(is_duplicate, false) AS is_duplicate");
    expect(section).toContain("duplicate_of_id");
    expect(section).toContain("A retained duplicate cannot receive a Kinfolk qualification");
    expect(section.indexOf("A retained duplicate cannot receive a Kinfolk qualification")).toBeLessThan(section.indexOf("INSERT INTO business_profile_evidence_receipts"));
  });
});
