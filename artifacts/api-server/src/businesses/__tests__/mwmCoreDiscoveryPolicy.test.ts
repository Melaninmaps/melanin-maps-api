import { describe, expect, it } from "vitest";
import {
  completedCohortDirectoryDiscoverySqlPredicate,
  isMwmCoreDiscoveryEnabled,
  isMwmCoreDiscoveryEligible,
  isMwmDiasporaPromotionEnabled,
  isMwmDiasporaPromotionEligible,
  mwmCoreDiscoverySqlPredicate,
  mwmDiasporaPromotionSqlPredicate,
} from "../mwmCoreDiscoveryPolicy";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "../documentedDiscoveryEligibility";

const documented = {
  eligibilityStatus: "qualified",
  policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
  identityEvidenceId: "identity",
  ownershipEvidenceId: "ownership",
  officialWebsiteEvidenceId: "website",
  officialSocialEvidenceId: "social",
  mapPinEvidenceId: "map",
  ownershipSourceExpiresAt: "2027-01-01T00:00:00.000Z",
  reviewAfter: "2026-12-01T00:00:00.000Z",
  ownershipDesignations: ["Black / African American-Owned"],
};

describe("MWM Core discovery policy compatibility", () => {
  it("keeps the documented gate enabled and never restores the former all-live catalog", () => {
    expect(isMwmCoreDiscoveryEnabled(undefined)).toBe(true);
    expect(isMwmCoreDiscoveryEnabled("off")).toBe(true);
    expect(isMwmDiasporaPromotionEnabled(undefined)).toBe(true);
    expect(isMwmDiasporaPromotionEnabled("all_public")).toBe(true);
    expect(mwmCoreDiscoverySqlPredicate("b.id")).toContain("business_discovery_eligibility");
    expect(mwmDiasporaPromotionSqlPredicate("b.id")).toContain("official_social_evidence_id IS NOT NULL");
  });

  it("fails closed for missing or inferred ownership evidence", () => {
    expect(isMwmCoreDiscoveryEligible(documented)).toBe(true);
    expect(isMwmCoreDiscoveryEligible({ ...documented, ownershipEvidenceId: null })).toBe(false);
    expect(isMwmDiasporaPromotionEligible({
      name: "Amina's Kitchen",
      cuisine: "Caribbean",
      city: "Philadelphia",
      ownershipDesignation: "minority-owned",
    } as unknown as typeof documented)).toBe(false);
  });

  it("retains completed-cohort provenance for review but not as member eligibility", () => {
    const predicate = completedCohortDirectoryDiscoverySqlPredicate('"businesses"."id"');
    expect(predicate).toContain("directory_publication_provenance");
    expect(predicate).toContain("completed_cohort_directory_discovery_receipts");
    expect(predicate).not.toContain("latitude");
    expect(predicate).not.toContain("longitude");
  });
});
