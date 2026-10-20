import { describe, expect, it } from "vitest";

import {
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
} from "../arrival-coordination-lifecycle-contracts";
import {
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE,
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION,
} from "../arrival-coordination-contracts";
import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
} from "../sharing-contracts";
import {
  THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE,
  THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE,
  THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION,
  THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE,
  THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION,
  THREE_PARTICIPANT_FIXTURE_EXPLANATION,
  type ThreeParticipantArrivalVenueInput,
  type ThreeParticipantAuthorization,
  type ThreeParticipantRole,
} from "../three-participant-arrival-venue-contracts";
import { resolveThreeParticipantArrivalVenue } from "../three-participant-arrival-venue-composition";

const NOW = 1_792_756_800_000;
const WINDOW = Object.freeze({
  startAt: "2026-10-23T12:00:00.000Z",
  endAt: "2026-10-23T18:00:00.000Z",
});
const SLOT = Object.freeze({
  startAt: "2026-10-23T13:00:00.000Z",
  endAt: "2026-10-23T14:00:00.000Z",
});
const PARTICIPANTS = Object.freeze([
  Object.freeze({ id: "sean", name: "Sean", role: "flight_owner" as const }),
  Object.freeze({ id: "mia", name: "Mia", role: "named_recipient" as const }),
  Object.freeze({
    id: "avery",
    name: "Avery",
    role: "initiating_coordinator" as const,
  }),
]);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) {
      deepFreeze(Reflect.get(value, key));
    }
    Object.freeze(value);
  }
  return value;
}

function authorizationFor(
  role: ThreeParticipantRole,
): ThreeParticipantAuthorization {
  const participant = PARTICIPANTS.find((candidate) => candidate.role === role);
  if (!participant) throw new Error("missing fixture participant");
  return {
    version: THREE_PARTICIPANT_ARRIVAL_VENUE_VERSION,
    state: "granted",
    participantId: participant.id,
    participantName: participant.name,
    role,
    purpose: THREE_PARTICIPANT_ARRIVAL_VENUE_PURPOSE,
    coordinationId: "coord_fixture_triage_01",
    otherParticipantIds: PARTICIPANTS.filter(
      (candidate) => candidate.id !== participant.id,
    ).map((candidate) => candidate.id),
    allowedUses: [...THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE[role]],
    grantedAt: "2026-10-23T10:00:00.000Z",
    expiresAt: "2026-10-23T20:00:00.000Z",
    revokedAt: null,
  };
}

function buildInput(): ThreeParticipantArrivalVenueInput {
  return {
    participants: PARTICIPANTS,
    authorizations: [
      authorizationFor("flight_owner"),
      authorizationFor("named_recipient"),
      authorizationFor("initiating_coordinator"),
    ],
    pairInput: {
      ownerId: "sean",
      recipientId: "mia",
      sharingGrant: {
        version: FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
        state: "granted",
        ownerId: "sean",
        recipientId: "mia",
        purpose: FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
        allowedFields: ["status", "arrival_estimated_at", "observed_at"],
        grantedAt: "2026-10-23T10:00:00.000Z",
        expiresAt: "2026-10-23T20:00:00.000Z",
        revokedAt: null,
      },
      normalizedStatus: {
        state: "en_route",
        arrival: { estimatedAt: SLOT.startAt },
        observedAt: "2026-10-23T11:30:00.000Z",
      },
      reciprocalIntent: {
        version: RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION,
        state: "granted",
        ownerId: "sean",
        recipientId: "mia",
        purpose: RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE,
        grantedAt: "2026-10-23T10:00:00.000Z",
        expiresAt: "2026-10-23T20:00:00.000Z",
        revokedAt: null,
        arrivalWindowStartAt: WINDOW.startAt,
        arrivalWindowEndAt: WINDOW.endAt,
      },
      coordinationWindow: WINDOW,
      ownerAvailabilityPermission: {
        version: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
        state: "granted",
        ownerId: "sean",
        recipientId: "mia",
        purpose: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
        grantedAt: "2026-10-23T10:00:00.000Z",
        expiresAt: "2026-10-23T20:00:00.000Z",
        revokedAt: null,
        availability: { kind: "known", window: WINDOW, busy: [] },
      },
      recipientAvailabilityPermission: {
        version: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
        state: "granted",
        ownerId: "mia",
        recipientId: "sean",
        purpose: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
        grantedAt: "2026-10-23T10:00:00.000Z",
        expiresAt: "2026-10-23T20:00:00.000Z",
        revokedAt: null,
        availability: { kind: "known", window: WINDOW, busy: [] },
      },
      nowEpochMs: NOW,
      freshnessMaxAgeMs: 60 * 60 * 1_000,
      minimumDurationMs: 60 * 60 * 1_000,
    },
    coordinatorAvailabilityPermission: {
      version: THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_VERSION,
      state: "granted",
      coordinatorId: "avery",
      flightOwnerId: "sean",
      namedRecipientId: "mia",
      purpose: THREE_PARTICIPANT_COORDINATOR_AVAILABILITY_PURPOSE,
      coordinationId: "coord_fixture_triage_01",
      grantedAt: "2026-10-23T10:00:00.000Z",
      expiresAt: "2026-10-23T20:00:00.000Z",
      revokedAt: null,
      availability: { kind: "known", window: WINDOW, busy: [] },
    },
    profiles: [
      {
        participantId: "sean",
        city: "Philadelphia",
        stateCode: "PA",
        accessibility: ["step_free"],
        amenities: ["vegan"],
      },
      {
        participantId: "mia",
        city: "Philadelphia",
        stateCode: "PA",
        accessibility: ["step_free"],
        amenities: ["outdoor"],
      },
      {
        participantId: "avery",
        city: "Philadelphia",
        stateCode: "PA",
        accessibility: ["step_free"],
        amenities: ["vegan"],
      },
    ],
    venueCandidates: [
      {
        id: "fixture_first_venue",
        name: "First Fixture Venue",
        city: "Philadelphia",
        stateCode: "PA",
        accessibility: ["step_free"],
        amenities: ["vegan", "outdoor"],
        injected_verified: true,
      },
      {
        id: "fixture_second_venue",
        name: "Second Fixture Venue",
        city: "Philadelphia",
        stateCode: "PA",
        accessibility: ["step_free"],
        amenities: ["vegan", "outdoor"],
        injected_verified: true,
      },
    ],
    nowEpochMs: NOW,
  };
}

type MutableFixtureInput = {
  authorizations: Array<Record<string, unknown>>;
  pairInput: {
    nowEpochMs: unknown;
    ownerAvailabilityPermission: Record<string, unknown>;
    [key: string]: unknown;
  };
  coordinatorAvailabilityPermission: Record<string, unknown>;
  profiles: Array<Record<string, unknown>>;
  venueCandidates: Array<Record<string, unknown>>;
};

function mutableInput(): MutableFixtureInput {
  return structuredClone(buildInput()) as unknown as MutableFixtureInput;
}

function expectUnavailable(input: unknown): void {
  expect(
    resolveThreeParticipantArrivalVenue(
      input as ThreeParticipantArrivalVenueInput,
    ),
  ).toEqual({
    kind: "unavailable",
    code: "THREE_PARTICIPANT_ARRIVAL_VENUE_UNAVAILABLE",
  });
}

describe("three participant injected arrival venue composition", () => {
  it("composes the canonical Sean/Mia pair slot with exact role uses and an active triad-bound coordinator availability permission", () => {
    const input = deepFreeze(buildInput());
    const result = resolveThreeParticipantArrivalVenue(input);

    expect(result).toEqual({
      ...SLOT,
      venue: {
        id: "fixture_first_venue",
        name: "First Fixture Venue",
        city: "Philadelphia",
        stateCode: "PA",
      },
      explanation: THREE_PARTICIPANT_FIXTURE_EXPLANATION,
    });
    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(input.authorizations)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect("kind" in result).toBe(false);
    if (!("kind" in result)) {
      expect(Object.isFrozen(result.venue)).toBe(true);
      expect(Object.keys(result.venue).sort()).toEqual([
        "city",
        "id",
        "name",
        "stateCode",
      ]);
    }
  });

  it("denies every participant's missing, revoked, expired, future, mismatched, or broad authorization before pair inspection", () => {
    const roles: readonly ThreeParticipantRole[] = [
      "flight_owner",
      "named_recipient",
      "initiating_coordinator",
    ];
    for (const role of roles) {
      for (const mutation of [
        "missing",
        "revoked",
        "expired",
        "future",
        "mismatched",
        "broad",
      ] as const) {
        const input = mutableInput();
        const index = input.authorizations.findIndex(
          (authorization) => authorization.role === role,
        );
        if (mutation === "missing") {
          input.authorizations.splice(index, 1);
        } else if (mutation === "revoked") {
          input.authorizations[index] = {
            ...input.authorizations[index],
            state: "revoked",
            revokedAt: "2026-10-23T11:00:00.000Z",
          };
        } else if (mutation === "expired") {
          input.authorizations[index] = {
            ...input.authorizations[index],
            expiresAt: "2026-10-23T12:00:00.000Z",
          };
        } else if (mutation === "future") {
          input.authorizations[index] = {
            ...input.authorizations[index],
            grantedAt: "2026-10-23T12:01:00.000Z",
          };
        } else if (mutation === "mismatched") {
          input.authorizations[index] = {
            ...input.authorizations[index],
            participantName: "Different Name",
          };
        } else {
          input.authorizations[index] = {
            ...input.authorizations[index],
            otherParticipantIds: ["sean", "mia", "avery"],
          };
        }
        expectUnavailable(input);
      }
    }
  });

  it("denies each missing, duplicate, broadened, and wrong-role use without inspecting the pair", () => {
    const roles: readonly ThreeParticipantRole[] = [
      "flight_owner",
      "named_recipient",
      "initiating_coordinator",
    ];
    for (const role of roles) {
      const expectedUses = THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE[role];
      const indexFor = (input: MutableFixtureInput) =>
        input.authorizations.findIndex(
          (authorization) => authorization.role === role,
        );
      for (const missingUse of expectedUses) {
        const input = mutableInput();
        const index = indexFor(input);
        input.authorizations[index] = {
          ...input.authorizations[index],
          allowedUses: expectedUses.filter((use) => use !== missingUse),
        };
        expectUnavailable(input);
      }

      const duplicateUse = mutableInput();
      const duplicateIndex = indexFor(duplicateUse);
      duplicateUse.authorizations[duplicateIndex] = {
        ...duplicateUse.authorizations[duplicateIndex],
        allowedUses: [expectedUses[0], ...expectedUses],
      };
      expectUnavailable(duplicateUse);

      const broadenedUse = mutableInput();
      const broadenedIndex = indexFor(broadenedUse);
      broadenedUse.authorizations[broadenedIndex] = {
        ...broadenedUse.authorizations[broadenedIndex],
        allowedUses: [...expectedUses, "outside_fixture_use"],
      };
      expectUnavailable(broadenedUse);

      const wrongRoleUses = mutableInput();
      const wrongRoleIndex = indexFor(wrongRoleUses);
      wrongRoleUses.authorizations[wrongRoleIndex] = {
        ...wrongRoleUses.authorizations[wrongRoleIndex],
        allowedUses: [
          ...THREE_PARTICIPANT_ALLOWED_USES_BY_ROLE[
            role === "flight_owner" ? "named_recipient" : "flight_owner"
          ],
        ],
      };
      expectUnavailable(wrongRoleUses);
    }
  });

  it("requires a matching active coordinator envelope before inspecting its busy-only snapshot", () => {
    const mismatchFields = [
      "version",
      "coordinatorId",
      "flightOwnerId",
      "namedRecipientId",
      "purpose",
      "coordinationId",
      "state",
      "revokedAt",
      "expiresAt",
      "grantedAt",
    ] as const;
    for (const field of mismatchFields) {
      const input = mutableInput();
      const replacements: Record<(typeof mismatchFields)[number], unknown> = {
        version: "wrong-version",
        coordinatorId: "other",
        flightOwnerId: "other",
        namedRecipientId: "other",
        purpose: "wrong-purpose",
        coordinationId: "coord_other_01",
        state: "revoked",
        revokedAt: "2026-10-23T11:00:00.000Z",
        expiresAt: "2026-10-23T12:00:00.000Z",
        grantedAt: "2026-10-23T12:01:00.000Z",
      };
      input.coordinatorAvailabilityPermission[field] = replacements[field];
      expectUnavailable(input);
    }

    const mismatchedBeforeBusyInspection = mutableInput();
    let busyReads = 0;
    mismatchedBeforeBusyInspection.coordinatorAvailabilityPermission = {
      ...mismatchedBeforeBusyInspection.coordinatorAvailabilityPermission,
      coordinatorId: "other",
      availability: new Proxy(
        { kind: "known", window: WINDOW, busy: [] },
        {
          get: () => {
            busyReads += 1;
            throw new Error("busy snapshot must not be read");
          },
        },
      ),
    };
    expectUnavailable(mismatchedBeforeBusyInspection);
    expect(busyReads).toBe(0);
  });

  it("binds the pair clock and never invents another time when pair or coordinator availability is unavailable", () => {
    const pairClockMismatch = mutableInput();
    pairClockMismatch.pairInput.nowEpochMs = NOW + 1;
    expectUnavailable(pairClockMismatch);

    const pairUnavailable = mutableInput();
    pairUnavailable.pairInput.ownerAvailabilityPermission = {
      ...pairUnavailable.pairInput.ownerAvailabilityPermission,
      state: "revoked",
      revokedAt: "2026-10-23T11:00:00.000Z",
    };
    expectUnavailable(pairUnavailable);

    const unknownCoordinator = mutableInput();
    unknownCoordinator.coordinatorAvailabilityPermission = {
      ...unknownCoordinator.coordinatorAvailabilityPermission,
      availability: { kind: "unknown", code: "source-unavailable" },
    };
    expectUnavailable(unknownCoordinator);

    const busyCoordinator = mutableInput();
    busyCoordinator.coordinatorAvailabilityPermission = {
      ...busyCoordinator.coordinatorAvailabilityPermission,
      availability: {
        kind: "known",
        window: WINDOW,
        busy: [{ ...SLOT, timeZone: "Etc/UTC" }],
      },
    };
    expectUnavailable(busyCoordinator);

    const shortCoordinatorWindow = mutableInput();
    shortCoordinatorWindow.coordinatorAvailabilityPermission = {
      ...shortCoordinatorWindow.coordinatorAvailabilityPermission,
      availability: {
        kind: "known",
        window: { startAt: WINDOW.startAt, endAt: "2026-10-23T13:30:00.000Z" },
        busy: [],
      },
    };
    expectUnavailable(shortCoordinatorWindow);
  });

  it("requires one common sanitized destination and only emits stripped first-match fixture venue fields", () => {
    const inconsistentDestination = mutableInput();
    inconsistentDestination.profiles[2] = {
      ...inconsistentDestination.profiles[2],
      city: "Baltimore",
    };
    expectUnavailable(inconsistentDestination);

    const firstMatch = mutableInput();
    firstMatch.venueCandidates = [
      firstMatch.venueCandidates[1]!,
      firstMatch.venueCandidates[0]!,
    ];
    const firstResult = resolveThreeParticipantArrivalVenue(
      firstMatch as unknown as ThreeParticipantArrivalVenueInput,
    );
    expect("kind" in firstResult).toBe(false);
    if (!("kind" in firstResult)) {
      expect(firstResult.venue.id).toBe("fixture_second_venue");
      expect("injected_verified" in firstResult.venue).toBe(false);
      expect("accessibility" in firstResult.venue).toBe(false);
      expect("amenities" in firstResult.venue).toBe(false);
    }

    const extraVenueFact = mutableInput();
    extraVenueFact.venueCandidates[0] = {
      ...extraVenueFact.venueCandidates[0],
      address: "hostile-fixture-only-value",
    };
    expectUnavailable(extraVenueFact);
  });

  it("fails closed for hostile getter or proxy input and preserves deeply frozen input", () => {
    const getterInput = mutableInput();
    const profile = { ...getterInput.profiles[0] };
    Object.defineProperty(profile, "city", {
      enumerable: true,
      get: () => {
        throw new Error("hostile getter must not be invoked");
      },
    });
    getterInput.profiles[0] = profile;
    expectUnavailable(getterInput);

    const hostileProxy = new Proxy(buildInput(), {
      get: () => {
        throw new Error("hostile proxy");
      },
    });
    expectUnavailable(hostileProxy);

    const frozenInput = deepFreeze(buildInput());
    const before = structuredClone(frozenInput);
    resolveThreeParticipantArrivalVenue(frozenInput);
    expect(frozenInput).toEqual(before);
    expect(Object.isFrozen(frozenInput.profiles[0])).toBe(true);
  });
});
