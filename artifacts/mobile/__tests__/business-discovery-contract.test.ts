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
const locationShareSource = readFileSync(
  decodeURIComponent(new URL("../app/location-share.tsx", import.meta.url).pathname),
  "utf8",
);
const discoveryV1Source = readFileSync(
  decodeURIComponent(new URL("../lib/discoveryV1.ts", import.meta.url).pathname),
  "utf8",
);

describe("business discovery data contract", () => {
  it("never substitutes fixture businesses for an API response", () => {
    expect(hookSource).not.toContain('from "@/constants/data"');
    expect(hookSource).not.toContain("BUSINESSES");
    expect(hookSource).toContain("useState<Business[]>([])");
  });

  it("reports loading failures while preserving an empty API result as empty", () => {
    expect(hookSource).toContain("const BUSINESS_LOAD_ERROR");
    expect(hookSource).toContain("setBusinesses([]);");
    expect(hookSource).toContain("if (!Array.isArray(data.businesses))");
    expect(hookSource).toContain("const requestId = ++requestIdRef.current");
    expect(hookSource).toContain("if (requestId === requestIdRef.current)");
  });

  it("sends the saved session token through the shared Discovery V1 client", () => {
    expect(searchSource).toContain("executeV1Search({");
    expect(discoveryV1Source).toContain('SecureStore.getItemAsync("auth_session_token")');
    expect(discoveryV1Source).toContain("headers.Authorization = `Bearer ${token}`");
  });

  it("sends normalized query, city, state, and bounded radius to Discovery V1", () => {
    expect(searchSource).toContain("const q = [nameParam, handleParam]");
    expect(searchSource).toContain("city: cityParam || undefined");
    expect(searchSource).toContain("stateRegion: stateParam || undefined");
    expect(searchSource).toContain("radiusMiles: radiusMiles || undefined");
    expect(discoveryV1Source).toContain("query: query.trim()");
    expect(discoveryV1Source).toContain("[5, 10, 25].includes(effectiveRadius)");
  });

  it("does not present authentication or transport failures as a missing business", () => {
    expect(discoveryV1Source).toContain('if (!v1Res.ok) throw new Error("Search failed")');
    expect(searchSource).toContain('"Unable to search businesses right now. Check your connection and try again."');
    expect(searchSource).toContain('setMode(list.length > 0 ? "results" : "invite")');
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

  it("gives deep-linked location sharing an accessible Safety Hub return path", () => {
    expect(locationShareSource).toContain('router.replace("/(tabs)/safety-hub" as never)');
    expect(locationShareSource).toContain('accessibilityLabel="Back"');
  });
});
