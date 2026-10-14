import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  createKinfolkTripItineraryRouter,
  tripItineraryNewEntryTemporaryOrder,
  TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET,
  type KinfolkTripItineraryRepository,
} from "../kinfolk-trip-itinerary";
import { sealTrip, type StoredKinfolkTrip } from "../../kinfolk/trip-policy";
import { type StoredKinfolkTripItineraryEntry } from "../../kinfolk/trip-itinerary-policy";

const TRIP_ID = "10000000-0000-4000-8000-000000000001";
const FIRST_ID = "10000000-0000-4000-8000-000000000002";
const SECOND_ID = "10000000-0000-4000-8000-000000000003";
const input = {
  dayLabel: "Day 1", dayOrder: 1, startTimeLabel: "9:00 AM", endTimeLabel: "10:00 AM",
  title: "Synthetic private morning", note: "Synthetic private note", memberConfirmed: true,
};

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 67).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-itinerary-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const tripBase = { id: TRIP_ID, userId: "owner-a" };
  const trips: StoredKinfolkTrip[] = [{
    ...tripBase,
    ...sealTrip({ title: "Synthetic Trip", destination: "Chicago, Illinois", note: "" }, tripBase),
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"),
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
  }];
  const rows: StoredKinfolkTripItineraryEntry[] = [];
  let mutations = 0;
  const order = (items: StoredKinfolkTripItineraryEntry[]) => items.sort((a, b) => a.dayOrder - b.dayOrder || a.id.localeCompare(b.id));
  const repository: KinfolkTripItineraryRepository = {
    findTrip: async (ownerId, tripId) => {
      const found = trips.find((trip) => trip.userId === ownerId && trip.id === tripId);
      return found ? { ...found } : null;
    },
    list: async (ownerId, tripId) => order(rows.filter((row) => row.userId === ownerId && row.tripId === tripId).map((row) => ({ ...row }))),
    find: async (ownerId, tripId, entryId) => {
      const found = rows.find((row) => row.userId === ownerId && row.tripId === tripId && row.id === entryId);
      return found ? { ...found } : null;
    },
    create: async (row) => {
      const sameTrip = order(rows.filter((current) => current.userId === row.userId && current.tripId === row.tripId));
      if (row.dayOrder > sameTrip.length + 1) return null;
      sameTrip.splice(row.dayOrder - 1, 0, { ...row });
      sameTrip.forEach((current, index) => { const target = rows.find((value) => value.id === current.id); if (target) target.dayOrder = index + 1; else rows.push({ ...current, dayOrder: index + 1 }); });
      mutations++;
      return { ...rows.find((current) => current.id === row.id)! };
    },
    update: async (ownerId, tripId, entryId, encrypted, dayOrder, memberConfirmedAt) => {
      const sameTrip = order(rows.filter((row) => row.userId === ownerId && row.tripId === tripId));
      const index = sameTrip.findIndex((row) => row.id === entryId);
      if (index < 0 || dayOrder > sameTrip.length) return null;
      const [current] = sameTrip.splice(index, 1); sameTrip.splice(dayOrder - 1, 0, current!);
      sameTrip.forEach((row, position) => { row.dayOrder = position + 1; });
      const saved = rows.find((row) => row.id === entryId)!;
      Object.assign(saved, encrypted, { memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z"), dayOrder });
      mutations++;
      return { ...saved };
    },
    remove: async (ownerId, tripId, entryId) => {
      const index = rows.findIndex((row) => row.userId === ownerId && row.tripId === tripId && row.id === entryId);
      if (index < 0) return false;
      rows.splice(index, 1); order(rows.filter((row) => row.userId === ownerId && row.tripId === tripId)).forEach((row, position) => { row.dayOrder = position + 1; });
      mutations++; return true;
    },
    reorder: async (ownerId, tripId, entryIds) => {
      const sameTrip = rows.filter((row) => row.userId === ownerId && row.tripId === tripId);
      if (sameTrip.length !== entryIds.length || sameTrip.some((row) => !entryIds.includes(row.id))) return null;
      entryIds.forEach((id, position) => { rows.find((row) => row.id === id)!.dayOrder = position + 1; });
      mutations++; return order(sameTrip.map((row) => ({ ...row })));
    },
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { const owner = req.header("x-owner"); if (owner) (req as any).user = { id: owner }; (req as any).log = { error: () => undefined }; next(); });
  let ids = [FIRST_ID, SECOND_ID];
  app.use(createKinfolkTripItineraryRouter({ repository, makeId: () => ids.shift()!, now: () => new Date("2026-10-14T00:00:00Z") }));
  return {
    rows, trips, mutations: () => mutations,
    request: (method: "get" | "post" | "put" | "delete", path = "", body?: object, owner: string | null = "owner-a", tripId = TRIP_ID) => {
      const call = request(app)[method](`/kinfolk/trips/${tripId}/itinerary${path}`);
      if (owner) call.set("x-owner", owner);
      return call.send(body);
    },
  };
}

describe("authenticated private nested Trip itinerary routes", () => {
  it("uses a disjoint temporary order for a new entry while existing entries are shifted", () => {
    const shiftedExisting = [1, 2, 3].map((order) => order + TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET);
    const inserted = tripItineraryNewEntryTemporaryOrder(1);
    expect(new Set([...shiftedExisting, inserted]).size).toBe(shiftedExisting.length + 1);
  });

  it("requires authentication and marks every response no-store", async () => {
    const f = fixture(); const response = await f.request("get", "", undefined, null);
    expect(response.statusCode).toBe(401); expect(response.headers["cache-control"]).toBe("no-store"); expect(f.mutations()).toBe(0);
  });

  it("creates, lists, reads, updates, deterministically reorders, and deletes encrypted owner entries", async () => {
    const f = fixture();
    const first = await f.request("post", "", input);
    expect(first.statusCode).toBe(201); expect(first.headers["cache-control"]).toBe("no-store");
    expect(first.body.entry).toMatchObject({
      id: FIRST_ID, dayLabel: input.dayLabel, dayOrder: input.dayOrder,
      startTimeLabel: input.startTimeLabel, endTimeLabel: input.endTimeLabel,
      title: input.title, note: input.note,
    });
    expect(first.body.entry.memberConfirmed).toBeUndefined();
    expect(JSON.stringify(first.body)).not.toMatch(/encrypted|keyId|fingerprint|userId/i);
    expect(f.rows[0]!.title).toBe("[Encrypted private memory]");
    expect(JSON.stringify(f.rows[0])).not.toContain(input.title);
    const second = await f.request("post", "", { ...input, dayLabel: "Day 2", dayOrder: 2, title: "Synthetic private afternoon" });
    expect(second.statusCode).toBe(201);
    const listed = await f.request("get");
    expect(listed.headers["cache-control"]).toBe("no-store");
    expect(listed.body.entries.map((entry: { id: string }) => entry.id)).toEqual([FIRST_ID, SECOND_ID]);
    const read = await f.request("get", `/${SECOND_ID}`);
    expect(read.headers["cache-control"]).toBe("no-store");
    expect(read.body.entry.title).toBe("Synthetic private afternoon");
    const edited = await f.request("put", `/${FIRST_ID}`, { ...input, dayOrder: 2, title: "Synthetic revised private morning" });
    expect(edited.headers["cache-control"]).toBe("no-store");
    expect(edited.body.entry).toMatchObject({ id: FIRST_ID, dayOrder: 2, title: "Synthetic revised private morning" });
    expect(JSON.stringify(f.rows)).not.toContain("Synthetic revised private morning");
    const reordered = await f.request("put", "/order", { entryIds: [FIRST_ID, SECOND_ID], memberConfirmed: true });
    expect(reordered.headers["cache-control"]).toBe("no-store");
    expect(reordered.body.entries.map((entry: { id: string; dayOrder: number }) => [entry.id, entry.dayOrder])).toEqual([[FIRST_ID, 1], [SECOND_ID, 2]]);
    const deleted = await f.request("delete", `/${FIRST_ID}`, { memberConfirmed: true });
    expect(deleted.headers["cache-control"]).toBe("no-store");
    expect(deleted.body).toEqual({ removed: true });
    expect(f.rows.map((row) => row.id)).toEqual([SECOND_ID]);
  });

  it("rejects every unconfirmed mutation before storage changes", async () => {
    const f = fixture();
    expect((await f.request("post", "", { ...input, memberConfirmed: false })).statusCode).toBe(400);
    await f.request("post", "", input); const before = f.mutations();
    expect((await f.request("put", `/${FIRST_ID}`, { ...input, memberConfirmed: false })).statusCode).toBe(400);
    expect((await f.request("put", "/order", { entryIds: [FIRST_ID], memberConfirmed: false })).statusCode).toBe(400);
    expect((await f.request("delete", `/${FIRST_ID}`, {})).statusCode).toBe(400);
    expect(f.mutations()).toBe(before);
  });

  it("returns generic not-found for malformed and cross-owner IDs without exposing entries", async () => {
    const f = fixture(); await f.request("post", "", input);
    for (const [method, path, body, owner, tripId] of [
      ["get", "/not-an-id", undefined, "owner-a", TRIP_ID],
      ["get", `/${FIRST_ID}`, undefined, "owner-b", TRIP_ID],
      ["put", `/${FIRST_ID}`, input, "owner-b", TRIP_ID],
      ["delete", `/${FIRST_ID}`, { memberConfirmed: true }, "owner-b", TRIP_ID],
      ["get", "", undefined, "owner-a", "10000000-0000-4000-8000-000000000099"],
    ] as const) {
      const response = await f.request(method, path, body, owner, tripId);
      expect(response.statusCode).toBe(404); expect(JSON.stringify(response.body)).not.toContain(input.title);
    }
  });

  it("fails closed on a tampered parent or entry before a direct mutation", async () => {
    const f = fixture(); await f.request("post", "", input);
    f.rows[0]!.encryptedTitle += ".tamper";
    const before = { ...f.rows[0]! }; const mutations = f.mutations();
    for (const method of ["get", "put", "delete"] as const) {
      const response = await f.request(method, `/${FIRST_ID}`, method === "put" ? input : method === "delete" ? { memberConfirmed: true } : undefined);
      expect(response.statusCode).toBe(409); expect(response.body).toMatchObject({ code: "TRIP_ITINERARY_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
    expect(f.rows[0]).toEqual(before); expect(f.mutations()).toBe(mutations);
    f.rows[0]!.encryptedTitle = before.encryptedTitle; f.trips[0]!.encryptedTitle += ".tamper";
    expect((await f.request("post", "", { ...input, title: "Never stored" })).statusCode).toBe(409);
    expect(f.rows).toHaveLength(1);
  });

  it("has no public/read-share route or automatic cross-feature hook", async () => {
    const source = readFileSync(new URL("../kinfolk-trip-itinerary.ts", import.meta.url), "utf8");
    const routeIndex = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    expect(source).toContain("no public/read-share route");
    expect(source).not.toContain('router.get("/public');
    expect(source).not.toContain("shareId");
    expect(source).not.toContain("api/kinfolk/chat");
    expect(routeIndex.indexOf("router.use(requireAuth)")).toBeLessThan(routeIndex.indexOf("router.use(kinfolkTripItineraryRouter)"));
  });
});
