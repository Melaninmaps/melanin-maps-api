import {
  DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
  type AggregateAvailabilityInput,
  type BusyInterval,
  type CalendarAvailabilityFeatureGate,
  type CalendarAvailabilityNormalizer,
  type CalendarAvailabilityResult,
  type CalendarAvailabilityWindow,
  type InjectedAggregatePort,
  type InjectedAvailabilitySource,
} from "./contracts";

const MAX_INTERVALS = 1_000;
const CANONICAL_UTC =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;
const GRAPH_UTC_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?$/;

type PlainRecord = Record<string, unknown>;
type ParsedInterval = Readonly<{ startMs: number; endMs: number }>;

function unknown(
  code: Extract<CalendarAvailabilityResult, { kind: "unknown" }>["code"],
): CalendarAvailabilityResult {
  return { kind: "unknown", code };
}

function plainRecord(value: unknown): PlainRecord | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return null;
  }
  const result: PlainRecord = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor))
      return null;
    result[key] = descriptor.value;
  }
  return result;
}

function exactRecord(
  value: unknown,
  allowed: readonly string[],
): PlainRecord | null {
  const record = plainRecord(value);
  if (!record) return null;
  const keys = Object.keys(record);
  return keys.length === allowed.length &&
    keys.every((key) => allowed.includes(key))
    ? record
    : null;
}

function exactArray(value: unknown): readonly unknown[] | null {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    value.length > MAX_INTERVALS
  )
    return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) return null;
  const result: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor))
      return null;
    result.push(descriptor.value);
  }
  return result;
}

function canonicalUtc(value: unknown): number | null {
  if (typeof value !== "string" || !CANONICAL_UTC.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString() === value
    ? timestamp
    : null;
}

function graphUtc(value: unknown): number | null {
  const record = exactRecord(value, ["dateTime", "timeZone"]);
  if (
    !record ||
    record.timeZone !== "UTC" ||
    typeof record.dateTime !== "string"
  )
    return null;
  const match = GRAPH_UTC_LOCAL.exec(record.dateTime);
  if (!match) return null;
  const fraction = (match[7] ?? "").padEnd(3, "0").slice(0, 3);
  return canonicalUtc(
    `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${fraction}Z`,
  );
}

function parseWindow(
  window: CalendarAvailabilityWindow,
): ParsedInterval | null {
  const record = exactRecord(window, ["startAt", "endAt"]);
  if (!record) return null;
  const startMs = canonicalUtc(record.startAt);
  const endMs = canonicalUtc(record.endAt);
  const maximumWindowMs = 31 * 24 * 60 * 60 * 1_000;
  return startMs !== null &&
    endMs !== null &&
    endMs > startMs &&
    endMs - startMs <= maximumWindowMs
    ? { startMs, endMs }
    : null;
}

function normalizedWindow(
  window: CalendarAvailabilityWindow,
): CalendarAvailabilityWindow {
  return { startAt: window.startAt, endAt: window.endAt };
}

function normalizeIntervals(
  intervals: readonly ParsedInterval[],
  window: ParsedInterval,
): readonly BusyInterval[] {
  const clipped = intervals
    .map((interval) => ({
      startMs: Math.max(interval.startMs, window.startMs),
      endMs: Math.min(interval.endMs, window.endMs),
    }))
    .filter((interval) => interval.endMs > interval.startMs)
    .sort(
      (left, right) => left.startMs - right.startMs || left.endMs - right.endMs,
    );
  const merged: Array<{ startMs: number; endMs: number }> = [];
  for (const interval of clipped) {
    const prior = merged.at(-1);
    if (prior && interval.startMs <= prior.endMs) {
      prior.endMs = Math.max(prior.endMs, interval.endMs);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged.map((interval) => ({
    startAt: new Date(interval.startMs).toISOString(),
    endAt: new Date(interval.endMs).toISOString(),
    timeZone: "Etc/UTC" as const,
  }));
}

function known(
  window: CalendarAvailabilityWindow,
  intervals: readonly ParsedInterval[],
): CalendarAvailabilityResult {
  const parsedWindow = parseWindow(window);
  return parsedWindow
    ? {
        kind: "known",
        window: normalizedWindow(window),
        busy: normalizeIntervals(intervals, parsedWindow),
      }
    : unknown("invalid-window");
}

/**
 * Strictly accepts a fixture-shaped one-calendar Google FreeBusy response. Calendar
 * keys and every non-busy provider field are rejected and never retained.
 */
export function normalizeGoogleFreeBusy(
  raw: unknown,
  window: CalendarAvailabilityWindow,
): CalendarAvailabilityResult {
  const requestedWindow = parseWindow(window);
  if (!requestedWindow) return unknown("invalid-window");
  const root = exactRecord(raw, ["timeMin", "timeMax", "calendars"]);
  if (!root) return unknown("invalid-payload");
  const timeMin = canonicalUtc(root.timeMin);
  const timeMax = canonicalUtc(root.timeMax);
  if (timeMin === null || timeMax === null) return unknown("invalid-payload");
  if (timeMin !== requestedWindow.startMs || timeMax !== requestedWindow.endMs)
    return unknown("source-window-mismatch");
  const calendars = plainRecord(root.calendars);
  const calendarKeys = calendars ? Object.keys(calendars) : [];
  if (!calendars || calendarKeys.length !== 1)
    return unknown("invalid-payload");
  const calendar = exactRecord(calendars[calendarKeys[0]!], ["busy"]);
  const busy = calendar ? exactArray(calendar.busy) : null;
  if (!busy) return unknown("invalid-payload");
  const intervals: ParsedInterval[] = [];
  for (const entry of busy) {
    const range = exactRecord(entry, ["start", "end"]);
    const startMs = range ? canonicalUtc(range.start) : null;
    const endMs = range ? canonicalUtc(range.end) : null;
    if (startMs === null || endMs === null || endMs <= startMs)
      return unknown("invalid-payload");
    intervals.push({ startMs, endMs });
  }
  return known(window, intervals);
}

/**
 * Strictly accepts a synthetic default-calendar Graph calendarView DTO. A live
 * adapter must project and complete pages before this pure leaf receives data.
 */
export function normalizeMicrosoftGraphCalendarView(
  raw: unknown,
  window: CalendarAvailabilityWindow,
): CalendarAvailabilityResult {
  const requestedWindow = parseWindow(window);
  if (!requestedWindow) return unknown("invalid-window");
  const root = plainRecord(raw);
  if (!root) return unknown("invalid-payload");
  if (Object.prototype.hasOwnProperty.call(root, "@odata.nextLink"))
    return unknown("incomplete-source-page");
  const keys = Object.keys(root);
  if (keys.length !== 1 || keys[0] !== "value")
    return unknown("invalid-payload");
  const events = exactArray(root.value);
  if (!events) return unknown("invalid-payload");
  const intervals: ParsedInterval[] = [];
  for (const event of events) {
    const record = exactRecord(event, ["showAs", "start", "end"]);
    if (!record || typeof record.showAs !== "string")
      return unknown("invalid-payload");
    const startMs = graphUtc(record.start);
    const endMs = graphUtc(record.end);
    if (startMs === null || endMs === null || endMs <= startMs)
      return unknown("invalid-payload");
    if (record.showAs === "free" || record.showAs === "workingElsewhere")
      continue;
    if (
      record.showAs !== "tentative" &&
      record.showAs !== "busy" &&
      record.showAs !== "oof" &&
      record.showAs !== "unknown"
    ) {
      return unknown("invalid-payload");
    }
    intervals.push({ startMs, endMs });
  }
  return known(window, intervals);
}

/**
 * Runs only an explicitly injected fixture reader. The default gate prevents any
 * read; the helper has no URL, HTTP, provider, persistence, logging, or activation
 * capability.
 */
export async function readAndNormalizeAvailability<T>(
  source: InjectedAvailabilitySource<T>,
  window: CalendarAvailabilityWindow,
  normalizer: CalendarAvailabilityNormalizer<T>,
  gate: CalendarAvailabilityFeatureGate = DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
): Promise<CalendarAvailabilityResult> {
  if (!parseWindow(window)) return unknown("invalid-window");
  try {
    if (!gate.isEnabled()) return unknown("not-enabled");
    return normalizer(
      await source.read(normalizedWindow(window)),
      normalizedWindow(window),
    );
  } catch {
    return unknown("source-unavailable");
  }
}

/** Passes only an already-normalized aggregate-safe value to an injected future policy port. */
export function passKnownAvailabilityToAggregate<TResult>(
  port: InjectedAggregatePort<TResult>,
  result: CalendarAvailabilityResult,
): TResult | null {
  if (result.kind !== "known") return null;
  const input: AggregateAvailabilityInput = {
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    window: result.window,
    busy: result.busy,
  };
  return port.evaluate(input);
}
