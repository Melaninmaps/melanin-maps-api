import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_OWNER_ADMIN_EMAILS,
  isFounderOwnerEmail,
  isProtectedAdminEmail,
  PROTECTED_ADMIN_EMAILS,
} from "../protectedAdminAccess";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const migrations = source("../startup-migrations.ts");
const app = source("../../app.ts");
const adminUsers = source("../../routes/admin-users.ts");
const adminTesters = source("../../routes/admin-testers.ts");
const webAdmin = source("../../../../web/src/pages/admin.tsx");

describe("founder-protected administrator access", () => {
  it("recognizes only founder owner identities and the two protected administrators", () => {
    expect(FOUNDER_OWNER_ADMIN_EMAILS).toHaveLength(3);
    expect(PROTECTED_ADMIN_EMAILS).toEqual([
      "kaylacardwell3@gmail.com",
      "bigdot6017@gmail.com",
    ]);
    expect(isFounderOwnerEmail(" TLINDSAY428@GMAIL.COM ")).toBe(true);
    expect(isFounderOwnerEmail("not-founder@example.test")).toBe(false);
    expect(isProtectedAdminEmail("KAYLACARDWELL3@GMAIL.COM")).toBe(true);
    expect(isProtectedAdminEmail("bigdot6017@gmail.com")).toBe(true);
    expect(isProtectedAdminEmail("ordinary-member@example.test")).toBe(false);
  });

  it("restores existing founder and protected accounts only and leaves credentials and member data untouched", () => {
    const start = migrations.indexOf("async function ensureProtectedAdministratorAccess(");
    const end = migrations.indexOf("async function ensureAdminAccounts(", start);
    const recovery = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(recovery).toContain("PROTECTED_ADMIN_EMAILS");
    expect(recovery).toContain("FOUNDER_OWNER_ADMIN_EMAILS");
    expect(recovery).toContain("const missingProtectedAdministrator");
    expect(recovery).toContain("const hasFounderOwner");
    expect(recovery).toContain("A protected administrator account is missing; no accounts were changed.");
    expect(recovery).toContain("role = 'admin'");
    expect(recovery).toContain("member_type = 'founding'");
    expect(recovery).toContain("tester_status = 'active'");
    expect(recovery).toContain("account_status = 'active'");
    expect(recovery).toContain("INSERT INTO admin_account_lifecycle_events");
    expect(recovery).toContain("INSERT INTO access_entitlement_events");
    expect(recovery).toContain("founder_protected_admin_access_overrides");
    expect(recovery).not.toContain("INSERT INTO users");
    expect(recovery).not.toContain("password_hash");
    expect(recovery).not.toContain("must_change_password");
    expect(recovery).not.toContain("DELETE FROM users");
  });

  it("permits revoke or restore only through a founder-owned control and persists revocation across startup", () => {
    expect(adminUsers).toContain('"/admin/protected-administrators/:id/access"');
    expect(adminUsers).toContain("isFounderOwnerRequest(req)");
    expect(adminUsers).toContain("Only the founder owner can change protected administrator access.");
    expect(adminUsers).toContain("founder_protected_admin_access_overrides");
    expect(adminUsers).toContain("DELETE FROM sessions");
    expect(adminUsers).toContain("role = 'user'");
    expect(adminUsers).toContain("role = 'admin'");
    expect(adminUsers).toContain("Use the founder-only protected administrator access control");
    expect(adminTesters).toContain("isProtectedAdminEmail(email)");
    expect(adminTesters).toContain("Use the founder-only protected administrator access control");
  });

  it("shows the protected action to founder identities only while the server remains decisive", () => {
    expect(webAdmin).toContain("FOUNDER_OWNER_ADMIN_EMAILS");
    expect(webAdmin).toContain("PROTECTED_ADMIN_EMAILS");
    expect(webAdmin).toContain("changeProtectedAdministratorAccess");
    expect(webAdmin).toContain("Revoke protected Admin");
    expect(webAdmin).toContain("Founder-controlled access");
    expect(app).toContain("protected_admin_access");
    expect(app).toContain("getProtectedAdminAccessRecoveryStatus()");
    expect(app).not.toContain("kaylacardwell3@gmail.com");
    expect(app).not.toContain("bigdot6017@gmail.com");
  });
});
