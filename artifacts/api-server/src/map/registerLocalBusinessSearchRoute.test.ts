import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerLocalBusinessSearchRoute } from "./registerLocalBusinessSearchRoute";

describe("local business search route", () => {
  it("uses the separately supplied subject while retaining explicit city scope", async () => {
    const search = vi.fn().mockResolvedValue({
      scope: "local", radiusMi: 5, limit: 2, results: [], pins: [],
      expansion: { available: true, nextRadiusMi: 10, message: "Search within 10 miles?" },
    });
    const app = express();
    registerLocalBusinessSearchRoute(app, { search } as never);

    await request(app)
      .get("/api/map/local-business-search?q=Book%20Store%20Atlanta&subject=bookstore&city=Atlanta&stateCode=GA&lat=33.749&lng=-84.388&radius=5&expand=0")
      .expect(200);

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: "bookstore", city: "Atlanta", stateCode: "GA",
      latitude: 33.749, longitude: -84.388, radiusMi: 5, expansionAccepted: false,
    }));
  });
});