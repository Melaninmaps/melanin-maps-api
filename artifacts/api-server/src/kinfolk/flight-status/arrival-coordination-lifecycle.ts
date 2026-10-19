import {
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE,
  ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION,
  type ArrivalCoordinationAvailabilityPermission,
  type ArrivalCoordinationLifecycleInput,
  type ArrivalCoordinationLifecycleResult,
} from "./arrival-coordination-lifecycle-contracts";
import { resolveArrivalCoordinationEligibility } from "./arrival-coordination-policy";
import { resolveFlightArrivalSharing } from "./sharing-policy";

const UNAVAILABLE: ArrivalCoordinationLifecycleResult = Object.freeze({
  kind: "unavailable",
  code: "ARRIVAL_COORDINATION_LIFECYCLE_UNAVAILABLE",
});

type Timestamp = Readonly<{ text: string; epochMs: number }>;
type Window = Readonly<{
  startAt: string;
  endAt: string;
  startEpochMs: number;
  endEpochMs: number;
}>;
type BusyInterval = Readonly<{ startEpochMs: number; endEpochMs: number }>;

function exactRecord(
  value: unknown,
  allowed: readonly string[],
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return null;
  }

  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== allowed.length ||
    keys.some((key) => typeof key !== "string" || !allowed.includes(key))
  ) {
    return null;
  }

  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return null;
    }
    result[key] = descriptor.value;
  }
  return result;
}

function exactArray(value: unknown): readonly unknown[] | null {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    value.length > 1_000
  ) {
    return null;
  }

  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) return null;

  const result: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      return null;
    }
    result.push(descriptor.value);
  }
  return result;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function timestamp(value: unknown): Timestamp | null {
  if (typeof value !== "string" || value.length !== 24) return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second, millisecond] = match
    .slice(1)
    .map(Number);
  if (
    year! < 1 ||
    year! > 9_999 ||
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    day! > daysInMonth(year!, month!) ||
    hour! > 23 ||
    minute! > 59 ||
    second! > 59 ||
    millisecond! > 999
  ) {
    return null;
  }

  const epochMs = Date.parse(value);
  return Number.isSafeInteger(epochMs) ? { text: value, epochMs } : null;
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

/** Formats an injected epoch without observing an ambient clock. */
function canonicalTimestamp(epochMs: number): string | null {
  if (!Number.isSafeInteger(epochMs)) return null;
  const seconds = Math.floor(epochMs / 1_000);
  const milliseconds = epochMs - seconds * 1_000;
  const days = Math.floor(seconds / 86_400);
  const secondsOfDay = seconds - days * 86_400;
  const z = days + 719_468;
  const era = Math.floor(z >= 0 ? z / 146_097 : (z - 146_096) / 146_097);
  const dayOfEra = z - era * 146_097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1_460) +
      Math.floor(dayOfEra / 36_524) -
      Math.floor(dayOfEra / 146_096)) /
      365,
  );
  let year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthPrime = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthPrime + 2) / 5) + 1;
  const month = monthPrime + (monthPrime < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  if (year < 1 || year > 9_999) return null;

  const hour = Math.floor(secondsOfDay / 3_600);
  const minute = Math.floor((secondsOfDay % 3_600) / 60);
  const second = secondsOfDay % 60;
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}T${pad(hour, 2)}:${pad(
    minute,
    2,
  )}:${pad(second, 2)}.${pad(milliseconds, 3)}Z`;
}

function window(value: unknown): Window | null {
  const candidate = exactRecord(value, ["startAt", "endAt"]);
  if (!candidate) return null;
  const startAt = timestamp(candidate.startAt);
  const endAt = timestamp(candidate.endAt);
  return startAt && endAt && endAt.epochMs > startAt.epochMs
    ? {
        startAt: startAt.text,
        endAt: endAt.text,
        startEpochMs: startAt.epochMs,
        endEpochMs: endAt.epochMs,
      }
    : null;
}

function validMemberId(value: unknown): value is string {
  return (
    typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)
  );
}

function knownBusy(
  value: unknown,
  expectedWindow: Window,
): readonly BusyInterval[] | null {
  const result = exactRecord(value, ["kind", "window", "busy"]);
  if (!result || result.kind !== "known") return null;

  const resultWindow = window(result.window);
  const busy = exactArray(result.busy);
  if (
    !resultWindow ||
    !busy ||
    resultWindow.startAt !== expectedWindow.startAt ||
    resultWindow.endAt !== expectedWindow.endAt
  ) {
    return null;
  }

  const intervals: BusyInterval[] = [];
  let priorEnd = expectedWindow.startEpochMs;
  for (const candidate of busy) {
    const interval = exactRecord(candidate, ["startAt", "endAt", "timeZone"]);
    if (!interval || interval.timeZone !== "Etc/UTC") return null;
    const startAt = timestamp(interval.startAt);
    const endAt = timestamp(interval.endAt);
    if (
      !startAt ||
      !endAt ||
      startAt.epochMs < expectedWindow.startEpochMs ||
      endAt.epochMs > expectedWindow.endEpochMs ||
      endAt.epochMs <= startAt.epochMs ||
      startAt.epochMs < priorEnd
    ) {
      return null;
    }
    intervals.push({
      startEpochMs: startAt.epochMs,
      endEpochMs: endAt.epochMs,
    });
    priorEnd = endAt.epochMs;
  }
  return intervals;
}

function permissionBusy(
  value: ArrivalCoordinationAvailabilityPermission | null | undefined,
  expectedOwnerId: string,
  expectedRecipientId: string,
  expectedWindow: Window,
  nowEpochMs: number,
): readonly BusyInterval[] | null {
  const permission = exactRecord(value, [
    "version",
    "state",
    "ownerId",
    "recipientId",
    "purpose",
    "grantedAt",
    "expiresAt",
    "revokedAt",
    "availability",
  ]);
  if (
    !permission ||
    permission.version !==
      ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_VERSION ||
    permission.state !== "granted" ||
    permission.ownerId !== expectedOwnerId ||
    permission.recipientId !== expectedRecipientId ||
    permission.purpose !==
      ARRIVAL_COORDINATION_AVAILABILITY_PERMISSION_PURPOSE ||
    permission.revokedAt !== null
  ) {
    return null;
  }

  const grantedAt = timestamp(permission.grantedAt);
  const expiresAt = timestamp(permission.expiresAt);
  if (
    !grantedAt ||
    !expiresAt ||
    grantedAt.epochMs > nowEpochMs ||
    nowEpochMs >= expiresAt.epochMs
  ) {
    return null;
  }
  return knownBusy(permission.availability, expectedWindow);
}

function intentMatchesWindow(value: unknown, expectedWindow: Window): boolean {
  const intent = exactRecord(value, [
    "version",
    "state",
    "ownerId",
    "recipientId",
    "purpose",
    "grantedAt",
    "expiresAt",
    "revokedAt",
    "arrivalWindowStartAt",
    "arrivalWindowEndAt",
  ]);
  return Boolean(
    intent &&
    intent.arrivalWindowStartAt === expectedWindow.startAt &&
    intent.arrivalWindowEndAt === expectedWindow.endAt,
  );
}

function sharedArrivalEpoch(value: unknown): number | null {
  const arrival = exactRecord(value, ["status", "arrival", "observedAt"]);
  if (
    !arrival ||
    (arrival.status !== "en_route" && arrival.status !== "landed")
  ) {
    return null;
  }
  const projected = exactRecord(
    arrival.arrival,
    arrival.status === "en_route" ? ["estimatedAt"] : ["actualAt"],
  );
  if (!projected) return null;
  const time = timestamp(
    arrival.status === "en_route" ? projected.estimatedAt : projected.actualAt,
  );
  return time?.epochMs ?? null;
}

function mergedBusy(
  first: readonly BusyInterval[],
  second: readonly BusyInterval[],
): readonly BusyInterval[] {
  const sorted = [...first, ...second].sort(
    (left, right) =>
      left.startEpochMs - right.startEpochMs ||
      left.endEpochMs - right.endEpochMs,
  );
  const merged: Array<{ startEpochMs: number; endEpochMs: number }> = [];
  for (const interval of sorted) {
    const prior = merged.at(-1);
    if (prior && interval.startEpochMs <= prior.endEpochMs) {
      prior.endEpochMs = Math.max(prior.endEpochMs, interval.endEpochMs);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

function earliestSlot(
  arrivalEpochMs: number,
  expectedWindow: Window,
  busy: readonly BusyInterval[],
  minimumDurationMs: number,
): ArrivalCoordinationLifecycleResult {
  let startEpochMs = Math.max(arrivalEpochMs, expectedWindow.startEpochMs);
  for (const interval of busy) {
    if (interval.endEpochMs <= startEpochMs) continue;
    if (interval.startEpochMs > startEpochMs) {
      const endEpochMs = startEpochMs + minimumDurationMs;
      if (
        Number.isSafeInteger(endEpochMs) &&
        endEpochMs <= interval.startEpochMs &&
        endEpochMs <= expectedWindow.endEpochMs
      ) {
        const startAt = canonicalTimestamp(startEpochMs);
        const endAt = canonicalTimestamp(endEpochMs);
        return startAt && endAt
          ? Object.freeze({ startAt, endAt })
          : UNAVAILABLE;
      }
    }
    startEpochMs = Math.max(startEpochMs, interval.endEpochMs);
  }

  const endEpochMs = startEpochMs + minimumDurationMs;
  if (
    !Number.isSafeInteger(endEpochMs) ||
    endEpochMs > expectedWindow.endEpochMs
  ) {
    return UNAVAILABLE;
  }
  const startAt = canonicalTimestamp(startEpochMs);
  const endAt = canonicalTimestamp(endEpochMs);
  return startAt && endAt ? Object.freeze({ startAt, endAt }) : UNAVAILABLE;
}

/**
 * Pure simulated composition: sharing is resolved first, then eligibility, then
 * two already-normalized busy snapshots can produce one neutral time proposal.
 */
export function resolveSimulatedArrivalMeetingTime(
  input: ArrivalCoordinationLifecycleInput,
): ArrivalCoordinationLifecycleResult {
  try {
    if (
      !validMemberId(input.ownerId) ||
      !validMemberId(input.recipientId) ||
      input.ownerId === input.recipientId ||
      typeof input.nowEpochMs !== "number" ||
      !Number.isSafeInteger(input.nowEpochMs) ||
      typeof input.freshnessMaxAgeMs !== "number" ||
      !Number.isSafeInteger(input.freshnessMaxAgeMs) ||
      input.freshnessMaxAgeMs <= 0 ||
      typeof input.minimumDurationMs !== "number" ||
      !Number.isSafeInteger(input.minimumDurationMs) ||
      input.minimumDurationMs <= 0
    ) {
      return UNAVAILABLE;
    }

    const sharing = resolveFlightArrivalSharing({
      ownerId: input.ownerId,
      recipientId: input.recipientId,
      grant: input.sharingGrant,
      normalizedStatus: input.normalizedStatus,
      nowEpochMs: input.nowEpochMs,
      freshnessMaxAgeMs: input.freshnessMaxAgeMs,
    });
    if (sharing.kind !== "available") return UNAVAILABLE;

    const eligibility = resolveArrivalCoordinationEligibility({
      ownerId: input.ownerId,
      recipientId: input.recipientId,
      sharingGrant: input.sharingGrant,
      sharedArrival: sharing.arrival,
      reciprocalIntent: input.reciprocalIntent,
      nowEpochMs: input.nowEpochMs,
      freshnessMaxAgeMs: input.freshnessMaxAgeMs,
    });
    if (eligibility.kind !== "eligible") return UNAVAILABLE;

    const expectedWindow = window(input.coordinationWindow);
    if (
      !expectedWindow ||
      !intentMatchesWindow(input.reciprocalIntent, expectedWindow)
    ) {
      return UNAVAILABLE;
    }

    const arrivalEpochMs = sharedArrivalEpoch(sharing.arrival);
    const ownerBusy = permissionBusy(
      input.ownerAvailabilityPermission,
      input.ownerId,
      input.recipientId,
      expectedWindow,
      input.nowEpochMs,
    );
    const recipientBusy = permissionBusy(
      input.recipientAvailabilityPermission,
      input.recipientId,
      input.ownerId,
      expectedWindow,
      input.nowEpochMs,
    );
    if (arrivalEpochMs === null || !ownerBusy || !recipientBusy)
      return UNAVAILABLE;

    return earliestSlot(
      arrivalEpochMs,
      expectedWindow,
      mergedBusy(ownerBusy, recipientBusy),
      input.minimumDurationMs,
    );
  } catch {
    return UNAVAILABLE;
  }
}
