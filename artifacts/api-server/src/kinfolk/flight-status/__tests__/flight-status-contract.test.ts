import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FLIGHT_STATUS_CAPABILITY_REGISTRY,
  FLIGHT_STATUS_DISCLOSURE_VERSION,
  type FlightStatusCapabilityRegistry,
  type FlightStatusDisclosureGrant,
  type FlightStatusProvider,
} from "../contracts";
import { lookupAuthorizedFlightStatus } from "../gate";

const now = new Date("2026-10-19T12:00:00.000Z");
const validQuery = { flightNumber: "AA 217", departureDate: "2026-10-20" };

function disclosure(
  overrides: Partial<FlightStatusDisclosureGrant> = {},
): FlightStatusDisclosureGrant {
  return {
    version: FLIGHT_STATUS_DISCLOSURE_VERSION,
    state: "granted",
    providerId: "fake-status",
    purpose: "existing_flight_status",
    dataCategories: ["flight_number", "departure_date"],
    grantedAt: "2026-10-19T11:00:00.000Z",
    expiresAt: "2026-10-19T13:00:00.000Z",
    revokedAt: null,
    ...overrides,
  };
}

function registry(
  overrides: Partial<FlightStatusCapabilityRegistry> = {},
): FlightStatusCapabilityRegistry {
  return {
    mode: "test",
    providerId: "fake-status",
    capabilities: ["status"],
    credentialAvailable: true,
    ...overrides,
  };
}

function fakeProvider(
  payload: unknown,
): FlightStatusProvider & { lookupStatus: ReturnType<typeof vi.fn> } {
  return {
    providerId: "fake-status",
    lookupStatus: vi.fn().mockResolvedValue(payload),
  };
}

describe("provider-neutral flight status contract", () => {
  it("is disabled by default and does not invoke a provider", async () => {
    const provider = fakeProvider({ state: "landed" });

    await expect(
      lookupAuthorizedFlightStatus({
        registry: DEFAULT_FLIGHT_STATUS_CAPABILITY_REGISTRY,
        disclosure: disclosure(),
        provider,
        query: validQuery,
        now,
      }),
    ).resolves.toEqual({
      kind: "unavailable",
      code: "FLIGHT_STATUS_UNAVAILABLE",
    });

    expect(provider.lookupStatus).not.toHaveBeenCalled();
  });

  it.each([
    ["missing disclosure", null],
    [
      "revoked disclosure",
      disclosure({ state: "revoked", revokedAt: "2026-10-19T11:30:00.000Z" }),
    ],
    [
      "expired disclosure",
      disclosure({ expiresAt: "2026-10-19T11:59:59.000Z" }),
    ],
    [
      "provider-mismatched disclosure",
      disclosure({ providerId: "other-provider" }),
    ],
    [
      "overbroad disclosure",
      disclosure({
        dataCategories: ["flight_number", "departure_date", "notes"] as never,
      }),
    ],
  ] as const)("makes no provider call with %s", async (_label, grant) => {
    const provider = fakeProvider({ state: "landed" });

    await lookupAuthorizedFlightStatus({
      registry: registry(),
      disclosure: grant,
      provider,
      query: validQuery,
      now,
    });

    expect(provider.lookupStatus).not.toHaveBeenCalled();
  });

  it("makes no provider call when credentials are unavailable or the query is malformed", async () => {
    const provider = fakeProvider({ state: "landed" });

    await lookupAuthorizedFlightStatus({
      registry: registry({ credentialAvailable: false }),
      disclosure: disclosure(),
      provider,
      query: validQuery,
      now,
    });
    await lookupAuthorizedFlightStatus({
      registry: registry(),
      disclosure: disclosure(),
      provider,
      query: { flightNumber: "AA 217", departureDate: "2026-02-30" },
      now,
    });

    expect(provider.lookupStatus).not.toHaveBeenCalled();
  });

  it("fails closed with an invalid injected clock", async () => {
    const provider = fakeProvider({ state: "landed" });

    await expect(
      lookupAuthorizedFlightStatus({
        registry: registry(),
        disclosure: disclosure(),
        provider,
        query: validQuery,
        now: new Date("invalid"),
      }),
    ).resolves.toEqual({
      kind: "unavailable",
      code: "FLIGHT_STATUS_UNAVAILABLE",
    });

    expect(provider.lookupStatus).not.toHaveBeenCalled();
  });

  it("sends only normalized status lookup fields and strips hostile provider fields", async () => {
    const provider = fakeProvider({
      state: "en_route",
      arrival: { estimatedAt: "2026-10-20T17:35:00.000Z", pnr: "SECRET-PNR" },
      departure: {
        scheduledAt: "2026-10-20T14:00:00.000Z",
        memberId: "member-secret",
      },
      observedAt: "2026-10-20T15:01:00.000Z",
      apiKey: "secret",
      ownerId: "member-secret",
      notes: "private itinerary note",
      position: { latitude: 1, longitude: 2 },
    });

    await expect(
      lookupAuthorizedFlightStatus({
        registry: registry(),
        disclosure: disclosure(),
        provider,
        query: validQuery,
        now,
      }),
    ).resolves.toEqual({
      kind: "available",
      status: {
        state: "en_route",
        departure: { scheduledAt: "2026-10-20T14:00:00.000Z" },
        arrival: { estimatedAt: "2026-10-20T17:35:00.000Z" },
        observedAt: "2026-10-20T15:01:00.000Z",
      },
    });

    expect(provider.lookupStatus).toHaveBeenCalledTimes(1);
    expect(provider.lookupStatus).toHaveBeenCalledWith({
      flightNumber: "AA217",
      departureDate: "2026-10-20",
    });
  });

  it("never invents an arrival time absent from the provider payload", async () => {
    const provider = fakeProvider({
      state: "scheduled",
      arrival: { pnr: "not-an-arrival-time" },
    });

    await expect(
      lookupAuthorizedFlightStatus({
        registry: registry(),
        disclosure: disclosure(),
        provider,
        query: validQuery,
        now,
      }),
    ).resolves.toEqual({ kind: "available", status: { state: "scheduled" } });
  });

  it.each([
    [
      "provider exception",
      () => {
        throw new Error("provider secret message");
      },
    ],
    [
      "malformed provider response",
      () => ({ state: "delayed", rawToken: "secret" }),
    ],
  ])(
    "returns the same neutral fallback for %s without a retry",
    async (_label, source) => {
      const provider: FlightStatusProvider & {
        lookupStatus: ReturnType<typeof vi.fn>;
      } = {
        providerId: "fake-status",
        lookupStatus: vi.fn().mockImplementation(source),
      };

      await expect(
        lookupAuthorizedFlightStatus({
          registry: registry(),
          disclosure: disclosure(),
          provider,
          query: validQuery,
          now,
        }),
      ).resolves.toEqual({
        kind: "unavailable",
        code: "FLIGHT_STATUS_UNAVAILABLE",
      });

      expect(provider.lookupStatus).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps the leaf implementation free of network, credential, and provider-specific code", () => {
    const root = resolve(__dirname, "..");
    const source = ["contracts.ts", "normalizers.ts", "gate.ts"]
      .map((file) => readFileSync(resolve(root, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain("process.env");
    expect(source).not.toMatch(/aviationstack|flightlabs/i);
    expect(source).not.toMatch(/https?:\/\//i);
  });
});
