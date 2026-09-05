export interface LocalDirectoryStagingEnvironment {
  DIRECTORY_IMPORT_LOCAL_STAGING?: string;
  DEPLOYMENT_TIER?: string;
  NODE_ENV?: string;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const STAGING_DATABASE_PATTERN = /^mwm_directory_staging(?:_[a-z0-9_]+)?$/;

export function assertLocalDirectoryStagingDatabase(
  databaseUrl: string | undefined,
  environment: LocalDirectoryStagingEnvironment,
): URL {
  if (environment.DIRECTORY_IMPORT_LOCAL_STAGING !== "1") {
    throw new Error("DIRECTORY_IMPORT_LOCAL_STAGING=1 is required for review-only directory staging.");
  }
  if (environment.DEPLOYMENT_TIER !== "local_staging") {
    throw new Error("DEPLOYMENT_TIER=local_staging is required for review-only directory staging.");
  }
  if (environment.NODE_ENV === "production") {
    throw new Error("Directory staging is prohibited when NODE_ENV=production.");
  }
  if (!databaseUrl) throw new Error("DATABASE_URL is required for --apply.");

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol.");
  }
  if ([...parsed.searchParams.keys()].length > 0 || parsed.hash) {
    throw new Error("Directory staging DATABASE_URL cannot contain query parameters or fragments.");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("Directory staging DATABASE_URL must use a loopback PostgreSQL host.");
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!STAGING_DATABASE_PATTERN.test(databaseName)) {
    throw new Error("Directory staging database name must begin with mwm_directory_staging.");
  }
  return parsed;
}

export function assertLocalDirectoryStagingFromProcess(databaseUrl = process.env.DATABASE_URL): URL {
  return assertLocalDirectoryStagingDatabase(databaseUrl, process.env);
}
