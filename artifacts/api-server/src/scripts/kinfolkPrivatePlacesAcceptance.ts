import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { Client } from "pg";
import request from "supertest";

const POSTGRES_BIN = "/usr/lib/postgresql/16/bin";
const root = mkdtempSync(join(tmpdir(), "mwm-private-places-"));
const dataDirectory = join(root, "postgres");
const socketDirectory = join(root, "socket");
const port = 56500 + (process.pid % 400);
const databaseUrl = `postgres://mwm_private_places@127.0.0.1:${port}/postgres`;
let client: Client | undefined;
let pool: { end(): Promise<void> } | undefined;

function runPostgres(...args: string[]) {
  execFileSync(join(POSTGRES_BIN, args.shift()!), args, { stdio: "ignore" });
}

async function main() {
  try {
    runPostgres("initdb", "-D", dataDirectory, "--username=mwm_private_places", "--auth=trust", "--no-locale", "--encoding=UTF8");
    mkdirSync(socketDirectory);
    runPostgres("pg_ctl", "-D", dataDirectory, "-l", join(root, "postgres.log"), "-o", `-F -p ${port} -h 127.0.0.1 -k ${socketDirectory}`, "-w", "start");
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (id VARCHAR(100) PRIMARY KEY);
      CREATE TABLE kinfolk_private_memories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR(100) NOT NULL REFERENCES users(id));
      INSERT INTO users (id) VALUES ('synthetic-private-place-owner'), ('synthetic-private-place-other');
    `);

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.KINFOLK_PRIVATE_PLACES_ENABLED = "true";
    process.env.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS = `v1:${Buffer.alloc(32, 29).toString("base64")}`;
    process.env.GOOGLE_MAPS_API_KEY = "synthetic-private-places-key";

    const { ensureKinfolkPrivatePlacesSchema } = await import("../lib/startup-migrations");
    await ensureKinfolkPrivatePlacesSchema(() => undefined, (message) => { throw new Error(message); });
    await ensureKinfolkPrivatePlacesSchema(() => undefined, (message) => { throw new Error(message); });
    const { pool: sharedPool } = await import("@workspace/db");
    pool = sharedPool;

    let geocodeCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      geocodeCalls += 1;
      return new Response(JSON.stringify({
        status: "OK",
        results: [{
          formatted_address: "1000 Synthetic Avenue, Exampleville, PA 19199, USA",
          geometry: { location: { lat: 39.9526, lng: -75.1652 } },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    const { default: privatePlacesRouter } = await import("../routes/kinfolk-private-places");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const testRequest = req as unknown as {
        user?: { id: string };
        log?: { error: (...args: unknown[]) => void };
      };
      const owner = req.get("x-synthetic-member");
      if (owner) testRequest.user = { id: owner };
      testRequest.log = { error: () => undefined };
      next();
    });
    app.use("/api", privatePlacesRouter);
    const owner = "synthetic-private-place-owner";
    const other = "synthetic-private-place-other";
    const authed = (userId: string) => ({
      get: (path: string) => request(app).get(`/api${path}`).set("x-synthetic-member", userId),
      post: (path: string) => request(app).post(`/api${path}`).set("x-synthetic-member", userId),
      patch: (path: string) => request(app).patch(`/api${path}`).set("x-synthetic-member", userId),
      delete: (path: string) => request(app).delete(`/api${path}`).set("x-synthetic-member", userId),
    });

    assert.equal((await request(app).get("/api/kinfolk/private-places/status")).status, 401, "status remains authenticated");
    const status = await authed(owner).get("/kinfolk/private-places/status");
    assert.equal(status.status, 200);
    assert.equal(status.body.enabled, true);
    assert.equal(status.body.disclosureVersion, "private-places-google-geocoding-v1");

    const syntheticAddress = "1000 Synthetic Avenue, Exampleville, PA 19199";
    const declined = await authed(owner).post("/kinfolk/private-places").send({
      label: "Workshop",
      exactAddress: syntheticAddress,
      googleMapsGeocodingConsent: false,
      disclosureVersion: "private-places-google-geocoding-v1",
    });
    assert.equal(declined.status, 400, "missing disclosure acknowledgement is rejected");
    assert.equal(declined.body.code, "PRIVATE_PLACES_DISCLOSURE_REQUIRED");
    assert.equal(geocodeCalls, 0, "declined disclosure makes no Google call");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_places")).rows[0]?.count, 0);

    const created = await authed(owner).post("/kinfolk/private-places").send({
      label: "Workshop",
      exactAddress: syntheticAddress,
      googleMapsGeocodingConsent: true,
      disclosureVersion: "private-places-google-geocoding-v1",
    });
    assert.equal(created.status, 201, "explicit disclosure permits one controlled geocode");
    assert.equal(geocodeCalls, 1, "exactly one geocode call occurs after consent");
    assert.equal(created.body.place.label, "Workshop");
    assert.equal(JSON.stringify(created.body).includes(syntheticAddress), false, "safe response omits exact address");
    assert.equal(JSON.stringify(created.body).includes("39.9526"), false, "safe response omits coordinates");
    const placeId = created.body.place.id as string;

    const stored = await client.query<{ encrypted_payload: string }>("SELECT encrypted_payload FROM kinfolk_private_places WHERE id = $1", [placeId]);
    assert.equal(stored.rows.length, 1);
    assert.equal(stored.rows[0]?.encrypted_payload.includes(syntheticAddress), false, "ciphertext never contains the address");
    assert.equal((await authed(other).get("/kinfolk/private-places")).body.places.length, 0, "second synthetic member sees no owner places");
    assert.equal((await authed(other).patch(`/kinfolk/private-places/${placeId}/active`).send({ isActive: false })).status, 404, "cross-member update is rejected");

    assert.equal((await authed(owner).patch(`/kinfolk/private-places/${placeId}/active`).send({ isActive: false })).status, 200, "owner can pause");
    assert.equal((await authed(owner).post(`/kinfolk/private-places/${placeId}/nearby`).send({ radiusMiles: 5 })).status, 404, "paused place cannot power nearby search");
    assert.equal((await authed(owner).patch(`/kinfolk/private-places/${placeId}/active`).send({ isActive: true })).status, 200, "owner can resume");
    assert.equal((await authed(other).delete(`/kinfolk/private-places/${placeId}`)).status, 404, "cross-member delete is rejected");
    assert.equal((await authed(owner).delete(`/kinfolk/private-places/${placeId}`)).status, 200, "owner can delete");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_places")).rows[0]?.count, 0, "delete removes ciphertext row");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_place_events")).rows[0]?.count, 0, "delete cascades event history");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_memories")).rows[0]?.count, 0, "Private Places creates no Kinfolk memory");

    process.env.KINFOLK_PRIVATE_PLACES_ENABLED = "false";
    const disabled = await authed(owner).get("/kinfolk/private-places");
    assert.equal(disabled.status, 403, "feature-off state fails closed");
    assert.equal(disabled.body.code, "PRIVATE_PLACES_DISABLED");
    globalThis.fetch = originalFetch;

    console.log(JSON.stringify({
      status: "passed",
      environment: "disposable-local-postgresql",
      syntheticMembers: 2,
      checks: [
        "auth and owner isolation",
        "declined disclosure causes no Google call",
        "accepted disclosure causes one synthetic geocode and encrypted persistence",
        "safe responses omit address and coordinates",
        "pause/resume/delete lifecycle and cascade cleanup",
        "active-only nearby gate",
        "no Kinfolk memory write",
        "feature-off fail-closed behavior",
      ],
    }));
  } finally {
    await pool?.end().catch(() => undefined);
    await client?.end().catch(() => undefined);
    try { runPostgres("pg_ctl", "-D", dataDirectory, "-m", "immediate", "-w", "stop"); } catch { /* no-op */ }
    rmSync(root, { recursive: true, force: true });
  }
}

await main();
