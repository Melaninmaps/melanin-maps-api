import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
  type FlightArrivalCoordinationField,
  type FlightArrivalCoordinationSharingGrant,
} from "./sharing-contracts";
import {
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE,
  RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION,
  type ArrivalCoordinationEligibilityInput,
  type ArrivalCoordinationEligibilityResult,
  type ReciprocalArrivalCoordinationIntent,
} from "./arrival-coordination-contracts";

const UNAVAILABLE: ArrivalCoordinationEligibilityResult = Object.freeze({
  kind: "unavailable",
  code: "ARRIVAL_COORDINATION_UNAVAILABLE",
});
const ELIGIBLE: ArrivalCoordinationEligibilityResult = Object.freeze({
  kind: "eligible",
});

type Timestamp = Readonly<{ epochMs: number }>;
type SelectedArrival = Readonly<{
  grantField: "arrival_estimated_at" | "arrival_actual_at";
  projectionKey: "estimatedAt" | "actualAt";
}>;
type IntentWindow = Readonly<{ startEpochMs: number; endEpochMs: number }>;

const ARRIVAL_SELECTIONS: Readonly<
  Record<SelectedArrival["grantField"], SelectedArrival>
> = Object.freeze({
  arrival_estimated_at: Object.freeze({
    grantField: "arrival_estimated_at",
    projectionKey: "estimatedAt",
  }),
  arrival_actual_at: Object.freeze({
    grantField: "arrival_actual_at",
    projectionKey: "actualAt",
  }),
});

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function validMemberId(value: unknown): value is string {
  return (
    typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)
  );
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parses only injected UTC timestamps; this policy never reads an ambient clock. */
function timestamp(value: unknown): Timestamp | null {
  if (typeof value !== "string" || value.length > 32) return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/.exec(
      value,
    );
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match
    .slice(1, 7)
    .map(Number);
  if (
    year! < 1 ||
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    day! > daysInMonth(year!, month!) ||
    hour! > 23 ||
    minute! > 59 ||
    second! > 59
  ) {
    return null;
  }

  const epochMs = Date.parse(value);
  return Number.isSafeInteger(epochMs) ? { epochMs } : null;
}

function exactSelectedArrival(fields: unknown): SelectedArrival | null {
  if (!Array.isArray(fields) || fields.length !== 3) return null;
  const candidates = fields as readonly unknown[];
  if (
    candidates.some((field) => typeof field !== "string") ||
    new Set(candidates).size !== candidates.length ||
    !candidates.includes("status") ||
    !candidates.includes("observed_at")
  ) {
    return null;
  }

  const selected = candidates.filter(
    (field): field is SelectedArrival["grantField"] =>
      typeof field === "string" && field in ARRIVAL_SELECTIONS,
  );
  return selected.length === 1 ? ARRIVAL_SELECTIONS[selected[0]!] : null;
}

function validOwnerGrant(
  value: FlightArrivalCoordinationSharingGrant | null | undefined,
  ownerId: string,
  recipientId: string,
  nowEpochMs: number,
): SelectedArrival | null {
  const grant = record(value);
  if (
    !grant ||
    grant.version !== FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION ||
    grant.state !== "granted" ||
    grant.ownerId !== ownerId ||
    grant.recipientId !== recipientId ||
    grant.purpose !== FLIGHT_ARRIVAL_COORDINATION_PURPOSE ||
    grant.revokedAt !== null
  ) {
    return null;
  }

  const grantedAt = timestamp(grant.grantedAt);
  const expiresAt = timestamp(grant.expiresAt);
  const selected = exactSelectedArrival(
    grant.allowedFields as
      | readonly FlightArrivalCoordinationField[]
      | undefined,
  );
  return grantedAt &&
    expiresAt &&
    selected &&
    grantedAt.epochMs <= nowEpochMs &&
    nowEpochMs < expiresAt.epochMs
    ? selected
    : null;
}

function validRecipientIntent(
  value: ReciprocalArrivalCoordinationIntent | null | undefined,
  ownerId: string,
  recipientId: string,
  nowEpochMs: number,
): IntentWindow | null {
  const intent = record(value);
  if (
    !intent ||
    intent.version !== RECIPROCAL_ARRIVAL_COORDINATION_INTENT_VERSION ||
    intent.state !== "granted" ||
    intent.ownerId !== ownerId ||
    intent.recipientId !== recipientId ||
    intent.purpose !== RECIPROCAL_ARRIVAL_COORDINATION_INTENT_PURPOSE ||
    intent.revokedAt !== null
  ) {
    return null;
  }

  const grantedAt = timestamp(intent.grantedAt);
  const expiresAt = timestamp(intent.expiresAt);
  const windowStartAt = timestamp(intent.arrivalWindowStartAt);
  const windowEndAt = timestamp(intent.arrivalWindowEndAt);
  return grantedAt &&
    expiresAt &&
    windowStartAt &&
    windowEndAt &&
    grantedAt.epochMs <= nowEpochMs &&
    nowEpochMs < expiresAt.epochMs &&
    windowStartAt.epochMs < windowEndAt.epochMs
    ? { startEpochMs: windowStartAt.epochMs, endEpochMs: windowEndAt.epochMs }
    : null;
}

function eligibleFreshArrival(
  value: unknown,
  selected: SelectedArrival,
  window: IntentWindow,
  nowEpochMs: number,
  freshnessMaxAgeMs: number,
): boolean {
  const projection = record(value);
  if (
    !projection ||
    Object.keys(projection).length !== 3 ||
    !("status" in projection) ||
    !("arrival" in projection) ||
    !("observedAt" in projection) ||
    (projection.status !== "en_route" && projection.status !== "landed")
  ) {
    return false;
  }

  if (
    (projection.status === "en_route" &&
      selected.grantField !== "arrival_estimated_at") ||
    (projection.status === "landed" &&
      selected.grantField !== "arrival_actual_at")
  ) {
    return false;
  }

  const observedAt = timestamp(projection.observedAt);
  const arrival = record(projection.arrival);
  if (
    !observedAt ||
    !arrival ||
    Object.keys(arrival).length !== 1 ||
    !(selected.projectionKey in arrival)
  ) {
    return false;
  }

  const arrivalAt = timestamp(arrival[selected.projectionKey]);
  return Boolean(
    arrivalAt &&
    observedAt.epochMs <= nowEpochMs &&
    nowEpochMs - observedAt.epochMs <= freshnessMaxAgeMs &&
    arrivalAt.epochMs >= window.startEpochMs &&
    arrivalAt.epochMs <= window.endEpochMs,
  );
}

/**
 * Pure, default-deny eligibility composition. It reads only injected immutable
 * values and returns no data capable of triggering a downstream action.
 */
export function resolveArrivalCoordinationEligibility(
  input: ArrivalCoordinationEligibilityInput,
): ArrivalCoordinationEligibilityResult {
  if (
    !validMemberId(input.ownerId) ||
    !validMemberId(input.recipientId) ||
    input.ownerId === input.recipientId ||
    typeof input.nowEpochMs !== "number" ||
    !Number.isSafeInteger(input.nowEpochMs) ||
    typeof input.freshnessMaxAgeMs !== "number" ||
    !Number.isSafeInteger(input.freshnessMaxAgeMs) ||
    input.freshnessMaxAgeMs <= 0
  ) {
    return UNAVAILABLE;
  }

  const selected = validOwnerGrant(
    input.sharingGrant,
    input.ownerId,
    input.recipientId,
    input.nowEpochMs,
  );
  if (!selected) return UNAVAILABLE;

  const window = validRecipientIntent(
    input.reciprocalIntent,
    input.ownerId,
    input.recipientId,
    input.nowEpochMs,
  );
  if (!window) return UNAVAILABLE;

  return eligibleFreshArrival(
    input.sharedArrival,
    selected,
    window,
    input.nowEpochMs,
    input.freshnessMaxAgeMs,
  )
    ? ELIGIBLE
    : UNAVAILABLE;
}
