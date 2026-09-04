import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  normalizeTrustedContactEmail,
  normalizeTrustedContactPhone,
} from "../routes/trusted-safety-share";
import { trustedSafetyInAppNotification } from "../lib/trustedSafetyShareAlerts";
import { publicLocationShare } from "../routes/location-shares";

describe("Trusted Safety Share contact and delivery privacy", () => {
  it("normalizes cosmetic email and phone differences before deduplication", () => {
    expect(normalizeTrustedContactEmail(" Mom@Example.COM ")).toBe("mom@example.com");
    expect(normalizeTrustedContactPhone("(415) 555-0123")).toBe("+14155550123");
    expect(normalizeTrustedContactPhone("+1 415-555-0123")).toBe("+14155550123");
  });

  it("uses a privacy-safe in-app fallback when push is unavailable", () => {
    const notification = trustedSafetyInAppNotification(
      "share-1", "weather", "Atlanta", "Georgia", "Safety Alert — Amina", "Amina is currently in Atlanta, Georgia.",
    );
    expect(notification).toEqual({
      type: "safety",
      title: "Safety Alert — Amina",
      body: "Amina is currently in Atlanta, Georgia.",
      data: { alertType: "weather", locationCity: "Atlanta", locationRegion: "Georgia", shareId: "share-1" },
    });
    expect(JSON.stringify(notification)).not.toMatch(/ownerId|latitude|longitude|token|search|checkin/i);
  });

  it("keeps the bearer location-view payload free of account identity", () => {
    const view = publicLocationShare({
      label: "Safe arrival",
      currentLat: 33.749,
      currentLng: -84.388,
      lastUpdatedAt: new Date("2026-01-02T03:04:05.000Z"),
      expiresAt: new Date("2026-01-02T04:04:05.000Z"),
    });
    expect(view).not.toHaveProperty("sharerId");
    expect(view).not.toHaveProperty("recipientEmail");
    expect(view).not.toHaveProperty("shareToken");
  });

  it("cannot resume a pending or declined contact without acceptance", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/trusted-safety-share.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain('current.status !== "paused_manual" || current.contact_accepted !== true');
    expect(route).toContain("AND ($1 != 'active' OR contact_accepted = true)");
    expect(route.match(/AND status = 'pending'/g)).toHaveLength(2);
    expect(route.match(/AND contact_accepted = false/g)).toHaveLength(2);
    expect(route.match(/AND invite_expires_at > NOW\(\)/g)).toHaveLength(2);
    expect(route).toContain("AND contact_user_id = $4");
    const delivery = readFileSync(
      fileURLToPath(new URL("../lib/trustedSafetyShareAlerts.ts", import.meta.url)),
      "utf8",
    );
    expect(delivery).toContain("AND contact_accepted = true");
  });

  it("copies the public browser viewer rather than raw API JSON", () => {
    const mobile = readFileSync(
      fileURLToPath(new URL("../../../mobile/app/location-share.tsx", import.meta.url)),
      "utf8",
    );
    expect(mobile).toContain("/safety/location/${encodeURIComponent(");
    expect(mobile).not.toContain("/api/safety/location-shares/${token}/view");
  });
});
