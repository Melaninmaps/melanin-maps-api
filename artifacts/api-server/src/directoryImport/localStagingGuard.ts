export interface DirectoryReviewEnvironment {
  DIRECTORY_IMPORT_REVIEW_ENABLED?: string;
  DIRECTORY_IMPORT_LOCAL_STAGING?: string;
  DEPLOYMENT_TIER?: string;
  NODE_ENV?: string;
  DATABASE_URL?: string;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const STAGING_DATABASE_PATTERN = /^mwm_directory_staging(?:_[a-z0-9_]+)?$/;

export function assertDirectoryReviewLocalStaging(environment: DirectoryReviewEnvironment): boolean {
  if (environment.DIRECTORY_IMPORT_REVIEW_ENABLED !== "true") return false;
  if (environment.DIRECTORY_IMPORT_LOCAL_STAGING !== "1") {
    throw new Error("Directory review requires DIRECTORY_IMPORT_LOCAL_STAGING=1.");
  }
  if (environment.DEPLOYMENT_TIER !== "local_staging") {
    throw new Error("Directory review requires DEPLOYMENT_TIER=local_staging.");
  }
  if (environment.NODE_ENV === "production") {
    throw new Error("Directory review cannot run when NODE_ENV=production.");
  }
  if (!environment.DATABASE_URL) throw new Error("Directory review requires DATABASE_URL.");

  let parsed: URL;
  try {
    parsed = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error("Directory review DATABASE_URL is invalid.");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Directory review requires a PostgreSQL DATABASE_URL.");
  }
  if ([...parsed.searchParams.keys()].length > 0 || parsed.hash) {
    throw new Error("Directory review DATABASE_URL cannot contain query parameters or fragments.");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("Directory review requires a loopback PostgreSQL host.");
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!STAGING_DATABASE_PATTERN.test(databaseName)) {
    throw new Error("Directory review database name must begin with mwm_directory_staging.");
  }
  return true;
}
