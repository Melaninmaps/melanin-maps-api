import type { CalendarAvailabilityResult } from "../calendar-availability/contracts";
import type { ArrivalCoordinationLifecycleInput } from "./arrival-coordination-lifecycle-contracts";

export const THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION =
  "three-participant-arrival-venue-v1" as const;
export const THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE =
  "three_participant_arrival_venue" as const;
export const THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION =
  "three-participant-coordinator-availability-v1" as const;
export const THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE =
  "three_participant_arrival_venue_availability" as const;
export const THREE_PARTICIPANT_ROLES = [
  "flight_owner",
  "named_recipient",
  "initiating_coordinator",
] as const;
export const THREE_PARTICIPANT_ALLOWED_USES = [
  "arrival_time",
  "availability",
  "travel_context",
  "location_context",
  "accessibility_requirements",
  "preference_tags",
  "venue_recommendation",
] as const;
export const THREE_PARTICIPANT_FIXTURE_EXPLANATION =
  "Simulated fixture result; not a real venue recommendation." as const;

export type ThreeParticipantRole = (typeof THREE_PARTICIPANT_ROLES)[number];
export type ThreeParticipantAllowedUse =
  (typeof THREE_PARTICIPANT_ALLOWED_USES)[number];

export const THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE: Readonly<
  Record<ThreeParticipantRole, readonly ThreeParticipantAllowedUse[]>
> = Object.freeze({
  flight_owner: Object.freeze<readonly ThreeParticipantAllowedUse[]>([
    "arrival_time",
    "availability",
    "travel_context",
    "location_context",
    "accessibility_requirements",
    "preference_tags",
    "venue_recommendation",
  ]),
  named_recipient: Object.freeze<readonly ThreeParticipantAllowedUse[]>([
    "availability",
    "travel_context",
    "location_context",
    "accessibility_requirements",
    "preference_tags",
    "venue_recommendation",
  ]),
  initiating_coordinator: Object.freeze<readonly ThreeParticipantAllowedUse[]>([
    "availability",
    "travel_context",
    "location_context",
    "accessibility_requirements",
    "preference_tags",
    "venue_recommendation",
  ]),
});

export type ThreeParticipant = Readonly<{
  id: string;
  name: string;
  role: ThreeParticipantRole;
}>;

/**
 * A fixture-only, triad-bound authorization. It establishes no real consent,
 * account connection, communication, or downstream action.
 */
export type ThreeParticipantAuthorization = Readonly<{
  version: typeof THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION;
  state: "granted" | "revoked";
  participantId: string;
  participantName: string;
  role: ThreeParticipantRole;
  purpose: typeof THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE;
  coordinationId: string;
  otherParticipantIds: readonly string[];
  allowedUses: readonly ThreeParticipantAllowedUse[];
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}>;

/**
 * Fixture-only coordinator availability permission. It carries only a normalized
 * busy result and establishes no real account or connection capability.
 */
export type ThreeParticipantCoordinatorAvailabilityPermission = Readonly<{
  version: typeof THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION;
  state: "granted" | "revoked";
  coordinatorId: string;
  flightOwnerId: string;
  namedRecipientId: string;
  purpose: typeof THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE;
  coordinationId: string;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  availability: CalendarAvailabilityResult;
}>;

/** Sanitized fixture preferences only; no precise location or travel data is modeled. */
export type ThreeParticipantProfile = Readonly<{
  participantId: string;
  city: string;
  stateCode: string;
  accessibility: readonly string[];
  amenities: readonly string[];
}>;

/**
 * `injected_verified` is an assertion about a supplied test fixture only. It
 * cannot establish a real, current, or independently verified venue fact.
 */
export type ThreeParticipantFixtureVenue = Readonly<{
  id: string;
  name: string;
  city: string;
  stateCode: string;
  accessibility: readonly string[];
  amenities: readonly string[];
  injected_verified: boolean;
}>;

export type ThreeParticipantArrivalVenueInput = Readonly<{
  participants: readonly ThreeParticipant[];
  authorizations: readonly ThreeParticipantAuthorization[];
  pairInput: ArrivalCoordinationLifecycleInput;
  coordinatorAvailabilityPermission: ThreeParticipantCoordinatorAvailabilityPermission;
  profiles: readonly ThreeParticipantProfile[];
  venueCandidates: readonly ThreeParticipantFixtureVenue[];
  nowEpochMs: unknown;
}>;

export type ThreeParticipantArrivalVenueResult =
  | Readonly<{
      startAt: string;
      endAt: string;
      venue: Readonly<{
        id: string;
        name: string;
        city: string;
        stateCode: string;
      }>;
      explanation: typeof THREE_PARTICIPANT_FIXTURE_EXPLANATION;
    }>
  | Readonly<{
      kind: "unavailable";
      code: "THREE_PARTICIPANT_ARRIVAL_VENUE_UNAVAILABLE";
    }>;
