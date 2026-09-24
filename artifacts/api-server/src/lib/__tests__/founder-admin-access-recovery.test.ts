import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrations = readFileSync(
  new URL("../startup-migrations.ts", import.meta.url),
  "utf8",
);

describe("founder Admin access recovery", () => {
  it("recovers only the three founder-controlled accounts with an audit trail", () => {
    const start = migrations.indexOf('name: "founder_admin_access_recovery_v1"');
    const end = migrations.indexOf('name: "community_language_proposals_v1"', start);
    const recovery = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(recovery).toContain("'tlindsay428@yahoo.com'");
    expect(recovery).toContain("'tlindsay428@gmail.com'");
    expect(recovery).toContain("'tlindsay428@aol.com'");
    expect(recovery).toContain("SET role = 'admin'");
    expect(recovery).toContain("approved = true");
    expect(recovery).toContain("account_status = 'active'");
    expect(recovery).toContain("INSERT INTO admin_account_lifecycle_events");
    expect(recovery).toContain("Founder Admin access recovery");
    expect(recovery).not.toContain("FOUNDER_APPROVED_TESTER_EMAILS");
    expect(recovery).not.toContain("DELETE FROM users");
  });
});
