export type MapBusinessProximity = Readonly<{
  latitude: number;
  longitude: number;
}>;

/**
 * An explicit city/deep-link scope is a deliberate alternative to an
 * around-me request. Do not silently intersect it with the device position:
 * a member may be exploring another city, and that intersection can convert a
 * valid city result into a successful but empty radius result.
 */
export function resolveMapBusinessProximity(input: Readonly<{
  hasExplicitLocality: boolean;
  memberLocation: MapBusinessProximity | null;
}>): MapBusinessProximity | null {
  return input.hasExplicitLocality ? null : input.memberLocation;
}

type MapPinLocality = Readonly<{
  city?: string | null;
  state?: string | null;
}>;

function normalizeLocalityValue(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase() ?? "";
}

/**
 * The canonical marker feed is intentionally cacheable, but a cache must not
 * let a prior city's pins survive after the member deliberately selects a new
 * city. Around-me mode deliberately keeps its coordinate-radius boundary.
 */
export function filterMapPinsForExplicitLocality<T extends MapPinLocality>(
  pins: readonly T[],
  locality: MapPinLocality | null,
  hasExplicitLocality: boolean,
): T[] {
  if (!hasExplicitLocality || !locality?.city) return [...pins];
  const city = normalizeLocalityValue(locality.city);
  const state = normalizeLocalityValue(locality.state);
  return pins.filter((pin) => (
    normalizeLocalityValue(pin.city) === city
    && (!state || normalizeLocalityValue(pin.state) === state)
  ));
}
