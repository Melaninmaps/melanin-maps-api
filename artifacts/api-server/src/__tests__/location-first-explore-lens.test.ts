import { describe, expect, it, vi } from "vitest";
import { findExactRecords } from "../discovery/postgresLocationFirstRepository";

describe("Explore category lenses", () => {
  it("applies the selected HBCU lens to every non-business Explore record query", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    await findExactRecords({ query }, {
      surface: "explore",
      location: {
        city: "Philadelphia",
        stateCode: "PA",
        neighborhood: null,
        latitude: null,
        longitude: null,
        source: "explicit",
      },
      locationMode: "exact",
      radiusMiles: null,
      filters: {
        recordTypes: ["cultural_site", "event", "community_place"],
        category: "HBCUs",
        specialty: null,
        ownership: [],
        tagSlugs: [],
        dateRange: null,
      },
      searchText: null,
    });

    expect(query).toHaveBeenCalledTimes(3);
    const statements = query.mock.calls.map(([statement]) => String(statement));
    expect(statements[0]).toContain("COALESCE(tc.site_type, '') ILIKE ANY");
    expect(statements[1]).toContain("COALESCE(re.category, '') ILIKE ANY");
    expect(statements[2]).toContain("COALESCE(co.mission, '') ILIKE ANY");
    for (const [, params] of query.mock.calls) {
      expect(params).toEqual(expect.arrayContaining([expect.arrayContaining(["%hbcu%"])]));
    }
  });
});
