import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("website map locality-first presentation", () => {
  it("does not display business, cultural, or historical map pins without a local scope", () => {
    expect(mapSource).toContain("const [exploreAllAreas, setExploreAllAreas] = useState(false)");
    expect(mapSource).toContain("const [nearMeRadius, setNearMeRadius] = useState<number | null>(25)");
    expect(mapSource).toContain("if (!activeLocalScope && !exploreAllAreas)");
    expect(mapSource).toContain("map: null,");
    expect(mapSource).toContain("Boolean(activeLocalScope || exploreAllAreas)");
    expect(mapSource).toContain("visibleCulturalSites");
    expect(mapSource).toContain("visibleSundownTowns");
  });

  it("keeps a deliberate all-area control instead of removing travel and heritage discovery", () => {
    expect(mapSource).toContain('aria-pressed={exploreAllAreas}');
    expect(mapSource).toContain('"Explore all areas"');
    expect(mapSource).toContain('"Show nearby"');
    expect(mapSource).toContain("Use “Explore all areas” only to plan farther away.");
  });
});
