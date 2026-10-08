import { describe, expect, it } from "vitest";
import {
  filterMapPinsForExplicitLocality,
  resolveMapBusinessProximity,
} from "../lib/mapBusinessScope";

describe("native map business scope", () => {
  const deviceLocation = { latitude: 39.9526, longitude: -75.1652 };

  it("does not add a device-radius constraint to an explicitly selected city", () => {
    expect(resolveMapBusinessProximity({
      hasExplicitLocality: true,
      memberLocation: deviceLocation,
    })).toBeNull();
  });

  it("keeps device proximity for an around-me request", () => {
    expect(resolveMapBusinessProximity({
      hasExplicitLocality: false,
      memberLocation: deviceLocation,
    })).toEqual(deviceLocation);
  });

  it("does not invent a location when neither scope supplies one", () => {
    expect(resolveMapBusinessProximity({
      hasExplicitLocality: false,
      memberLocation: null,
    })).toBeNull();
  });

  it("never carries cached canonical pins from a prior city into an explicit city selection", () => {
    const pins = [
      { id: "phl", city: "Philadelphia", state: "PA" },
      { id: "atl", city: "Atlanta", state: "GA" },
    ];
    expect(filterMapPinsForExplicitLocality(pins, { city: "Atlanta", state: "GA" }, true))
      .toEqual([{ id: "atl", city: "Atlanta", state: "GA" }]);
    expect(filterMapPinsForExplicitLocality(pins, { city: "Atlanta" }, true))
      .toEqual([{ id: "atl", city: "Atlanta", state: "GA" }]);
  });

  it("keeps the canonical feed available for an around-me request", () => {
    const pins = [{ id: "phl", city: "Philadelphia", state: "PA" }];
    expect(filterMapPinsForExplicitLocality(pins, null, false)).toEqual(pins);
  });
});
