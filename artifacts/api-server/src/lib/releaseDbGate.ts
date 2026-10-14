export interface ReleaseDbGateEnvironment {
  RUN_RELEASE_DB_GATE?: string;
  RELEASE_GATE_DATABASE_URL?: string;
  DATABASE_URL?: string;
  CI?: string;
}

/**
 * The release database gate is intentionally limited to the two DB-backed
 * Kinfolk release suites. Additions require an explicit review of the isolated
 * release database workflow rather than being picked up by ordinary test runs.
 */
export const RELEASE_DB_GATE_TEST_FILES = [
  "src/kinfolk/__tests__/alias-release-gate.test.ts",
  "src/kinfolk/__tests__/cultural-context-release-gate.test.ts",
] as const;

// These are conventional ephemeral PostgreSQL service names, and are accepted
// only when the CI marker is exactly true. All other hostnames must be local or
// under the reserved .test TLD.
const CI_POSTGRES_SERVICE_HOSTS = new Set(["postgres", "postgresql", "db"]);

function isLoopbackHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") {
    return true;
  }

  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets.every((octet) => /^\d+$/.test(octet) && Number(octet) >= 0 && Number(octet) <= 255) &&
    Number(octets[0]) === 127
  );
}

function isAllowedReleaseDatabaseHost(hostname: string, ci: string | undefined): boolean {
  if (isLoopbackHost(hostname) || hostname.endsWith(".test")) {
    return true;
  }

  return ci === "true" && CI_POSTGRES_SERVICE_HOSTS.has(hostname);
}

/**
 * Validates an explicit release database URL without reading or changing
 * DATABASE_URL. This keeps the decision unit-testable and prevents ambient
 * application configuration from selecting the target database.
 */
export function resolveReleaseGateDatabaseUrl(
  environment: ReleaseDbGateEnvironment,
): string {
  if (environment.RUN_RELEASE_DB_GATE !== "1") {
    throw new Error("RUN_RELEASE_DB_GATE=1 is required to run the release database gate");
  }

  const releaseDatabaseUrl = environment.RELEASE_GATE_DATABASE_URL?.trim();
  if (!releaseDatabaseUrl) {
    throw new Error("RELEASE_GATE_DATABASE_URL is required; DATABASE_URL is never used by the release database gate");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(releaseDatabaseUrl);
  } catch {
    throw new Error("RELEASE_GATE_DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (parsedUrl.protocol !== "postgres:" && parsedUrl.protocol !== "postgresql:") {
    throw new Error("RELEASE_GATE_DATABASE_URL must use the postgres or postgresql protocol");
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!isAllowedReleaseDatabaseHost(hostname, environment.CI)) {
    throw new Error(
      "RELEASE_GATE_DATABASE_URL host must be loopback or end in .test; CI PostgreSQL service hosts require CI=true",
    );
  }

  return releaseDatabaseUrl;
}

/**
 * Copies only the validated, explicit release target into DATABASE_URL for a
 * child process or a migration script after its guard has passed.
 */
export function applyReleaseGateDatabaseUrl(
  environment: ReleaseDbGateEnvironment & { DATABASE_URL?: string },
): string {
  const releaseDatabaseUrl = resolveReleaseGateDatabaseUrl(environment);
  environment.DATABASE_URL = releaseDatabaseUrl;
  return releaseDatabaseUrl;
}
