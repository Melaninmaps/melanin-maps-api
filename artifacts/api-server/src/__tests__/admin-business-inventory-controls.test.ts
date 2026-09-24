import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const adminRoute = source("../routes/admin.ts");
const adminPublisher = source("../businesses/registerAdminPublishAndClaimRoutes.ts");
const migrations = source("../lib/startup-migrations.ts");
const businessSchema = source("../../../../lib/db/src/schema/businesses.ts");
const adminScreen = source("../../../web/src/pages/admin.tsx");
const adminAddBusiness = source("../../../web/src/components/AdminAddBusiness.tsx");

describe("administrator full-inventory and reversible duplicate controls", () => {
  it("returns a bounded full admin inventory instead of the former 500-row newest-record cap", () => {
    expect(adminRoute).toContain("const INVENTORY_PAGE_LIMIT = 10_000");
    expect(adminRoute).toContain("inventoryIsTruncated");
    expect(adminRoute).toContain("inventoryLimit");
    expect(adminRoute).not.toContain("ORDER BY created_at DESC\n       LIMIT 500");
  });

  it("supports city, service, date-added, and selected-row archive controls in the web dashboard", () => {
    expect(adminScreen).toContain("All cities");
    expect(adminScreen).toContain("All services");
    expect(adminScreen).toContain("Added on or after");
    expect(adminScreen).toContain("Added on or before");
    expect(adminScreen).toContain("Archive selected");
    expect(adminScreen).toContain("api/admin/businesses/listing-status");
  });

  it("keeps a bulk removal reversible and auditable rather than deleting businesses", () => {
    expect(adminRoute).toContain("Select between 1 and 500 businesses.");
    expect(adminRoute).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("remove_public_discovery");
    expect(adminScreen).toContain("research, source, or Kinfolk context");
    expect(adminRoute).not.toMatch(/DELETE\s+FROM\s+(?:public\.)?businesses\b/i);
  });

  it("stores intake evidence and a Kinfolk recommendation context through an archive", () => {
    for (const field of [
      "researchSourceLabel",
      "researchSourceUrl",
      "kinfolkRecommendationReason",
      "intakeBatchReference",
    ]) {
      expect(businessSchema).toContain(field);
      expect(adminPublisher).toContain(field);
      expect(adminAddBusiness).toContain(field);
    }
    expect(migrations).toContain("ensureBusinessIntakeMetadataSchema");
    expect(migrations).toContain("kinfolk_recommendation_reason");
  });

  it("creates a map pin only from a successfully geocoded supplied street address", () => {
    expect(adminPublisher).toContain("const coordinates = input.address");
    expect(adminPublisher).toContain("if (coordinates)");
    expect(adminPublisher).not.toContain('return { lat: "0", lng: "0" }');
    expect(adminPublisher).toContain("searchable MWM profile without a map pin");
  });
});
