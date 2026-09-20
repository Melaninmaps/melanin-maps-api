import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("web map discovery card", () => {
  it("adds an additive nearby card without restoring the removed shortcut strip", () => {
    expect(mapSource).toContain('data-testid="map-discovery-card"');
    expect(mapSource).toContain('data-testid="map-discovery-quick-card"');
    expect(mapSource).toContain("Around you");
    expect(mapSource).toContain("Start with what you need");
    expect(mapSource).toContain("mapDiscoveryFocus");
    expect(mapSource).toContain("Choose a focus or see every nearby pin");
  });

  it("keeps grouping reversible, local, and subordinate to a direct search", () => {
    expect(mapSource).toContain('setMapDiscoveryFocus("all")');
    expect(mapSource).toContain("activeLocalScope && (");
    expect(mapSource).toContain("This grouping uses existing listing categories and tags; it does not replace a direct search.");
    expect(mapSource).toContain("A direct request always takes precedence over an exploratory grouping.");
  });
});
