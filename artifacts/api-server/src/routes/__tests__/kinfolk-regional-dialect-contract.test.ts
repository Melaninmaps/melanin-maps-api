import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../kinfolk-regional-dialect.ts", import.meta.url)),
  "utf8",
);
const migration = readFileSync(
  fileURLToPath(new URL("../../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const kinfolk = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk regional dialect foundation routes", () => {
  it("keeps corrections authenticated, member-only, consented, and deletable", () => {
    expect(route).toMatch(
      /router\.get\(\s*["']\/kinfolk\/language\/corrections/,
    );
    expect(route).toMatch(
      /router\.post\(\s*["']\/kinfolk\/language\/corrections/,
    );
    expect(route).toContain("body.consent !== true");
    expect(route).toContain("scope, consented_at, status");
    expect(route).toContain("scope: row.scope");
    expect(route).toContain(
      "DELETE FROM kinfolk_member_pronunciation_corrections",
    );
    expect(route).toContain("WHERE id = $1 AND user_id = $2");
  });

  it("defines references, evidence, revisions, and private corrections without seeding them", () => {
    expect(migration).toContain(
      "kinfolk_regional_dialect_multilingual_foundation_v1",
    );
    expect(migration).toContain("kinfolk_place_language_references");
    expect(migration).toContain("kinfolk_place_language_evidence");
    expect(migration).toContain("kinfolk_place_language_reference_revisions");
    expect(migration).toContain("kinfolk_member_pronunciation_corrections");
    expect(migration).toContain(
      "ensureKinfolkRegionalDialectIntelligenceSchemaOnly",
    );
    expect(migration).not.toContain(
      "INSERT INTO kinfolk_place_language_references",
    );
  });

  it("limits provider context to stored opt-in preferences and reviewed references", () => {
    expect(kinfolk).toContain(
      "Stored consent controls whether the provider can receive this small",
    );
    expect(kinfolk).toContain("loadReviewedPlaceReferences");
    expect(kinfolk).toContain("buildBoundedVoiceLanguageContext");
    expect(kinfolk).toContain("buildReviewedPronunciationGuidance");
    expect(kinfolk).toContain(
      "never rewrites visible text or asks the provider to imitate an accent",
    );
  });
});
