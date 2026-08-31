import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerLocationResolutionRoutes } from "../location/registerLocationResolutionRoutes";

function createApp(rows: unknown[]) {
  const app = express();
  const pool = { query: vi.fn().mockResolvedValue({ rows }) };
  registerLocationResolutionRoutes(app, pool as never);
  return { app, pool };
}

describe("GET /api/locations/resolve", () => {
  it("returns canonical Philadelphia when the table and aliases are not yet seeded", async () => {
    const { app } = createApp([]);
    const response = await request(app).get("/api/locations/resolve").query({ q: "Philadelphia, Pennsylvania" });
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      label: "Philadelphia, PA",
      cityName: "Philadelphia",
      stateCode: "PA",
      neighborhoodName: null,
    });
  });

  it("returns candidates rather than silently selecting a duplicate city name", async () => {
    const candidates = [
      { id: "1", label: "Springfield, IL", cityName: "Springfield", stateCode: "IL", neighborhoodName: null, latitude: 1, longitude: 1 },
      { id: "2", label: "Springfield, MA", cityName: "Springfield", stateCode: "MA", neighborhoodName: null, latitude: 2, longitude: 2 },
    ];
    const { app } = createApp(candidates);
    const response = await request(app).get("/api/locations/resolve").query({ q: "Springfield" });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ code: "AREA_AMBIGUOUS", candidates });
  });

  it("returns AREA_NOT_FOUND without a national substitute", async () => {
    const { app } = createApp([]);
    const response = await request(app).get("/api/locations/resolve").query({ q: "Unknownville ZZ" });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: "AREA_NOT_FOUND" });
  });
});
