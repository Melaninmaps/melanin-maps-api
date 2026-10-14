import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");
const route = read("artifacts/api-server/src/routes/kinfolk-current-chapters.ts");
const policy = read("artifacts/api-server/src/kinfolk/current-chapter-policy.ts");
const runtime = read("artifacts/api-server/src/kinfolk/current-chapter-runtime.ts");
const kinfolk = read("artifacts/api-server/src/routes/kinfolk.ts");
const ddl = read("artifacts/api-server/src/lib/kinfolk-current-chapters-schema.ts");
const schema = read("lib/db/src/schema/kinfolk-current-chapters.ts");
const clients = [
  ["web", "artifacts/web/src/components/kinfolk/CurrentChapterManager.tsx"],
  ["native", "artifacts/mobile/components/CurrentChapterManager.tsx"],
] as const;

describe("Current Chapter source-only privacy boundaries", () => {
  it("defines a separate owner record with encrypted-only note and fixed kinds, not a new generic memory purpose", () => {
    expect(schema).toContain('pgTable("kinfolk_current_chapters"');
    expect(schema).toContain('references(() => usersTable.id, { onDelete: "cascade" })');
    for (const field of ["member_confirmed_at", "started_at", "ended_at", "created_at", "updated_at", "is_sensitive", "allow_relevant_use", "encrypted_content", "encryption_key_id"]) expect(schema).toContain(field);
    expect(schema).toContain("kinfolk_current_chapters_note_check");
    expect(read("lib/db/src/schema/index.ts")).toContain('export * from "./kinfolk-current-chapters"');
    expect(read("artifacts/api-server/src/kinfolk/private-memory-policy.ts")).not.toContain("current_chapter");
    expect(route).not.toMatch(/userPreferencesTable|userSettingsTable|kinfolkPrivateMemoriesTable|usersTable|invalidatePrefsCache/);
  });
  it("contains data-neutral idempotent startup DDL only; no seed, backfill, inference or owner reassignment", () => {
    const sql = ddl.split("export const CURRENT_CHAPTER_SCHEMA_DDL = `")[1]!.split("`;")[0]!;
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS kinfolk_current_chapters");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS");
    expect(sql).toContain("NEW.user_id IS DISTINCT FROM OLD.user_id");
    expect(sql).toContain("OLD.ended_at IS NOT NULL");
    expect(sql).not.toMatch(/\b(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|COPY\s+|TRUNCATE\s+|DROP\s+)\b/i);
    expect(read("artifacts/api-server/src/index.ts")).toContain("await ensureKinfolkCurrentChaptersSchema(");
    expect(read("artifacts/api-server/src/lib/startup-migrations.ts")).not.toContain("ensureKinfolkCurrentChaptersSchema");
  });
  it("mounts the owner-only settings route behind the existing member wall and provides no-store responses", () => {
    const index = read("artifacts/api-server/src/routes/index.ts");
    expect(index).toContain("router.use(kinfolkCurrentChaptersRouter)");
    expect(index.indexOf("router.use(kinfolkCurrentChaptersRouter)")).toBeGreaterThan(index.indexOf("router.use(kinfolkRouter)"));
    expect(route).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(route).toContain("eq(kinfolkCurrentChaptersTable.userId, userId)");
    expect(route).toContain('res.status(404).json({ error: "Chapter not found" })');
  });
  it("has only explicit create/update mutations, never activity/search inference or ordinary memory purposes", () => {
    const dirs = ["artifacts/api-server/src/routes", "artifacts/api-server/src/kinfolk"];
    for (const dir of dirs) {
      for (const name of readdirSync(`${root}${dir}`).filter((name) => name.endsWith(".ts"))) {
        const text = read(`${dir}/${name}`);
        if (name === "kinfolk-current-chapters.ts") continue;
        expect(text, name).not.toMatch(/\.(?:insert|update)\(kinfolkCurrentChaptersTable\)/);
      }
    }
    expect(policy).toContain("input.memberConfirmed !== true");
    expect(policy).not.toMatch(/sensitiveMemoryTopic|\binfer[A-Za-z_]*\s*\(/);
    expect(route).not.toMatch(/log\.|console\.|analytics|notification|provider|searchEvent/);
  });
  it("binds AES-GCM to a chapter-specific record purpose and rejects legacy plaintext", () => {
    expect(policy).toContain('JSON.stringify(["kinfolk-current-chapter-v1", chapter.id, chapter.kind, chapter.isSensitive, chapter.allowRelevantUse])');
    expect(policy).toContain("encryptOrdinaryMemoryContent("); expect(policy).toContain("readOrdinaryMemoryContent(");
    expect(policy).toContain('chapter.note !== "[Encrypted private memory]"');
    expect(policy).toContain("!chapter.encryptedContent || !chapter.encryptionKeyId");
    expect(policy).not.toContain("contentFingerprint:");
    expect(route).toContain("openChapterNote(existing, userId)");
  });
  it("adds prompt context only after retrieval and never to response metadata, discovery, profile or library prompts", () => {
    expect(kinfolk.match(/currentChapterPromptForRequest\(/g)).toHaveLength(1);
    expect(kinfolk).toContain("excludedContext: Boolean(libraryGroundingBlock || contextualEvidence || communityHashtagContext.promptBlock || isPrivateQuestionAttachment)");
    expect(kinfolk.indexOf("const currentChapterPrompt =")).toBeGreaterThan(kinfolk.indexOf("const systemPromptWithLibrary ="));
    expect(runtime).toContain("isNull(kinfolkCurrentChaptersTable.endedAt)");
    expect(runtime).not.toMatch(/\.insert\(|\.update\(|\.delete\(|log\.|console\./);
    expect(read("lib/constants/src/kinfolk-chat-contract.ts")).not.toMatch(/currentChapter|current.chapter|chapterNote/);
    for (const dir of ["artifacts/api-server/src/businesses", "artifacts/api-server/src/library", "artifacts/api-server/src/safety"]) {
      for (const name of readdirSync(`${root}${dir}`).filter((name) => name.endsWith(".ts"))) {
        expect(read(`${dir}/${name}`), name).not.toMatch(/kinfolkCurrentChaptersTable|currentChapterPromptForRequest|buildCurrentChapterPrompt/);
      }
    }
    for (const path of ["routes/maps.ts", "routes/businesses.ts", "routes/knowledge.ts", "routes/users.ts", "routes/community-spaces.ts", "kinfolk/business-personalization.ts"]) {
      expect(read(`artifacts/api-server/src/${path}`)).not.toMatch(/kinfolkCurrentChaptersTable|currentChapterPromptForRequest|buildCurrentChapterPrompt/);
    }
  });
});

describe.each(clients)("%s Current Chapter private settings contract", (_client, path) => {
  const client = read(path);
  it("uses fixed explicit input without a default or onboarding demand and differentiates chapters/preferences/history", () => {
    expect(client).toContain("Object.entries(CURRENT_CHAPTER_KINDS)"); expect(client).toContain('useState("")');
    expect(client).toContain("not a stable preference or private-memory note");
    expect(client).toContain("Nothing you search, save, visit or say creates one");
    expect(client).toContain("Ending preserves dated history"); expect(client).toContain("removing deletes it and revokes use");
    expect(client).not.toMatch(/onboarding|autoFocus|defaultChapter|inferChapter/);
  });
  it("sends notes only in an authenticated no-store explicit chapter payload; no device or browser storage or telemetry", () => {
    expect(client).toContain('cache: "no-store"'); expect(client).toContain("note: note.trim(), memberConfirmed: true, sensitiveConfirmed, allowRelevantUse");
    expect(client).not.toMatch(/localStorage|sessionStorage|AsyncStorage|SecureStore|setItem|analytics|trackEvent|console\.|log\./);
    expect(client).toContain('sensitive-memory-vault/reauth", "POST", { password }');
    expect(client).toContain('finally { setPassword(""); }');
    expect(client).toContain("if (sensitive) await reauth()");
    expect(client).toContain("if (chapter.isSensitive) await reauth()");
    if (_client === "web") expect(client).toContain('credentials: "include"');
    else expect(client).toContain("Authorization: `Bearer ${token}`");
  });
  it("requires separate explicit use permission, member and sensitive confirmations and generic retry errors", () => {
    expect(client).toContain("useState(false)"); expect(client).toContain("!memberConfirmed || (sensitive && !sensitiveConfirmed)");
    expect(client).toContain("Keep this as my Current Chapter"); expect(client).toContain("I explicitly confirm this sensitive chapter");
    expect(client).toContain("Never discovery, Map, Directory, Library, Community, Safety or profiles");
    expect(client).toContain("Unsupported sign-in methods stay locked"); expect(client).toContain("Retry");
    expect(client).toContain("setMemberConfirmed(false)");
  });
  it("renders owner current/history views, never opens locked notes, and distinguishes end from permanent removal", () => {
    expect(client).toContain('chapter.endedAt ? "Ended history" : "Current"');
    expect(client).toContain("new Date(chapter.startedAt).toLocaleDateString()");
    expect(client).toContain("new Date(chapter.endedAt).toLocaleDateString()");
    expect(client).toContain("!chapter.vaultLocked"); expect(client).toContain("Remove and revoke"); expect(client).toContain("End (keep history)");
    expect(client).toContain('action === "end" ? { memberConfirmed: true } : undefined');
    expect(client).toContain("edit saved history only; do not reactivate");
  });
});
