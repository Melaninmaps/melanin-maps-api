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

  it("keeps registration invite-only except for a one-time isolated staging administrator bootstrap", () => {
    expect(authSource).toContain("pending_tester_emails");
    expect(authSource).toContain('from "../auth/isolatedStagingAdminBootstrap.js"');
    expect(authSource).toContain("const stagingAdminBootstrap = await acquireIsolatedStagingAdminBootstrap(");
    expect(authSource).toContain('if (stagingAdminBootstrap.status === "tester_conflict")');
    expect(authSource).toContain("const authorizedStagingAdminBootstrap =");
    expect(authSource).toContain("if (!authorizedStagingAdminBootstrap && !waitlistEntry && !approvedAsTester)");
    expect(authSource).toContain("const bootstrapResult = await db.transaction(async (tx) => {");
    expect(authSource).toContain("await createSession(transactionalSessionData, tx)");
    expect(authSource).toContain("const sid = bootstrapSessionId ?? (await createSession(sessionData))");
    expect(authSource).toContain("if (!authorizedStagingAdminBootstrap) {");
    expect(authSource).toContain('code: "WAITLIST_REQUIRED"');
    expect(authSource).toContain('code: "WAITLIST_PENDING"');
  });

  it("continues to attach a pending tester entitlement and session after ordinary authorized registration", () => {
    expect(authSource).toContain("await applyPendingTesterEntitlement(user.id, user.email!)");
    expect(authSource).toContain("await createSession(sessionData)");
  });
});
