import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { CanonicalCulturalSiteRepository } from "../routes/directory/canonicalCulturalSiteRepository";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const businessRouteSource = source("../routes/businesses.ts");
const culturalRouteSource = source("../routes/canonical-cultural-sites.ts");
const heatmapRouteSource = source("../routes/safety-heatmap.ts");

describe("map locality API contracts", () => {
  it("adds city/state filters to canonical cultural map cards without removing the explicit all-area response", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const repository = new CanonicalCulturalSiteRepository(pool as never);

    await repository.listMapCards("Philadelphia", "PA");
    const [localSql, localParams] = pool.query.mock.calls[0] as [string, string[]];
    expect(localSql).toContain("LOWER(city) = LOWER($1)");
    expect(localSql).toContain("UPPER(state) = UPPER($2)");
    expect(localParams).toEqual(["Philadelphia", "PA"]);

    await repository.listMapCards();
    const [allAreaSql, allAreaParams] = pool.query.mock.calls[1] as [string, string[]];
    expect(allAreaSql).not.toContain("LOWER(city) = LOWER($1)");
    expect(allAreaParams).toEqual([]);
  });

  it("passes optional city/state through the canonical cultural endpoint", () => {
    expect(culturalRouteSource).toContain('req.query.city === "string"');
    expect(culturalRouteSource).toContain('req.query.state === "string"');
    expect(culturalRouteSource).toContain("repository.listMapCards(city, state)");
  });

  it("filters safety heatmap data by explicit city while retaining all-area exploration compatibility", () => {
    expect(heatmapRouteSource).toContain('req.query.city === "string"');
    expect(heatmapRouteSource).toContain('AND LOWER(city) = LOWER($1)');
    expect(heatmapRouteSource).toContain("city ? [city] : []");
  });

  it("keeps coordinate-constrained business pins nearest-first", () => {
    expect(businessRouteSource).toContain("const distanceMilesSql = hasGeoFilter");
    expect(businessRouteSource).toContain("conditions.push(sql`${distanceMilesSql} <= ${geoRadiusMi}`)");
    expect(businessRouteSource).toContain("...(distanceMilesSql ? [asc(distanceMilesSql)] : [])");
  });
});
