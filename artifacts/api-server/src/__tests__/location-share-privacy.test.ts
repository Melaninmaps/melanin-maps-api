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
    expect(route).toContain("ls.expires_at > NOW()");
    expect(route).toContain("Location share label must be at most");
  });

  it("requires an accepted, unblocked recipient relationship for every coordinate read", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/location-shares.ts", import.meta.url)),
      "utf8",
    );
    const trustedShares = readFileSync(
      fileURLToPath(new URL("../routes/trusted-safety-share.ts", import.meta.url)),
      "utf8",
    );
    const lifecycle = readFileSync(
      fileURLToPath(new URL("../lib/trustedSafetyShareLifecycle.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain("recipientTrustedShareId");
    expect(route).toContain("tss.contact_accepted = true");
    expect(route).toContain("tss.status = 'active'");
    expect(route).toContain("owner_blocks.id IS NULL");
    expect(route).toContain("recipient_blocks.id IS NULL");
    expect(route).toContain("Recipient authorization required");
    expect(route).toContain("MAX_COORDINATE_AGE_MS");
    expect(route).toContain("This location is no longer current");
    expect(route).toContain("tss.activated_at > NOW() - INTERVAL '30 days'");
    expect(route).toContain("COALESCE(recipient.account_status, 'active') = 'active'");
    expect(route).toContain("minimizeLocationCoordinate(lat)");
    expect(route).toContain("deactivateIneligibleLocationShares(userId)");
    expect(route).toContain("currentLat: null, currentLng: null, lastUpdatedAt: null");
    expect(trustedShares).toContain("deactivateTrustedLocationShares");
    expect(lifecycle).toContain("UPDATE location_shares");
    expect(lifecycle).toContain("current_lat = NULL");
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
    expect(mobile).toContain("will not see a location until the first update succeeds");
    expect(mobile).toContain("startLocationUpdates(activeShare, token)");
    expect(mobile).toContain("const activeShares = unexpiredShares.filter(hasPublishedCoordinate)");
    expect(mobile).toContain("const waitingShares = unexpiredShares.filter");
    expect(mobile).toContain("Waiting for first location — retrying");
    expect(mobile).toContain("setShares((current) => current.map");
    expect(mobile).toContain("const resumableShare = unexpired.find");
    expect(mobile).toContain("activeShareRef.current = resumableShare");
    expect(mobile).toContain("setActiveShareId(resumableShare?.id ?? null)");
    expect(mobile).toContain("activeShareRef.current?.id === activeShareId");
    expect(mobile).toContain("recipientTrustedShareId: selectedRecipientId");
    expect(mobile).toContain("Accepted Kinfolk Contact");
    expect(mobile).toContain("AppState.addEventListener");
    expect(mobile).toContain('if (appStateRef.current !== "active") return null;');
    expect(mobile).not.toContain("currentLat:");
    expect(mobile).not.toContain("currentLng:");
    expect(mobile).not.toContain("Copy Share Link");
    expect(mobile).not.toContain("Copy Pending Link");
  });
});
