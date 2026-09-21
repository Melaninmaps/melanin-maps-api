import { describe, expect, it } from "vitest";
import {
  MWM_CORE_SOURCE_BACKED_COHORT,
  isMwmCoreDiscoveryEligible,
  isMwmCoreDiscoveryEnabled,
  mwmCoreDiscoverySqlPredicate,
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
});
