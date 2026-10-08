/**
 * A deliberately non-geographic fixture for the production Private Places
 * acceptance harness. It is not an address, has no usable location, and is
 * never sent to Google. Its only permitted nearby result is an empty list.
 */
export const PRIVATE_PLACES_FICTIONAL_QA_ADDRESS =
  "MWM Private Places Fictional QA Fixture — Not A Real Address";

export const PRIVATE_PLACES_FICTIONAL_QA_PROVIDER = "synthetic_private_places_qa";

export type PrivatePlacesGeocode = Readonly<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: "google_maps" | typeof PRIVATE_PLACES_FICTIONAL_QA_PROVIDER;
}>;

export function isPrivatePlacesFictionalQaAddress(value: string): boolean {
  return value === PRIVATE_PLACES_FICTIONAL_QA_ADDRESS;
}

/**
 * The fixture uses a neutral non-place coordinate pair. Callers must still
 * avoid directory lookup whenever this provider is returned; coordinates are
 * never sent to a client or written outside the encrypted payload.
 */
export function fictionalPrivatePlacesQaGeocode(address: string): PrivatePlacesGeocode | null {
  if (!isPrivatePlacesFictionalQaAddress(address)) return null;
  return {
    latitude: 0,
    longitude: 0,
    formattedAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
    provider: PRIVATE_PLACES_FICTIONAL_QA_PROVIDER,
  };
}

export function isPrivatePlacesFictionalQaProvider(value: string): boolean {
  return value === PRIVATE_PLACES_FICTIONAL_QA_PROVIDER;
}

/**
 * This explicit, non-secret deploy switch runs the loopback-only production
 * acceptance harness before the application starts accepting traffic. It is
 * intentionally disarmed after a successful controlled production check.
 */
export function shouldRunPrivatePlacesSyntheticQaAcceptance(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.NODE_ENV === "production"
    && environment.KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE === "true";
}
