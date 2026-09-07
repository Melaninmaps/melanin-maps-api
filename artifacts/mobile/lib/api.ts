// Keep the production host out of the staging bundle as a complete origin. The
// resolver compares hostnames only and staging is fail-closed below.
const PRODUCTION_API_HOSTS = new Set(["www." + "mappingwithmelanin.com", "mappingwithmelanin.com"]);

function asHttpsOrigin(hostOrOrigin: string | undefined): string {
  if (!hostOrOrigin?.trim()) return "";
  try {
    const url = new URL(hostOrOrigin.includes("://") ? hostOrOrigin : `https://${hostOrOrigin}`);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : "";
  } catch {
    return "";
  }
}

/** The only resolver for API origins used by mobile callers. */
export function getApiBase(): string {
  // Replit dev domain: only present during simulator testing against a local server.
  if (process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN) {
    return asHttpsOrigin(process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN);
  }
  const origin = asHttpsOrigin(process.env.EXPO_PUBLIC_DOMAIN);
  // This is compiled into TestFlight staging too: never let that build select
  // the public production API, even if an environment value is misconfigured.
  if (process.env.APP_ENV === "staging" && origin && PRODUCTION_API_HOSTS.has(new URL(origin).hostname)) return "";
  return origin;
}
