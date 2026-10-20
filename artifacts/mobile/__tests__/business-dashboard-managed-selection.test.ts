import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native business dashboard managed-business selection", () => {
  it("uses the authenticated managed-business list and never returns to the implicit legacy endpoint", () => {
    const dashboard = source("../app/business-dashboard.tsx");

    expect(dashboard).toContain("/api/businesses/mine/managed");
    expect(dashboard).not.toMatch(/\/api\/businesses\/mine(?:`|"|')/);
    expect(dashboard).toContain(
      "const managedBusinesses = Array.isArray(data.businesses) ? data.businesses : []",
    );
  });

  it("validates an exact requested ID before reading reviews, including when multiple businesses are managed", () => {
    const dashboard = source("../app/business-dashboard.tsx");
    const requestedSelection = dashboard.indexOf("const selectedBusiness = requestedBusinessId");
    const exactMembership = dashboard.indexOf(
      "managedBusinesses.find((candidate) => candidate.id === requestedBusinessId) ?? null",
    );
    const selectedReviewRead = dashboard.indexOf(
      "/api/reviews?businessId=${encodeURIComponent(selectedBusiness.id)}",
    );

    expect(requestedSelection).toBeGreaterThan(-1);
    expect(exactMembership).toBeGreaterThan(requestedSelection);
    expect(selectedReviewRead).toBeGreaterThan(exactMembership);
    expect(dashboard).toContain(
      "const selectedBusiness = requestedBusinessId\n          ? managedBusinesses.find((candidate) => candidate.id === requestedBusinessId) ?? null",
    );
  });

  it("falls back only for exactly one managed business and fails closed for invalid, unowned, stale, or ambiguous selection", () => {
    const dashboard = source("../app/business-dashboard.tsx");
    const selectedBusiness = dashboard.indexOf("const selectedBusiness = requestedBusinessId");
    const noSelection = dashboard.indexOf("if (!selectedBusiness)");
    const setBusiness = dashboard.indexOf("setBusiness(selectedBusiness)");

    expect(dashboard).toContain("managedBusinesses.length === 1");
    expect(dashboard).toContain("managedBusinesses[0] ?? null");
    expect(dashboard).toContain(
      "setRequiresManagedBusinessSelection(Boolean(requestedBusinessId) || managedBusinesses.length > 1)",
    );
    expect(dashboard).toContain("// A supplied stale/invalid selection never falls back to index zero.");
    expect(noSelection).toBeGreaterThan(selectedBusiness);
    expect(setBusiness).toBeGreaterThan(noSelection);
  });

  it("keeps the selection redirect guard before the no-business branch", () => {
    const dashboard = source("../app/business-dashboard.tsx");
    const redirectEffect = dashboard.indexOf("if (requiresManagedBusinessSelection) router.replace");
    const loadingOrSelectionGuard = dashboard.indexOf("if (loading || requiresManagedBusinessSelection)");
    const noBusinessRenderBranch = dashboard.indexOf("if (!business)", loadingOrSelectionGuard);

    expect(redirectEffect).toBeGreaterThan(-1);
    expect(dashboard).toContain('router.replace("/business-owner" as never)');
    expect(loadingOrSelectionGuard).toBeGreaterThan(-1);
    expect(noBusinessRenderBranch).toBeGreaterThan(loadingOrSelectionGuard);
    expect(dashboard).toContain("No Business Listed Yet");
  });

  it("retains the supplied Owner Home selection surface and selected-business navigation assertions", () => {
    const ownerSelection = source("../app/business-owner/index.tsx");

    expect(ownerSelection).toContain("businesses.length > 1");
    expect(ownerSelection).toContain('testID="managed-businesses-list"');
    expect(ownerSelection).toContain("Edit permitted profile fields for");
    expect(ownerSelection).toContain("if (data.businesses.length !== 1) return;");
    expect(ownerSelection).toContain(
      'pathname: "/business-dashboard", params: { businessId: business.id }',
    );
    expect(ownerSelection).toContain(
      "router.push(`/businesses/${encodeURIComponent(managedBusiness.id)}` as never)",
    );
  });
});
