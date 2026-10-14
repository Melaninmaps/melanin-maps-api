import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_MAP_VIEWPORT } from "../features/map/defaultMapViewport";

const homeSource = readFileSync(
  new URL("../pages/home.tsx", import.meta.url),
  "utf8",
);
const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("map-first Web layout", () => {
  it("sends authenticated members to the existing protected map route", () => {
    expect(homeSource).toContain('navigate("/map", { replace: true })');
    expect(homeSource).not.toContain('navigate("/discover", { replace: true })');
  });

  it("keeps the map canvas full-size at desktop and narrow breakpoints when results open", () => {
    expect(mapSource).toContain('data-testid="map-first-shell"');
    expect(mapSource).toContain('data-testid="map-canvas-shell"');
    expect(mapSource).toContain('className="relative h-full w-full"');
    expect(mapSource).toContain('data-testid="map-sidebar-overlay"');
    expect(mapSource).toContain('className="absolute inset-y-0 left-0 z-20 w-80 max-w-[calc(100%-3.5rem)] shadow-2xl"');
    expect(mapSource).toContain('map.fitBounds(bounds, { top: 84, right: 32, bottom: 48, left: 352 });');
  });

  it("creates the map object after the Google Maps callback changes readiness", () => {
    expect(mapSource).toContain("}, [gmLoaded, ready, requestMapDeviceLocation, centerSavedHomeArea, savedHomeCity]);");
    expect(mapSource).toContain("const map: GMap = new g.Map(mapDivRef.current");
    expect(mapSource).toContain("setReady(true);");
    expect(mapSource).toContain("if ((window as any).google?.maps) { setGmLoaded(true); return; }");
    expect(mapSource).toContain('existingScript.addEventListener("load", markReady, { once: true });');
  });

  it("recovers the saved home area when member authentication resolves after map initialization", () => {
    expect(mapSource).toContain("const savedHomeCity = useMemo(() => {");
    expect(mapSource).toContain("const centeredSavedHomeRef = useRef<string | null>(null);");
    expect(mapSource).toContain("const centerSavedHomeArea = useCallback((homeCity: string | null) => {");
    expect(mapSource).toContain("requestMapDeviceLocation({ onUnavailable: () => centerSavedHomeArea(savedHomeCity) });");
    expect(mapSource).toContain("if (!ready || userCoords || handoffQuery || searchViewportLockedRef.current) return;");
    expect(mapSource).toContain("centerSavedHomeArea(savedHomeCity);");
  });

  it("uses a useful Philadelphia fallback when location and home area are unavailable", () => {
    expect(DEFAULT_MAP_VIEWPORT).toEqual({
      center: { lat: 39.9526, lng: -75.1652 },
      zoom: 12,
    });
    expect(mapSource).toContain('import { DEFAULT_MAP_VIEWPORT } from "@/features/map/defaultMapViewport";');
    expect(mapSource).toContain("center: DEFAULT_MAP_VIEWPORT.center");
    expect(mapSource).toContain("zoom: DEFAULT_MAP_VIEWPORT.zoom");
    expect(mapSource).toContain("mapRef.current.panTo(DEFAULT_MAP_VIEWPORT.center);");
    expect(mapSource).toContain("mapRef.current.setZoom(DEFAULT_MAP_VIEWPORT.zoom);");
    expect(mapSource).not.toContain("const US_CENTER");
    expect(mapSource).not.toContain("lat: 38.5, lng: -96.5");
  });

  it("uses the MWM palette while suppressing only unrelated Google business POIs", () => {
    const styleStart = mapSource.indexOf("const BRAND_STYLE: object[] = [");
    const styleSource = mapSource.slice(styleStart, mapSource.indexOf("];", styleStart));

    expect(styleSource).toContain('#FAF1E4');
    expect(styleSource).toContain('#3B1F0E');
    expect(styleSource).toContain('#C9A84C');
    expect(styleSource).toContain('featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }]');
    expect(styleSource).not.toContain('featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }]');
    expect(styleSource).not.toContain('featureType: "transit", stylers: [{ visibility: "off" }]');
    expect(mapSource).toContain("styles: BRAND_STYLE");
    expect(mapSource).toContain('fill="#3B1F0E"');
    expect(mapSource).toContain('fill="#C9A84C"');
    expect(mapSource).toContain('href="/businesses/${biz.id}"');
  });

  it("clears a searched locality and invalidates late search responses when recentering", () => {
    const resetStart = mapSource.indexOf("const resetView = useCallback(() => {");
    const resetSource = mapSource.slice(resetStart, mapSource.indexOf("const clearRoute", resetStart));
    const areaHandoffStart = mapSource.indexOf("// ── Resolve ?area= handoff once after the map is ready");
    const areaHandoffSource = mapSource.slice(areaHandoffStart, mapSource.indexOf("// The legacy discoverability endpoint", areaHandoffStart));

    expect(resetSource).toContain("universalSearchGenerationRef.current += 1;");
    expect(resetSource).toContain("areaHandoffGenerationRef.current += 1;");
    expect(resetSource).toContain("searchViewportLockedRef.current = false;");
    expect(resetSource).toContain('setSearch("");');
    expect(resetSource).toContain("setBusinessSearchActive(false);");
    expect(resetSource).toContain("setUniversalResults(null);");
    expect(resetSource).toContain("setUniversalLoading(false);");
    expect(resetSource).toContain("setDetectedLocation(null);");
    expect(resetSource).toContain("localSearchMarkersRef.current.forEach((marker) => marker.setMap(null));");
    expect(resetSource).toContain("clearEssentialServices();");
    expect(mapSource).toContain("const searchGeneration = ++universalSearchGenerationRef.current;");
    expect(mapSource).toContain("if (!isCurrentSearch()) return;");
    expect(areaHandoffSource).toContain("const areaHandoffGeneration = ++areaHandoffGenerationRef.current;");
    expect(areaHandoffSource).toContain("if (areaHandoffGeneration !== areaHandoffGenerationRef.current) return;");
  });
});
