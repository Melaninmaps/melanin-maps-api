import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  isVerifiedMinorityFlywheelEligible,
  resolveVerifiedMinorityFlywheelOwner,
} from "../verifiedMinorityFlywheelEligibility";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const analyticsRoute = readFileSync(`${root}artifacts/api-server/src/routes/businesses-analytics.ts`, "utf8");
const improvementRoute = readFileSync(`${root}artifacts/api-server/src/routes/business-improvement.ts`, "utf8");
const insightRoute = readFileSync(`${root}artifacts/api-server/src/routes/business-insights.ts`, "utf8");
const communityNeedsRoute = readFileSync(`${root}artifacts/api-server/src/routes/business-owner-insights.ts`, "utf8");
const pushNotifications = readFileSync(`${root}artifacts/api-server/src/lib/pushNotifications.ts`, "utf8");
const webTerms = readFileSync(`${root}artifacts/web/src/pages/terms.tsx`, "utf8");
const nativeTerms = readFileSync(`${root}artifacts/mobile/app/terms.tsx`, "utf8");

describe("verified minority flywheel eligibility", () => {
  const verifiedMinority = {
    status: "active",
    verified: true,
    verifiedDesignations: ["Black / African American-Owned"],
  };

  it("requires active platform verification and an MWM-controlled minority designation", () => {
    expect(isVerifiedMinorityFlywheelEligible(verifiedMinority)).toBe(true);
    expect(isVerifiedMinorityFlywheelEligible({
      ...verifiedMinority,
      verified: false,
    })).toBe(false);
    expect(isVerifiedMinorityFlywheelEligible({
      ...verifiedMinority,
      status: "suspended",
    })).toBe(false);
    expect(isVerifiedMinorityFlywheelEligible({
      ...verifiedMinority,
      verifiedDesignations: ["Woman-Owned"],
    })).toBe(false);
  });

  it("does not treat self-identification, a claim, or legacy flags as verified ownership", () => {
    expect(isVerifiedMinorityFlywheelEligible({
      status: "active",
      verified: true,
      verifiedDesignations: [],
      ownershipDesignations: ["Black / African American-Owned"],
      blackOwned: true,
      membership: "paid",
      ownerClaimStatus: "claimed",
    } as any)).toBe(false);
  });

  it("checks the active owner relationship and controlled designation at delivery time", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{
        id: "business-1",
        status: "active",
        verified: true,
        verified_designations: ["Latino / Hispanic-Owned"],
      }],
    });
    await expect(resolveVerifiedMinorityFlywheelOwner({ query } as any, {
      businessId: "business-1",
      userId: "member-1",
    })).resolves.toEqual({ kind: "eligible", businessId: "business-1" });

    const [statement, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(statement).toContain("business_owner_links AS owner_link");
    expect(statement).toContain("owner_link.status = 'approved'");
    expect(statement).toContain("owner_link.revoked_at IS NULL");
    expect(statement).toContain("b.verified_designations");
    expect(statement).not.toMatch(/b\.black_owned|b\.ownership_designations(?!\w)/);
    expect(parameters).toEqual(["business-1", "member-1"]);
  });

  it("fails closed when no approved owner relationship is available", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await expect(resolveVerifiedMinorityFlywheelOwner({ query } as any, {
      businessId: "business-1",
      userId: "member-1",
    })).resolves.toEqual({ kind: "not_owner" });
  });

  it("uses the same enforcement boundary for every targeted flywheel delivery route", () => {
    expect(analyticsRoute).toContain("isVerifiedMinorityFlywheelEligible(business)");
    expect(analyticsRoute).toContain("owner_link.status = 'approved'");
    expect(improvementRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(improvementRoute).toContain("Client-supplied names and locations are never trusted");
    expect(insightRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(insightRoute).toContain("The submitter cannot label a survey as minority-owned");
    expect(communityNeedsRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(pushNotifications).toContain("owner_link.revoked_at IS NULL");
    expect(pushNotifications).toContain(".filter(isVerifiedMinorityFlywheelEligible)");
    expect(pushNotifications).not.toContain(".map((b) => b.submittedById)");
  });

  it("keeps legitimate registration open while accurately describing protected flywheel benefits", () => {
    for (const terms of [webTerms, nativeTerms]) {
      expect(terms).toContain("Any legitimate business may register and maintain");
      expect(terms).toContain("Any business owner may use general KinfolkAI assistance");
      expect(terms).toContain("economic-flywheel benefits");
      expect(terms).toContain("verified Minority-owned designation");
    }
  });
});
