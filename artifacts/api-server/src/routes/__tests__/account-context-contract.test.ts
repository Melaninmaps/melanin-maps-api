import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const serverRoot = path.resolve(__dirname, "../../..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(serverRoot, relativePath), "utf8");

const resolver = read("src/lib/account-context.ts");
const users = read("src/routes/users.ts");
const businesses = read("src/routes/businesses.ts");
const kinfolk = read("src/routes/kinfolk.ts");

describe("member account context isolation contract", () => {
  it("lists only current approved owner or manager links and never grants browser Admin through cron", () => {
    expect(resolver).toContain("AND bol.role IN ('owner', 'manager')");
    expect(resolver).toContain("AND bol.status = 'approved'");
    expect(resolver).toContain("AND bol.revoked_at IS NULL");
    expect(resolver).toContain("canUseAdminContext: isNamedAdmin(req)");
    expect(resolver).toContain("Never let an internal CRON credential create a visible browser workspace.");
    expect(users).toContain('router.get("/users/me/account-contexts"');
    expect(users).toContain("listMemberAccountContexts(req)");
  });

  it("resolves the selected business again on each protected request", () => {
    expect(resolver).toContain('export const ACCOUNT_CONTEXT_HEADER = "x-mwm-account-context"');
    expect(resolver).toContain("AND bol.business_id = $2");
    expect(resolver).toContain("hasMatchingSelectedBusinessContext");
    expect(businesses).toContain("resolveMemberAccountContext(req)");
    expect(businesses).toContain("hasMatchingSelectedBusinessContext(accountContext, businessId)");
    expect(businesses).toContain("Selected business access is required.");
  });

  it("keeps business and Admin Kinfolk stateless and blocks personal carry-over", () => {
    expect(kinfolk).toContain("const isPersonalAccountContext = accountContext.kind === \"personal\"");
    expect(kinfolk).toContain("const sessionPersistenceAllowed = isPersonalAccountContext");
    expect(kinfolk).toContain("Business and Admin Kinfolk workspaces do not accept personal chat history.");
    expect(kinfolk).toContain("Business and Admin Kinfolk workspaces do not retain personal memories.");
    expect(kinfolk).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(kinfolk).toContain("req.user?.id && !staffAuditPolicy && isPersonalAccountContext");
    expect(kinfolk).toContain("memberMemoryEnabled && isPersonalAccountContext && req.user?.id");
    expect(kinfolk).toContain("explicitMemberMemoryEnabled && isPersonalAccountContext && req.user?.id");
    expect(kinfolk).toContain("sessionPersistenceAllowed && memoryEnabled && sessionPersistenceAvailable");
    expect(kinfolk).toContain("sessionPersistenceAllowed && !memoryEnabled && !staffAuditPolicy");
    expect(kinfolk).toContain("if (input.persistSession === false) return undefined;");
    expect(kinfolk).toContain('router.use("/kinfolk", createKinfolkAccountContextGuard());');
    expect(resolver).toContain("export function createKinfolkAccountContextGuard");
    expect(resolver).toContain("This Kinfolk control is available only in Personal workspace.");
  });

  it("does not infer an owner business from submittedById during personal chat", () => {
    const selectedWorkspaceBlock = kinfolk.slice(
      kinfolk.indexOf("let ownerBusinessContext"),
      kinfolk.indexOf("// Cultural phrases"),
    );
    expect(selectedWorkspaceBlock).toContain('if (accountContext.kind === "business")');
    expect(selectedWorkspaceBlock).toContain("--- SELECTED BUSINESS WORKSPACE ---");
    expect(selectedWorkspaceBlock).not.toContain("BUSINESS OWNER CONTEXT");
    expect(selectedWorkspaceBlock).not.toContain("businessesTable.submittedById");
  });
});
