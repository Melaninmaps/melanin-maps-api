import { describe, expect, it } from "vitest";
import {
  hasTrustworthyMapCoordinate,
  isLegacyCityCenterPlaceholderCoordinate,
  MAP_LOCATION_HOLD_REASON,
} from "../mapCoordinateIntegrity";

describe("map coordinate integrity", () => {
  it("holds an exact known city-center fallback without removing its listing", () => {
    const coordinate = {
      city: "Houston",
      stateCode: "TX",
      latitude: "29.7604000",
      longitude: "-95.3698000",
    };

    expect(isLegacyCityCenterPlaceholderCoordinate(coordinate)).toBe(true);
    expect(hasTrustworthyMapCoordinate(coordinate)).toBe(false);
    expect(MAP_LOCATION_HOLD_REASON).toBe(
      "legacy_city_center_coordinate_requires_verified_geocode",
    );
  });

  it("does not reject a nearby but distinct verified coordinate", () => {
    const coordinate = {
      city: "Houston",
      stateCode: "TX",
      latitude: 29.7611,
      longitude: -95.3698,
    };

    expect(isLegacyCityCenterPlaceholderCoordinate(coordinate)).toBe(false);
    expect(hasTrustworthyMapCoordinate(coordinate)).toBe(true);
  });

  it("keeps malformed and Null Island coordinates mapless", () => {
    expect(hasTrustworthyMapCoordinate({
      city: "Philadelphia",
      stateCode: "PA",
      latitude: 0,
      longitude: 0,
    })).toBe(false);
    expect(hasTrustworthyMapCoordinate({
      city: "Philadelphia",
      stateCode: "PA",
      latitude: "not-a-number",
      longitude: -75.1652,
    })).toBe(false);
  });
});
