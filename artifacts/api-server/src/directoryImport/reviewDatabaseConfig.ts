export interface DirectoryReviewEnvironment {
  DIRECTORY_REVIEW_ENABLED?: string;
  DIRECTORY_REVIEW_DATABASE_URL?: string;
  DIRECTORY_REVIEW_SIGNING_SECRET?: string;
  DATABASE_URL?: string;
}

export interface DirectoryReviewDatabaseConfig {
  reviewDatabaseUrl: string;
  reviewDatabaseIdentity: string;
}

function canonicalIdentity(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is invalid.`);
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${label} must use PostgreSQL.`);
  }
  if (!url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error(`${label} must identify a database.`);
  }
  if (url.username || url.password || url.hash) {
    // Credentials stay in the connection string but are never part of the
    // equality identity. A fragment has no PostgreSQL meaning and is rejected.
    if (url.hash) throw new Error(`${label} cannot contain a fragment.`);
  }
  const databaseName = decodeURIComponent(url.pathname.slice(1)).trim();
  if (!databaseName) throw new Error(`${label} must identify a database.`);
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const port = url.port || "5432";
  return `${host}:${port}/${databaseName.toLowerCase()}`;
}

/**
 * Enables directory review only when an explicitly separate PostgreSQL
 * database is configured. This intentionally does not create a pool or grant
 * access; platform database roles remain the enforcement boundary.
 */
export function resolveIsolatedDirectoryReviewConfig(
  environment: DirectoryReviewEnvironment,
): DirectoryReviewDatabaseConfig | null {
  if (environment.DIRECTORY_REVIEW_ENABLED !== "1") return null;
  if (!environment.DIRECTORY_REVIEW_DATABASE_URL) {
    throw new Error("DIRECTORY_REVIEW_DATABASE_URL is required when directory review is enabled.");
  }
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to verify directory review isolation.");
  }
  if ((environment.DIRECTORY_REVIEW_SIGNING_SECRET?.length ?? 0) < 32) {
    throw new Error("DIRECTORY_REVIEW_SIGNING_SECRET must contain at least 32 characters when directory review is enabled.");
  }

  const productionIdentity = canonicalIdentity(
    environment.DATABASE_URL,
    "DATABASE_URL",
  );
  const reviewIdentity = canonicalIdentity(
    environment.DIRECTORY_REVIEW_DATABASE_URL,
    "DIRECTORY_REVIEW_DATABASE_URL",
  );
  if (productionIdentity === reviewIdentity) {
    throw new Error("DIRECTORY_REVIEW_DATABASE_URL must identify a database separate from DATABASE_URL.");
  }
  return {
    reviewDatabaseUrl: environment.DIRECTORY_REVIEW_DATABASE_URL,
    reviewDatabaseIdentity: reviewIdentity,
  };
}
