import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(resolve(routesDir, "../cultural-journeys.ts"), "utf8");
const index = readFileSync(resolve(routesDir, "../index.ts"), "utf8");
const reflectionMigration = readFileSync(
  resolve(routesDir, "../../../migrations/20261014_cultural_journey_reflection_encryption.approval-required.sql"),
  "utf8",
);

describe("cultural Journey route contract", () => {
  it("requires the member wall and mounts the owner-scoped route", () => {
    expect(index).toContain('import culturalJourneysRouter from "./cultural-journeys"');
    expect(index).toContain("router.use(culturalJourneysRouter)");
    expect(route).toContain('router.use((_req, res, next) => {');
    expect(route).toContain('if (!req.user?.id) { res.status(401)');
    expect(route).toContain('router.get("/cultural-journeys"');
    expect(route).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(route).toContain("eq(culturalJourneyEntriesTable.userId, req.user.id)");
  });

  it("saves only an explicitly confirmed published cultural site", () => {
    expect(route).toContain('router.post("/cultural-journeys/cultural-sites/:siteId"');
    expect(route).toContain("req.body?.memberConfirmed !== true");
    expect(route).toContain("FROM cultural_sites");
    expect(route).toContain("COALESCE(is_published, TRUE) = TRUE");
    expect(route).toContain("eq(culturalJourneyEntriesTable.userId, req.user.id)");
  });

  it("scopes reflection and deletion to the authenticated owner", () => {
    expect(route).toContain('router.patch("/cultural-journeys/entries/:entryId/reflection"');
    expect(route).toContain("validateCulturalJourneyReflection");
    expect(route).toContain('router.delete("/cultural-journeys/entries/:entryId"');
    expect(route).toContain("req.body?.memberConfirmed !== true");
    expect(route).toContain("isNull(culturalJourneyEntriesTable.removedAt)");
    expect(route).toContain("removedAt: new Date()");
    expect(route).toContain('"Cultural Journey entry not found."');
    expect(route).not.toContain("points");
    expect(route).not.toContain("streak");
    expect(route).not.toMatch(/analytics|nudge|achievement|providerUrl|latitude|longitude/i);
  });

  it("selects the owner row before opening it, seals confirmed edits, and never sends crypto implementation fields", () => {
    expect(route).toContain("userId: culturalJourneyEntriesTable.userId");
    expect(route).toContain("encryptedReflection: culturalJourneyEntriesTable.encryptedReflection");
    expect(route).toContain("reflectionEncryptionKeyId: culturalJourneyEntriesTable.reflectionEncryptionKeyId");
    expect(route.indexOf("eq(culturalJourneyEntriesTable.id, entryId)")).toBeLessThan(
      route.indexOf("openCulturalJourneyReflection(existing, req.user.id)"),
    );
    expect(route).toContain("sealCulturalJourneyReflection(validated.value, existing)");
    expect(route).toContain("openCulturalJourneyReflection({ ...existing, ...sealed }, req.user.id)");
    expect(route).toContain("entries.map((entry) => culturalJourneyEntryView(entry, ownerId))");
    expect(route).toContain('code: "CULTURAL_JOURNEY_SECURE_ACCESS_REQUIRED"');
    expect(route).not.toContain("contentFingerprint");
  });

  it("clears and removes owner records without decrypting their old envelope, while cross-owner selection stays generic not-found", () => {
    const reflectionRoute = route.slice(
      route.indexOf('router.patch("/cultural-journeys/entries/:entryId/reflection"'),
      route.indexOf('router.delete("/cultural-journeys/entries/:entryId"'),
    );
    const deleteRoute = route.slice(route.indexOf('router.delete("/cultural-journeys/entries/:entryId"'));
    const clearStart = reflectionRoute.indexOf("if (validated.value === null)");
    const openStart = reflectionRoute.indexOf("openCulturalJourneyReflection(existing, req.user.id)");
    expect(clearStart).toBeGreaterThan(-1);
    expect(openStart).toBeGreaterThan(clearStart);
    expect(reflectionRoute).toContain("reflection: null,");
    expect(reflectionRoute).toContain("encryptedReflection: null,");
    expect(reflectionRoute).toContain("reflectionEncryptionKeyId: null,");
    expect(deleteRoute).not.toContain("openCulturalJourneyReflection");
    expect(deleteRoute).not.toContain("sealCulturalJourneyReflection");
    expect(deleteRoute).toContain('res.status(404).json({ error: "Cultural Journey entry not found." })');
  });

  it("ships an approval-required additive guard that preserves legacy rows but rejects new plaintext reflection writes", () => {
    expect(reflectionMigration).toContain("APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE");
    expect(reflectionMigration).toContain("ADD COLUMN IF NOT EXISTS encrypted_reflection TEXT");
    expect(reflectionMigration).toContain("reflection_encryption_key_id VARCHAR(64)");
    expect(reflectionMigration).toContain("CREATE TRIGGER cultural_journey_entries_require_encrypted_reflection");
    expect(reflectionMigration).toContain("BEFORE INSERT OR UPDATE OF reflection, encrypted_reflection, reflection_encryption_key_id");
    expect(reflectionMigration).toContain("NEW.reflection = '[Encrypted private memory]'");
    expect(reflectionMigration).toContain("CREATE FUNCTION cultural_journey_entries_require_encrypted_reflection_v1");
    expect(reflectionMigration).toContain("existing cultural journey reflection guard is preserved");
    expect(reflectionMigration).not.toMatch(/DROP\s+TRIGGER|CREATE\s+OR\s+REPLACE/i);
    expect(reflectionMigration).not.toMatch(/\b(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|COPY\s+|TRUNCATE\s+)\b/i);
    expect(route).not.toContain("20261014_cultural_journey_reflection_encryption");
  });
});
