import { describe, expect, it, vi } from "vitest";
import {
  extractLiveWeatherLocation,
  isLiveWeatherQuestion,
  resolveAuthoritativeWeather,
} from "../authoritative-weather";

function jsonResponse(value: unknown): Response {
  return {
    ok: true,
    json: async () => value,
  } as Response;
}

describe("authoritative live weather", () => {
  it("recognizes weather questions without treating a general knowledge question as a forecast", () => {
    expect(isLiveWeatherQuestion("What is the weather in Jamison PA?")).toBe(true);
    expect(isLiveWeatherQuestion("Will it rain in Jamison tonight?")).toBe(true);
    expect(isLiveWeatherQuestion("Why is the sun so hot?")).toBe(false);
  });

  it("uses an explicitly named city before a conversational city hint", () => {
    expect(extractLiveWeatherLocation("What is the weather in Jamison PA?", "Philadelphia"))
      .toBe("Jamison PA");
    expect(extractLiveWeatherLocation("Will it rain tonight?", "Philadelphia"))
      .toBe("Philadelphia");
    expect(extractLiveWeatherLocation("Will it rain tonight?", null)).toBeNull();
  });

  it("builds one dated, source-linked response from provider data without model generation", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        results: [{
          latitude: 40.25483,
          longitude: -75.08934,
          name: "Jamison",
          admin1: "Pennsylvania",
          timezone: "America/New_York",
        }],
      }))
      .mockResolvedValueOnce(jsonResponse({
        current: {
          time: "2026-09-26T16:45",
          temperature_2m: 62.2,
          apparent_temperature: 56,
          weathercode: 3,
          windspeed_10m: 17,
        },
        hourly: {
          time: [
            "2026-09-26T16:45",
            "2026-09-26T17:45",
            "2026-09-26T18:45",
            "2026-09-27T00:45",
          ],
          temperature_2m: [62.2, 61.8, 58.7, 58.9],
          precipitation_probability: [21, 34, 37, 9],
          weathercode: [3, 3, 61, 3],
        },
      }));

    const answer = await resolveAuthoritativeWeather(
      "Jamison PA",
      fetcher as unknown as typeof fetch,
    );

    expect(answer).toMatchObject({
      location: { city: "Jamison", state: "Pennsylvania" },
      asOf: "2026-09-26T16:45 America/New_York",
    });
    expect(answer?.reply).toContain("Live weather for Jamison, Pennsylvania");
    expect(answer?.reply).toContain("Right now: 62°F (feels like 56°F), overcast, wind 17 mph.");
    expect(answer?.reply).toContain("Source: Open-Meteo live weather data.");
    expect(answer?.source.url).toContain("api.open-meteo.com/v1/forecast?");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the weather provider does not return a usable place", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    await expect(
      resolveAuthoritativeWeather("not a real place", fetcher as unknown as typeof fetch),
    ).resolves.toBeNull();
  });
});
