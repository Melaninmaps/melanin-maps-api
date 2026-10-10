import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("member activation invitation contract", () => {
  const invitation = source("../../auth/memberActivationInvitation.ts");
  const auth = source("../auth.ts");
  const waitlist = source("../waitlist.ts");
  const migrations = source("../../lib/startup-migrations.ts");
  const server = source("../../index.ts");
  const email = source("../../lib/email.ts");
  const webSignup = source("../../../../web/src/pages/signup.tsx");
  const mobileSignup = source("../../../../mobile/app/signup.tsx");

  it("stores only hashed, expiring, single-use activation capabilities", () => {
    expect(invitation).toContain('randomBytes(32).toString("base64url")');
    expect(invitation).toContain('createHash("sha256").update(token).digest("hex")');
    expect(invitation).toContain("MEMBER_ACTIVATION_INVITATION_TTL_MS");
    expect(invitation).toContain("status = 'activated', used_at = NOW()");
    expect(invitation).not.toContain("plaintext_token");
    expect(migrations).toContain('name: "member_activation_invitations_v1"');
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS member_activation_invitations");
    expect(migrations).toContain("token_hash CHAR(64) NOT NULL UNIQUE");
    expect(migrations).toContain("provider_receipt_fingerprint CHAR(64)");
    expect(migrations).toContain("export async function ensureMemberActivationInvitationSchema");
    expect(server).toContain("await ensureMemberActivationInvitationSchema(logger)");
    expect(server.indexOf("await ensureMemberActivationInvitationSchema(logger)")).toBeLessThan(
      server.indexOf("if (explicitFeatureReleaseMode)"),
    );
  });

  it("makes approval issuance idempotent and supports tracked resend and revocation", () => {
    expect(waitlist).toContain('priorEntry.status !== "approved"');
    expect(waitlist).toContain("issueMemberActivationInvitation(updated.email");
    expect(waitlist).toContain('router.post("/admin/waitlist/:id/invitation/resend"');
    expect(waitlist).toContain('router.post("/admin/waitlist/:id/invitation/revoke"');
    expect(waitlist).toContain("revokeMemberActivationInvitations");
    expect(waitlist).toContain("activationInvitation:");
    expect(waitlist).not.toContain("res.json({ invitation: invitation.token");
  });

  it("requires a current invitation at registration and consumes it only after account creation", () => {
    expect(auth).toContain("hasCurrentMemberActivationInvitation(cleanEmail)");
    expect(auth).toContain("validateMemberActivationInvitation(cleanEmail, activationToken)");
    expect(auth).toContain('code: "ACTIVATION_INVITATION_REQUIRED"');
    expect(auth).toContain("await consumeMemberActivationInvitation(cleanEmail, activationToken)");
    expect(auth.indexOf("await consumeMemberActivationInvitation(cleanEmail, activationToken)")).toBeGreaterThan(
      auth.indexOf("const [user] = await db"),
    );
  });

  it("delivers the capability only through secure browser or app activation paths", () => {
    expect(email).toContain("activationUrl?: string");
    expect(email).toContain("mobileActivationUrl?: string");
    expect(webSignup).toContain('get("invite")');
    expect(webSignup).toContain('params.delete("invite")');
    expect(webSignup).toContain("activationToken: activationToken || undefined");
    expect(mobileSignup).toContain("useLocalSearchParams");
    expect(mobileSignup).toContain("activationToken: activationToken || undefined");
    expect(mobileSignup).toContain("appleAvailable && !activationToken");
  });
});
