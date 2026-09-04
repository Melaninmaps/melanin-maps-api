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
});