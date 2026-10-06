import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(resolve(here, "../../routes/kinfolk.ts"), "utf8");
const schema = readFileSync(
  resolve(here, "../../../../../lib/db/src/schema/kinfolk-private-memories.ts"),
  "utf8",
);
const migrations = readFileSync(
  resolve(here, "../../lib/startup-migrations.ts"),
  "utf8",
);

describe("Kinfolk Personal Memory V1 contract", () => {
  it("serializes generic note writes and returns a deterministic capacity response", () => {
    expect(route).toContain("pg_advisory_lock(hashtext($1))");
    expect(route).toContain("pg_advisory_unlock(hashtext($1))");
    expect(route).toContain("PRIVATE_MEMORY_ACTIVE_LIMIT_REACHED");
    expect(route).toContain("MAX_ACTIVE_KINFOLK_PRIVATE_NOTES");
    expect(route).toContain("requirePrivateMemoryCapacity({");
    expect(route).toContain('router.post("/kinfolk/memory-consent"');
    expect(route).toContain('router.post("/kinfolk/memories"');
  });

  it("keeps all generic writes explicit and keeps preferred-name controls distinct", () => {
    expect(route).not.toContain("persistOrdinaryContinuityMemory");
    expect(route).not.toContain("extractOrdinaryContinuityMemory");
    expect(route).toContain("ne(kinfolkPrivateMemoriesTable.purpose, PREFERRED_NAME_MEMORY_PURPOSE)");
    expect(route).toContain('router.patch("/kinfolk/memories/:id/pause"');
    expect(route).toContain("MEMORY_EXPIRED_CANNOT_RESUME");
  });

  it("persists a pause marker without backfilling, mutating, or deleting existing memories", () => {
    expect(schema).toContain('pausedAt: timestamp("paused_at"');
    expect(migrations).toContain('name: "kinfolk_private_memories_pause_and_capacity_v3"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS paused_at timestamptz");
    expect(migrations).toContain("It does not change, pause,");
  });

  it("excludes paused notes from every prompt-facing generic-memory query", () => {
    expect((route.match(/isNull\(kinfolkPrivateMemoriesTable\.pausedAt\)/g) ?? []).length)
      .toBeGreaterThanOrEqual(5);
    expect(route).toContain("state: resolvePrivateMemoryState({");
    expect(route).toContain("maxActiveNotes: MAX_ACTIVE_KINFOLK_PRIVATE_NOTES");
  });
});
