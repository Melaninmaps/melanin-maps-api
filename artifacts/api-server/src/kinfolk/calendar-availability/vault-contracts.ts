import type { CalendarAvailabilityResult } from "./contracts";
import type { CalendarAvailabilityStatePkceAttemptEvaluation } from "./state-pkce";

/**
 * Fixture-only material held inside the closure created by the in-memory vault.
 * It is accepted only as an input and is never present in a public result.
 */
export type CalendarAvailabilityVaultEntryInput = Readonly<{
  ownerId: string;
  providerFamily: string;
  purpose: string;
  handle: string;
  sealedMaterial: string;
}>;

export type CalendarAvailabilityVaultWriteInput = Readonly<{
  attempt: CalendarAvailabilityStatePkceAttemptEvaluation;
  entry: CalendarAvailabilityVaultEntryInput;
}>;

/**
 * Every public vault operation is bound to the same injected state/PKCE policy
 * input and tuple values used for the in-memory record lookup.
 */
export type CalendarAvailabilityVaultAccess = Readonly<{
  attempt: CalendarAvailabilityStatePkceAttemptEvaluation;
  ownerId: string;
  providerFamily: string;
  purpose: string;
  handle: string;
}>;

/** An opaque output that does not disclose its owner, provider family, purpose, or material. */
export type CalendarAvailabilityVaultHandle = Readonly<{
  kind: "opaque-handle";
  handle: string;
}>;

export type CalendarAvailabilityVaultUnavailable = Extract<
  CalendarAvailabilityResult,
  { kind: "unknown" }
>;

export type CalendarAvailabilityVaultResult =
  | CalendarAvailabilityVaultHandle
  | CalendarAvailabilityVaultUnavailable;

/**
 * A fixture-only in-memory boundary. It has no connection, transport, route, or
 * durable behavior and can reveal only an opaque handle or the generic unavailable result.
 */
export type InMemoryCalendarAvailabilityVault = Readonly<{
  write(
    input: CalendarAvailabilityVaultWriteInput,
  ): CalendarAvailabilityVaultResult;
  read(input: CalendarAvailabilityVaultAccess): CalendarAvailabilityVaultResult;
  revoke(
    input: CalendarAvailabilityVaultAccess,
  ): CalendarAvailabilityVaultUnavailable;
}>;
