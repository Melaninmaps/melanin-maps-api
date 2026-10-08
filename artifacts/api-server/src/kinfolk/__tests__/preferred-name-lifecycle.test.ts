import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  preferredNameSaveOutcome,
  resolvePreferredNameMemoryState,
} from "../preferred-name-lifecycle";

const here = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(resolve(here, "../../routes/kinfolk.ts"), "utf8");
const migrations = readFileSync(resolve(here, "../../lib/startup-migrations.ts"), "utf8");

describe("explicit preferred-name lifecycle", () => {
  it("treats repeat saves as an idempotent update of the active owner record", () => {
    expect(preferredNameSaveOutcome({ activeRecordId: null })).toBe("created");
    expect(preferredNameSaveOutcome({ activeRecordId: "owner-name-1" })).toBe("updated");
  });

  it("keeps an existing legacy pause paused and uses the dedicated pause marker going forward", () => {
    const now = new Date("2026-10-08T12:00:00.000Z");
    expect(resolvePreferredNameMemoryState({ pausedAt: now, legacyPauseExpiresAt: null, now })).toBe("paused");
    expect(resolvePreferredNameMemoryState({ pausedAt: null, legacyPauseExpiresAt: now, now })).toBe("paused");
    expect(resolvePreferredNameMemoryState({ pausedAt: null, legacyPauseExpiresAt: null, now })).toBe("active");
  });

  it("serializes save, pause, revoke, and delete on one owner-scoped preferred-name lock", () => {
    expect(route).toContain("withSerializedPreferredNameWrite");
    expect(route).toContain("kinfolk-preferred-name:${input.userId}");
    expect((route.match(/withSerializedPreferredNameWrite\(/g) ?? []).length).toBeGreaterThanOrEqual(4);
    const saveRoute = route.slice(
      route.indexOf('router.put("/kinfolk/preferred-name"'),
      route.indexOf('router.patch("/kinfolk/preferred-name/pause"'),
    );
    expect(saveRoute).toContain("preferredNameSaveOutcome");
    expect(saveRoute).toContain("idempotent: result.outcome === \"updated\"");
    expect(saveRoute).toContain("pausedAt: null");
    expect(saveRoute).not.toContain(".set({ revokedAt: now, updatedAt: now })");
  });

  it("keeps every lifecycle mutation owner-scoped and preserves immediate pause/revoke/delete boundaries", () => {
    const lifecycle = route.slice(
      route.indexOf('router.patch("/kinfolk/preferred-name/pause"'),
      route.indexOf("class PrivateMemoryCapacityError"),
    );
    expect(lifecycle).toContain("eq(kinfolkPrivateMemoriesTable.userId, req.user!.id)");
    expect(lifecycle).toContain("pausedAt: paused ? now : null");
    expect(lifecycle).toContain("isNull(kinfolkPrivateMemoriesTable.revokedAt)");
    expect(lifecycle).toContain("router.post(\"/kinfolk/preferred-name/revoke\"");
    expect(lifecycle).toContain("router.delete(\"/kinfolk/preferred-name\"");
  });

  it("enforces one active preferred-name record per owner in the database", () => {
    expect(migrations).toContain('name: "kinfolk_preferred_name_owner_active_unique_v1"');
    expect(migrations).toContain("ranked_active_preferred_names");
    expect(migrations).toContain("kinfolk_private_memories_preferred_name_owner_active_idx");
    expect(migrations).toContain("WHERE purpose = 'preferred_name' AND revoked_at IS NULL");
  });
});
