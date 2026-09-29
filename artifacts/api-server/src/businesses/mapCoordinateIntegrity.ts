/**
 * Map Coordinate Integrity Policy
 *
 * Historical imports used documented city-center fallback coordinates when a
 * listing had not received a street-level geocode. Those fallbacks are useful
 * for neither a business pin nor an exact-radius promise: many unrelated
 * listings share one point. Keep the listing and all of its provenance, but
 * treat the coordinates as unavailable until a reviewed address geocode is
 * recorded.
 *
 * This is intentionally a narrow, exact catalogue of the legacy fallback
 * values—not a proximity heuristic. A legitimate business that happens to be
 * near a city center is never suppressed merely for being nearby.
 */

type LegacyCityCenter = Readonly<{
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
}>;

const LEGACY_CITY_CENTER_COORDINATES: readonly LegacyCityCenter[] = [
  { city: "Philadelphia", stateCode: "PA", latitude: 39.9526, longitude: -75.1652 },
  { city: "Washington", stateCode: "DC", latitude: 38.9072, longitude: -77.0369 },
  { city: "Richmond", stateCode: "VA", latitude: 37.5407, longitude: -77.436 },
  { city: "Durham", stateCode: "NC", latitude: 35.994, longitude: -78.8986 },
  { city: "Raleigh", stateCode: "NC", latitude: 35.7796, longitude: -78.6382 },
  { city: "Charlotte", stateCode: "NC", latitude: 35.2271, longitude: -80.8431 },
  { city: "Columbia", stateCode: "SC", latitude: 33.9999, longitude: -81.0344 },
  { city: "Atlanta", stateCode: "GA", latitude: 33.749, longitude: -84.388 },
  { city: "Montgomery", stateCode: "AL", latitude: 32.3668, longitude: -86.3 },
  { city: "Birmingham", stateCode: "AL", latitude: 33.5186, longitude: -86.8104 },
  { city: "Mobile", stateCode: "AL", latitude: 30.6954, longitude: -88.0399 },
  { city: "Tuskegee", stateCode: "AL", latitude: 32.424, longitude: -85.6924 },
  { city: "Baton Rouge", stateCode: "LA", latitude: 30.4515, longitude: -91.1871 },
  { city: "New Orleans", stateCode: "LA", latitude: 29.9511, longitude: -90.0715 },
  { city: "Houston", stateCode: "TX", latitude: 29.7604, longitude: -95.3698 },
  { city: "San Antonio", stateCode: "TX", latitude: 29.4241, longitude: -98.4936 },
  { city: "Dallas", stateCode: "TX", latitude: 32.7767, longitude: -96.797 },
  { city: "Fort Worth", stateCode: "TX", latitude: 32.7555, longitude: -97.3308 },
  { city: "Allentown", stateCode: "PA", latitude: 40.6084, longitude: -75.4902 },
  { city: "Harrisburg", stateCode: "PA", latitude: 40.2732, longitude: -76.8839 },
  { city: "Collingdale", stateCode: "PA", latitude: 39.9168, longitude: -75.2771 },
  { city: "Willow Grove", stateCode: "PA", latitude: 40.1484, longitude: -75.1166 },
  { city: "Chicopee", stateCode: "MA", latitude: 42.1487, longitude: -72.6079 },
  { city: "Springfield", stateCode: "MA", latitude: 42.1015, longitude: -72.5898 },
  { city: "New York", stateCode: "NY", latitude: 40.7128, longitude: -74.006 },
  { city: "Newark", stateCode: "NJ", latitude: 40.7357, longitude: -74.1724 },
  { city: "Baltimore", stateCode: "MD", latitude: 39.2904, longitude: -76.6122 },
  { city: "Boston", stateCode: "MA", latitude: 42.3601, longitude: -71.0589 },
  { city: "Hartford", stateCode: "CT", latitude: 41.7658, longitude: -72.6851 },
  { city: "Jacksonville", stateCode: "FL", latitude: 30.3322, longitude: -81.6557 },
  { city: "Miami", stateCode: "FL", latitude: 25.7617, longitude: -80.1918 },
  { city: "Orlando", stateCode: "FL", latitude: 28.5383, longitude: -81.3792 },
  { city: "Tampa", stateCode: "FL", latitude: 27.9506, longitude: -82.4572 },
  { city: "Savannah", stateCode: "GA", latitude: 32.0835, longitude: -81.0998 },
  { city: "Nashville", stateCode: "TN", latitude: 36.1627, longitude: -86.7816 },
  { city: "Memphis", stateCode: "TN", latitude: 35.1495, longitude: -90.049 },
  { city: "Chicago", stateCode: "IL", latitude: 41.8781, longitude: -87.6298 },
  { city: "Detroit", stateCode: "MI", latitude: 42.3314, longitude: -83.0458 },
  { city: "Dearborn", stateCode: "MI", latitude: 42.3223, longitude: -83.1763 },
  { city: "Hamtramck", stateCode: "MI", latitude: 42.3978, longitude: -83.0494 },
  { city: "Cleveland", stateCode: "OH", latitude: 41.4993, longitude: -81.6944 },
  { city: "St. Louis", stateCode: "MO", latitude: 38.627, longitude: -90.1994 },
  { city: "Indianapolis", stateCode: "IN", latitude: 39.7684, longitude: -86.1581 },
  { city: "Milwaukee", stateCode: "WI", latitude: 43.0389, longitude: -87.9065 },
  { city: "Minneapolis", stateCode: "MN", latitude: 44.9778, longitude: -93.265 },
  { city: "St. Paul", stateCode: "MN", latitude: 44.9537, longitude: -93.09 },
  { city: "Kansas City", stateCode: "MO", latitude: 39.0997, longitude: -94.5786 },
  { city: "Tulsa", stateCode: "OK", latitude: 36.154, longitude: -95.9928 },
  { city: "Jackson", stateCode: "MS", latitude: 32.2988, longitude: -90.1848 },
  { city: "Los Angeles", stateCode: "CA", latitude: 34.0522, longitude: -118.2437 },
  { city: "Oakland", stateCode: "CA", latitude: 37.8044, longitude: -122.2712 },
  { city: "San Francisco", stateCode: "CA", latitude: 37.7749, longitude: -122.4194 },
  { city: "San Jose", stateCode: "CA", latitude: 37.3382, longitude: -121.8863 },
  { city: "Denver", stateCode: "CO", latitude: 39.7392, longitude: -104.9903 },
  { city: "Phoenix", stateCode: "AZ", latitude: 33.4484, longitude: -112.074 },
  { city: "Las Vegas", stateCode: "NV", latitude: 36.1699, longitude: -115.1398 },
  { city: "Seattle", stateCode: "WA", latitude: 47.6062, longitude: -122.3321 },
  { city: "Portland", stateCode: "OR", latitude: 45.5051, longitude: -122.675 },
  { city: "Charleston", stateCode: "SC", latitude: 32.7765, longitude: -79.9311 },
  { city: "Columbus", stateCode: "OH", latitude: 39.9612, longitude: -82.9988 },
  { city: "Cincinnati", stateCode: "OH", latitude: 39.1031, longitude: -84.512 },
  { city: "Norfolk", stateCode: "VA", latitude: 36.8508, longitude: -76.2859 },
] as const;

function normalizeCity(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("en-US") : "";
}

function normalizeState(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleUpperCase("en-US") : "";
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

/** True only for an exact known legacy city-center fallback. */
export function isLegacyCityCenterPlaceholderCoordinate(input: Readonly<{
  city: unknown;
  stateCode: unknown;
  latitude: unknown;
  longitude: unknown;
}>): boolean {
  const latitude = numberOrNull(input.latitude);
  const longitude = numberOrNull(input.longitude);
  if (latitude === null || longitude === null) return false;
  const city = normalizeCity(input.city);
  const stateCode = normalizeState(input.stateCode);
  return LEGACY_CITY_CENTER_COORDINATES.some((candidate) =>
    normalizeCity(candidate.city) === city &&
    candidate.stateCode === stateCode &&
    // Imported values arrive with variable decimal precision; these are still
    // exact fallback values once normalized to the legacy four-decimal store.
    Math.abs(latitude - candidate.latitude) < 0.000001 &&
    Math.abs(longitude - candidate.longitude) < 0.000001,
  );
}

/**
 * A map pin must have a real coordinate and must not be a known city-center
 * fallback. This never changes the stored record or its source evidence.
 */
export function hasTrustworthyMapCoordinate(input: Readonly<{
  city: unknown;
  stateCode: unknown;
  latitude: unknown;
  longitude: unknown;
}>): boolean {
  const latitude = numberOrNull(input.latitude);
  const longitude = numberOrNull(input.longitude);
  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001)
  ) {
    return false;
  }
  return !isLegacyCityCenterPlaceholderCoordinate(input);
}

export const MAP_LOCATION_HOLD_REASON = "legacy_city_center_coordinate_requires_verified_geocode";
