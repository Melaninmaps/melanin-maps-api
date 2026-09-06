const PROXIMITY_CACHE_TTL_MS = 60_000;

export interface ProximityWarningPayload {
  warnings: unknown[];
  areaIncidents: unknown[];
}

interface ProximityCacheEntry {
  data: ProximityWarningPayload;
  expiresAt: number;
}

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

export function invalidateProximityWarningCache(): void {
  proximityCache.clear();
}
