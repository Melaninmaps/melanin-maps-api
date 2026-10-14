import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const route = source("../../routes/kinfolk.ts");
const crypto = source("../private-memory-encryption.ts");
const migrations = source("../../lib/startup-migrations.ts");
const schema = source("../../../../../lib/db/src/schema/kinfolk-private-memories.ts");
const section = (start: string, end: string) => route.slice(route.indexOf(start), route.indexOf(end, route.indexOf(start)));

describe("source-only ordinary-memory encryption route contract", () => {
  it.each([
    ['router.put("/kinfolk/preferred-name"', 'router.patch("/kinfolk/preferred-name/pause"'],
    ['router.post("/kinfolk/memory-consent"', 'router.post("/kinfolk/memories"'],
    ['router.post("/kinfolk/memories"', 'router.patch("/kinfolk/memories/:id"'],
    ['router.patch("/kinfolk/memories/:id"', 'router.patch("/kinfolk/memories/:id/pause"'],
  ])("encrypts every new/corrected ordinary write in %s", (start, end) => {
    const handler = section(start, end);
    expect(handler).toContain("encryptOrdinaryMemoryContent(");
    expect(handler).toContain("ordinaryCiphertext");
    expect(handler).not.toMatch(/content:\s*(?:item\.content|formatPreferredNameMemory\(name\))/);
    expect(handler).not.toMatch(/sensitiveMemoryStoragePlaceholder\(\)\s*:\s*(?:content|item\.content)[,\n]/);
    expect(handler).toContain("respondToPrivateMemoryEncryptionError(res, err)");
    expect(handler).toContain("req.user");
  });

  it("preserves scoped duplicate serialization and never sends ordinary plaintext in a duplicate SQL predicate", () => {
    const duplicateRead = section("async function findActivePrivateMemoryDuplicates", 'router.get("/kinfolk/sensitive-memory-vault"');
    expect(duplicateRead).toContain("eq(kinfolkPrivateMemoriesTable.userId, userId)");
    expect(duplicateRead).toContain("isNull(kinfolkPrivateMemoriesTable.revokedAt)");
    expect(duplicateRead).toContain("isNull(kinfolkPrivateMemoriesTable.pausedAt)");
    expect(duplicateRead).toContain("inArray(kinfolkPrivateMemoriesTable.contentFingerprint, fingerprints)");
    expect(duplicateRead).not.toContain("eq(kinfolkPrivateMemoriesTable.content,");
    expect(route).toContain("kinfolk-private-memory:${input.userId}");
    expect(route).toContain("queuedContent");
  });

  it("opens only authorized settings/prompt content, strips internal fields, and validates before owner correction/pause writes", () => {
    const list = section('router.get("/kinfolk/memories"', 'router.post("/kinfolk/memory-consent"');
    expect(list).toContain("...privateMemoryOwnerResponse(memory, req.user!.id)");
    expect(list).toContain("eq(kinfolkPrivateMemoriesTable.userId, req.user.id)");
    expect(crypto).toContain("content: memory.isSensitive ? null : readOrdinaryMemoryContent(memory, userId)");
    expect(crypto).toContain("contentFingerprint: _fingerprint");
    for (const [start, end] of [
      ['router.patch("/kinfolk/memories/:id"', 'router.patch("/kinfolk/memories/:id/pause"'],
      ['router.patch("/kinfolk/memories/:id/pause"', 'router.delete("/kinfolk/memories/:id"'],
    ]) {
      const handler = section(start, end);
      expect(handler.indexOf("readOrdinaryMemoryContent(existing, req.user.id)")).toBeLessThan(handler.indexOf(".update(kinfolkPrivateMemoriesTable)"));
      expect(handler).toContain("isNull(kinfolkPrivateMemoriesTable.revokedAt)");
    }
    expect(route.match(/ordinaryMemoriesForPrompt\(/g)).toHaveLength(2);
    expect(crypto).not.toMatch(/console\.|\.log\.|\.update\(|\.insert\(/);
  });

  it("adds only nullable representation columns and a new-write guard without legacy content backfill", () => {
    for (const field of ["encrypted_content", "encryption_key_id", "content_fingerprint"]) {
      expect(schema).toContain(`"${field}"`);
      expect(migrations).toContain(`ADD COLUMN IF NOT EXISTS ${field}`);
    }
    const migration = migrations.slice(migrations.indexOf('name: "kinfolk_private_memories_ordinary_encryption_v5"'), migrations.indexOf("// Personal Memory V1 adds only control metadata"));
    expect(migration).toContain("BEFORE INSERT OR UPDATE ON kinfolk_private_memories");
    expect(migration).toContain("IF NOT NEW.is_sensitive AND must_encrypt THEN");
    expect(migration).toContain("NEW.content IS DISTINCT FROM OLD.content");
    expect(migration).toContain("'[Encrypted private memory]'");
    expect(migration).not.toMatch(/UPDATE\s+kinfolk_private_memories\s+SET|DELETE\s+FROM|SELECT\s+.*content/i);
    expect(migrations).toContain("await pool.query(ordinaryEncryptionMigration.sql)");
    expect(schema).toContain('sensitiveEncryptedContent: text("sensitive_encrypted_content")');
  });

  it.each(["maps.ts", "businesses.ts", "cultural-journeys.ts", "library-suggest.ts", "library-growth-admin.ts"])("does not introduce memory access to the standalone no-memory surface %s", (file) => {
    const boundary = source(`../../routes/${file}`);
    expect(boundary).not.toMatch(/kinfolkPrivateMemoriesTable|private-memory-encryption|kinfolk_private_memories/);
  });
});
