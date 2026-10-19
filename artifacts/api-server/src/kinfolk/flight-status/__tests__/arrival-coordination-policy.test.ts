import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
  type FlightArrivalCoordinationSharingGrant,
  type SharedFlightArrivalProjection,
} from "../sharing-contracts";
import {
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE,
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION,
  type ArrivalCoordinationEligibilityInput,
  type ReciprocalArrivalCoordinationIntent,
} from "../arrival-coordination-contracts";
import { resolveArrivalCoordinationEligibility } from "../arrival-coordination-policy";

const nowEpochMs = Date.parse("2026-10-19T12:00:00.000Z");
const ownerId = "member-owner";
const recipientId = "member-recipient";
const unavailable = {
  kind: "unavailable",
  code: "ARRIVAL_COORDINATION_UNAVAILABLE",
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
    version: RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION,
    state: "granted",
    ownerId,
    recipientId,
    purpose: RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE,
    grantedAt: "2026-10-19T11:00:00.000Z",
    expiresAt: "2026-10-19T13:00:00.000Z",
    revokedAt: null,
    arrivalWindowStartAt: "2026-10-19T13:00:00.000Z",
    arrivalWindowEndAt: "2026-10-19T14:00:00.000Z",
    ...overrides,
  };
}

const freshEnRouteArrival: SharedFlightArrivalProjection = {
  status: "en_route",
  arrival: { estimatedAt: "2026-10-19T13:20:00.000Z" },
  observedAt: "2026-10-19T11:59:30.000Z",
};

function input(
  overrides: Partial<ArrivalCoordinationEligibilityInput> = {},
): ArrivalCoordinationEligibilityInput {
  return {
    ownerId,
    recipientId,
    sharingGrant: sharingGrant(),
    sharedArrival: freshEnRouteArrival,
    reciprocalIntent: reciprocalIntent(),
    nowEpochMs,
    freshnessMaxAgeMs: 60_000,
    ...overrides,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

describe("arrival coordination eligibility composition", () => {
  it("returns only a frozen neutral eligibility handoff for an exact fresh pair", () => {
    const frozenInput = deepFreeze(input());
    const result = resolveArrivalCoordinationEligibility(frozenInput);

    expect(result).toEqual({ kind: "eligible" });
    expect(Object.keys(result)).toEqual(["kind"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(frozenInput).toEqual(input());
  });

  it("permits a landed actual arrival only with the matching selected field", () => {
    expect(
      resolveArrivalCoordinationEligibility(
        input({
          sharingGrant: sharingGrant({
            allowedFields: ["status", "arrival_actual_at", "observed_at"],
          }),
          sharedArrival: {
            status: "landed",
            arrival: { actualAt: "2026-10-19T13:19:00.000Z" },
            observedAt: "2026-10-19T11:59:30.000Z",
          },
        }),
      ),
    ).toEqual({ kind: "eligible" });
  });

  it.each([
    ["missing owner grant", input({ sharingGrant: null })],
    [
      "revoked owner grant",
      input({
        sharingGrant: sharingGrant({
          state: "revoked",
          revokedAt: "2026-10-19T11:30:00.000Z",
        }),
      }),
    ],
    [
      "expired owner grant",
      input({
        sharingGrant: sharingGrant({ expiresAt: "2026-10-19T11:59:59.000Z" }),
      }),
    ],
    [
      "future owner grant",
      input({
        sharingGrant: sharingGrant({ grantedAt: "2026-10-19T12:00:01.000Z" }),
      }),
    ],
    [
      "owner grant pair mismatch",
      input({
        sharingGrant: sharingGrant({ recipientId: "another-recipient" }),
      }),
    ],
    [
      "owner grant wrong purpose",
      input({ sharingGrant: sharingGrant({ purpose: "other" as never }) }),
    ],
    [
      "owner grant wrong version",
      input({ sharingGrant: sharingGrant({ version: "other" as never }) }),
    ],
    [
      "owner grant broadened fields",
      input({
        sharingGrant: sharingGrant({
          allowedFields: [
            "status",
            "arrival_estimated_at",
            "observed_at",
            "departure_actual_at",
          ] as never,
        }),
      }),
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
      "expired reciprocal intent",
      input({
        reciprocalIntent: reciprocalIntent({
          expiresAt: "2026-10-19T11:59:59.000Z",
        }),
      }),
    ],
    [
      "future reciprocal intent",
      input({
        reciprocalIntent: reciprocalIntent({
          grantedAt: "2026-10-19T12:00:01.000Z",
        }),
      }),
    ],
    [
      "reciprocal intent pair mismatch",
      input({
        reciprocalIntent: reciprocalIntent({ ownerId: "another-owner" }),
      }),
    ],
    [
      "reciprocal intent wrong purpose",
      input({
        reciprocalIntent: reciprocalIntent({ purpose: "other" as never }),
      }),
    ],
    [
      "reciprocal intent wrong version",
      input({
        reciprocalIntent: reciprocalIntent({ version: "other" as never }),
      }),
    ],
    [
      "unbounded reciprocal intent",
      input({
        reciprocalIntent: reciprocalIntent({
          arrivalWindowEndAt: "not-a-time",
        }),
      }),
    ],
    [
      "reversed reciprocal window",
      input({
        reciprocalIntent: reciprocalIntent({
          arrivalWindowStartAt: "2026-10-19T14:00:00.000Z",
          arrivalWindowEndAt: "2026-10-19T13:00:00.000Z",
        }),
      }),
    ],
    [
      "arrival outside reciprocal window",
      input({
        sharedArrival: {
          ...freshEnRouteArrival,
          arrival: { estimatedAt: "2026-10-19T14:01:00.000Z" },
        },
      }),
    ],
    [
      "stale arrival observation",
      input({
        sharedArrival: {
          ...freshEnRouteArrival,
          observedAt: "2026-10-19T11:58:00.000Z",
        },
      }),
    ],
    [
      "future arrival observation",
      input({
        sharedArrival: {
          ...freshEnRouteArrival,
          observedAt: "2026-10-19T12:00:01.000Z",
        },
      }),
    ],
    [
      "nonconservative status",
      input({
        sharedArrival: { ...freshEnRouteArrival, status: "scheduled" } as never,
      }),
    ],
    [
      "mismatched status arrival field",
      input({
        sharedArrival: {
          status: "en_route",
          arrival: { actualAt: "2026-10-19T13:19:00.000Z" },
          observedAt: "2026-10-19T11:59:30.000Z",
        },
      }),
    ],
    [
      "missing selected arrival",
      input({ sharedArrival: { ...freshEnRouteArrival, arrival: {} } }),
    ],
    ["missing freshness bound", input({ freshnessMaxAgeMs: undefined })],
    ["invalid freshness bound", input({ freshnessMaxAgeMs: 0 })],
    ["invalid injected clock", input({ nowEpochMs: Number.NaN })],
    ["same owner and recipient", input({ recipientId: ownerId })],
  ])("returns one neutral unavailable result for %s", (_label, candidate) => {
    expect(resolveArrivalCoordinationEligibility(candidate)).toEqual(
      unavailable,
    );
  });

  it("contains no ambient clock, provider, relationship, or delivery dependency", () => {
    const root = resolve(__dirname, "..");
    const source = [
      "arrival-coordination-contracts.ts",
      "arrival-coordination-policy.ts",
    ]
      .map((file) => readFileSync(resolve(root, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/Date\.now\s*\(|new Date\s*\(/);
    expect(source).not.toMatch(/\bfetch\s*\(|process\.env|https?:\/\//i);
    expect(source).not.toMatch(
      /aviationstack|flightlabs|\btoken\b|\bcredential\b/i,
    );
    expect(source).not.toMatch(
      /\bfriend\b|\bcircle\b|\btrip\b|relationship|\bdm\b|calendar|venue|meeting|notification/i,
    );
  });
});
