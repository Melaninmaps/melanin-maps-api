import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ownerHome = readFileSync(
  fileURLToPath(new URL("../app/business-owner/index.tsx", import.meta.url)),
  "utf8",
);

function singleBusinessSkipReadBlock(): string {
  const start = ownerHome.indexOf("if (data.businesses.length === 1) {");
  const end = ownerHome.indexOf("const needsRes", start);
  if (start < 0 || end < 0) throw new Error("Owner Home single-business skip-insights block is missing.");
  return ownerHome.slice(start, end);
}

describe("Business Owner Home canonical skip insights", () => {
  it("uses only the canonical owner-bound endpoint within the existing exactly-one managed-business guard", () => {
    const ownerRead = singleBusinessSkipReadBlock();

    expect(ownerRead).toContain("/api/businesses/mine/skip-feedback");
    expect(ownerRead).not.toContain("/api/kinfolk/skip-feedback");
    expect(ownerRead).not.toContain("managedBusiness.id");
    expect(ownerRead).not.toContain("businessId");
    expect((ownerHome.match(/\/api\/businesses\/mine\/skip-feedback/g) ?? [])).toHaveLength(1);
    expect(ownerHome).toContain('headers["Authorization"] = `Bearer ${token}`');
  });

  it("maps only canonical feedback messages and retains safe empty/non-success recovery", () => {
    const ownerRead = singleBusinessSkipReadBlock();

    expect(ownerRead).toContain("const sData = await sRes.json() as { feedback?: { message: string }[] };");
    expect(ownerRead).toContain("setSkipInsights((sData.feedback ?? []).map((feedback) => feedback.message));");
    expect(ownerRead).not.toContain("feedback.id");
    expect(ownerRead).not.toContain("createdAt");
    expect(ownerRead).toContain("if (sRes.ok) {");
    expect(ownerHome).toContain("setSkipInsights([]);");
  });

  it("preserves the collapsed-expanded message-only presentation and ten-item cap", () => {
    expect(ownerHome).toContain("skipInsights.length > 0");
    expect(ownerHome).toContain("onPress={() => setSkipExpanded((v) => !v)}");
    expect(ownerHome).toContain("skipExpanded && (");
    expect(ownerHome).toContain("skipInsights.slice(0, 10).map((msg, i) => (");
    expect(ownerHome).toContain("skipInsights.length > 10");
  });
});
