import express from "express";
import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { registerLocationFirstDiscoveryRoutes } from "../registerLocationFirstDiscoveryRoutes";

const query = {
  surface: "explore",
  location: { city: "Philadelphia", stateCode: "PA", neighborhood: null, latitude: null, longitude: null },
  locationMode: "exact",
  radiusMiles: null,
  filters: {
    recordTypes: ["cultural_site", "community_place", "event"],
    category: null,
    specialty: null,
    ownership: [],
    tagSlugs: [],
    dateRange: null,
  },
};

describe("location-first discovery route", () => {
  it("returns a truthful coverage gap when optional Explore inventory relations are absent", async () => {
    const app = express();
    app.use(express.json());
    registerLocationFirstDiscoveryRoutes(app, {
      async findExact() {
        const error = Object.assign(new Error('relation "canonical_record_locations" does not exist'), { code: "42P01" });
        throw error;
      },
      async findNearestAvailableLocation() { return null; },
      async recordCoverageGap() {},
      async recordFlywheelSignal() {},
    });

    const response = await supertest(app).post("/api/discovery/query").send(query);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      requiresLocation: false,
      records: [],
      coverageGap: { city: "Philadelphia", stateCode: "PA" },
      nearestAvailableLocation: null,
    });
    expect(response.body.suggestedActions).toEqual([
      "expand_radius",
      "show_nearest_city",
      "submit_event",
    ]);
  });

  it("fails closed with a coverage gap when a legacy HBCU publication column is absent", async () => {
    const app = express();
    app.use(express.json());
    registerLocationFirstDiscoveryRoutes(app, {
      async findExact() {
        throw Object.assign(new Error('column "is_published" does not exist'), { code: "42703" });
      },
      async findNearestAvailableLocation() { return null; },
      async recordCoverageGap() {},
      async recordFlywheelSignal() {},
    });

    const response = await supertest(app).post("/api/discovery/query").send({
      ...query,
      filters: { ...query.filters, category: "HBCUs" },
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      requiresLocation: false,
      records: [],
      coverageGap: { city: "Philadelphia", stateCode: "PA", category: "HBCUs" },
    });
  });

  it("retains the 500 boundary for unexpected repository failures", async () => {
    const app = express();
    app.use(express.json());
    registerLocationFirstDiscoveryRoutes(app, {
      async findExact() { throw new Error("connection reset"); },
      async findNearestAvailableLocation() { return null; },
      async recordCoverageGap() {},
      async recordFlywheelSignal() {},
    });

    const response = await supertest(app).post("/api/discovery/query").send(query);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Discovery query failed" });
  });
});
