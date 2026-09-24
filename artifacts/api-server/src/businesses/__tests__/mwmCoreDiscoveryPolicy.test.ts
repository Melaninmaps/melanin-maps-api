import { describe, expect, it } from "vitest";
import {
  isMwmDiasporaPromotionEligible,
  isMwmDiasporaPromotionEnabled,
  MWM_CORE_SOURCE_BACKED_COHORT,
  isMwmCoreDiscoveryEligible,
  isMwmCoreDiscoveryEnabled,
  completedCohortDirectoryDiscoverySqlPredicate,
  mwmCoreDiscoverySqlPredicate,
  mwmDiasporaPromotionSqlPredicate,
} from "../mwmCoreDiscoveryPolicy";

describe("MWM Core discovery evidence policy", () => {
  it("is disabled by default so receipt reconciliation cannot silently alter public discovery", () => {
    expect(isMwmCoreDiscoveryEnabled(undefined)).toBe(false);
    expect(isMwmCoreDiscoveryEnabled("off")).toBe(false);
    expect(mwmCoreDiscoverySqlPredicate("b.id", undefined)).toBe("TRUE");
    expect(isMwmCoreDiscoveryEligible({}, undefined)).toBe(true);
  });

  it("is enabled only by the explicit source-backed mode", () => {
    expect(isMwmCoreDiscoveryEnabled("source_backed")).toBe(true);
    expect(isMwmCoreDiscoveryEnabled("SOURCE_BACKED")).toBe(true);
    expect(isMwmCoreDiscoveryEnabled("true")).toBe(false);
  });

  it("fails closed to exactly the approved source-backed live cohort when enabled", () => {
    const predicate = mwmCoreDiscoverySqlPredicate("b.id", "source_backed");
    expect(predicate).toContain("EXISTS");
    expect(predicate).toContain("public.business_inventory_cohort_receipts");
    expect(predicate).toContain("mwm_core_receipt.business_id::text = b.id::text");
    expect(predicate).toContain(`mwm_core_receipt.cohort = '${MWM_CORE_SOURCE_BACKED_COHORT}'`);
    expect(isMwmCoreDiscoveryEligible({ mwmCoreCohort: MWM_CORE_SOURCE_BACKED_COHORT }, "source_backed")).toBe(true);
    expect(isMwmCoreDiscoveryEligible({ mwmCoreCohort: "legacy_or_unattributed_live" }, "source_backed")).toBe(false);
    expect(isMwmCoreDiscoveryEligible({}, "source_backed")).toBe(false);
  });

  it("does not infer an MWM Core cohort from names, cuisine, language, or location", () => {
    expect(isMwmCoreDiscoveryEligible({
      name: "Amina's Kitchen",
      cuisine: "Caribbean",
      city: "Philadelphia",
      ownershipDesignation: "minority-owned",
    } as unknown as { mwmCoreCohort?: string }, "source_backed")).toBe(false);
  });

  it("keeps every current public listing in the default cleanup catalog", () => {
    expect(isMwmDiasporaPromotionEnabled(undefined)).toBe(false);
    expect(isMwmDiasporaPromotionEnabled("documented_diaspora")).toBe(false);
    expect(isMwmDiasporaPromotionEnabled("all_public")).toBe(false);
    const predicate = mwmDiasporaPromotionSqlPredicate("b.id");
    expect(predicate).toBe("TRUE");
    expect(predicate).not.toContain("ownership_designations");
  });

  it("does not add an ownership predicate to the default catalog for quoted identifiers", () => {
    const predicate = mwmDiasporaPromotionSqlPredicate('"businesses"."id"');
    expect(predicate).toBe("TRUE");
  });

  it("uses completed-cohort provenance for directory discovery without assigning a map location", () => {
    const predicate = completedCohortDirectoryDiscoverySqlPredicate('"businesses"."id"');
    expect(predicate).toContain("directory_publication_provenance");
    expect(predicate).toContain("completed_cohort_directory_discovery_receipts");
    expect(predicate).toContain("source_sha256 = 'ca576aeb92b6cd0e73a7b967bf510f7e26b6a3ceb909c5511a222c25d862469a'");
    expect(predicate).toContain("outcome IN ('created', 'linked_existing')");
    expect(predicate).not.toContain("latitude");
    expect(predicate).not.toContain("longitude");
  });

  it("keeps all unarchived public profiles eligible while exact ownership filters remain separate", () => {
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Woman-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["LGBTQIA+-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Black / African American-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Vietnamese-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Guatemalan-Owned"] })).toBe(true);
  });

  it("keeps all public records available for explicit all-places expansion too", () => {
    expect(mwmDiasporaPromotionSqlPredicate("b.id", "all_public")).toBe("TRUE");
    expect(isMwmDiasporaPromotionEligible({}, "all_public")).toBe(true);
  });
});
