import { describe, expect, it } from "vitest";

import {
  CALENDAR_AVAILABILITY_SOURCES,
  DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type CalendarAvailabilityFeatureGate,
} from "../contracts";
import {
  CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE,
  FIXED_CALENDAR_AVAILABILITY_WINDOW_DAYS,
  evaluateCalendarAvailabilityStatePkceAttempt,
  isCalendarAvailabilityStatePkceAttemptUsable,
  type CalendarAvailabilityStatePkceAttempt,
  type CalendarAvailabilityStatePkceAttemptEvaluation,
} from "../state-pkce";

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

function buildInput(
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

describe("calendar availability state/PKCE fixture policy", () => {
  it("uses the constant-false default gate and returns only the generic unavailable result", () => {
    const defaultGatedInput = buildInput({ gate: undefined });

    expect(DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE.isEnabled()).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(defaultGatedInput),
    ).toBe(false);
    expect(
      evaluateCalendarAvailabilityStatePkceAttempt(defaultGatedInput),
    ).toEqual(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
  });

  it("accepts only the exact shared-plan purpose and declared provider-family values", () => {
    for (const providerFamily of CALENDAR_AVAILABILITY_SOURCES) {
      expect(
        isCalendarAvailabilityStatePkceAttemptUsable(
          buildInput({ attempt: buildAttempt({ providerFamily }) }),
        ),
      ).toBe(true);
    }

    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ attempt: buildAttempt({ purpose: "planning_context" }) }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({
          attempt: buildAttempt({ providerFamily: "fixture-other" }),
        }),
      ),
    ).toBe(false);
  });

  it("requires the fixed 31-day canonical UTC availability window", () => {
    expect(FIXED_CALENDAR_AVAILABILITY_WINDOW_DAYS).toBe(31);
    expect(isCalendarAvailabilityStatePkceAttemptUsable(buildInput())).toBe(
      true,
    );

    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({
          attempt: buildAttempt({
            window: {
              startAt: "2026-10-19T00:00:00.000Z",
              endAt: "2026-11-18T00:00:00.000Z",
            },
          }),
        }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({
          attempt: buildAttempt({
            window: {
              startAt: "2026-10-19T00:00:00.000Z",
              endAt: "2026-11-20T00:00:00.000Z",
            },
          }),
        }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({
          attempt: buildAttempt({
            window: {
              startAt: "2026-10-19T00:00:00Z",
              endAt: "2026-11-19T00:00:00.000Z",
            },
          }),
        }),
      ),
    ).toBe(false);
  });

  it("rejects owner mismatch, expiry, replay, and missing injected state or verifier", () => {
    const attempt = buildAttempt();

    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ ownerId: "member-b" }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ now: attempt.expiresAt }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ consumedStateValues: [attempt.state] }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ attempt: buildAttempt({ state: "" }) }),
      ),
    ).toBe(false);
    expect(
      isCalendarAvailabilityStatePkceAttemptUsable(
        buildInput({ attempt: buildAttempt({ verifier: " " }) }),
      ),
    ).toBe(false);
  });

  it("is deterministic and does not disclose injected fixture values", () => {
    let gateChecks = 0;
    const attempt = buildAttempt();
    const input = Object.freeze({
      ...buildInput({
        attempt,
        gate: {
          isEnabled: () => {
            gateChecks += 1;
            return true;
          },
        },
      }),
    });
    const before = JSON.stringify(input);

    const first = evaluateCalendarAvailabilityStatePkceAttempt(input);
    const second = evaluateCalendarAvailabilityStatePkceAttempt(input);
    const output = JSON.stringify(first);

    expect(gateChecks).toBe(2);
    expect(first).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(second).toBe(CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE);
    expect(Object.keys(first).sort()).toEqual(["code", "kind"]);
    expect(output).not.toContain(attempt.ownerId);
    expect(output).not.toContain(attempt.providerFamily);
    expect(output).not.toContain(attempt.state);
    expect(output).not.toContain(attempt.verifier);
    expect(JSON.stringify(input)).toBe(before);
  });
});
