export const STAGING_ORIGIN =
  "https://kinfolk-memory-api-staging-staging.up.railway.app";

type PublicEnvironment = Record<string, string | undefined>;

function normalizeOrigin(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      "API configuration blocked: EXPO_PUBLIC_API_ORIGIN must be a valid HTTPS origin",
    );
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "API configuration blocked: API origin cannot contain credentials, paths, query parameters, or fragments",
    );
  }
  return parsed.origin;
}

/**
 * Resolves the only API origin a native client may call. Staging is pinned to
 * the isolated Railway backend so an acceptance build cannot silently reach
 * production.
 */
export function getApiBase(
  environment: PublicEnvironment = process.env,
): string {
  const raw = environment.EXPO_PUBLIC_API_ORIGIN;
  if (!raw) {
    throw new Error("API configuration blocked: EXPO_PUBLIC_API_ORIGIN is required");
  }
  const origin = normalizeOrigin(raw);
  if (
    environment.EXPO_PUBLIC_APP_ENV === "staging" &&
    origin !== STAGING_ORIGIN
  ) {
    throw new Error(
      "Staging release blocked: API origin is not the reviewed staging backend",
    );
  }
  return origin;
}
