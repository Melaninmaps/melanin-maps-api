import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as journeyPolicy from "../../kinfolk/cultural-journey-policy";
import * as privateCrypto from "../../kinfolk/private-memory-encryption";

type Row = Record<string, any>;
type Predicate = (row: Row) => boolean;

const route = readFileSync(fileURLToPath(new URL("../cultural-journeys.ts", import.meta.url)), "utf8");
const boundedSource = route.slice(route.indexOf("const router: IRouter = Router();"), route.lastIndexOf("export default router;"));
const executable = ts.transpileModule(boundedSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 83).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-cultural-route-v1");
});
afterEach(() => vi.unstubAllEnvs());

function fixture(initial: Row[] = []) {
  const rows: Row[] = initial.map((row): Row => ({
    removedAt: null,
    reflection: null,
    encryptedReflection: null,
    reflectionEncryptionKeyId: null,
    ...row,
  }));
  const table = new Proxy({}, { get: (_target, key) => String(key) });
  const handlers = new Map<string, (req: any, res: any) => Promise<unknown>>();
  const middleware: Array<(req: any, res: any, next: () => void) => void> = [];
  const project = (row: Row, shape?: Row) => shape
    ? Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, row[field as string]]))
    : { ...row };

  function builder(shape?: Row, mode = "select") {
    let predicate: Predicate = () => true;
    let limit = Infinity;
    let update: Row = {};
    const matched = () => rows.filter(predicate).slice(0, limit);
    const query: any = {
      from: () => query,
      where: (condition: Predicate) => { predicate = condition; return query; },
      orderBy: () => query,
      limit: (value: number) => { limit = value; return query; },
      set: (value: Row) => { update = value; return query; },
      values: (value: Row) => { rows.push({ id: `journey-${rows.length + 1}`, removedAt: null, reflection: null, encryptedReflection: null, reflectionEncryptionKeyId: null, ...value }); return query; },
      returning: async (returnShape?: Row) => {
        const result = matched();
        if (mode === "update") result.forEach((row) => Object.assign(row, update));
        return result.map((row) => project(row, returnShape));
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve(matched().map((row) => project(row, shape))).then(resolve, reject),
    };
    return query;
  }

  const db: any = {
    select: (shape?: Row) => builder(shape),
    update: () => builder(undefined, "update"),
    insert: () => builder(undefined, "insert"),
  };
  const router = {
    use: (handler: (req: any, res: any, next: () => void) => void) => { middleware.push(handler); },
    get: (path: string, handler: any) => handlers.set(`get:${path}`, handler),
    post: (path: string, handler: any) => handlers.set(`post:${path}`, handler),
    patch: (path: string, handler: any) => handlers.set(`patch:${path}`, handler),
    delete: (path: string, handler: any) => handlers.set(`delete:${path}`, handler),
  };
  const deps = {
    Router: () => router,
    culturalJourneyEntriesTable: table,
    db,
    pool: { query: async () => ({ rows: [] }) },
    and: (...conditions: Predicate[]): Predicate => (row) => conditions.every((condition) => condition(row)),
    desc: (field: string) => field,
    eq: (field: string, value: unknown): Predicate => (row) => row[field] === value,
    isNull: (field: string): Predicate => (row) => row[field] == null,
    ...journeyPolicy,
    ...privateCrypto,
  };
  new Function(...Object.keys(deps), executable)(...Object.values(deps));

  async function request(method: string, body: Row = {}, owner = "owner-a", id = "entry-a") {
    const res: any = {
      statusCode: 200,
      body: undefined,
      headers: {} as Record<string, string>,
      setHeader(name: string, value: string) { this.headers[name] = value; },
      status(code: number) { this.statusCode = code; return this; },
      json(value: unknown) { this.body = value; return this; },
    };
    const req = { user: owner ? { id: owner } : undefined, body, params: { entryId: id, siteId: id }, log: { error: vi.fn() } };
    middleware.forEach((handler) => handler(req, res, () => undefined));
    await handlers.get(method)!(req, res);
    return res;
  }

  return { rows, request };
}

function entry(patch: Row = {}): Row {
  return {
    id: "entry-a",
    userId: "owner-a",
    culturalSiteId: "site-a",
    siteName: "Example Cultural Site",
    sourceLabel: "Cultural site",
    libraryQuestion: "Example Cultural Site: history, context, and reputable sources",
    reflection: null,
    encryptedReflection: null,
    reflectionEncryptionKeyId: null,
    removedAt: null,
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
    ...patch,
  };
}

function encryptionEntry() {
  return { id: "entry-a", userId: "owner-a" };
}

describe("Cultural Journey encrypted reflection owner route", () => {
  it("encrypts a confirmed owner edit at rest and returns only plaintext reflection with no-store", async () => {
    const f = fixture([entry()]);
    const response = await f.request(
      "patch:/cultural-journeys/entries/:entryId/reflection",
      { memberConfirmed: true, reflection: "A private reflection I confirmed." },
    );
    expect(response.statusCode).toBe(200);
    expect(response.headers["Cache-Control"]).toBe("no-store");
    expect(f.rows[0].reflection).toBe("[Encrypted private memory]");
    expect(f.rows[0].encryptedReflection).toMatch(/^v1\./);
    expect(f.rows[0].reflectionEncryptionKeyId).toBe("synthetic-cultural-route-v1");
    expect(JSON.stringify(f.rows[0])).not.toContain("A private reflection I confirmed.");
    expect(response.body.entry.reflection).toBe("A private reflection I confirmed.");
    expect(response.body.entry).not.toHaveProperty("userId");
    expect(response.body.entry).not.toHaveProperty("encryptedReflection");
    expect(response.body.entry).not.toHaveProperty("reflectionEncryptionKeyId");
  });

  it("displays owner-scoped legacy plaintext unchanged until a confirmed owner correction and makes cross-owner misses generic", async () => {
    const legacy = entry({ reflection: "A legacy private reflection." });
    const f = fixture([legacy]);
    const ownerRead = await f.request("get:/cultural-journeys");
    expect(ownerRead.body.entries[0].reflection).toBe("A legacy private reflection.");
    expect(f.rows[0].reflection).toBe("A legacy private reflection.");

    const otherOwner = await f.request(
      "patch:/cultural-journeys/entries/:entryId/reflection",
      { memberConfirmed: true, reflection: "Never visible or writable." },
      "owner-b",
    );
    expect(otherOwner.statusCode).toBe(404);
    expect(otherOwner.body).toEqual({ error: "Cultural Journey entry not found." });
    expect(f.rows[0].reflection).toBe("A legacy private reflection.");

    const corrected = await f.request(
      "patch:/cultural-journeys/entries/:entryId/reflection",
      { memberConfirmed: true, reflection: "A corrected encrypted reflection." },
    );
    expect(corrected.statusCode).toBe(200);
    expect(f.rows[0].reflection).toBe("[Encrypted private memory]");
    expect(corrected.body.entry.reflection).toBe("A corrected encrypted reflection.");
  });

  it("fails closed without overwriting a tampered or key-unavailable envelope, but allows an explicit clear", async () => {
    const sealed = journeyPolicy.sealCulturalJourneyReflection("Original private reflection.", encryptionEntry());
    const tampered = entry({ ...sealed, encryptedReflection: `${sealed.encryptedReflection}.tampered` });
    const f = fixture([tampered]);
    const before = { ...f.rows[0] };
    const edit = await f.request(
      "patch:/cultural-journeys/entries/:entryId/reflection",
      { memberConfirmed: true, reflection: "Do not overwrite tampered content." },
    );
    expect(edit.statusCode).toBe(409);
    expect(edit.body).toMatchObject({ code: "CULTURAL_JOURNEY_SECURE_ACCESS_REQUIRED", recoverable: true });
    expect(f.rows[0]).toEqual(before);

    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const cleared = await f.request(
      "patch:/cultural-journeys/entries/:entryId/reflection",
      { memberConfirmed: true, reflection: "   " },
    );
    expect(cleared.statusCode).toBe(200);
    expect(f.rows[0]).toMatchObject({ reflection: null, encryptedReflection: null, reflectionEncryptionKeyId: null });
    expect(cleared.body.entry.reflection).toBeNull();
  });

  it("removes an owner row without decrypting key-unavailable or tampered reflection content", async () => {
    const sealed = journeyPolicy.sealCulturalJourneyReflection("Remove without opening this.", encryptionEntry());
    const f = fixture([entry({ ...sealed, encryptedReflection: `${sealed.encryptedReflection}.tampered` })]);
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const response = await f.request(
      "delete:/cultural-journeys/entries/:entryId",
      { memberConfirmed: true },
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(f.rows[0].removedAt).toBeInstanceOf(Date);
  });
});
