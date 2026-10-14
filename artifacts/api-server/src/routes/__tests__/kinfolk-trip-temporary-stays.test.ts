import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createKinfolkTripTemporaryStaysRouter,
  type KinfolkTripTemporaryStaysRepository,
  type StoredKinfolkTripTemporaryStayLink,
  type StoredTemporaryStay,
} from "../kinfolk-trip-temporary-stays";
import { sealTrip, type StoredKinfolkTrip } from "../../kinfolk/trip-policy";
import { sealTemporaryStay } from "../../kinfolk/temporary-stays-policy";

const TRIP_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_TRIP_ID = "10000000-0000-4000-8000-000000000002";
const STAY_ID = "20000000-0000-4000-8000-000000000001";
const INACTIVE_STAY_ID = "20000000-0000-4000-8000-000000000002";
const EXPIRED_STAY_ID = "20000000-0000-4000-8000-000000000003";
const OTHER_STAY_ID = "20000000-0000-4000-8000-000000000004";
const LINK_ID = "30000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 47).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-stay-route-v1");
  vi.stubEnv("KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS", `v1:${Buffer.alloc(32, 48).toString("base64")}`);
});
afterEach(() => vi.unstubAllEnvs());

function trip(id: string, userId: string): StoredKinfolkTrip {
  const encrypted = sealTrip({ title: "Synthetic city break", destination: "Chicago, Illinois", note: "Synthetic note" }, { id, userId });
  const date = new Date("2026-10-14T00:00:00.000Z");
  return { id, userId, ...encrypted, memberConfirmedAt: date, createdAt: date, updatedAt: date };
}

function stay(id: string, userId: string, isActive: boolean, departureDate: string): StoredTemporaryStay {
  const sealed = sealTemporaryStay({
    exactAddress: "1000 Synthetic Avenue, Exampleville, PA 19199",
    googleFormattedAddress: "1000 Synthetic Avenue, Exampleville, PA 19199, USA",
    latitude: 39.9526,
    longitude: -75.1652,
    arrivalDate: departureDate < "2026-10-10" ? "2026-09-20" : "2026-10-10",
    departureDate,
  });
  const date = new Date("2026-10-14T00:00:00.000Z");
  return { id, userId, label: id === STAY_ID ? "Synthetic lodging" : "Private lodging", isActive, ...sealed, createdAt: date, updatedAt: date };
}

function fixture() {
  const trips = [trip(TRIP_ID, "owner-a"), trip(OTHER_TRIP_ID, "owner-b")];
  const stays = [
    stay(STAY_ID, "owner-a", true, "2026-10-20"),
    stay(INACTIVE_STAY_ID, "owner-a", false, "2026-10-20"),
    stay(EXPIRED_STAY_ID, "owner-a", true, "2026-10-01"),
    stay(OTHER_STAY_ID, "owner-b", true, "2026-10-20"),
  ];
  const links: StoredKinfolkTripTemporaryStayLink[] = [];
  let mutations = 0;
  const repository: KinfolkTripTemporaryStaysRepository = {
    findTrip: async (ownerId, tripId) => trips.find((row) => row.userId === ownerId && row.id === tripId) ?? null,
    listAvailableStays: async (ownerId) => stays.filter((row) => row.userId === ownerId && row.isActive).map((row) => ({ ...row })),
    findAvailableStay: async (ownerId, stayId) => {
      const found = stays.find((row) => row.userId === ownerId && row.id === stayId && row.isActive);
      return found ? { ...found } : null;
    },
    findOwnedStay: async (ownerId, stayId) => {
      const found = stays.find((row) => row.userId === ownerId && row.id === stayId);
      return found ? { ...found } : null;
    },
    listLinks: async (ownerId, tripId) => links.filter((row) => row.userId === ownerId && row.tripId === tripId).map((row) => ({ ...row })),
    link: async (row) => {
      const index = links.findIndex((current) => current.tripId === row.tripId && current.temporaryStayId === row.temporaryStayId);
      mutations++;
      if (index >= 0) links[index] = { ...links[index]!, ...row };
      else links.push({ ...row });
      return { ...(index >= 0 ? links[index]! : links[links.length - 1]!) };
    },
    unlink: async (ownerId, tripId, stayId) => {
      const index = links.findIndex((row) => row.userId === ownerId && row.tripId === tripId && row.temporaryStayId === stayId);
      if (index < 0) return false;
      mutations++; links.splice(index, 1); return true;
    },
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { const current = req.header("x-owner"); if (current) (req as any).user = { id: current }; (req as any).log = { error: () => undefined }; next(); });
  app.use(createKinfolkTripTemporaryStaysRouter({ repository, makeId: () => LINK_ID, now: () => new Date("2026-10-14T00:00:00.000Z") }));
  const call = (method: "get" | "post" | "delete", path = "", body?: object, owner: string | null = "owner-a") => {
    const response = request(app)[method](`/kinfolk/trips/${TRIP_ID}/temporary-stays${path}`);
    if (owner) response.set("x-owner", owner);
    return response.send(body);
  };
  return { trips, stays, links, call, mutations: () => mutations };
}

describe("authenticated Trip Temporary Stay link routes", () => {
  it("requires authentication and marks every outcome no-store", async () => {
    const f = fixture();
    const response = await f.call("get", "", undefined, null);
    expect(response.statusCode).toBe(401);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(f.mutations()).toBe(0);
  });

  it("lists safe active metadata, then links and unlinks only the reference after confirmation", async () => {
    const f = fixture();
    const initial = await f.call("get");
    expect(initial.statusCode).toBe(200);
    expect(initial.headers["cache-control"]).toBe("no-store");
    expect(initial.body.stays).toEqual([expect.objectContaining({
      id: STAY_ID, label: "Synthetic lodging", isActive: true, arrivalDate: "2026-10-10", departureDate: "2026-10-20", linked: false,
    })]);
    expect(JSON.stringify(initial.body)).not.toMatch(/address|latitude|longitude|encrypted|ciphertext|key|google|provider|userId/i);
    expect((await f.call("post", "", { temporaryStayId: STAY_ID, memberConfirmed: false })).statusCode).toBe(400);
    expect(f.links).toEqual([]);

    const linked = await f.call("post", "", { temporaryStayId: STAY_ID, memberConfirmed: true });
    expect(linked.statusCode).toBe(201);
    expect(linked.headers["cache-control"]).toBe("no-store");
    expect(linked.body.stay).toMatchObject({ id: STAY_ID, label: "Synthetic lodging", linked: true });
    expect(JSON.stringify(linked.body)).not.toMatch(/address|latitude|longitude|encrypted|ciphertext|key|google|provider|userId/i);
    expect(f.links).toHaveLength(1);
    expect((await f.call("get")).body.stays[0].linked).toBe(true);

    expect((await f.call("delete", `/${STAY_ID}`, {})).statusCode).toBe(400);
    expect(f.links).toHaveLength(1);
    const removed = await f.call("delete", `/${STAY_ID}`, { memberConfirmed: true });
    expect(removed.statusCode).toBe(200);
    expect(removed.headers["cache-control"]).toBe("no-store");
    expect(removed.body).toEqual({ removed: true });
    expect(f.links).toEqual([]);
    // Unlink never erases or changes the linked Temporary Stay or the parent Trip.
    expect(f.stays.find((row) => row.id === STAY_ID)).toBeDefined();
    expect(f.trips.find((row) => row.id === TRIP_ID)).toBeDefined();
  });

  it("permits the owner to unlink a retained inactive or expired reference without reactivating or exposing it", async () => {
    const f = fixture();
    for (const stayId of [INACTIVE_STAY_ID, EXPIRED_STAY_ID]) {
      f.links.push({
        id: `${LINK_ID}-${stayId.slice(-1)}`,
        tripId: TRIP_ID,
        temporaryStayId: stayId,
        userId: "owner-a",
        memberConfirmedAt: new Date("2026-10-14T00:00:00.000Z"),
        createdAt: new Date("2026-10-14T00:00:00.000Z"),
        updatedAt: new Date("2026-10-14T00:00:00.000Z"),
      });
      const response = await f.call("delete", `/${stayId}`, { memberConfirmed: true });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ removed: true });
      expect(JSON.stringify(response.body)).not.toMatch(/address|latitude|longitude|encrypted|key|google|provider/i);
      expect(f.stays.find((row) => row.id === stayId)?.isActive).toBe(stayId === INACTIVE_STAY_ID ? false : true);
      expect(f.links.some((link) => link.temporaryStayId === stayId)).toBe(false);
    }
    expect((await f.call("get")).body.stays.map((row: { id: string }) => row.id)).toEqual([STAY_ID]);
  });

  it("suppresses inactive and expired stays and returns generic outcomes for malformed or cross-owner selection", async () => {
    const f = fixture();
    expect((await f.call("get")).body.stays.map((row: { id: string }) => row.id)).toEqual([STAY_ID]);
    for (const stayId of ["not-an-id", INACTIVE_STAY_ID, EXPIRED_STAY_ID, OTHER_STAY_ID]) {
      const response = await f.call("post", "", { temporaryStayId: stayId, memberConfirmed: true });
      expect(response.statusCode).toBe(stayId === "not-an-id" ? 400 : 404);
      if (response.statusCode === 404) expect(response.body).toEqual({ error: "Temporary Stay not available" });
      expect(JSON.stringify(response.body)).not.toMatch(/address|private lodging|owner-b/i);
    }
    const crossOwnerParent = await f.call("get", "", undefined, "owner-b");
    expect(crossOwnerParent.statusCode).toBe(404);
    expect(crossOwnerParent.body).toEqual({ error: "Trip not found" });
    expect(f.mutations()).toBe(0);
  });

  it("fails closed for a tampered or unavailable encrypted parent or active encrypted stay before mutation", async () => {
    const f = fixture();
    f.trips[0]!.encryptedTitle += ".tamper";
    const parentFailure = await f.call("get");
    expect(parentFailure.statusCode).toBe(409);
    expect(parentFailure.body).toMatchObject({ code: "TRIP_TEMPORARY_STAY_SECURE_ACCESS_REQUIRED", recoverable: true });
    f.trips[0] = trip(TRIP_ID, "owner-a");
    f.stays[0] = { ...f.stays[0]!, encryptedPayload: `${f.stays[0]!.encryptedPayload}.tamper` };
    const stayFailure = await f.call("post", "", { temporaryStayId: STAY_ID, memberConfirmed: true });
    expect(stayFailure.statusCode).toBe(409);
    expect(f.links).toEqual([]);
    f.stays[0] = stay(STAY_ID, "owner-a", true, "2026-10-20");
    delete process.env.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS;
    const unavailable = await f.call("get");
    expect(unavailable.statusCode).toBe(503);
    expect(f.mutations()).toBe(0);
  });

  it("keeps the implementation source-only, private, provider-free, and free of legacy storage migration", () => {
    const route = readFileSync(new URL("../kinfolk-trip-temporary-stays.ts", import.meta.url), "utf8");
    const routeIndex = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    const migration = readFileSync(new URL("../../../migrations/20261014_kinfolk_trip_temporary_stays.approval-required.sql", import.meta.url), "utf8");
    const schema = readFileSync(new URL("../../../../../lib/db/src/schema/kinfolk-trip-temporary-stays.ts", import.meta.url), "utf8");
    const staySchema = readFileSync(new URL("../../../../../lib/db/src/schema/kinfolk-temporary-stays.ts", import.meta.url), "utf8");
    expect(route).toContain("no public route");
    expect(route).toContain("unlink removes only the reference");
    expect(route).toContain("findOwnedStay");
    expect(route).toContain("must not trap the private link");
    expect(route).not.toContain('router.get("/public');
    expect(route).not.toContain("geocode");
    expect(route).not.toContain("findWithinRadius");
    expect(route).not.toContain("AsyncStorage");
    expect(routeIndex.indexOf("router.use(requireAuth)")).toBeLessThan(routeIndex.indexOf("router.use(kinfolkTripTemporaryStaysRouter)"));
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY");
    expect(migration).toContain("Ordered prerequisite");
    expect(migration).toContain("kinfolk_temporary_stays_id_owner_key");
    expect(migration).toContain("FOREIGN KEY (trip_id, user_id)");
    expect(migration).toContain("FOREIGN KEY (temporary_stay_id, user_id)");
    expect(migration).not.toContain("INSERT INTO");
    expect(migration).not.toContain("UPDATE kinfolk");
    expect(schema).toContain("memberConfirmedAt");
    expect(schema).not.toMatch(/encryptedPayload|encrypted_payload|exactAddress|latitude:|longitude:|geocodeProvider|bookingId/i);
    expect(staySchema).toContain("kinfolk_temporary_stays_id_owner_key");
  });
});
