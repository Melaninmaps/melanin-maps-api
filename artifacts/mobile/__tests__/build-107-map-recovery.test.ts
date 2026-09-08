import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isCoordinateInRegion,
  isDomesticMapCountry,
  mapPinMatchesQuery,
  normalizeMapCulturalSite,
  validMapCoordinate,
} from "../lib/mapData";

const mobileRoot = resolve(__dirname, "..");
const mapSource = readFileSync(resolve(mobileRoot, "components/FullMapView.tsx"), "utf8");
const businessHook = readFileSync(resolve(mobileRoot, "hooks/useBusinesses.ts"), "utf8");
const mapRoute = readFileSync(resolve(mobileRoot, "app/(tabs)/map.tsx"), "utf8");
const mapDataSource = readFileSync(resolve(mobileRoot, "lib/mapData.ts"), "utf8");

describe("Build 107 native map recovery", () => {
  it("rejects null-island and invalid coordinates while preserving real domestic pins", () => {
    expect(validMapCoordinate(39.9526, -75.1652)).toBe(true);
    expect(validMapCoordinate(0, 0)).toBe(false);
    expect(validMapCoordinate(91, -75)).toBe(false);
    expect(validMapCoordinate(Number.NaN, -75)).toBe(false);
    expect(isDomesticMapCountry()).toBe(true);
    expect(isDomesticMapCountry("US")).toBe(true);
    expect(isDomesticMapCountry("United States")).toBe(true);
    expect(isDomesticMapCountry("Mexico")).toBe(false);
  });

  it("includes pins inside the rendered viewport and excludes far-away markers", () => {
    const philadelphia = { latitude: 39.9526, longitude: -75.1652, latitudeDelta: 0.4, longitudeDelta: 0.4 };
    expect(isCoordinateInRegion(39.95, -75.16, philadelphia)).toBe(true);
    expect(isCoordinateInRegion(33.75, -84.39, philadelphia)).toBe(false);
  });

  it("matches direct fields across a complete pin feed beyond the 200-row directory page", () => {
    const pins = Array.from({ length: 300 }, (_, index) => ({
      name: `Business ${index}`,
      category: index >= 200 ? "HVAC" : "Restaurant",
      city: index >= 200 ? "Phoenix" : "Philadelphia",
      state: index >= 200 ? "AZ" : "PA",
    }));
    expect(pins.filter((pin) => mapPinMatchesQuery(pin, "HVAC Phoenix")).length).toBe(100);
    expect(mapPinMatchesQuery({ name: "Howard University", category: "HBCU", city: "Washington" }, "HBCU")).toBe(true);
  });

  it("normalizes canonical and legacy cultural aliases without manufacturing a pin", () => {
    expect(normalizeMapCulturalSite({
      id: "site-1",
      name: "Heritage Site",
      latitude: "39.95",
      longitude: "-75.16",
      stateCode: "PA",
      learnMoreUrl: "https://example.org/source",
    })).toMatchObject({
      id: "site-1",
      state: "PA",
      externalUrl: "https://example.org/source",
      heritageCategory: "Cultural Site",
    });
    expect(normalizeMapCulturalSite({
      id: "site-2",
      name: "HBCU",
      latitude: 38.9,
      longitude: -77.0,
      heritage_category: "HBCU",
      external_url: "https://example.edu",
      pin_type: "cultural_site",
    })).toMatchObject({ heritageCategory: "HBCU", externalUrl: "https://example.edu", pinType: "cultural_site" });
    expect(normalizeMapCulturalSite({ id: "missing-pin", name: "Searchable only", latitude: null, longitude: null })).toBeNull();
    expect(normalizeMapCulturalSite({ id: "missing-latitude", name: "Searchable only", latitude: null, longitude: -75.16 })).toBeNull();
    expect(normalizeMapCulturalSite({ id: "blank-longitude", name: "Searchable only", latitude: 39.95, longitude: "" })).toBeNull();
  });

  it("ships a real native search control with a one-tap HBCU search", () => {
    expect(mapSource).toContain('testID="map-search-input"');
    expect(mapSource).toContain('testID="map-search-submit"');
    expect(mapSource).toContain('testID="map-hbcu-search"');
    expect(mapSource).toContain('submitMapSearch("HBCU")');
    expect(mapSource).toContain('placeholder="Business, service, city, or HBCU"');
  });

  it("loads the complete canonical public map-pin feed instead of the first directory page", () => {
    expect(mapSource).toContain('useBusinesses({ mapPins: true })');
    expect(businessHook).toContain('const endpoint = mapPins ? "/api/businesses/map-pins" : "/api/businesses"');
    expect(mapSource).toContain("renderedBusinessPins.map");
    expect(mapSource).not.toMatch(/\{mapped\.map\(\(biz\)/);
  });

  it("bounds native marker rendering to the visible region without hiding searchable records", () => {
    expect(mapSource).toContain("isCoordinateInRegion");
    expect(mapDataSource).toContain("export function isCoordinateInRegion");
    expect(mapDataSource).toContain("export function mapPinMatchesQuery");
    expect(mapSource).toContain("MAX_BUSINESS_MARKERS");
    expect(mapSource).toContain("coordinate-backed matches loaded");
    expect(mapSource).toContain("mapReady && renderedBusinessPins.map");
    expect(mapSource).toContain("pendingBusinessFocusRef");
    expect(mapSource).toContain("return () => clearTimeout(timer)");
    expect(businessHook).toContain('params.set("limit", "200")');
  });

  it("authenticates member heritage reads and accepts the canonical items response", () => {
    expect(mapSource).toContain('memberFetch(`${base}/api/cultural-sites`)');
    expect(mapSource).toContain('memberFetch(`${base}/api/tour-cultural-sites?limit=300`)');
    expect(mapSource).toContain("Array.isArray(data.items)");
    expect(mapDataSource).toContain("export function normalizeMapCulturalSite");
    expect(mapDataSource).toContain("raw.external_url");
    expect(mapSource).toContain("site.siteType ?? site.site_type");
  });

  it("restores business detail, website, and directions actions from selected pins", () => {
    expect(mapSource).toContain("useBusinessById(selectedBusiness?.id ?? \"\")");
    expect(mapSource).toContain("selectedBusinessDetail?.id === selectedBusiness?.id");
    expect(businessHook).toContain("controller.abort()");
    expect(mapSource).toContain("openMapDirections(activeBusiness.latitude, activeBusiness.longitude, activeBusiness.name)");
    expect(mapSource).toContain("openExternalUrl(activeBusiness.website)");
    expect(mapSource).toContain('pathname: "/business/[id]"');
  });

  it("preserves route-provided HBCU/site focus parameters", () => {
    expect(mapRoute).toContain("focusSiteId");
    expect(mapRoute).toContain("focusLat");
    expect(mapRoute).toContain("focusLng");
  });

  it("keeps unknown map pins unverified rather than inventing claim truth", () => {
    expect(businessHook).toContain("verified: b.verified === true");
    expect(mapSource).toContain("Ownership and location are not shown as verified.");
  });
});
