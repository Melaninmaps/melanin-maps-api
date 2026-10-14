import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPrivateAvailabilityBlocksRouter,
  type PrivateAvailabilityBlockRepository,
} from "../kinfolk-private-availability-blocks";
import type { StoredPrivateAvailabilityBlock } from "../../kinfolk/private-availability-blocks-policy";

const FIRST_ID = "10000000-0000-4000-8000-000000000111";
const SECOND_ID = "10000000-0000-4000-8000-000000000112";
const input = {
  label: "Synthetic private commitment",
  startAt: "2026-10-20T09:00",
  endAt: "2026-10-20T10:00",
  timeZone: "America/New_York",
  planningOptIn: true,
  memberConfirmed: true,
};

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 79).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-availability-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const rows: StoredPrivateAvailabilityBlock[] = [];
  let mutations = 0;
  const repository: PrivateAvailabilityBlockRepository = {
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
  app.use(createPrivateAvailabilityBlocksRouter({ repository, makeId: () => rows.length ? SECOND_ID : FIRST_ID, now: () => new Date("2026-10-14T00:00:00Z") }));
  return {
    rows,
    request: (method: "get" | "post" | "put" | "delete", path = "", body?: string | object, owner: string | null = "owner-a") => {
      const call = request(app)[method](`/kinfolk/availability-blocks${path}`);
      if (owner) call.set("x-owner", owner);
      return call.send(body);
    },
    mutations: () => mutations,
  };
}

describe("authenticated private Availability Block routes", () => {
  it("requires authentication, no-store, confirms every mutation, and never persists cleartext details", async () => {
    const f = fixture();
    const anonymous = await f.request("get", "", undefined, null);
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.headers["cache-control"]).toBe("no-store");
    expect((await f.request("post", "", { ...input, memberConfirmed: false })).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);

    const created = await f.request("post", "", input);
    expect(created.statusCode).toBe(201);
    expect(created.headers["cache-control"]).toBe("no-store");
    expect(created.body.availabilityBlock).toMatchObject({
      id: FIRST_ID,
      label: input.label,
      startAt: input.startAt,
      endAt: input.endAt,
      timeZone: input.timeZone,
      planningOptIn: input.planningOptIn,
    });
    expect(JSON.stringify(created.body)).not.toMatch(/encrypted|keyId|userId|placeholder/i);
    for (const field of ["label", "startAt", "endAt", "timeZone"] as const) {
      expect(f.rows[0]![field]).toBe("[Encrypted private memory]");
      expect(JSON.stringify(f.rows[0])).not.toContain(input[field]);
    }
    expect((await f.request("get", "")).body.availabilityBlocks).toHaveLength(1);
    expect((await f.request("get", `/${FIRST_ID}`)).body.availabilityBlock.label).toBe(input.label);
  });

  it("rejects malformed intervals/time zones before mutation and keeps malformed or cross-owner IDs generic", async () => {
    const f = fixture();
    for (const body of [
      { ...input, timeZone: "UTC" },
      { ...input, startAt: "2026-10-20T10:00", endAt: "2026-10-20T09:00" },
      { ...input, startAt: "invalid" },
    ]) expect((await f.request("post", "", body)).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);
    await f.request("post", "", input);
    for (const [method, path, body] of [
      ["get", "/not-an-id", undefined],
      ["get", `/${FIRST_ID}`, undefined],
      ["put", `/${FIRST_ID}`, input],
      ["delete", `/${FIRST_ID}`, { memberConfirmed: true }],
    ] as const) {
      const response = await f.request(method, path, body, method === "get" && path === "/not-an-id" ? "owner-a" : "owner-b");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Availability block not found" });
      expect(JSON.stringify(response.body)).not.toContain(input.label);
    }
    expect((await f.request("get", "", undefined, "owner-b")).body.availabilityBlocks).toEqual([]);
  });

  it("returns only a safe opted-in conflict summary for a confirmed owner preview", async () => {
    const f = fixture();
    await f.request("post", "", input);
    await f.request("post", "", { ...input, label: "Synthetic opt-out", planningOptIn: false });
    const overlap = await f.request("post", "/preview", {
      startAt: "2026-10-20T09:30", endAt: "2026-10-20T09:45", timeZone: input.timeZone, memberConfirmed: true,
    });
    expect(overlap.statusCode).toBe(200);
    expect(overlap.headers["cache-control"]).toBe("no-store");
    expect(overlap.body).toEqual({ hasConflict: true, conflictCount: 1 });
    expect(JSON.stringify(overlap.body)).not.toContain(input.label);
    expect(JSON.stringify(overlap.body)).not.toContain(input.startAt);
    expect((await f.request("post", "/preview", {
      startAt: "2026-10-20T09:30", endAt: "2026-10-20T09:45", timeZone: input.timeZone, memberConfirmed: true,
    }, "owner-b")).body).toEqual({ hasConflict: false, conflictCount: 0 });
    expect((await f.request("post", "/preview", { startAt: "invalid", endAt: input.endAt, timeZone: input.timeZone, memberConfirmed: true })).statusCode).toBe(400);
    expect((await f.request("post", "/preview", { startAt: input.startAt, endAt: input.endAt, timeZone: input.timeZone, memberConfirmed: false })).statusCode).toBe(400);
  });

  it("updates/revokes/deletes only after confirmation and fails closed before every mutation or preview when crypto is tampered", async () => {
    const f = fixture(); await f.request("post", "", input);
    const revoked = await f.request("put", `/${FIRST_ID}`, { ...input, label: "Synthetic revised commitment", planningOptIn: false });
    expect(revoked.body.availabilityBlock).toMatchObject({ label: "Synthetic revised commitment", planningOptIn: false });
    expect((await f.request("post", "/preview", {
      startAt: "2026-10-20T09:30", endAt: "2026-10-20T09:45", timeZone: input.timeZone, memberConfirmed: true,
    })).body).toEqual({ hasConflict: false, conflictCount: 0 });
    await f.request("post", "", { ...input, label: "Synthetic disposable commitment" });
    expect((await f.request("delete", `/${SECOND_ID}`, { memberConfirmed: true })).body).toEqual({ removed: true });
    expect(f.rows).toHaveLength(1);
    const beforeUnconfirmedDelete = f.mutations();
    expect((await f.request("delete", `/${FIRST_ID}`, {})).statusCode).toBe(400);
    expect(f.mutations()).toBe(beforeUnconfirmedDelete);
    f.rows[0] = { ...f.rows[0]!, encryptedLabel: `${f.rows[0]!.encryptedLabel}.tamper` };
    const before = { ...f.rows[0]! }; const mutations = f.mutations();
    for (const [method, path, body] of [
      ["get", `/${FIRST_ID}`, undefined],
      ["put", `/${FIRST_ID}`, input],
      ["delete", `/${FIRST_ID}`, { memberConfirmed: true }],
      ["post", "/preview", { startAt: input.startAt, endAt: input.endAt, timeZone: input.timeZone, memberConfirmed: true }],
    ] as const) {
      const response = await f.request(method, path, body);
      expect(response.statusCode).toBe(409);
      expect(response.body).toMatchObject({ code: "PRIVATE_AVAILABILITY_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
    expect(f.rows[0]).toEqual(before); expect(f.mutations()).toBe(mutations);
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect((await f.request("post", "", input)).statusCode).toBe(503);
    expect(f.mutations()).toBe(mutations);
  });

  it("does not add a public route, provider use, automatic chat use, or client storage", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../kinfolk-private-availability-blocks.ts", import.meta.url), "utf8"));
    const aggregateRoutes = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../index.ts", import.meta.url), "utf8"));
    expect(source).toContain("never reads, connects, syncs, or blocks any");
    expect(source).toContain("no public/shared route");
    expect(source).not.toContain("router.get(\"/public");
    expect(source).not.toContain("api/kinfolk/chat");
    expect(source).not.toContain("AsyncStorage");
    expect(aggregateRoutes).toContain('import kinfolkPrivateAvailabilityBlocksRouter from "./kinfolk-private-availability-blocks";');
    expect(aggregateRoutes).toContain("router.use(kinfolkPrivateAvailabilityBlocksRouter);");
  });
});
