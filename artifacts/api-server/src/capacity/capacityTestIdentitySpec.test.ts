import { describe, expect, it } from "vitest";
import {
  CAPACITY_TEST_CLEANUP_GUARD,
  CAPACITY_TEST_PROVISION_GUARD,
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
  capacityTestEmail,
  isBcryptPasswordHash,
  isCapacityTestCleanupEnabled,
  isCapacityTestEmail,
  isCapacityTestProvisionEnabled,
} from "./capacityTestIdentitySpec";

const BCRYPT_12_HASH = "$2b$12$lh9y6/CoZwR57kjmd5RQ7.oB.of6YSL48XQ9RVHiXycxfz4Gs23zC";

describe("capacity test identity specification", () => {
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

  it("requires an exact mutually exclusive one-time operation guard", () => {
    expect(isBcryptPasswordHash(BCRYPT_12_HASH)).toBe(true);
    expect(isCapacityTestProvisionEnabled({
      CAPACITY_TEST_IDENTITY_WRITE_APPROVED: CAPACITY_TEST_PROVISION_GUARD,
      CAPACITY_TEST_PASSWORD_HASH: BCRYPT_12_HASH,
    })).toBe(true);
    expect(isCapacityTestProvisionEnabled({
      CAPACITY_TEST_IDENTITY_WRITE_APPROVED: CAPACITY_TEST_PROVISION_GUARD,
    })).toBe(false);
    expect(isCapacityTestCleanupEnabled({
      CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED: CAPACITY_TEST_CLEANUP_GUARD,
    })).toBe(true);
    expect(isCapacityTestCleanupEnabled({
      CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED: CAPACITY_TEST_CLEANUP_GUARD,
      CAPACITY_TEST_IDENTITY_WRITE_APPROVED: CAPACITY_TEST_PROVISION_GUARD,
    })).toBe(false);
  });
});
