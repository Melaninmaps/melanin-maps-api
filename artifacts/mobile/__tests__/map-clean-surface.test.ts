import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("clean locality-first mobile map surface", () => {
  it("preserves city and business search while removing crowded shortcut strips", () => {
    expect(mapSource).toContain('placeholder="Search a city (e.g., Atlanta, GA)"');
    expect(mapSource).toContain('placeholder="Search businesses, HBCUs, markets, or services"');
    for (const removedLabel of ["Support filters", "Explore all", "Safety Heat", "Gatherings"]) {
      expect(mapSource).not.toContain(removedLabel);
    }
  });

  it("keeps cultural sites and physical businesses discoverable without map category chips", () => {
    expect(mapSource).toContain('pathname: "/cultural-heritage"');
    expect(mapSource).toContain('pathname: "/business/[id]"');
    expect(mapSource).toContain("nearby sundown-town history");
    expect(mapSource).toContain("showSundownHistory");
    expect(mapSource).not.toContain("CategoryPill");
  });
});
