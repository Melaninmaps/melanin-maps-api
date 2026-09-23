import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const map = source("../components/FullMapView.tsx");
const canonicalPins = source("../hooks/useCanonicalMapPins.ts");
const businesses = source("../hooks/useBusinesses.ts");
const business = source("../app/business/[id].tsx");
const travel = source("../app/travel.tsx");
const kinfolk = source("../hooks/useKinfolk.ts");
const rootLayout = source("../app/_layout.tsx");

describe("native map, business, and Kinfolk continuity", () => {
  it("keeps a canonical pin layer independent of a changing local scope", () => {
    expect(map).toContain('useCanonicalMapPins({ enabled: isFocused })');
    expect(map).toContain("a location\n  // permission change or an empty 50-mile local response must not clear a pin");
    expect(map).toContain("const displayBusinessPins = useMemo");
    expect(map).toContain("nearbyCanonicalMapPins.forEach");
    expect(canonicalPins).toContain("Keep the last good web-equivalent layer");
    expect(canonicalPins).toContain("/api/businesses/map-pins");
    expect(businesses).toContain('import { getApiBase } from "@/lib/api";');
    expect(businesses).toContain("const apiBase = getApiBase();");
    expect(businesses).not.toContain("function getApiBaseUrl()");
  });

  it("gives every native map member a keyboard exit path", () => {
    expect(map).toContain('accessibilityLabel="Close keyboard and continue exploring the map"');
    expect(map).toContain("Keyboard.dismiss()");
    expect(rootLayout).toContain("function KeyboardEscapeGuard()");
    expect(rootLayout).toContain('BackHandler.addEventListener("hardwareBackPress"');
  });

  it("lets a member interrupt Kinfolk and replace a prior turn", () => {
    expect(travel).toContain('submitBehavior="submit"');
    expect(travel).toContain('accessibilityLabel="Stop Kinfolk so I can finish my thought"');
    expect(travel).toContain('stopServerVoice("member_new_turn")');
    expect(kinfolk).toContain("const interruptCurrentReply = useCallback");
    expect(kinfolk).toContain("activeRequestRef.current?.abort()");
    expect(kinfolk).toContain("requestGeneration !== requestGenerationRef.current");
    expect(kinfolk).toContain("const conversationContext = messagesRef.current.slice(-6)");
    expect(kinfolk).toContain("conversationContext,");
  });

  it("does not hide owner-editable About text or a creator's pending post", () => {
    expect(business).toContain('showFullAbout ? undefined : 4');
    expect(business).toContain('"Read more"');
    expect(business).toContain("await loadCommunityContributions()");
    expect(business).toContain("Awaiting review · only you can see this");
  });

  it("explains why a Kinfolk business card surfaced", () => {
    expect(travel).toContain("function recommendationRationale");
    expect(travel).toContain("Why Kinfolk suggested");
    expect(travel).toContain("when that information is actually present in the record");
  });
});
