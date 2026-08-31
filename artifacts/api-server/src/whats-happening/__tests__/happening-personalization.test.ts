import { describe, expect, it } from "vitest";
import {
  APPROVED_TOPIC_SYNONYMS,
  isLocalStory,
  normalizeHappeningCategory,
  normalizeHomeState,
} from "../../lib/happening-personalization";

describe("Happening Now privacy-safe personalization", () => {
  it("normalizes home state to its canonical postal identifier", () => {
    expect(normalizeHomeState(" Pennsylvania ")).toBe("PA");
    expect(normalizeHomeState("pa")).toBe("PA");
    expect(normalizeHomeState("not a state")).toBeNull();
  });

  it("does not cross a local city boundary unless state expansion was explicitly selected", () => {
    const cities = new Set(["philadelphia"]);
    const nearby = { scope: "local", city: "Philadelphia", state: "PA" };
    const otherCity = { scope: "local", city: "Pittsburgh", state: "PA" };
    expect(isLocalStory(nearby, cities, "PA", false)).toBe(true);
    expect(isLocalStory(otherCity, cities, "PA", false)).toBe(false);
    expect(isLocalStory(otherCity, cities, "PA", true)).toBe(true);
  });

  it("only expands governed topic synonyms", () => {
    expect(APPROVED_TOPIC_SYNONYMS.redistricting).toBe("politics");
    expect(normalizeHappeningCategory("redistricting")).toBe("politics");
    expect(normalizeHappeningCategory("my private search phrase")).toBeNull();
  });

  it("keeps avoided categories canonical for explicit For You exclusion", () => {
    const avoided = new Set(["politics"]);
    expect(avoided.has(normalizeHappeningCategory("redistricting")!)).toBe(true);
  });
});