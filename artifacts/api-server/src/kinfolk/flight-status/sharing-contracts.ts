import type { FlightStatusState } from "./contracts";

export const FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION =
  "flight-arrival-coordination-sharing-v1" as const;
export const FLIGHT_ARRIVAL_COORDINATION_PURPOSE =
  "flight_arrival_coordination" as const;

export const FLIGHT_ARRIVAL_COORDINATION_FIELDS = [
  "status",
  "arrival_scheduled_at",
  "arrival_estimated_at",
  "arrival_actual_at",
  "observed_at",
] as const;

export type FlightArrivalCoordinationField =
  (typeof FLIGHT_ARRIVAL_COORDINATION_FIELDS)[number];

/**
 * This grant is deliberately distinct from private-flight confirmation and any
 * upstream status-disclosure authorization. It is an in-memory contract only.
 */
export type FlightArrivalCoordinationSharingGrant = Readonly<{
  version: typeof FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION;
  state: "granted" | "revoked";
  ownerId: string;
  recipientId: string;
  purpose: typeof FLIGHT_ARRIVAL_COORDINATION_PURPOSE;
  allowedFields: readonly FlightArrivalCoordinationField[];
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}>;

/**
 * The public result carries only an allow-listed status, one selected arrival
 * timestamp, and its observation time. It never carries recipient or grant data.
 */
export type SharedFlightArrivalProjection = Readonly<{
  status: Exclude<FlightStatusState, "unknown">;
  arrival: Readonly<{
    scheduledAt?: string;
    estimatedAt?: string;
    actualAt?: string;
  }>;
  observedAt: string;
}>;

export type FlightArrivalSharingResult =
  | Readonly<{
      kind: "available";
      arrival: SharedFlightArrivalProjection;
    }>
  | Readonly<{
      kind: "unavailable";
      code: "FLIGHT_ARRIVAL_SHARING_UNAVAILABLE";
    }>;
