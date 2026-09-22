import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("mobile map discovery card", () => {
  it("adds an explicit nearby discovery card while preserving one map search", () => {
    expect(mapSource).toContain('accessibilityLabel="Around you map discovery"');
    expect(mapSource).toContain("Around you");
    expect(mapSource).toContain("mapDiscoveryRadius");
    expect(mapSource).toContain("focusedMappedBusinesses.map");
    expect(mapSource).toContain('placeholder="Search a business, service, item, or city"');
    expect(mapSource).toContain("const locality = parseMapSearchLocality(query)");
    expect(mapSource).toContain("if (locality?.state)");
    expect(mapSource).not.toContain('placeholder="Search a city (e.g., Atlanta, GA)"');
  });

  it("explains an active grouping and keeps it reversible", () => {
    expect(mapSource).toContain('setMapDiscoveryFocus("all")');
    expect(mapSource).toContain("because you chose it");
    expect(mapSource).toContain("direct search stays in charge");
    expect(mapSource).toContain("matchesMapDiscoveryFocus");
  });

  it("keeps controls reachable on tablet and Chromebook map surfaces", () => {
    expect(mapSource).toContain("const isWideMapSurface = containerSize.w >= 720");
    expect(mapSource).toContain("wideMapOverlay");
    expect(mapSource).toContain("width: 440");
    expect(mapSource).toContain("maxWidth: \"100%\"");
  });

  it("retains the restaurant card after a business-pin tap and links to directions and its MWM page", () => {
    expect(mapSource).toContain("markerPressInFlightRef");
    expect(mapSource).toContain("if (markerPressInFlightRef.current)");
    expect(mapSource).toContain("setSelectedBusiness(biz)");
    expect(mapSource).toContain('pathname: "/business/[id]"');
    expect(mapSource).toContain("openMapDirections(");
    expect(mapSource).toContain("Directions");
    expect(mapSource).toContain("View Business");
  });

  it("keeps historical sundown-town records out of the persistent map while retaining other travel data", () => {
    expect(mapSource).toContain('site.heritageCategory === "Historical Sundown Town"');
    expect(mapSource).not.toContain("showSundownHistory");
    expect(mapSource).not.toContain("Toggle nearby historical sundown-town context");
  });
});
