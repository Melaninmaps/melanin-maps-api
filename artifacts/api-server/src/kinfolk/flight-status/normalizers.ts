import {
  type FlightStatusState,
  type FlightStatusTime,
  type NormalizedFlightStatus,
} from "./contracts";

const FLIGHT_STATUS_STATES = new Set<FlightStatusState>([
  "scheduled",
  "en_route",
  "landed",
  "cancelled",
  "diverted",
  "unknown",
]);

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isoTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 64) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && /T/.test(value) ? value : undefined;
}

function time(value: unknown): FlightStatusTime | undefined {
  const candidate = object(value);
  if (!candidate) return undefined;
  const scheduledAt = isoTimestamp(candidate.scheduledAt);
  const estimatedAt = isoTimestamp(candidate.estimatedAt);
  const actualAt = isoTimestamp(candidate.actualAt);
  return scheduledAt || estimatedAt || actualAt
    ? { scheduledAt, estimatedAt, actualAt }
    : undefined;
}

/**
 * Converts an adapter's hostile candidate payload into the deliberately narrow
 * client projection. Unknown fields are discarded rather than forwarded.
 */
export function normalizeFlightStatusPayload(
  value: unknown,
): NormalizedFlightStatus | null {
  const candidate = object(value);
  if (
    !candidate ||
    typeof candidate.state !== "string" ||
    !FLIGHT_STATUS_STATES.has(candidate.state as FlightStatusState)
  ) {
    return null;
  }

  const departure = time(candidate.departure);
  const arrival = time(candidate.arrival);
  const observedAt = isoTimestamp(candidate.observedAt);

  return {
    state: candidate.state as FlightStatusState,
    ...(departure ? { departure } : {}),
    ...(arrival ? { arrival } : {}),
    ...(observedAt ? { observedAt } : {}),
  };
}
