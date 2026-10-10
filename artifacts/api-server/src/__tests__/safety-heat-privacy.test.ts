import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getCachedSafetyHeatmap,
  invalidateSafetyHeatmapCache,
  safetyHeatCacheKey,
  setCachedSafetyHeatmap,
} from "../safety/safetyHeatCache";
import {
  PROVISIONAL_SAFETY_HEAT_DEFAULTS,
  resolveSafetyHeatPolicy,
  safetyHeatConfidence,
} from "../safety/safetyHeatPolicy";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const heatmapRouteSource = source("../routes/safety-heatmap.ts");
const surveysRouteSource = source("../routes/surveys.ts");

describe("Safety Heat P0 privacy and evidence controls", () => {
  it("uses bounded provisional source defaults and accepts valid reversible overrides", () => {
    expect(PROVISIONAL_SAFETY_HEAT_DEFAULTS).toEqual({
      minimumApprovedSurveyCount: 5,
      recencyWindowDays: 30,
      derivedCacheTtlMs: 60_000,
    });
    expect(resolveSafetyHeatPolicy({
      SAFETY_HEAT_MIN_APPROVED_SURVEYS: "8",
      SAFETY_HEAT_RECENCY_DAYS: "14",
      SAFETY_HEAT_CACHE_TTL_MS: "90000",
    })).toEqual({
      minimumApprovedSurveyCount: 8,
      recencyWindowDays: 14,
      derivedCacheTtlMs: 90_000,
    });
    expect(resolveSafetyHeatPolicy({
      SAFETY_HEAT_MIN_APPROVED_SURVEYS: "0",
      SAFETY_HEAT_RECENCY_DAYS: "forever",
      SAFETY_HEAT_CACHE_TTL_MS: "999999999",
    })).toEqual(PROVISIONAL_SAFETY_HEAT_DEFAULTS);
  });

  it("does not characterize below-threshold evidence as a map-worthy signal", () => {
    const policy = { minimumApprovedSurveyCount: 5 };
    expect(safetyHeatConfidence(4, policy)).toBe("insufficient_evidence");
    expect(safetyHeatConfidence(5, policy)).toBe("minimum_sample");
    expect(safetyHeatConfidence(10, policy)).toBe("larger_sample");
  });

  it("clears all cached city and all-city aggregate views when source evidence changes", () => {
    const payload = {
      points: [],
      dataStatus: "insufficient_evidence" as const,
      evidence: {
        source: "approved_neighborhood_survey_aggregate" as const,
        geography: "city_centroid_only" as const,
        rawReportsIncluded: false as const,
        reporterLocationsIncluded: false as const,
        minimumApprovedSurveyCount: 5,
        recencyWindowDays: 30,
      },
    };
    const cityKey = safetyHeatCacheKey("Philadelphia");
    const allCitiesKey = safetyHeatCacheKey("");
    setCachedSafetyHeatmap(cityKey, payload);
    setCachedSafetyHeatmap(allCitiesKey, payload);
    expect(getCachedSafetyHeatmap(cityKey)).toEqual(payload);
    expect(getCachedSafetyHeatmap(allCitiesKey)).toEqual(payload);

    invalidateSafetyHeatmapCache();

    expect(getCachedSafetyHeatmap(cityKey)).toBeNull();
    expect(getCachedSafetyHeatmap(allCitiesKey)).toBeNull();
  });

  it("queries only recent approved survey aggregates and suppresses every insufficient city", () => {
    expect(heatmapRouteSource).toContain("status = 'approved'");
    expect(heatmapRouteSource).toContain("created_at >= NOW() - ($1::int * INTERVAL '1 day')");
    expect(heatmapRouteSource).toContain("HAVING COUNT(*) >= $2");
    expect(heatmapRouteSource).toContain("safetyHeatPolicy.minimumApprovedSurveyCount");
    expect(heatmapRouteSource).toContain('dataStatus: points.length > 0 ? "sufficient_evidence"');
    expect(heatmapRouteSource).toContain('rawReportsIncluded: false');
    expect(heatmapRouteSource).toContain('reporterLocationsIncluded: false');
    expect(heatmapRouteSource).toContain('geography: "city_centroid_only"');
    expect(heatmapRouteSource).not.toContain("safety_reports");
    expect(heatmapRouteSource).not.toMatch(/reporter_id|reporter_name|incident_area/i);
  });

  it("invalidates aggregate heat data after each source-survey insert without deleting source records", () => {
    expect(surveysRouteSource.match(/invalidateSafetyHeatmapCache\(\)/g)).toHaveLength(2);
    expect(surveysRouteSource).not.toMatch(/DELETE FROM neighborhood_surveys|TRUNCATE neighborhood_surveys/i);
  });
});
