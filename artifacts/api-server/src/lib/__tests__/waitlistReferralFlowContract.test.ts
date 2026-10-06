import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("waitlist referral flow contract", () => {
  const ledger = source("../waitlistReferralLedger.ts");
  const migrations = source("../startup-migrations.ts");
  const referralRoutes = source("../../routes/referrals.ts");
  const waitlistRoutes = source("../../routes/waitlist.ts");
  const profile = source("../../../../web/src/pages/profile.tsx");

  it("persists immutable normalized codes and exactly-one signup attribution", () => {
    expect(migrations).toContain("waitlist_referral_codes");
    expect(migrations).toContain("normalized_code VARCHAR(64) NOT NULL UNIQUE");
    expect(migrations).toContain("waitlist_referral_attributions");
    expect(migrations).toContain("referred_waitlist_signup_id VARCHAR(255) NOT NULL UNIQUE");
    expect(migrations).toContain("waitlist_referral_milestones");
    expect(migrations).toContain("status IN ('active', 'retired', 'blocked')");
  });

  it("uses a transaction and unique-index fallback for custom code saves", () => {
    expect(ledger).toContain('await client.query("BEGIN")');
    expect(ledger).toContain('await client.query("COMMIT")');
    expect(ledger).toContain('await client.query("ROLLBACK")');
    expect(ledger).toContain("ReferralCodeUnavailableError");
    expect(ledger).toContain("retired_at = NOW()");
    expect(ledger).toContain("owner_user_id = COALESCE(owner_user_id, $1)");
    expect(ledger).toContain("ON CONFLICT (referred_waitlist_signup_id) DO NOTHING");
  });

  it("issues server-owned codes after signup and credits only confirmed distinct signups", () => {
    expect(waitlistRoutes).toContain("getOrCreateWaitlistReferralProfile");
    expect(waitlistRoutes).toContain("attributeConfirmedWaitlistReferral");
    expect(waitlistRoutes).toContain("assertActiveReferralCodeForWaitlistSignup");
    expect(waitlistRoutes).toContain("referralCode: null");
    expect(waitlistRoutes).toContain("attribution?.milestoneReached");
    expect(waitlistRoutes).toContain("sendReferralMilestoneUpdate");
    expect(ledger).toContain("waitlist_referral_milestones");
    expect(ledger).toContain("milestoneOwnerEmail");
  });

  it("keeps existing referral API paths while returning aggregate confirmed counts only", () => {
    expect(referralRoutes).toContain('router.get("/referrals/my-code"');
    expect(referralRoutes).toContain('router.get("/referrals/check-code/:code"');
    expect(referralRoutes).toContain('router.put("/referrals/my-code"');
    expect(referralRoutes).toContain("getOrCreateMemberReferralProfile");
    expect(referralRoutes).toContain("confirmed waitlist signups");
  });

  it("adds profile settings feedback without changing public preview surfaces", () => {
    expect(profile).toContain('data-testid="profile-referral-code-settings"');
    expect(profile).toContain('data-testid="profile-referral-code-input"');
    expect(profile).toContain('data-testid="profile-referral-code-save"');
    expect(profile).toContain("Checking…");
    expect(profile).toContain("Available");
    expect(profile).toContain("Already taken—try another");
    expect(profile).toContain("api/referrals/check-code/");
    expect(profile).toContain("api/referrals/my-code");
  });
});
