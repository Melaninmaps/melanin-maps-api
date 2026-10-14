import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as policy from "../current-chapter-policy";
import * as crypto from "../private-memory-encryption";
import { isSensitiveChapterKind, parseCurrentChapterKind } from "@workspace/constants";

// Execute exact route source against bounded in-memory adapters. Never import the
// application, startup, real DB, session/provider clients, or run migration DDL.
const source = readFileSync(fileURLToPath(new URL("../../routes/kinfolk-current-chapters.ts", import.meta.url)), "utf8");
const bounded = source.split("// BEGIN BOUNDED CURRENT CHAPTER ROUTES")[1]!.split("// END BOUNDED CURRENT CHAPTER ROUTES")[0]!;
const executable = ts.transpileModule(bounded, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
type Row = Record<string, any>;
type Predicate = (row: Row) => boolean;
const ID = "10000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 29).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-chapter-routes-v1");
});
afterEach(() => vi.unstubAllEnvs());
function fixture() {
  const rows: Row[] = []; let unlocked = false; let seq = 0; let mutations = 0;
  const table = new Proxy({}, { get: (_target, key) => String(key) });
  const assertTable = (target: object) => expect(target).toBe(table); // No stable/preference writes.
  const builder = (mode: string) => {
    let predicate: Predicate = () => true; let limit = Infinity; let values: Row = {}; let changes: Row = {};
    const execute = () => {
      if (mode === "insert") { mutations++; rows.push({ ...values }); return [{ ...values }]; }
      const selected = rows.filter(predicate).slice(0, limit);
      if (mode === "update") { mutations++; selected.forEach((row) => Object.assign(row, changes)); }
      if (mode === "delete") { mutations++; for (const row of selected) rows.splice(rows.indexOf(row), 1); }
      return selected.map((row) => ({ ...row }));
    };
    const query: any = {
      from: (target: object) => { assertTable(target); return query; },
      where: (condition: Predicate) => { predicate = condition; return query; },
      orderBy: () => query, for: (lock: string) => { expect(lock).toBe("update"); return query; },
      limit: (count: number) => { limit = count; return query; },
      values: (row: Row) => { values = row; return query; }, set: (row: Row) => { changes = row; return query; },
      returning: async () => execute(), then: (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject),
    };
    return query;
  };
  const db: any = {
    select: () => builder("select"), insert: (target: object) => { assertTable(target); return builder("insert"); },
    update: (target: object) => { assertTable(target); return builder("update"); }, delete: (target: object) => { assertTable(target); return builder("delete"); },
    transaction: async (operation: (tx: any) => Promise<unknown>) => {
      const before = rows.map((row) => ({ ...row })); const count = mutations;
      try { return await operation(db); } catch (error) { rows.splice(0, rows.length, ...before); mutations = count; throw error; }
    },
  };
  const handlers = new Map<string, (req: any, res: any) => Promise<void>>();
  const router = Object.fromEntries(["get", "post", "patch", "delete"].map((method) => [method, (path: string, handler: any) => handlers.set(`${method}:${path}`, handler)]));
  const gates = vi.fn(async (_req: unknown, res: any) => {
    if (unlocked) return true;
    res.status(403).json({ code: "SENSITIVE_MEMORY_REAUTH_REQUIRED" }); return false;
  });
  const deps = { router, db, kinfolkCurrentChaptersTable: table, ...policy, ...crypto, isSensitiveChapterKind, parseCurrentChapterKind,
    randomUUID: () => `10000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`,
    eq: (key: string, value: unknown): Predicate => (row) => row[key] === value,
    and: (...conditions: Predicate[]): Predicate => (row) => conditions.every((condition) => condition(row)), desc: (key: string) => key,
    requireSensitiveMemoryVaultReauth: gates, sensitiveMemoryVaultReauthState: async () => ({ reauthenticated: unlocked }),
  };
  new Function(...Object.keys(deps), executable)(...Object.values(deps));
  async function request(method: string, body: Row = {}, userId: string | null = "owner-a", id = ID) {
    const res: any = { statusCode: 200, headers: {}, status(code: number) { this.statusCode = code; return this; }, setHeader(key: string, value: string) { this.headers[key] = value; }, json(value: unknown) { this.body = value; return this; } };
    await handlers.get(`${method}:/kinfolk/current-chapters${method === "patch" || method === "delete" ? "/:id" : method === "end" ? "/:id/end" : ""}`)?.({ user: userId ? { id: userId } : undefined, body, params: { id } }, res);
    return res;
  }
  // End is a POST route, deliberately distinct from the create POST.
  async function end(body: Row = {}, userId: string | null = "owner-a", id = ID) {
    const res: any = { statusCode: 200, headers: {}, status(code: number) { this.statusCode = code; return this; }, setHeader(key: string, value: string) { this.headers[key] = value; }, json(value: unknown) { this.body = value; return this; } };
    await handlers.get("post:/kinfolk/current-chapters/:id/end")!({ user: userId ? { id: userId } : undefined, body, params: { id } }, res); return res;
  }
  return { rows, request, end, gates, unlock: () => { unlocked = true; }, lock: () => { unlocked = false; }, mutations: () => mutations };
}
const input = (patch: Row = {}) => ({ kind: "career_change", note: "Synthetic private chapter", memberConfirmed: true, ...patch });

describe("bounded Current Chapter owner route adapter", () => {
  it("requires authentication and explicit create/update/end confirmation with no implicit inference", async () => {
    const f = fixture();
    for (const method of ["get", "post", "patch", "delete"]) expect((await f.request(method, input(), null)).statusCode).toBe(401);
    expect((await f.end({ memberConfirmed: true }, null)).statusCode).toBe(401);
    for (const memberConfirmed of [undefined, false, "true", 1]) expect((await f.request("post", input({ memberConfirmed }))).statusCode).toBe(400);
    expect((await f.request("post", { note: "I am pregnant", memberConfirmed: true })).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);
    await f.request("post", input());
    expect((await f.request("patch", input({ memberConfirmed: false }))).statusCode).toBe(400);
    expect((await f.end()).statusCode).toBe(400);
    expect(f.mutations()).toBe(1);
  });
  it("creates encrypted owner-only view, edits independently of stable preferences, ends dated history, edits history and removes", async () => {
    const f = fixture(); const create = await f.request("post", input({ allowRelevantUse: true }));
    expect(create.statusCode).toBe(201); expect(create.body.chapter.note).toBe("Synthetic private chapter");
    expect(create.headers["Cache-Control"]).toBe("no-store");
    for (const field of ["userId", "encryptedContent", "encryptionKeyId", "contentFingerprint"]) expect(create.body.chapter).not.toHaveProperty(field);
    expect(f.rows[0].note).toBe("[Encrypted private memory]"); expect(JSON.stringify(f.rows)).not.toContain("Synthetic private chapter");
    const start = f.rows[0].startedAt; const created = f.rows[0].createdAt;
    const edit = await f.request("patch", input({ kind: "relocation", note: "Synthetic move", allowRelevantUse: false }));
    expect(edit.body.chapter.kind).toBe("relocation"); expect(edit.body.chapter.allowRelevantUse).toBe(false);
    expect(f.rows[0].startedAt).toEqual(start); expect(f.rows[0].createdAt).toEqual(created);
    const ended = await f.end({ memberConfirmed: true }); expect(ended.body.chapter.endedAt).toBeInstanceOf(Date);
    const endedAt = f.rows[0].endedAt; await f.end({ memberConfirmed: true }); expect(f.rows[0].endedAt).toEqual(endedAt);
    const history = await f.request("get"); expect(history.body.chapters).toHaveLength(1); expect(history.body.chapters[0].endedAt).toEqual(endedAt);
    await f.request("patch", input({ kind: "relocation", note: "Edited history" })); expect(f.rows[0].endedAt).toEqual(endedAt); expect(f.rows[0].startedAt).toEqual(start);
    expect((await f.request("delete")).body.removed).toBe(true); expect(f.rows).toEqual([]); expect((await f.request("get")).body.chapters).toEqual([]);
  });
  it("isolates two owners and returns 404 for all direct cross-owner operations", async () => {
    const f = fixture(); await f.request("post", input());
    expect((await f.request("get", {}, "owner-b")).body.chapters).toEqual([]);
    for (const method of ["patch", "delete"]) expect((await f.request(method, input(), "owner-b")).statusCode).toBe(404);
    expect((await f.end({ memberConfirmed: true }, "owner-b")).statusCode).toBe(404);
    expect(f.mutations()).toBe(1);
    await f.request("post", input({ note: "Second owner" }), "owner-b");
    expect((await f.request("get", {}, "owner-a")).body.chapters).toHaveLength(1);
    expect((await f.request("get", {}, "owner-b")).body.chapters[0].note).toBe("Second owner");
  });
  it("does not auto-detect sensitive note words on an explicit non-sensitive category", async () => {
    const f = fixture(); expect((await f.request("post", input({ kind: "other", note: "pregnancy fertility loss health" }))).statusCode).toBe(201);
    expect(f.rows[0].isSensitive).toBe(false); expect(f.gates).not.toHaveBeenCalled();
  });
  it.each(["health_support", "fertility", "pregnancy", "pregnancy_loss", "later_pregnancy", "grief"])("requires sensitive confirmation and existing server-side reauth for %s", async (kind) => {
    const f = fixture();
    expect((await f.request("post", input({ kind }))).statusCode).toBe(400);
    expect((await f.request("post", input({ kind, sensitiveConfirmed: true }))).statusCode).toBe(403); expect(f.rows).toEqual([]);
    f.unlock(); expect((await f.request("post", input({ kind, sensitiveConfirmed: true }))).statusCode).toBe(201);
    f.lock(); const locked = (await f.request("get")).body.chapters[0]; expect(locked).toMatchObject({ vaultLocked: true, kind: null, note: null });
    const before = { ...f.rows[0] };
    expect((await f.request("patch", input({ kind, sensitiveConfirmed: true }))).statusCode).toBe(403);
    expect((await f.end({ memberConfirmed: true })).statusCode).toBe(403);
    expect((await f.request("delete")).statusCode).toBe(403); expect(f.rows[0]).toEqual(before);
    f.unlock(); expect((await f.request("get")).body.chapters[0].note).toBe("Synthetic private chapter");
    expect((await f.request("patch", input({ kind: "career_change" }))).statusCode).toBe(400);
    expect((await f.request("patch", input({ kind: "career_change", sensitiveConfirmed: true }))).statusCode).toBe(200);
    expect(f.rows[0].isSensitive).toBe(false);
  });
  it("requires reauth when converting a non-sensitive chapter into a sensitive one", async () => {
    const f = fixture(); await f.request("post", input()); const before = { ...f.rows[0] };
    expect((await f.request("patch", input({ kind: "pregnancy", sensitiveConfirmed: true }))).statusCode).toBe(403); expect(f.rows[0]).toEqual(before);
    f.unlock(); expect((await f.request("patch", input({ kind: "pregnancy", sensitiveConfirmed: true }))).statusCode).toBe(200);
  });
  it.each(["legacy", "missing-envelope", "tamper", "missing-key"])("fails closed before every direct mutation for %s and preserves the record", async (failure) => {
    const f = fixture(); await f.request("post", input());
    if (failure === "legacy") Object.assign(f.rows[0], { note: "legacy private plaintext", encryptedContent: "", encryptionKeyId: "" });
    if (failure === "missing-envelope") f.rows[0].encryptedContent = "";
    if (failure === "tamper") f.rows[0].encryptedContent += ".tamper";
    if (failure === "missing-key") delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const before = { ...f.rows[0] }; const count = f.mutations();
    for (const response of [await f.request("get"), await f.request("patch", input()), await f.end({ memberConfirmed: true }), await f.request("delete")]) {
      expect(response.statusCode).toBe(failure === "missing-key" ? 503 : 409);
      expect(response.body).toMatchObject({ recoverable: true, code: "CURRENT_CHAPTER_SECURE_ACCESS_REQUIRED" });
      expect(JSON.stringify(response.body)).not.toContain("legacy private plaintext");
    }
    expect(f.rows[0]).toEqual(before); expect(f.mutations()).toBe(count);
  });
  it("fails closed before create on missing crypto even when no note is provided", async () => {
    const f = fixture(); delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect((await f.request("post", { kind: "other", memberConfirmed: true })).statusCode).toBe(503);
    expect(f.rows).toEqual([]); expect(f.mutations()).toBe(0);
  });
  it("rejects invalid IDs and client owner/start/end injections without mutation", async () => {
    const f = fixture(); await f.request("post", input());
    expect((await f.request("patch", input(), "owner-a", "bad-id")).statusCode).toBe(404);
    for (const patch of [{ userId: "owner-b" }, { startedAt: "2020" }, { endedAt: null }, { kind: "loss" }]) expect((await f.request("patch", input(patch))).statusCode).toBe(400);
    expect(f.mutations()).toBe(1);
  });
});
