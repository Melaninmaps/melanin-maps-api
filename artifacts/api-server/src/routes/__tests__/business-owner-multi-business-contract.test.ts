import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessRoutes = readFileSync(
  new URL("../businesses.ts", import.meta.url),
  "utf8",
);

function managedBusinessRoute(): string {
  const start = businessRoutes.indexOf('router.get("/businesses/mine/managed"');
  const selectedBusinessRead = businessRoutes.indexOf('router.get("/businesses/mine/managed/:businessId"', start);
  return businessRoutes.slice(start, selectedBusinessRead);
}

describe("owner-scoped managed business read contract", () => {
  it("lists every approved, unrevoked owner relationship without mutations", () => {
    const route = managedBusinessRoute();

    expect(route).toContain('router.get("/businesses/mine/managed"');
    expect(route).toContain(".where(approvedOwnerPredicate(String(userId)))");
    expect(route).toContain(".orderBy(asc(businessesTable.name), asc(businessesTable.id))");
    expect(route).toContain("res.json({ businesses });");
    expect(route).not.toContain(".limit(");
    expect(route).not.toMatch(/\.(?:insert|update|delete)\(/);

    expect(businessRoutes).toContain("bol.role = 'owner'");
    expect(businessRoutes).toContain("bol.status = 'approved'");
    expect(businessRoutes).toContain("bol.revoked_at IS NULL");
  });

  it("preserves the legacy single-business read for existing business-specific flows", () => {
    const legacyRead = businessRoutes.slice(
      businessRoutes.indexOf('router.get("/businesses/mine",'),
      businessRoutes.indexOf('router.patch("/businesses/mine/profile"'),
    );

    expect(legacyRead).toContain("resolveLegacySingleManagedBusiness(String(userId))");
    expect(legacyRead).toContain('code: "BUSINESS_SELECTION_REQUIRED"');
    expect(legacyRead).toContain('selection.kind === "selected" ? selection.business : null');
  });

  it("never lets a legacy profile mutation choose one business from multiple approved links", () => {
    const profilePatch = businessRoutes.slice(
      businessRoutes.indexOf('router.patch("/businesses/mine/profile"'),
      businessRoutes.indexOf('router.post(\n  "/businesses/mine/photos"'),
    );

    expect(businessRoutes).toContain("async function resolveLegacySingleManagedBusiness");
    expect(businessRoutes).toContain(".limit(2)");
    expect(profilePatch).toContain('code: "BUSINESS_SELECTION_REQUIRED"');
    expect(profilePatch).toContain("eq(businessesTable.id, selection.business.id)");
    expect(profilePatch).toContain("approvedOwnerPredicate(String(userId))");
  });

  it("requires an explicit approved business ID for selected profile reads and ordinary profile edits", () => {
    const selectedRead = businessRoutes.slice(
      businessRoutes.indexOf('router.get("/businesses/mine/managed/:businessId"'),
      businessRoutes.indexOf('router.patch("/businesses/mine/managed/:businessId/profile"'),
    );
    const selectedPatch = businessRoutes.slice(
      businessRoutes.indexOf('router.patch("/businesses/mine/managed/:businessId/profile"'),
      businessRoutes.indexOf('router.get("/businesses/mine",'),
    );

    expect(selectedRead).toContain('eq(businessesTable.id, businessId)');
    expect(selectedRead).toContain('approvedOwnerPredicate(String(userId))');
    expect(selectedPatch).toContain('eq(businessesTable.id, businessId)');
    expect(selectedPatch).toContain('approvedOwnerPredicate(String(userId))');
    expect(selectedPatch).toContain('res.status(404).json({ error: "Managed business not found." })');
    expect(selectedPatch).not.toContain("listingStatus");
    expect(selectedPatch).not.toContain("ownershipDesignations");
    expect(selectedPatch).not.toContain("latitude");
  });
});
