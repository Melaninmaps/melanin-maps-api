import { describe, expect, it } from "vitest";
import {
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
  capacityTestEmail,
  isCapacityTestEmail,
  parseCapacityProvisionMode,
} from "../provisionCapacityTestUsers";

describe("capacity test identity lifecycle", () => {
  it("defines exactly 200 deterministic isolated test identities", () => {
    const accounts = buildCapacityTestAccounts();
    expect(accounts).toHaveLength(CAPACITY_TEST_USER_COUNT);
    expect(accounts[0]?.email).toBe(capacityTestEmail(1));
    expect(accounts.at(-1)?.email).toBe(capacityTestEmail(200));
    expect(new Set(accounts.map((account) => account.email)).size).toBe(CAPACITY_TEST_USER_COUNT);
    expect(new Set(accounts.map((account) => account.username)).size).toBe(CAPACITY_TEST_USER_COUNT);
  });

  it("limits the namespace to capacity-test accounts only", () => {
    expect(isCapacityTestEmail("mwm-capacity-001@capacity.mwm.internal")).toBe(true);
    expect(isCapacityTestEmail("mwm-capacity-200@capacity.mwm.internal")).toBe(true);
    expect(isCapacityTestEmail("mwm-loadtest-01@loadtest.mwm.internal")).toBe(false);
    expect(isCapacityTestEmail("member@example.com")).toBe(false);
  });

  it("accepts only explicit lifecycle modes", () => {
    expect(parseCapacityProvisionMode([])).toBe("verify");
    expect(parseCapacityProvisionMode(["--mode=provision"])).toBe("provision");
    expect(parseCapacityProvisionMode(["--mode=cleanup"])).toBe("cleanup");
    expect(() => parseCapacityProvisionMode(["--mode=delete-all"])).toThrow(/Use --mode/);
  });
});
