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
});