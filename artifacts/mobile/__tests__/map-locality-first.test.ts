import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canLoadLocalCollections,
  isSafeLocalFit,
  mapCollectionScopeQuery,
  parseProfileHomeLocality,
  resolveMapLocality,
} from "../lib/mapLocality";

const fullMapSource = readFileSync(
  decodeURIComponent(
    new URL("../components/FullMapView.tsx", import.meta.url).pathname,
  ),
  "utf8",
);
const businessHookSource = readFileSync(
  decodeURIComponent(new URL("../hooks/useBusinesses.ts", import.meta.url).pathname),
  "utf8",
);

describe("map locality-first scope", () => {
  it("uses the profile home city as a conservative city/state fallback", () => {
    expect(parseProfileHomeLocality("Atlanta, GA")).toEqual({
      source: "profile",
      city: "Atlanta",
      state: "GA",
    });
    expect(parseProfileHomeLocality("Philadelphia")).toEqual({
      source: "profile",
      city: "Philadelphia",
      state: undefined,
    });
    expect(parseProfileHomeLocality("   ")).toBeNull();
  });

  it("prioritizes confirmed device coordinates while retaining local collection geography", () => {
    const locality = resolveMapLocality(
      { latitude: 39.9526, longitude: -75.1652 },
      { city: "Philadelphia", state: "pa" },
      parseProfileHomeLocality("Atlanta, GA"),
    );

    expect(locality).toMatchObject({
      source: "device",
      latitude: 39.9526,
      longitude: -75.1652,
      city: "Philadelphia",
      state: "PA",
    });
    expect(mapCollectionScopeQuery(locality, false)).toBe(
      "city=Philadelphia&state=PA",
    );
  });

  it("does not construct a default collection request without a locality", () => {
    expect(canLoadLocalCollections(null)).toBe(false);
    expect(mapCollectionScopeQuery(null, false)).toBe("");
    // An empty scope is allowed only after the member explicitly selects
    // all-area exploration, not during the ordinary initial map load.
    expect(mapCollectionScopeQuery(null, true)).toBe("");
  });

  it("allows a normal fit only for local-scale coordinates", () => {
    expect(
      isSafeLocalFit([
        { latitude: 39.95, longitude: -75.17 },
        { latitude: 40.01, longitude: -75.08 },
      ]),
    ).toBe(true);
    expect(
      isSafeLocalFit([
        { latitude: 39.9526, longitude: -75.1652 },
        { latitude: 34.0522, longitude: -118.2437 },
      ]),
    ).toBe(false);
  });
});

describe("FullMapView locality-first contracts", () => {
  it("starts at a local-scale region and never enables an unscoped default business request", () => {
    expect(fullMapSource).toContain("const DEFAULT_REGION: Region = NEUTRAL_LOCAL_REGION");
    expect(fullMapSource).not.toContain("latitudeDelta: 32");
    expect(fullMapSource).not.toContain("longitudeDelta: 52");
    expect(fullMapSource).toContain("enabled: exploringAllAreas || mapLocality !== null");
  });

  it("scopes cultural, event, safety, and tour collections until explicit all-area exploration", () => {
    expect(fullMapSource).toContain("(!exploringAllAreas && !hasLocalCollectionScope)");
    expect(fullMapSource).toContain("/api/cultural-sites${collectionScopeSuffix}");
    expect(fullMapSource).toContain("/api/events${collectionScopeSuffix}");
    expect(fullMapSource).toContain("/api/safety/heatmap${collectionScopeSuffix}");
    expect(fullMapSource).toContain('accessibilityLabel="Explore all areas"');
  });

  it("does not fit an ordinary map to a country-wide coordinate spread", () => {
    expect(fullMapSource).toContain("if (!exploringAllAreas && !isSafeLocalFit(coordinates)) return;");
    expect(fullMapSource).toContain("if (!exploringAllAreas && !isSafeLocalFit(coords)) return;");
  });

  it("keeps the business hook backward-compatible while allowing map views to stop unscoped fetches", () => {
    expect(businessHookSource).toContain("enabled?: boolean;");
    expect(businessHookSource).toContain("if (!enabled)");
    expect(businessHookSource).toContain('params.set("city", city.trim())');
    expect(businessHookSource).toContain('params.set("state", state.trim())');
  });

  it("adds a submitted business search without widening the member's local map scope", () => {
    expect(fullMapSource).toContain('accessibilityLabel="Search businesses on this map"');
    expect(fullMapSource).toContain('placeholder="Search businesses or services"');
    expect(fullMapSource).toContain("search: submittedBusinessSearch");
    expect(fullMapSource).toContain("setSubmittedBusinessSearch(businessSearchInput.trim())");
    expect(fullMapSource).toContain('enabled: exploringAllAreas || mapLocality !== null');
    expect(fullMapSource).toContain('accessibilityLabel="Clear business search"');
  });
});
