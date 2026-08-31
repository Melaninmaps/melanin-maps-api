import { describe, expect, it, vi } from "vitest";
import {
  normalizeLocationQuery,
  parseLocationQuery,
  resolveLocationText,
  type ResolvedArea,
} from "../location/locationResolver";

const PHILADELPHIA_VARIANTS = [
  "Philadelphia, PA",
  "Philadelphia PA",
  "Philadelphia, Pennsylvania",
  "philadelphia... pa!!!",
  "Philly",
  "PHILLY, PA",
];

describe("location resolver", () => {
  it.each(PHILADELPHIA_VARIANTS)("parses %s as canonical Philadelphia, PA", (input) => {
    const parsed = parseLocationQuery(input);
    expect(parsed.cityOrNeighborhood).toBe("philadelphia");
    expect(parsed.stateCode).toBe("PA");
    expect(parsed.approvedArea).toMatchObject({
      label: "Philadelphia, PA",
      cityName: "Philadelphia",
      stateCode: "PA",
    });
  });

  it("uses the narrow approved canonical fallback when community_locations is unseeded", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const result = await resolveLocationText(pool, "philly!!!");
    expect(result).toMatchObject({
      kind: "resolved",
      source: "approved_canonical",
      area: { label: "Philadelphia, PA", cityName: "Philadelphia", stateCode: "PA" },
    });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("community_location_aliases"), ["philadelphia", "PA"]);
  });

  it("preserves ambiguity for same-name cities without a state", async () => {
    const candidates: ResolvedArea[] = [
      { id: "1", label: "Springfield, IL", cityName: "Springfield", stateCode: "IL", neighborhoodName: null, latitude: 1, longitude: 1 },
      { id: "2", label: "Springfield, MA", cityName: "Springfield", stateCode: "MA", neighborhoodName: null, latitude: 2, longitude: 2 },
    ];
    const pool = { query: vi.fn().mockResolvedValue({ rows: candidates }) };
    await expect(resolveLocationText(pool, "Springfield")).resolves.toEqual({ kind: "ambiguous", candidates });
  });

  it("does not turn an unknown area into a national fallback", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await expect(resolveLocationText(pool, "Not A Real MWM Area")).resolves.toEqual({ kind: "not_found" });
    expect(normalizeLocationQuery("  Foo, BAR!!! ")).toBe("foo bar");
  });
});
