import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("isolated activation invitation reviewer fixture contract", () => {
  const fixture = source("../../auth/isolatedActivationInvitationReviewerFixture.ts");
  const waitlist = source("../waitlist.ts");
  const migrations = source("../../lib/startup-migrations.ts");
  const startup = source("../../index.ts");

  it("keeps the delivery fixture staging-only, exact-recipient, and default-off", () => {
    expect(fixture).toContain('RAILWAY_ENVIRONMENT_NAME === "staging"');
    expect(fixture).toContain('KINFOLK_MEMORY_STAGING_ISOLATION === "true"');
    expect(fixture).toContain('KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_ENABLED === "true"');
    expect(fixture).toContain('const RESEND_DELIVERY_TEST_INBOX = "delivered@resend.dev"');
    expect(fixture).toContain("DISPOSABLE_REVIEWER_EMAIL");
    expect(fixture).toContain("activation_invitation_reviewer_fixture_entitlements");
    expect(fixture).not.toContain("UPDATE users");
  });

  it("limits fixture authority to one synthetic approval, resend, revoke, expiry, status, and cleanup workflow", () => {
    expect(waitlist).toContain('"/internal/isolated-fixtures/activation-invitation-reviewer/grant"');
    expect(waitlist).toContain('"/internal/isolated-fixtures/activation-invitation/prepare"');
    expect(waitlist).toContain('"/internal/isolated-fixtures/activation-invitation/:id/expire"');
    expect(waitlist).toContain('"/internal/isolated-fixtures/activation-invitation/:id"');
    expect(waitlist).toContain('requireActivationInvitationDecisionReviewer(req, res, id, "approve")');
    expect(waitlist).toContain('"resend"');
    expect(waitlist).toContain('"revoke"');
    expect(waitlist).toContain("entry.is_synthetic_test = true");
    expect(waitlist).toContain("Fixture recipient is not cleanly reusable");
    expect(waitlist).toContain("Fixture has an account and requires an explicit account cleanup");
    expect(waitlist).toContain("providerReceiptRecorded");
  });

  it("provisions the entitlement before traffic only under the explicit staging flag", () => {
    expect(migrations).toContain("export async function ensureIsolatedActivationInvitationReviewerFixtureSchema");
    expect(migrations).toContain("activation_invitation_reviewer_fixture_entitlements");
    expect(migrations).toContain("REFERENCES users(id) ON DELETE CASCADE");
    expect(migrations).toContain("scope = 'isolated_staging_activation_invitation_validation'");
    expect(startup).toContain("await ensureIsolatedActivationInvitationReviewerFixtureSchema(logger);");
  });
});
