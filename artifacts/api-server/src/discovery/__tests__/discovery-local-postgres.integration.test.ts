/**
 * Real PostgreSQL qualification for Discovery V1.
 *
 * This suite is deliberately opt-in: RUN_LOCAL_POSTGRES_INTEGRATION=1 starts a
 * new initdb cluster under the OS temp directory and never reads DATABASE_URL.
 * It cannot connect to staging, production, or a developer's persistent DB.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";
import type { NextFunction, Request, Response } from "express";

const localOnly = process.env.RUN_LOCAL_POSTGRES_INTEGRATION === "1";
const localDescribe = localOnly ? describe : describe.skip;
const { Pool } = pg;
let directory = "";
let localUrl = "";
let pool: pg.Pool;
let previousDatabaseUrl: string | undefined;
let express: typeof import("express");
let request: typeof import("supertest");
let ensureRequiredDiscoverySchema: typeof import("../../lib/startup-migrations").ensureRequiredDiscoverySchema;
let runDiscoveryRetentionSweep: typeof import("../discoveryRetention").runDiscoveryRetentionSweep;
let readPrivacySafeDiscoveryAggregates: typeof import("../postgresFlywheelRepository").readPrivacySafeDiscoveryAggregates;
let registerDiscoveryV1Routes: typeof import("../registerDiscoveryV1Routes").registerDiscoveryV1Routes;
let universalSearchRouter: typeof import("../../routes/universal-search").default;
let getSharedPool: typeof import("@workspace/db").getPool;

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

async function unusedPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve((address as { port: number }).port));
    });
  });
}

async function bootstrapBaseTables(): Promise<void> {
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await pool.query(`
    CREATE TABLE users (id varchar(100) PRIMARY KEY);
    CREATE TABLE businesses (
      id varchar(100) PRIMARY KEY, name text, category text, subcategory text,
      description text, city text, country text, latitude numeric, longitude numeric,
      source_url text, verified boolean DEFAULT true, state text,
      ownership_claim text, ownership_designations jsonb, price_range text
    );
    CREATE VIEW public_businesses AS SELECT * FROM businesses;
    CREATE TABLE search_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar(100),
      raw_query text NOT NULL, normalized_concept text, intent_type text,
      surface text, location_bucket text, result_count integer,
      match_types_returned text[], fallback_used boolean, created_at timestamptz DEFAULT now()
    );
    CREATE TABLE business_search_inquiries (
      id uuid PRIMARY KEY, searcher_user_id varchar(100), search_query text,
      city text, created_at timestamptz DEFAULT now()
    );
  `);
}

async function applyMigration(): Promise<void> {
  await ensureRequiredDiscoverySchema(pool);
}

beforeAll(async () => {
  if (!localOnly) return;
  directory = mkdtempSync(join(tmpdir(), "mwm-discovery-pg-"));
  const port = await unusedPort();
  run("initdb", ["-D", directory, "--no-locale", "--encoding=UTF8", "--auth=trust"]);
  run("pg_ctl", [
    "-D", directory,
    "-l", join(directory, "postgres.log"),
    "-o", `-F -p ${port} -h 127.0.0.1 -k ${directory}`,
    "-w", "start",
  ]);
  // The host is constructed here, never inherited from DATABASE_URL.
  localUrl = `postgresql://runner@127.0.0.1:${port}/postgres`;
  pool = new Pool({ connectionString: localUrl, connectionTimeoutMillis: 5_000 });
  await bootstrapBaseTables();
  // startup-migrations imports @workspace/db. Set its lazy singleton to the
  // isolated cluster before importing any application module.
  previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = localUrl;
  const [
    expressModule,
    supertestModule,
    startupMigrations,
    retention,
    flywheel,
    routes,
    universalSearch,
    dbModule,
  ] = await Promise.all([
    import("express"),
    import("supertest"),
    import("../../lib/startup-migrations"),
    import("../discoveryRetention"),
    import("../postgresFlywheelRepository"),
    import("../registerDiscoveryV1Routes"),
    import("../../routes/universal-search"),
    import("@workspace/db"),
  ]);
  express = (expressModule as unknown as { default: typeof express }).default;
  request = (supertestModule as unknown as { default: typeof request }).default;
  ensureRequiredDiscoverySchema = startupMigrations.ensureRequiredDiscoverySchema;
  runDiscoveryRetentionSweep = retention.runDiscoveryRetentionSweep;
  readPrivacySafeDiscoveryAggregates = flywheel.readPrivacySafeDiscoveryAggregates;
  registerDiscoveryV1Routes = routes.registerDiscoveryV1Routes;
  universalSearchRouter = (universalSearch as unknown as { default: typeof universalSearchRouter }).default;
  getSharedPool = dbModule.getPool;
}, 60_000);

afterAll(async () => {
  if (!localOnly) return;
  await pool?.end();
  // universal-search uses @workspace/db's lazy singleton. It is pointed at
  // this fixture, so drain it before stopping the temporary postgres server.
  await getSharedPool?.().end().catch(() => undefined);
  if (directory) {
    spawnSync("pg_ctl", ["-D", directory, "-m", "immediate", "-w", "stop"], { encoding: "utf8" });
    rmSync(directory, { recursive: true, force: true });
  }
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
}, 30_000);

localDescribe("Discovery V1 local ephemeral PostgreSQL qualification", () => {
  it("applies the authoritative migration twice, preserves data, and verifies the catalog", async () => {
    await pool.query("INSERT INTO businesses (id,name,city) VALUES ('business-1','Preserved','Atlanta')");
    await applyMigration();
    await applyMigration();
    // Reconnect through two actual postgres restarts; the migration must remain
    // idempotent and the pre-existing business must survive both boots.
    await pool.end();
    run("pg_ctl", ["-D", directory, "-l", join(directory, "postgres.log"), "-m", "fast", "-w", "restart"]);
    pool = new Pool({ connectionString: localUrl, connectionTimeoutMillis: 5_000 });
    await applyMigration();
    await pool.end();
    run("pg_ctl", ["-D", directory, "-l", join(directory, "postgres.log"), "-m", "fast", "-w", "restart"]);
    pool = new Pool({ connectionString: localUrl, connectionTimeoutMillis: 5_000 });
    await applyMigration();
    await expect(pool.query("SELECT name FROM businesses WHERE id='business-1'"))
      .resolves.toMatchObject({ rows: [{ name: "Preserved" }] });
  });

  it("migrates a compatible partial schema and fails closed for an incompatible schema", async () => {
    // A missing derived Discovery table is a compatible partial state: the
    // authoritative migration recreates it and the full catalog passes.
    await pool.query("DROP TABLE discovery_retention_jobs");
    await expect(applyMigration()).resolves.toBeUndefined();

    await pool.query("CREATE SCHEMA incompatible");
    await pool.query("CREATE TABLE incompatible.discovery_events_v1 (event_id text PRIMARY KEY)");
    const isolated = new Pool({ connectionString: localUrl, options: "-c search_path=incompatible" });
    // A wrong existing ledger must not be silently accepted.
    await expect(ensureRequiredDiscoverySchema(isolated)).rejects.toThrow();
    await isolated.end();
  });

  it("keeps consent withdrawal atomic with concurrent event insertion", async () => {
    await pool.query("INSERT INTO users (id) VALUES ('member-1') ON CONFLICT DO NOTHING");
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => { req.user = { id: "member-1", role: "member" } as any; next(); });
    registerDiscoveryV1Routes(app, pool);
    await request(app).put("/api/discovery/v1/preferences").send({ searchImprovement: true, consentVersion: "v1" }).expect(200);
    const event = {
      schemaVersion: "1", eventId: "10000000-0000-4000-8000-000000000001", idempotencyKey: "local-race",
      eventName: "result_opened", consent: { searchImprovement: true, version: "v1" },
      surface: "map", platform: "ios", entryPoint: "result_card", appVersion: "106",
    };
    await Promise.all([
      request(app).post("/api/discovery/v1/events").send(event),
      request(app).put("/api/discovery/v1/preferences").send({ searchImprovement: false, consentVersion: "v1" }),
    ]);
    await expect(pool.query("SELECT * FROM discovery_events_v1 WHERE member_id='member-1'"))
      .resolves.toMatchObject({ rows: [] });
  });

  it("covers Supertest authorization, consent, retention restart/idle cleanup, and k-anonymous aggregates", async () => {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => { req.user = { id: "member-1", role: "member" } as any; next(); });
    registerDiscoveryV1Routes(app, pool);
    await request(app).get("/api/discovery/v1/aggregates?from=2026-01-01&to=2026-01-02").expect(403);
    await request(app).post("/api/discovery/v1/search").send({
      schemaVersion: "1", requestId: "10000000-0000-4000-8000-000000000004",
      surface: "map", platform: "ios", entryPoint: "find_a_place", query: "coffee",
      location: { source: "typed", city: "Atlanta", stateRegion: "GA" }, filters: {},
      consent: { personalizedSuggestions: false, searchImprovement: false, preciseLocation: false },
    }).expect(200);
    await request(app).post("/api/discovery/v1/events").send({
      schemaVersion: "1", eventId: "10000000-0000-4000-8000-000000000002", idempotencyKey: "no-consent",
      eventName: "result_opened", consent: { searchImprovement: true, version: "v1" },
      surface: "map", platform: "ios", entryPoint: "result_card", appVersion: "106",
    }).expect(202);
    await request(app).put("/api/discovery/v1/preferences")
      .send({ searchImprovement: true, consentVersion: "v1" })
      .expect(200);
    await pool.query(`INSERT INTO discovery_events_v1 (event_id,idempotency_key,member_id,event_name,consent_version,surface,platform,entry_point,app_version,retention_expires_at)
      VALUES ('10000000-0000-4000-8000-000000000003','expired','member-1','result_opened','v1','map','ios','result_card','106',NOW()-interval '1 second')`);
    expect(await runDiscoveryRetentionSweep(pool)).toBeGreaterThanOrEqual(1);
    expect(await runDiscoveryRetentionSweep(pool)).toBe(0);
    await pool.query(`INSERT INTO discovery_events_v1 (event_id,idempotency_key,member_id,event_name,consent_version,surface,platform,entry_point,app_version)
      SELECT gen_random_uuid(), 'aggregate-' || n, 'member-1','result_opened','v1','map','ios','result_card','106' FROM generate_series(1,5) n`);
    expect(await readPrivacySafeDiscoveryAggregates(pool, "2000-01-01", "2100-01-01")).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "result_opened", count: 5 })]),
    );
  });

  it("keeps Discovery V1 Smart Search functional without legacy raw-query persistence", async () => {
    const app = express();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).isAuthenticated = () => true;
      req.user = { id: "member-1" } as any;
      next();
    });
    app.use("/api", universalSearchRouter);
    const safe = "diabetes";
    const optedOut = "coffee";
    await request(app).get("/api/search/universal")
      .query({ q: safe, city: "Atlanta", surface: "smart_search", privacy_mode: "discovery_v1" })
      .expect(200);
    await request(app).get("/api/search/universal")
      .query({ q: optedOut, city: "Atlanta", surface: "smart_search", privacy_mode: "discovery_v1" })
      .expect(200);
    // logSearchEvent is deliberately fire-and-forget; allow its event-loop turn
    // before proving neither legacy table received the safe-mode requests.
    await new Promise((resolve) => setTimeout(resolve, 25));
    await expect(pool.query("SELECT raw_query FROM search_events")).resolves.toMatchObject({ rows: [] });
    await expect(pool.query("SELECT search_query FROM business_search_inquiries")).resolves.toMatchObject({ rows: [] });

    // Only the exact pair is allowed to disable legacy telemetry. Invalid or
    // missing privacy_mode keeps ordinary (non-sensitive) legacy logging on.
    await request(app).get("/api/search/universal")
      .query({ q: optedOut, city: "Atlanta", surface: "smart_search", privacy_mode: "invalid" })
      .expect(200);
    await request(app).get("/api/search/universal")
      .query({ q: optedOut, city: "Atlanta", surface: "smart_search" })
      .expect(200);
    await new Promise((resolve) => setTimeout(resolve, 25));
    const events = await pool.query<{ raw_query: string }>("SELECT raw_query FROM search_events ORDER BY created_at");
    const inquiries = await pool.query<{ search_query: string }>("SELECT search_query FROM business_search_inquiries ORDER BY created_at");
    expect(events.rows.map((row) => row.raw_query)).toEqual(["coffee", "coffee"]);
    expect(inquiries.rows.map((row) => row.search_query)).toEqual(["coffee", "coffee"]);
    expect([...events.rows.map((row) => row.raw_query), ...inquiries.rows.map((row) => row.search_query)])
      .not.toContain(safe);
  });

  it("captures representative local EXPLAIN ANALYZE BUFFERS evidence", async () => {
    const explain = await pool.query(`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM businesses
      WHERE lower(city) = 'atlanta' AND replace(coalesce(postal_code,''),' ','') = '30303'`);
    const plan = explain.rows.map((row) => Object.values(row).join(" ")).join("\n");
    console.info(`[local-postgres-explain]\n${plan}`);
    expect(plan).toMatch(/Buffers:/);
  });
});