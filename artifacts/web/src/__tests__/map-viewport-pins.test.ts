import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(new URL("../pages/map.tsx", import.meta.url), "utf8");

describe("web map viewport pin retrieval", () => {
  it("loads pin pages only after a local scope and map idle debounce", () => {
    expect(mapSource).toContain("const loadViewportPins = useCallback");
    expect(mapSource).toContain("if (!activeLocalScope && !exploreAllAreas)");
    expect(mapSource).toContain('g.event.addListener(map, "idle", schedule)');
    expect(mapSource).toContain("south: String(south), west: String(west), north: String(north), east: String(east)");
  });

  it("cancels stale movement requests and reconciles stale viewport markers", () => {
    expect(mapSource).toContain("mapPinsAbortRef.current?.abort()");
    expect(mapSource).toContain("const visibleIds = new Set(businesses.map((business) => business.id))");
    expect(mapSource).toContain("marker.setMap(null)");
    expect(mapSource).toContain("markersRef.current.delete(id)");
    expect(mapSource).toContain('import { MarkerClusterer } from "@googlemaps/markerclusterer"');
    expect(mapSource).toContain("new MarkerClusterer({ map, markers })");
  });
});
