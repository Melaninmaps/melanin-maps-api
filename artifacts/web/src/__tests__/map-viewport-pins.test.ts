import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(new URL("../pages/map.tsx", import.meta.url), "utf8");

describe("web map viewport pin retrieval", () => {
  it("loads verified business pin pages for every map viewport after idle debounce", () => {
    expect(mapSource).toContain("const loadViewportPins = useCallback");
    expect(mapSource).toContain("Verified business pins are public map data");
    expect(mapSource).toContain('g.event.addListener(map, "idle", schedule)');
    expect(mapSource).toContain("south: String(south), west: String(west), north: String(north), east: String(east)");
    expect(mapSource).toContain("for (let page = 0; page < 32; page += 1)");
    expect(mapSource).toContain("pins.push(...(Array.isArray(payload.pins) ? payload.pins : []));");
  });

  it("clusters default viewport pins before a member searches or shares a location", () => {
    expect(mapSource).toContain("const markerBusinesses = businessSearchActive || isDiscoveryFilterActive");
    expect(mapSource).toContain("const showBiz = !localSearchOwnsPins");
    expect(mapSource).toContain("const activeIds = new Set(markerBusinesses.map");
  });

  it("cancels stale movement requests and reconciles stale viewport markers", () => {
    expect(mapSource).toContain("mapPinsAbortRef.current?.abort()");
    expect(mapSource).toContain("const visibleIds = new Set(businesses.map((business) => business.id))");
    expect(mapSource).toContain("marker.setMap(null)");
    expect(mapSource).toContain("markersRef.current.delete(id)");
    expect(mapSource).toContain('import { MarkerClusterer, type Renderer } from "@googlemaps/markerclusterer"');
    expect(mapSource).toContain("const MWM_CLUSTER_RENDERER: Renderer");
    expect(mapSource).toContain("renderer: MWM_CLUSTER_RENDERER");
    expect(mapSource).toContain('title: `${count} MWM businesses`');
    expect(mapSource).not.toContain("new MarkerClusterer({ map, markers })");
  });
});
