export type MapBusinessProximity = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type MapBusinessLocality = Readonly<{
  city?: string | null;
  state?: string | null;
}>;

/**
 * Makes display-oriented locality strings safe to compare without equating
 * different cities. It intentionally does not expand abbreviations or infer a
 * state: an explicit map city/state scope must remain exact.
 */
function normalizeLocalityPart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

/**
 * Applies only a complete explicit city/state scope to cached canonical pins.
 * An around-me request deliberately has no such locality and must retain its
 * existing radius filtering behavior.
 */
export function matchesExplicitMapLocality(
  pin: MapBusinessLocality,
  explicitLocality: MapBusinessLocality | null | undefined,
): boolean {
  const city = normalizeLocalityPart(explicitLocality?.city);
  const state = normalizeLocalityPart(explicitLocality?.state);
  if (!city || !state) return true;

  return (
    normalizeLocalityPart(pin.city) === city
    && normalizeLocalityPart(pin.state) === state
  );
}

/** Direct-name safety context is informational, never a Map business result. */
export function isDirectNamedSafetyContext(
  searchScope: string | null | undefined,
): boolean {
  return searchScope === "direct_named_safety_context";
}

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
