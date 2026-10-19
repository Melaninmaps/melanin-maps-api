import { describe, expect, it } from "vitest";

import {
  CALENDAR_AVAILABILITY_SOURCES,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type AggregateAvailabilityInput,
  type CalendarAvailabilityFeatureGate,
  type CalendarAvailabilityNormalizer,
  type CalendarAvailabilityWindow,
  type InjectedAggregatePort,
} from "../contracts";
import {
  admitInjectedLifecycleAvailability,
  type InjectedLifecycleAdmissionInput,
  type InjectedLifecycleAvailabilityReader,
} from "../injected-lifecycle-admission";
import { createInMemoryCalendarAvailabilityVault } from "../in-memory-vault";
import {
  normalizeGoogleFreeBusy,
  normalizeMicrosoftGraphCalendarView,
} from "../normalizers";
import type {
  CalendarAvailabilityStatePkceAttempt,
  CalendarAvailabilityStatePkceAttemptEvaluation,
} from "../state-pkce";
import type {
  CalendarAvailabilityVaultAccess,
  CalendarAvailabilityVaultEntryInput,
  CalendarAvailabilityVaultWriteInput,
  InMemoryCalendarAvailabilityVault,
} from "../vault-contracts";

const ENABLED_FIXTURE_GATE: CalendarAvailabilityFeatureGate = Object.freeze({
  isEnabled: () => true,
});

const WINDOW: CalendarAvailabilityWindow = Object.freeze({
  startAt: "2026-10-19T00:00:00.000Z",
  endAt: "2026-11-19T00:00:00.000Z",
});

function buildAttempt(
  overrides: Partial<CalendarAvailabilityStatePkceAttempt> = {},
): CalendarAvailabilityStatePkceAttempt {
  return {
    ownerId: "member-a",
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    providerFamily: CALENDAR_AVAILABILITY_SOURCES[0],
    state: "fixture-state-a",
    verifier: "fixture-verifier-a",
    window: WINDOW,
    expiresAt: "2026-10-20T00:00:00.000Z",
    ...overrides,
  };
}

function buildEvaluation(
  overrides: Partial<CalendarAvailabilityStatePkceAttemptEvaluation> = {},
): CalendarAvailabilityStatePkceAttemptEvaluation {
  return {
    attempt: buildAttempt(),
    ownerId: "member-a",
    now: "2026-10-19T12:00:00.000Z",
    consumedStateValues: [],
    gate: ENABLED_FIXTURE_GATE,
    ...overrides,
  };
}

function buildEntry(
  overrides: Partial<CalendarAvailabilityVaultEntryInput> = {},
): CalendarAvailabilityVaultEntryInput {
  return {
    ownerId: "member-a",
    providerFamily: CALENDAR_AVAILABILITY_SOURCES[0],
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    handle: "fixture-handle-a",
    sealedMaterial: "fixture-only-material-a",
    ...overrides,
  };
}

function buildAccess(
  overrides: Partial<CalendarAvailabilityVaultAccess> = {},
): CalendarAvailabilityVaultAccess {
  return {
    attempt: buildEvaluation(),
    ownerId: "member-a",
    providerFamily: CALENDAR_AVAILABILITY_SOURCES[0],
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    handle: "fixture-handle-a",
    ...overrides,
  };
}

function writeEntry(
  vault: InMemoryCalendarAvailabilityVault,
  access: CalendarAvailabilityVaultAccess = buildAccess(),
): void {
  const write: CalendarAvailabilityVaultWriteInput = {
    attempt: access.attempt,
    entry: buildEntry({
      ownerId: access.ownerId,
      providerFamily: access.providerFamily,
      purpose: access.purpose,
      handle: access.handle,
    }),
  };
  expect(vault.write(write)).toEqual({
    kind: "opaque-handle",
    handle: access.handle,
  });
}

function validGoogleFixture(): unknown {
  return {
    timeMin: WINDOW.startAt,
    timeMax: WINDOW.endAt,
    calendars: { fixture: { busy: [] } },
  };
}

function validGraphFixture(): unknown {
  return {
    value: [
      {
        showAs: "busy",
        start: { dateTime: "2026-10-20T10:00:00", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T11:00:00", timeZone: "UTC" },
      },
    ],
  };
}

function aggregatePort(
  onEvaluate: (input: AggregateAvailabilityInput) => string | null,
): InjectedAggregatePort<string | null> {
  return Object.freeze({ evaluate: onEvaluate });
}

function reader<T>(
  read: (
    input: Readonly<{ handle: string; window: CalendarAvailabilityWindow }>,
  ) => Promise<T>,
): InjectedLifecycleAvailabilityReader<T> {
  return Object.freeze({ read });
}

describe("injected calendar availability lifecycle admission", () => {
  it("returns null before vault, reader, normalizer, or aggregate when its gate is omitted", async () => {
    const calls = { vault: 0, reader: 0, normalizer: 0, aggregate: 0 };
    const vault: Pick<InMemoryCalendarAvailabilityVault, "read"> = {
      read: () => {
        calls.vault += 1;
        return { kind: "opaque-handle", handle: "fixture-handle-a" };
      },
    };

    const result = await admitInjectedLifecycleAvailability({
      access: buildAccess(),
      vault,
      reader: reader(async () => {
        calls.reader += 1;
        return validGoogleFixture();
      }),
      normalizer: () => {
        calls.normalizer += 1;
        return normalizeGoogleFreeBusy(validGoogleFixture(), WINDOW);
      },
      aggregate: aggregatePort(() => {
        calls.aggregate += 1;
        return "admitted";
      }),
    });

    expect(result).toBeNull();
    expect(calls).toEqual({ vault: 0, reader: 0, normalizer: 0, aggregate: 0 });
  });

  it("reads the opaque vault handle before the fake reader and projects only normalized aggregate input", async () => {
    const backingVault = createInMemoryCalendarAvailabilityVault();
    writeEntry(backingVault);
    const order: string[] = [];
    let receivedReaderInput:
      | Readonly<{ handle: string; window: CalendarAvailabilityWindow }>
      | undefined;
    let receivedAggregateInput: AggregateAvailabilityInput | undefined;
    const vault: Pick<InMemoryCalendarAvailabilityVault, "read"> = {
      read: (access) => {
        order.push("vault");
        return backingVault.read(access);
      },
    };

    const result = await admitInjectedLifecycleAvailability({
      access: buildAccess(),
      vault,
      reader: reader(async (input) => {
        order.push("reader");
        receivedReaderInput = input;
        return validGoogleFixture();
      }),
      normalizer: (raw, window) => {
        order.push("normalizer");
        return normalizeGoogleFreeBusy(raw, window);
      },
      aggregate: aggregatePort((input) => {
        order.push("aggregate");
        receivedAggregateInput = input;
        return "admitted";
      }),
      gate: ENABLED_FIXTURE_GATE,
    });

    expect(result).toBe("admitted");
    expect(order).toEqual(["vault", "reader", "normalizer", "aggregate"]);
    expect(receivedReaderInput).toEqual({
      handle: "fixture-handle-a",
      window: WINDOW,
    });
    expect(Object.keys(receivedReaderInput ?? {}).sort()).toEqual([
      "handle",
      "window",
    ]);
    expect(receivedAggregateInput).toEqual({
      purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
      window: WINDOW,
      busy: [],
    });
    expect(Object.keys(receivedAggregateInput ?? {}).sort()).toEqual([
      "busy",
      "purpose",
      "window",
    ]);
  });

  it("denies tuple mismatch, expiry, and replay before the vault and all later injected seams", async () => {
    const invalidAccesses = [
      buildAccess({ ownerId: "member-b" }),
      buildAccess({
        attempt: buildEvaluation({ now: "2026-10-20T00:00:00.000Z" }),
      }),
      buildAccess({
        attempt: buildEvaluation({ consumedStateValues: ["fixture-state-a"] }),
      }),
    ];

    for (const access of invalidAccesses) {
      const calls = { vault: 0, reader: 0, normalizer: 0, aggregate: 0 };
      const result = await admitInjectedLifecycleAvailability({
        access,
        vault: {
          read: () => {
            calls.vault += 1;
            return { kind: "opaque-handle", handle: "fixture-handle-a" };
          },
        },
        reader: reader(async () => {
          calls.reader += 1;
          return validGoogleFixture();
        }),
        normalizer: () => {
          calls.normalizer += 1;
          return normalizeGoogleFreeBusy(validGoogleFixture(), WINDOW);
        },
        aggregate: aggregatePort(() => {
          calls.aggregate += 1;
          return "admitted";
        }),
        gate: ENABLED_FIXTURE_GATE,
      });

      expect(result).toBeNull();
      expect(calls).toEqual({
        vault: 0,
        reader: 0,
        normalizer: 0,
        aggregate: 0,
      });
    }
  });

  it("stops after the vault when the matching record has been revoked", async () => {
    const backingVault = createInMemoryCalendarAvailabilityVault();
    const access = buildAccess();
    writeEntry(backingVault, access);
    expect(backingVault.revoke(access)).toEqual({
      kind: "unknown",
      code: "source-unavailable",
    });
    const calls = { vault: 0, reader: 0, normalizer: 0, aggregate: 0 };

    const result = await admitInjectedLifecycleAvailability({
      access,
      vault: {
        read: (input) => {
          calls.vault += 1;
          return backingVault.read(input);
        },
      },
      reader: reader(async () => {
        calls.reader += 1;
        return validGoogleFixture();
      }),
      normalizer: () => {
        calls.normalizer += 1;
        return normalizeGoogleFreeBusy(validGoogleFixture(), WINDOW);
      },
      aggregate: aggregatePort(() => {
        calls.aggregate += 1;
        return "admitted";
      }),
      gate: ENABLED_FIXTURE_GATE,
    });

    expect(result).toBeNull();
    expect(calls).toEqual({ vault: 1, reader: 0, normalizer: 0, aggregate: 0 });
  });

  it("returns null without detail when the injected fake reader fails", async () => {
    const backingVault = createInMemoryCalendarAvailabilityVault();
    writeEntry(backingVault);
    const calls = { normalizer: 0, aggregate: 0 };

    const result = await admitInjectedLifecycleAvailability({
      access: buildAccess(),
      vault: { read: backingVault.read },
      reader: reader(async () => {
        throw new Error("fixture reader failure");
      }),
      normalizer: () => {
        calls.normalizer += 1;
        return normalizeGoogleFreeBusy(validGoogleFixture(), WINDOW);
      },
      aggregate: aggregatePort(() => {
        calls.aggregate += 1;
        return "admitted";
      }),
      gate: ENABLED_FIXTURE_GATE,
    });

    expect(result).toBeNull();
    expect(calls).toEqual({ normalizer: 0, aggregate: 0 });
  });

  it("does not aggregate an unknown normalizer result and returns null when aggregation refuses", async () => {
    const backingVault = createInMemoryCalendarAvailabilityVault();
    writeEntry(backingVault);
    let aggregateCalls = 0;
    const unknownResult = await admitInjectedLifecycleAvailability({
      access: buildAccess(),
      vault: { read: backingVault.read },
      reader: reader(async () => validGoogleFixture()),
      normalizer: () => ({ kind: "unknown", code: "source-unavailable" }),
      aggregate: aggregatePort(() => {
        aggregateCalls += 1;
        return "admitted";
      }),
      gate: ENABLED_FIXTURE_GATE,
    });
    const refusalResult = await admitInjectedLifecycleAvailability({
      access: buildAccess(),
      vault: { read: backingVault.read },
      reader: reader(async () => validGoogleFixture()),
      normalizer: normalizeGoogleFreeBusy,
      aggregate: aggregatePort(() => null),
      gate: ENABLED_FIXTURE_GATE,
    });

    expect(unknownResult).toBeNull();
    expect(aggregateCalls).toBe(0);
    expect(refusalResult).toBeNull();
  });

  it("contains hostile Google and Graph fixture values before result or aggregate projection", async () => {
    const cases: readonly Readonly<{
      source: (typeof CALENDAR_AVAILABILITY_SOURCES)[number];
      raw: unknown;
      normalizer: CalendarAvailabilityNormalizer<unknown>;
    }>[] = [
      {
        source: CALENDAR_AVAILABILITY_SOURCES[0],
        raw: {
          timeMin: WINDOW.startAt,
          timeMax: WINDOW.endAt,
          calendars: {
            fixture: { busy: [], marker: "fixture-google-sentinel" },
          },
        },
        normalizer: normalizeGoogleFreeBusy,
      },
      {
        source: CALENDAR_AVAILABILITY_SOURCES[1],
        raw: {
          value: [
            {
              showAs: "busy",
              start: { dateTime: "2026-10-20T10:00:00", timeZone: "UTC" },
              end: { dateTime: "2026-10-20T11:00:00", timeZone: "UTC" },
              marker: "fixture-graph-sentinel",
            },
          ],
        },
        normalizer: normalizeMicrosoftGraphCalendarView,
      },
    ];

    for (const testCase of cases) {
      const backingVault = createInMemoryCalendarAvailabilityVault();
      const access = buildAccess({
        attempt: buildEvaluation({
          attempt: buildAttempt({ providerFamily: testCase.source }),
        }),
        providerFamily: testCase.source,
      });
      writeEntry(backingVault, access);
      let aggregateCalls = 0;

      const result = await admitInjectedLifecycleAvailability({
        access,
        vault: { read: backingVault.read },
        reader: reader(async () => testCase.raw),
        normalizer: testCase.normalizer,
        aggregate: aggregatePort(() => {
          aggregateCalls += 1;
          return "admitted";
        }),
        gate: ENABLED_FIXTURE_GATE,
      });

      expect(result).toBeNull();
      expect(aggregateCalls).toBe(0);
    }
  });

  it("does not model Microsoft personal Calendars.ReadBasic as an availability-only permission", async () => {
    const backingVault = createInMemoryCalendarAvailabilityVault();
    const access = buildAccess({
      attempt: buildEvaluation({
        attempt: buildAttempt({
          providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
        }),
      }),
      providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
    });
    writeEntry(backingVault, access);
    let aggregateInput: AggregateAvailabilityInput | undefined;

    const result = await admitInjectedLifecycleAvailability({
      access,
      vault: { read: backingVault.read },
      reader: reader(async () => validGraphFixture()),
      normalizer: normalizeMicrosoftGraphCalendarView,
      aggregate: aggregatePort((input) => {
        aggregateInput = input;
        return "admitted";
      }),
      gate: ENABLED_FIXTURE_GATE,
    });

    expect(result).toBe("admitted");
    expect(Object.keys(aggregateInput ?? {}).sort()).toEqual([
      "busy",
      "purpose",
      "window",
    ]);
  });
});
