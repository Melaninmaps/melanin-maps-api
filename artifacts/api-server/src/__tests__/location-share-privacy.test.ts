import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("retired live location sharing", () => {
  it("fails closed on every legacy endpoint without reading coordinates or tokens", () => {
    const route = source("../routes/location-shares.ts");
    expect(route).toContain("LIVE_LOCATION_SHARING_RETIRED");
    expect(route).toContain('router.post("/safety/location-shares"');
    expect(route).toContain('router.patch("/safety/location-shares/:token/update"');
    expect(route).toContain('router.get("/safety/location-shares/:token/view"');
    expect(route).toContain('router.delete("/safety/location-shares/:id"');
    expect(route.match(/res\.status\(410\)/g)?.length).toBe(1);
    expect(route).toContain("Deliberately do not query by token");
    expect(route).not.toContain("recipientTrustedShareId");
    expect(route).not.toContain("minimizeLocationCoordinate");
    expect(route).not.toContain("publicLocationShare");
  });

  it("clears retained active coordinates for an authenticated former sharer", () => {
    const route = source("../routes/location-shares.ts");
    expect(route).toContain("retireLocationSharesForMember");
    expect(route).toContain("isActive: false");
    expect(route).toContain("currentLat: null");
    expect(route).toContain("currentLng: null");
    expect(route).toContain("lastUpdatedAt: null");
    expect(route).toContain("eq(locationSharesTable.sharerId, memberId)");
  });

  it("removes native coordinate collection and public map rendering", () => {
    const mobile = source("../../../mobile/app/location-share.tsx");
    const web = source("../../../web/src/pages/location-share-view.tsx");
    expect(mobile).toContain("Live location sharing is not available");
    expect(mobile).not.toContain("expo-location");
    expect(mobile).not.toContain("location-shares");
    expect(web).toContain("Live location sharing is not available");
    expect(web).not.toContain("fetch(");
    expect(web).not.toContain("google.com/maps");
    expect(web).not.toContain("currentLat");
  });
});
