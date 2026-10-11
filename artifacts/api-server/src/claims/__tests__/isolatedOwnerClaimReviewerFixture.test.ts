import { describe, expect, it } from "vitest";
import {
  isIsolatedOwnerClaimReviewerFixtureEnabled,
  parseOwnerClaimReviewerFixtureTtl,
} from "../isolatedOwnerClaimReviewerFixture";

const enabledEnvironment = {
  RAILWAY_ENVIRONMENT_NAME: "staging",
  KINFOLK_MEMORY_STAGING_ISOLATION: "true",
  KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_ENABLED: "true",
  KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_EMAIL:
    "kinfolk-safety-contact-owner-reviewer@example.test",
  KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_SECRET: "fixture-only-secret-material-at-least-32-chars",
};

describe("isolated owner claim reviewer fixture", () => {
  it("fails closed unless every staging-only gate and disposable binding is exact", () => {
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled(enabledEnvironment)).toBe(true);
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled({
      ...enabledEnvironment,
      RAILWAY_ENVIRONMENT_NAME: "production",
    })).toBe(false);
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled({
      ...enabledEnvironment,
      KINFOLK_MEMORY_STAGING_ISOLATION: "false",
    })).toBe(false);
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled({
      ...enabledEnvironment,
      KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_ENABLED: "false",
    })).toBe(false);
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled({
      ...enabledEnvironment,
      KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_EMAIL: "reviewer@example.com",
    })).toBe(false);
    expect(isIsolatedOwnerClaimReviewerFixtureEnabled({
      ...enabledEnvironment,
      KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_SECRET: "too-short",
    })).toBe(false);
  });

  it("permits only short, fixed expiry windows for disposable validation", () => {
    expect(parseOwnerClaimReviewerFixtureTtl(undefined)).toBe(900);
    for (const seconds of [30, 60, 120, 300, 900]) {
      expect(parseOwnerClaimReviewerFixtureTtl(seconds)).toBe(seconds);
    }
    for (const invalid of [0, 29, 31, 901, 45, "60", null, {}]) {
      expect(parseOwnerClaimReviewerFixtureTtl(invalid)).toBeNull();
    }
  });
});
