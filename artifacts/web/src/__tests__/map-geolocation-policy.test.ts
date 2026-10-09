import { describe, expect, it } from "vitest";
import {
  mapGeolocationFailure,
  MAP_GEOLOCATION_TIMEOUT_MS,
  MAP_GEOLOCATION_WATCHDOG_MS,
} from "../lib/mapGeolocationPolicy";

describe("map geolocation fallback policy", () => {
  it("labels denied permission as saved-home fallback rather than live location", () => {
    expect(mapGeolocationFailure(1)).toEqual({
      status: "denied",
      message: expect.stringContaining("saved home area, not your live location"),
    });
  });

  it("uses an explicit finite watchdog when browser geolocation does not settle", () => {
    expect(MAP_GEOLOCATION_TIMEOUT_MS).toBe(12_000);
    expect(MAP_GEOLOCATION_WATCHDOG_MS).toBeGreaterThan(MAP_GEOLOCATION_TIMEOUT_MS);
    expect(mapGeolocationFailure(3)).toEqual({
      status: "timed_out",
      message: expect.stringContaining("did not respond in time"),
    });
  });

  it("does not treat an unknown browser error as a location", () => {
    expect(mapGeolocationFailure(2)).toEqual({
      status: "error",
      message: expect.stringContaining("could not be determined"),
    });
  });
});
