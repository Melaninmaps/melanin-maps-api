import { describe, expect, it, vi } from "vitest";
import { matchesBusinessCategoryIntent } from "@workspace/constants";
import { findExactRecords } from "../discovery/postgresLocationFirstRepository";
import type { LocationFirstQuery } from "../shared/discoveryContracts";
import { isPublicBusinessRecord } from "../businesses/publicBusinessVisibility";
import { LocalBusinessSearch } from "../map/localBusinessSearch";

function query(category: string | null, searchText: string | null): LocationFirstQuery {
  return {
    surface: "businesses",
    location: { city: "Philadelphia", stateCode: "PA", neighborhood: null, latitude: null, longitude: null, source: "explicit" },
    locationMode: "exact",
    radiusMiles: null,
    filters: { recordTypes: ["business"], category, categoryNormalizationVersion: 1, specialty: null, ownership: [], tagSlugs: [], dateRange: null },
    searchText,
  };
}

const AMINA_ROW = {
  id: "91f14ab4-0f8d-4f52-97be-f12617191919",
  name: "AMINA",
  category: "Food",
  specialty: null,
  city: "Philadelphia",
  state_code: "PA",
  neighborhood: null,
  lat: "39.9526",
  lng: "-75.1652",
  is_verified: true,
};

describe("location-first business repository", () => {
  it("returns an AMINA-like record for Philadelphia + Food & Drink + Restaurant", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [AMINA_ROW] }) };
    const records = await findExactRecords(pool, query("Food & Drink", "Restaurant"));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ name: "AMINA", category: "Food", city: "Philadelphia", stateCode: "PA" });

    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("UPPER(l.state_code)");
    expect(sql).toContain("b.subcategory ILIKE");
    expect(sql).toContain("b.description ILIKE");
    expect(sql).toContain("FROM public.public_businesses b");
    expect(params).toContain("PA");
    expect(params).toContain("%Restaurant%");
    expect(params).toContainEqual(["food", "food drink", "restaurant", "restaurants"]);
  });

  it("uses normalized restaurant intent without requiring a category chip", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [AMINA_ROW] }) };
    const records = await findExactRecords(pool, query(null, "Restaurant"));
    expect(records.map((record) => record.name)).toEqual(["AMINA"]);
    expect(pool.query.mock.calls[0][1]).toContainEqual(["food", "food drink", "restaurant", "restaurants"]);
  });

  it("keeps only live Philadelphia AMINA when hidden, duplicate, staged, and wrong-state fixtures exist", () => {
    const fixtures = [
      { name: "AMINA", city: "Philadelphia", state: "PA", category: "Food", subcategory: "Restaurants", listingStatus: "live_unclaimed", status: "active", isDuplicate: false },
      { name: "Hidden AMINA", city: "Philadelphia", state: "PA", category: "Food", subcategory: "Restaurants", listingStatus: "live_claimed", status: "active", permanentlyHidden: true, isDuplicate: false },
      { name: "Duplicate AMINA", city: "Philadelphia", state: "PA", category: "Food", subcategory: "Restaurants", listingStatus: "live_claimed", status: "active", isDuplicate: true },
      { name: "Staged AMINA", city: "Philadelphia", state: "PA", category: "Food", subcategory: "Restaurants", listingStatus: "staged", status: "active", isDuplicate: false },
      { name: "New Jersey AMINA", city: "Philadelphia", state: "NJ", category: "Food", subcategory: "Restaurants", listingStatus: "live_claimed", status: "active", isDuplicate: false },
    ];
    const results = fixtures.filter((fixture) =>
      isPublicBusinessRecord(fixture)
      && fixture.city.toLowerCase() === "philadelphia"
      && fixture.state === "PA"
      && matchesBusinessCategoryIntent("Food & Drink", fixture.category, fixture.subcategory)
      && matchesBusinessCategoryIntent("Restaurant", fixture.category, fixture.subcategory),
    );
    expect(results.map((fixture) => fixture.name)).toEqual(["AMINA"]);
  });

  it("uses the same visibility gate and subcategory text on the local Map search", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await new LocalBusinessSearch(pool as never).search({ query: "Restaurant", latitude: 39.95, longitude: -75.16 });
    const sql = pool.query.mock.calls[0][0] as string;
    expect(sql).toContain("FROM public.public_businesses b");
    expect(sql).not.toContain("b.is_active");
    expect(sql).not.toContain("b.state_code");
    expect(sql).toContain("b.state AS \"stateCode\"");
    expect(sql).toContain("coalesce(b.subcategory, '')");
    expect(pool.query.mock.calls[0][1]).toContainEqual(["food", "food drink", "restaurant", "restaurants"]);
  });

  it("returns Richmond cultural inventory with valid Explore destinations", async () => {
    const richmondExplore: LocationFirstQuery = {
      surface: "explore",
      location: { city: "Richmond", stateCode: "VA", neighborhood: null, latitude: null, longitude: null, source: "explicit" },
      locationMode: "exact",
      radiusMiles: null,
      filters: { recordTypes: ["cultural_site", "event", "community_place"], category: null, specialty: null, ownership: [], tagSlugs: [], dateRange: null },
      searchText: null,
    };
    const pool = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [{
          id: "11111111-1111-4111-8111-111111111111",
          name: "Black History Museum and Cultural Center of Virginia",
          site_type: "museum",
          city: "richmond",
          state_code: "VA",
          neighborhood: null,
          lat: null,
          lng: null,
        }] })
        .mockResolvedValueOnce({ rows: [{
          id: "22222222-2222-4222-8222-222222222222",
          name: "Richmond Community Festival",
          category: "Culture",
          city: "richmond",
          state_code: "VA",
          neighborhood: null,
          lat: null,
          lng: null,
        }] })
        .mockResolvedValueOnce({ rows: [{
          id: "33333333-3333-4333-8333-333333333333",
          name: "Richmond Community Resource Center",
          mission: "Business support",
          city: "richmond",
          state_code: "VA",
          neighborhood: null,
          lat: null,
          lng: null,
        }] }),
    };

    const records = await findExactRecords(pool, richmondExplore);
    expect(records.map((record) => record.detailUrl)).toEqual([
      "/tour-cultural-sites/11111111-1111-4111-8111-111111111111",
      "/events",
      "/resources",
    ]);
    expect(pool.query.mock.calls[0][1]).toEqual(["richmond", "VA"]);
    expect(pool.query.mock.calls[2][0]).toContain("co.is_active = TRUE");
  });
});
