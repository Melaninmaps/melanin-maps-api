import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native business dashboard managed-business selection", () => {
  it("uses the managed-business list and continues dashboard loading only for exactly one managed business", () => {
    const dashboard = source("../app/business-dashboard.tsx");
    const selectionGate = dashboard.indexOf("if (managedBusinesses.length !== 1)");
    const selectedBusiness = dashboard.indexOf("const managedBusiness = managedBusinesses[0]");
    const reviewsRead = dashboard.indexOf("/api/reviews?businessId=${managedBusiness.id}");

    expect(dashboard).toContain("/api/businesses/mine/managed");
    expect(dashboard).not.toMatch(/\/api\/businesses\/mine(?:`|\"|')/);
    expect(dashboard).toContain(
      "const managedBusinesses = Array.isArray(data.businesses) ? data.businesses : []",
    );
    expect(selectionGate).toBeGreaterThan(-1);
    expect(dashboard).toContain(
      "setRequiresManagedBusinessSelection(managedBusinesses.length > 1)",
    );
    expect(selectedBusiness).toBeGreaterThan(selectionGate);
    expect(reviewsRead).toBeGreaterThan(selectionGate);
  });

  it("redirects multiple managed businesses to the existing selection surface before the no-business branch, while preserving existing dashboard navigation", () => {
    const dashboard = source("../app/business-dashboard.tsx");
    const ownerSelection = source("../app/business-owner/index.tsx");
    const loadingOrSelectionGuard = dashboard.indexOf(
      "if (loading || requiresManagedBusinessSelection)",
    );
    const noBusinessRenderBranch = dashboard.indexOf(
      "if (!business)",
      loadingOrSelectionGuard,
    );

    expect(dashboard).toContain("if (requiresManagedBusinessSelection)");
    expect(dashboard).toContain('router.replace("/business-owner" as never)');
    expect(dashboard).toContain("if (loading || requiresManagedBusinessSelection)");
    expect(loadingOrSelectionGuard).toBeLessThan(noBusinessRenderBranch);
    expect(dashboard).toContain('router.push("/business-intelligence" as never)');
    expect(dashboard).toContain("No Business Listed Yet");
    expect(ownerSelection).toContain("businesses.length > 1");
    expect(ownerSelection).toContain('testID="managed-businesses-list"');
    expect(ownerSelection).toContain("Edit permitted profile fields for");
  });
});
