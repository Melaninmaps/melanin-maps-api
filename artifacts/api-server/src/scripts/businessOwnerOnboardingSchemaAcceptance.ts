import assert from "node:assert/strict";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client } from "pg";

const execFile = promisify(execFileCallback);
const POSTGRES_BIN = "/usr/lib/postgresql/16/bin";
const port = 55900 + Math.floor(Math.random() * 80);
const root = await mkdtemp(join(tmpdir(), "mwm-owner-onboarding-"));
const dataDir = join(root, "data");
const socketDir = join(root, "socket");
let server: ReturnType<typeof spawn> | undefined;
let migrationPool: { end(): Promise<void> } | undefined;

async function waitForDatabase(): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const client = new Client({ host: socketDir, port, user: "ubuntu", database: "postgres" });
    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error("Disposable PostgreSQL did not become ready");
}

try {
  await mkdir(socketDir, { recursive: true });
  await execFile(join(POSTGRES_BIN, "initdb"), ["-D", dataDir, "-A", "trust", "-U", "ubuntu"]);
  server = spawn(join(POSTGRES_BIN, "postgres"), ["-D", dataDir, "-k", socketDir, "-p", String(port)], {
    stdio: "ignore",
  });
  await waitForDatabase();

  const client = new Client({ host: socketDir, port, user: "ubuntu", database: "postgres" });
  await client.connect();
  await client.query(`
    CREATE TABLE users (id VARCHAR(255) PRIMARY KEY);
    CREATE TABLE businesses (
      id VARCHAR(255) PRIMARY KEY,
      weekly_schedule JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE business_owner_links (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      business_id VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      revoked_at TIMESTAMPTZ
    );
    INSERT INTO users (id) VALUES ('owner-1');
    INSERT INTO businesses (id, weekly_schedule) VALUES ('business-1', '{"mon":{"open":"09:00","close":"17:00"}}'::jsonb);
    INSERT INTO business_owner_links (id, user_id, business_id, role, status) VALUES ('link-1', 'owner-1', 'business-1', 'owner', 'approved');
  `);

  process.env.DATABASE_URL = `postgresql://ubuntu@localhost/postgres?host=${encodeURIComponent(socketDir)}&port=${port}`;
  const { ensureBusinessOwnerOnboardingSchema } = await import("../lib/startup-migrations");
  const { pool } = await import("@workspace/db");
  migrationPool = pool;

  await ensureBusinessOwnerOnboardingSchema();
  await ensureBusinessOwnerOnboardingSchema();
  const before = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM business_owner_onboarding");
  assert.equal(before.rows[0]?.count, "0", "schema setup must not seed, publish, or create an owner record");

  await client.query(`
    INSERT INTO business_owner_onboarding (business_id, last_updated_by_user_id, identity_reviewed)
    VALUES ('business-1', 'owner-1', TRUE)
  `);
  const saved = await client.query<{ identity_reviewed: boolean; offerings: unknown; pricing: { model?: string } }>(
    "SELECT identity_reviewed, offerings, pricing FROM business_owner_onboarding WHERE business_id = 'business-1'",
  );
  assert.equal(saved.rows[0]?.identity_reviewed, true);
  assert.deepEqual(saved.rows[0]?.offerings, []);
  assert.equal(saved.rows[0]?.pricing?.model, "not_listed");

  console.log(JSON.stringify({
    status: "passed",
    proof: {
      namedLoop: "business_owner_onboarding_v1",
      apply: "passed",
      repeat: "passed",
      rowsAfterSchemaOnly: 0,
      ownerScopedDefaultState: "passed",
      productionConnection: false,
    },
  }));
  await client.end();
} finally {
  await migrationPool?.end().catch(() => undefined);
  if (server && !server.killed) {
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => server?.once("exit", () => resolve()));
  }
  await rm(root, { recursive: true, force: true });
}
