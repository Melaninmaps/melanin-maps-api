import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claimsRoute = readFileSync(new URL("../claims.ts", import.meta.url), "utf8");

function routeSection(start: string, end: string): string {
  const startAt = claimsRoute.indexOf(start);
  const endAt = claimsRoute.indexOf(end, startAt + start.length);
  expect(startAt).toBeGreaterThanOrEqual(0);
  expect(endAt).toBeGreaterThan(startAt);
  return claimsRoute.slice(startAt, endAt);
}

describe("business ownership claim lifecycle contract", () => {
  it("does not permit a second member to bypass an active claim review", () => {
    const createClaim = routeSection(
      'router.post("/businesses/:id/claims"',
      'router.get("/me/business-claims"',
    );

    expect(createClaim).toContain("One-open-claim-per-member-per-business guard");
    expect(createClaim).toContain("competingClaims");
    expect(createClaim).toContain("user_id <> $2");
    expect(createClaim).toContain("status IN ('pending', 'needs_info')");
    expect(createClaim).toContain("Another ownership claim is already being reviewed");
  });

  it("acknowledges a submitted claim without promising an unsupported review timeline", () => {
    const createClaim = routeSection(
      'router.post("/businesses/:id/claims"',
      'router.get("/me/business-claims"',
    );

    expect(createClaim).toContain("Claim submitted for private review.");
    expect(createClaim).toContain("may grant listing-management access");
    expect(createClaim).toContain("does not verify the business or its ownership designations");
    expect(createClaim).not.toContain("within one business day");
  });

  it("returns a rejected or withdrawn listing to claimable state only when no active review remains", () => {
    expect(claimsRoute).toContain("async function releaseBusinessFromClaimPendingIfNoOpenClaims");
    expect(claimsRoute).toContain("WHERE business_id = $1 AND status IN ('pending', 'needs_info')");
    expect(claimsRoute).toContain("ownership_control_status = 'unclaimed'");
    expect(claimsRoute).toContain("ownership_control_status = 'claim_pending'");

    const claimantActions = routeSection(
      'router.patch("/me/business-claims/:id"',
      'router.get("/admin/business-claims"',
    );
    expect(claimantActions).toContain("await releaseBusinessFromClaimPendingIfNoOpenClaims(claim.business_id)");

    const triage = routeSection(
      'router.patch("/admin/business-claims/:id"',
      'router.post("/admin/business-claims/:id/approve"',
    );
    expect(triage).toContain('if (status === "rejected")');
    expect(triage).toContain("await releaseBusinessFromClaimPendingIfNoOpenClaims(rows[0].business_id)");

    const legacyTriage = routeSection(
      'router.patch("/admin/claims/:id"',
      "export default router",
    );
    expect(legacyTriage).toContain('if (status === "rejected")');
    expect(legacyTriage).toContain("await releaseBusinessFromClaimPendingIfNoOpenClaims(rows[0].business_id)");
  });

  it("keeps approval transactional and ownership verification separate", () => {
    const approval = routeSection(
      'router.post("/admin/business-claims/:id/approve"',
      'router.post("/admin/business-claims/:id/revoke"',
    );

    expect(approval).toContain('await client.query("BEGIN")');
    expect(approval).toContain("FOR UPDATE");
    expect(approval).toContain("ownership_control_status='claimed'");
    expect(approval).toContain("never touches verified/verified_designations");
    expect(approval).not.toContain("SET verified=");
    expect(approval).not.toContain("SET verified_designations=");
  });
});
