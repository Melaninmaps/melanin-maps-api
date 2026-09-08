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
  it("pins the exact 28-address founder roster and rejects drift", () => {
    const normalized = FOUNDER_APPROVED_TESTER_EMAILS.map((email) =>
      email.trim().toLowerCase(),
    );
    const digest = createHash("sha256")
      .update(`${[...normalized].sort().join("\n")}\n`)
      .digest("hex");

    expect(normalized).toHaveLength(28);
    expect(new Set(normalized).size).toBe(28);
    expect(normalized.every((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))).toBe(true);
    expect(digest).toBe("ac56bd3b0f041d1870e4016c4233973f868e7a0dfcbf2c7725c679d3d1f29c97");
  });

  it("uses the canonical roster in startup and protected cron write paths", () => {
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

  it("skips every obsolete migration that pre-created or reset external tester accounts", () => {
    const disabled = stringSet("DISABLED_LEGACY_TESTER_ACCOUNT_MIGRATIONS");
    expect(disabled.sort()).toEqual([
      "pre_manus_tester_accounts_v1",
      "pre_manus_tester_clear_must_change_password_v1",
      "tester_accounts_restore_v1",
      "tester_batch_v2",
      "tester_moon_mayes_v1",
      "tester_password_force_reset_v1",
      "tester_universal_accounts_v1",
    ]);

    const loopGuard = startupSource.indexOf(
      "if (DISABLED_LEGACY_TESTER_ACCOUNT_MIGRATIONS.has(m.name))",
    );
    const migrationExecution = startupSource.indexOf("await pool.query(m.sql)", loopGuard);
    expect(loopGuard).toBeGreaterThan(-1);
    expect(migrationExecution).toBeGreaterThan(loopGuard);
  });

  it("retires only stale system-seeded website-test authorizations outside the roster", () => {
    expect(startupSource).toContain("DELETE FROM pending_tester_emails");
    expect(startupSource).toContain("tester_access_source = 'website_test'");
    expect(startupSource).toContain("granted_by IS NULL");
    expect(startupSource).toContain(
      "PRE_APPROVED_TESTER_EMAILS.map(e => e.toLowerCase().trim())",
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
