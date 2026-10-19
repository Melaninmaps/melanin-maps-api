export const FLIGHT_STATUS_DISCLOSURE_VERSION =
  "flight-status-disclosure-v1" as const;
export const FLIGHT_STATUS_PURPOSE = "existing_flight_status" as const;

export const FLIGHT_STATUS_DATA_CATEGORIES = [
  "flight_number",
  "departure_date",
] as const;

export type FlightStatusDataCategory =
  (typeof FLIGHT_STATUS_DATA_CATEGORIES)[number];
export type FlightStatusCapability = "status";
export type FlightStatusRegistryMode = "disabled" | "test" | "live";
export type FlightStatusState =
  | "scheduled"
  | "en_route"
  | "landed"
  | "cancelled"
  | "diverted"
  | "unknown";

/**
 * A future persisted authorization must be separate from a member's private
 * flight-record confirmation. This leaf contract does not store or activate it.
 */
export type FlightStatusDisclosureGrant = Readonly<{
  version: typeof FLIGHT_STATUS_DISCLOSURE_VERSION;
  state: "granted" | "revoked";
  providerId: string;
  purpose: typeof FLIGHT_STATUS_PURPOSE;
  dataCategories: readonly FlightStatusDataCategory[];
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}>;

/** Contains no credential material. A missing or disabled registry is fail-closed. */
export type FlightStatusCapabilityRegistry = Readonly<{
  mode: FlightStatusRegistryMode;
  providerId: string | null;
  capabilities: readonly FlightStatusCapability[];
  credentialAvailable: boolean;
}>;

export const DEFAULT_FLIGHT_STATUS_CAPABILITY_REGISTRY: FlightStatusCapabilityRegistry =
  Object.freeze({
    mode: "disabled",
    providerId: null,
    capabilities: Object.freeze([]),
    credentialAvailable: false,
  });

/** The only status data a future provider adapter may receive. */
export type FlightStatusQuery = Readonly<{
  flightNumber: string;
  departureDate: string;
}>;

export type FlightStatusProviderRequest = Readonly<{
  flightNumber: string;
  departureDate: string;
}>;

export type FlightStatusTime = Readonly<{
  scheduledAt?: string;
  estimatedAt?: string;
  actualAt?: string;
}>;

/**
 * A client-safe status projection. It intentionally excludes itinerary notes,
 * provider payloads, positions, member identity, and booking information.
 */
export type NormalizedFlightStatus = Readonly<{
  state: FlightStatusState;
  departure?: FlightStatusTime;
  arrival?: FlightStatusTime;
  observedAt?: string;
}>;

/**
 * The provider is injected. This package has no credential, fetch, URL, or
 * network implementation and cannot select or activate a provider by itself.
 */
export type FlightStatusProvider = Readonly<{
  providerId: string;
  lookupStatus: (request: FlightStatusProviderRequest) => Promise<unknown>;
}>;

export type FlightStatusLookupResult =
  | Readonly<{
      kind: "available";
      status: NormalizedFlightStatus;
    }>
  | Readonly<{
      kind: "unavailable";
      code: "FLIGHT_STATUS_UNAVAILABLE";
    }>;
