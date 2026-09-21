import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("web map essential services availability layer", () => {
  it("keeps public facilities opt-in, local, separate from recommendations, and source-labeled", () => {
    expect(mapSource).toContain('data-testid="essential-services-card"');
    expect(mapSource).toContain("/api/map/essential-services?");
    expect(mapSource).toContain('credentials: "include"');
    expect(mapSource).toContain("MAP_ESSENTIAL_SERVICE_CATEGORIES");
    expect(mapSource).toContain("essentialServiceMarkersRef");
    expect(mapSource).toContain("not an MWM recommendation");
    expect(mapSource).toContain("Source: Google Maps");
    expect(mapSource).toContain("Not an MWM listing, ownership designation, safety rating, or recommendation.");
  });

  it("preserves a direct map search over exploratory discovery controls", () => {
    expect(mapSource).toContain("setMapDiscoveryFocus(\"all\")");
    expect(mapSource).toContain("clearEssentialServices();");
    expect(mapSource).toContain("A direct request always takes precedence over an exploratory grouping");
  });
});
