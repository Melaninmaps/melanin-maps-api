import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mobileRoot = resolve(__dirname, "..");
const dashboard = readFileSync(
  resolve(mobileRoot, "app/business-dashboard.tsx"),
  "utf8",
);
const intelligence = readFileSync(
  resolve(mobileRoot, "app/business-intelligence.tsx"),
  "utf8",
);

describe("business intelligence selected managed-business context", () => {
  it("forwards the Dashboard's already validated business ID without introducing a default", () => {
    expect(dashboard).toContain('pathname: "/business-intelligence"');
    expect(dashboard).toContain("params: { businessId: business.id }");
    expect(dashboard).not.toContain('router.push("/business-intelligence" as never)');
  });

  it("resolves Intelligence context exclusively from a structurally valid managed-business list", () => {
    expect(intelligence).toContain("useLocalSearchParams");
    expect(intelligence).toContain("parseManagedBusinesses");
    expect(intelligence).toContain("/api/businesses/mine/managed");
    expect(intelligence).toContain("hasMalformedRequestedBusinessId");
    expect(intelligence).toContain(
      "managedBusinesses.find((candidate) => candidate.id === requestedBusinessId) ?? null",
    );
    expect(intelligence).toContain("managedBusinesses.length === 1");
    expect(intelligence).not.toContain("`${base}/api/businesses/mine`, { headers: h }");
  });

  it("clears every selected-business result and returns to Owner Home for invalid or ambiguous context", () => {
    for (const reset of [
      "setBusinessId(null)",
      "setBusinessName(null)",
      "setAnalytics(null)",
      "setReviews([])",
      "setGrowth([])",
      "setPaywalled(false)",
    ]) {
      expect(intelligence).toContain(reset);
    }
    expect(intelligence).toContain("setRequiresManagedBusinessSelection(true)");
    expect(intelligence).toContain('router.replace("/business-owner" as never)');
  });

  it("binds analytics, reviews, and growth reads to the one validated selected ID", () => {
    expect(intelligence).toContain("const selectedBusinessId = selectedBusiness.id");
    expect(intelligence).toContain(
      "/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/analytics",
    );
    expect(intelligence).toContain(
      "/api/reviews?businessId=${encodeURIComponent(selectedBusinessId)}&limit=50",
    );
    expect(intelligence).toContain(
      "/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/growth-tools",
    );
    expect(intelligence).not.toContain("/api/businesses/mine/analytics");
    expect(intelligence).not.toContain("/api/businesses/mine/growth-tools");
  });

  it("fences retries, account changes, and late responses before they can update another business", () => {
    expect(intelligence).toContain("requestGenerationRef");
    expect(intelligence).toContain("const isCurrent = () => requestGenerationRef.current === generation");
    expect(intelligence).toContain("activeBusinessIdRef.current !== selectedBusinessId");
    expect(intelligence).toContain(
      "if (isCurrent() && activeBusinessIdRef.current === selectedBusinessId) setAnalytics(nextAnalytics)",
    );
    expect(intelligence).toContain(
      "if (isCurrent() && activeBusinessIdRef.current === selectedBusinessId) setReviews(d.reviews ?? [])",
    );
    expect(intelligence).toContain("setGrowth((d.activePromotions ?? []).filter((p) => p.status === \"active\"))");
  });

  it("preserves the validated selected ID when navigating back to Dashboard or its Grow tab", () => {
    expect(intelligence).toContain('pathname: "/business-dashboard", params: { businessId }');
    const returnToDashboardUses = intelligence.match(/onPress=\{returnToDashboard\}/g) ?? [];
    expect(returnToDashboardUses).toHaveLength(4);
    expect(intelligence).not.toContain("onPress={() => router.back()}");
  });
});
