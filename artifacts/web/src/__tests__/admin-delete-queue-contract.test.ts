import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const admin = readFileSync(resolve(__dirname, "../pages/admin.tsx"), "utf8");
const move = admin.slice(admin.indexOf("  const moveBusinessesToDeleteQueue ="), admin.indexOf("  const moveSelectedBusinessesToDeleteQueue ="));
const queueToolbar = admin.slice(admin.indexOf('{bizStatusFilter === "delete_queue" ? ('), admin.indexOf(') : bizStatusFilter === "duplicates" ? (', admin.indexOf('{bizStatusFilter === "delete_queue" ? (')));

describe("Admin dedicated Delete Queue", () => {
  it("is visibly reachable separately from every other vault and Delete Review", () => {
    for (const key of ["delete_queue", "archived", "duplicates", "permanently_closed", "kinfolk_current_delete_review"]) {
      expect(admin).toContain(`key: "${key}"`);
    }
    expect(admin).toContain("Open Delete Queue");
    expect(admin).toContain("Delete Queue (${deleteQueueCount.toLocaleString()})");
  });

  it("moves a selected reviewed record or individual row directly without any permanent DELETE request", () => {
    expect(move).toContain("api/admin/businesses/delete-queue");
    expect(move).toContain('method: "POST"');
    expect(move).toContain('source: fromDeleteReview ? "kinfolk_current_delete_review"');
    expect(move).not.toContain("api/admin/businesses/permanent");
    expect(move).not.toContain('method: "DELETE"');
    expect(admin).toContain("moveBusinessesToDeleteQueue([biz.id], [biz.name], biz.kinfolkCurrentDeleteReview)");
    expect(admin).toContain("Move selected to Delete Queue ({selectedVisibleBusinessCount})");
    expect(admin).toContain("Restore exact prior state");
  });

  it("describes an intact seven-day retention hold that never auto-deletes", () => {
    expect(move).toContain("remain intact for at least 7 days");
    expect(move).toContain("Nothing auto-deletes");
    expect(admin).toContain("Legacy hold (automatic deletion disabled)");
    expect(admin).not.toContain("scheduled for permanent deletion on");
  });

  it("removes a queue hold only to a non-public vault and never offers generic public restore in that folder", () => {
    expect(queueToolbar).toContain("Remove selected hold — keep non-public");
    expect(queueToolbar).not.toContain("restoreSelectedBusinesses");
    expect(queueToolbar).not.toContain("restoreSelectedKinfolkCurrentDeleteReview");
    expect(admin).toContain("This does NOT restore public discovery");
  });

  it("requires separate typed confirmation and disables premature permanent deletion", () => {
    expect(queueToolbar).toContain("!business.deleteQueueEligible");
    expect(admin).toContain("disabled={bulkBusinessUpdating || !biz.deleteQueueEligible}");
    expect(admin).toContain("const confirmation = window.prompt");
    expect(admin).toContain("if (confirmation !== requiredConfirmation) return;");
    expect(admin).toContain("body: JSON.stringify({ ids, confirmation, reason:");
    expect(admin).toContain("Every selected record must complete its 7-day Delete Queue hold");
  });
});
