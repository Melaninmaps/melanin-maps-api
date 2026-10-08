import { describe, expect, it } from "vitest";
import { resolveMapBusinessProximity } from "../lib/mapBusinessScope";

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
});
