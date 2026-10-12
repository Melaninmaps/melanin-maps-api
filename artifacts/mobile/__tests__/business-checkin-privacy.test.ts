import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const privateCheckinScreen = source("../app/business-checkin.tsx");
const checkinHook = source("../hooks/useCheckins.ts");
const businessScreen = source("../app/business/[id].tsx");

function section(content: string, start: string, end: string): string {
  const startAt = content.indexOf(start);
  const endAt = content.indexOf(end, startAt);
  expect(startAt).toBeGreaterThanOrEqual(0);
  expect(endAt).toBeGreaterThan(startAt);
  return content.slice(startAt, endAt);
}

describe("native business Check-In privacy", () => {
  it("does not request device location or submit coordinates for a private Check-In", () => {
    expect(privateCheckinScreen).not.toContain("expo-location");
    expect(privateCheckinScreen).not.toContain("requestForegroundPermissionsAsync");
    expect(privateCheckinScreen).not.toContain("getCurrentPositionAsync");
    expect(privateCheckinScreen).toContain("JSON.stringify({ businessId })");
    expect(privateCheckinScreen).toContain("Private check-in saved");
    expect(privateCheckinScreen).toContain("does not request, use, or share your location");
  });

  it("keeps the reusable Check-In hook coordinate-free", () => {
    expect(checkinHook).toContain("async (businessId: string)");
    expect(checkinHook).toContain("body: JSON.stringify({ businessId })");
    expect(checkinHook).not.toContain("distanceMeters");
    expect(checkinHook).not.toContain("verifiedLocation");
    expect(checkinHook).not.toContain("lat?: number");
  });

  it("keeps a business-card Check-In separate from optional directions and removes route Safety overlays", () => {
    const handler = section(businessScreen, "const handleCheckIn = async", "return (");
    expect(handler).toContain("checkIn(business.id)");
    expect(handler).not.toContain("expo-location");
    expect(handler).not.toContain("getCurrentPositionAsync");
    expect(handler).not.toContain("GPS verified");
    expect(businessScreen).not.toContain("/api/directions/safety-context");
    expect(businessScreen).not.toContain("Checking route safety");
    expect(businessScreen).not.toContain("ACTIVE ALERTS ALONG ROUTE");
  });
});
