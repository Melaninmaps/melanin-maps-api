import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminScreen = readFileSync(
  resolve(__dirname, "../pages/admin.tsx"),
  "utf8",
);

describe("Admin Kinfolk Current online-presence controls", () => {
  it("shows a separate reversible Delete Review section rather than treating it as Archive", () => {
    expect(adminScreen).toContain("Kinfolk Current Delete Review");
    expect(adminScreen).toContain('key: "kinfolk_current_delete_review"');
    expect(adminScreen).toContain("Restore exact prior state");
    expect(adminScreen).toContain("Move selected to Delete Queue ({selectedVisibleBusinessCount})");
    expect(adminScreen).toContain("moveBusinessesToDeleteQueue([biz.id], [biz.name], biz.kinfolkCurrentDeleteReview)");
    expect(adminScreen).toContain("Open Delete Queue");
    expect(adminScreen).toContain("This queue never permanently deletes a business.");
  });

  it("loads a verifier manifest and sends it to the guarded API endpoint", () => {
    expect(adminScreen).toContain("kinfolk_current_online_presence_apply_v1");
    expect(adminScreen).toContain("Load verified Kinfolk Current online-presence manifest");
    expect(adminScreen).toContain("api/admin/businesses/kinfolk-current/online-presence-apply");
    expect(adminScreen).toContain("changed links, active social profiles");
  });

  it("does not offer generic permanent deletion for a queued Delete Review record", () => {
    expect(adminScreen).toContain("!biz.deleteQueueEntryId && <button");
    expect(adminScreen).toContain("api/admin/businesses/kinfolk-current/delete-review/restore");
  });
});
