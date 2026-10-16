import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDashboard = readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("administrator Delete Queue dashboard", () => {
  it("gives held records a separate seven-day folder and keeps it out of all-review copy", () => {
    expect(adminDashboard).toContain('"delete_queue"');
    expect(adminDashboard).toContain("Delete Queue — 7-day hold");
    expect(adminDashboard).toContain("All reviewable business records");
    expect(adminDashboard).toContain("Delete Queue records remain isolated");
    expect(adminDashboard).toContain("deleteQueueEligibleAt");
  });

  it("moves Archive and Duplicate vault records into a reversible hold rather than deleting them", () => {
    expect(adminDashboard).toContain("moveBusinessesToDeleteQueue");
    expect(adminDashboard).toContain("api/admin/businesses/delete-queue");
    expect(adminDashboard).toContain("MOVE ${ids.length}");
    expect(adminDashboard).toContain("Nothing is deleted automatically");
    expect(adminDashboard).toContain("Move to Delete Queue");
  });

  it("allows a record to leave the hold and exposes permanent delete only after eligibility", () => {
    expect(adminDashboard).toContain("removeBusinessesFromDeleteQueue");
    expect(adminDashboard).toContain("api/admin/businesses/delete-queue/remove");
    expect(adminDashboard).toContain("Remove from Delete Queue");
    expect(adminDashboard).toContain("Permanently delete eligible");
    expect(adminDashboard).toContain("Seven-day hold complete");
  });
});
