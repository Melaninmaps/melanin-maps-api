/**
 * OAUTH-002 source-only contract leaf.
 *
 * These types model fixture-only, already-authorized availability normalization.
 * They are deliberately not an OAuth, provider, network, persistence, route, or
 * feature-activation implementation.
 */

export const SHARED_PLAN_FREE_BUSY_PURPOSE = "shared_plan_free_busy" as const;
export const CALENDAR_AVAILABILITY_SOURCES = [
  "google-freebusy",
  "microsoft-graph-calendarview",
] as const;

export type CalendarAvailabilitySource =
  (typeof CALENDAR_AVAILABILITY_SOURCES)[number];
export type CalendarAvailabilityPurpose = typeof SHARED_PLAN_FREE_BUSY_PURPOSE;

/** A canonical UTC half-open interval, serialized as YYYY-MM-DDTHH:mm:ss.sssZ. */
export type CalendarAvailabilityWindow = Readonly<{
  startAt: string;
  endAt: string;
}>;

/** A provider-neutral normalized busy interval. No provider, account, or event identity is retained. */
export type BusyInterval = Readonly<{
  startAt: string;
  endAt: string;
  timeZone: "Etc/UTC";
}>;

export type AvailabilityFailureCode =
  | "not-enabled"
  | "invalid-window"
  | "invalid-payload"
  | "source-window-mismatch"
  | "incomplete-source-page"
  | "source-unavailable";

export type CalendarAvailabilityResult =
  | Readonly<{
      kind: "known";
      window: CalendarAvailabilityWindow;
      busy: readonly BusyInterval[];
    }>
  | Readonly<{
      kind: "unknown";
      code: AvailabilityFailureCode;
    }>;

/**
 * This production default is intentionally constant false. It has no environment,
 * configuration, route, or provider activation input. Tests alone may inject true.
 */
export type CalendarAvailabilityFeatureGate = Readonly<{
  isEnabled(): boolean;
}>;

export const DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE: CalendarAvailabilityFeatureGate =
  Object.freeze({
    isEnabled: () => false,
  });

/** An inversion-of-control seam for fixture readers only; this module supplies no reader implementation. */
export type InjectedAvailabilitySource<T> = Readonly<{
  read(window: CalendarAvailabilityWindow): Promise<T>;
}>;

export type CalendarAvailabilityNormalizer<T> = (
  raw: T,
  window: CalendarAvailabilityWindow,
) => CalendarAvailabilityResult;

/**
 * The future aggregate-policy port receives only the stable purpose, requested
 * window, and normalized busy ranges. It intentionally cannot receive raw payloads,
 * provider/account/calendar identifiers, event details, credentials, or errors.
 */
export type AggregateAvailabilityInput = Readonly<{
  purpose: CalendarAvailabilityPurpose;
  window: CalendarAvailabilityWindow;
  busy: readonly BusyInterval[];
}>;

export type InjectedAggregatePort<TResult> = Readonly<{
  evaluate(input: AggregateAvailabilityInput): TResult;
}>;
