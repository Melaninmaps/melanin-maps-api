import { describe, expect, it } from "vitest";
import {
  DOCUMENTED_DISCOVERY_POLICY_VERSION,
  documentedDiscoveryEligibilitySqlPredicate,
  isDocumentedDiscoveryEligible,
} from "../documentedDiscoveryEligibility";

const current = {
  eligibilityStatus: "public_eligible",
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

describe("documented Directory eligibility", () => {
  it("requires exact public state, identity, ownership, an official presence, and current review", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialSocialEvidenceId: null }, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialWebsiteEvidenceId: null }, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialWebsiteEvidenceId: null, officialSocialEvidenceId: null }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, identityEvidenceId: null }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, eligibilityStatus: "ownership_not_established" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipSourceExpiresAt: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, reviewAfter: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
  });

  it("requires a separate geocode receipt before a public eligible profile can be a map pin", () => {
    expect(isDocumentedDiscoveryEligible(current, "map", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, mapPinEvidenceId: "geocode-receipt" }, "map", now)).toBe(true);
  });

  it("requires ready Catalog membership for Kinfolk recommendations", () => {
    expect(isDocumentedDiscoveryEligible({ ...current, eligibilityStatus: "kinfolk_eligible" }, "kinfolk", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, eligibilityStatus: "kinfolk_eligible", kinfolkCatalogReady: true }, "kinfolk", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, kinfolkCatalogReady: true }, "kinfolk", now)).toBe(false);
  });

  it("uses a fail-closed operational hold rather than an all-live fallback", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now, "hold")).toBe(false);
    expect(documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery", "hold")).toBe("FALSE");
  });

  it("builds a static server predicate with exact state, receipts, expiry, and catalog guards", () => {
    const discovery = documentedDiscoveryEligibilitySqlPredicate("b.id");
    const map = documentedDiscoveryEligibilitySqlPredicate('"businesses"."id"', "map");
    const kinfolk = documentedDiscoveryEligibilitySqlPredicate("b.id", "kinfolk");
    expect(discovery).toContain("'public_eligible', 'kinfolk_eligible'");
    expect(discovery).toContain("identity_evidence_id IS NOT NULL");
    expect(discovery).toContain("ownership_evidence_id IS NOT NULL");
    expect(discovery).toContain("ownership_source_expires_at > CURRENT_TIMESTAMP");
    expect(map).toContain("map_pin_evidence_id IS NOT NULL");
    expect(kinfolk).toContain("business_catalog_cohort_memberships");
    expect(kinfolk).toContain("kinfolk_catalog");
  });
});
