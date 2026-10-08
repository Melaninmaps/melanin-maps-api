import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import express from "express";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import {
  PRIVATE_PLACES_DISCLOSURE_VERSION,
  openPrivatePlace,
  sealPrivatePlace,
} from "./private-places-policy";
import {
  PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
  fictionalPrivatePlacesQaGeocode,
} from "./private-places-fictional-qa";
import { sealTemporaryStay } from "./temporary-stays-policy";
import { createKinfolkPrivatePlacesRouter } from "../routes/kinfolk-private-places";
import { createKinfolkTemporaryStaysRouter } from "../routes/kinfolk-temporary-stays";

const SYNTHETIC_MEMBER_PREFIX = "kinfolk-private-places-synthetic-acceptance-";

type JsonRecord = Record<string, unknown>;

type RequestResult = Readonly<{
  status: number;
  body: JsonRecord;
}>;

function assertSafeResponse(body: unknown): void {
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes(PRIVATE_PLACES_FICTIONAL_QA_ADDRESS), false, "safe response must omit the fictional fixture");
  assert.equal(serialized.includes("latitude"), false, "safe response must omit latitude");
  assert.equal(serialized.includes("longitude"), false, "safe response must omit longitude");
  assert.equal(serialized.includes("encrypted_payload"), false, "safe response must omit ciphertext");
  assert.equal(serialized.includes("exactAddress"), false, "safe response must omit exact address fields");
}

async function readJson(response: Response): Promise<JsonRecord> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return {};
  const parsed = await response.json();
  return parsed && typeof parsed === "object" ? parsed as JsonRecord : {};
}

async function requestJson(input: {
  baseUrl: string;
  memberId?: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: JsonRecord;
}): Promise<RequestResult> {
  const response = await fetch(`${input.baseUrl}${input.path}`, {
    method: input.method,
    headers: {
      ...(input.memberId ? { "x-kinfolk-synthetic-member": input.memberId } : {}),
      ...(input.body ? { "content-type": "application/json" } : {}),
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });
  return { status: response.status, body: await readJson(response) };
}

async function rollbackQuietly(client: PoolClient, started: boolean): Promise<void> {
  if (!started) return;
  await client.query("ROLLBACK").catch(() => undefined);
}

/**
 * Runs only before the production listener starts when its explicit non-secret
 * QA switch is set. Every row—including two minimal synthetic user identities—
 * exists inside one transaction and is rolled back before the function returns.
 * The loopback Express app uses the same route handlers as production, while a
 * fixture-only geocoder makes an external Google request impossible.
 */
export async function runPrivatePlacesProductionSyntheticAcceptance(): Promise<Readonly<{
  checks: readonly string[];
  cleanupVerified: true;
}>> {
  const ownerId = `${SYNTHETIC_MEMBER_PREFIX}owner-${randomUUID()}`;
  const otherId = `${SYNTHETIC_MEMBER_PREFIX}other-${randomUUID()}`;
  const priorEnabled = process.env.KINFOLK_PRIVATE_PLACES_ENABLED;
  const client = await pool.connect();
  let transactionStarted = false;
  let server: ReturnType<typeof createServer> | undefined;
  let providerCalls = 0;

  try {
    // The deployed runtime remains fail closed while this pre-listener QA
    // transaction runs. Enable the policy only inside this process scope so
    // the real listener cannot accept a request before acceptance finishes.
    process.env.KINFOLK_PRIVATE_PLACES_ENABLED = "true";
    await client.query("BEGIN");
    transactionStarted = true;

    // Minimal, synthetic, transaction-scoped identities are not authenticated
    // accounts: no email, password, session, profile, or entitlement is ever
    // inserted. The transaction rolls both rows back before process start.
    await client.query("INSERT INTO users (id) VALUES ($1), ($2)", [ownerId, otherId]);

    const fixtureGeocoder = async (address: string) => {
      providerCalls += 1;
      const fixture = fictionalPrivatePlacesQaGeocode(address);
      if (!fixture) throw new Error("PRIVATE_PLACES_QA_FIXTURE_REJECTED");
      return fixture;
    };

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const mutableRequest = req as unknown as {
        user?: { id: string };
        log?: { error: () => void };
      };
      const memberId = req.get("x-kinfolk-synthetic-member");
      if (memberId === ownerId || memberId === otherId) {
        mutableRequest.user = { id: memberId };
      }
      mutableRequest.log = { error: () => undefined };
      next();
    });
    app.use("/api", createKinfolkPrivatePlacesRouter({ transactionClient: client, geocode: fixtureGeocoder }));
    app.use("/api", createKinfolkTemporaryStaysRouter({ transactionClient: client, geocode: fixtureGeocoder }));

    server = createServer(app);
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      server!.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}/api`;
    const disclosed = {
      googleMapsGeocodingConsent: true,
      disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION,
    };

    const unauthenticatedStatus = await requestJson({ baseUrl, method: "GET", path: "/kinfolk/private-places/status" });
    assert.equal(unauthenticatedStatus.status, 401, "Private Places status must require authentication");

    const privateStatus = await requestJson({ baseUrl, memberId: ownerId, method: "GET", path: "/kinfolk/private-places/status" });
    assert.equal(privateStatus.status, 200, "Private Places status must be available in the controlled harness");
    assert.equal(privateStatus.body.disclosureVersion, PRIVATE_PLACES_DISCLOSURE_VERSION, "Private Places must disclose geocoding before save");

    const declinedPrivateCreate = await requestJson({
      baseUrl, memberId: ownerId, method: "POST", path: "/kinfolk/private-places",
      body: { label: "Synthetic place", exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, googleMapsGeocodingConsent: false, disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION },
    });
    assert.equal(declinedPrivateCreate.status, 400, "Private Place create requires explicit disclosure");
    assert.equal(declinedPrivateCreate.body.code, "PRIVATE_PLACES_DISCLOSURE_REQUIRED");
    assert.equal(providerCalls, 0, "declined Private Place create must not geocode");

    const privateCreated = await requestJson({
      baseUrl, memberId: ownerId, method: "POST", path: "/kinfolk/private-places",
      body: { label: "Synthetic place", exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, ...disclosed },
    });
    assert.equal(privateCreated.status, 201, "disclosed fictional Private Place must create");
    assertSafeResponse(privateCreated.body);
    const privatePlace = privateCreated.body.place as JsonRecord;
    const privatePlaceId = String(privatePlace.id ?? "");
    assert.match(privatePlaceId, /^[0-9a-f-]{36}$/i, "Private Place response must contain only a normal asset identifier");

    const privateCipher = await client.query<{ encrypted_payload: string }>("SELECT encrypted_payload FROM kinfolk_private_places WHERE id = $1", [privatePlaceId]);
    assert.equal(privateCipher.rows.length, 1, "Private Place ciphertext must be stored during the transaction");
    assert.equal(privateCipher.rows[0]?.encrypted_payload.includes(PRIVATE_PLACES_FICTIONAL_QA_ADDRESS), false, "Private Place must not store fixture plaintext");
    assert.equal(openPrivatePlace(privateCipher.rows[0]!.encrypted_payload, "v1").exactAddress, PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, "Private Place payload must decrypt only server-side");

    const otherPrivateList = await requestJson({ baseUrl, memberId: otherId, method: "GET", path: "/kinfolk/private-places" });
    assert.equal(otherPrivateList.status, 200, "second synthetic identity can list only its own places");
    assert.deepEqual(otherPrivateList.body.places, [], "cross-member Private Place list must be empty");
    const otherPrivateEdit = await requestJson({
      baseUrl, memberId: otherId, method: "PUT", path: `/kinfolk/private-places/${privatePlaceId}`,
      body: { label: "Other synthetic place", exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, ...disclosed },
    });
    assert.equal(otherPrivateEdit.status, 404, "cross-member Private Place edit must be denied");

    const declinedPrivateEdit = await requestJson({
      baseUrl, memberId: ownerId, method: "PUT", path: `/kinfolk/private-places/${privatePlaceId}`,
      body: { label: "Edited synthetic place", exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, googleMapsGeocodingConsent: false, disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION },
    });
    assert.equal(declinedPrivateEdit.status, 400, "Private Place edit requires renewed disclosure");
    assert.equal(providerCalls, 1, "declined Private Place edit must not geocode");

    const privateEdited = await requestJson({
      baseUrl, memberId: ownerId, method: "PUT", path: `/kinfolk/private-places/${privatePlaceId}`,
      body: { label: "Edited synthetic place", exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS, ...disclosed },
    });
    assert.equal(privateEdited.status, 200, "disclosed fictional Private Place edit must succeed");
    assertSafeResponse(privateEdited.body);

    const privatePaused = await requestJson({ baseUrl, memberId: ownerId, method: "PATCH", path: `/kinfolk/private-places/${privatePlaceId}/active`, body: { isActive: false } });
    assert.equal(privatePaused.status, 200, "owner can pause Private Place");
    const privatePausedNearby = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: `/kinfolk/private-places/${privatePlaceId}/nearby`, body: { radiusMiles: 5 } });
    assert.equal(privatePausedNearby.status, 404, "paused Private Place must not power nearby lookup");
    const privateResumed = await requestJson({ baseUrl, memberId: ownerId, method: "PATCH", path: `/kinfolk/private-places/${privatePlaceId}/active`, body: { isActive: true } });
    assert.equal(privateResumed.status, 200, "owner can resume Private Place");
    const privateFixtureNearby = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: `/kinfolk/private-places/${privatePlaceId}/nearby`, body: { radiusMiles: 5 } });
    assert.equal(privateFixtureNearby.status, 200, "active fictional fixture can verify nearby gate without directory lookup");
    assert.deepEqual(privateFixtureNearby.body.businesses, [], "fictional fixture must not read or return directory businesses");
    assertSafeResponse(privateFixtureNearby.body);

    const otherPrivateDelete = await requestJson({ baseUrl, memberId: otherId, method: "DELETE", path: `/kinfolk/private-places/${privatePlaceId}` });
    assert.equal(otherPrivateDelete.status, 404, "cross-member Private Place delete must be denied");
    const privateDeleted = await requestJson({ baseUrl, memberId: ownerId, method: "DELETE", path: `/kinfolk/private-places/${privatePlaceId}` });
    assert.equal(privateDeleted.status, 200, "owner can delete Private Place");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_places WHERE user_id = $1", [ownerId])).rows[0]?.count, 0, "Private Place delete must remove encrypted row");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_place_events WHERE user_id = $1", [ownerId])).rows[0]?.count, 0, "Private Place delete must cascade events");

    const stayStatus = await requestJson({ baseUrl, memberId: ownerId, method: "GET", path: "/kinfolk/temporary-stays/status" });
    assert.equal(stayStatus.status, 200, "Temporary Stays status must be available in the controlled harness");
    const retention = stayStatus.body.retention as JsonRecord;
    assert.equal(retention.postDepartureGraceDays, 7, "Temporary Stays must disclose the seven-day grace window");

    const stayInput = {
      label: "Synthetic stay",
      exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
      arrivalDate: "2035-10-10",
      departureDate: "2035-10-17",
    };
    const declinedStayCreate = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: "/kinfolk/temporary-stays", body: { ...stayInput, googleMapsGeocodingConsent: false, disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION } });
    assert.equal(declinedStayCreate.status, 400, "Temporary Stay create requires explicit disclosure");
    assert.equal(providerCalls, 2, "declined Temporary Stay create must not geocode");

    const stayCreated = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: "/kinfolk/temporary-stays", body: { ...stayInput, ...disclosed } });
    assert.equal(stayCreated.status, 201, "disclosed fictional Temporary Stay must create");
    assertSafeResponse(stayCreated.body);
    const stay = stayCreated.body.stay as JsonRecord;
    const stayId = String(stay.id ?? "");
    assert.match(stayId, /^[0-9a-f-]{36}$/i, "Temporary Stay response must contain only a normal identifier");

    const stayCipher = await client.query<{ encrypted_payload: string }>("SELECT encrypted_payload FROM kinfolk_temporary_stays WHERE id = $1", [stayId]);
    assert.equal(stayCipher.rows.length, 1, "Temporary Stay ciphertext must be stored during the transaction");
    assert.equal(stayCipher.rows[0]?.encrypted_payload.includes(PRIVATE_PLACES_FICTIONAL_QA_ADDRESS), false, "Temporary Stay must not store fixture plaintext");

    const declinedStayEdit = await requestJson({ baseUrl, memberId: ownerId, method: "PUT", path: `/kinfolk/temporary-stays/${stayId}`, body: { ...stayInput, departureDate: "2035-10-18", googleMapsGeocodingConsent: false, disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION } });
    assert.equal(declinedStayEdit.status, 400, "Temporary Stay edit requires renewed disclosure");
    assert.equal(providerCalls, 3, "declined Temporary Stay edit must not geocode");

    const stayEdited = await requestJson({ baseUrl, memberId: ownerId, method: "PUT", path: `/kinfolk/temporary-stays/${stayId}`, body: { ...stayInput, label: "Edited synthetic stay", departureDate: "2035-10-18", ...disclosed } });
    assert.equal(stayEdited.status, 200, "disclosed fictional Temporary Stay edit must succeed");
    assertSafeResponse(stayEdited.body);

    const stayExtended = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: `/kinfolk/temporary-stays/${stayId}/extend`, body: { departureDate: "2035-10-21" } });
    assert.equal(stayExtended.status, 200, "owner can extend Temporary Stay before expiry");
    assert.equal(providerCalls, 4, "Temporary Stay extension must not geocode");
    const otherStayList = await requestJson({ baseUrl, memberId: otherId, method: "GET", path: "/kinfolk/temporary-stays" });
    assert.equal(otherStayList.status, 200, "second synthetic identity can list only its own stays");
    assert.deepEqual(otherStayList.body.stays, [], "cross-member Temporary Stay list must be empty");
    const otherStayEdit = await requestJson({
      baseUrl, memberId: otherId, method: "PUT", path: `/kinfolk/temporary-stays/${stayId}`,
      body: { ...stayInput, departureDate: "2035-10-22", ...disclosed },
    });
    assert.equal(otherStayEdit.status, 404, "cross-member Temporary Stay edit must be denied");
    assert.equal(providerCalls, 4, "cross-member Temporary Stay edit must not geocode");
    const otherStayExtend = await requestJson({ baseUrl, memberId: otherId, method: "POST", path: `/kinfolk/temporary-stays/${stayId}/extend`, body: { departureDate: "2035-10-24" } });
    assert.equal(otherStayExtend.status, 404, "cross-member Temporary Stay extension must be denied");
    const stayPaused = await requestJson({ baseUrl, memberId: ownerId, method: "PATCH", path: `/kinfolk/temporary-stays/${stayId}/active`, body: { isActive: false } });
    assert.equal(stayPaused.status, 200, "owner can pause Temporary Stay");
    const stayPausedNearby = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: `/kinfolk/temporary-stays/${stayId}/nearby`, body: {} });
    assert.equal(stayPausedNearby.status, 404, "paused Temporary Stay must not power nearby lookup");
    const stayResumed = await requestJson({ baseUrl, memberId: ownerId, method: "PATCH", path: `/kinfolk/temporary-stays/${stayId}/active`, body: { isActive: true } });
    assert.equal(stayResumed.status, 200, "owner can resume Temporary Stay");
    const stayFixtureNearby = await requestJson({ baseUrl, memberId: ownerId, method: "POST", path: `/kinfolk/temporary-stays/${stayId}/nearby`, body: {} });
    assert.equal(stayFixtureNearby.status, 200, "active fictional Temporary Stay can verify nearby gate without directory lookup");
    assert.deepEqual(stayFixtureNearby.body.businesses, [], "fictional Temporary Stay must not read or return directory businesses");
    assertSafeResponse(stayFixtureNearby.body);

    const otherStayDelete = await requestJson({ baseUrl, memberId: otherId, method: "DELETE", path: `/kinfolk/temporary-stays/${stayId}` });
    assert.equal(otherStayDelete.status, 404, "cross-member Temporary Stay delete must be denied");
    const stayDeleted = await requestJson({ baseUrl, memberId: ownerId, method: "DELETE", path: `/kinfolk/temporary-stays/${stayId}` });
    assert.equal(stayDeleted.status, 200, "owner can delete Temporary Stay");

    const expiredPayload = sealTemporaryStay({
      exactAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
      googleFormattedAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
      latitude: 0,
      longitude: 0,
      arrivalDate: "2000-01-01",
      departureDate: "2000-01-02",
    });
    await client.query(
      `INSERT INTO kinfolk_temporary_stays
        (user_id, label, encrypted_payload, encryption_key_version, geocode_provider, disclosure_version)
       VALUES ($1, $2, $3, $4, 'synthetic_private_places_qa', $5)`,
      [ownerId, "Expired synthetic stay", expiredPayload.encryptedPayload, expiredPayload.encryptionKeyVersion, PRIVATE_PLACES_DISCLOSURE_VERSION],
    );
    const postGraceList = await requestJson({ baseUrl, memberId: ownerId, method: "GET", path: "/kinfolk/temporary-stays" });
    assert.equal(postGraceList.status, 200, "owner list checks expiry cleanup");
    assert.deepEqual(postGraceList.body.stays, [], "post-grace synthetic stay must be removed");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_temporary_stays WHERE user_id = $1", [ownerId])).rows[0]?.count, 0, "Temporary Stay delete and expiry cleanup remove encrypted rows");
    assert.equal((await client.query("SELECT count(*)::integer AS count FROM kinfolk_private_memories WHERE user_id = ANY($1::varchar[])", [[ownerId, otherId]])).rows[0]?.count, 0, "Private Places acceptance must not create ordinary Kinfolk memory");
    assert.equal(providerCalls, 4, "only disclosed create/edit operations may resolve the fictional fixture");

    return {
      checks: [
        "authenticated route boundary",
        "disclosure-before-create-and-edit",
        "fixture-only provider-independent geocoding",
        "encrypted owner lifecycle and safe responses",
        "cross-member denial",
        "pause-resume active-only nearby gate",
        "Temporary Stay grace extension and expiry cleanup",
        "no memory or directory result from fictional fixture",
        "transaction rollback cleanup",
      ],
      cleanupVerified: true,
    };
  } finally {
    await new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });
    await rollbackQuietly(client, transactionStarted);
    client.release();
    if (priorEnabled === undefined) delete process.env.KINFOLK_PRIVATE_PLACES_ENABLED;
    else process.env.KINFOLK_PRIVATE_PLACES_ENABLED = priorEnabled;

    const cleanup = await pool.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM users WHERE id = ANY($1::varchar[])",
      [[ownerId, otherId]],
    );
    assert.equal(cleanup.rows[0]?.count, 0, "synthetic QA identities must not persist after rollback");
  }
}
