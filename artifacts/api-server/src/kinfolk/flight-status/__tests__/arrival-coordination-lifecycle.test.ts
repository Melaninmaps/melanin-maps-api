import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  BusyInterval,
  CalendarAvailabilityResult,
  CalendarAvailabilityWindow,
} from "../../calendar-availability/contracts";
import { normalizeGoogleFreeBusy } from "../../calendar-availability/normalizers";
import type { ReciprocalArrivalCoordinationIntent } from "../arrival-coordination-contracts";
import {
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
  type ArrivalCoordinationAvailabilityPermission,
  type ArrivalCoordinationLifecycleInput,
} from "../arrival-coordination-lifecycle-contracts";
import { resolveSimulatedArrivalMeetingTime } from "../arrival-coordination-lifecycle";
import type { NormalizedFlightStatus } from "../contracts";
import { normalizeFlightStatusPayload } from "../normalizers";
import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
  type FlightArrivalCoordinationSharingGrant,
} from "../sharing-contracts";

const nowEpochMs = Date.parse("2026-10-19T12:00:00.000Z");
const ownerId = "member-sean";
const recipientId = "member-mia";
const window: CalendarAvailabilityWindow = {
  startAt: "2026-10-19T13:00:00.000Z",
  endAt: "2026-10-19T15:00:00.000Z",
};
const unavailable = {
  kind: "unavailable",
  code: "ARRIVAL_COORDINATION_LIFECYCLE_UNAVAILABLE",
};

function sharingGrant(
  overrides: Partial<FlightArrivalCoordinationSharingGrant> = {},
): FlightArrivalCoordinationSharingGrant {
  return {
    version: FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
    state: "granted",
    ownerId,
    recipientId,
    purpose: FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
    allowedFields: ["status", "arrival_estimated_at", "observed_at"],
    grantedAt: "2026-10-19T11:00:00.000Z",
    expiresAt: "2026-10-19T13:00:00.000Z",
    revokedAt: null,
    ...overrides,
  };
}

function reciprocalIntent(
  overrides: Partial<ReciprocalArrivalCoordinationIntent> = {},
): ReciprocalArrivalCoordinationIntent {
  return {
    version: "reciprocal-arrival-coordination-intent-v1",
    state: "granted",
    ownerId,
    recipientId,
    purpose: "reciprocal_arrival_coordination",
    grantedAt: "2026-10-19T11:00:00.000Z",
    expiresAt: "2026-10-19T13:00:00.000Z",
    revokedAt: null,
    arrivalWindowStartAt: window.startAt,
    arrivalWindowEndAt: window.endAt,
    ...overrides,
  };
}

function busy(startAt: string, endAt: string): BusyInterval {
  return { startAt, endAt, timeZone: "Etc/UTC" };
}

function known(
  busyIntervals: readonly BusyInterval[] = [],
  availabilityWindow: CalendarAvailabilityWindow = window,
): CalendarAvailabilityResult {
  return { kind: "known", window: availabilityWindow, busy: busyIntervals };
}

function availabilityPermission(
  permissionOwnerId: string,
  permissionRecipientId: string,
  overrides: Partial<ArrivalCoordinationAvailabilityPermission> = {},
): ArrivalCoordinationAvailabilityPermission {
  return {
    version: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
    state: "granted",
    ownerId: permissionOwnerId,
    recipientId: permissionRecipientId,
    purpose: ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
    grantedAt: "2026-10-19T11:00:00.000Z",
    expiresAt: "2026-10-19T13:00:00.000Z",
    revokedAt: null,
    availability: known(),
    ...overrides,
  };
}

const enRouteStatus: NormalizedFlightStatus = {
  state: "en_route",
  arrival: { estimatedAt: "2026-10-19T13:15:00.000Z" },
  observedAt: "2026-10-19T11:59:30.000Z",
};

function input(
  overrides: Partial<ArrivalCoordinationLifecycleInput> = {},
): ArrivalCoordinationLifecycleInput {
  return {
    ownerId,
    recipientId,
    sharingGrant: sharingGrant(),
    normalizedStatus: enRouteStatus,
    reciprocalIntent: reciprocalIntent(),
    coordinationWindow: window,
    ownerAvailabilityPermission: availabilityPermission(ownerId, recipientId, {
      availability: known([
        busy("2026-10-19T13:15:00.000Z", "2026-10-19T13:30:00.000Z"),
      ]),
    }),
    recipientAvailabilityPermission: availabilityPermission(
      recipientId,
      ownerId,
      {
        availability: known([
          busy("2026-10-19T13:30:00.000Z", "2026-10-19T14:00:00.000Z"),
        ]),
      },
    ),
    nowEpochMs,
    freshnessMaxAgeMs: 60_000,
    minimumDurationMs: 30 * 60 * 1_000,
    ...overrides,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const descriptor of Object.values(
      Object.getOwnPropertyDescriptors(value),
    )) {
      if ("value" in descriptor) deepFreeze(descriptor.value);
    }
    Object.freeze(value);
  }
  return value;
}

describe("simulated arrival meeting-time lifecycle", () => {
  it("composes sharing, eligibility, pair-bound busy snapshots, and earliest slot selection", () => {
    const frozenInput = deepFreeze(input());
    const result = resolveSimulatedArrivalMeetingTime(frozenInput);

    expect(result).toEqual({
      startAt: "2026-10-19T14:00:00.000Z",
      endAt: "2026-10-19T14:30:00.000Z",
    });
    expect(Object.keys(result)).toEqual(["startAt", "endAt"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(frozenInput).toEqual(input());
  });

  it("uses a landed actual arrival only with matching existing sharing fields", () => {
    expect(
      resolveSimulatedArrivalMeetingTime(
        input({
          sharingGrant: sharingGrant({
            allowedFields: ["status", "arrival_actual_at", "observed_at"],
          }),
          normalizedStatus: {
            state: "landed",
            arrival: { actualAt: "2026-10-19T13:19:00.000Z" },
            observedAt: "2026-10-19T11:59:30.000Z",
          },
          ownerAvailabilityPermission: availabilityPermission(
            ownerId,
            recipientId,
            {
              availability: known(),
            },
          ),
          recipientAvailabilityPermission: availabilityPermission(
            recipientId,
            ownerId,
            { availability: known() },
          ),
        }),
      ),
    ).toEqual({
      startAt: "2026-10-19T13:19:00.000Z",
      endAt: "2026-10-19T13:49:00.000Z",
    });
  });

  it.each([
    [
      "no fraction",
      "2026-10-19T13:15:00Z",
      "2026-10-19T11:59:30Z",
      "2026-10-19T13:15:00.000Z",
      "2026-10-19T13:45:00.000Z",
    ],
    [
      "one fractional digit",
      "2026-10-19T13:15:00.1Z",
      "2026-10-19T11:59:30.1Z",
      "2026-10-19T13:15:00.100Z",
      "2026-10-19T13:45:00.100Z",
    ],
    [
      "two fractional digits",
      "2026-10-19T13:15:00.12Z",
      "2026-10-19T11:59:30.12Z",
      "2026-10-19T13:15:00.120Z",
      "2026-10-19T13:45:00.120Z",
    ],
  ])(
    "composes normalized flight timestamps with %s into canonical meeting times",
    (
      _label,
      arrivalTimestamp,
      observedTimestamp,
      expectedStartAt,
      expectedEndAt,
    ) => {
      const normalizedStatus = normalizeFlightStatusPayload({
        state: "en_route",
        arrival: { estimatedAt: arrivalTimestamp },
        observedAt: observedTimestamp,
      });

      expect(normalizedStatus).not.toBeNull();
      expect(
        resolveSimulatedArrivalMeetingTime(
          input({
            normalizedStatus,
            ownerAvailabilityPermission: availabilityPermission(
              ownerId,
              recipientId,
              { availability: known() },
            ),
            recipientAvailabilityPermission: availabilityPermission(
              recipientId,
              ownerId,
              { availability: known() },
            ),
          }),
        ),
      ).toEqual({ startAt: expectedStartAt, endAt: expectedEndAt });
    },
  );

  it.each([
    "2026-10-19T13:15:00.1234Z",
    "2026-10-19T13:15:00+00:00",
    "2026-02-30T13:15:00Z",
  ])(
    "fails closed for malformed shared arrival timestamp %s",
    (arrivalTimestamp) => {
      const normalizedStatus = normalizeFlightStatusPayload({
        state: "en_route",
        arrival: { estimatedAt: arrivalTimestamp },
        observedAt: "2026-10-19T11:59:30.000Z",
      });

      expect(
        resolveSimulatedArrivalMeetingTime(
          input({
            normalizedStatus,
            ownerAvailabilityPermission: availabilityPermission(
              ownerId,
              recipientId,
              {
                availability: known(),
              },
            ),
            recipientAvailabilityPermission: availabilityPermission(
              recipientId,
              ownerId,
              { availability: known() },
            ),
          }),
        ),
      ).toEqual(unavailable);
    },
  );

  it("keeps Calendar availability windows on strict millisecond UTC grammar", () => {
    for (const startAt of ["2026-10-19T13:00:00Z", "2026-10-19T13:00:00.1Z"]) {
      expect(
        normalizeGoogleFreeBusy(
          {},
          { startAt, endAt: "2026-10-19T15:00:00.000Z" },
        ),
      ).toEqual({ kind: "unknown", code: "invalid-window" });
    }
  });

  it("admits the exact 31-day normalized availability boundary", () => {
    const exactBoundaryWindow: CalendarAvailabilityWindow = {
      startAt: "2026-10-19T13:00:00.000Z",
      endAt: "2026-11-19T13:00:00.000Z",
    };

    expect(
      resolveSimulatedArrivalMeetingTime(
        input({
          coordinationWindow: exactBoundaryWindow,
          reciprocalIntent: reciprocalIntent({
            arrivalWindowStartAt: exactBoundaryWindow.startAt,
            arrivalWindowEndAt: exactBoundaryWindow.endAt,
          }),
          ownerAvailabilityPermission: availabilityPermission(
            ownerId,
            recipientId,
            {
              availability: known([], exactBoundaryWindow),
            },
          ),
          recipientAvailabilityPermission: availabilityPermission(
            recipientId,
            ownerId,
            { availability: known([], exactBoundaryWindow) },
          ),
        }),
      ),
    ).toEqual({
      startAt: "2026-10-19T13:15:00.000Z",
      endAt: "2026-10-19T13:45:00.000Z",
    });
  });

  it("rejects a 32-day known availability window before slot selection", () => {
    const oversizedWindow: CalendarAvailabilityWindow = {
      startAt: "2026-10-19T13:00:00.000Z",
      endAt: "2026-11-20T13:00:00.000Z",
    };

    expect(
      resolveSimulatedArrivalMeetingTime(
        input({
          coordinationWindow: oversizedWindow,
          reciprocalIntent: reciprocalIntent({
            arrivalWindowStartAt: oversizedWindow.startAt,
            arrivalWindowEndAt: oversizedWindow.endAt,
          }),
          ownerAvailabilityPermission: availabilityPermission(
            ownerId,
            recipientId,
            {
              availability: known([], oversizedWindow),
            },
          ),
          recipientAvailabilityPermission: availabilityPermission(
            recipientId,
            ownerId,
            { availability: known([], oversizedWindow) },
          ),
        }),
      ),
    ).toEqual(unavailable);
  });

  it("does not retain a prior slot after a permission becomes unavailable", () => {
    expect(resolveSimulatedArrivalMeetingTime(input())).toEqual({
      startAt: "2026-10-19T14:00:00.000Z",
      endAt: "2026-10-19T14:30:00.000Z",
    });
    expect(
      resolveSimulatedArrivalMeetingTime(
        input({
          recipientAvailabilityPermission: availabilityPermission(
            recipientId,
            ownerId,
            { state: "revoked", revokedAt: "2026-10-19T11:40:00.000Z" },
          ),
        }),
      ),
    ).toEqual(unavailable);
  });

  it.each([
    ["missing arrival share", input({ sharingGrant: null })],
    [
      "revoked arrival share",
      input({
        sharingGrant: sharingGrant({
          state: "revoked",
          revokedAt: "2026-10-19T11:30:00.000Z",
        }),
      }),
    ],
    [
      "expired arrival share",
      input({
        sharingGrant: sharingGrant({ expiresAt: "2026-10-19T11:59:59.000Z" }),
      }),
    ],
    [
      "future arrival share",
      input({
        sharingGrant: sharingGrant({ grantedAt: "2026-10-19T12:00:01.000Z" }),
      }),
    ],
    [
      "arrival share wrong purpose",
      input({ sharingGrant: sharingGrant({ purpose: "other" as never }) }),
    ],
    [
      "arrival share pair mismatch",
      input({ sharingGrant: sharingGrant({ recipientId: "member-third" }) }),
    ],
    ["missing reciprocal intent", input({ reciprocalIntent: null })],
    [
      "revoked reciprocal intent",
      input({
        reciprocalIntent: reciprocalIntent({
          state: "revoked",
          revokedAt: "2026-10-19T11:30:00.000Z",
        }),
      }),
    ],
    [
      "reciprocal intent wrong purpose",
      input({
        reciprocalIntent: reciprocalIntent({ purpose: "other" as never }),
      }),
    ],
    [
      "reciprocal intent pair mismatch",
      input({
        reciprocalIntent: reciprocalIntent({ ownerId: "member-third" }),
      }),
    ],
    [
      "intent window mismatch",
      input({
        coordinationWindow: {
          startAt: "2026-10-19T13:01:00.000Z",
          endAt: window.endAt,
        },
      }),
    ],
    [
      "missing owner availability",
      input({ ownerAvailabilityPermission: null }),
    ],
    [
      "missing recipient availability",
      input({ recipientAvailabilityPermission: null }),
    ],
    [
      "revoked owner availability",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            state: "revoked",
            revokedAt: "2026-10-19T11:40:00.000Z",
          },
        ),
      }),
    ],
    [
      "expired recipient availability",
      input({
        recipientAvailabilityPermission: availabilityPermission(
          recipientId,
          ownerId,
          {
            expiresAt: "2026-10-19T11:59:59.000Z",
          },
        ),
      }),
    ],
    [
      "future owner availability",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            grantedAt: "2026-10-19T12:00:01.000Z",
          },
        ),
      }),
    ],
    [
      "availability wrong purpose",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            purpose: "other" as never,
          },
        ),
      }),
    ],
    [
      "swapped availability pair",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          recipientId,
          ownerId,
        ),
      }),
    ],
    [
      "mixed third-party availability pair",
      input({
        recipientAvailabilityPermission: availabilityPermission(
          "member-third",
          ownerId,
        ),
      }),
    ],
    ["self pair", input({ recipientId: ownerId })],
    [
      "unknown availability",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            availability: { kind: "unknown", code: "source-unavailable" },
          },
        ),
      }),
    ],
    [
      "availability window mismatch",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            availability: {
              kind: "known",
              window: {
                startAt: "2026-10-19T13:01:00.000Z",
                endAt: window.endAt,
              },
              busy: [],
            },
          },
        ),
      }),
    ],
    [
      "no slot",
      input({
        ownerAvailabilityPermission: availabilityPermission(
          ownerId,
          recipientId,
          {
            availability: known([
              busy("2026-10-19T13:00:00.000Z", "2026-10-19T15:00:00.000Z"),
            ]),
          },
        ),
      }),
    ],
    ["invalid duration", input({ minimumDurationMs: 0 })],
    ["invalid clock", input({ nowEpochMs: Number.NaN })],
    [
      "stale arrival",
      input({
        normalizedStatus: {
          ...enRouteStatus,
          observedAt: "2026-10-19T11:58:00.000Z",
        },
      }),
    ],
    [
      "nonconservative arrival state",
      input({
        normalizedStatus: { ...enRouteStatus, state: "scheduled" },
      }),
    ],
  ])("returns generic unavailable for %s", (_label, candidate) => {
    expect(resolveSimulatedArrivalMeetingTime(candidate)).toEqual(unavailable);
  });

  it("fails closed when a hostile value throws during property inspection", () => {
    const hostile = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("hostile access");
        },
      },
    );

    expect(
      resolveSimulatedArrivalMeetingTime(
        input({
          ownerAvailabilityPermission: availabilityPermission(
            ownerId,
            recipientId,
            {
              availability: hostile as never,
            },
          ),
        }),
      ),
    ).toEqual(unavailable);
  });

  it("contains no ambient clock, network, external source, or delivery capability", () => {
    const root = resolve(__dirname, "..");
    const source = [
      "arrival-coordination-lifecycle-contracts.ts",
      "arrival-coordination-lifecycle.ts",
    ]
      .map((file) => readFileSync(resolve(root, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/Date\.now\s*\(|new Date\s*\(/);
    expect(source).not.toMatch(/\bfetch\s*\(|process\.env|https?:\/\//i);
    expect(source).not.toMatch(
      /aviationstack|flightlabs|\btoken\b|\bcredential\b/i,
    );
    expect(source).not.toMatch(
      /\broute\b|\bclient\b|notification|venue|commerce|console\./i,
    );
  });
});
