/**
 * Shared Plan free/busy policy core.
 *
 * This is intentionally a pure, import-free policy: callers must provide only
 * already-authorized, normalized inputs. It performs no persistence, lookup,
 * provider, calendar, relationship, or notification work. A null result is a
 * generic fail-closed decision and must not be treated as an availability result.
 */
export const SHARED_PLAN_FREE_BUSY_PURPOSE = "shared_plan_free_busy" as const;

const MAX_PARTICIPANTS = 32;
const MAX_BUSY_INTERVALS_PER_PARTICIPANT = 64;
const MAX_PLAN_WINDOW_MS = 31 * 24 * 60 * 60 * 1_000;
const MAX_GRANT_WINDOW_MS = 93 * 24 * 60 * 60 * 1_000;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/;

const supportedTimeZones = new Set(
  (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [],
);

type ExactRecord = Record<string, unknown>;
type ParsedInterval = Readonly<{ startMs: number; endMs: number; timeZone: string }>;
type ParsedPlan = Readonly<{ id: string; startMs: number; endMs: number; timeZone: string }>;
type ParsedGrant = Readonly<{
  participantRef: string;
  grantedAtMs: number;
  expiresAtMs: number;
  windowStartMs: number;
  windowEndMs: number;
}>;
type ParsedParticipant = Readonly<{ busyIntervals: readonly ParsedInterval[] }>;

export type SharedPlanFreeBusyGrantState = "granted" | "pending" | "declined" | "revoked";

export type SharedPlanFreeBusyInput = Readonly<{
  plan: Readonly<{
    id: string;
    purpose: typeof SHARED_PLAN_FREE_BUSY_PURPOSE;
    startAt: string;
    endAt: string;
    timeZone: string;
  }>;
  participants: ReadonlyArray<Readonly<{
    participantRef: string;
    grant: Readonly<{
      planId: string;
      purpose: typeof SHARED_PLAN_FREE_BUSY_PURPOSE | string;
      participantRef: string;
      state: SharedPlanFreeBusyGrantState | string;
      grantedAt: string;
      expiresAt: string;
      windowStartAt: string;
      windowEndAt: string;
      timeZone: string;
    }>;
    busyIntervals: readonly Readonly<{
      startAt: string;
      endAt: string;
      timeZone: string;
    }>[];
  }>>;
  minimumAvailable: number;
}>;

export type SharedPlanFreeBusyCandidateWindow = Readonly<{
  startAt: string;
  endAt: string;
  timeZone: string;
  availableCount: number;
}>;

export type SharedPlanFreeBusyResult = Readonly<{
  participantCount: number;
  minimumAvailable: number;
  minimumAvailabilityMet: boolean;
  candidateWindows: readonly SharedPlanFreeBusyCandidateWindow[];
}>;

function exactRecord(value: unknown, allowedKeys: readonly string[]): ExactRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    return null;
  }
  const result: ExactRecord = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowedKeys.includes(key)) return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
    result[key] = descriptor.value;
  }
  return result;
}

/** Copies only a dense, ordinary data-property array; sparse/decorated arrays fail closed. */
function exactArray(value: unknown, maximumLength: number): readonly unknown[] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximumLength) return null;
  const values: unknown[] = [];
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== value.length + 1) return null;
  for (const key of ownKeys) {
    if (key === "length") continue;
    if (typeof key !== "string" || !/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= value.length) return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
    values.push(descriptor.value);
  }
  return values;
}

function opaqueReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const canonical = value.normalize("NFKC");
  return value === canonical && value === value.trim() && value.length > 0 && value.length <= 128 && !CONTROL.test(value)
    ? value
    : null;
}

/** Canonical IANA names only; callers must pair every UTC interval with one. */
function namedTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 80 || CONTROL.test(value) || value.trim() !== value) return null;
  return value === "Etc/UTC" || supportedTimeZones.has(value) ? value : null;
}

/** Accepts only canonical, finite UTC instants; ambiguous local timestamps are excluded. */
function utcInstant(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = UTC_TIMESTAMP.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const milliseconds = Number(match[7] ?? "0");
  if (year < 1000 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return null;
  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second, milliseconds);
  if (!Number.isFinite(timestamp)) return null;
  const canonical = new Date(timestamp).toISOString();
  return value === canonical || (milliseconds === 0 && value === canonical.replace(".000Z", "Z")) ? timestamp : null;
}

function interval(value: unknown, maxDurationMs: number): ParsedInterval | null {
  const record = exactRecord(value, ["startAt", "endAt", "timeZone"]);
  if (!record) return null;
  const startMs = utcInstant(record.startAt);
  const endMs = utcInstant(record.endAt);
  const timeZone = namedTimeZone(record.timeZone);
  return startMs !== null && endMs !== null && timeZone && endMs > startMs && endMs - startMs <= maxDurationMs
    ? { startMs, endMs, timeZone }
    : null;
}

function parsePlan(value: unknown): ParsedPlan | null {
  const record = exactRecord(value, ["id", "purpose", "startAt", "endAt", "timeZone"]);
  if (!record || record.purpose !== SHARED_PLAN_FREE_BUSY_PURPOSE) return null;
  const id = opaqueReference(record.id);
  const parsed = interval({ startAt: record.startAt, endAt: record.endAt, timeZone: record.timeZone }, MAX_PLAN_WINDOW_MS);
  return id && parsed ? { id, ...parsed } : null;
}

function parseGrant(value: unknown, plan: ParsedPlan, participantRef: string, nowMs: number): ParsedGrant | null {
  const record = exactRecord(value, [
    "planId", "purpose", "participantRef", "state", "grantedAt", "expiresAt", "windowStartAt", "windowEndAt", "timeZone",
  ]);
  if (!record || record.purpose !== SHARED_PLAN_FREE_BUSY_PURPOSE || record.state !== "granted") return null;
  const planId = opaqueReference(record.planId);
  const grantParticipant = opaqueReference(record.participantRef);
  const grantedAtMs = utcInstant(record.grantedAt);
  const expiresAtMs = utcInstant(record.expiresAt);
  const grantWindow = interval({ startAt: record.windowStartAt, endAt: record.windowEndAt, timeZone: record.timeZone }, MAX_GRANT_WINDOW_MS);
  if (!planId || !grantParticipant || grantedAtMs === null || expiresAtMs === null || !grantWindow) return null;
  if (planId !== plan.id || grantParticipant !== participantRef || grantedAtMs > nowMs || expiresAtMs <= nowMs || expiresAtMs <= grantedAtMs) return null;
  if (grantWindow.timeZone !== plan.timeZone || grantWindow.startMs > plan.startMs || grantWindow.endMs < plan.endMs) return null;
  return {
    participantRef,
    grantedAtMs,
    expiresAtMs,
    windowStartMs: grantWindow.startMs,
    windowEndMs: grantWindow.endMs,
  };
}

function intervalsDoNotOverlap(intervals: readonly ParsedInterval[]): boolean {
  const ordered = [...intervals].sort((left, right) => left.startMs - right.startMs || left.endMs - right.endMs);
  return ordered.every((current, index) => index === 0 || current.startMs >= ordered[index - 1]!.endMs);
}

function parseParticipant(value: unknown, plan: ParsedPlan, nowMs: number): ParsedParticipant | null {
  const record = exactRecord(value, ["participantRef", "grant", "busyIntervals"]);
  const busyInput = record ? exactArray(record.busyIntervals, MAX_BUSY_INTERVALS_PER_PARTICIPANT) : null;
  if (!record || !busyInput) return null;
  const participantRef = opaqueReference(record.participantRef);
  if (!participantRef || !parseGrant(record.grant, plan, participantRef, nowMs)) return null;
  const busyIntervals = busyInput.map((item) => interval(item, MAX_PLAN_WINDOW_MS));
  if (busyIntervals.some((item) => !item)) return null;
  const normalized = busyIntervals as ParsedInterval[];
  if (!normalized.every((item) => item.timeZone === plan.timeZone && item.startMs >= plan.startMs && item.endMs <= plan.endMs)) return null;
  return intervalsDoNotOverlap(normalized) ? { busyIntervals: normalized } : null;
}

function toUtcTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Evaluates pre-authorized normalized free/busy input without disclosing any
 * participant-level information. `now` is mandatory so expiry decisions stay
 * reproducible and testable; the function never reads wall-clock time itself.
 */
function evaluateSharedPlanFreeBusyUnchecked(input: unknown, now: Date): SharedPlanFreeBusyResult | null {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return null;
  const record = exactRecord(input, ["plan", "participants", "minimumAvailable"]);
  const rawParticipants = record ? exactArray(record.participants, MAX_PARTICIPANTS) : null;
  if (!record || !rawParticipants || rawParticipants.length === 0) return null;
  const minimumAvailable = record.minimumAvailable;
  if (typeof minimumAvailable !== "number" || !Number.isInteger(minimumAvailable) || minimumAvailable < 1 || minimumAvailable > rawParticipants.length) return null;
  const plan = parsePlan(record.plan);
  const nowMs = now.getTime();
  if (!plan || plan.endMs <= nowMs) return null;
  const participantRefs = rawParticipants.map((participant) => opaqueReference(exactRecord(participant, ["participantRef", "grant", "busyIntervals"])?.participantRef));
  if (participantRefs.some((ref) => !ref) || new Set(participantRefs).size !== rawParticipants.length) return null;
  const participants = rawParticipants.map((participant) => parseParticipant(participant, plan, nowMs));
  if (participants.some((participant) => !participant)) return null;

  const effectiveStartMs = Math.max(plan.startMs, nowMs);
  const points = new Set<number>([effectiveStartMs, plan.endMs]);
  for (const participant of participants as ParsedParticipant[]) {
    for (const busy of participant.busyIntervals) {
      if (busy.endMs > effectiveStartMs && busy.startMs < plan.endMs) {
        points.add(Math.max(effectiveStartMs, busy.startMs));
        points.add(Math.min(plan.endMs, busy.endMs));
      }
    }
  }

  const sortedPoints = [...points].sort((left, right) => left - right);
  const windows: Array<{ startMs: number; endMs: number; availableCount: number }> = [];
  for (let index = 1; index < sortedPoints.length; index += 1) {
    const startMs = sortedPoints[index - 1]!;
    const endMs = sortedPoints[index]!;
    if (endMs <= startMs) continue;
    const availableCount = (participants as ParsedParticipant[]).reduce(
      (count, participant) => count + (participant.busyIntervals.some((busy) => busy.startMs < endMs && busy.endMs > startMs) ? 0 : 1),
      0,
    );
    if (availableCount === 0) continue;
    const previous = windows[windows.length - 1];
    if (previous && previous.endMs === startMs && previous.availableCount === availableCount) {
      previous.endMs = endMs;
    } else {
      windows.push({ startMs, endMs, availableCount });
    }
  }

  const candidateWindows = windows.map(({ startMs, endMs, availableCount }) => ({
    startAt: toUtcTimestamp(startMs),
    endAt: toUtcTimestamp(endMs),
    timeZone: plan.timeZone,
    availableCount,
  }));
  return {
    participantCount: participants.length,
    minimumAvailable,
    minimumAvailabilityMet: candidateWindows.some((window) => window.availableCount >= minimumAvailable),
    candidateWindows,
  };
}

/** Any hostile reflective input fails closed rather than escaping the policy boundary. */
export function evaluateSharedPlanFreeBusy(input: unknown, now: Date): SharedPlanFreeBusyResult | null {
  try {
    return evaluateSharedPlanFreeBusyUnchecked(input, now);
  } catch {
    return null;
  }
}
