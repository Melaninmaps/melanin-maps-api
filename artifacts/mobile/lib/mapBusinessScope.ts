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
