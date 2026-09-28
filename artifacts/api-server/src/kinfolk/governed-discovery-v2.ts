import { extractExplicitOwnershipDesignationFilterIds } from "@workspace/constants";

/**
 * The corrected strict-discovery path is deliberately opt-in at deployment time.
 * A malformed, absent, or differently-cased environment value leaves the proven
 * existing discovery path untouched.
 */
export function isGovernedDiscoveryV2Enabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.KINFOLK_GOVERNED_DISCOVERY_V2_ENABLED === "true";
}

/**
 * A strict request is an explicit member request for one or more documented
 * ownership designations. It is not inferred from profile fields, names,
 * cuisine, location, or any other contextual clue.
 */
export function isStrictDocumentedOwnershipDiscoveryRequest(
  message: string,
): boolean {
  return extractExplicitOwnershipDesignationFilterIds(message).length > 0;
}

/**
 * Kinfolk's chat route is not passed device coordinates or a geocoded public
 * origin. A numeric radius can therefore be honored only after a truthful
 * geocoded-origin path is supplied; it must never be silently treated as a
 * city-wide result.
 */
export function requestsExactRadius(message: string): boolean {
  return /\b(?:within|under|inside|less than|no more than|up to)\s+\d{1,3}\s*(?:mi|miles?)\b|\b\d{1,3}[ -]?mile\s+radius\b/i.test(message);
}

/**
 * A strict directory response has evidence for its cards—not automatically for
 * a changing local safety claim. Preserve the requested safety concern without
 * manufacturing a city-specific alert or reusing a source from another city.
 */
export function requestsCurrentLocalSafetyContext(message: string): boolean {
  return /\b(?:safety|safe(?:ty)?|unsafe|crime|danger|travel advis(?:ory|ories))\b/i.test(message);
}

export function governedDirectorySafetyLimit(city: string): string {
  return `Safety note: I could not verify a current ${city}-specific safety alert from the source-backed directory records used for these listings, so I will not make a current local-safety claim. Before you go, check official local alerts and your transportation provider; for immediate danger, contact local emergency services.`;
}

export const GOVERNED_DISCOVERY_V2_RADIUS_REPLY =
  "I can keep the documented ownership and exact service filters, but I do not yet have a verified geocoded starting point to prove a numeric radius. I will not label city-wide results as within that distance. You can open the governed listing details and map pin to verify proximity, or give a geocodable public starting point once that option is available.";
