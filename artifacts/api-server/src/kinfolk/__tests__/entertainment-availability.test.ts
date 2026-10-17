import { describe, expect, it } from "vitest";
import {
  isEntertainmentPreferenceStatement,
  parseEntertainmentAvailabilityRequest,
  resolveEntertainmentAvailability,
} from "../entertainment-availability";

describe("Kinfolk entertainment availability", () => {
  it("recognizes only an explicit current availability request with a title", () => {
    expect(
      parseEntertainmentAvailabilityRequest({
        message: "Where can I watch The Woman King?",
      }),
    ).toMatchObject({ mode: "streaming", title: "The Woman King" });
    expect(
      parseEntertainmentAvailabilityRequest({
        message: "I enjoyed The Woman King.",
      }),
    ).toBeNull();
  });

  it("turns a subscription statement into a consent prompt, not a silent save", () => {
    expect(isEntertainmentPreferenceStatement("I have Netflix and Max.")).toBe(true);
    expect(isEntertainmentPreferenceStatement("Tell me about Black cinema.")).toBe(false);
  });

  it("requires a location for showtimes and never invents a cinema", async () => {
    const request = parseEntertainmentAvailabilityRequest({
      message: 'Showtimes for "Moonlight"',
      countryCode: "US",
    });
    expect(request).toBeTruthy();
    await expect(
      resolveEntertainmentAvailability(request!),
    ).resolves.toMatchObject({
      status: "location_required",
      offers: [],
      showtimes: [],
    });
  });

  it("fails closed when a live provider has not been separately configured", async () => {
    const request = parseEntertainmentAvailabilityRequest({
      message: "Is Moonlight on Netflix?",
      countryCode: "us",
    });
    expect(request).toMatchObject({ title: "Moonlight", countryCode: "US" });
    await expect(
      resolveEntertainmentAvailability(request!),
    ).resolves.toMatchObject({
      status: "provider_not_configured",
      offers: [],
      showtimes: [],
      attribution: null,
    });
  });
});
