import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testerRoutes = readFileSync(
  fileURLToPath(new URL("../admin-testers.ts", import.meta.url)),
  "utf8",
);
const roster = readFileSync(
  fileURLToPath(new URL("../../constants/testerRoster.ts", import.meta.url)),
  "utf8",
);

function routeSection(start: string, end: string): string {
  const startAt = testerRoutes.indexOf(start);
  const endAt = testerRoutes.indexOf(end, startAt);
  expect(startAt).toBeGreaterThan(-1);
  expect(endAt).toBeGreaterThan(startAt);
  return testerRoutes.slice(startAt, endAt);
}

describe("founder tester roster provisioning", () => {
  const provisionRoute = routeSection(
    'router.post("/admin/testers/provision-founder-roster"',
    '// ─── POST /admin/testers/dry-run',
  );

  it("uses the fixed founder roster and requires an explicit confirmation", () => {
    expect(roster).toContain('"reinaoba06@gmail.com"');
    expect(provisionRoute).toContain("FOUNDER_APPROVED_TESTER_EMAILS");
    expect(provisionRoute).toContain("req.body?.confirmed !== true");
    expect(provisionRoute).toContain("BEGIN");
    expect(provisionRoute).toContain("COMMIT");
    expect(provisionRoute).toContain("ROLLBACK");
  });

  it("preserves existing account credentials and creates a forced-change password only when no account exists", () => {
    expect(provisionRoute).toContain("if (userId)");
    expect(provisionRoute).toContain("if (entry.tester_status !== \"active\") existingAccountsGranted++");
    expect(provisionRoute).toContain("if (!userId)");
    expect(provisionRoute).toContain("FOUNDER_TESTER_INVITE_PASSWORD_HASH");
    expect(provisionRoute).toContain("must_change_password");
    expect(provisionRoute).toContain("'tester', 'beta', 'active', 'admin_invite'");
    expect(provisionRoute).not.toContain("UPDATE users SET password_hash");
    expect(provisionRoute).not.toContain("DELETE FROM users");
  });

  it("records the tester grant in waitlist, pending entitlement, and immutable access history", () => {
    expect(provisionRoute).toContain("INSERT INTO waitlist_signups");
    expect(provisionRoute).toContain("INSERT INTO pending_tester_emails");
    expect(provisionRoute).toContain("INSERT INTO access_entitlement_events");
    expect(provisionRoute).toContain("founder_roster_provision_v1");
  });
});
