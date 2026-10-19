import { describe, expect, it } from "vitest";

import {
  CALENDAR_AVAILABILITY_SOURCES,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type CalendarAvailabilityFeatureGate,
} from "../contracts";
import { createInMemoryCalendarAvailabilityVault } from "../in-memory-vault";
import {
  CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
  type CalendarAvailabilityStatePkceAttempt,
  type CalendarAvailabilityStatePkceAttemptEvaluation,
} from "../state-pkce";
import type {
  CalendarAvailabilityVaultAccess,
  CalendarAvailabilityVaultEntryInput,
  CalendarAvailabilityVaultWriteInput,
} from "../vault-contracts";

const ENABLED_FIXTURE_GATE: CalendarAvailabilityFeatureGate = Object.freeze({
  isEnabled: () => true,
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
    window: {
      startAt: "2026-10-19T00:00:00.000Z",
      endAt: "2026-11-19T00:00:00.000Z",
    },
    expiresAt: "2026-10-20T00:00:00.000Z",
    ...overrides,
  };
}

function buildStateEvaluation(
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

function buildWrite(
  overrides: Partial<CalendarAvailabilityVaultWriteInput> = {},
): CalendarAvailabilityVaultWriteInput {
  return {
    attempt: buildStateEvaluation(),
    entry: buildEntry(),
    ...overrides,
  };
}

function buildAccess(
  overrides: Partial<CalendarAvailabilityVaultAccess> = {},
): CalendarAvailabilityVaultAccess {
  return {
    attempt: buildStateEvaluation(),
    ownerId: "member-a",
    providerFamily: CALENDAR_AVAILABILITY_SOURCES[0],
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    handle: "fixture-handle-a",
    ...overrides,
  };
}

describe("in-memory calendar availability vault", () => {
  it("defaults to unavailable and does not retain an entry when its gate is absent", () => {
    const vault = createInMemoryCalendarAvailabilityVault();
    const write = buildWrite({
      attempt: buildStateEvaluation({ gate: undefined }),
    });

    expect(vault.write(write)).toBe(
      CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
    );
    expect(vault.read(buildAccess())).toBe(
      CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
    );
  });

  it("returns only an opaque owner-bound handle and redacts every other entry value", () => {
    const vault = createInMemoryCalendarAvailabilityVault();
    const entry = buildEntry();

    const writeResult = vault.write(buildWrite({ entry }));
    const readResult = vault.read(buildAccess());
    const output = JSON.stringify([writeResult, readResult]);

    expect(writeResult).toEqual({
      kind: "opaque-handle",
      handle: entry.handle,
    });
    expect(readResult).toEqual({ kind: "opaque-handle", handle: entry.handle });
    expect(Object.keys(writeResult).sort()).toEqual(["handle", "kind"]);
    expect(output).not.toContain(entry.ownerId);
    expect(output).not.toContain(entry.providerFamily);
    expect(output).not.toContain(entry.purpose);
    expect(output).not.toContain(entry.sealedMaterial);
  });

  it("rejects malformed writes and cross-owner, provider-family, and purpose access", () => {
    const vault = createInMemoryCalendarAvailabilityVault();
    const entry = buildEntry();

    expect(
      vault.write({
        ...buildWrite(),
        entry: { ...entry, sealedMaterial: "" },
      } as CalendarAvailabilityVaultWriteInput),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(
      vault.write({
        ...buildWrite(),
        entry: { ...entry, ownerId: "member-b" },
      } as CalendarAvailabilityVaultWriteInput),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(vault.write(buildWrite())).toEqual({
      kind: "opaque-handle",
      handle: entry.handle,
    });

    expect(
      vault.read(
        buildAccess({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({ ownerId: "member-b" }),
            ownerId: "member-b",
          }),
          ownerId: "member-b",
        }),
      ),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(
      vault.read(
        buildAccess({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({
              providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
            }),
          }),
          providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
        }),
      ),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(
      vault.read(
        buildAccess({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({ purpose: "other-purpose" }),
          }),
          purpose: "other-purpose",
        }),
      ),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
  });

  it("rejects expired and replayed state/PKCE fixture attempts before entry retention", () => {
    const vault = createInMemoryCalendarAvailabilityVault();
    const expiredAttempt = buildAttempt();

    expect(
      vault.write(
        buildWrite({
          attempt: buildStateEvaluation({ now: expiredAttempt.expiresAt }),
        }),
      ),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(
      vault.write(
        buildWrite({
          attempt: buildStateEvaluation({
            consumedStateValues: [expiredAttempt.state],
          }),
        }),
      ),
    ).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(vault.read(buildAccess())).toBe(
      CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
    );
  });

  it("revokes only the matching owner/provider-family/purpose tuple and stays generic", () => {
    const vault = createInMemoryCalendarAvailabilityVault();
    const firstEntry = buildEntry();
    const alternateProviderEntry = buildEntry({
      providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
      handle: "fixture-handle-a-secondary",
      sealedMaterial: "fixture-only-material-a-secondary",
    });
    const otherOwnerEntry = buildEntry({
      ownerId: "member-b",
      handle: "fixture-handle-b",
      sealedMaterial: "fixture-only-material-b",
    });

    expect(vault.write(buildWrite({ entry: firstEntry }))).toEqual({
      kind: "opaque-handle",
      handle: firstEntry.handle,
    });
    expect(
      vault.write(
        buildWrite({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({
              providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
            }),
          }),
          entry: alternateProviderEntry,
        }),
      ),
    ).toEqual({ kind: "opaque-handle", handle: alternateProviderEntry.handle });
    expect(
      vault.write(
        buildWrite({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({ ownerId: "member-b" }),
            ownerId: "member-b",
          }),
          entry: otherOwnerEntry,
        }),
      ),
    ).toEqual({ kind: "opaque-handle", handle: otherOwnerEntry.handle });

    expect(vault.revoke(buildAccess())).toBe(
      CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
    );
    expect(vault.read(buildAccess())).toBe(
      CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
    );
    expect(
      vault.read(
        buildAccess({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({
              providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
            }),
          }),
          providerFamily: CALENDAR_AVAILABILITY_SOURCES[1],
          handle: alternateProviderEntry.handle,
        }),
      ),
    ).toEqual({ kind: "opaque-handle", handle: alternateProviderEntry.handle });
    expect(
      vault.read(
        buildAccess({
          attempt: buildStateEvaluation({
            attempt: buildAttempt({ ownerId: "member-b" }),
            ownerId: "member-b",
          }),
          ownerId: "member-b",
          handle: otherOwnerEntry.handle,
        }),
      ),
    ).toEqual({ kind: "opaque-handle", handle: otherOwnerEntry.handle });
  });
});
