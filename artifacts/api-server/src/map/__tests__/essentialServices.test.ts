import express, { type Request } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  EssentialServicesInputError,
  GoogleEssentialServicesSearch,
  normalizeEssentialServicesSearchInput,
} from "../essentialServices";
import { registerEssentialServicesRoute } from "../registerEssentialServicesRoute";

const PHILADELPHIA = { latitude: 39.9526, longitude: -75.1652 };

function placeFixture() {
  return {
    id: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
    displayName: { text: "Example Public Hospital" },
    formattedAddress: "100 Example Avenue, Philadelphia, PA 19104, USA",
    location: PHILADELPHIA,
    primaryType: "hospital",
  };
}

describe("essential services input policy", () => {
  it("accepts a governed category and defaults to a 10-mile explicit local scope", () => {
    expect(normalizeEssentialServicesSearchInput({
      category: "medical-care",
      ...PHILADELPHIA,
    })).toEqual({
      category: "medical-care",
      ...PHILADELPHIA,
      radiusMiles: 10,
    });
  });

  it.each([
    [{ category: "shelter", ...PHILADELPHIA }, "INVALID_CATEGORY"],
    [{ category: "medical-care", latitude: 0, longitude: 0 }, "INVALID_LOCATION"],
    [{ category: "medical-care", ...PHILADELPHIA, radiusMiles: 26 }, "INVALID_RADIUS"],
  ] as const)("rejects unsafe or unsupported availability input", (input, code) => {
    expect(() => normalizeEssentialServicesSearchInput(input)).toThrowError(
      expect.objectContaining({ code }) as EssentialServicesInputError,
    );
  });
});

describe("Google essential services search", () => {
  it("uses only an on-demand, typed, distance-ranked nearby request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      places: [placeFixture()],
    }), { status: 200 }));
    const service = new GoogleEssentialServicesSearch("server-only-key", fetchImpl);

    const result = await service.search({ category: "medical-care", ...PHILADELPHIA, radiusMiles: 5 });

    expect(result.source).toBe("Google Maps");
    expect(result.places).toHaveLength(1);
    expect(result.places[0]).toMatchObject({
      name: "Example Public Hospital",
      primaryType: "hospital",
      latitude: PHILADELPHIA.latitude,
      longitude: PHILADELPHIA.longitude,
    });
    expect(result.places[0]?.directionsUrl).toContain("google.com/maps/search");
    expect(result.disclaimer).toMatch(/not Mapping With Melanin listings/i);

    const [url, request] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchNearby");
    expect(request.headers).toMatchObject({
      "X-Goog-Api-Key": "server-only-key",
      "X-Goog-FieldMask": expect.stringContaining("places.displayName"),
    });
    expect(JSON.parse(String(request.body))).toMatchObject({
      includedTypes: expect.arrayContaining(["hospital"]),
      rankPreference: "DISTANCE",
      languageCode: "en",
      locationRestriction: {
        circle: {
          center: PHILADELPHIA,
          radius: expect.any(Number),
        },
      },
    });
  });

  it("never exposes a result without a valid place, display name, address, and location", async () => {
    const service = new GoogleEssentialServicesSearch("server-only-key", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ places: [{ id: "bad", displayName: { text: "Missing location" } }] }), { status: 200 }),
    ));

    const result = await service.search({ category: "pharmacy", ...PHILADELPHIA });
    expect(result.places).toEqual([]);
  });
});

describe("essential services route", () => {
  function appWith(search: { search: ReturnType<typeof vi.fn> }, authenticated = true) {
    const app = express();
    app.use((req, _res, next) => {
      req.isAuthenticated = (() => authenticated) as Request["isAuthenticated"];
      if (authenticated) req.user = { id: "member-1" } as Request["user"];
      next();
    });
    registerEssentialServicesRoute(app, search as never);
    return app;
  }

  it("requires an authenticated member before an upstream location lookup", async () => {
    const search = { search: vi.fn() };
    await request(appWith(search, false))
      .get("/api/map/essential-services?category=medical-care&lat=39.9526&lng=-75.1652")
      .expect(401, { error: "Authentication required", code: "AUTH_REQUIRED" });
    expect(search.search).not.toHaveBeenCalled();
  });

  it("sets no-store and no-location-retention headers for a valid request", async () => {
    const search = {
      search: vi.fn().mockResolvedValue({
        category: "library",
        radiusMiles: 10,
        places: [],
        source: "Google Maps",
        disclaimer: "Availability information from Google Maps.",
      }),
    };
    const response = await request(appWith(search))
      .get("/api/map/essential-services?category=library&lat=39.9526&lng=-75.1652")
      .expect(200);

    expect(search.search).toHaveBeenCalledWith({
      category: "library",
      latitude: 39.9526,
      longitude: -75.1652,
      radiusMiles: undefined,
    });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-location-retention"]).toBe("none");
    expect(response.headers["x-query-retention"]).toBe("none");
    expect(response.headers["x-source-attribution"]).toBe("Google Maps");
  });
});
