import { describe, expect, it, vi } from "vitest";
import { findExactRecords } from "../discovery/postgresLocationFirstRepository";

describe("Explore category lenses", () => {
  it("uses the national HBCU catalogue instead of loose local keyword matches", async () => {
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

    expect(query).toHaveBeenCalledTimes(1);
    const [statement, params] = query.mock.calls[0];
    expect(String(statement)).toContain("FROM cultural_sites");
    expect(String(statement)).toContain("heritage_category");
    expect(String(statement)).not.toContain("tour_cultural_sites");
    expect(String(statement)).not.toContain("recurring_events");
    expect(params).toBeUndefined();
  });
});
