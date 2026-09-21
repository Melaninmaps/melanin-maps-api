import { describe, expect, it } from "vitest";
import {
  isMwmDiasporaPromotionEligible,
  isMwmDiasporaPromotionEnabled,
  MWM_CORE_SOURCE_BACKED_COHORT,
  isMwmCoreDiscoveryEligible,
  isMwmCoreDiscoveryEnabled,
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

  it("uses explicit Diaspora ownership designations for default promotion", () => {
    expect(isMwmDiasporaPromotionEnabled(undefined)).toBe(true);
    expect(isMwmDiasporaPromotionEnabled("all_public")).toBe(false);
    const predicate = mwmDiasporaPromotionSqlPredicate("b.id");
    expect(predicate).toContain("b.ownership_designations");
    expect(predicate).toContain("jsonb_array_elements_text");
    expect(predicate).toContain("Black / African American-Owned");
    expect(predicate).toContain("Asian American-Owned");
    expect(predicate).not.toContain("Woman-Owned");
    expect(predicate).not.toContain("LGBTQIA+-Owned");
  });

  it("does not infer Diaspora promotion from a role-only label, name, cuisine, or location", () => {
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Woman-Owned"] })).toBe(false);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["LGBTQIA+-Owned"] })).toBe(false);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Black / African American-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Vietnamese-Owned"] })).toBe(true);
    expect(isMwmDiasporaPromotionEligible({ ownershipDesignations: ["Guatemalan-Owned"] })).toBe(true);
  });

  it("keeps all public records available only after explicit all-places expansion", () => {
    expect(mwmDiasporaPromotionSqlPredicate("b.id", "all_public")).toBe("TRUE");
    expect(isMwmDiasporaPromotionEligible({}, "all_public")).toBe(true);
  });
});
