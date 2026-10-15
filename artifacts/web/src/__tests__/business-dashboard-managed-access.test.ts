import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(
  new URL("../pages/business-dashboard.tsx", import.meta.url),
  "utf8",
);

describe("Business Dashboard multi-business access", () => {
  it("uses the explicit managed-business list rather than the legacy ambiguous endpoint", () => {
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/businesses/mine/managed`)');
    expect(dashboard).toContain("Array.isArray(d.businesses)");
    expect(dashboard).toContain("The dashboard is explicitly multi-business.");
    expect(dashboard).not.toContain('api/businesses/mine`, { credentials: "include" }');
  });

  it("does not mistake a revalidated auth response for a signed-out owner", () => {
    expect(dashboard).toContain('cache: "no-store"');
    expect(dashboard).toContain("const [authLoading, setAuthLoading] = useState(true);");
    expect(dashboard).toContain("if (authLoading) {");
    expect(dashboard).toContain(".then((r) => (r.ok ? r.json() : null))");
  });

  it("binds promotions and profile editing to the selected authorized business", () => {
    expect(dashboard).toContain("requestedBusinessId");
    expect(dashboard).toContain("businessId=${encodeURIComponent(selectedId)}");
    expect(dashboard).toContain("body: JSON.stringify({ type, businessId: selectedId })");
    expect(dashboard).toContain("<ManagedBusinessProfileEditor");
    expect(dashboard).not.toContain("/for-business-owners?claim=${selected.id}");
  });

  it("does not offer checkout to listings the policy marks ineligible", () => {
    expect(dashboard).toContain("Promotions are unavailable for this listing");
    expect(dashboard).toContain("!growthData.eligibility.eligible");
    expect(dashboard).toContain("!selectedId || !growthData?.eligibility.eligible");
    expect(dashboard).toContain("Verification complete");
  });
});
