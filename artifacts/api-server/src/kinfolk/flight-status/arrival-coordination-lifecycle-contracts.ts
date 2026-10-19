import type {
  CalendarAvailabilityResult,
  CalendarAvailabilityWindow,
} from "../calendar-availability/contracts";
import type { ReciprocalArrivalCoordinationIntent } from "./arrival-coordination-contracts";
import type { NormalizedFlightStatus } from "./contracts";
import type { FlightArrivalCoordinationSharingGrant } from "./sharing-contracts";

export const ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION =
  "arrival-coordination-availability-permission-v1" as const;
export const ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE =
  "arrival_coordination_availability" as const;

/**
 * An in-memory, pair-bound permission carrying only an existing normalized
 * busy-only result. It does not name or invoke an outside input.
 */
export type ArrivalCoordinationAvailabilityPermission = Readonly<{
  version: typeof ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION;
  state: "granted" | "revoked";
  ownerId: string;
  recipientId: string;
  purpose: typeof ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  availability: CalendarAvailabilityResult;
}>;

export type ArrivalCoordinationLifecycleInput = Readonly<{
  ownerId: unknown;
  recipientId: unknown;
  sharingGrant: FlightArrivalCoordinationSharingGrant | null | undefined;
  normalizedStatus: NormalizedFlightStatus | null | undefined;
  reciprocalIntent: ReciprocalArrivalCoordinationIntent | null | undefined;
  coordinationWindow: CalendarAvailabilityWindow | null | undefined;
  ownerAvailabilityPermission:
    | ArrivalCoordinationAvailabilityPermission
    | null
    | undefined;
  recipientAvailabilityPermission:
    | ArrivalCoordinationAvailabilityPermission
    | null
    | undefined;
  nowEpochMs: unknown;
  freshnessMaxAgeMs: unknown;
  minimumDurationMs: unknown;
}>;

/** A canonical time proposal or one generic unavailable result, with no diagnostics. */
export type ArrivalCoordinationLifecycleResult =
  | Readonly<{ startAt: string; endAt: string }>
  | Readonly<{
      kind: "unavailable";
      code: "ARRIVAL_COORDINATION_LIFECYCLE_UNAVAILABLE";
    }>;
