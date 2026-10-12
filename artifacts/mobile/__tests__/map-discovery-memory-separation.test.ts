import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const map = readFileSync(new URL("../components/FullMapView.tsx", import.meta.url), "utf8");
const discovery = readFileSync(new URL("../app/(tabs)/index.tsx", import.meta.url), "utf8");
const kinfolk = readFileSync(new URL("../../api-server/src/routes/kinfolk.ts", import.meta.url), "utf8");

describe("Map and Discovery stay separate from Kinfolk memory", () => {
  it("keeps consented ownership preferences available to Kinfolk only", () => {
    expect(kinfolk).toContain("preferredOwnershipTypes: canonicalOwnershipTypes");
    expect(kinfolk).toContain("privateMemoryUseDecision.shouldApply");
  });

  it("does not inject saved Kinfolk ownership preferences into standalone Map requests", () => {
    expect(map).toContain("const designationIds: string[] = [];");
    expect(map).toContain("supportScope: undefined,");
    expect(map).toContain("Kinfolk memory and preferences stay inside");
    expect(map).not.toContain("memberPreferences.preferredOwnershipTypes");
  });

  it("does not inject or rank standalone Discovery results by saved Kinfolk preferences", () => {
    expect(discovery).not.toContain("auto-apply ownership types");
    expect(discovery).toContain("designations: filters.ownershipTypes,");
    expect(discovery).toContain("supportScope: supportScopeOverride ?? undefined,");
    expect(discovery).toContain("Kinfolk preferences never rank standalone browse results.");
  });

  it("keeps visible, member-controlled ownership filters reversible in Discovery", () => {
    expect(discovery).toContain("ownershipTypes: [],");
    expect(discovery).toContain("<ScoreFilterPanel");
    expect(discovery).toContain("ownershipTypes: [] })); setPrefsBannerDismissed(true);");
  });
});
