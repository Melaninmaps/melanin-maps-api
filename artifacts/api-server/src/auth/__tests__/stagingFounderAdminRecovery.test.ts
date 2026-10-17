import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/protectedAdminAccess", () => ({
  isFounderOwnerEmail: (email: string) => email === "founder@example.test",
}));

import {
  mayReissueStagingFounderAdminRecovery,
  stagingFounderAdminRecoveryEligibility,
  type StagingFounderAdminRecoveryEnvironment,
} from "../stagingFounderAdminRecovery";

const isolatedRecoveryEnvironment: StagingFounderAdminRecoveryEnvironment = {
  ADMIN_EMAILS: "founder@example.test",
  KINFOLK_MEMORY_STAGING_ISOLATION: "true",
  KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "false",
  KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED: "true",
  KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_TARGET_EMAIL: "founder@example.test",
  MWM_EXPLICIT_FEATURE_RELEASE_MODE: "true",
  RAILWAY_ENVIRONMENT_NAME: "staging",
  RAILWAY_PROJECT_ID: "37ed0a9d-a280-43d5-b6ca-885f237b84ea",
  RAILWAY_SERVICE_ID: "7c02d801-6273-4e77-aea3-1db8bd86be18",
};

describe("isolated staging founder administrator recovery eligibility", () => {
  it("requires the exact isolated target, a disabled legacy bootstrap, and the one configured founder target", () => {
    expect(
      stagingFounderAdminRecoveryEligibility(
        " FOUNDER@example.test ",
        isolatedRecoveryEnvironment,
      ),
    ).toBe("eligible");
    expect(
      stagingFounderAdminRecoveryEligibility(
        undefined,
        isolatedRecoveryEnvironment,
      ),
    ).toBe("eligible");
  });

  it.each([
    [
      "wrong environment",
      { RAILWAY_ENVIRONMENT_NAME: "production" },
      "environment_not_staging",
    ],
    [
      "isolation off",
      { KINFOLK_MEMORY_STAGING_ISOLATION: "false" },
      "staging_isolation_disabled",
    ],
    [
      "broad startup writers enabled",
      { MWM_EXPLICIT_FEATURE_RELEASE_MODE: "false" },
      "feature_release_mode_disabled",
    ],
    [
      "wrong project",
      { RAILWAY_PROJECT_ID: "other-project" },
      "project_not_isolated_target",
    ],
    [
      "wrong service",
      { RAILWAY_SERVICE_ID: "other-service" },
      "service_not_isolated_target",
    ],
    [
      "legacy bootstrap enabled",
      { KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "true" },
      "bootstrap_not_disabled",
    ],
    [
      "recovery disabled",
      { KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED: "false" },
      "recovery_disabled",
    ],
    [
      "multiple targets",
      {
        KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_TARGET_EMAIL:
          "founder@example.test,other@example.test",
      },
      "target_missing_or_ambiguous",
    ],
    [
      "target omitted from admin allowlist",
      { ADMIN_EMAILS: "other@example.test" },
      "target_not_allowlisted",
    ],
  ] as const)("fails closed when %s", (_name, overrides, expected) => {
    expect(
      stagingFounderAdminRecoveryEligibility("founder@example.test", {
        ...isolatedRecoveryEnvironment,
        ...overrides,
      }),
    ).toBe(expected);
  });

  it("does not permit any caller-selected email", () => {
    expect(
      stagingFounderAdminRecoveryEligibility(
        "other@example.test",
        isolatedRecoveryEnvironment,
      ),
    ).toBe("request_not_target");
  });

  it("permits an explicitly approved reissue only for a non-redeemable or expired attempt", () => {
    const reissueEnvironment = {
      ...isolatedRecoveryEnvironment,
      KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_REISSUE_ENABLED: "true",
    };
    expect(
      mayReissueStagingFounderAdminRecovery(
        "pending_delivery",
        new Date(Date.now() + 60_000),
        reissueEnvironment,
      ),
    ).toBe(true);
    expect(
      mayReissueStagingFounderAdminRecovery(
        "failed_delivery",
        new Date(Date.now() + 60_000),
        reissueEnvironment,
      ),
    ).toBe(true);
    expect(
      mayReissueStagingFounderAdminRecovery(
        "sent",
        new Date(Date.now() + 60_000),
        reissueEnvironment,
      ),
    ).toBe(false);
    expect(
      mayReissueStagingFounderAdminRecovery(
        "sent",
        new Date(Date.now() - 60_000),
        reissueEnvironment,
      ),
    ).toBe(true);
    expect(
      mayReissueStagingFounderAdminRecovery(
        "activated",
        new Date(Date.now() - 60_000),
        reissueEnvironment,
      ),
    ).toBe(false);
    expect(
      mayReissueStagingFounderAdminRecovery(
        "failed_delivery",
        new Date(Date.now() + 60_000),
        isolatedRecoveryEnvironment,
      ),
    ).toBe(false);
  });
});
