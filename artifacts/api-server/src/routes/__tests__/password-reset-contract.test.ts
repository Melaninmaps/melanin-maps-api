import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const emailAuthSource = source("../auth.ts");
const phoneAuthSource = source("../phone-auth.ts");
const emailSource = source("../../lib/email.ts");
const webForgotSource = source("../../../../web/src/pages/forgot-password.tsx");
const webResetSource = source("../../../../web/src/pages/reset-password.tsx");
const mobileForgotSource = source("../../../../mobile/app/forgot-password.tsx");

describe("password reset contracts", () => {
  it("keeps email reset codes hashed, short-lived, single-use, and clears lockout after a valid reset", () => {
    const section = emailAuthSource.slice(
      emailAuthSource.indexOf('router.post("/auth/forgot-password"'),
      emailAuthSource.indexOf('// ─── POST /auth/apple'),
    );
    expect(section).toContain('crypto.createHash("sha256").update(code).digest("hex")');
    expect(section).toContain("15 * 60 * 1000");
    expect(section).toContain("Invalid or expired reset code.");
    expect(section).toContain("emailVerificationToken: null");
    expect(section).toContain("emailVerificationExpires: null");
    expect(section).toContain("failedLoginAttempts: 0");
    expect(section).toContain("lockedUntil: null");
  });

  it("allows phone reset only for an already verified phone and requires Twilio verification in production", () => {
    const section = phoneAuthSource.slice(
      phoneAuthSource.indexOf('router.post("/auth/phone/forgot-password/send"'),
      phoneAuthSource.indexOf("// GET /auth/phone/check"),
    );
    expect(section).toContain("!user || !user.phoneVerified");
    expect(section).toContain("verificationChecks.create");
    expect(section).toContain("check.status !== \"approved\"");
    expect(section).toContain("passwordHash");
    expect(section).toContain("mustChangePassword: false");
    expect(section).toContain("failedLoginAttempts: 0");
    expect(section).toContain("lockedUntil: null");
    expect(section).toContain("!IS_PRODUCTION && normalized === TEST_PHONE");
  });

  it("does not embed email reset credentials in email links or new web navigation URLs", () => {
    expect(emailSource).toContain('const webLink = `${frontendBase}/forgot-password`;');
    expect(emailSource).toContain('const appDeepLink = "mappingwithmelanin://forgot-password";');
    expect(emailSource).not.toContain("reset-password?email=${encodedEmail}&code=${code}");
    expect(webForgotSource).toContain("sessionStorage.setItem(");
    expect(webForgotSource).toContain('navigate("/reset-password")');
    expect(webForgotSource).not.toContain("navigate(`/reset-password?${identity}&code=");
    expect(webResetSource).toContain("window.history.replaceState({}, \"\", \"/reset-password\")");
  });

  it("wires email and verified-phone reset controls on web and mobile to the matching server endpoints", () => {
    for (const clientSource of [webForgotSource, mobileForgotSource]) {
      expect(clientSource).toContain("/api/auth/forgot-password");
      expect(clientSource).toContain("/api/auth/phone/forgot-password/send");
    }
    for (const clientSource of [webResetSource, mobileForgotSource]) {
      expect(clientSource).toContain("/api/auth/reset-password");
      expect(clientSource).toContain("/api/auth/phone/reset-password");
    }
  });
});
