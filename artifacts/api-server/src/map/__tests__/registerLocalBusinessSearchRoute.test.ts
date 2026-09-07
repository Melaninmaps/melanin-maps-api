import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerLocalBusinessSearchRoute } from "../registerLocalBusinessSearchRoute";

describe("local business search route", () => {
  it("uses the separately supplied subject while retaining explicit city scope", async () => {
    const search = vi.fn().mockResolvedValue({
      scope: "local", radiusMi: 5, limit: 2,
      totalRelevantListings: 0, pinnableCount: 0, results: [], pins: [],
      expansion: { available: true, nextRadiusMi: 10, message: "Search within 10 miles?" },
    });
    const app = express();
    registerLocalBusinessSearchRoute(app, { search } as never);

    const response = await request(app)
      .get("/api/map/local-business-search?q=Book%20Store%20Atlanta&subject=bookstore&city=Atlanta&stateCode=GA&lat=33.749&lng=-84.388&radius=5&expand=0&privacy_mode=discovery_v1")
      .expect(200);

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: "bookstore", city: "Atlanta", stateCode: "GA",
      latitude: 33.749, longitude: -84.388, radiusMi: 5, expansionAccepted: false,
    }));
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-location-retention"]).toBe("none");
    expect(response.headers["x-query-retention"]).toBe("none");
  });

  it.each([5, 10, 25])("accepts the governed %i-mile radius", async (radius) => {
    const search = vi.fn().mockResolvedValue({
      scope: radius === 5 ? "local" : "expanded", radiusMi: radius, limit: 2,
      totalRelevantListings: 0, pinnableCount: 0, results: [], pins: [],
      expansion: { available: radius < 25, nextRadiusMi: radius === 5 ? 10 : radius === 10 ? 25 : null, message: null },
    });
    const app = express();
    registerLocalBusinessSearchRoute(app, { search } as never);

    await request(app)
      .get(`/api/map/local-business-search?subject=barber&lat=39.95&lng=-75.16&radius=${radius}&expand=${radius === 5 ? 0 : 1}`)
      .expect(200);
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ radiusMi: radius }));
  });

  it("rejects malformed coordinates and unsupported radius values", async () => {
    const app = express();
    registerLocalBusinessSearchRoute(app, { search: vi.fn() } as never);
    await request(app).get("/api/map/local-business-search?subject=bookstore&lat=x&lng=-75&radius=5").expect(400, { code: "LOCATION_REQUIRED" });
    await request(app).get("/api/map/local-business-search?subject=bookstore&lat=39&lng=-75&radius=50").expect(400, { code: "INVALID_RADIUS" });
  });
});
