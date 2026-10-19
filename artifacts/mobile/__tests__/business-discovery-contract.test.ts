import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  decodeURIComponent(new URL("../hooks/useBusinesses.ts", import.meta.url).pathname),
  "utf8",
);
const searchSource = readFileSync(
  decodeURIComponent(new URL("../app/business-search.tsx", import.meta.url).pathname),
  "utf8",
);
const detailSource = readFileSync(
  decodeURIComponent(new URL("../app/business/[id].tsx", import.meta.url).pathname),
  "utf8",
);
const webDetailSource = readFileSync(
  decodeURIComponent(new URL("../app/business/[id].web.tsx", import.meta.url).pathname),
  "utf8",
);
const mapSource = readFileSync(
  decodeURIComponent(new URL("../components/FullMapView.tsx", import.meta.url).pathname),
  "utf8",
);
const businessCardSource = readFileSync(
  decodeURIComponent(new URL("../components/BusinessCard.tsx", import.meta.url).pathname),
  "utf8",
);
const businessPreviewSource = readFileSync(
  decodeURIComponent(new URL("../components/BusinessPreviewModal.tsx", import.meta.url).pathname),
  "utf8",
);
const locationShareSource = readFileSync(
  decodeURIComponent(new URL("../app/location-share.tsx", import.meta.url).pathname),
  "utf8",
);

describe("business discovery data contract", () => {
  it("never substitutes fixture businesses for an API response", () => {
    expect(hookSource).not.toContain('from "@/constants/data"');
    expect(hookSource).not.toContain("BUSINESSES");
    expect(hookSource).toContain("useState<Business[]>([])");
  });

  it("reports loading failures without clearing valid pins while preserving an empty API result as empty", () => {
    expect(hookSource).toContain("const BUSINESS_LOAD_ERROR");
    expect(hookSource).toContain("lastSuccessfulBusinessesRef.current = mappedBusinesses");
    expect(hookSource).toContain("setBusinesses(lastSuccessfulBusinessesRef.current);");
    expect(hookSource).toContain("An empty successful response is meaningful");
    expect(hookSource).toContain("if (!Array.isArray(data.businesses))");
    expect(hookSource).toContain("const requestId = ++requestIdRef.current");
    expect(hookSource).toContain("if (requestId === requestIdRef.current)");
  });

  it("sends the saved session token as a bearer token on discovery requests", () => {
    expect(hookSource).toContain('import * as SecureStore from "expo-secure-store"');
    expect(hookSource).toContain('SecureStore.getItemAsync(AUTH_TOKEN_KEY)');
    expect(hookSource).toContain("Authorization: `Bearer ${token}`");
    expect(searchSource).toContain('SecureStore.getItemAsync("auth_session_token")');
    expect(searchSource).toContain("headers: token ? { Authorization: `Bearer ${token}` } : {}");
  });

  it("sends name, city, state, category, and a bounded limit to canonical search", () => {
    expect(searchSource).toContain('allParams.set("search", nameParam)');
    expect(searchSource).toContain('allParams.set("city", cityParam)');
    expect(searchSource).toContain('allParams.set("state", stateParam)');
    // The effective value retains the normal category state and supports a
    // safe retry override without dropping the rest of the request context.
    expect(searchSource).toContain('allParams.set("category", searchCategory)');
    expect(searchSource).toContain('allParams.set("limit", "200")');
    expect(searchSource).not.toContain("list = list.filter((b)");
  });

  it("does not present authentication or transport failures as a missing business", () => {
    expect(searchSource).toContain("if (!res.ok) throw new Error(`HTTP ${res.status}`)");
    expect(searchSource).toContain('setSearchError("Unable to search businesses right now. Check your connection and try again.")');
    expect(searchSource).toContain('{searched && !searchError && mode === "invite" && (');
    expect(searchSource).toContain("const requestId = ++searchRequestIdRef.current");
    expect(searchSource).toContain("if (requestId !== searchRequestIdRef.current) return");
    expect(searchSource).toContain('accessibilityLabel="Back"');
  });

  it("uses a gold category placeholder until a claimed owner supplies a cover", () => {
    expect(detailSource).not.toContain("const CATEGORY_IMAGES");
    expect(detailSource).toContain('return "scissors"');
    expect(detailSource).toContain('business.listingStatus === "live_claimed"');
    expect(detailSource).toContain("const claimedCover = ownerManaged && business.imageUrl");
    expect(detailSource).toContain("style={styles.heroIconPlate}");
    expect(detailSource.match(/router\.canGoBack\(\) \? router\.back\(\) : router\.replace\("\/\(tabs\)" as never\)/g)).toHaveLength(3);
    expect(webDetailSource).not.toContain("const CATEGORY_IMAGES");
    expect(webDetailSource).not.toContain("bento-businesses.jpg");
    expect(webDetailSource).toContain("const claimedCover = ownerManaged && business.imageUrl");
    expect(webDetailSource).toContain("style={styles.heroIconPlate}");
    expect(webDetailSource).toContain('accessibilityLabel={`${business.category || "Business"} category placeholder`}');
  });

  it("never substitutes category stock art for a business image", () => {
    expect(businessCardSource).not.toContain("const CATEGORY_IMAGES");
    expect(businessCardSource).not.toContain("bento-businesses.jpg");
    expect(businessCardSource).toContain("Business profile");
    expect(businessPreviewSource).not.toContain("const CATEGORY_IMAGES");
    expect(businessPreviewSource).not.toContain("bento-nightlife.jpg");
    expect(businessPreviewSource).toContain("Business profile");
  });

  it("gives deep-linked location sharing an accessible Safety Hub return path", () => {
    expect(locationShareSource).toContain('router.replace("/(tabs)/safety-hub" as never)');
    expect(locationShareSource).toContain('accessibilityLabel="Back"');
  });

  it("keeps Business Detail Maps free-core, bilingual, and destination-only", () => {
    const actionStart = detailSource.indexOf("{/* Free-core destination-only Maps handoff. */}");
    const actionEnd = detailSource.indexOf("{/* Owner's Pinned Highlights */}", actionStart);
    const mapHandoff = detailSource.slice(actionStart, actionEnd);

    expect(actionStart).toBeGreaterThanOrEqual(0);
    expect(actionEnd).toBeGreaterThan(actionStart);
    expect(mapHandoff).toContain("!isOnlineOnly && business.latitude && business.longitude");
    expect(mapHandoff).toContain("maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d");
    expect(mapHandoff).toContain("https://maps.google.com/maps?daddr=${lat},${lng}");
    expect(mapHandoff).toContain("Open in Maps / Abrir en Mapas");
    expect(mapHandoff).toContain("Maps unavailable / Mapas no disponibles");
    expect(mapHandoff).toContain("No pudimos abrir tu app de mapas");
    expect(mapHandoff).toContain("Linking.openURL(mapsUrl).catch");

    for (const retiredBehavior of [
      "isNavigator",
      "expo-location",
      "/api/directions",
      "fetch(",
      "auth_session_token",
      "directionsOpen",
      "travelMode",
    ]) {
      expect(mapHandoff).not.toContain(retiredBehavior);
    }

    for (const retiredScreenArtifact of [
      "const isNavigator =",
      "In-App Directions Modal",
      "directionsOpen",
      "directionsFetching",
      "directionsSteps",
      "userCoordsRef",
      "expo-location",
      "/api/directions",
    ]) {
      expect(detailSource).not.toContain(retiredScreenArtifact);
    }
  });

  it("keeps an exact map match on the MWM business page, with directions as a separate action", () => {
    expect(mapSource).toContain('pathname: "/business/[id]"');
    expect(mapSource).toContain("params: { id: selectedBusiness.id }");
    expect(mapSource).toContain("View Business");
    expect(mapSource).toContain("openMapDirections(");
    expect(mapSource).toContain("Directions");
  });
});
