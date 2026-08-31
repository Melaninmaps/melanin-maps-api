import { describe, expect, it } from "vitest";
import { locationResolutionErrorMessage } from "../features/location/locationResolutionMessages";

describe("location resolver UI messages", () => {
  it("gives a canonical Philadelphia example for an unsupported area", () => {
    expect(locationResolutionErrorMessage(404)).toContain("Philadelphia, PA");
  });

  it("asks for state disambiguation when duplicate city names are returned", () => {
    expect(locationResolutionErrorMessage(409)).toContain("Add the state");
  });
});
