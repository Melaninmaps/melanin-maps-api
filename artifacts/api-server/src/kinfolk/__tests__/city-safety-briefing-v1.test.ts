import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CITY_SAFETY_CITY_CENTERS,
  CITY_SAFETY_SOURCE_REGISTRY,
  citySafetyCityId,
  citySafetySourcesForResponse,
  clearCitySafetyBriefingCacheForTests,
  currentCitySafetyBriefing,
  fetchAndNormalizeSafetySource,
  isCitySafetyBriefingV1Enabled,
  renderDirectCitySafetyBriefing,
  renderCitySafetyBriefing,
  requestsCurrentCitySafetyBriefing,
} from "../city-safety-briefing-v1";

describe("city safety briefing v1", () => {
  afterEach(() => {
    clearCitySafetyBriefingCacheForTests();
    vi.unstubAllEnvs();
  });

  it("is disabled until production receives the exact city-safety flag", () => {
    expect(isCitySafetyBriefingV1Enabled({ NODE_ENV: "production" })).toBe(false);
    expect(isCitySafetyBriefingV1Enabled({ CITY_SAFETY_BRIEFING_V1: "TRUE" })).toBe(false);
    expect(isCitySafetyBriefingV1Enabled({ CITY_SAFETY_BRIEFING_V1: "true" })).toBe(true);
  });

  it("has a bounded official weather source for every active city scope", () => {
    expect(CITY_SAFETY_CITY_CENTERS).toHaveLength(58);
    const registeredCityIds = new Set(CITY_SAFETY_SOURCE_REGISTRY.map((source) => source.cityId));
    for (const city of CITY_SAFETY_CITY_CENTERS) {
      expect(registeredCityIds).toContain(city.cityId);
    }
    expect(CITY_SAFETY_SOURCE_REGISTRY.filter((source) => source.topic === "weather")).toHaveLength(58);
    for (const source of CITY_SAFETY_SOURCE_REGISTRY) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.freshnessMinutes).toBeGreaterThanOrEqual(5);
      expect(source.freshnessMinutes).toBeLessThanOrEqual(180);
      expect(source.publisherClass).toMatch(/^official_/);
    }
  });

  it("binds exactly to canonical city and state combinations", () => {
    expect(citySafetyCityId({ city: "Minneapolis", stateCode: "MN" })).toBe("minneapolis-mn");
    expect(citySafetyCityId({ city: "Philadelphia", stateCode: "PA" })).toBe("philadelphia-pa");
    expect(citySafetyCityId({ city: "Houston", stateCode: "TX" })).toBe("houston-tx");
    expect(citySafetyCityId({ city: "Atlanta", stateCode: "GA" })).toBe("atlanta-ga");
    expect(citySafetyCityId({ city: "Toronto", stateCode: "ON" })).toBe("toronto-on");
    expect(citySafetyCityId({ city: "Minneapolis", stateCode: "PA" })).toBeNull();
    expect(citySafetyCityId({ city: "Saint Paul", stateCode: "MN" })).toBeNull();
  });

  it("recognizes explicit current safety and transit questions without treating ordinary business requests as safety", () => {
    expect(requestsCurrentCitySafetyBriefing(
      "What current, source-backed safety and transit considerations should I know before I go to Minneapolis?",
    )).toBe(true);
    expect(requestsCurrentCitySafetyBriefing(
      "Are there current transit service alerts in Philadelphia today?",
    )).toBe(true);
    expect(requestsCurrentCitySafetyBriefing(
      "Are there any current ICE actions in Minneapolis I should know about before I travel?",
    )).toBe(true);
    expect(requestsCurrentCitySafetyBriefing(
      "Find a Black-owned lunch restaurant in Houston.",
    )).toBe(false);
    expect(requestsCurrentCitySafetyBriefing(
      "Find a shellfish-safe Black-owned dinner in Minneapolis.",
    )).toBe(false);
  });

  it("returns City immigration resources without treating them as proof of nearby activity", async () => {
    const result = await currentCitySafetyBriefing({
      cityId: "minneapolis-mn",
      now: new Date("2026-09-28T12:00:00.000Z"),
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ features: [] }),
        text: async () => "No active source marker",
      }),
    });

    expect(result.officialLinks).toEqual(expect.arrayContaining([
      expect.objectContaining({ topic: "immigration", url: expect.stringContaining("city-federal-response") }),
      expect.objectContaining({ topic: "immigration", url: expect.stringContaining("know-your-rights-and-resources") }),
    ]));
    const reply = renderDirectCitySafetyBriefing("Minneapolis", result);
    expect(reply).toContain("do not have a verified location-specific ICE activity report");
    expect(reply).toContain("Know Your Rights and Resources");
    expect(reply).not.toMatch(/you are safe|no ICE activity/i);
  });

  it("returns an active official condition only from an unexpired official source", async () => {
    const source = CITY_SAFETY_SOURCE_REGISTRY.find((item) => item.id === "houston-nws-alerts")!;
    const now = new Date("2026-09-28T12:00:00.000Z");
    const evidence = await fetchAndNormalizeSafetySource({
      source,
      now,
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          features: [{
            properties: {
              headline: "Heat Advisory",
              description: "Heat index values may reach 108 degrees.",
              expires: "2026-09-28T16:00:00.000Z",
            },
          }],
        }),
        text: async () => "",
      }),
    });
    expect(evidence).toEqual([expect.objectContaining({
      cityId: "houston-tx",
      title: "Heat Advisory",
      activeOfficialAlert: false,
    })]);

    const expired = await fetchAndNormalizeSafetySource({
      source,
      now: new Date("2026-09-29T12:00:00.000Z"),
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ features: [{ properties: { headline: "Old", expires: "2026-09-28T16:00:00.000Z" } }] }),
        text: async () => "",
      }),
    });
    expect(expired).toEqual([]);
  });

  it("fails closed when official sources have no extractable current condition and still exposes official links", async () => {
    const result = await currentCitySafetyBriefing({
      cityId: "philadelphia-pa",
      now: new Date("2026-09-28T12:00:00.000Z"),
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ features: [] }),
        text: async () => "No active source marker",
      }),
    });

    expect(result.unavailable).toBe(true);
    expect(result.evidence).toEqual([]);
    expect(citySafetySourcesForResponse(result)).toEqual(
      expect.arrayContaining([expect.objectContaining({ url: expect.stringMatching(/^https:\/\//) })]),
    );
    expect(renderCitySafetyBriefing(result)).toMatch(/could not verify a current city-specific safety condition/i);
    expect(renderCitySafetyBriefing(result)).not.toMatch(/\bsafe\b/i);
    const directReply = renderDirectCitySafetyBriefing("Philadelphia", result);
    expect(directReply).toMatch(/official sources/i);
    expect(directReply).not.toMatch(/hotel|restaurant/i);
    expect(directReply).toMatch(/will not turn this into a business recommendation/i);
  });

  it("rejects a cross-city evidence payload at the rendering boundary", () => {
    expect(() => renderCitySafetyBriefing({
      cityId: "houston-tx",
      unavailable: false,
      officialLinks: [],
      evidence: [{
        sourceId: "test",
        cityId: "philadelphia-pa",
        topic: "official_alert",
        publisherClass: "official_emergency",
        activeOfficialAlert: true,
        title: "Wrong city",
        url: "https://official.example.test/",
        summary: "Wrong city source",
        retrievedAt: "2026-09-28T12:00:00.000Z",
        expiresAt: "2026-09-28T13:00:00.000Z",
      }],
    })).toThrow("CITATION_GEO_MISMATCH");
  });

  it("does not turn Houston normal operations into an active safety conclusion", async () => {
    const result = await currentCitySafetyBriefing({
      cityId: "houston-tx",
      now: new Date("2026-09-28T12:00:00.000Z"),
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ features: [] }),
        text: async () => "Emergency Operations Center Activation Level Normal Operations.",
      }),
    });
    expect(result.evidence).toEqual([]);
    expect(renderCitySafetyBriefing(result)).not.toMatch(/normal operations/i);
    expect(renderCitySafetyBriefing(result)).not.toMatch(/\bsafe\b/i);
  });
});
