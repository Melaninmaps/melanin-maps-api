import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("website map locality-first presentation", () => {
  it("does not display business, cultural, or historical map pins without a local scope", () => {
    expect(mapSource).toContain("const exploreAllAreas = false");
    expect(mapSource).toContain("const [nearMeRadius, setNearMeRadius] = useState<number | null>(25)");
    expect(mapSource).toContain("if (!activeLocalScope) return false");
    expect(mapSource).toContain("activeLocalScope.lat");
    expect(mapSource).toContain("visibleCulturalSites");
    expect(mapSource).toContain("visibleSundownTowns");
  });

  it("keeps intentional search and heritage discovery while omitting the removed all-area shortcut", () => {
    expect(mapSource).toContain('placeholder="Search businesses, heritage, events — press Enter"');
    expect(mapSource).toContain("showSundownLayer");
    expect(mapSource).not.toContain('aria-pressed={exploreAllAreas}');
    expect(mapSource).not.toContain('"Explore all areas"');
  });
});
