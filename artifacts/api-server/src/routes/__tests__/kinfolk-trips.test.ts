import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createKinfolkTripsRouter,
  type KinfolkTripRepository,
} from "../kinfolk-trips";
import type { StoredKinfolkTrip } from "../../kinfolk/trip-policy";

const FIRST_ID = "10000000-0000-4000-8000-000000000001";
const SECOND_ID = "10000000-0000-4000-8000-000000000002";
const input = { title: "Synthetic city break", destination: "Chicago, Illinois", note: "Synthetic note", memberConfirmed: true };

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 59).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const rows: StoredKinfolkTrip[] = [];
  let mutations = 0;
  const repository: KinfolkTripRepository = {
    list: async (ownerId) => rows.filter((row) => row.userId === ownerId).map((row) => ({ ...row })),
    find: async (ownerId, id) => {
      const found = rows.find((row) => row.userId === ownerId && row.id === id);
      return found ? { ...found } : null;
    },
    create: async (row) => { mutations++; rows.push({ ...row }); return { ...row }; },
    update: async (ownerId, id, encrypted, memberConfirmedAt) => {
      const index = rows.findIndex((row) => row.userId === ownerId && row.id === id);
      if (index < 0) return null;
      mutations++;
      rows[index] = { ...rows[index]!, ...encrypted, memberConfirmedAt, updatedAt: new Date("2026-10-14T00:01:00Z") };
      return { ...rows[index]! };
    },
    remove: async (ownerId, id) => {
      const index = rows.findIndex((row) => row.userId === ownerId && row.id === id);
      if (index < 0) return false;
      mutations++; rows.splice(index, 1); return true;
    },
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { const owner = req.header("x-owner"); if (owner) (req as any).user = { id: owner }; (req as any).log = { error: () => undefined }; next(); });
  app.use(createKinfolkTripsRouter({ repository, makeId: () => rows.length ? SECOND_ID : FIRST_ID, now: () => new Date("2026-10-14T00:00:00Z") }));
  return { rows, request: (method: "get" | "post" | "put" | "delete", path = "", body?: string | object, owner: string | null = "owner-a") => { const call = request(app)[method](`/kinfolk/trips${path}`); if (owner) call.set("x-owner", owner); return call.send(body); }, mutations: () => mutations };
}

describe("authenticated private Kinfolk Trips routes", () => {
  it("requires authentication and still marks the response no-store", async () => {
    const f = fixture(); const response = await f.request("get", "", undefined, null);
    expect(response.statusCode).toBe(401);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(f.mutations()).toBe(0);
  });

  it("creates, lists, reads, updates, and deletes only encrypted owner records with no-store responses", async () => {
    const f = fixture();
    const created = await f.request("post", "", input);
    expect(created.statusCode).toBe(201);
    expect(created.headers["cache-control"]).toBe("no-store");
    expect(created.body.trip).toMatchObject({ id: FIRST_ID, title: input.title, destination: input.destination, note: input.note });
    expect(JSON.stringify(created.body)).not.toMatch(/encrypted|keyId|fingerprint|userId/i);
    expect(f.rows[0]!.title).toBe("[Encrypted private memory]");
    expect(JSON.stringify(f.rows[0])).not.toContain(input.title);
    const listed = await f.request("get");
    expect(listed.body.trips).toHaveLength(1);
    expect(listed.body.boundaries).toEqual(expect.any(Array));
    expect((await f.request("get", `/${FIRST_ID}`)).body.trip.destination).toBe(input.destination);
    const edited = await f.request("put", `/${FIRST_ID}`, { ...input, title: "Synthetic revised Trip" });
    expect(edited.body.trip.title).toBe("Synthetic revised Trip");
    expect(JSON.stringify(f.rows[0])).not.toContain("Synthetic revised Trip");
    expect((await f.request("delete", `/${FIRST_ID}`, { memberConfirmed: true })).body).toEqual({ removed: true });
    expect(f.rows).toEqual([]);
  });

  it("rejects all unconfirmed writes before mutation", async () => {
    const f = fixture();
    expect((await f.request("post", "", { ...input, memberConfirmed: false })).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);
    await f.request("post", "", input);
    const before = f.mutations();
    expect((await f.request("put", `/${FIRST_ID}`, { ...input, memberConfirmed: false })).statusCode).toBe(400);
    expect((await f.request("delete", `/${FIRST_ID}`, {})).statusCode).toBe(400);
    expect(f.mutations()).toBe(before);
  });

  it("returns generic not-found for malformed or cross-owner direct IDs and never exposes content", async () => {
    const f = fixture(); await f.request("post", "", input);
    for (const [method, path, body] of [
      ["get", "/not-an-id", undefined], ["get", `/${FIRST_ID}`, undefined],
      ["put", `/${FIRST_ID}`, input], ["delete", `/${FIRST_ID}`, { memberConfirmed: true }],
    ] as const) {
      const response = await f.request(method, path, body, method === "get" && path === "/not-an-id" ? "owner-a" : "owner-b");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Trip not found" });
      expect(JSON.stringify(response.body)).not.toContain(input.title);
    }
    expect((await f.request("get", "", undefined, "owner-b")).body.trips).toEqual([]);
  });

  it("fails closed on tamper or unavailable keys before every direct mutation and never changes the row", async () => {
    const f = fixture(); await f.request("post", "", input);
    f.rows[0]!.encryptedTitle += ".tamper";
    const before = { ...f.rows[0]! }; const mutations = f.mutations();
    for (const requestMethod of ["get", "put", "delete"] as const) {
      const response = await f.request(requestMethod, `/${FIRST_ID}`, requestMethod === "put" ? input : requestMethod === "delete" ? { memberConfirmed: true } : undefined);
      expect(response.statusCode).toBe(409);
      expect(response.body).toMatchObject({ code: "TRIP_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
    expect(f.rows[0]).toEqual(before); expect(f.mutations()).toBe(mutations);
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const unavailable = await f.request("post", "", input);
    expect(unavailable.statusCode).toBe(503);
    expect(f.mutations()).toBe(mutations);
  });

  it("does not create a public route contract or automatic cross-feature use", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../kinfolk-trips.ts", import.meta.url), "utf8"));
    expect(source).toContain("No chat, memory, profile, discovery, provider");
    expect(source).not.toContain("router.get(\"/public");
    expect(source).not.toContain("shareId");
  });
});
