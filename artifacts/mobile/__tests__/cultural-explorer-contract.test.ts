import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(__dirname, path), "utf8");
}

describe("Cultural Explorer client contract", () => {
  it("uses the authenticated adapter and exposes the requested content tabs", () => {
    const explorer = source("../app/cultural-heritage.tsx");
    expect(explorer).toContain("/api/cultural-explorer");
    expect(explorer).toContain("getMemberApiHeaders");
    expect(explorer).toContain("HBCUs");
    expect(explorer).toContain("Landmarks");
    expect(explorer).toContain("Historic Districts");
    expect(explorer).toContain("Markets");
    expect(explorer).toContain("Curated Events");
    expect(explorer).toContain("Heritage Resources");
  });

  it("uses a distinct cultural-site map focus and only maps items with coordinates", () => {
    const explorer = source("../app/cultural-heritage.tsx");
    const map = source("../components/FullMapView.tsx");
    const mapTab = source("../app/(tabs)/map.tsx");
    expect(explorer).toContain("focusCulturalSiteId");
    expect(explorer).toContain("mapAction &&");
    expect(map).toContain("focusCulturalSiteId?: string");
    expect(map).toContain("getMemberApiHeaders");
    expect(map).toContain("focusSiteId || focusCulturalSiteId || !mapReady");
    expect(mapTab).toContain("focusCulturalSiteId={params.focusCulturalSiteId}");
  });
});
