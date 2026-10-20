import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as memoryCrypto from "../private-memory-encryption";
import * as sensitiveCrypto from "../sensitive-memory-encryption";
import * as policy from "../private-memory-policy";
import { sensitiveMemoryTopic } from "../sensitive-memory";
import { isExplicitMemberMemoryRequirement } from "../explicit-member-memory";
import { buildExplicitMemoryConsentPlan } from "../explicit-memory-consent";

// Execute the exact bounded route-handler source, not a rewritten model of the route.
// Importing the full app would load startup/DB/provider services and is intentionally forbidden here.
const route = readFileSync(fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)), "utf8");
const between = (start: string, end: string) => route.slice(route.indexOf(start), route.indexOf(end, route.indexOf(start)));
const boundedSource = between("class PrivateMemoryCapacityError", 'router.get("/kinfolk/sensitive-memory-vault"') +
  between('router.get("/kinfolk/memories"', "async function resolveOwnerKinfolkMemoryAccess");
const executable = ts.transpileModule(boundedSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
type Row = Record<string, any>;
type Predicate = (row: Row) => boolean;

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 23).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture(initial: Row[] = [], initialSettings: Row[] = [], sensitiveReauthAllowed = true) {
  const rows: Row[] = initial.map((row) => ({ pausedAt: null, revokedAt: null, expiresAt: null, isSensitive: false, ...row }));
  const settings: Row[] = initialSettings.map((row) => ({ ...row }));
  const table = new Proxy({}, { get: (_target, key) => String(key) });
  const settingsTable = new Proxy({}, { get: (_target, key) => String(key) });
  const sensitiveReauth = vi.fn(async () => sensitiveReauthAllowed);
  const project = (row: Row, shape?: Row) => shape ? Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, row[field]])) : { ...row };
  function builder(shape?: Row, mode = "select", source: object = table) {
    let predicate: Predicate = () => true;
    let limit = Infinity;
    let offset = 0;
    let update: Row = {};
    let inserted: Row[] = [];
    const current = (): Row[] => source === settingsTable ? settings : rows;
    const matched = () => current().filter(predicate).slice(offset, offset + limit);
    const query: any = {
      from: (target: object) => { source = target; return query; },
      where: (condition: Predicate) => { predicate = condition; return query; },
      orderBy: () => query,
      limit: (value: number) => { limit = value; return query; },
      offset: (value: number) => { offset = value; return query; },
      set: (value: Row) => { update = value; return query; },
      values: (value: Row) => {
        inserted = [{ id: `synthetic-${current().length + 1}`, pausedAt: null, revokedAt: null, expiresAt: null, createdAt: new Date(), updatedAt: new Date(), ...value }];
        return query;
      },
      onConflictDoUpdate: () => query,
      returning: async (returnShape?: Row) => {
        const result = mode === "insert" ? inserted : matched();
        if (mode === "insert") current().push(...inserted);
        if (mode === "update") result.forEach((row) => Object.assign(row, update));
        return result.map((row) => project(row, returnShape));
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => {
        if (mode === "insert") current().push(...inserted);
        const count = shape && ["activeCount", "active", "total"].find((key) => key in shape);
        const result = count ? [{ [count]: matched().length }] : matched().map((row) => project(row, shape));
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  }
  const db: any = {
    select: (shape?: Row) => builder(shape),
    update: (source: object) => builder(undefined, "update", source),
    insert: (source: object) => builder(undefined, "insert", source),
    execute: async () => undefined,
    transaction: async (write: (tx: unknown) => Promise<unknown>) => {
      const beforeRows = rows.map((row) => ({ ...row }));
      const beforeSettings = settings.map((row) => ({ ...row }));
      try { return await write(db); }
      catch (error) { rows.splice(0, rows.length, ...beforeRows); settings.splice(0, settings.length, ...beforeSettings); throw error; }
    },
  };
  const handlers = new Map<string, (req: any, res: any) => Promise<unknown>>();
  const router = Object.fromEntries(["get", "post", "patch", "delete"].map((method) => [method, (path: string, handler: any) => handlers.set(`${method}:${path}`, handler)]));
  const deps = {
    router, db, kinfolkPrivateMemoriesTable: table, userSettingsTable: settingsTable,
    ...memoryCrypto, ...sensitiveCrypto, ...policy,
    sensitiveMemoryTopic, isExplicitMemberMemoryRequirement, buildExplicitMemoryConsentPlan,
    eq: (key: string, value: unknown): Predicate => (row) => row[key] === value,
    ne: (key: string, value: unknown): Predicate => (row) => row[key] !== value,
    gt: (key: string, value: Date): Predicate => (row) => row[key] > value,
    isNull: (key: string): Predicate => (row) => row[key] == null,
    inArray: (key: string, values: unknown[]): Predicate => (row) => values.includes(row[key]),
    and: (...conditions: Predicate[]): Predicate => (row) => conditions.every((condition) => condition(row)),
    or: (...conditions: Predicate[]): Predicate => (row) => conditions.some((condition) => condition(row)),
    desc: (key: string) => key, sql: () => "synthetic-expression",
    PREFERRED_NAME_MEMORY_PURPOSE: "preferred_name",
    isKinfolkPrivateMemoryEnabled: () => true, isExplicitMemberMemoryEnabled: () => true,
    resolveOwnerExplicitMemberMemoryAccess: async () => true,
    requireSensitiveMemoryVaultReauth: sensitiveReauth,
    invalidatePrefsCache: () => undefined, invalidateSessionsCache: () => undefined,
    safeKinfolkErrorMetadata: () => ({ errorClass: "synthetic-error" }),
    KINFOLK_CONTINUITY_DISCLOSURE_VERSION: "synthetic-disclosure",
  };
  new Function(...Object.keys(deps), executable)(...Object.values(deps));
  const logs = vi.fn();
  async function request(method: string, body: Row = {}, owner: string | null = "owner-a", id = "note-a") {
    const res: any = { statusCode: 200, body: undefined, status(code: number) { this.statusCode = code; return this; }, json(value: unknown) { this.body = value; return this; } };
    const req = { user: owner ? { id: owner } : undefined, body, query: {}, params: { id }, log: { error: logs } };
    await handlers.get(method)!(req, res);
    return res;
  }
  return { rows, settings, request, logs, sensitiveReauth };
}

const note = "I prefer quiet coffee shops for work meetings.";
const encryptedRow = () => ({ id: "note-a", userId: "owner-a", purpose: "preference", ...memoryCrypto.encryptOrdinaryMemoryContent(note, "owner-a", "preference") });

describe("bounded memory route execution with synthetic owner-scoped storage", () => {
  it("requires authentication and consent, encrypts a new write, and preserves duplicate/capacity behavior without exposing tokens", async () => {
    const f = fixture();
    expect((await f.request("post:/kinfolk/memories", { content: note, consent: true }, null)).statusCode).toBe(401);
    expect((await f.request("post:/kinfolk/memories", { content: note })).statusCode).toBe(400);
    const first = await f.request("post:/kinfolk/memories", { content: note, consent: true, purpose: "preference" });
    expect(first.statusCode).toBe(201);
    expect(f.rows).toHaveLength(1);
    expect(f.rows[0].content).toBe("[Encrypted private memory]");
    expect(first.body.memory.content).toBe(note);
    expect(first.body.memory).not.toHaveProperty("contentFingerprint");
    expect(first.body.memory).not.toHaveProperty("encryptedContent");
    const duplicate = await f.request("post:/kinfolk/memories", { content: note, consent: true, purpose: "preference" });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.body.alreadySaved).toBe(true);
    expect(f.rows).toHaveLength(1);
    await f.request("post:/kinfolk/memories", { content: note, consent: true, purpose: "preference" }, "owner-b");
    expect(f.rows).toHaveLength(2);
    expect(f.rows[0].contentFingerprint).not.toBe(f.rows[1].contentFingerprint);
  });

  it("encrypts inline selected consent without inferring continuity settings and rolls back content writes if encryption is unavailable", async () => {
    const message = "Remember that I prefer quiet coffee shops for work meetings.";
    const selectedIds = buildExplicitMemoryConsentPlan(message)!.ordinary.map((item) => item.id);
    const settingsCases = [
      [],
      [{
        userId: "owner-a",
        kinfolkMemoryEnabled: false,
        kinfolkContinuityEnabled: false,
        kinfolkContinuityDisclosureDecision: "declined",
        kinfolkContinuityDisclosureVersion: "existing-declined-v1",
        kinfolkContinuityDisclosedAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      }],
      [{
        userId: "owner-a",
        kinfolkMemoryEnabled: true,
        kinfolkContinuityEnabled: false,
        kinfolkContinuityDisclosureDecision: "accepted",
        kinfolkContinuityDisclosureVersion: "existing-disabled-v1",
        kinfolkContinuityDisclosedAt: "2026-10-02T00:00:00.000Z",
        updatedAt: "2026-10-02T00:00:00.000Z",
      }],
    ];
    for (const initialSettings of settingsCases) {
      const f = fixture([], initialSettings);
      const settingsBefore = JSON.stringify(f.settings);
      const response = await f.request("post:/kinfolk/memory-consent", { message, selectedIds, consent: true });
      expect(response.statusCode).toBe(201);
      expect(f.rows[0].content).toBe("[Encrypted private memory]");
      expect(memoryCrypto.readOrdinaryMemoryContent(f.rows[0] as any, "owner-a")).toContain("quiet coffee");
      expect(JSON.stringify(f.settings)).toBe(settingsBefore);
    }
    const failed = fixture();
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const unavailable = await failed.request("post:/kinfolk/memory-consent", { message, selectedIds, consent: true });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.body.recoverable).toBe(true);
    expect(failed.rows).toEqual([]);
    expect(failed.settings).toEqual([]);
    expect(failed.logs).not.toHaveBeenCalled();
  });

  it("keeps sensitive item reauthentication separate from continuity settings", async () => {
    const message = "Remember that I have a peanut allergy.";
    const selectedIds = buildExplicitMemoryConsentPlan(message)!.sensitive.map((item) => item.id);
    const f = fixture([], [{
      userId: "owner-a",
      kinfolkMemoryEnabled: false,
      kinfolkContinuityEnabled: false,
      kinfolkContinuityDisclosureDecision: "declined",
    }], false);
    const settingsBefore = JSON.stringify(f.settings);

    await f.request("post:/kinfolk/memory-consent", {
      message,
      selectedIds,
      consent: true,
      sensitiveConsent: true,
    });

    expect(f.sensitiveReauth).toHaveBeenCalledTimes(1);
    expect(f.rows).toEqual([]);
    expect(JSON.stringify(f.settings)).toBe(settingsBefore);
  });

  it("reads/deduplicates legacy only for its owner and converts it only on explicit owner correction", async () => {
    const legacy = { id: "note-a", userId: "owner-a", content: note, purpose: "preference" };
    const f = fixture([legacy]);
    expect((await f.request("get:/kinfolk/memories", {}, "owner-b")).body.memories).toEqual([]);
    expect((await f.request("get:/kinfolk/memories")).body.memories[0].content).toBe(note);
    expect(f.rows[0].content).toBe(note);
    expect((await f.request("post:/kinfolk/memories", { content: note, consent: true })).body.alreadySaved).toBe(true);
    expect(f.rows[0].content).toBe(note);
    expect((await f.request("patch:/kinfolk/memories/:id", { content: "I prefer quiet tea shops." }, "owner-b")).statusCode).toBe(404);
    const corrected = await f.request("patch:/kinfolk/memories/:id", { content: "I prefer quiet tea shops." });
    expect(corrected.statusCode).toBe(200);
    expect(f.rows[0].content).toBe("[Encrypted private memory]");
    expect(corrected.body.memory.content).toBe("I prefer quiet tea shops.");
    expect(f.rows[0].purpose).toBe("preference");
  });

  it("fails closed without logs or storage mutation for tampered owner reads, edits, and pause operations", async () => {
    const row = encryptedRow();
    row.encryptedContent += ".tampered";
    const f = fixture([row]);
    const before = f.rows.map((memory) => ({ ...memory }));
    for (const [method, body] of [
      ["get:/kinfolk/memories", {}],
      ["patch:/kinfolk/memories/:id", { content: "I prefer quiet tea shops." }],
      ["patch:/kinfolk/memories/:id/pause", { paused: true }],
    ] as const) {
      const response = await f.request(method, body);
      expect(response.statusCode).toBe(409);
      expect(response.body).toMatchObject({ code: "PRIVATE_MEMORY_SECURE_ACCESS_REQUIRED", recoverable: true });
      expect(f.rows).toEqual(before);
    }
    expect(f.logs).not.toHaveBeenCalled();
  });

  it("preserves owner-scoped pause/resume/revoke, inactive list boundaries and key-independent forgetting", async () => {
    const f = fixture([encryptedRow()]);
    expect((await f.request("patch:/kinfolk/memories/:id/pause", { paused: true }, "owner-b")).statusCode).toBe(404);
    expect((await f.request("patch:/kinfolk/memories/:id/pause", { paused: true })).statusCode).toBe(200);
    expect(f.rows[0].pausedAt).toBeInstanceOf(Date);
    expect((await f.request("get:/kinfolk/memories")).body.memories).toEqual([]);
    expect((await f.request("patch:/kinfolk/memories/:id/pause", { paused: false })).statusCode).toBe(200);
    expect(f.rows[0].pausedAt).toBeNull();
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const before = { ...f.rows[0] };
    expect((await f.request("patch:/kinfolk/memories/:id", { content: "I prefer quiet tea shops." })).statusCode).toBe(503);
    expect(f.rows[0]).toEqual(before);
    expect((await f.request("delete:/kinfolk/memories/:id", {}, "owner-b")).statusCode).toBe(404);
    expect((await f.request("delete:/kinfolk/memories/:id")).statusCode).toBe(200);
    expect(f.rows[0].revokedAt).toBeInstanceOf(Date);
    expect((await f.request("get:/kinfolk/memories")).body.memories).toEqual([]);
  });
});
