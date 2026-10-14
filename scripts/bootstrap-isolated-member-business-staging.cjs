/*
 * One-purpose bootstrap for a disposable Railway staging database.
 *
 * This file exists only on the temporary
 * chore/member-business-staging-bootstrap-20261014 branch. It must never be
 * merged into a product branch. It applies the tracked Drizzle schema and the
 * reviewed member-business source-only migration to the isolated staging
 * DATABASE_URL, then remains alive solely so Railway records successful logs.
 */
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the isolated staging bootstrap.");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  console.log("[isolated-staging-bootstrap] applying tracked Drizzle schema");
  execFileSync(
    "pnpm",
    ["--filter", "@workspace/db", "run", "push-force"],
    { cwd: root, stdio: "inherit", env: process.env },
  );

  const migrationPath = path.join(
    root,
    "artifacts/api-server/migrations/20261014_member_business_owner_source_only.sql",
  );
  const sourceOnlyMigration = readFileSync(migrationPath, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("[isolated-staging-bootstrap] applying reviewed member-business source-only migration");
    await client.query(sourceOnlyMigration);
  } finally {
    await client.end();
  }

  console.log("[isolated-staging-bootstrap] complete; no application traffic is served by this temporary service");
  // Keep the temporary service alive long enough to retain an auditable success
  // log. It is deleted immediately after the API staging service is healthy.
  setInterval(() => undefined, 60_000);
}

main().catch((error) => {
  console.error("[isolated-staging-bootstrap] failed", error);
  process.exit(1);
});
