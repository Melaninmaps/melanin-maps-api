import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import {
  isValidMapCoordinatePair,
  LocalBusinessSearch,
  localBusinessSearchPatterns,
  type LocalBusinessResult,
} from "../localBusinessSearch";

type ResultRow = LocalBusinessResult & {
  totalRelevantListings?: number | string;
  pinnableCount?: number | string;
};

const mappedBookstore: ResultRow = {
  id: "urban-reader",
  name: "Urban Reader",
  category: "Retail",
  city: "Atlanta",
  stateCode: "GA",
  latitude: 33.749,
  longitude: -84.388,
  distanceMi: 0.4,
  detailUrl: "/businesses/ignored-by-mapper",
};

const unpinnedBookstore: ResultRow = {
  id: "atlanta-unmapped",
  name: "Atlanta Unmapped Books",
  category: "Bookstore",
  city: "Atlanta",
  stateCode: "GA",
  latitude: null,
  longitude: null,
  distanceMi: null,
  detailUrl: "/businesses/ignored-by-mapper",
};

function serviceReturning(rows: ResultRow[]) {
  const query = vi.fn().mockResolvedValue({ rows });
  return {
    query,
    service: new LocalBusinessSearch({ query } as unknown as Pool),
  };
}

const atlantaSearch = {
  query: "bookstore",
  latitude: 33.749,
  longitude: -84.388,
  city: "Atlanta",
  stateCode: "GA",
} as const;

describe("LocalBusinessSearch", () => {
  it("uses only the public governed catalog plus classification, name, and specialty evidence", async () => {
    const specialtyResult = {
      ...mappedBookstore,
      id: "specialty-bookshop",
      name: "Chapter One",
      category: "Retail",
      totalRelevantListings: "1",
      pinnableCount: "1",
    };
    const { query, service } = serviceReturning([specialtyResult]);

    const response = await service.search(atlantaSearch);
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];

    expect(sql).toContain("FROM public.public_businesses AS b");
    expect(sql).not.toMatch(/(?:FROM|JOIN)\s+(?:public\.)?businesses\b/i);
    expect(sql).toContain("FROM public.business_specialties AS specialty");
    expect(sql).toContain("LOWER(COALESCE(b.name, '')) ~ ANY($3::text[])");
    expect(sql).toContain("LOWER(COALESCE(b.category, '')) ~ ANY($3::text[])");
    expect(sql).toContain("LOWER(COALESCE(b.subcategory, '')) ~ ANY($3::text[])");
    expect(sql).not.toContain("jsonb_array_elements_text");
    expect(sql).not.toContain("b.tags");
    expect(sql).not.toContain("promotion_eligible");
    expect(params[2]).toEqual(expect.arrayContaining([
      "\\mbookstore\\M",
      "\\mbook[[:space:]-]+store\\M",
      "\\mbookshop\\M",
    ]));
    expect(params[7]).toBe("bookstore");
    expect(response.results).toEqual([
      expect.objectContaining({ id: "specialty-bookshop", detailUrl: "/businesses/specialty-bookshop" }),
    ]);
  });

  it("excludes AMINA's incidental 'books fast' prose from bookstore matching", async () => {
    const { query, service } = serviceReturning([]);

    const response = await service.search(atlantaSearch);
    const sql = query.mock.calls[0]?.[0] as string;

    // Demo containment may inspect description for [DEMO], but service relevance
    // never applies the bookstore patterns to description or other prose.
    expect(sql).not.toContain("LOWER(COALESCE(b.description, '')) ~ ANY($3::text[])");
    expect(sql).not.toContain("LOWER(COALESCE(b.business_story, '')) ~ ANY($3::text[])");
    expect(response.results).toEqual([]);
    expect(response.pins).toEqual([]);
  });

  it("keeps every matching unpinned city listing searchable without inventing a pin", async () => {
    const { service } = serviceReturning([
      { ...mappedBookstore, totalRelevantListings: 3, pinnableCount: 1 },
      unpinnedBookstore,
      { ...unpinnedBookstore, id: "second-unmapped", name: "Second Unmapped Books" },
    ]);

    const response = await service.search(atlantaSearch);

    expect(response.totalRelevantListings).toBe(3);
    expect(response.pinnableCount).toBe(1);
    expect(response.results.map(({ id }) => id)).toEqual([
      "urban-reader",
      "atlanta-unmapped",
      "second-unmapped",
    ]);
    expect(response.pins.map(({ id }) => id)).toEqual(["urban-reader"]);
    expect(response.results.find(({ id }) => id === "atlanta-unmapped")).toMatchObject({
      latitude: null,
      longitude: null,
      detailUrl: "/businesses/atlanta-unmapped",
    });
  });

  it("offers only the explicit 5 to 10 to 25 mile expansion sequence based on pinnable availability", async () => {
    const { service } = serviceReturning([
      { ...mappedBookstore, totalRelevantListings: 4, pinnableCount: 1 },
      unpinnedBookstore,
    ]);

    const five = await service.search({ ...atlantaSearch, radiusMi: 25, expansionAccepted: false });
    const ten = await service.search({ ...atlantaSearch, radiusMi: 10, expansionAccepted: true });
    const twentyFive = await service.search({ ...atlantaSearch, radiusMi: 25, expansionAccepted: true });

    expect(five).toMatchObject({
      scope: "local",
      radiusMi: 5,
      totalRelevantListings: 4,
      pinnableCount: 1,
      expansion: { available: true, nextRadiusMi: 10 },
    });
    expect(ten).toMatchObject({
      scope: "expanded",
      radiusMi: 10,
      expansion: { available: true, nextRadiusMi: 25 },
    });
    expect(twentyFive).toMatchObject({
      scope: "expanded",
      radiusMi: 25,
      expansion: { available: false, nextRadiusMi: null },
    });
  });

  it("derives strict generic subjects without broadening barber to beauty", () => {
    expect(localBusinessSearchPatterns("barber")).toEqual([
      "\\mbarber\\M",
      "\\mbarbershop\\M",
      "\\mbarber[[:space:]-]+shop\\M",
    ]);
    expect(localBusinessSearchPatterns("barber").join(" ")).not.toMatch(/beauty|salon/i);
    expect(localBusinessSearchPatterns("natural-hair")).toEqual(expect.arrayContaining([
      "\\mlocs\\M",
      "\\mnatural[[:space:]-]+hair\\M",
    ]));
    expect(localBusinessSearchPatterns("HVAC")).toContain("\\mhvac\\M");
  });

  it("guards HVAC searches against automotive-only air conditioning matches", async () => {
    const { query, service } = serviceReturning([]);
    await service.search({
      query: "HVAC",
      latitude: 33.4484,
      longitude: -112.074,
      city: "Phoenix",
      stateCode: "AZ",
    });
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("$8::text = 'hvac'");
    expect(sql).toContain("(auto|automotive|car|vehicle)");
    expect(sql).toContain("(hvac|heating|furnace|heat pump)");
    expect(params[7]).toBe("hvac");
  });

  it("validates coordinates and guarantees every pin has the same identity as a listed result", async () => {
    const validEquator = { ...mappedBookstore, id: "equator", latitude: 0, longitude: 10 };
    const invalidOrigin = { ...mappedBookstore, id: "origin", latitude: 0, longitude: 0 };
    const invalidRange = { ...mappedBookstore, id: "invalid-range", latitude: 91, longitude: 10 };
    const { service } = serviceReturning([
      { ...validEquator, totalRelevantListings: 3, pinnableCount: 1 },
      invalidOrigin,
      invalidRange,
    ]);

    const response = await service.search(atlantaSearch);
    const listedIds = new Set(response.results.map(({ id }) => id));

    expect(isValidMapCoordinatePair(0, 10)).toBe(true);
    expect(isValidMapCoordinatePair(0, 0)).toBe(false);
    expect(isValidMapCoordinatePair(91, 10)).toBe(false);
    expect(response.pins.map(({ id }) => id)).toEqual(["equator"]);
    expect(response.pins.every(({ id }) => listedIds.has(id))).toBe(true);
  });
});
