export const EXPLICIT_FEATURE_RELEASE_MODE_ENV =
  "MWM_EXPLICIT_FEATURE_RELEASE_MODE" as const;

/**
 * This opt-in mode protects a narrowly reviewed production feature release from
 * legacy boot-time writers. It does not alter request authentication or normal
 * authenticated API traffic; it only keeps a restart from running automatic
 * schema, seed, publication, Stripe, worker, and scheduler side effects.
 */
export function isExplicitFeatureReleaseMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[EXPLICIT_FEATURE_RELEASE_MODE_ENV] === "true";
}
