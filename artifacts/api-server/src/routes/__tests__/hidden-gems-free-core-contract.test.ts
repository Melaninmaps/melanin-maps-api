import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../hidden-gems.ts", import.meta.url)), "utf8");

function routeBlock(start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return source.slice(from, to);
}

describe("Hidden Gems free-core list contract", () => {
  const list = routeBlock('router.get("/", async (req: Request, res: Response) => {', "// ── POST /hidden-gems/admin/");

  it("keeps the unauthenticated locked response exact while allowing every authenticated member into the existing list path", () => {
    expect(list).toContain("if (!req.user?.id)");
    expect(list).toContain('res.json({ locked: true, lockedReason: "auth_required", gems: [] });');
    expect(source).not.toContain("getUserTier");
    expect(source).not.toContain("PAID_TIERS");
    expect(list).not.toContain("getUserTier");
    expect(list).not.toContain("PAID_TIERS");
    expect(list).not.toContain('lockedReason: "paid_required"');
    expect(list).toContain("res.json({ locked: false, gems: await attachEligibleBusinessImages(pool, gems) });");
  });

  it("retains active-public list eligibility, filters, finite limit, selected fields, nomination ordering, and eligible images", () => {
    expect(list).toContain("isNotNull(businessesTable.hiddenGemLabel)");
    expect(list).toContain("gt(businessesTable.hiddenGemExpiresAt, now)");
    expect(list).toContain("if (city)");
    expect(list).toContain("if (state)");
    expect(list).toContain("if (category)");
    expect(list).toContain('const limit = Math.min(parseInt(limitStr ?? "12", 10), 50);');
    expect(list).toContain("hiddenGemNominations: businessesTable.hiddenGemNominations");
    expect(list).toContain("hiddenGemExpiresAt: businessesTable.hiddenGemExpiresAt");
    expect(list).toContain(".orderBy(sql`${businessesTable.hiddenGemNominations} DESC`)");
    expect(list).toContain("attachEligibleBusinessImages(pool, gems)");
  });

  it("leaves nomination, status, and admin award/revoke routes under their existing protections", () => {
    const nominate = routeBlock('router.post("/:businessId/nominate"', "// ── GET /hidden-gems/:businessId/status");
    const status = routeBlock('router.get("/:businessId/status"', "// ── GET /hidden-gems (list active gems");
    const award = routeBlock('router.post("/admin/:businessId/award"', "// ── POST /hidden-gems/admin/:businessId/revoke");
    const revoke = routeBlock('router.post("/admin/:businessId/revoke"', "export default router;");

    expect(nominate).toContain("if (!req.user?.id)");
    expect(nominate).toContain('code: "ALREADY_NOMINATED"');
    expect(status).toContain("hasNominated");
    expect(status).toContain("nextThreshold: AUTO_AWARD_MIN_NOMINATIONS");
    expect(award).toContain("if (!isAdmin(req))");
    expect(revoke).toContain("if (!isAdmin(req))");
  });
});
