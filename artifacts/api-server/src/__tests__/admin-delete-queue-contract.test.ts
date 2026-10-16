import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const adminRoute = source("../routes/admin.ts");
const startupMigrations = source("../lib/startup-migrations.ts");

describe("administrator Delete Queue governance", () => {
  it("isolates active holds from ordinary, Archive, Duplicate, and all-review scopes", () => {
    expect(adminRoute).toContain('status === "delete_queue"');
    expect(adminRoute).toContain("activeDeleteQueuePredicate");
    expect(adminRoute).toContain("reviewableInventoryWhere");
    expect(adminRoute).toContain("reviewableInventoryTotal");
    expect(adminRoute).toContain("deleteQueueEligibleAt");
  });

  it("uses a reversible, auditable seven-day hold instead of automatic deletion", () => {
    expect(adminRoute).toContain('router.post("/admin/businesses/delete-queue"');
    expect(adminRoute).toContain('router.post("/admin/businesses/delete-queue/remove"');
    expect(adminRoute).toContain("getDeleteQueueEligibleAt");
    expect(adminRoute).toContain("removeFromDeleteQueueConfirmation");
    expect(adminRoute).toContain("Nothing is deleted automatically after the hold.");
    expect(adminRoute).toContain("removed_at = NOW()");
    expect(adminRoute).toContain("removal_reason");
  });

  it("allows permanent deletion only after an active hold is eligible and prevents restoration bypasses", () => {
    expect(adminRoute).toContain("Permanent deletion is allowed only from the active Delete Queue after the seven-day hold.");
    expect(adminRoute).toContain("permanent_deleted_at = NOW()");
    expect(adminRoute).toContain("One or more selected records are still within the required seven-day Delete Queue hold.");
    expect(adminRoute).toContain("Remove the record from the Delete Queue before restoring public discovery.");
    expect(adminRoute).toContain("Remove this record from the Delete Queue before restoring public discovery.");
  });

  it("creates only additive queue storage at startup", () => {
    expect(startupMigrations).toContain('"business delete queue v1"');
    expect(startupMigrations).toContain("ensureBusinessDeleteQueueSchema");
    expect(startupMigrations).toContain("business_delete_queue_entries");
    expect(startupMigrations).toContain("business_delete_queue_active_business_idx");
  });
});
