import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native private business claim status", () => {
  const statusScreen = source("../app/my-business-claims.tsx");
  const settings = source("../app/settings.tsx");
  const claimModal = source("../components/ClaimBusinessModal.tsx");

  it("uses only the member-owned claim endpoints and exposes controlled lifecycle actions", () => {
    expect(statusScreen).toContain("/api/me/business-claims");
    expect(statusScreen).toContain('submitAction(claim, "withdraw")');
    expect(statusScreen).toContain('submitAction(resubmitClaim, "resubmit"');
    expect(statusScreen).toContain("Add details & resubmit");
    expect(statusScreen).toContain("Withdraw request");
    expect(statusScreen).toContain("getMemberApiHeaders()");
    expect(statusScreen).not.toContain("/api/admin/business-claims");
  });

  it("keeps claim status private and reachable after a successful submission", () => {
    expect(statusScreen).toContain("They never change a public business listing");
    expect(statusScreen).toContain("Ownership verification remains separate");
    expect(settings).toContain('route: "/my-business-claims"');
    expect(claimModal).toContain('router.push("/my-business-claims" as never)');
    expect(claimModal).toContain("View private status");
  });
});
