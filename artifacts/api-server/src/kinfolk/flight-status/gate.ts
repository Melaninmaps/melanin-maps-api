import {
  FLIGHT_STATUS_DATA_CATEGORIES,
  FLIGHT_STATUS_DISCLOSURE_VERSION,
  FLIGHT_STATUS_PURPOSE,
  type FlightStatusCapabilityRegistry,
  type FlightStatusDisclosureGrant,
  type FlightStatusLookupResult,
  type FlightStatusProvider,
  type FlightStatusQuery,
} from "./contracts";
import { normalizeFlightStatusPayload } from "./normalizers";

const UNAVAILABLE: FlightStatusLookupResult = Object.freeze({
  kind: "unavailable",
  code: "FLIGHT_STATUS_UNAVAILABLE",
});

function validIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month! - 1 &&
    candidate.getUTCDate() === day
  );
}

function validFlightNumber(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i.test(value.trim())
  );
}

function validProviderId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value);
}

function exactStatusDataCategories(categories: readonly string[]): boolean {
  return (
    categories.length === FLIGHT_STATUS_DATA_CATEGORIES.length &&
    new Set(categories).size === FLIGHT_STATUS_DATA_CATEGORIES.length &&
    FLIGHT_STATUS_DATA_CATEGORIES.every((category) =>
      categories.includes(category),
    )
  );
}

function validTimestamp(value: string): number | null {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function canUseDisclosure(
  grant: FlightStatusDisclosureGrant | null | undefined,
  providerId: string,
  now: Date,
): boolean {
  if (
    !grant ||
    grant.version !== FLIGHT_STATUS_DISCLOSURE_VERSION ||
    grant.state !== "granted" ||
    grant.revokedAt !== null ||
    grant.providerId !== providerId ||
    grant.purpose !== FLIGHT_STATUS_PURPOSE ||
    !exactStatusDataCategories(grant.dataCategories)
  )
    return false;

  const grantedAt = validTimestamp(grant.grantedAt);
  const expiresAt = validTimestamp(grant.expiresAt);
  return (
    grantedAt !== null &&
    expiresAt !== null &&
    grantedAt <= now.getTime() &&
    now.getTime() < expiresAt
  );
}

function capabilityEnabled(
  registry: FlightStatusCapabilityRegistry | null | undefined,
  providerId: string,
): boolean {
  return Boolean(
    registry &&
    registry.mode !== "disabled" &&
    registry.providerId === providerId &&
    registry.credentialAvailable === true &&
    registry.capabilities.length === 1 &&
    registry.capabilities[0] === "status",
  );
}

function normalizeQuery(
  query: FlightStatusQuery | null | undefined,
): { flightNumber: string; departureDate: string } | null {
  if (
    !query ||
    !validFlightNumber(query.flightNumber) ||
    !validIsoDate(query.departureDate)
  )
    return null;
  return {
    flightNumber: query.flightNumber.replace(/\s+/g, "").toUpperCase(),
    departureDate: query.departureDate,
  };
}

export type FlightStatusLookupInput = Readonly<{
  registry: FlightStatusCapabilityRegistry | null | undefined;
  disclosure: FlightStatusDisclosureGrant | null | undefined;
  provider: FlightStatusProvider | null | undefined;
  query: FlightStatusQuery | null | undefined;
  now: Date;
}>;

/**
 * The gate is intentionally provider-neutral and client-safe. It makes at most
 * one injected-provider call; any failed precondition or provider result is
 * indistinguishable to the client and never triggers a substitute or retry.
 */
export async function lookupAuthorizedFlightStatus(
  input: FlightStatusLookupInput,
): Promise<FlightStatusLookupResult> {
  const now = input.now;
  const provider = input.provider;
  const query = normalizeQuery(input.query);

  if (
    !now ||
    !Number.isFinite(now.getTime()) ||
    !provider ||
    !validProviderId(provider.providerId) ||
    !query
  )
    return UNAVAILABLE;
  if (!capabilityEnabled(input.registry, provider.providerId))
    return UNAVAILABLE;
  if (!canUseDisclosure(input.disclosure, provider.providerId, now))
    return UNAVAILABLE;

  try {
    const raw = await provider.lookupStatus(query);
    const status = normalizeFlightStatusPayload(raw);
    return status ? { kind: "available", status } : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}
