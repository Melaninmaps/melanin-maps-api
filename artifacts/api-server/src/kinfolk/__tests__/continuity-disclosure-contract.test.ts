import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");
const route = readFileSync(resolve(root, "artifacts/api-server/src/routes/kinfolk.ts"), "utf8");
const schema = readFileSync(resolve(root, "lib/db/src/schema/user-settings.ts"), "utf8");
const migration = readFileSync(resolve(root, "artifacts/api-server/src/lib/startup-migrations.ts"), "utf8");
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
    for (const source of [webDisclosure, mobileDisclosure]) {
      expect(source).toContain(disclosureCopy);
      expect(source).toContain("Let Kinfolk remember");
      expect(source).toContain("Keep memory off");
    }
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
