import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const recovery = source("../../auth/stagingFounderAdminRecovery.ts");
const authRoute = source("../auth.ts");
const index = source("../../index.ts");

describe("staging founder administrator recovery source contract", () => {
  it("is a separate default-off flow and keeps the legacy bootstrap disabled", () => {
    expect(recovery).toContain(
      "KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED",
    );
    expect(recovery).toContain(
      'KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED !== "false"',
    );
    expect(recovery).toContain("RECOVERY_ADVISORY_LOCK");
    expect(recovery).not.toContain("acquireIsolatedStagingAdminBootstrap");
    expect(recovery).not.toContain("memberActivationInvitation");
  });

  it("requires exact isolated Railway target predicates and never accepts a browser-selected role or tester state", () => {
    expect(recovery).toContain("STAGING_PROJECT_ID");
    expect(recovery).toContain("STAGING_SERVICE_ID");
    expect(recovery).toContain("KINFOLK_MEMORY_STAGING_ISOLATION");
    expect(recovery).toContain("isFounderOwnerEmail(target)");
    expect(recovery).toContain('role: "admin"');
    expect(recovery).toContain('testerStatus: "inactive"');
    expect(recovery).not.toContain("input.role");
    expect(recovery).not.toContain("input.tester");
  });

  it("uses a hashed, one-time, seven-day capability and append-only recovery audit ledger", () => {
    expect(recovery).toContain("randomBytes(32)");
    expect(recovery).toContain('createHash("sha256")');
    expect(recovery).toContain("RECOVERY_TTL_MS");
    expect(recovery).toContain('state !== "sent"');
    expect(recovery).toContain(
      "mwm_reject_staging_founder_recovery_event_mutation",
    );
    expect(recovery).toContain("recoveryActivationUrl(token)");
  });

  it("serializes completion invariants explicitly and keeps their client response generic", () => {
    const completion = recovery.slice(
      recovery.indexOf(
        "export async function completeStagingFounderAdminRecovery",
      ),
      recovery.indexOf("const referralCode"),
    );
    expect(completion).not.toContain("Promise.all");
    expect(completion.indexOf("const existingUser = await tx")).toBeGreaterThan(
      -1,
    );
    expect(
      completion.indexOf("const historicalAdminCount = await tx.execute"),
    ).toBeGreaterThan(completion.indexOf("const existingUser = await tx"));
    expect(
      completion.indexOf("const pendingTester = await tx.execute"),
    ).toBeGreaterThan(
      completion.indexOf("const historicalAdminCount = await tx.execute"),
    );
    expect(completion).toContain('return { status: "not_completed" } as const');
  });

  it("can supersede only a non-redeemable or expired recovery attempt under a second explicit flag", () => {
    expect(recovery).toContain(
      "KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_REISSUE_ENABLED",
    );
    expect(recovery).toContain("mayReissueStagingFounderAdminRecovery");
    expect(recovery).toContain("is_current = FALSE");
    expect(recovery).toContain("'superseded'");
    expect(recovery).toContain("WHERE is_current = TRUE");
  });

  it("completes recovery before ordinary bootstrap, waitlist, and tester paths and returns immediately", () => {
    const recoveryCall = authRoute.indexOf(
      "completeStagingFounderAdminRecovery",
    );
    const bootstrapCall = authRoute.indexOf(
      "acquireIsolatedStagingAdminBootstrap(",
    );
    const testerAttach = authRoute.lastIndexOf(
      "applyPendingTesterEntitlement(user.id",
    );
    expect(recoveryCall).toBeGreaterThan(-1);
    expect(bootstrapCall).toBeGreaterThan(recoveryCall);
    expect(testerAttach).toBeGreaterThan(bootstrapCall);
    expect(authRoute.slice(recoveryCall, bootstrapCall)).toContain("return;");
  });

  it("does not create the schema or send delivery unless the separate recovery flag is fully eligible", () => {
    expect(index).toContain("ensureStagingFounderAdminRecoverySchema");
    expect(index).toContain("issueStagingFounderAdminRecovery");
    expect(recovery).toContain(
      'environment.KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED !== "true"',
    );
  });
});
