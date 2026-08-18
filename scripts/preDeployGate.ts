import { Client } from "pg";

const requiredEnvironment = [
  "DATABASE_URL",
  "APP_RELEASE_SHA",
  "API_PUBLIC_URL",
  "APP_ORIGIN",
];

const requiredColumns = [
  ["reviews", "author_id"],
  ["business_identity", "age_restriction_reasons"],
  ["business_identity", "environment_tags"],
  ["business_identity", "amenity_tags"],
] as const;

function requireEnvironment() {
  const missing = requiredEnvironment.filter((name) => !process.env[name]);
  if (missing.length)
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
}

async function main() {
  requireEnvironment();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
  await client.connect();
  try {
    const result = await client.query<{
      table_name: string;
      column_name: string;
    }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND (table_name, column_name) IN (${requiredColumns
         .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
         .join(", ")})`,
      requiredColumns.flatMap(([table, column]) => [table, column]),
    );
    const present = new Set(
      result.rows.map((row) => `${row.table_name}.${row.column_name}`),
    );
    const missing = requiredColumns
      .map(([table, column]) => `${table}.${column}`)
      .filter((name) => !present.has(name));
    if (missing.length)
      throw new Error(
        `Database schema is not release-compatible. Missing: ${missing.join(", ")}`,
      );

    // Smoke-test the formerly-failing production query shapes before this
    // release can replace the last known working deployment.
    await client.query(
      "SELECT count(*)::int AS cnt FROM reviews WHERE author_id IS NULL OR author_id IS NOT NULL",
    );
    await client.query(
      "SELECT audience_type, age_restriction_reasons, environment_tags, amenity_tags FROM business_identity LIMIT 1",
    );

    console.log(
      JSON.stringify({
        event: "predeploy_gate_passed",
        release: process.env.APP_RELEASE_SHA,
      }),
    );
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "predeploy_gate_failed",
      release: process.env.APP_RELEASE_SHA ?? "unknown",
      error: {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
    }),
  );
  process.exitCode = 1;
});
