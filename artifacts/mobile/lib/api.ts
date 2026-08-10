// Canonical production API base — never changes.
// All build profiles (dev / preview / production) in eas.json already point here.
const PRODUCTION_BASE = "https://www.mappingwithmelanin.com";

export function getApiBase(): string {
  // Replit dev domain: only present during simulator testing against a local server.
  if (process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN}`;
  }
  // EXPO_PUBLIC_DOMAIN is set in eas.json for ALL build profiles.
  // Prefer it because eas.json values are baked in at build time and are reliable.
  // EXPO_PUBLIC_API_URL lives only in EAS Dashboard and may be stale — intentionally skipped.
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  // Hard fallback: guarantees OTA updates work even when neither env var is propagated.
  return PRODUCTION_BASE;
}
