export type SafetyLifecycleAction = "withdraw" | "correct" | "set_expiration";

export interface SafetyHubLifecycleConfig {
  /**
   * A display window, not a retention/deletion deadline. Expired reports remain
   * preserved for moderation and audit; they simply fail the public-current
   * predicate until an authorized reviewer explicitly extends the window.
   */
  reportDisplayDays: number;
  /** Alert-type expiry defaults can be reviewed or overridden without a code change. */
  communityAlertExpiryMinutes: Readonly<Record<string, number>>;
}

/**
 * Founder-provided initial durations. These are deliberately defaults only:
 * deployment configuration may replace them and no value here authorizes a
 * purge, overwrite, or deletion of safety evidence.
 */
export const FOUNDER_PROVISIONAL_SAFETY_HUB_DEFAULTS: Readonly<SafetyHubLifecycleConfig> = Object.freeze({
  reportDisplayDays: 7,
  communityAlertExpiryMinutes: Object.freeze({
    ice: 120,
    police: 60,
    checkpoint: 60,
    traffic: 45,
    other: 60,
    road_closure: 240,
    celebration: 480,
    protest: 240,
    festival: 1440,
    construction: 2880,
    emergency: 120,
    severe_weather: 360,
    transit_disruption: 180,
    avoid_area: 240,
    situation_cleared: 60,
    road_reopened: 60,
  }),
});

export interface SafetyReportLifecycleFields {
  status: string | null | undefined;
  displayExpiresAt: Date | string | null | undefined;
  withdrawnAt?: Date | string | null;
  correctedAt?: Date | string | null;
}

export interface CommunityAlertLifecycleFields {
  isActive: boolean | null | undefined;
  expiresAt: Date | string | null | undefined;
  withdrawnAt?: Date | string | null;
  correctedAt?: Date | string | null;
}

export interface SafetyLifecycleUpdate {
  action: SafetyLifecycleAction;
  reason?: string;
  correctionNote?: string;
  displayExpiresAt?: Date;
}

export interface SafetyLifecycleCacheInvalidator {
  invalidate(reason: "report_lifecycle_changed" | "incident_lifecycle_changed"): void;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 && Number.isSafeInteger(parsed) ? parsed : fallback;
}

function alertExpiryOverrides(value: string | undefined): Record<string, number> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([type, minutes]) =>
        typeof minutes === "number" && Number.isSafeInteger(minutes) && minutes > 0
          ? [[type, minutes]]
          : [],
      ),
    );
  } catch {
    return {};
  }
}

/**
 * Reads deployment configuration on startup. Invalid inputs fail closed to the
 * reviewed provisional defaults rather than creating an unbounded display
 * duration. SAFETY_HUB_REPORT_DISPLAY_DAYS and SAFETY_HUB_ALERT_EXPIRY_MINUTES_JSON
 * are configuration knobs, not a data-retention policy.
 */
export function getSafetyHubLifecycleConfig(env: NodeJS.ProcessEnv = process.env): SafetyHubLifecycleConfig {
  const provisional = FOUNDER_PROVISIONAL_SAFETY_HUB_DEFAULTS;
  return {
    reportDisplayDays: positiveInteger(env.SAFETY_HUB_REPORT_DISPLAY_DAYS, provisional.reportDisplayDays),
    communityAlertExpiryMinutes: {
      ...provisional.communityAlertExpiryMinutes,
      ...alertExpiryOverrides(env.SAFETY_HUB_ALERT_EXPIRY_MINUTES_JSON),
    },
  };
}

export function calculateSafetyReportDisplayExpiry(
  now = new Date(),
  config = getSafetyHubLifecycleConfig(),
): Date {
  return new Date(now.getTime() + config.reportDisplayDays * 24 * 60 * 60 * 1000);
}

export function calculateCommunityAlertExpiry(
  type: string,
  now = new Date(),
  config = getSafetyHubLifecycleConfig(),
): Date | null {
  const minutes = config.communityAlertExpiryMinutes[type];
  if (!Number.isSafeInteger(minutes) || minutes <= 0) return null;
  return new Date(now.getTime() + minutes * 60 * 1000);
}

function isStrictlyFuture(value: Date | string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

/** Public display fails closed for unapproved, withdrawn, corrected, malformed, or expired reports. */
export function isCurrentSafetyReportForDisplay(
  report: SafetyReportLifecycleFields,
  now = new Date(),
): boolean {
  return report.status === "approved"
    && !report.withdrawnAt
    && !report.correctedAt
    && isStrictlyFuture(report.displayExpiresAt, now);
}

/** Public display fails closed for inactive, withdrawn, corrected, malformed, or expired alerts. */
export function isCurrentCommunityAlertForDisplay(
  alert: CommunityAlertLifecycleFields,
  now = new Date(),
): boolean {
  return alert.isActive === true
    && !alert.withdrawnAt
    && !alert.correctedAt
    && isStrictlyFuture(alert.expiresAt, now);
}

export function normalizeLifecycleText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return normalized || null;
}

export function parseLifecycleExpiry(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
