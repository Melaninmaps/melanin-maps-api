export const PROVISIONAL_SAFETY_HEAT_DEFAULTS = Object.freeze({
  // These P0 defaults are source-configured, reversible, and intentionally do
  // not activate retention or deletion behavior.
  minimumApprovedSurveyCount: 5,
  recencyWindowDays: 30,
  derivedCacheTtlMs: 60_000,
});

export interface SafetyHeatPolicy {
  minimumApprovedSurveyCount: number;
  recencyWindowDays: number;
  derivedCacheTtlMs: number;
}

export type SafetyHeatConfidence =
  | "insufficient_evidence"
  | "minimum_sample"
  | "larger_sample";

function positiveInteger(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) return fallback;
  return parsed;
}

/**
 * Resolves reversible P0 controls from process environment. Keeping the parser
 * exported makes deployment configuration testable without mutating process.env.
 */
export function resolveSafetyHeatPolicy(
  environment: Record<string, string | undefined> = process.env,
): SafetyHeatPolicy {
  return {
    minimumApprovedSurveyCount: positiveInteger(
      environment.SAFETY_HEAT_MIN_APPROVED_SURVEYS,
      PROVISIONAL_SAFETY_HEAT_DEFAULTS.minimumApprovedSurveyCount,
      100,
    ),
    recencyWindowDays: positiveInteger(
      environment.SAFETY_HEAT_RECENCY_DAYS,
      PROVISIONAL_SAFETY_HEAT_DEFAULTS.recencyWindowDays,
      365,
    ),
    derivedCacheTtlMs: positiveInteger(
      environment.SAFETY_HEAT_CACHE_TTL_MS,
      PROVISIONAL_SAFETY_HEAT_DEFAULTS.derivedCacheTtlMs,
      10 * 60_000,
    ),
  };
}

export const safetyHeatPolicy = resolveSafetyHeatPolicy();

/**
 * This describes evidence volume only. It is not a claim that an area is safe,
 * unsafe, verified, or statistically representative.
 */
export function safetyHeatConfidence(
  observationCount: number,
  policy: Pick<SafetyHeatPolicy, "minimumApprovedSurveyCount"> = safetyHeatPolicy,
): SafetyHeatConfidence {
  if (observationCount < policy.minimumApprovedSurveyCount) return "insufficient_evidence";
  if (observationCount < policy.minimumApprovedSurveyCount * 2) return "minimum_sample";
  return "larger_sample";
}
