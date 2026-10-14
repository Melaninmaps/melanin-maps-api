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
const businessesRoute = readFileSync(
  fileURLToPath(new URL("../routes/businesses.ts", import.meta.url)),
  "utf8",
);

describe("administrator public-discovery removal governance", () => {
  it("records a reversible removal state with an automatic administrator audit note", () => {
    expect(adminRoute).toContain('"/admin/businesses/:id/listing-status"');
    expect(adminRoute).toContain('|| "Administrator lifecycle update"');
    expect(adminRoute).toContain("remove_public_discovery");
    expect(adminRoute).toContain("restore_public_discovery");
    expect(adminRoute).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("listingStatus: \"archived\"");
    expect(adminRoute).toContain('status: "suspended"');
    expect(adminRoute).toContain("promotionEligible: false");
    expect(adminRoute).toContain("featured: false");
  });

  it("keeps ordinary removal reversible and records any confirmed deletion", () => {
    expect(startupMigrations).toContain("ensureBusinessListingStatusAuditSchema");
    expect(startupMigrations).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("business_permanent_deletion_audit_events");
    expect(adminRoute).toContain("Administrator-confirmed permanent deletion");
    expect(adminRoute).not.toContain("Permanent deletion is allowed only for records already in Archive vault or Duplicate vault.");
    expect(adminRoute).toContain('DELETE FROM businesses WHERE id = ANY($1::text[])');
    expect(adminRoute).toContain("Deliberately no CASCADE");
  });

  it("makes the required audit schema available before either reversible archive path runs", () => {
    expect(adminRoute).toContain("async function ensureListingStatusAuditSchema");
    expect(adminRoute).toContain("CREATE TABLE IF NOT EXISTS business_listing_status_audit_events");
    expect(adminRoute).toContain("await ensureListingStatusAuditSchema(client);");
    expect(adminRoute).toContain("async function recordListingStatusAudit");
    expect(adminRoute).toContain("randomUUID()");
    expect(adminRoute).not.toContain("VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::jsonb)");
  });

  it("keeps archived records out of all public directory search paths", () => {
    expect(businessesRoute).toContain("function publicBusinessVisibilityCondition");
    expect(businessesRoute).toContain("public.business_record_is_public");
    expect(businessesRoute).toContain("conditions.push(publicVisibilityCondition)");
    expect(businessesRoute).not.toContain("directConditions.push(");
  });
});
