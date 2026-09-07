import { afterEach, describe, expect, it, vi } from "vitest";
import * as fetchModule from "../lib/authenticatedFetch";
import {
  emitDiscoveryAnalytics,
  resetDiscoveryAnalyticsPreferenceCache,
} from "../lib/discoveryAnalytics";

describe("safe discovery analytics emitter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDiscoveryAnalyticsPreferenceCache();
  });

  it("does not emit when search-improvement consent is absent", async () => {
    const fetchSpy = vi.spyOn(fetchModule, "authenticatedFetch").mockResolvedValue({
      ok: true,
      json: async () => ({ searchImprovement: false }),
    } as Response);

    await emitDiscoveryAnalytics({
      eventName: "coverage_request",
      surface: "businesses",
      entryPoint: "coverage_request",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith("/api/discovery/v1/preferences");
  });

  it("emits only the allowlisted aggregate event fields", async () => {
    const fetchSpy = vi.spyOn(fetchModule, "authenticatedFetch").mockImplementation(async (url) => {
      if (url === "/api/discovery/v1/preferences") {
        return { ok: true, json: async () => ({ searchImprovement: true, consentVersion: "v1" }) } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    await emitDiscoveryAnalytics({
      eventName: "coverage_request",
      surface: "businesses",
      entryPoint: "coverage_request",
      filters: { categoryIds: ["food-drink"] },
      resultCount: 0,
      zeroResult: true,
    });

    const eventCall = fetchSpy.mock.calls.find(([url]) => url === "/api/discovery/v1/events");
    expect(eventCall).toBeDefined();
    const body = JSON.parse(String(eventCall?.[1]?.body));
    expect(body).toMatchObject({
      eventName: "coverage_request",
      coverageRequested: true,
      filters: { categoryIds: ["food-drink"] },
      resultCount: 0,
      zeroResult: true,
    });
    expect(Object.keys(body)).not.toEqual(expect.arrayContaining([
      "query", "address", "description", "latitude", "longitude", "metadata",
    ]));
  });
});