import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");
const route = readFileSync(resolve(root, "artifacts/api-server/src/routes/kinfolk.ts"), "utf8");
const schema = readFileSync(resolve(root, "lib/db/src/schema/user-settings.ts"), "utf8");
const migration = readFileSync(resolve(root, "artifacts/api-server/src/lib/startup-migrations.ts"), "utf8");
const persistence = readFileSync(resolve(root, "artifacts/api-server/src/kinfolk/continuity-settings-persistence.ts"), "utf8");
const webDisclosure = readFileSync(resolve(root, "artifacts/web/src/components/kinfolk/KinfolkContinuityDisclosure.tsx"), "utf8");
const mobileDisclosure = readFileSync(resolve(root, "artifacts/mobile/components/KinfolkContinuityDisclosure.tsx"), "utf8");

const disclosureCopy = "Kinfolk works better when it can remember the things you share—your preferences, plans, and ongoing goals—so you do not have to start over every time. You can review, edit, turn this off, or delete it anytime.";

describe("Kinfolk first-use continuity disclosure", () => {
  it("keeps disclosure decision separate from legacy continuity state", () => {
    expect(schema).toContain("kinfolkContinuityDisclosureDecision");
    expect(schema).toContain('enum: ["accepted", "declined"]');
    expect(migration).toContain('name: "kinfolk_continuity_first_use_disclosure_v2"');
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS kinfolk_continuity_disclosure_decision");
    expect(route).toContain("disclosureRequired: decision === null");
    expect(route).toContain('settings.kinfolkContinuityDisclosureDecision === "accepted"');
    expect(route).not.toContain('kinfolkContinuityEnabled").notNull().default(true)');
  });

  it("offers accept and decline without enrolling an existing member silently", () => {
    expect(route).toContain('KINFOLK_CONTINUITY_DECISION_MISMATCH');
    expect(route).toContain('requestedDecision ?? (enabled ? "accepted" : currentDecision ?? "declined")');
    expect(route).toContain("const updatedExisting = await db");
    expect(route).toContain("if (updatedExisting.length === 0)");
    expect(route).toContain("kinfolkMemoryEnabled: enabled");
    expect(route).toContain("PostgreSQL validates the VALUES clause before an");
    expect(route).toContain('requestedDecision === "accepted" && enabled !== true');
    expect(route).toContain('requestedDecision === "declined" && enabled !== false');
    for (const source of [webDisclosure, mobileDisclosure]) {
      expect(source).toContain(disclosureCopy);
      expect(source).toContain("Let Kinfolk remember");
      expect(source).toContain("Keep memory off");
    }
  });

  it("keeps either first-use choice retryable when its save callback rejects", () => {
    for (const source of [webDisclosure, mobileDisclosure]) {
      const choose = source.slice(source.indexOf("const choose = async"), source.indexOf("return ("));
      expect(choose).toContain("try {");
      expect(choose).toContain("const saved = await onChoose(decision);");
      expect(choose).toContain("catch {");
      expect(choose).toContain('setError("Kinfolk could not save your choice. Please try again.");');
      expect(choose).toContain("finally {");
      expect(choose).toContain("setSaving(null);");
    }
  });

  it("writes only the stable consent columns when newer optional settings columns are absent", () => {
    expect(route.match(/persistKinfolkContinuitySettings\(/g)).toHaveLength(3);
    expect(persistence).toContain("INSERT INTO user_settings");
    expect(persistence).toContain("safety_alert_police");
    expect(persistence).toContain("safety_alert_ice");
    expect(persistence).toContain("safety_alert_radius_miles");
    expect(persistence).toContain("ON CONFLICT (user_id) DO UPDATE SET");
    expect(persistence).not.toContain("safety_alert_police = EXCLUDED");
    expect(persistence).not.toContain("safety_alert_ice = EXCLUDED");
    expect(persistence).not.toContain("notif_reminders");
  });

  it("requires a distinct sensitive save confirmation and preserves owner-only edit checks", () => {
    expect(route).toContain('code: "SENSITIVE_MEMORY_CONFIRMATION_REQUIRED"');
    expect(route).toContain("body.sensitiveConsent !== true");
    expect(route).toContain('router.patch("/kinfolk/memories/:id"');
    expect(route).toContain('eq(kinfolkPrivateMemoriesTable.userId, req.user.id)');
    expect(route).toContain("isSensitive: willBeSensitive");
    expect(route).toContain("sensitiveConsentGrantedAt: isSensitive ? new Date() : null");
    expect(route).toContain("sensitiveConsentGrantedAt: willBeSensitive ? new Date() : null");
    expect(route).toContain("isNotNull(kinfolkPrivateMemoriesTable.sensitiveConsentGrantedAt)");
    expect(migration).toContain('name: "kinfolk_private_memories_sensitive_confirmation_v2"');
  });
});
