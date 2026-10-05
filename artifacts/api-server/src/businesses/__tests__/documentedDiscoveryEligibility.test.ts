import { describe, expect, it } from "vitest";
import {
  DOCUMENTED_DISCOVERY_POLICY_VERSION,
  documentedDiscoveryEligibilitySqlPredicate,
  isDocumentedDiscoveryEligible,
} from "../documentedDiscoveryEligibility";

const current = {
  eligibilityStatus: "qualified",
  policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
  identityEvidenceId: "identity-receipt",
  ownershipEvidenceId: "ownership-receipt",
  officialWebsiteEvidenceId: "website-receipt",
  officialSocialEvidenceId: "social-receipt",
  ownershipSourceExpiresAt: "2027-01-01T00:00:00.000Z",
  reviewAfter: "2026-12-01T00:00:00.000Z",
  ownershipDesignations: ["Black / African American-Owned"],
} as const;
const now = new Date("2026-10-05T00:00:00.000Z");

describe("documented Discovery eligibility", () => {
  it("requires every source receipt and a current ownership review", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialSocialEvidenceId: null }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipSourceExpiresAt: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, reviewAfter: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipDesignations: [] }, "discovery", now)).toBe(false);
  });

  it("requires a separate geocode receipt before a qualified profile can be a map pin", () => {
    expect(isDocumentedDiscoveryEligible(current, "map", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, mapPinEvidenceId: "geocode-receipt" }, "map", now)).toBe(true);
  });

  it("uses a fail-closed operational hold rather than an all-live fallback", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now, "hold")).toBe(false);
    expect(documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery", "hold")).toBe("FALSE");
  });

  it("builds a static server predicate with receipt, expiry, and surface guards", () => {
    const discovery = documentedDiscoveryEligibilitySqlPredicate("b.id");
    const map = documentedDiscoveryEligibilitySqlPredicate('"businesses"."id"', "map");
    expect(discovery).toContain("public.business_discovery_eligibility");
    expect(discovery).toContain("ownership_evidence_id IS NOT NULL");
    expect(discovery).toContain("official_website_evidence_id IS NOT NULL");
    expect(discovery).toContain("official_social_evidence_id IS NOT NULL");
    expect(discovery).toContain("ownership_source_expires_at > CURRENT_TIMESTAMP");
    expect(discovery).toContain("review_after > CURRENT_TIMESTAMP");
    expect(map).toContain("map_pin_evidence_id IS NOT NULL");
    expect(map).toContain('"businesses"."id"');
  });
});
