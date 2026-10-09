import { describe, expect, it } from "vitest";
import {
  isFiniteMapCoordinate,
  mapDistanceOriginContext,
  normalizeManualMapDistanceOrigin,
  resolveMapDistanceOrigin,
} from "../lib/mapDistanceOrigin";

describe("map distance origin policy", () => {
  it("keeps a manual origin browser-local and gives it explicit precedence for distance labels", () => {
    const manual = {
      lat: 29.7604,
      lng: -95.3698,
      label: "Houston, TX, USA",
      source: "manual" as const,
    };

    expect(resolveMapDistanceOrigin(manual, { lat: 39.9526, lng: -75.1652 })).toEqual(manual);
    expect(mapDistanceOriginContext(manual)).toBe("from Houston, TX, USA");
  });

  it("uses device coordinates only when a member has not selected a manual origin", () => {
    const origin = resolveMapDistanceOrigin(null, { lat: 39.9526, lng: -75.1652 });

    expect(origin).toEqual({
      lat: 39.9526,
      lng: -75.1652,
      label: "your current location",
      source: "device",
    });
    expect(origin && mapDistanceOriginContext(origin)).toBe("from your current location");
    expect(resolveMapDistanceOrigin(null, null)).toBeNull();
  });

  it("rejects blank, control-character, and oversized manual place labels", () => {
    expect(normalizeManualMapDistanceOrigin("  West Philadelphia \n")).toBe("West Philadelphia");
    expect(normalizeManualMapDistanceOrigin("\u0000\n\t")).toBeNull();
    expect(normalizeManualMapDistanceOrigin("x".repeat(121))).toBeNull();
  });

  it("requires finite coordinates from the client-side geocoder", () => {
    expect(isFiniteMapCoordinate(39.9526)).toBe(true);
    expect(isFiniteMapCoordinate(Number.NaN)).toBe(false);
    expect(isFiniteMapCoordinate("39.9526")).toBe(false);
  });
});
