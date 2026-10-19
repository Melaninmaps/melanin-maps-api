import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  new URL("../app/business-dashboard.tsx", import.meta.url),
  "utf8",
);
const intelligenceSource = readFileSync(
  new URL("../app/business-intelligence.tsx", import.meta.url),
  "utf8",
);
const ownerHomeSource = readFileSync(
  new URL("../app/business-owner/index.tsx", import.meta.url),
  "utf8",
);

const analyticsEndpoint = "/api/businesses/mine/analytics";

describe("BIZ-003 mobile analytics consumer compatibility", () => {
  it("preserves Business Dashboard success, 403, and bounded error handling", () => {
    expect(dashboardSource).toContain(analyticsEndpoint);
    expect(dashboardSource).toContain('if (res.status === 403) { setAnalyticsError("paywall"); return; }');
    expect(dashboardSource).toContain('if (!res.ok) { setAnalyticsError("error"); return; }');
    expect(dashboardSource).toContain("setAnalytics(data);");
    expect(dashboardSource).toContain("setAnalyticsError(null); void loadAnalytics();");
  });

  it("preserves Business Intelligence success, 403 paywall, and refresh recovery", () => {
    expect(intelligenceSource).toContain(analyticsEndpoint);
    expect(intelligenceSource).toContain('if (analyticsRes.value.status === 403) { setPaywalled(true); }');
    expect(intelligenceSource).toContain("else if (analyticsRes.value.ok) setAnalytics(await analyticsRes.value.json() as AnalyticsData);");
    expect(intelligenceSource).toContain("onPress={load}");
  });

  it("preserves Business Owner success metrics and bounded 403 lock recovery", () => {
    expect(ownerHomeSource).toContain(analyticsEndpoint);
    expect(ownerHomeSource).toContain("if (aRes.ok) {");
    expect(ownerHomeSource).toContain("setStats({ views: m.views30d ?? 0, saves: m.saves ?? 0, reviews: m.reviews ?? 0 });");
    expect(ownerHomeSource).toContain("else if (aRes.status === 403) {");
    expect(ownerHomeSource).toContain("setAnalyticsLocked(true);");
  });
});
