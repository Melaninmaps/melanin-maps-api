import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { pool } from "@workspace/db";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredTables = [
  "compound_tag_tokens",
  "community_place_aliases",
  "kinfolk_entities",
  "kinfolk_entity_aliases",
  "kinfolk_entity_source_links",
  "kinfolk_source_records",
  "user_preferences",
];

function stop(message: string): never {
  console.error(`Release DB gates not run: ${message}`);
  process.exit(1);
}

function isClearlyDisposable(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const database = url.pathname.replace(/^\//, "").toLowerCase();
  const localHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const testHost = host.endsWith(".test") || host.includes("test") || host.includes("ci");
  return (localHost || testHost) && /(?:^|[_-])(?:test|ci)(?:[_-]|$)/.test(database);
}

async function verifyDisposableSchema(): Promise<void> {
  const tables = await pool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [requiredTables],
  );
  const present = new Set(tables.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !present.has(table));
  if (missing.length > 0) {
    stop(`the disposable database is missing required initialized tables: ${missing.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) stop("DATABASE_URL is required and must point to an initialized disposable test database.");
  if (process.env.MWM_RELEASE_TEST_DB !== "1") {
    stop("MWM_RELEASE_TEST_DB=1 is required to confirm an intentionally disposable database.");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    stop("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }
  if (!isClearlyDisposable(databaseUrl)) {
    stop("DATABASE_URL must use a localhost/test/CI host and a database name explicitly marked test or ci.");
  }

  try {
    await verifyDisposableSchema();
  } finally {
    await pool.end().catch(() => undefined);
  }

  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "vitest", "run", "--config", "vitest.release-db-gates.config.ts"],
    { cwd: workspace, env: process.env, stdio: "inherit" },
  );
  process.exit(result.status ?? 1);
}

void main();
