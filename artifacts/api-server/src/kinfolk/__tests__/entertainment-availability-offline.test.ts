import { describe, expect, it } from "vitest";
import {
  createOfflineEntertainmentProvider,
  parseEntertainmentAvailabilityRequest,
  resolveEntertainmentAvailability,
} from "../entertainment-availability";
import { BLACK_PANTHER_US_FIXTURE, PROVIDER_ERROR_FIXTURE } from "../__fixtures__/entertainment-availability-fixtures";

describe("offline entertainment availability contract", () => {
  it("keeps ordinary entertainment conversation outside the live-data route", () => {
    expect(parseEntertainmentAvailabilityRequest({ message: "Why is this album culturally important?" })).toBeNull();
  });

  it("recognizes title-less theater discovery without inventing a title", () => {
    expect(parseEntertainmentAvailabilityRequest({ message: "What Black movies are playing near me?" })).toMatchObject({ mode: "showtimes", title: null });
  });

  it("requires city and title before showtime results", async () => {
    const request = parseEntertainmentAvailabilityRequest({ message: "Find me a showing tonight", countryCode: "US" })!;
    expect((await resolveEntertainmentAvailability(request)).status).toBe("location_required");
    expect((await resolveEntertainmentAvailability({ ...request, city: "Atlanta" })).status).toBe("title_required");
  });

  it("filters a fixture to saved, no-extra-cost streaming services", async () => {
    const result = await resolveEntertainmentAvailability(
      { mode: "streaming", title: "Black Panther", countryCode: "US", city: null, requestedDate: null },
      { streamingServices: ["Disney+"], entertainmentCostPolicy: "included_only" },
      createOfflineEntertainmentProvider(BLACK_PANTHER_US_FIXTURE),
    );
    expect(result.status).toBe("available");
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]).toMatchObject({ providerName: "Disney+", monetizationType: "flatrate" });
  });

  it("does not claim included availability before a member chooses services", async () => {
    const result = await resolveEntertainmentAvailability(
      { mode: "streaming", title: "Black Panther", countryCode: "US", city: null, requestedDate: null },
      { streamingServices: [], entertainmentCostPolicy: "included_only" },
      createOfflineEntertainmentProvider(BLACK_PANTHER_US_FIXTURE),
    );
    expect(result.status).toBe("needs_subscription_preference");
  });

  it("returns a truthful provider failure instead of a fabricated offer", async () => {
    const result = await resolveEntertainmentAvailability(
      { mode: "streaming", title: "Black Panther", countryCode: "US", city: null, requestedDate: null },
      { streamingServices: [], entertainmentCostPolicy: "any" },
      createOfflineEntertainmentProvider(PROVIDER_ERROR_FIXTURE),
    );
    expect(result.status).toBe("provider_error");
    expect(result.offers).toEqual([]);
  });
});
