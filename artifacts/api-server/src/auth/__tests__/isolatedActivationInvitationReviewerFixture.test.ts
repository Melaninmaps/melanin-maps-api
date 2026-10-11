import { describe, expect, it } from "vitest";
import {
  configuredActivationDeliveryTestInbox,
  isIsolatedActivationInvitationReviewerFixtureEnabled,
  parseActivationInvitationReviewerFixtureTtl,
} from "../isolatedActivationInvitationReviewerFixture";

const enabled = {
  RAILWAY_ENVIRONMENT_NAME: "staging",
  KINFOLK_MEMORY_STAGING_ISOLATION: "true",
  KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_ENABLED: "true",
  KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_EMAIL:
    "kinfolk-safety-contact-activation-fixture@example.test",
  KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_SECRET: "a".repeat(32),
  KINFOLK_ACTIVATION_INVITATION_REVIEWER_TEST_INBOX: "delivered@resend.dev",
};

describe("isolated activation invitation reviewer fixture", () => {
  it("requires exact staging isolation, a disposable reviewer, a secret, and Resend's non-human delivery inbox", () => {
    expect(isIsolatedActivationInvitationReviewerFixtureEnabled(enabled)).toBe(true);
    expect(configuredActivationDeliveryTestInbox(enabled)).toBe("delivered@resend.dev");
    expect(isIsolatedActivationInvitationReviewerFixtureEnabled({
      ...enabled,
      RAILWAY_ENVIRONMENT_NAME: "production",
    })).toBe(false);
    expect(isIsolatedActivationInvitationReviewerFixtureEnabled({
      ...enabled,
      KINFOLK_MEMORY_STAGING_ISOLATION: "false",
    })).toBe(false);
    expect(isIsolatedActivationInvitationReviewerFixtureEnabled({
      ...enabled,
      KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_EMAIL: "member@example.test",
    })).toBe(false);
    expect(isIsolatedActivationInvitationReviewerFixtureEnabled({
      ...enabled,
      KINFOLK_ACTIVATION_INVITATION_REVIEWER_TEST_INBOX: "person@example.com",
    })).toBe(false);
  });

  it("limits review entitlements to bounded expiry values", () => {
    expect(parseActivationInvitationReviewerFixtureTtl(undefined)).toBe(300);
    expect(parseActivationInvitationReviewerFixtureTtl(30)).toBe(30);
    expect(parseActivationInvitationReviewerFixtureTtl(900)).toBe(900);
    expect(parseActivationInvitationReviewerFixtureTtl(31)).toBeNull();
    expect(parseActivationInvitationReviewerFixtureTtl("300")).toBeNull();
  });
});
