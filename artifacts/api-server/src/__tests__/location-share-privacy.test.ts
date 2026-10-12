import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("consented trusted live location sharing", () => {
  it("requires an authenticated, accepted durable trusted contact before a temporary share starts", () => {
    const route = source("../routes/location-shares.ts");

    expect(route).toContain('router.post("/safety/location-shares", requireFamilySafety');
    expect(route).toContain("liveLocationConsent !== true");
    expect(route).toContain("recipientTrustedShareId");
    expect(route).toContain("tss.contact_type = 'mwm_user'");
    expect(route).toContain("tss.status = 'active'");
    expect(route).toContain("tss.contact_accepted = true");
    expect(route).not.toContain("tss.activated_at > NOW() - INTERVAL '30 days'");
    expect(route).toContain("owner_blocks.id IS NULL");
    expect(route).toContain("recipient_blocks.id IS NULL");
  });

  it("limits sharing to minimized, fresh foreground fixes and removes the fix at lifecycle boundaries", () => {
    const route = source("../routes/location-shares.ts");
    const lifecycle = source("../lib/trustedSafetyShareLifecycle.ts");

    expect(route).toContain("Math.round(coordinate * 10_000) / 10_000");
    expect(route).toContain("MAX_COORDINATE_AGE_MS = 2 * 60 * 1000");
    expect(route).toContain("ls.expires_at > NOW()");
    expect(route).toContain("current_lat = NULL");
    expect(route).toContain("current_lng = NULL");
    expect(route).toContain('updateMode: "foreground_while_screen_open"');
    expect(lifecycle).toContain("UPDATE location_shares");
    expect(lifecycle).toContain("current_lat = NULL");
    expect(lifecycle).toContain("current_lng = NULL");
    expect(lifecycle).toContain("expireTrustedLocationSessions");
    expect(lifecycle).not.toContain("owner_enabled = false");
  });

  it("scrubs retained coordinates when a recipient encounters an expired session", () => {
    const route = source("../routes/location-shares.ts");
    const expiryReadBoundary = route.slice(
      route.indexOf('router.get("/safety/location-shares/:token/view"'),
      route.indexOf('router.delete("/safety/location-shares/:id"'),
    );

    expect(expiryReadBoundary).toContain("expires_at <= NOW()");
    expect(expiryReadBoundary).toContain("SET is_active = false");
    expect(expiryReadBoundary).toContain("current_lat = NULL");
    expect(expiryReadBoundary).toContain("current_lng = NULL");
    expect(expiryReadBoundary).toContain("last_updated_at = NULL");
  });

  it("rechecks recipient authorization on every read and avoids recipient-visible update timestamps", () => {
    const route = source("../routes/location-shares.ts");
    const publicProjection = route.slice(
      route.indexOf("export function publicLocationShare"),
      route.indexOf('router.get("/safety/location-shares"'),
    );
    const returnedRecipientPayload = publicProjection.slice(
      publicProjection.indexOf("return {"),
      publicProjection.indexOf("};", publicProjection.indexOf("return {")),
    );

    expect(route).toContain('router.get("/safety/location-shares/:token/view"');
    expect(route).toContain("ls.recipient_user_id = $2");
    expect(route).toContain("tss.contact_accepted = true");
    expect(route).toContain("setSensitiveResponseHeaders(res)");
    expect(publicProjection).toContain('coordinateState: "current"');
    expect(returnedRecipientPayload).not.toContain("lastUpdatedAt:");
  });

  it("removes startup and retired-route cleanup that could erase Safety data implicitly", () => {
    const index = source("../index.ts");
    const route = source("../routes/location-shares.ts");

    expect(index).not.toContain("retireAllLegacyLocationShares");
    expect(index).not.toContain("DELETE FROM user_locations");
    expect(index).toContain("No startup Safety data cleanup runs here");
    expect(route).not.toContain("retireLocationSharesForMember");
    expect(route).not.toContain("LIVE_LOCATION_SHARING_RETIRED");
  });

  it("keeps native collection foreground-only, explicit, and without public share links", () => {
    const mobile = source("../../../mobile/app/location-share.tsx");

    expect(mobile).toContain('import * as Location from "expo-location"');
    expect(mobile).toContain("Location.requestForegroundPermissionsAsync()");
    expect(mobile).toContain("liveLocationConsent");
    expect(mobile).toContain("accessibilityRole=\"checkbox\"");
    expect(mobile).toContain("foreground");
    expect(mobile).toContain("setInterval");
    expect(mobile).toContain("clearInterval");
    expect(mobile).not.toContain("startLocationUpdatesAsync");
    expect(mobile).not.toContain("Past Shares");
    expect(mobile).not.toContain("Copy Share Link");
    expect(mobile).not.toContain("expo-clipboard");
  });
});
