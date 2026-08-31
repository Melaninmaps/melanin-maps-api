import { describe, expect, it } from "vitest";
import {
  HERITAGE_CITIES,
  destinationForEnabledSession,
  getHeritageCity,
  resolveHeritageCity,
  resolveTurnGeography,
} from "../heritage-city-registry";

describe("canonical heritage-city geography resolution", () => {
  const philadelphiaVariants = [
    "Philadelphia",
    "Philadelphia, PA",
    "Philadelphia PA",
    "Philadelphia, Pennsylvania",
    "Philly",
    "City of Brotherly Love",
  ];

  for (const variant of philadelphiaVariants) {
    it(`resolves ${variant} to Philadelphia, PA`, () => {
      expect(resolveHeritageCity(`tell me about ${variant}`)).toMatchObject({
        city: "Philadelphia",
        state: "PA",
      });
    });
  }

  it("resolves the canonical city when it is the complete query", () => {
    expect(resolveHeritageCity("Philadelphia")).toMatchObject({
      city: "Philadelphia",
      state: "PA",
      matchKind: "canonical",
    });
  });

  it("is reusable for existing cities without demographic attributes", () => {
    expect(HERITAGE_CITIES.length).toBeGreaterThan(40);
    expect(resolveHeritageCity("nightlife in the windy city")).toMatchObject({
      city: "Chicago",
      state: "IL",
    });
    expect(getHeritageCity("Atlanta, Georgia")).toMatchObject({
      city: "Atlanta",
      state: "GA",
    });
    for (const entry of HERITAGE_CITIES) {
      expect(entry).not.toHaveProperty("demographic");
      expect(entry).not.toHaveProperty("ethnicity");
      expect(entry).not.toHaveProperty("culture");
    }
  });

  it("uses boundaries so short aliases do not match inside ordinary words", () => {
    expect(resolveHeritageCity("Tell me about lasting traditions")).toBeNull();
    expect(resolveHeritageCity("What is special about scallions?")).toBeNull();
  });

  it("does not treat ambiguous shorthand or neighborhood names as a city", () => {
    expect(resolveHeritageCity("I work in DC power systems")).toBeNull();
    expect(resolveHeritageCity("I am visiting Compton")).toBeNull();
    expect(resolveHeritageCity("The bay is calm today")).toBeNull();
  });
});

describe("turn geography and enabled-session continuity", () => {
  it("resolves each confirmed Philadelphia screenshot query on the current turn", () => {
    const queries = [
      "tell me about Philadelphia",
      "Philadelphia heritage sites",
      "what Black history should I know about Philadelphia",
      "Tell me about Philly nightlife",
    ];

    for (const query of queries) {
      expect(resolveTurnGeography(query, null)).toMatchObject({
        city: "Philadelphia",
        state: "PA",
        currentTurn: true,
      });
    }
  });

  it("continues Philadelphia on a follow-up only through an existing enabled session destination", () => {
    expect(
      resolveTurnGeography(
        "What Black history should I know about it?",
        "Philadelphia",
      ),
    ).toEqual({
      city: "Philadelphia",
      state: "PA",
      source: "session",
      currentTurn: false,
      matchedText: null,
    });
    expect(
      resolveTurnGeography("What Black history should I know about it?", null),
    ).toBeNull();
  });

  it("lets a new current-turn city override an old session destination", () => {
    expect(
      resolveTurnGeography("Actually, tell me about Atlanta", "Philadelphia"),
    ).toMatchObject({
      city: "Atlanta",
      state: "GA",
      source: "explicit",
      currentTurn: true,
    });
  });

  it("prefers an explicit destination over another city mentioned in the request", () => {
    expect(
      resolveTurnGeography("I am traveling from Philadelphia to Atlanta", null),
    ).toMatchObject({
      city: "Atlanta",
      state: "GA",
      source: "explicit",
      currentTurn: true,
    });
  });

  it("persists server-resolved geography instead of a conflicting model destination", () => {
    const turn = resolveTurnGeography("Tell me about Philly nightlife", null);
    expect(
      destinationForEnabledSession({
        turn,
        existingDestination: null,
        modelDestination: "Pittsburgh",
      }),
    ).toBe("Philadelphia");
  });
});
