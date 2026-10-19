import {
  CALENDAR_AVAILABILITY_SOURCES,
  DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type CalendarAvailabilityFeatureGate,
  type CalendarAvailabilityResult,
  type CalendarAvailabilityWindow,
} from "./contracts";

export const FIXED_CALENDAR_AVAILABILITY_WINDOW_DAYS = 31;

const FIXED_CALENDAR_AVAILABILITY_WINDOW_MILLISECONDS =
  FIXED_CALENDAR_AVAILABILITY_WINDOW_DAYS * 24 * 60 * 60 * 1_000;
const CANONICAL_UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * An injected fixture-only attempt. It has no connection, client, or transport behavior.
 * Its state and verifier are never returned from this module.
 */
export type CalendarAvailabilityStatePkceAttempt = Readonly<{
  ownerId: string;
  purpose: string;
  providerFamily: string;
  state: string;
  verifier: string;
  window: CalendarAvailabilityWindow;
  expiresAt: string;
}>;

/** Every input is injected; this policy never samples random values or wall-clock time. */
export type CalendarAvailabilityStatePkceAttemptEvaluation = Readonly<{
  attempt: CalendarAvailabilityStatePkceAttempt;
  ownerId: string;
  now: string;
  consumedStateValues: readonly string[];
  gate?: CalendarAvailabilityFeatureGate;
}>;

/**
 * This policy has no available outcome. It is intentionally the same generic result for
 * every input until separately approved work establishes a real, independently governed seam.
 */
export const CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE: CalendarAvailabilityResult =
  Object.freeze({
    kind: "unknown",
    code: "source-unavailable",
  });

function hasNonBlankValue(value: string): boolean {
  return value.trim().length > 0;
}

function parseCanonicalUtcInstant(value: string): number | null {
  if (!CANONICAL_UTC_INSTANT.test(value)) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
}

function hasFixedAvailabilityWindow(
  window: CalendarAvailabilityWindow,
): boolean {
  const startAt = parseCanonicalUtcInstant(window.startAt);
  const endAt = parseCanonicalUtcInstant(window.endAt);

  return (
    startAt !== null &&
    endAt !== null &&
    endAt - startAt === FIXED_CALENDAR_AVAILABILITY_WINDOW_MILLISECONDS
  );
}

function hasDeclaredProviderFamily(value: string): boolean {
  return CALENDAR_AVAILABILITY_SOURCES.some((candidate) => candidate === value);
}

/**
 * This is a pure, non-activating predicate for synthetic coverage only. A true result does
 * not initiate work or make availability known; it only means the supplied fixture satisfies
 * the immutable state/ownership/window rules before the generic unavailable result is returned.
 */
export function isCalendarAvailabilityStatePkceAttemptUsable({
  attempt,
  ownerId,
  now,
  consumedStateValues,
  gate = DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
}: CalendarAvailabilityStatePkceAttemptEvaluation): boolean {
  if (!gate.isEnabled()) {
    return false;
  }

  if (
    !hasNonBlankValue(attempt.ownerId) ||
    !hasNonBlankValue(ownerId) ||
    !hasNonBlankValue(attempt.state) ||
    !hasNonBlankValue(attempt.verifier)
  ) {
    return false;
  }

  if (attempt.ownerId !== ownerId) {
    return false;
  }

  if (attempt.purpose !== SHARED_PLAN_FREE_BUSY_PURPOSE) {
    return false;
  }

  if (!hasDeclaredProviderFamily(attempt.providerFamily)) {
    return false;
  }

  if (!hasFixedAvailabilityWindow(attempt.window)) {
    return false;
  }

  if (consumedStateValues.includes(attempt.state)) {
    return false;
  }

  const currentTime = parseCanonicalUtcInstant(now);
  const expiryTime = parseCanonicalUtcInstant(attempt.expiresAt);

  return (
    currentTime !== null && expiryTime !== null && currentTime < expiryTime
  );
}

/**
 * A deliberately inert result boundary. It exposes neither the fixture state/verifier nor a
 * usable availability result, regardless of whether the injected fixture passes the predicate.
 */
export function evaluateCalendarAvailabilityStatePkceAttempt(
  input: CalendarAvailabilityStatePkceAttemptEvaluation,
): CalendarAvailabilityResult {
  if (!isCalendarAvailabilityStatePkceAttemptUsable(input)) {
    return CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE;
  }

  return CALENDAR_AVAILABILITY_STATE_PKCE_UNAVAILABLE;
}
