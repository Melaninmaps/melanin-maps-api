import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearVerifiedRadiusOriginCacheForTest,
  isVerifiedRadiusV1Enabled,
  requestedRadiusMiles,
  resolveVerifiedPublicOrigin,
  VERIFIED_RADIUS_ORIGIN_REQUIRED_REPLY,
} from "../verified-radius-v1";

describe("verified radius v1", () => {
  afterEach(() => {
    clearVerifiedRadiusOriginCacheForTest();
    vi.unstubAllEnvs();
  });

  it("is disabled until the exact production feature flag is set", () => {
    expect(isVerifiedRadiusV1Enabled({ NODE_ENV: "production" })).toBe(false);
    expect(isVerifiedRadiusV1Enabled({ KINFOLK_VERIFIED_RADIUS_V1_ENABLED: "TRUE" })).toBe(false);
    expect(isVerifiedRadiusV1Enabled({ KINFOLK_VERIFIED_RADIUS_V1_ENABLED: "true" })).toBe(true);
  });

  it("parses a bounded numeric radius and preserves the no-origin safeguard", () => {
    expect(requestedRadiusMiles("Black-owned lunch within 10 miles of this hotel")).toBe(10);
    expect(requestedRadiusMiles("a 10-mile radius for Black-owned lunch")).toBe(10);
    expect(requestedRadiusMiles("Black-owned lunch nearby")).toBeNull();
    expect(requestedRadiusMiles("within 120 miles")).toBeNull();
    expect(VERIFIED_RADIUS_ORIGIN_REQUIRED_REPLY).toMatch(/not save it to your Kinfolk memory/i);
  });

  it("accepts only a geocoded public origin in the requested city and state", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{
        lat: "44.9780",
        lon: "-93.2660",
        address: { city: "Minneapolis", state: "Minnesota", "ISO3166-2-lvl4": "US-MN" },
      }],
    });

    await expect(resolveVerifiedPublicOrigin({
      publicOrigin: "A public Minneapolis hotel",
      city: "Minneapolis",
      stateCode: "MN",
      radiusMiles: 10,
      fetchImpl,
    })).resolves.toEqual({
      latitude: 44.978,
      longitude: -93.266,
      resolvedCity: "Minneapolis",
      resolvedStateCode: "MN",
      radiusMiles: 10,
    });
  });

  it("fails closed when the geocoder returns a similarly named origin in another city", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{
        lat: "44.9537",
        lon: "-93.0900",
        address: { city: "Saint Paul", state: "Minnesota", "ISO3166-2-lvl4": "US-MN" },
      }],
    });

    await expect(resolveVerifiedPublicOrigin({
      publicOrigin: "A public metro hotel",
      city: "Minneapolis",
      stateCode: "MN",
      radiusMiles: 10,
      fetchImpl,
    })).resolves.toBeNull();
  });

  it("accepts an active Canadian city scope without treating its province as a US state", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{
        lat: "43.6532",
        lon: "-79.3832",
        address: { city: "Toronto", province: "Ontario", "ISO3166-2-lvl4": "CA-ON" },
      }],
    });

    await expect(resolveVerifiedPublicOrigin({
      publicOrigin: "A public Toronto transit station",
      city: "Toronto",
      stateCode: "ON",
      radiusMiles: 10,
      fetchImpl,
    })).resolves.toMatchObject({
      resolvedCity: "Toronto",
      resolvedStateCode: "ON",
      radiusMiles: 10,
    });
  });
});
