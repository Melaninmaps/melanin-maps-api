import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("clean locality-first mobile map surface", () => {
  it("preserves one city, business, service, and item search while removing crowded shortcut strips", () => {
    expect(mapSource).toContain('placeholder="Search a business, service, item, or city"');
    expect(mapSource).toContain("const locality = parseMapSearchLocality(query)");
    expect(mapSource).not.toContain('placeholder="Search a city (e.g., Atlanta, GA)"');
    for (const removedLabel of ["Support filters", "Explore all", "Safety Heat", "Gatherings"]) {
      expect(mapSource).not.toContain(removedLabel);
    }
  });

  it("keeps cultural sites and physical businesses discoverable without map category chips", () => {
    expect(mapSource).toContain('pathname: "/cultural-heritage"');
    expect(mapSource).toContain('pathname: "/business/[id]"');
    expect(mapSource).toContain("openMapDirections(");
    expect(mapSource).toContain("Historical Sundown Town");
    expect(mapSource).not.toContain("showSundownHistory");
    expect(mapSource).not.toContain("CategoryPill");
  });
});
