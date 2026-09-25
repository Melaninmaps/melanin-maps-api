import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FOUNDER_APPROVED_TESTER_EMAILS } from "../constants/testerRoster";

const startupPath = fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url));
const cronPath = fileURLToPath(new URL("../routes/cron.ts", import.meta.url));
const startupSource = readFileSync(startupPath, "utf8");
const cronSource = readFileSync(cronPath, "utf8");

function stringSet(constantName: string): string[] {
  const match = startupSource.match(
    new RegExp(
      `const ${constantName} = (?:new Set\\()?\\[([\\s\\S]*?)\\n\\]\\)?;`,
    ),
  );
  expect(match, `${constantName} must remain a literal source Set`).not.toBeNull();
  return [...match![1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

describe("founder-approved tester roster source guard", () => {
  it("pins the exact 29-address founder roster and rejects drift", () => {
    const normalized = FOUNDER_APPROVED_TESTER_EMAILS.map((email) =>
      email.trim().toLowerCase(),
    );
    const digest = createHash("sha256")
      .update(`${[...normalized].sort().join("\n")}\n`)
      .digest("hex");

    expect(normalized).toHaveLength(29);
    expect(new Set(normalized).size).toBe(29);
    expect(normalized.every((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))).toBe(true);
    expect(digest).toBe("3b644cc6f4f50efeaf3f3e10a66e026d8ed406abac1a5c43bf171576d371be05");
    expect(normalized).toContain("kaylacardwell3@gmail.com");
    expect(normalized).toContain("dghaskin@gmail.com");
    expect(normalized).toContain("777lmt777@gmail.com");
  });

  it("keeps the canonical roster distinct from startup account mutations", () => {
    expect(startupSource).toContain(
      "const TESTER_EMAILS = FOUNDER_APPROVED_TESTER_EMAILS;",
    );
    expect(startupSource).toContain(
      "const PRE_APPROVED_TESTER_EMAILS = FOUNDER_APPROVED_TESTER_EMAILS;",
    );
    expect(cronSource).toContain(
      "const testerEmails = FOUNDER_APPROVED_TESTER_EMAILS;",
    );
    expect(cronSource).toContain(
      "const preApproved = FOUNDER_APPROVED_TESTER_EMAILS;",
    );
  });

  it("skips every startup migration that would create or mutate user accounts", () => {
    const disabled = stringSet("DISABLED_RELEASE_USER_MUTATION_MIGRATIONS");
    expect(disabled.sort()).toEqual([
      "ensure_apple_reviewer_account_v1",
      "ensure_manus_ai_tester_v1",
      "ensure_manus_geo_audit_v1",
      "ensure_manus_monitor_account_v1",
      "ensure_manus_tester_account_v1",
      "founder_admin_promotion",
      "pre_manus_tester_accounts_v1",
      "pre_manus_tester_clear_must_change_password_v1",
      "tester_accounts_restore_v1",
      "tester_batch_v2",
      "tester_moon_mayes_v1",
      "tester_password_force_reset_v1",
      "tester_universal_accounts_v1",
    ]);

    const loopGuard = startupSource.indexOf(
      "if (DISABLED_RELEASE_USER_MUTATION_MIGRATIONS.has(m.name))",
    );
    const migrationExecution = startupSource.indexOf("await pool.query(m.sql)", loopGuard);
    expect(loopGuard).toBeGreaterThan(-1);
    expect(migrationExecution).toBeGreaterThan(loopGuard);
  });

  it("allows only the explicit founder-approved roster recovery during startup", () => {
    const startupStart = startupSource.indexOf("export async function runStartupMigrations");
    const startupEnd = startupSource.indexOf("// ── Helper:", startupStart);
    const startupBody = startupSource.slice(startupStart, startupEnd);

    const recoveryCall = startupBody.indexOf(
      "await ensureFounderApprovedTesterAccessRecovery(log, warn)",
    );
    const seedGuard = startupBody.indexOf('process.env.ENABLE_STARTUP_SEED_GUARDS !== "true"');

    expect(recoveryCall).toBeGreaterThan(-1);
    expect(seedGuard).toBeGreaterThan(recoveryCall);
    expect(startupBody).not.toContain("() => ensureAdminAccounts(log, warn)");
    expect(startupBody).not.toContain("() => ensureTesterAccounts(log, warn)");
    expect(startupBody).not.toContain("() => ensurePendingTesterEmails(log, warn)");
    expect(startupBody).not.toContain("() => ensureLoadTestAccounts(log, warn)");
    expect(startupBody).not.toContain("() => ensureManusAuditAccounts(log, warn)");
    expect(startupBody).not.toContain("() => ensureMonitoringAccount(log, warn)");
    expect(startupBody).not.toContain("() => ensureUserHandles(log, warn)");
  });

  it("keeps automatic seed and listing writes disabled unless explicitly opted in", () => {
    const startupStart = startupSource.indexOf("export async function runStartupMigrations");
    const startupEnd = startupSource.indexOf("// ── Helper:", startupStart);
    const startupBody = startupSource.slice(startupStart, startupEnd);
    const guard = startupBody.indexOf('process.env.ENABLE_STARTUP_SEED_GUARDS !== "true"');
    const seedLoop = startupBody.indexOf("for (const [name, fn]", guard);

    expect(guard).toBeGreaterThan(-1);
    expect(seedLoop).toBeGreaterThan(guard);
    expect(startupBody).toContain(
      "Automatic startup seed guards are disabled; use reviewed publication workflows.",
    );
  });

  it("keeps internal Manus audit identities separate and load-test tagged", () => {
    const auditStart = startupSource.indexOf("async function ensureManusAuditAccounts(");
    const auditEnd = startupSource.indexOf("async function ensureBetaSafetyColumns(", auditStart);
    const auditSource = startupSource.slice(auditStart, auditEnd);

    expect(auditStart).toBeGreaterThan(-1);
    expect(auditEnd).toBeGreaterThan(auditStart);
    expect(auditSource).toContain("@mwm.audit");
    expect(auditSource).toContain("is_load_test = true");
    expect(auditSource).toContain("marketing_opt_out = true");
    expect(
      FOUNDER_APPROVED_TESTER_EMAILS.every(
        (email) => !email.endsWith("@mwm.audit") && !email.endsWith("@mappingwithmelanin.com"),
      ),
    ).toBe(true);
  });
});
