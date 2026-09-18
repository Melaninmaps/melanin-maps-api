export type MapLocalitySource = "device" | "profile" | "search";

export interface MapLocality {
  source: MapLocalitySource;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
}

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

const MAX_LOCAL_FIT_SPAN_DEGREES = 2.5;

function normalizeState(value: string): string | undefined {
  const normalized = value.replace(/\./g, "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

/**
 * Profiles store a display-friendly homeCity value, commonly "City, ST".
 * Keep this parser deliberately conservative: a city without a state remains
 * useful as a city filter rather than guessing a state from a name.
 */
function parseCityState(
  value: string | null | undefined,
  source: Extract<MapLocalitySource, "profile" | "search">,
  stateOverride?: string | null,
): MapLocality | null {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;

  const match = normalizedValue.match(/^(.+?)(?:,\s*|\s+)([A-Za-z.]{2,4})$/);
  const city = match?.[1]?.trim() || normalizedValue;
  const state = normalizeState(stateOverride ?? "") ?? (match ? normalizeState(match[2]) : undefined);
  return city ? { source, city, state } : null;
}

export function parseProfileHomeLocality(
  homeCity: string | null | undefined,
): MapLocality | null {
  return parseCityState(homeCity, "profile");
}

/** A member-submitted city takes precedence over device/profile locality. */
export function parseMapSearchLocality(
  city: string | null | undefined,
  state?: string | null,
): MapLocality | null {
  return parseCityState(city, "search", state);
}

/** Device coordinates always win; reverse-geocoded city/state refine collection queries. */
export function resolveMapLocality(
  deviceLocation: MapCoordinate | null,
  devicePlace: { city?: string | null; state?: string | null } | null,
  profileLocality: MapLocality | null,
): MapLocality | null {
  if (deviceLocation) {
    return {
      source: "device",
      latitude: deviceLocation.latitude,
      longitude: deviceLocation.longitude,
      city: devicePlace?.city?.trim() || undefined,
      state: devicePlace?.state ? normalizeState(devicePlace.state) : undefined,
    };
  }
  return profileLocality;
}

/** A city is required for city-backed cultural, event, and safety collection APIs. */
export function canLoadLocalCollections(locality: MapLocality | null): boolean {
  return Boolean(locality?.city);
}

/**
 * Returns a query string without a leading question mark. An empty string is
 * intentional for an explicit all-area exploration; it must never be used for
 * an ordinary default map load.
 */
export function mapCollectionScopeQuery(
  locality: MapLocality | null,
  exploringAllAreas: boolean,
): string {
  if (exploringAllAreas || !locality?.city) return "";
  const params = new URLSearchParams({ city: locality.city });
  if (locality.state) params.set("state", locality.state);
  return params.toString();
}

export function mapLocalityKey(
  locality: MapLocality | null,
  exploringAllAreas: boolean,
): string {
  if (exploringAllAreas) return "all-areas";
  if (!locality) return "no-locality";
  return [
    locality.source,
    locality.city ?? "",
    locality.state ?? "",
    locality.latitude?.toFixed(3) ?? "",
    locality.longitude?.toFixed(3) ?? "",
  ].join(":");
}

/**
 * Never fit a normal local view to a country/world-sized coordinate set. This
 * guard still allows an intentional all-area exploration to use broad bounds.
 */
export function isSafeLocalFit(coordinates: readonly MapCoordinate[]): boolean {
  if (coordinates.length === 0) return false;
  const latitudes = coordinates.map((coordinate) => coordinate.latitude);
  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const latitudeSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const longitudeSpan = Math.max(...longitudes) - Math.min(...longitudes);
  return (
    Number.isFinite(latitudeSpan) &&
    Number.isFinite(longitudeSpan) &&
    latitudeSpan <= MAX_LOCAL_FIT_SPAN_DEGREES &&
    longitudeSpan <= MAX_LOCAL_FIT_SPAN_DEGREES
  );
}

/** A neutral local-scale camera used only while the member chooses a locality. */
export const NEUTRAL_LOCAL_REGION = {
  latitude: 39.9526,
  longitude: -75.1652,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
} as const;
