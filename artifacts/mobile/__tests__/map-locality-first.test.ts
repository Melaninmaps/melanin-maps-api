import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canLoadLocalCollections,
  isSafeLocalFit,
  mapCollectionScopeQuery,
  parseProfileHomeLocality,
  resolveMapLocality,
} from "../lib/mapLocality";
import {
  buildBusinessesRequestUrl,
  isDeliberateMapBusinessNameSearch,
} from "../hooks/support-lens-request";

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
    expect(fullMapSource).toContain("enabled: deliberateMapNameSearch || exploringAllAreas || mapLocality !== null");
  });

  it("requests precise foreground location once on the first native map visit", () => {
    expect(fullMapSource).toContain("const hasRequestedInitialLocationRef = useRef(false)");
    expect(fullMapSource).toContain("Location.requestForegroundPermissionsAsync()");
    expect(fullMapSource).toContain("Location.hasServicesEnabledAsync()");
    expect(fullMapSource).toContain("Location.getLastKnownPositionAsync({");
    expect(fullMapSource).toContain("accuracy: Location.Accuracy.Balanced");
    expect(fullMapSource).toContain("hasRequestedInitialLocationRef.current = true");
    expect(fullMapSource).toContain("void recenter()");
    expect(fullMapSource).toContain('if (Platform.OS === "web" || !isFocused || hasRequestedInitialLocationRef.current) return;');
  });

  it("never silently abandons a native location failure", () => {
    expect(fullMapSource).toContain("const [locationNotice, setLocationNotice]");
    expect(fullMapSource).toContain("mapLocationServicesOffNotice()");
    expect(fullMapSource).toContain("mapLocationFailureNotice(error)");
    expect(fullMapSource).toContain('accessibilityLabel="Map location needs attention"');
    expect(fullMapSource).toContain('accessibilityLabel="Retry map location"');
    expect(fullMapSource).toContain("Retry location");
    expect(fullMapSource).not.toContain("} catch {} finally {");
  });

  it("keeps cultural, event, safety, and tour collections local by default", () => {
    expect(fullMapSource).toContain("(!exploringAllAreas && !hasLocalCollectionScope)");
    expect(fullMapSource).toContain("/api/cultural-sites${collectionScopeSuffix}");
    expect(fullMapSource).toContain("/api/events${collectionScopeSuffix}");
    expect(fullMapSource).toContain("/api/safety/heatmap${collectionScopeSuffix}");
    expect(fullMapSource).toContain("const exploringAllAreas = false");
    expect(fullMapSource).not.toContain('accessibilityLabel="Explore all areas"');
  });

  it("does not fit an ordinary map to a country-wide coordinate spread", () => {
    expect(fullMapSource).toContain("if (!exploringAllAreas && !isSafeLocalFit(coordinates)) return;");
    expect(fullMapSource).toContain("const pinsToFit = hasSubmittedBusinessSearch");
    expect(fullMapSource).toContain("? currentMappedBusinesses");
    expect(fullMapSource).toContain(": nearbyCanonicalMapPins;");
    expect(fullMapSource).toContain("const coordinates = pinsToFit.map");
  });

  it("keeps the business hook backward-compatible while allowing map views to stop unscoped fetches", () => {
    expect(businessHookSource).toContain("enabled?: boolean;");
    expect(businessHookSource).toContain("if (!enabled)");
    expect(businessHookSource).toContain("buildBusinessesRequestUrl");
    expect(businessHookSource).toContain("directName?: boolean;");
    expect(businessHookSource).toContain("supportScope: directName ? undefined : supportScope");
  });

  it("uses one submitted search without widening the member's local map scope", () => {
    expect(fullMapSource).toContain('accessibilityLabel="Search the map by business, service, item, or city"');
    expect(fullMapSource).toContain('placeholder="Search a business, service, item, or city"');
    expect(fullMapSource).toContain("search: submittedBusinessSearch");
    expect(fullMapSource).toContain("const locality = parseMapSearchLocality(query)");
    expect(fullMapSource).toContain("if (locality?.state)");
    expect(fullMapSource).toContain("setSubmittedBusinessSearch(query)");
    expect(fullMapSource).toContain('enabled: deliberateMapNameSearch || exploringAllAreas || mapLocality !== null');
    expect(fullMapSource).toContain('accessibilityLabel="Clear map search and return to my local map"');
  });

  it("keeps a submitted service search focused on its matches and makes those listings selectable", () => {
    expect(fullMapSource).toContain("if (hasSubmittedBusinessSearch) return currentMappedBusinesses;");
    expect(fullMapSource).toContain('accessibilityLabel="Matched business cards"');
    expect(fullMapSource).toContain("const submittedMappedBusinessResults");
    expect(fullMapSource).toContain("Choose one of {mapped.length} mapped");
    expect(fullMapSource).toContain("onPress={() => focusDirectBusinessOnMap(business)}");
    expect(fullMapSource).toContain("{mapLocality && !hasSubmittedBusinessSearch && (");
  });

  it("keeps ordinary service browse local while making a deliberate public business name a direct listing, never a Map pin", () => {
    expect(isDeliberateMapBusinessNameSearch("AMINA")).toBe(true);
    expect(isDeliberateMapBusinessNameSearch("Amina Restaurant")).toBe(true);
    expect(isDeliberateMapBusinessNameSearch("restaurants")).toBe(false);
    expect(isDeliberateMapBusinessNameSearch("vegan restaurants")).toBe(false);
    expect(isDeliberateMapBusinessNameSearch("Black-owned restaurants")).toBe(false);
    expect(isDeliberateMapBusinessNameSearch("girls clothes")).toBe(false);
    expect(isDeliberateMapBusinessNameSearch("Café Mūse")).toBe(true);
    expect(isDeliberateMapBusinessNameSearch("Atlanta")).toBe(false);
    expect(
      buildBusinessesRequestUrl("https://api.example.test", {
        search: "AMINA",
        directName: true,
        offset: 50,
        limit: 50,
      }),
    ).toBe("https://api.example.test/api/businesses?search=AMINA&lookup=direct_name&offset=50&limit=50");
    expect(fullMapSource).toContain("const deliberateMapNameSearch = isDeliberateMapBusinessNameSearch");
    expect(fullMapSource).toContain("directName: deliberateMapNameSearch");
    expect(fullMapSource).toContain('searchScope: businessSearchScope');
    expect(businessHookSource).toContain('"direct_named_safety_context"');
    expect(fullMapSource).toContain('businessSearchScope === "direct_named_safety_context"');
    expect(fullMapSource).toContain("const directMatches = hasCurrentBusinessSearchResults");
    expect(fullMapSource).toContain("{directMatches.map((business) => (");
    expect(fullMapSource).toContain("if (deliberateMapNameSearch) return [];");
    expect(fullMapSource).not.toContain("if (directMatch) return [];");
    expect(businessHookSource).toContain("const lastSuccessfulResultRef = useRef<SuccessfulBusinessesCache | null>(null);");
    expect(businessHookSource).toContain("const requestKey = JSON.stringify({");
    expect(businessHookSource).toContain("const canRestoreCachedResult = cachedResult?.requestKey === requestKey;");
    expect(businessHookSource).toContain("setBusinesses(canRestoreCachedResult ? cachedResult.businesses : []);");
    expect(businessHookSource).toContain("setSearchScope(canRestoreCachedResult ? cachedResult.searchScope : null);");
    expect(businessHookSource).toContain("resultRequestKey: string | null;");
    expect(businessHookSource).toContain("setResultRequestKey(requestKey);");
    expect(businessHookSource).toContain("resultRequestKey,");
    expect(fullMapSource).toContain("requestKey: businessSearchRequestKey");
    expect(fullMapSource).toContain("resultRequestKey: businessSearchResultRequestKey");
    expect(fullMapSource).toContain("businessSearchResultRequestKey === businessSearchRequestKey");
    expect(fullMapSource).toContain("const currentMappedBusinesses = hasCurrentBusinessSearchResults");
    expect(fullMapSource).toContain("including after clearing a\n  // direct-name search");
    expect(fullMapSource).toContain("if (hasSubmittedBusinessSearch) return currentMappedBusinesses;");
    expect(fullMapSource).toContain("currentMappedBusinesses.slice(0, 5)");
    expect(businessHookSource).not.toContain("lastSuccessfulBusinessesRef");
    expect(fullMapSource).toContain("const [directNameOffset, setDirectNameOffset] = useState(0)");
    expect(fullMapSource).toContain("offset: deliberateMapNameSearch ? directNameOffset : 0");
    expect(fullMapSource).toContain('accessibilityLabel="More exact-name listings"');
    expect(fullMapSource).toContain('accessibilityLabel="Previous exact-name listings"');
    expect(fullMapSource).toContain('accessibilityLabel={`View ${business.name} listing`}');
    expect(businessHookSource).toContain('category: directName ? "All" : category');
    expect(businessHookSource).toContain('city: directName ? "" : city');
    expect(businessHookSource).toContain('state: directName ? "" : state');
    expect(fullMapSource).toContain('pathname: "/business/[id]", params: { id: business.id }');
    expect(fullMapSource).toContain("View listing");
    expect(fullMapSource).not.toContain("showDirectMatchOnMap");
  });

  it("offers 50 miles for business discovery without widening public-facility availability", () => {
    expect(fullMapSource).toContain("useState<5 | 10 | 25 | 50>(10)");
    expect(fullMapSource).toContain("[5, 10, 25, 50].map");
    expect(fullMapSource).toContain("radius: String(Math.min(mapDiscoveryRadius, 25))");
  });

  it("uses the saved strict Support Lens for map business requests", () => {
    expect(fullMapSource).toContain('import { useUserPreferences } from "@/hooks/useUserPreferences"');
    expect(fullMapSource).toContain('memberPreferences?.supportLensMode === "strict_documented_designations"');
    expect(fullMapSource).toContain("designations: designationIds");
    expect(fullMapSource).toContain("supportScope: memberPreferences?.supportLensMode");
  });
});
