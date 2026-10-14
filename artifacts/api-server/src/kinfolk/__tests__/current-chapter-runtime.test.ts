import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { KinfolkCurrentChapter } from "@workspace/db";
import { buildCurrentChapterPrompt, sealChapterNote, type ChapterPromptRequest } from "../current-chapter-policy";
const source = readFileSync(fileURLToPath(new URL("../current-chapter-runtime.ts", import.meta.url)), "utf8").replace(/^import .*;\n/gm, "");
const executable = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 31).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-chapter-runtime-v1");
});
afterEach(() => vi.unstubAllEnvs());
function row(patch: Partial<KinfolkCurrentChapter> = {}): KinfolkCurrentChapter {
  const record = { id: "10000000-0000-4000-8000-000000000001", userId: "owner-a", kind: "career_change", isSensitive: false,
    allowRelevantUse: true, memberConfirmedAt: new Date(), startedAt: new Date(), endedAt: null, createdAt: new Date(), updatedAt: new Date(), ...patch };
  return { ...record, ...sealChapterNote("Synthetic runtime chapter", record) };
}
const request = (patch: Partial<ChapterPromptRequest> = {}): ChapterPromptRequest => ({ owner: "owner-a", message: "Help me plan my career change", intent: "general_knowledge", surface: "conversation", excludedContext: false, ...patch });
function fixture(records: KinfolkCurrentChapter[], unavailable = false) {
  const reads = vi.fn(); const table = new Proxy({}, { get: (_target, key) => String(key) });
  let predicate = (_record: KinfolkCurrentChapter) => true; let limit = Infinity;
  const query: any = { from: (target: unknown) => { expect(target).toBe(table); return query; }, where: (condition: typeof predicate) => { predicate = condition; return query; }, orderBy: () => query,
    limit: (count: number) => { limit = count; return query; }, then: (resolve: any, reject: any) => unavailable ? Promise.reject(new Error("synthetic unavailable table")).then(resolve, reject) : Promise.resolve(records.filter(predicate).slice(0, limit)).then(resolve, reject) };
  const exports: any = {};
  const deps = { exports, db: { select: () => { reads(); return query; } }, kinfolkCurrentChaptersTable: table, buildCurrentChapterPrompt,
    eq: (key: keyof KinfolkCurrentChapter, value: unknown) => (record: KinfolkCurrentChapter) => record[key] === value,
    and: (...conditions: Array<typeof predicate>) => (record: KinfolkCurrentChapter) => conditions.every((condition) => condition(record)),
    isNull: (key: keyof KinfolkCurrentChapter) => (record: KinfolkCurrentChapter) => record[key] == null, desc: (key: string) => key,
  };
  new Function(...Object.keys(deps), executable)(...Object.values(deps));
  return { run: exports.currentChapterPromptForRequest as (request: ChapterPromptRequest) => Promise<string>, reads };
}
describe("bounded read-only Current Chapter prompt runtime", () => {
  it("reads only opted-in active owner chapters", async () => {
    const records = [row({ userId: "owner-b" }), row({ endedAt: new Date() }), row({ allowRelevantUse: false }), row()];
    const f = fixture(records); const before = records.map((record) => ({ ...record }));
    expect(await f.run(request())).toContain("Synthetic runtime chapter"); expect(f.reads).toHaveBeenCalledTimes(1); expect(records).toEqual(before);
    expect(await fixture(records.slice(0, 3)).run(request())).toBe("");
  });
  it.each([{ message: "What is two plus two?" }, { owner: "" }, { surface: "Map" }, { surface: "Directory" }, { surface: "Library" }, { surface: "Community" }, { surface: "Safety" }, { intent: "business_discovery" }, { excludedContext: true }])("does not read or inject for excluded/unrelated %j", async (patch) => {
    const f = fixture([row()]); expect(await f.run(request(patch))).toBe(""); expect(f.reads).not.toHaveBeenCalled();
  });
  it("omits unavailable schema or crypto without errors, writes or plaintext fallback", async () => {
    const record = row(); expect(await fixture([record], true).run(request())).toBe("");
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    const before = { ...record }; expect(await fixture([record]).run(request())).toBe(""); expect(record).toEqual(before);
  });
});
