import { afterEach, describe, expect, it, vi } from "vitest";
import { executeUniversalDiscoverySearch } from "../lib/discoveryV1";

describe("universal discovery web client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the universal endpoint for broad Map searches with coordinates", async () => {
    const fetchSpy = vi.spyOn(
      await import("../lib/authenticatedFetch"),
      "authenticatedFetch",
    ).mockResolvedValue({
      ok: true,
      json: async () => ({ results: { businesses: [], heritage: [{ id: "site-1" }] } }),
    } as Response);

    const payload = await executeUniversalDiscoverySearch({
      query: "history in Philadelphia",
      surface: "map",
      latitude: 39.9526,
      longitude: -75.1652,
      radiusMiles: 5,
      limit: 20,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/search/universal?q=history+in+Philadelphia&surface=map&limit=20&lat=39.9526&lng=-75.1652&radius=5",
    );
    expect(payload.results.heritage).toHaveLength(1);
  });

  it("does not add a radius when a broad search has no coordinates", async () => {
    const fetchSpy = vi.spyOn(
      await import("../lib/authenticatedFetch"),
      "authenticatedFetch",
    ).mockResolvedValue({
      ok: true,
      json: async () => ({ results: { businesses: [], heritage: [], events: [] } }),
    } as Response);

    await executeUniversalDiscoverySearch({
      query: "festivals",
      surface: "discover",
      city: "Philadelphia",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/search/universal?q=festivals&surface=discover&limit=30&city=Philadelphia",
    );
  });
});