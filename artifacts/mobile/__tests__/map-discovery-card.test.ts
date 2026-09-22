import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("mobile map discovery card", () => {
  it("adds an explicit nearby discovery card while preserving map search", () => {
    expect(mapSource).toContain('accessibilityLabel="Around you map discovery"');
    expect(mapSource).toContain("Around you");
    expect(mapSource).toContain("mapDiscoveryRadius");
    expect(mapSource).toContain("focusedMappedBusinesses.map");
    expect(mapSource).toContain('placeholder="Search businesses, HBCUs, markets, or services"');
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

  it("retains the restaurant card after a business-pin tap and links to its MWM page", () => {
    expect(mapSource).toContain("markerPressInFlightRef");
    expect(mapSource).toContain("if (markerPressInFlightRef.current)");
    expect(mapSource).toContain("setSelectedBusiness(biz)");
    expect(mapSource).toContain('pathname: "/business/[id]"');
    expect(mapSource).toContain("View Business");
  });
});
