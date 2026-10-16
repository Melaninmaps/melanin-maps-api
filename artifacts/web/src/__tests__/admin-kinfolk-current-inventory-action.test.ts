import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const admin = readFileSync(resolve(__dirname, "../pages/admin.tsx"), "utf8");
const makeCurrent = admin.slice(
  admin.indexOf("  const makeBusinessKinfolkCurrent = async"),
  admin.indexOf("  const moveSelectedBusinessesToDeleteQueue ="),
);

describe("Admin direct Kinfolk Current inventory action", () => {
  it("offers a direct, reviewed-row promotion only from the Non-Kinfolk Current live inventory", () => {
    expect(admin).toContain("nonKinfolkCurrentCohortSelected");
    expect(admin).toContain('biz.listingStatus === "live_unclaimed" || biz.listingStatus === "live_claimed"');
    expect(admin).toContain("!biz.isDuplicate && !biz.deleteQueueEntryId && !biz.kinfolkCurrentDeleteReview");
    expect(admin).toContain("Make Kinfolk Current");
  });

  it("uses the existing audited catalog decision route without rewriting business profile fields", () => {
    expect(makeCurrent).toContain("api/admin/kinfolk-catalog/${encodeURIComponent(business.id)}");
    expect(makeCurrent).toContain('method: "PATCH"');
    expect(makeCurrent).toContain('state: "ready"');
    expect(makeCurrent).toContain("Administrator marked this live profile Kinfolk Current");
    expect(makeCurrent).toContain("await loadBusinesses()");
    expect(makeCurrent).not.toContain("/profile");
    expect(makeCurrent).not.toContain("listingStatus:");
    expect(makeCurrent).not.toContain("ownershipDesignations:");
  });
});
