import type { ArrivalCoordinationLifecycleInput } from "./arrival-coordination-lifecycle-contracts";
import { resolveSimulatedArrivalMeetingTime } from "./arrival-coordination-lifecycle";
import {
  THREE_PARTICIPANT_ALLOWED_USES,
  THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE,
  THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE,
  THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION,
  THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE,
  THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION,
  THREE_PARTICIPANT_FIXTURE_EXPLANATION,
  THREE_PARTICIPANT_ROLES,
  type ThreeParticipantAllowedUse,
  type ThreeParticipantArrivalVenueInput,
  type ThreeParticipantArrivalVenueResult,
  type ThreeParticipantAuthorization,
  type ThreeParticipantRole,
} from "./three-participant-arrival-venue-contracts";

const UNAVAILABLE: ThreeParticipantArrivalVenueResult = Object.freeze({
  kind: "unavailable",
  code: "THREE_PARTICIPANT_ARRIVAL_VENUE_UNAVAILABLE",
});
const PAIR_INPUT_KEYS = [
  "ownerId",
  "recipientId",
  "sharingGrant",
  "normalizedStatus",
  "reciprocalIntent",
  "coordinationWindow",
  "ownerAvailabilityPermission",
  "recipientAvailabilityPermission",
  "nowEpochMs",
  "freshnessMaxAgeMs",
  "minimumDurationMs",
] as const;

type Timestamp = Readonly<{ text: string; epochMs: number }>;
type Slot = Readonly<{
  startAt: string;
  endAt: string;
  startEpochMs: number;
  endEpochMs: number;
}>;
type AuthorizedTriad = Readonly<{
  flightOwner: Readonly<{ id: string; name: string }>;
  namedRecipient: Readonly<{ id: string; name: string }>;
  coordinator: Readonly<{ id: string; name: string }>;
  coordinationId: string;
}>;
type SanitizedProfile = Readonly<{
  participantId: string;
  city: string;
  stateCode: string;
  accessibility: readonly string[];
  amenities: readonly string[];
}>;
type FixtureVenue = Readonly<{
  id: string;
  name: string;
  city: string;
  stateCode: string;
  accessibility: readonly string[];
  amenities: readonly string[];
  injectedVerified: boolean;
}>;

function exactRecord(
  value: unknown,
  allowed: readonly string[],
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return null;
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== allowed.length ||
    keys.some((key) => typeof key !== "string" || !allowed.includes(key))
  ) {
    return null;
  }

  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return null;
    }
    result[key] = descriptor.value;
  }
  return result;
}

function exactArray(
  value: unknown,
  maximumLength: number,
): readonly unknown[] | null {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    value.length > maximumLength
  ) {
    return null;
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) return null;

  const result: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return null;
    }
    result.push(descriptor.value);
  }
  return result;
}

function validMemberId(value: unknown): value is string {
  return (
    typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)
  );
}

function validOpaqueCoordinationId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^coord_[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(value)
  );
}

function validText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 120 &&
    !/[\u0000-\u001F\u007F]/.test(value)
  );
}

function validStateCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}

function validTerm(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_-]{0,63}$/.test(value);
}

function validTerms(value: unknown): readonly string[] | null {
  const candidates = exactArray(value, 16);
  if (!candidates || candidates.some((candidate) => !validTerm(candidate))) {
    return null;
  }
  const terms = candidates as readonly string[];
  return new Set(terms).size === terms.length ? terms : null;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function timestamp(value: unknown): Timestamp | null {
  if (typeof value !== "string" || value.length !== 24) return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second, millisecond] = match
    .slice(1)
    .map(Number);
  if (
    year! < 1 ||
    year! > 9_999 ||
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    day! > daysInMonth(year!, month!) ||
    hour! > 23 ||
    minute! > 59 ||
    second! > 59 ||
    millisecond! > 999
  ) {
    return null;
  }
  const epochMs = Date.parse(value);
  return Number.isSafeInteger(epochMs) ? { text: value, epochMs } : null;
}

function role(value: unknown): ThreeParticipantRole | null {
  return typeof value === "string" &&
    THREE_PARTICIPANT_ROLES.includes(value as ThreeParticipantRole)
    ? (value as ThreeParticipantRole)
    : null;
}

function allowedUse(value: unknown): ThreeParticipantAllowedUse | null {
  return typeof value === "string" &&
    THREE_PARTICIPANT_ALLOWED_USES.includes(value as ThreeParticipantAllowedUse)
    ? (value as ThreeParticipantAllowedUse)
    : null;
}

function exactAllowedUses(
  value: unknown,
  participantRole: ThreeParticipantRole,
): readonly ThreeParticipantAllowedUse[] | null {
  const uses = exactArray(value, THREE_PARTICIPANT_ALLOWED_USES.length);
  if (!uses || uses.some((use) => !allowedUse(use))) return null;
  const knownUses = uses as readonly ThreeParticipantAllowedUse[];
  const expected = THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE[participantRole];
  return knownUses.length === expected.length &&
    new Set(knownUses).size === knownUses.length &&
    knownUses.every((use) => expected.includes(use)) &&
    expected.every((use) => knownUses.includes(use))
    ? knownUses
    : null;
}

function parseParticipant(value: unknown): Readonly<{
  id: string;
  name: string;
  role: ThreeParticipantRole;
}> | null {
  const participant = exactRecord(value, ["id", "name", "role"]);
  const parsedRole = participant ? role(participant.role) : null;
  return participant &&
    validMemberId(participant.id) &&
    validText(participant.name) &&
    parsedRole
    ? { id: participant.id, name: participant.name, role: parsedRole }
    : null;
}

function parseAuthorization(
  value: unknown,
): ThreeParticipantAuthorization | null {
  const authorization = exactRecord(value, [
    "version",
    "state",
    "participantId",
    "participantName",
    "role",
    "purpose",
    "coordinationId",
    "otherParticipantIds",
    "allowedUses",
    "grantedAt",
    "expiresAt",
    "revokedAt",
  ]);
  const parsedRole = authorization ? role(authorization.role) : null;
  const otherParticipantIds = authorization
    ? exactArray(authorization.otherParticipantIds, 2)
    : null;
  const allowedUses =
    parsedRole && authorization
      ? exactAllowedUses(authorization.allowedUses, parsedRole)
      : null;
  return authorization &&
    authorization.version === THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION &&
    (authorization.state === "granted" || authorization.state === "revoked") &&
    validMemberId(authorization.participantId) &&
    validText(authorization.participantName) &&
    parsedRole &&
    authorization.purpose === THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE &&
    validOpaqueCoordinationId(authorization.coordinationId) &&
    otherParticipantIds &&
    otherParticipantIds.every(validMemberId) &&
    new Set(otherParticipantIds).size === otherParticipantIds.length &&
    allowedUses &&
    typeof authorization.grantedAt === "string" &&
    typeof authorization.expiresAt === "string" &&
    (authorization.revokedAt === null ||
      typeof authorization.revokedAt === "string")
    ? {
        version: THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION,
        state: authorization.state,
        participantId: authorization.participantId,
        participantName: authorization.participantName,
        role: parsedRole,
        purpose: THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE,
        coordinationId: authorization.coordinationId,
        otherParticipantIds: otherParticipantIds as readonly string[],
        allowedUses,
        grantedAt: authorization.grantedAt,
        expiresAt: authorization.expiresAt,
        revokedAt: authorization.revokedAt,
      }
    : null;
}

function exactOtherParticipants(
  candidate: readonly string[],
  participantId: string,
  allParticipantIds: readonly string[],
): boolean {
  const expected = allParticipantIds.filter((id) => id !== participantId);
  return (
    candidate.length === 2 &&
    candidate.every((id) => expected.includes(id)) &&
    expected.every((id) => candidate.includes(id))
  );
}

function authorizedTriad(
  participantInput: unknown,
  authorizationInput: unknown,
  nowEpochMs: number,
): AuthorizedTriad | null {
  const participants = exactArray(participantInput, 3);
  const authorizations = exactArray(authorizationInput, 3);
  if (
    !participants ||
    participants.length !== 3 ||
    !authorizations ||
    authorizations.length !== 3
  ) {
    return null;
  }
  const parsedParticipants = participants.map(parseParticipant);
  const parsedAuthorizations = authorizations.map(parseAuthorization);
  if (
    parsedParticipants.some((value) => !value) ||
    parsedAuthorizations.some((value) => !value)
  ) {
    return null;
  }
  const knownParticipants = parsedParticipants as NonNullable<
    (typeof parsedParticipants)[number]
  >[];
  const knownAuthorizations = parsedAuthorizations as NonNullable<
    (typeof parsedAuthorizations)[number]
  >[];
  const participantIds = knownParticipants.map((participant) => participant.id);
  const coordinationIds = new Set(
    knownAuthorizations.map((authorization) => authorization.coordinationId),
  );
  if (
    new Set(participantIds).size !== 3 ||
    new Set(knownParticipants.map((participant) => participant.role)).size !==
      3 ||
    new Set(knownAuthorizations.map((authorization) => authorization.role))
      .size !== 3 ||
    new Set(
      knownAuthorizations.map((authorization) => authorization.participantId),
    ).size !== 3 ||
    coordinationIds.size !== 1
  ) {
    return null;
  }

  for (const participant of knownParticipants) {
    const authorization = knownAuthorizations.find(
      (candidate) => candidate.role === participant.role,
    );
    if (!authorization) return null;
    const grantedAt = timestamp(authorization.grantedAt);
    const expiresAt = timestamp(authorization.expiresAt);
    if (
      authorization.state !== "granted" ||
      authorization.revokedAt !== null ||
      authorization.participantId !== participant.id ||
      authorization.participantName !== participant.name ||
      !grantedAt ||
      !expiresAt ||
      grantedAt.epochMs > nowEpochMs ||
      nowEpochMs >= expiresAt.epochMs ||
      !exactOtherParticipants(
        authorization.otherParticipantIds,
        participant.id,
        participantIds,
      )
    ) {
      return null;
    }
  }

  const byRole = new Map(
    knownParticipants.map((participant) => [participant.role, participant]),
  );
  const flightOwner = byRole.get("flight_owner");
  const namedRecipient = byRole.get("named_recipient");
  const coordinator = byRole.get("initiating_coordinator");
  const coordinationId = coordinationIds.values().next().value;
  return flightOwner &&
    namedRecipient &&
    coordinator &&
    typeof coordinationId === "string"
    ? { flightOwner, namedRecipient, coordinator, coordinationId }
    : null;
}

function canonicalPairSlot(
  value: unknown,
  flightOwnerId: string,
  namedRecipientId: string,
  nowEpochMs: number,
): Slot | null {
  const pairInput = exactRecord(value, PAIR_INPUT_KEYS);
  if (
    !pairInput ||
    pairInput.ownerId !== flightOwnerId ||
    pairInput.recipientId !== namedRecipientId ||
    pairInput.nowEpochMs !== nowEpochMs
  ) {
    return null;
  }
  const result = resolveSimulatedArrivalMeetingTime(
    pairInput as ArrivalCoordinationLifecycleInput,
  );
  if ("kind" in result) return null;
  const startAt = timestamp(result.startAt);
  const endAt = timestamp(result.endAt);
  return startAt && endAt && endAt.epochMs > startAt.epochMs
    ? {
        startAt: startAt.text,
        endAt: endAt.text,
        startEpochMs: startAt.epochMs,
        endEpochMs: endAt.epochMs,
      }
    : null;
}

function coordinatorAvailabilityFromActivePermission(
  value: unknown,
  triad: AuthorizedTriad,
  nowEpochMs: number,
): unknown | null {
  const permission = exactRecord(value, [
    "version",
    "state",
    "coordinatorId",
    "flightOwnerId",
    "namedRecipientId",
    "purpose",
    "coordinationId",
    "grantedAt",
    "expiresAt",
    "revokedAt",
    "availability",
  ]);
  if (
    !permission ||
    permission.version !== THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION ||
    permission.state !== "granted" ||
    permission.coordinatorId !== triad.coordinator.id ||
    permission.flightOwnerId !== triad.flightOwner.id ||
    permission.namedRecipientId !== triad.namedRecipient.id ||
    permission.purpose !== THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE ||
    permission.coordinationId !== triad.coordinationId ||
    permission.revokedAt !== null
  ) {
    return null;
  }
  const grantedAt = timestamp(permission.grantedAt);
  const expiresAt = timestamp(permission.expiresAt);
  return grantedAt &&
    expiresAt &&
    grantedAt.epochMs <= nowEpochMs &&
    nowEpochMs < expiresAt.epochMs
    ? permission.availability
    : null;
}

function coordinatorContainsOpenSlot(value: unknown, slot: Slot): boolean {
  const availability = exactRecord(value, ["kind", "window", "busy"]);
  if (!availability || availability.kind !== "known") return false;
  const window = exactRecord(availability.window, ["startAt", "endAt"]);
  const busy = exactArray(availability.busy, 1_000);
  const windowStart = window ? timestamp(window.startAt) : null;
  const windowEnd = window ? timestamp(window.endAt) : null;
  if (
    !window ||
    !busy ||
    !windowStart ||
    !windowEnd ||
    windowEnd.epochMs <= windowStart.epochMs ||
    windowStart.epochMs > slot.startEpochMs ||
    windowEnd.epochMs < slot.endEpochMs
  ) {
    return false;
  }

  let priorEnd = windowStart.epochMs;
  for (const candidate of busy) {
    const interval = exactRecord(candidate, ["startAt", "endAt", "timeZone"]);
    const startAt = interval ? timestamp(interval.startAt) : null;
    const endAt = interval ? timestamp(interval.endAt) : null;
    if (
      !interval ||
      interval.timeZone !== "Etc/UTC" ||
      !startAt ||
      !endAt ||
      startAt.epochMs < windowStart.epochMs ||
      endAt.epochMs > windowEnd.epochMs ||
      endAt.epochMs <= startAt.epochMs ||
      startAt.epochMs < priorEnd ||
      (startAt.epochMs < slot.endEpochMs && slot.startEpochMs < endAt.epochMs)
    ) {
      return false;
    }
    priorEnd = endAt.epochMs;
  }
  return true;
}

function parseProfile(value: unknown): SanitizedProfile | null {
  const profile = exactRecord(value, [
    "participantId",
    "city",
    "stateCode",
    "accessibility",
    "amenities",
  ]);
  const accessibility = profile ? validTerms(profile.accessibility) : null;
  const amenities = profile ? validTerms(profile.amenities) : null;
  return profile &&
    validMemberId(profile.participantId) &&
    validText(profile.city) &&
    validStateCode(profile.stateCode) &&
    accessibility &&
    amenities
    ? {
        participantId: profile.participantId,
        city: profile.city,
        stateCode: profile.stateCode,
        accessibility,
        amenities,
      }
    : null;
}

function commonProfiles(
  value: unknown,
  participants: AuthorizedTriad,
): readonly SanitizedProfile[] | null {
  const profiles = exactArray(value, 3);
  if (!profiles || profiles.length !== 3) return null;
  const parsed = profiles.map(parseProfile);
  if (parsed.some((profile) => !profile)) return null;
  const known = parsed as SanitizedProfile[];
  const participantIds = [
    participants.flightOwner.id,
    participants.namedRecipient.id,
    participants.coordinator.id,
  ];
  if (
    new Set(known.map((profile) => profile.participantId)).size !== 3 ||
    !participantIds.every((id) =>
      known.some((profile) => profile.participantId === id),
    )
  ) {
    return null;
  }
  const first = known[0];
  return first &&
    known.every(
      (profile) =>
        profile.city === first.city && profile.stateCode === first.stateCode,
    )
    ? known
    : null;
}

function parseVenue(value: unknown): FixtureVenue | null {
  const venue = exactRecord(value, [
    "id",
    "name",
    "city",
    "stateCode",
    "accessibility",
    "amenities",
    "injected_verified",
  ]);
  const accessibility = venue ? validTerms(venue.accessibility) : null;
  const amenities = venue ? validTerms(venue.amenities) : null;
  return venue &&
    typeof venue.id === "string" &&
    /^fixture_[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(venue.id) &&
    validText(venue.name) &&
    validText(venue.city) &&
    validStateCode(venue.stateCode) &&
    accessibility &&
    amenities &&
    typeof venue.injected_verified === "boolean"
    ? {
        id: venue.id,
        name: venue.name,
        city: venue.city,
        stateCode: venue.stateCode,
        accessibility,
        amenities,
        injectedVerified: venue.injected_verified,
      }
    : null;
}

function includesAll(
  values: readonly string[],
  expected: readonly string[],
): boolean {
  return expected.every((value) => values.includes(value));
}

function firstMatchingFixtureVenue(
  value: unknown,
  profiles: readonly SanitizedProfile[],
): FixtureVenue | null {
  const candidates = exactArray(value, 100);
  if (!candidates || candidates.length === 0) return null;
  const parsed = candidates.map(parseVenue);
  if (parsed.some((candidate) => !candidate)) return null;
  const knownCandidates = parsed as FixtureVenue[];
  const firstProfile = profiles[0];
  if (!firstProfile) return null;
  const requiredAccessibility = [
    ...new Set(profiles.flatMap((profile) => profile.accessibility)),
  ];
  const requestedAmenities = [
    ...new Set(profiles.flatMap((profile) => profile.amenities)),
  ];
  return (
    knownCandidates.find(
      (candidate) =>
        candidate.injectedVerified &&
        candidate.city === firstProfile.city &&
        candidate.stateCode === firstProfile.stateCode &&
        includesAll(candidate.accessibility, requiredAccessibility) &&
        includesAll(candidate.amenities, requestedAmenities),
    ) ?? null
  );
}

function available(
  slot: Slot,
  venue: FixtureVenue,
): ThreeParticipantArrivalVenueResult {
  return Object.freeze({
    startAt: slot.startAt,
    endAt: slot.endAt,
    venue: Object.freeze({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      stateCode: venue.stateCode,
    }),
    explanation: THREE_PARTICIPANT_FIXTURE_EXPLANATION,
  });
}

/**
 * Pure, injected three-participant fixture composition. It can neither discover
 * participants nor use unapproved information, and it never produces a fallback.
 */
export function resolveThreeParticipantArrivalVenue(
  input: ThreeParticipantArrivalVenueInput,
): ThreeParticipantArrivalVenueResult {
  try {
    if (
      typeof input.nowEpochMs !== "number" ||
      !Number.isSafeInteger(input.nowEpochMs)
    ) {
      return UNAVAILABLE;
    }
    const triad = authorizedTriad(
      input.participants,
      input.authorizations,
      input.nowEpochMs,
    );
    if (!triad) return UNAVAILABLE;

    const slot = canonicalPairSlot(
      input.pairInput,
      triad.flightOwner.id,
      triad.namedRecipient.id,
      input.nowEpochMs,
    );
    if (!slot) return UNAVAILABLE;

    const coordinatorAvailability = coordinatorAvailabilityFromActivePermission(
      input.coordinatorAvailabilityPermission,
      triad,
      input.nowEpochMs,
    );
    if (
      !coordinatorAvailability ||
      !coordinatorContainsOpenSlot(coordinatorAvailability, slot)
    ) {
      return UNAVAILABLE;
    }

    const profiles = commonProfiles(input.profiles, triad);
    if (!profiles) return UNAVAILABLE;
    const venue = firstMatchingFixtureVenue(input.venueCandidates, profiles);
    return venue ? available(slot, venue) : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}
