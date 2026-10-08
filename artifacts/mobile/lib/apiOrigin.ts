export const STAGING_ORIGIN = "https://mwm-staging.35.196.78.19.nip.io";

function normalizeOrigin(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("API configuration blocked: EXPO_PUBLIC_API_ORIGIN must be a valid HTTPS origin");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("API configuration blocked: API origin cannot contain credentials, paths, query parameters, or fragments");
  }
  return parsed.origin;
}

export function getApiBaseForEnvironment(originValue: string | undefined, appEnvironment: string | undefined): string {
  if (!originValue) {
    throw new Error("API configuration blocked: EXPO_PUBLIC_API_ORIGIN is required");
  }
  const origin = normalizeOrigin(originValue);
  if (appEnvironment === "staging" && origin !== STAGING_ORIGIN) {
    throw new Error("Staging release blocked: API origin is not the reviewed staging backend");
  }
  return origin;
}

export function getApiBase(): string {
  return getApiBaseForEnvironment(process.env.EXPO_PUBLIC_API_ORIGIN, process.env.EXPO_PUBLIC_APP_ENV);
}

export function assertBuild106StagingApiOrigin(): string {
  const origin = getApiBase();
  if (origin !== STAGING_ORIGIN) {
    throw new Error("Build 106 blocked: staging API origin mismatch");
  }
  return origin;
}
