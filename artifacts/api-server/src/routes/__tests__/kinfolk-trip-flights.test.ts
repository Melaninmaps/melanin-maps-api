import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createKinfolkTripFlightsRouter, type KinfolkTripFlightRepository } from "../kinfolk-trip-flights";
import { sealTrip, type StoredKinfolkTrip } from "../../kinfolk/trip-policy";
import { FLIGHT_STORAGE_PLACEHOLDER, sealTripFlight, type StoredKinfolkTripFlight } from "../../kinfolk/trip-flight-policy";

const TRIP_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_TRIP_ID = "10000000-0000-4000-8000-000000000099";
const FIRST_ID = "10000000-0000-4000-8000-000000000002";
const SECOND_ID = "10000000-0000-4000-8000-000000000003";
const input = { flightNumber: "AA1234", airline: "Synthetic Air", departureDate: "2026-11-12", origin: "ATL", destination: "ORD", notes: "Synthetic private note", memberConfirmed: true };

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 101).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-flight-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const tripBase = { id: TRIP_ID, userId: "owner-a" };
  const trips: StoredKinfolkTrip[] = [{
    ...tripBase, ...sealTrip({ title: "Synthetic Trip", destination: "Chicago, Illinois", note: "" }, tripBase),
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"), createdAt: new Date("2026-10-14T00:00:00Z"), updatedAt: new Date("2026-10-14T00:00:00Z"),
  }];
  const rows: StoredKinfolkTripFlight[] = [];
  let mutations = 0;
  const clone = <T,>(row: T): T => ({ ...row });
  const repository: KinfolkTripFlightRepository = {
    findTrip: async (ownerId, tripId) => { const found = trips.find((trip) => trip.userId === ownerId && trip.id === tripId); return found ? clone(found) : null; },
    list: async (ownerId, tripId) => rows.filter((row) => row.userId === ownerId && row.tripId === tripId).map(clone),
    listUnlinked: async (ownerId) => rows.filter((row) => row.userId === ownerId && row.tripId === null).map(clone),
    find: async (ownerId, tripId, flightId) => { const found = rows.find((row) => row.userId === ownerId && row.tripId === tripId && row.id === flightId); return found ? clone(found) : null; },
    findUnlinked: async (ownerId, flightId) => { const found = rows.find((row) => row.userId === ownerId && row.tripId === null && row.id === flightId); return found ? clone(found) : null; },
    create: async (row) => { mutations++; rows.push(clone(row)); return clone(row); },
    update: async (ownerId, tripId, flightId, encrypted, memberConfirmedAt) => {
      const row = rows.find((current) => current.userId === ownerId && current.tripId === tripId && current.id === flightId); if (!row) return null;
      mutations++; Object.assign(row, encrypted, { memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z") }); return clone(row);
    },
    attach: async (ownerId, tripId, flightId, memberConfirmedAt) => {
      const row = rows.find((current) => current.userId === ownerId && current.tripId === null && current.id === flightId); if (!row) return null;
      mutations++; Object.assign(row, { tripId, memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z") }); return clone(row);
    },
    attachWithCorrection: async (ownerId, tripId, flightId, encrypted, memberConfirmedAt) => {
      const row = rows.find((current) => current.userId === ownerId && current.tripId === null && current.id === flightId); if (!row) return null;
      mutations++; Object.assign(row, encrypted, { tripId, memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z") }); return clone(row);
    },
    unlink: async (ownerId, tripId, flightId, memberConfirmedAt) => {
      const row = rows.find((current) => current.userId === ownerId && current.tripId === tripId && current.id === flightId); if (!row) return null;
      mutations++; Object.assign(row, { tripId: null, memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z") }); return clone(row);
    },
    remove: async (ownerId, tripId, flightId) => {
      const index = rows.findIndex((row) => row.userId === ownerId && row.tripId === tripId && row.id === flightId); if (index < 0) return false;
      mutations++; rows.splice(index, 1); return true;
    },
  };
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { const currentOwner = req.header("x-owner"); if (currentOwner) (req as any).user = { id: currentOwner }; (req as any).log = { error: () => undefined }; next(); });
  let ids = [FIRST_ID, SECOND_ID];
  app.use(createKinfolkTripFlightsRouter({ repository, makeId: () => ids.shift()!, now: () => new Date("2026-10-14T00:00:00Z") }));
  return {
    rows, mutations: () => mutations,
    legacy(id = SECOND_ID): StoredKinfolkTripFlight {
      const row: StoredKinfolkTripFlight = { id, userId: "owner-a", tripId: null, flightNumber: "DL99", encryptedFlightNumber: null, flightNumberEncryptionKeyId: null, airline: "Legacy Airline", encryptedAirline: null, airlineEncryptionKeyId: null, departureDate: "2026-12-14", encryptedDepartureDate: null, departureDateEncryptionKeyId: null, origin: "JFK", encryptedOrigin: null, originEncryptionKeyId: null, destination: "LAX", encryptedDestination: null, destinationEncryptionKeyId: null, notes: null, encryptedNotes: null, notesEncryptionKeyId: null, memberConfirmedAt: null, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: null };
      rows.push(row); return row;
    },
    request: (method: "get" | "post" | "put" | "delete", path = "", body?: object, currentOwner: string | null = "owner-a", tripId = TRIP_ID) => {
      const call = request(app)[method](`/kinfolk/trips/${tripId}/flights${path}`); if (currentOwner) call.set("x-owner", currentOwner); return call.send(body);
    },
  };
}

describe("authenticated private selected-Trip flight routes", () => {
  it("requires authentication, exact confirmation, validation, and no-store before mutation", async () => {
    const f = fixture();
    const unauthenticated = await f.request("get", "", undefined, null);
    expect(unauthenticated.statusCode).toBe(401); expect(unauthenticated.headers["cache-control"]).toBe("no-store");
    expect((await f.request("post", "", { ...input, memberConfirmed: false })).statusCode).toBe(400);
    expect((await f.request("post", "", { ...input, departureDate: "not-a-date" })).statusCode).toBe(400);
    expect((await f.request("post", "", { ...input, origin: "12345", pnr: "NEVER" } as any)).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);
  });

  it("creates, reads, corrects, and removes only encrypted owner flight records without crypto metadata", async () => {
    const f = fixture();
    const created = await f.request("post", "", input);
    expect(created.statusCode).toBe(201); expect(created.headers["cache-control"]).toBe("no-store");
    const { memberConfirmed: _requestOnlyConfirmation, ...publicFlight } = input;
    expect(created.body.flight).toMatchObject({ id: FIRST_ID, ...publicFlight });
    expect(created.body.flight.memberConfirmed).toBeUndefined();
    expect(JSON.stringify(created.body)).not.toMatch(/encrypted|keyId|fingerprint|userId|\[Encrypted private memory\]/i);
    expect(f.rows[0]!.flightNumber).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(JSON.stringify(f.rows[0])).not.toContain(input.flightNumber);
    expect((await f.request("get")).body.flights[0].flightNumber).toBe(input.flightNumber);
    expect((await f.request("get", `/${FIRST_ID}`)).body.flight.destination).toBe(input.destination);
    const revised = await f.request("put", `/${FIRST_ID}`, { ...input, notes: "Synthetic corrected private note" });
    expect(revised.statusCode).toBe(200); expect(revised.body.flight.notes).toBe("Synthetic corrected private note");
    expect(JSON.stringify(f.rows[0])).not.toContain("Synthetic corrected private note");
    expect((await f.request("delete", `/${FIRST_ID}`, { memberConfirmed: true })).body).toEqual({ removed: true });
    expect(f.rows).toHaveLength(0);
  });

  it("keeps a legacy row owner-readable and unlinked until an explicit attach-with-correction encrypts it", async () => {
    const f = fixture(); const legacy = f.legacy();
    const available = await f.request("get", "/available");
    expect(available.statusCode).toBe(200); expect(available.body.flights).toMatchObject([{ id: legacy.id, flightNumber: "DL99", notes: "" }]);
    expect(f.rows[0]!.encryptedFlightNumber).toBeNull();
    const { memberConfirmed: _memberConfirmed, ...correction } = input;
    const attached = await f.request("put", `/${legacy.id}/attach`, { memberConfirmed: true, flight: correction });
    expect(attached.statusCode).toBe(200); expect(attached.body.flight).toMatchObject({ id: legacy.id, flightNumber: input.flightNumber });
    expect(f.rows[0]!.tripId).toBe(TRIP_ID); expect(f.rows[0]!.flightNumber).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(JSON.stringify(attached.body)).not.toMatch(/encrypted|keyId|fingerprint|userId|placeholder/i);
    const unlinked = await f.request("delete", `/${legacy.id}/attachment`, { memberConfirmed: true });
    expect(unlinked.statusCode).toBe(200); expect(unlinked.body.unlinked).toBe(true); expect(f.rows[0]!.tripId).toBeNull();
  });

  it("returns generic not-found for malformed, cross-owner, cross-Trip, and already-linked IDs", async () => {
    const f = fixture(); await f.request("post", "", input);
    for (const [method, path, body, currentOwner, tripId] of [
      ["get", "/not-an-id", undefined, "owner-a", TRIP_ID],
      ["get", `/${FIRST_ID}`, undefined, "owner-b", TRIP_ID],
      ["put", `/${FIRST_ID}`, input, "owner-b", TRIP_ID],
      ["delete", `/${FIRST_ID}`, { memberConfirmed: true }, "owner-b", TRIP_ID],
      ["get", "", undefined, "owner-a", OTHER_TRIP_ID],
      ["put", `/${FIRST_ID}/attach`, { memberConfirmed: true }, "owner-a", TRIP_ID],
    ] as const) {
      const response = await f.request(method, path, body, currentOwner, tripId);
      expect(response.statusCode).toBe(404); expect(JSON.stringify(response.body)).not.toContain(input.flightNumber);
    }
  });

  it("fails closed on tamper or unavailable keys but explicit deletion remains crypto-independent", async () => {
    const f = fixture(); await f.request("post", "", input);
    f.rows[0]!.encryptedFlightNumber += ".tamper"; const before = { ...f.rows[0]! }; const mutations = f.mutations();
    for (const method of ["get", "put"] as const) {
      const response = await f.request(method, `/${FIRST_ID}`, method === "put" ? input : undefined);
      expect(response.statusCode).toBe(409); expect(response.body).toMatchObject({ code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
    expect(f.rows[0]).toEqual(before); expect(f.mutations()).toBe(mutations);
    // A member can revoke this Trip relation without opening a tampered envelope.
    const unlinked = await f.request("delete", `/${FIRST_ID}/attachment`, { memberConfirmed: true });
    expect(unlinked.statusCode).toBe(200); expect(unlinked.body).toEqual({ unlinked: true });
    expect(f.rows[0]!.tripId).toBeNull();
    // A fresh tampered linked row remains removable without crypto access as well.
    const deleteFixture = fixture(); await deleteFixture.request("post", "", input);
    deleteFixture.rows[0]!.encryptedFlightNumber += ".tamper";
    expect((await deleteFixture.request("delete", `/${FIRST_ID}`, { memberConfirmed: true })).statusCode).toBe(200);
    const unavailable = fixture();
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect((await unavailable.request("post", "", input)).statusCode).toBe(503);
  });

  it("has source-only migration safeguards and no automatic cross-feature or provider behavior", () => {
    const route = readFileSync(new URL("../kinfolk-trip-flights.ts", import.meta.url), "utf8");
    const generic = readFileSync(new URL("../travel-flights.ts", import.meta.url), "utf8");
    const migration = readFileSync(new URL("../../../migrations/20261014_kinfolk_trip_flights_encryption.approval-required.sql", import.meta.url), "utf8");
    const startup = readFileSync(new URL("../../lib/startup-migrations.ts", import.meta.url), "utf8");
    const routes = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY");
    expect(migration).toContain("FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id)");
    expect(migration).toContain("ON DELETE SET NULL (trip_id)");
    expect(migration).toContain("BEFORE INSERT OR UPDATE ON travel_flights");
    expect(migration).toContain("safe_detach BOOLEAN");
    expect(migration).toContain("IF safe_detach THEN RETURN NEW; END IF;");
    expect(migration).toContain("[private]");
    expect(migration).not.toMatch(/ALTER\s+COLUMN|DROP\s+TRIGGER|CREATE\s+OR\s+REPLACE/i);
    expect(migration).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE\s+travel_flights\s+SET|DELETE\s+FROM)\b/im);
    expect(startup).not.toContain("kinfolk_trip_flights_encryption");
    expect(routes).toContain('import kinfolkTripFlightsRouter from "./kinfolk-trip-flights"');
    expect(routes).toContain("router.use(kinfolkTripFlightsRouter)");
    expect(route).toContain("no automatic\n * chat, memory, recommendations, calendar, reminder, provider-status, analytics");
    expect(route).not.toContain("api/kinfolk/chat"); expect(route).not.toContain("shareId");
    expect(generic).toContain("parseFlightInput(req.body)");
    expect(generic).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(generic).toContain("tripFlightView(row, ownerId)");
    expect(generic).not.toContain("RETURNING *");
    expect(generic).toContain("providerStatus: \"unavailable\"");
    expect(generic).toContain("without an API key it");
    expect(generic).not.toContain("test(");
  });
});
