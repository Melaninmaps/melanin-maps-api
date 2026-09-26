import { describe, expect, it } from "vitest";
import { parseBusinessMapSearchPhrase } from "../features/map/parseBusinessMapSearchPhrase";

describe("parseBusinessMapSearchPhrase", () => {
  it("separates ownership, category, and explicit city for a directory-to-Map handoff", () => {
    expect(parseBusinessMapSearchPhrase("Black-owned restaurants in Philadelphia, PA")).toEqual({
      search: "",
      city: "Philadelphia",
      stateCode: "PA",
      ownership: "black-owned",
      category: "Food & Drink",
    });
  });

  it("keeps a VIBE phrase while retaining typed geography", () => {
    expect(parseBusinessMapSearchPhrase("Date Night in Philadelphia, PA")).toEqual({
      search: "Date Night",
      city: "Philadelphia",
      stateCode: "PA",
      ownership: undefined,
      category: undefined,
    });
  });
});
