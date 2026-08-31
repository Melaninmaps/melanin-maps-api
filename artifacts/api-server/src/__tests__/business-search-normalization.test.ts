import { describe, expect, it } from "vitest";
import {
  BUSINESS_SEARCH_NORMALIZATION_VERSION,
  getBusinessCategorySearchAliases,
  matchesBusinessCategoryIntent,
  normalizeBusinessCategoryIntent,
  RESTAURANT_CAPABLE_FOOD_INTENT,
} from "@workspace/constants";

describe("business search normalization v1", () => {
  it("maps the approved food and restaurant labels to one stable intent", () => {
    expect(BUSINESS_SEARCH_NORMALIZATION_VERSION).toBe(1);
    for (const label of ["Food", "Food & Drink", "Restaurant", "Restaurants"]) {
      expect(normalizeBusinessCategoryIntent(label)).toBe(RESTAURANT_CAPABLE_FOOD_INTENT);
    }
  });

  it("matches an AMINA-like Food / Restaurants record for both Finder inputs", () => {
    expect(matchesBusinessCategoryIntent("Food & Drink", "Food", "Restaurants")).toBe(true);
    expect(matchesBusinessCategoryIntent("Restaurant", "Food", "Restaurants")).toBe(true);
    expect(getBusinessCategorySearchAliases("restaurant")).toEqual([
      "food",
      "food drink",
      "restaurant",
      "restaurants",
    ]);
  });

  it("does not broaden unrelated category intents", () => {
    expect(matchesBusinessCategoryIntent("Beauty", "Food", "Restaurants")).toBe(false);
    expect(normalizeBusinessCategoryIntent("Professional Services")).toBe("professional services");
  });
});
