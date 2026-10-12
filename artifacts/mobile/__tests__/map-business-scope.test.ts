import { describe, expect, it } from "vitest";
import {
  isDirectNamedSafetyContext,
  matchesExplicitMapLocality,
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

  it("keeps only normalized city/state-matching canonical pins for an explicit locality", () => {
    expect(matchesExplicitMapLocality(
      { city: "St. Louis", state: "MO" },
      { city: " st louis ", state: "mo." },
    )).toBe(true);
    expect(matchesExplicitMapLocality(
      { city: "Philadelphia", state: "PA" },
      { city: "St. Louis", state: "MO" },
    )).toBe(false);
  });

  it("leaves canonical pins eligible for around-me and incomplete-locality scopes", () => {
    const previousCityPin = { city: "Philadelphia", state: "PA" };

    expect(matchesExplicitMapLocality(previousCityPin, null)).toBe(true);
    expect(matchesExplicitMapLocality(
      previousCityPin,
      { city: "Philadelphia" },
    )).toBe(true);
  });

  it("identifies only direct-name safety context as non-Map search results", () => {
    expect(isDirectNamedSafetyContext("direct_named_safety_context")).toBe(true);
    expect(isDirectNamedSafetyContext("explicit_public_listing")).toBe(false);
    expect(isDirectNamedSafetyContext("diaspora_promotion_catalog")).toBe(false);
    expect(isDirectNamedSafetyContext(null)).toBe(false);
  });
});
