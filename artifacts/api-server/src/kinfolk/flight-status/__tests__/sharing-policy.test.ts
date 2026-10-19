import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
  type FlightArrivalCoordinationSharingGrant,
} from "../sharing-contracts";
import { resolveFlightArrivalSharing } from "../sharing-policy";

const nowEpochMs = Date.parse("2026-10-19T12:00:00.000Z");
const ownerId = "member-owner";
const recipientId = "member-recipient";
const unavailable = {
  kind: "unavailable",
  code: "FLIGHT_ARRIVAL_SHARING_UNAVAILABLE",
};

function grant(
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

const freshStatus = {
  state: "en_route",
  arrival: {
    scheduledAt: "2026-10-19T13:05:00.000Z",
    estimatedAt: "2026-10-19T13:20:00.000Z",
    actualAt: "2026-10-19T13:19:00.000Z",
    pnr: "not-shareable",
  },
  departure: { actualAt: "2026-10-19T10:07:00.000Z" },
  flightNumber: "AA217",
  itinerary: "not-shareable",
  location: { latitude: 1, longitude: 2 },
  rawPayload: { secret: "not-shareable" },
  observedAt: "2026-10-19T11:59:30.000Z",
};

function input(
  overrides: Partial<Parameters<typeof resolveFlightArrivalSharing>[0]> = {},
) {
  return {
    ownerId,
    recipientId,
    grant: grant(),
    normalizedStatus: freshStatus,
    nowEpochMs,
    freshnessMaxAgeMs: 60_000,
    ...overrides,
  };
}

describe("named-recipient flight arrival sharing policy", () => {
  it("releases only the exact selected arrival/status projection", () => {
    expect(resolveFlightArrivalSharing(input())).toEqual({
      kind: "available",
      arrival: {
        status: "en_route",
        arrival: { estimatedAt: "2026-10-19T13:20:00.000Z" },
        observedAt: "2026-10-19T11:59:30.000Z",
      },
    });
  });

  it("supports one explicitly selected arrival field and never adds another", () => {
    expect(
      resolveFlightArrivalSharing(
        input({
          grant: grant({
            allowedFields: ["status", "arrival_actual_at", "observed_at"],
          }),
        }),
      ),
    ).toEqual({
      kind: "available",
      arrival: {
        status: "en_route",
        arrival: { actualAt: "2026-10-19T13:19:00.000Z" },
        observedAt: "2026-10-19T11:59:30.000Z",
      },
    });
  });

  it.each([
    ["missing grant", input({ grant: null })],
    [
      "revoked grant",
      input({
        grant: grant({
          state: "revoked",
          revokedAt: "2026-10-19T11:30:00.000Z",
        }),
      }),
    ],
    [
      "expired grant",
      input({ grant: grant({ expiresAt: "2026-10-19T11:59:59.000Z" }) }),
    ],
    [
      "future grant",
      input({ grant: grant({ grantedAt: "2026-10-19T12:00:01.000Z" }) }),
    ],
    ["owner mismatch", input({ grant: grant({ ownerId: "another-owner" }) })],
    [
      "recipient mismatch",
      input({ grant: grant({ recipientId: "another-recipient" }) }),
    ],
    ["wrong purpose", input({ grant: grant({ purpose: "other" as never }) })],
    ["wrong version", input({ grant: grant({ version: "other" as never }) })],
    [
      "broadened fields",
      input({
        grant: grant({
          allowedFields: [
            "status",
            "arrival_estimated_at",
            "observed_at",
            "departure_actual_at",
          ] as never,
        }),
      }),
    ],
    ["unbounded freshness", input({ freshnessMaxAgeMs: undefined })],
    ["invalid freshness", input({ freshnessMaxAgeMs: 0 })],
    [
      "stale status",
      input({
        normalizedStatus: {
          ...freshStatus,
          observedAt: "2026-10-19T11:58:00.000Z",
        },
      }),
    ],
    [
      "future status observation",
      input({
        normalizedStatus: {
          ...freshStatus,
          observedAt: "2026-10-19T12:00:01.000Z",
        },
      }),
    ],
    [
      "unknown status",
      input({ normalizedStatus: { ...freshStatus, state: "unknown" } }),
    ],
    [
      "invalid status",
      input({ normalizedStatus: { ...freshStatus, state: "delayed" } }),
    ],
    [
      "missing selected arrival",
      input({ normalizedStatus: { ...freshStatus, arrival: {} } }),
    ],
  ])(
    "returns the one neutral unavailable result for %s",
    (_label, candidate) => {
      expect(resolveFlightArrivalSharing(candidate)).toEqual(unavailable);
    },
  );

  it("denies malformed identities and never lets an owner share with themself", () => {
    expect(resolveFlightArrivalSharing(input({ ownerId: "" }))).toEqual(
      unavailable,
    );
    expect(
      resolveFlightArrivalSharing(input({ recipientId: ownerId })),
    ).toEqual(unavailable);
  });

  it("does not depend on a relationship, status-disclosure grant, or ambient clock", () => {
    const root = resolve(__dirname, "..");
    const source = ["sharing-contracts.ts", "sharing-policy.ts"]
      .map((file) => readFileSync(resolve(root, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/\b(friend|circle|trip|relationship)\b/i);
    expect(source).not.toMatch(
      /FlightStatusDisclosureGrant|providerDisclosure/,
    );
    expect(source).not.toMatch(/Date\.now\s*\(|new Date\s*\(/);
  });

  it("has no network, environment, credential, provider, logging, or raw-output dependency", () => {
    const root = resolve(__dirname, "..");
    const source = ["sharing-contracts.ts", "sharing-policy.ts"]
      .map((file) => readFileSync(resolve(root, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain("process.env");
    expect(source).not.toMatch(/aviationstack|flightlabs|https?:\/\//i);
    expect(source).not.toMatch(/\btoken\b|\bcredential\b|console\./i);
  });
});
