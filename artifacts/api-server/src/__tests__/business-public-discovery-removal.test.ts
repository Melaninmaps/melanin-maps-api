import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminRoute = readFileSync(
  fileURLToPath(new URL("../routes/admin.ts", import.meta.url)),
  "utf8",
);
const startupMigrations = readFileSync(
  fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);

describe("administrator public-discovery removal governance", () => {
  it("requires a written administrator reason and records reversible removal state", () => {
    expect(adminRoute).toContain('"/admin/businesses/:id/listing-status"');
    expect(adminRoute).toContain("A 3–1,000 character administrator reason is required");
    expect(adminRoute).toContain("remove_public_discovery");
    expect(adminRoute).toContain("restore_public_discovery");
    expect(adminRoute).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("listingStatus: \"archived\"");
    expect(adminRoute).toContain('status: "suspended"');
    expect(adminRoute).toContain("promotionEligible: false");
    expect(adminRoute).toContain("featured: false");
  });

  it("persists an additive audit table and never destructively deletes a business", () => {
    expect(startupMigrations).toContain("ensureBusinessListingStatusAuditSchema");
    expect(startupMigrations).toContain("business_listing_status_audit_events");
    expect(adminRoute).not.toMatch(/DELETE\s+FROM\s+(?:public\.)?businesses\b/i);
  });
});
