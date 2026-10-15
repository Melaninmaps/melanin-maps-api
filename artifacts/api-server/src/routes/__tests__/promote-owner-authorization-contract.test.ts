import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  new URL("../promote.ts", import.meta.url),
  "utf8",
);

describe("promotion ownership authorization", () => {
  it("uses an approved, unrevoked owner relationship rather than submitter metadata", () => {
    expect(route).toContain("business_owner_links bol");
    expect(route).toContain("bol.role = 'owner'");
    expect(route).toContain("bol.status = 'approved'");
    expect(route).toContain("bol.revoked_at IS NULL");
    expect(route).toContain("Legacy `submitted_by_id` is not an ownership authorization.");
    expect(route).not.toContain("eq(businessesTable.submittedById, userId)");
  });

  it("requires a selected business when a member manages multiple businesses", () => {
    expect(route).toContain("requestedBusinessId(req)");
    expect(route).toContain(".limit(businessId ? 1 : 2)");
    expect(route).toContain('code: "BUSINESS_SELECTION_REQUIRED"');
    expect(route).toContain("const business = requireOwnedBusiness(res, selection);");
  });

  it("keeps the server eligibility gate before payment checkout", () => {
    const checkout = route.slice(
      route.indexOf('router.post("/businesses/mine/growth-tools/checkout"'),
      route.indexOf('// ─── POST /api/businesses/mine/growth-center/spotlight'),
    );
    expect(checkout).toContain("const eligibility = checkEligibility(business);");
    expect(checkout).toContain("if (!eligibility.eligible)");
    expect(checkout).toContain("Your business is not eligible for promotions.");
  });
});
