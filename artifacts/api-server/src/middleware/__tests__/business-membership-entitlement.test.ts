import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getBusinessMembershipTier,
  higherMembershipTier,
} from "../requireMembership.js";

describe("business membership community entitlements", () => {
  it("maps active business tiers to their included community tier", () => {
    expect(getBusinessMembershipTier([])).toBe("free");
    expect(getBusinessMembershipTier([{ business_status: "community", founding_business: false }])).toBe("free");
    expect(getBusinessMembershipTier([{ business_status: "growth", founding_business: false }])).toBe("community_builder");
    expect(getBusinessMembershipTier([{ business_status: "premium", founding_business: false }])).toBe("legacy_member");
    expect(getBusinessMembershipTier([{ business_status: "community", founding_business: true }])).toBe("legacy_member");
  });

  it("uses the highest approved entitlement without downgrading a personal membership", () => {
    expect(higherMembershipTier("free", "community_builder")).toBe("community_builder");
    expect(higherMembershipTier("trailblazer", "free")).toBe("trailblazer");
    expect(higherMembershipTier("trailblazer", "community_builder")).toBe("community_builder");
    expect(higherMembershipTier("legacy_member", "community_builder")).toBe("legacy_member");
  });

  it("derives business access only from approved, unrevoked, currently eligible owner links", () => {
    const source = readFileSync(new URL("../requireMembership.ts", import.meta.url), "utf8");
    expect(source).toContain("INNER JOIN business_owner_links bol ON bol.business_id = b.id");
    expect(source).toContain("bol.role = 'owner'");
    expect(source).toContain("bol.status = 'approved'");
    expect(source).toContain("bol.revoked_at IS NULL");
    expect(source).toContain("b.membership_renewal_date >= NOW()");
    expect(source).not.toMatch(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?(?:businesses|business_owner_links|users)/i);
  });
});
