import { describe, expect, it } from "vitest";
import { BUSINESS_SEARCH_NORMALIZATION_VERSION } from "@workspace/constants";
import { buildBusinessDirectoryQuery } from "../features/businesses/businessDirectoryQuery";

describe("Finder query builder", () => {
  it("keeps Philadelphia and state scope while sending chip and free-text Restaurant intent", () => {
    const payload = buildBusinessDirectoryQuery({
      location: {
        city: "Philadelphia",
        stateCode: "PA",
        neighborhood: null,
        latitude: null,
        longitude: null,
        source: "explicit",
      },
      category: "Food & Drink",
      specialty: null,
      ownership: [],
      searchText: " Restaurant ",
    });

    expect(payload.locationMode).toBe("exact");
    expect(payload.location).toMatchObject({ city: "Philadelphia", stateCode: "PA" });
    expect(payload.filters.category).toBe("Food & Drink");
    expect(payload.filters.categoryNormalizationVersion).toBe(BUSINESS_SEARCH_NORMALIZATION_VERSION);
    expect(payload.searchText).toBe("Restaurant");
  });
});
