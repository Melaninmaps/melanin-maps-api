import {
  DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type CalendarAvailabilityFeatureGate,
  type CalendarAvailabilityNormalizer,
  type CalendarAvailabilityWindow,
  type InjectedAggregatePort,
} from "./contracts";
import { passKnownAvailabilityToAggregate } from "./normalizers";
import { isCalendarAvailabilityStatePkceAttemptUsable } from "./state-pkce";
import type {
  CalendarAvailabilityVaultAccess,
  InMemoryCalendarAvailabilityVault,
} from "./vault-contracts";

/** The fake reader can receive only the opaque handle and normalized request window. */
export type InjectedLifecycleAvailabilityReader<T> = Readonly<{
  read(
    input: Readonly<{ handle: string; window: CalendarAvailabilityWindow }>,
  ): Promise<T>;
}>;

/**
 * This fixture-only composition has no permission input. A provider-family label
 * cannot be used to classify or enforce a provider permission as availability-only.
 */
export type InjectedLifecycleAdmissionInput<T, TResult> = Readonly<{
  access: CalendarAvailabilityVaultAccess;
  vault: Pick<InMemoryCalendarAvailabilityVault, "read">;
  reader: InjectedLifecycleAvailabilityReader<T>;
  normalizer: CalendarAvailabilityNormalizer<T>;
  aggregate: InjectedAggregatePort<TResult | null>;
  gate?: CalendarAvailabilityFeatureGate;
}>;

function hasMatchingAttemptTuple(
  access: CalendarAvailabilityVaultAccess,
  gate: CalendarAvailabilityFeatureGate,
): boolean {
  const evaluation = { ...access.attempt, gate };
  return (
    isCalendarAvailabilityStatePkceAttemptUsable(evaluation) &&
    typeof access.handle === "string" &&
    access.handle.trim().length > 0 &&
    access.purpose === SHARED_PLAN_FREE_BUSY_PURPOSE &&
    evaluation.attempt.ownerId === access.ownerId &&
    evaluation.attempt.providerFamily === access.providerFamily &&
    evaluation.attempt.purpose === access.purpose
  );
}

function accessWithGate(
  access: CalendarAvailabilityVaultAccess,
  gate: CalendarAvailabilityFeatureGate,
): CalendarAvailabilityVaultAccess {
  return {
    ...access,
    attempt: { ...access.attempt, gate },
  };
}

function readerInputFor(
  access: CalendarAvailabilityVaultAccess,
): Readonly<{ handle: string; window: CalendarAvailabilityWindow }> {
  return Object.freeze({
    handle: access.handle,
    window: Object.freeze({
      startAt: access.attempt.attempt.window.startAt,
      endAt: access.attempt.attempt.window.endAt,
    }),
  });
}

/**
 * Runs an injected fixture chain only after every local admission guard succeeds.
 * It returns an aggregate decision or null, never an availability or connection result.
 */
export async function admitInjectedLifecycleAvailability<T, TResult>(
  input: InjectedLifecycleAdmissionInput<T, TResult>,
): Promise<TResult | null> {
  try {
    const gate = input.gate ?? DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE;
    if (!gate.isEnabled() || !hasMatchingAttemptTuple(input.access, gate)) {
      return null;
    }

    const vaultResult = input.vault.read(accessWithGate(input.access, gate));
    if (
      vaultResult.kind !== "opaque-handle" ||
      vaultResult.handle !== input.access.handle
    ) {
      return null;
    }

    const readerInput = readerInputFor(input.access);
    const normalized = input.normalizer(
      await input.reader.read(readerInput),
      readerInput.window,
    );
    return normalized.kind === "known"
      ? passKnownAvailabilityToAggregate(input.aggregate, normalized)
      : null;
  } catch {
    return null;
  }
}
