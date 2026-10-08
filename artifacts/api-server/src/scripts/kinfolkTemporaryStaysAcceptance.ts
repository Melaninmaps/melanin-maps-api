import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { Client } from "pg";
import request from "supertest";

const POSTGRES_BIN = "/usr/lib/postgresql/16/bin";
const root = mkdtempSync(join(tmpdir(), "mwm-temporary-stays-"));
const dataDirectory = join(root, "postgres");
const socketDirectory = join(root, "socket");
const port = 56900 + (process.pid % 400);
const databaseUrl = `postgres://mwm_temporary_stays@127.0.0.1:${port}/postgres`;
let client: Client | undefined;
let sharedPool: { end(): Promise<void> } | undefined;

function runPostgres(...args: string[]) {
  execFileSync(join(POSTGRES_BIN, args.shift()!), args, { stdio: "ignore" });
}

async function main() {
  try {
    runPostgres("initdb", "-D", dataDirectory, "--username=mwm_temporary_stays", "--auth=trust", "--no-locale", "--encoding=UTF8");
    mkdirSync(socketDirectory);
    runPostgres("pg_ctl", "-D", dataDirectory, "-l", join(root, "postgres.log"), "-o", `-F -p ${port} -h 127.0.0.1 -k ${socketDirectory}`, "-w", "start");
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (id VARCHAR(100) PRIMARY KEY);
      CREATE TABLE kinfolk_private_memories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR(100) NOT NULL REFERENCES users(id));
      INSERT INTO users (id) VALUES ('synthetic-stay-owner'), ('synthetic-stay-other');
    `);

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.KINFOLK_PRIVATE_PLACES_ENABLED = "true";
    process.env.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS = `v1:${Buffer.alloc(32, 43).toString("base64")}`;
    process.env.GOOGLE_MAPS_API_KEY = "synthetic-temporary-stays-key";

    const { ensureKinfolkTemporaryStaysSchema } = await import("../lib/startup-migrations");
    await ensureKinfolkTemporaryStaysSchema(() => undefined, (message) => { throw new Error(message); });
    await ensureKinfolkTemporaryStaysSchema(() => undefined, (message) => { throw new Error(message); });
    const { pool } = await import("@workspace/db");
    sharedPool = pool;

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

    const { default: temporaryStaysRouter } = await import("../routes/kinfolk-temporary-stays");
    const { sealTemporaryStay } = await import("../kinfolk/temporary-stays-policy");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const testRequest = req as unknown as { user?: { id: string } };
      const value = req.get("x-synthetic-member");
      if (value) testRequest.user = { id: value };
      next();
    });
    app.use("/api", temporaryStaysRouter);
    const owner = "synthetic-stay-owner";
    const other = "synthetic-stay-other";
    const authed = (userId: string) => ({
      get: (path: string) => request(app).get(`/api${path}`).set("x-synthetic-member", userId),
      post: (path: string) => request(app).post(`/api${path}`).set("x-synthetic-member", userId),
      patch: (path: string) => request(app).patch(`/api${path}`).set("x-synthetic-member", userId),
      put: (path: string) => request(app).put(`/api${path}`).set("x-synthetic-member", userId),
      delete: (path: string) => request(app).delete(`/api${path}`).set("x-synthetic-member", userId),
    });

    assert.equal((await request(app).get("/api/kinfolk/temporary-stays/status")).status, 401, "status requires authentication");
    const status = await authed(owner).get("/kinfolk/temporary-stays/status");
    assert.equal(status.status, 200);
    assert.equal(status.body.enabled, true);
    assert.equal(status.body.retention.postDepartureGraceDays, 7);
    assert.equal(status.body.retention.departureDateRequired, true);

    const syntheticAddress = "1000 Synthetic Avenue, Exampleville, PA 19199";
    const declined = await authed(owner).post("/kinfolk/temporary-stays").send({
      label: "Conference hotel", exactAddress: syntheticAddress, arrivalDate: "2035-10-10", departureDate: "2035-10-17",
      googleMapsGeocodingConsent: false, disclosureVersion: "private-places-google-geocoding-v1",
    });
    assert.equal(declined.status, 400, "missing disclosure is rejected");
    assert.equal(declined.body.code, "PRIVATE_PLACES_DISCLOSURE_REQUIRED");
    assert.equal(geocodeCalls, 0, "declined disclosure makes no Google call");

    const created = await authed(owner).post("/kinfolk/temporary-stays").send({
      label: "Conference hotel", exactAddress: syntheticAddress, arrivalDate: "2035-10-10", departureDate: "2035-10-17",
      googleMapsGeocodingConsent: true, disclosureVersion: "private-places-google-geocoding-v1",
    });
    assert.equal(created.status, 201, "accepted disclosure creates encrypted stay");
    assert.equal(geocodeCalls, 1, "one geocode occurs after consent");
    assert.equal(JSON.stringify(created.body).includes(syntheticAddress), false, "response omits address");
    assert.equal(JSON.stringify(created.body).includes("39.9526"), false, "response omits coordinates");
    const stayId = String(created.body.stay.id);
    assert.equal(created.body.stay.departureDate, "2035-10-17");

    const edited = await authed(owner).put(`/kinfolk/temporary-stays/${stayId}`).send({
      label: "Edited conference hotel", exactAddress: syntheticAddress, arrivalDate: "2035-10-10", departureDate: "2035-10-18",
      googleMapsGeocodingConsent: true, disclosureVersion: "private-places-google-geocoding-v1",
    });
    assert.equal(edited.status, 200, "owner can explicitly edit the encrypted stay");
    assert.equal(edited.body.stay.label, "Edited conference hotel");
    assert.equal(geocodeCalls, 2, "edit geocodes only after renewed disclosure");

    const extended = await authed(owner).post(`/kinfolk/temporary-stays/${stayId}/extend`).send({ departureDate: "2035-10-21" });
    assert.equal(extended.status, 200, "owner can extend before the grace limit");
    assert.equal(extended.body.stay.departureDate, "2035-10-21");
    assert.equal(geocodeCalls, 2, "extension never geocodes again");
    assert.equal((await authed(other).get("/kinfolk/temporary-stays")).body.stays.length, 0, "other synthetic member sees no owner stay");
    assert.equal((await authed(other).post(`/kinfolk/temporary-stays/${stayId}/extend`).send({ departureDate: "2035-10-24" })).status, 404, "cross-member extension is rejected");
    assert.equal((await authed(owner).patch(`/kinfolk/temporary-stays/${stayId}/active`).send({ isActive: false })).status, 200, "owner can pause");
    assert.equal((await authed(owner).post(`/kinfolk/temporary-stays/${stayId}/nearby`).send({})).status, 404, "paused stay cannot power nearby search");
    assert.equal((await authed(owner).patch(`/kinfolk/temporary-stays/${stayId}/active`).send({ isActive: true })).status, 200, "owner can resume");

    const ciphertext = await client.query<{ encrypted_payload: string }>("SELECT encrypted_payload FROM kinfolk_temporary_stays WHERE id = $1", [stayId]);
    assert.equal(ciphertext.rows[0]?.encrypted_payload.includes(syntheticAddress), false, "database never stores address plaintext");
    assert.equal((await authed(owner).delete(`/kinfolk/temporary-stays/${stayId}`)).status, 200, "owner delete works");

    const expired = sealTemporaryStay({
      exactAddress: syntheticAddress, googleFormattedAddress: `${syntheticAddress}, USA`, latitude: 39.9526, longitude: -75.1652,
      arrivalDate: "2000-01-01", departureDate: "2000-01-02",
    });
    await client.query(`INSERT INTO kinfolk_temporary_stays (user_id, label, encrypted_payload, encryption_key_version, geocode_provider, disclosure_version) VALUES ($1,$2,$3,$4,'google_maps',$5)`, [owner, "Expired synthetic stay", expired.encryptedPayload, expired.encryptionKeyVersion, "private-places-google-geocoding-v1"]);
    const afterPurge = await authed(owner).get("/kinfolk/temporary-stays");
    assert.equal(afterPurge.status, 200);
    assert.equal(afterPurge.body.stays.length, 0, "expired stay is removed after grace on the owner lifecycle path");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_temporary_stays")).rows[0]?.count, 0, "expired ciphertext row is deleted");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_memories")).rows[0]?.count, 0, "Temporary Stays creates no Kinfolk memory");
    globalThis.fetch = originalFetch;

    console.log(JSON.stringify({
      status: "passed", environment: "disposable-local-postgresql", syntheticMembers: 2,
      checks: [
        "authenticated owner isolation", "declined disclosure makes no Google call", "accepted disclosure performs one synthetic geocode",
        "encrypted persistence and URL/address/coordinate-safe response", "date-required retention notice", "explicit disclosed edit", "no-geocode owner extension",
        "pause/resume active-only nearby gate", "manual delete", "expired encrypted-row purge", "no Kinfolk memory write",
      ],
    }));
  } finally {
    await sharedPool?.end().catch(() => undefined);
    await client?.end().catch(() => undefined);
    try { runPostgres("pg_ctl", "-D", dataDirectory, "-m", "immediate", "-w", "stop"); } catch { /* no-op */ }
    rmSync(root, { recursive: true, force: true });
  }
}

await main();
