const PROXIMITY_CACHE_TTL_MS = 60_000;

export interface ProximityWarningPayload {
  warnings: unknown[];
  areaIncidents: unknown[];
}

interface ProximityCacheEntry {
  data: ProximityWarningPayload;
  expiresAt: number;
}

export type ProximityWarningCacheInvalidationReason =
  | "moderation_changed"
  | "report_lifecycle_changed"
  | "incident_lifecycle_changed";

const proximityCache = new Map<string, ProximityCacheEntry>();

export function proximityCacheKey(lat: number, lng: number, radius: number): string {
  return `${Math.round(lat * 1000) / 1000}:${Math.round(lng * 1000) / 1000}:${radius}`;
}

export function getCachedProximityWarnings(key: string): ProximityWarningPayload | null {
  const cached = proximityCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    proximityCache.delete(key);
    return null;
  }
  return cached.data;
}

export function setCachedProximityWarnings(key: string, data: ProximityWarningPayload): void {
  proximityCache.set(key, { data, expiresAt: Date.now() + PROXIMITY_CACHE_TTL_MS });
}

export function invalidateProximityWarningCache(
  _reason: ProximityWarningCacheInvalidationReason = "moderation_changed",
): void {
  proximityCache.clear();
}
