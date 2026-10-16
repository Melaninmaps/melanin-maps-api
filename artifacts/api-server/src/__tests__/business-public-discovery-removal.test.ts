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
const businessDeletionHold = readFileSync(
  fileURLToPath(new URL("../businesses/businessDeletionHold.ts", import.meta.url)),
  "utf8",
);
const serverStartup = readFileSync(
  fileURLToPath(new URL("../index.ts", import.meta.url)),
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

  it("keeps every requested deletion reversible for seven days and records final deletion", () => {
    expect(startupMigrations).toContain("ensureBusinessListingStatusAuditSchema");
    expect(startupMigrations).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("business_deletion_holds");
    expect(adminRoute).toContain("Admin moved businesses into the reversible seven-day Delete Queue");
    expect(adminRoute).toContain("cancelBusinessDeletionHold");
    expect(businessDeletionHold).toContain("business_permanent_deletion_audit_events");
    expect(businessDeletionHold).toContain("Automatic business deletion disabled");
    expect(businessDeletionHold).not.toContain("DELETE FROM businesses");
    expect(adminRoute).toContain('DELETE FROM businesses WHERE id = $1');
    expect(adminRoute).toContain("Deliberately no CASCADE");
    expect(adminRoute).toContain("permanentDeletionConfirmation(ids.length)");
    expect(adminRoute).toContain("eligible_at <= NOW() AND queued_at + INTERVAL '168 hours' <= NOW() AS eligible");
    expect(serverStartup).toContain("ensureBusinessDeletionHoldSchema(pool)");
    expect(serverStartup).toContain("startBusinessDeletionHoldWorker(pool, logger)");
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
