import type {
  FlightArrivalCoordinationSharingGrant,
  SharedFlightArrivalProjection,
} from "./sharing-contracts";

export const RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION =
  "reciprocal-arrival-coordination-intent-v1" as const;
export const RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE =
  "reciprocal_arrival_coordination" as const;

/**
 * This recipient-controlled intent is distinct from the owner's sharing grant.
 * It is an in-memory contract only and does not initiate any downstream action.
 */
export type ReciprocalArrivalCoordinationIntent = Readonly<{
  version: typeof RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION;
  state: "granted" | "revoked";
  ownerId: string;
  recipientId: string;
  purpose: typeof RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  arrivalWindowStartAt: string;
  arrivalWindowEndAt: string;
}>;

export type ArrivalCoordinationEligibilityInput = Readonly<{
  ownerId: unknown;
  recipientId: unknown;
  sharingGrant: FlightArrivalCoordinationSharingGrant | null | undefined;
  sharedArrival: SharedFlightArrivalProjection | null | undefined;
  reciprocalIntent: ReciprocalArrivalCoordinationIntent | null | undefined;
  nowEpochMs: unknown;
  freshnessMaxAgeMs: unknown;
}>;

/** The neutral result intentionally carries no underlying coordination data. */
export type ArrivalCoordinationEligibilityResult =
  | Readonly<{ kind: "eligible" }>
  | Readonly<{
      kind: "unavailable";
      code: "ARRIVAL_COORDINATION_UNAVAILABLE";
    }>;
