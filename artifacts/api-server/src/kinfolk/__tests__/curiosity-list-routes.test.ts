import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import * as policy from "../curiosity-list-policy";
import * as crypto from "../private-memory-encryption";

const source = readFileSync(fileURLToPath(new URL("../../routes/kinfolk-curiosity-lists.ts", import.meta.url)), "utf8");
const bounded = source.split("// BEGIN BOUNDED CURIOSITY LIST ROUTES")[1]!.split("// END BOUNDED CURIOSITY LIST ROUTES")[0]!;
const executable = ts.transpileModule(bounded, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
type Row = Record<string, any>; type Predicate = (row: Row) => boolean;
const LIST_ID = "10000000-0000-4000-8000-000000000001";
const ITEM_A = "10000000-0000-4000-8000-000000000002";
const ITEM_B = "10000000-0000-4000-8000-000000000003";
beforeEach(() => { vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 43).toString("base64")); vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-curiosity-route-v1"); });
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const lists: Row[] = []; const items: Row[] = []; let sequence = 0; let mutations = 0;
  const listTable = new Proxy({}, { get: (_target, key) => String(key) }); const itemTable = new Proxy({}, { get: (_target, key) => String(key) });
  const tableRows = (table: object) => table === listTable ? lists : items;
  const builder = (mode: "select" | "insert" | "update" | "delete", table?: object) => {
    let target = table; let predicate: Predicate = () => true; let values: Row = {}; let changes: Row = {}; let limit = Infinity; let sortKey: string | null = null;
    const run = () => {
      const rows = tableRows(target!); let selected = rows.filter(predicate); if (sortKey) selected = [...selected].sort((a, b) => (a[sortKey!] < b[sortKey!] ? -1 : a[sortKey!] > b[sortKey!] ? 1 : 0)); selected = selected.slice(0, limit);
      if (mode === "insert") { mutations++; rows.push({ ...values }); return [{ ...values }]; }
      if (mode === "update") { mutations++; selected.forEach((row) => Object.entries(changes).forEach(([key, value]) => { row[key] = value === "__offset_position__" ? row.position + 1000000 : value; })); }
      if (mode === "delete") { mutations++; selected.forEach((row) => rows.splice(rows.indexOf(row), 1)); }
      return selected.map((row) => ({ ...row }));
    };
    const query: any = { from: (next: object) => { target = next; return query; }, where: (next: Predicate) => { predicate = next; return query; }, orderBy: (key: string) => { sortKey = key; return query; }, for: () => query, limit: (next: number) => { limit = next; return query; }, values: (next: Row) => { values = next; return query; }, set: (next: Row) => { changes = next; return query; }, returning: async () => run(), then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject) };
    return query;
  };
  const db: any = { select: () => builder("select"), insert: (table: object) => builder("insert", table), update: (table: object) => builder("update", table), delete: (table: object) => builder("delete", table), execute: async () => undefined, transaction: async (operation: (tx: any) => Promise<unknown>) => { const before = { lists: lists.map((row) => ({ ...row })), items: items.map((row) => ({ ...row })), mutations }; try { return await operation(db); } catch (error) { lists.splice(0, lists.length, ...before.lists); items.splice(0, items.length, ...before.items); mutations = before.mutations; throw error; } } };
  const handlers = new Map<string, (req: any, res: any) => Promise<void>>(); const router = Object.fromEntries(["get", "post", "patch", "put", "delete"].map((method) => [method, (path: string, handler: any) => handlers.set(`${method}:${path}`, handler)]));
  const deps = { router, db, kinfolkCuriosityListsTable: listTable, kinfolkCuriosityListItemsTable: itemTable, ...policy, ...crypto, randomUUID: () => [LIST_ID, ITEM_A, ITEM_B][sequence++]!, and: (...conditions: Predicate[]) => (row: Row) => conditions.every((condition) => condition(row)), eq: (key: string, value: unknown) => (row: Row) => row[key] === value, asc: (key: string) => key, sql: (_parts: TemplateStringsArray) => "__offset_position__" };
  new Function(...Object.keys(deps), executable)(...Object.values(deps));
  async function call(key: string, body: Row = {}, userId: string | null = "owner-a", params: Row = { listId: LIST_ID, itemId: ITEM_A }) { const res: any = { statusCode: 200, headers: {}, status(code: number) { this.statusCode = code; return this; }, setHeader(key: string, value: string) { this.headers[key] = value; }, json(value: unknown) { this.body = value; return this; } }; await handlers.get(key)?.({ user: userId ? { id: userId } : undefined, body, params }, res); return res; }
  return { lists, items, call, mutations: () => mutations };
}
const listInput = (patch: Row = {}) => ({ name: "My textile questions", memberConfirmed: true, ...patch });
const itemInput = (text: string, patch: Row = {}) => ({ text, memberConfirmed: true, ...patch });

describe("bounded private Curiosity List routes", () => {
  it("requires authentication and explicit member confirmation", async () => {
    const f = fixture(); expect((await f.call("get:/kinfolk/curiosity-lists", {}, null)).statusCode).toBe(401);
    expect((await f.call("post:/kinfolk/curiosity-lists", listInput({ memberConfirmed: false }))).statusCode).toBe(400);
    expect((await f.call("post:/kinfolk/curiosity-lists", listInput({ userId: "owner-b" }))).statusCode).toBe(400);
    expect(f.mutations()).toBe(0);
  });
  it("creates, reads, edits, reorders, and removes encrypted private content", async () => {
    const f = fixture(); const create = await f.call("post:/kinfolk/curiosity-lists", listInput());
    expect(create.statusCode).toBe(201); expect(create.body.list.allowKinfolkUse).toBe(false); expect(create.headers["Cache-Control"]).toBe("no-store");
    expect(f.lists[0].name).toBe("[Encrypted private memory]"); expect(JSON.stringify(f.lists)).not.toContain("My textile questions");
    expect((await f.call("post:/kinfolk/curiosity-lists/:listId/items", itemInput("Adire indigo"))).statusCode).toBe(201);
    const second = await f.call("post:/kinfolk/curiosity-lists/:listId/items", itemInput("Kente weaving")); expect(second.body.list.items.map((item: Row) => item.position)).toEqual([0, 1]);
    const edit = await f.call("patch:/kinfolk/curiosity-lists/:listId/items/:itemId", itemInput("Adire resist dyeing")); expect(edit.body.list.items[0].text).toBe("Adire resist dyeing");
    const reorder = await f.call("put:/kinfolk/curiosity-lists/:listId/items/order", { itemIds: [ITEM_B, ITEM_A], memberConfirmed: true }); expect(reorder.body.list.items.map((item: Row) => item.text)).toEqual(["Kente weaving", "Adire resist dyeing"]);
    expect(JSON.stringify(f.items)).not.toContain("Kente weaving");
    expect((await f.call("delete:/kinfolk/curiosity-lists/:listId/items/:itemId", { memberConfirmed: true }, "owner-a", { listId: LIST_ID, itemId: ITEM_B })).body).toEqual({ removed: true });
    expect((await f.call("delete:/kinfolk/curiosity-lists/:listId", { memberConfirmed: true })).body).toEqual({ removed: true }); expect(f.lists).toEqual([]);
  });
  it("uses a separately confirmed default-off Kinfolk setting and never exposes other-account data", async () => {
    const f = fixture(); await f.call("post:/kinfolk/curiosity-lists", listInput());
    expect((await f.call("patch:/kinfolk/curiosity-lists/:listId/kinfolk-use", { allowKinfolkUse: true }, "owner-a")).statusCode).toBe(400);
    expect((await f.call("patch:/kinfolk/curiosity-lists/:listId/kinfolk-use", { allowKinfolkUse: true, memberConfirmed: true })).body.list.allowKinfolkUse).toBe(true);
    expect((await f.call("get:/kinfolk/curiosity-lists", {}, "owner-b")).body.lists).toEqual([]);
    for (const key of ["patch:/kinfolk/curiosity-lists/:listId", "patch:/kinfolk/curiosity-lists/:listId/kinfolk-use", "delete:/kinfolk/curiosity-lists/:listId"]) {
      const body = key.includes("kinfolk-use") ? { allowKinfolkUse: false, memberConfirmed: true } : key.startsWith("delete") ? { memberConfirmed: true } : listInput();
      const response = await f.call(key, body, "owner-b"); expect(response.statusCode).toBe(404); expect(JSON.stringify(response.body)).not.toContain("My textile questions");
    }
  });
});
