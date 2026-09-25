import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_APPROVED_TESTER_EMAILS,
  FOUNDER_TESTER_INVITE_PASSWORD_HASH,
} from "../../constants/testerRoster";

const migrations = readFileSync(
  new URL("../startup-migrations.ts", import.meta.url),
  "utf8",
);

function section(start: string, end: string): string {
  const startAt = migrations.indexOf(start);
  const endAt = migrations.indexOf(end, startAt);
  expect(startAt).toBeGreaterThan(-1);
  expect(endAt).toBeGreaterThan(startAt);
  return migrations.slice(startAt, endAt);
}

describe("founder-approved tester access recovery", () => {
  const recovery = section(
    "async function ensureFounderApprovedTesterAccessRecovery(",
    "async function ensureAdminAccounts(",
  );

  it("uses only the fixed founder roster, including the reported approved testers", () => {
    expect(FOUNDER_APPROVED_TESTER_EMAILS).toHaveLength(29);
    expect(FOUNDER_APPROVED_TESTER_EMAILS).toContain("kaylacardwell3@gmail.com");
    expect(FOUNDER_APPROVED_TESTER_EMAILS).toContain("dghaskin@gmail.com");
    expect(FOUNDER_APPROVED_TESTER_EMAILS).toContain("777lmt777@gmail.com");
    expect(recovery).toContain("FOUNDER_APPROVED_TESTER_EMAILS.map");
    expect(recovery).toContain("founder_approved_tester_access_recovery_v1");
  });

  it("repairs existing roster accounts without changing credentials or member data", () => {
    const existingStart = recovery.indexOf("const updatedExisting");
    const existingEnd = recovery.indexOf("const createdMissing", existingStart);
    const existingRepair = recovery.slice(existingStart, existingEnd);

    expect(existingStart).toBeGreaterThan(-1);
    expect(existingEnd).toBeGreaterThan(existingStart);
    expect(existingRepair).toContain("approved = TRUE");
    expect(existingRepair).toContain("account_status = 'active'");
    expect(existingRepair).toContain("tester_status = 'active'");
    expect(existingRepair).toContain("testing_entitlement_ends_at = NULL");
    expect(existingRepair).toContain("CASE WHEN u.role = 'user' THEN 'tester' ELSE u.role END");
    expect(existingRepair).not.toContain("password_hash");
    expect(existingRepair).not.toContain("must_change_password");
    expect(existingRepair).not.toContain("INSERT INTO users");
    expect(existingRepair).not.toContain("DELETE FROM users");
  });

  it("provisions a one-time password only for a fixed-roster email with no account", () => {
    const missingStart = recovery.indexOf("const createdMissing");
    const missingEnd = recovery.indexOf("await client.query(\n      `INSERT INTO waitlist_signups", missingStart);
    const missingProvision = recovery.slice(missingStart, missingEnd);

    expect(missingStart).toBeGreaterThan(-1);
    expect(missingEnd).toBeGreaterThan(missingStart);
    expect(missingProvision).toContain("INSERT INTO users");
    expect(missingProvision).toContain("FOUNDER_TESTER_INVITE_PASSWORD_HASH");
    expect(missingProvision).toContain("must_change_password");
    expect(missingProvision).toContain("WHERE NOT EXISTS");
    expect(FOUNDER_TESTER_INVITE_PASSWORD_HASH.startsWith("$2")).toBe(true);
  });

  it("writes approved waitlist, tester entitlement, and immutable audit records without deletion", () => {
    expect(recovery).toContain("INSERT INTO waitlist_signups");
    expect(recovery).toContain("INSERT INTO pending_tester_emails");
    expect(recovery).toContain("INSERT INTO access_entitlement_events");
    expect(recovery).toContain("'granted'");
    expect(recovery).not.toContain("DELETE FROM");
  });

  it("runs before the production seed guard so locked-out approved testers can recover", () => {
    const startupStart = migrations.indexOf("export async function runStartupMigrations");
    const startupBody = migrations.slice(startupStart);
    const recoveryCall = startupBody.indexOf(
      "await ensureFounderApprovedTesterAccessRecovery(log, warn)",
    );
    const seedGuard = startupBody.indexOf('process.env.ENABLE_STARTUP_SEED_GUARDS !== "true"');

    expect(recoveryCall).toBeGreaterThan(-1);
    expect(seedGuard).toBeGreaterThan(recoveryCall);
  });
});
