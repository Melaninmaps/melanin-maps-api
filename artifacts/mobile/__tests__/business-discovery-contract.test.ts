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
    expect(searchSource).toContain('allParams.set("category", category)');
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

  it("gives deep-linked location sharing an accessible Safety Hub return path", () => {
    expect(locationShareSource).toContain('router.replace("/(tabs)/safety-hub" as never)');
    expect(locationShareSource).toContain('accessibilityLabel="Back"');
  });
});
