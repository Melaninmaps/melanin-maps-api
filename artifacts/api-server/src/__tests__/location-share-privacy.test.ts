import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { publicLocationShare } from "../routes/location-shares";

describe("location share public view", () => {
  it("returns only data necessary to view a temporary location", () => {
    const storedShare = {
      label: "Trip home",
      currentLat: 39.9526,
      currentLng: -75.1652,
      lastUpdatedAt: new Date("2026-01-02T03:04:05.000Z"),
      expiresAt: new Date("2026-01-02T04:04:05.000Z"),
      // Extra persistence fields must never be included in the view payload.
      sharerId: "user-1",
      shareToken: "secret-token",
      recipientEmail: "contact@example.com",
      id: 1,
    };
    const share = publicLocationShare(storedShare);

    expect(share).toEqual({
      label: "Trip home",
      currentLat: 39.9526,
      currentLng: -75.1652,
      lastUpdatedAt: new Date("2026-01-02T03:04:05.000Z"),
      expiresAt: new Date("2026-01-02T04:04:05.000Z"),
    });
    expect(share).not.toHaveProperty("sharerId");
    expect(share).not.toHaveProperty("recipientEmail");
    expect(share).not.toHaveProperty("shareToken");
  });

  it("accepts only app-supported durations and owner updates before expiry", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/location-shares.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain("new Set([30, 60, 120, 240, 480, 1440])");
    expect(route).toContain("eq(locationSharesTable.sharerId, userId)");
    expect(route).toContain("gt(locationSharesTable.expiresAt, new Date())");
  });

  it("publishes a first native coordinate before claiming the share is live", () => {
    const mobile = readFileSync(
      fileURLToPath(new URL("../../../mobile/app/location-share.tsx", import.meta.url)),
      "utf8",
    );
    const firstUpdate = mobile.indexOf("await publishCurrentLocation(createdShare, token)");
    const activeMessage = mobile.indexOf('"Location Sharing Active"');
    expect(firstUpdate).toBeGreaterThan(-1);
    expect(activeMessage).toBeGreaterThan(firstUpdate);
    expect(mobile).toContain("still waiting for your first location update");
    expect(mobile).toContain("startLocationUpdates(activeShare, token)");
    expect(mobile).toContain("const activeShares = unexpiredShares.filter(hasPublishedCoordinate)");
    expect(mobile).toContain("const waitingShares = unexpiredShares.filter");
    expect(mobile).toContain("Waiting for first location — retrying");
    expect(mobile).toContain("setShares((current) => current.map");
    expect(mobile).toContain("const resumableShare = unexpired.find");
    expect(mobile).toContain("activeShareRef.current = resumableShare");
    expect(mobile).toContain("setActiveShareId(resumableShare?.id ?? null)");
    expect(mobile).toContain("activeShareRef.current?.id === activeShareId");
  });
});
