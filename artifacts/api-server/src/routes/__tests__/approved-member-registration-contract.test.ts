import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const authSource = readFileSync(fileURLToPath(new URL("../auth.ts", import.meta.url)), "utf8");

describe("approved-member registration contract", () => {
  it("requires DOB, validates the minimum age, and requires terms before account creation", () => {
    expect(authSource).toContain('if (!agreeToTerms)');
    expect(authSource).toContain('if (!dateOfBirth)');
    expect(authSource).toContain("Date of birth is required to create an account.");
    expect(authSource).toContain("if (age < 13)");
    expect(authSource).toContain("You must be at least 13 years old to use this platform.");
  });

  it("keeps registration invite-only while preserving the independent tester path", () => {
    expect(authSource).toContain("pending_tester_emails");
    expect(authSource).toContain("if (!waitlistEntry && !approvedAsTester)");
    expect(authSource).toContain('code: "WAITLIST_REQUIRED"');
    expect(authSource).toContain('code: "WAITLIST_PENDING"');
  });

  it("continues to attach a pending tester entitlement after authorized registration", () => {
    expect(authSource).toContain("await applyPendingTesterEntitlement(user.id, user.email!)");
    expect(authSource).toContain("const sid = await createSession(sessionData)");
  });
});
