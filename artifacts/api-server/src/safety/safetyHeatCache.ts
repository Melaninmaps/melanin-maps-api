import { safetyHeatPolicy } from "./safetyHeatPolicy";

export interface SafetyHeatmapPayload {
  points: unknown[];
  dataStatus: "sufficient_evidence" | "insufficient_evidence";
  evidence: {
    source: "approved_neighborhood_survey_aggregate";
    geography: "city_centroid_only";
    rawReportsIncluded: false;
    reporterLocationsIncluded: false;
    minimumApprovedSurveyCount: number;
    recencyWindowDays: number;
  };
}

interface SafetyHeatCacheEntry {
  data: SafetyHeatmapPayload;
  expiresAt: number;
}

const safetyHeatCache = new Map<string, SafetyHeatCacheEntry>();

export function safetyHeatCacheKey(city: string): string {
  return city.trim().toLocaleLowerCase() || "__all_cities__";
}

export function getCachedSafetyHeatmap(key: string): SafetyHeatmapPayload | null {
  const cached = safetyHeatCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    safetyHeatCache.delete(key);
    return null;
  }
  return cached.data;
}

export function setCachedSafetyHeatmap(key: string, data: SafetyHeatmapPayload): void {
  safetyHeatCache.set(key, {
    data,
    expiresAt: Date.now() + safetyHeatPolicy.derivedCacheTtlMs,
  });
}

/** Invalidate every city because a source update can alter an all-city result. */
export function invalidateSafetyHeatmapCache(): void {
  safetyHeatCache.clear();
}
