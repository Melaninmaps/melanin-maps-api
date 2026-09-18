import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("mobile web-payment handoff", () => {
  it("uses fixed Mapping with Melanin website destinations without user or payment data", () => {
    const handoff = source("../lib/webPaymentHandoff.ts");

    expect(handoff).toContain('membership: "/membership"');
    expect(handoff).toContain('billing: "/billing"');
    expect(handoff).toContain('familyPlan: "/family-plan"');
    expect(handoff).toContain('businessMembership: "/for-business-owners"');
    expect(handoff).toContain('businessPromotions: "/business-growth-center"');
    expect(handoff).toContain('EXPO_PUBLIC_IOS_EXTERNAL_WEB_PAYMENT_APPROVED');
    expect(handoff).toContain('EXPO_PUBLIC_ANDROID_EXTERNAL_WEB_PAYMENT_APPROVED');
    expect(handoff).not.toContain('priceId');
    expect(handoff).not.toContain('auth_session_token');
    expect(handoff).not.toContain('checkoutUrl');
  });

  it("keeps native membership and promotion clients from creating Stripe payment sessions", () => {
    const membership = source("../hooks/useMembership.ts");
    const family = source("../hooks/useFamilyPlan.ts");
    const dashboard = source("../app/business-dashboard.tsx");
    const listings = source("../hooks/useListings.ts");

    expect(membership).toContain('openWebPaymentHandoff("membership")');
    expect(membership).toContain('openWebPaymentHandoff("billing")');
    expect(membership).not.toContain('/api/stripe/checkout');
    expect(membership).not.toContain('/api/stripe/portal');

    expect(family).toContain('openWebPaymentHandoff("familyPlan")');
    expect(family).not.toContain('/api/membership/family/add-seat');

    expect(dashboard).toContain('openWebPaymentHandoff("businessPromotions")');
    expect(dashboard).not.toContain('/api/businesses/mine/growth-tools/checkout');

    expect(listings).toContain("openBusinessListingWebsite(businessId, listing.id)");
    expect(listings).not.toContain("/api/connect/listings/${listing.id}/checkout");
  });
});
