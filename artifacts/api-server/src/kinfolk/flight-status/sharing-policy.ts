import type { FlightStatusState } from "./contracts";
import {
  FLIGHT_ARRIVAL_COORDINATION_PURPOSE,
  FLIGHT_ARRIVAL_COORDINATION_SHARING_VERSION,
  type FlightArrivalCoordinationField,
  type FlightArrivalCoordinationSharingGrant,
  type FlightArrivalSharingResult,
  type SharedFlightArrivalProjection,
} from "./sharing-contracts";

const UNAVAILABLE: FlightArrivalSharingResult = Object.freeze({
  kind: "unavailable",
  code: "FLIGHT_ARRIVAL_SHARING_UNAVAILABLE",
});

const SHARABLE_STATES = new Set<Exclude<FlightStatusState, "unknown">>([
  "scheduled",
  "en_route",
  "landed",
  "cancelled",
  "diverted",
]);

const ARRIVAL_FIELDS: Readonly<
  Record<
    Exclude<FlightArrivalCoordinationField, "status" | "observed_at">,
    "scheduledAt" | "estimatedAt" | "actualAt"
  >
> = Object.freeze({
  arrival_scheduled_at: "scheduledAt",
  arrival_estimated_at: "estimatedAt",
  arrival_actual_at: "actualAt",
});

type SelectedArrivalField = keyof typeof ARRIVAL_FIELDS;

type Timestamp = Readonly<{ text: string; epochMs: number }>;

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

/** Parses only a UTC ISO timestamp; it does not read an ambient clock. */
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
  return Number.isFinite(epochMs) ? { text: value, epochMs } : null;
}

function selectedArrivalField(value: unknown): SelectedArrivalField | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const fields = value as readonly unknown[];
  if (
    fields.some((field) => typeof field !== "string") ||
    new Set(fields).size !== fields.length ||
    !fields.includes("status") ||
    !fields.includes("observed_at")
  ) {
    return null;
  }

  const arrival = fields.filter(
    (field): field is SelectedArrivalField =>
      typeof field === "string" && field in ARRIVAL_FIELDS,
  );
  return arrival.length === 1 ? arrival[0]! : null;
}

function grantAllowsExactRecipient(
  value: FlightArrivalCoordinationSharingGrant | null | undefined,
  ownerId: string,
  recipientId: string,
  nowEpochMs: number,
): SelectedArrivalField | null {
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
  const selected = selectedArrivalField(grant.allowedFields);
  return grantedAt &&
    expiresAt &&
    selected &&
    grantedAt.epochMs <= nowEpochMs &&
    nowEpochMs < expiresAt.epochMs
    ? selected
    : null;
}

function projectFreshArrival(
  value: unknown,
  selected: SelectedArrivalField,
  nowEpochMs: number,
  freshnessMaxAgeMs: number,
): SharedFlightArrivalProjection | null {
  const status = record(value);
  if (
    !status ||
    typeof status.state !== "string" ||
    !SHARABLE_STATES.has(status.state as Exclude<FlightStatusState, "unknown">)
  ) {
    return null;
  }

  const observedAt = timestamp(status.observedAt);
  const arrival = record(status.arrival);
  const arrivalKey = ARRIVAL_FIELDS[selected];
  const arrivalAt = arrival ? timestamp(arrival[arrivalKey]) : null;
  if (
    !observedAt ||
    !arrivalAt ||
    observedAt.epochMs > nowEpochMs ||
    nowEpochMs - observedAt.epochMs > freshnessMaxAgeMs
  ) {
    return null;
  }

  return {
    status: status.state as Exclude<FlightStatusState, "unknown">,
    arrival: { [arrivalKey]: arrivalAt.text },
    observedAt: observedAt.text,
  };
}

export type FlightArrivalSharingInput = Readonly<{
  ownerId: unknown;
  recipientId: unknown;
  grant: FlightArrivalCoordinationSharingGrant | null | undefined;
  normalizedStatus: unknown;
  nowEpochMs: unknown;
  freshnessMaxAgeMs: unknown;
}>;

/**
 * Pure, default-deny policy. Its clock and freshness bound are injected; there
 * is no external lookup, persistence, status retrieval, or side effect.
 */
export function resolveFlightArrivalSharing(
  input: FlightArrivalSharingInput,
): FlightArrivalSharingResult {
  if (
    !validMemberId(input.ownerId) ||
    !validMemberId(input.recipientId) ||
    input.ownerId === input.recipientId ||
    typeof input.nowEpochMs !== "number" ||
    !Number.isFinite(input.nowEpochMs) ||
    typeof input.freshnessMaxAgeMs !== "number" ||
    !Number.isInteger(input.freshnessMaxAgeMs) ||
    input.freshnessMaxAgeMs <= 0
  ) {
    return UNAVAILABLE;
  }

  const selected = grantAllowsExactRecipient(
    input.grant,
    input.ownerId,
    input.recipientId,
    input.nowEpochMs,
  );
  if (!selected) return UNAVAILABLE;

  const arrival = projectFreshArrival(
    input.normalizedStatus,
    selected,
    input.nowEpochMs,
    input.freshnessMaxAgeMs,
  );
  return arrival ? { kind: "available", arrival } : UNAVAILABLE;
}
