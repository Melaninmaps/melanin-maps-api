import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL("../registerFounderSourcePublicationRoutes.ts", import.meta.url),
  ),
  "utf8",
);
const creationFlow = source.slice(
  source.indexOf("type VerifiedSourceProfileCreateResult"),
  source.indexOf("/**\n   * Corrects only the false source-record"),
);

const manifest = readFileSync(
  fileURLToPath(
    new URL(
      "../reviewedNonKinfolkLatinoProfileCreateManifest.ts",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("reviewed non-Kinfolk source-profile creation", () => {
  it("uses a fixed server-side 62-record manifest rather than browser-supplied candidates", () => {
    expect(manifest).toContain(
      "REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_MANIFEST",
    );
    expect(manifest).toContain(
      "REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT = 62",
    );
    expect(creationFlow).toContain("reviewedSourceProfileCreationManifest()");
    expect(creationFlow).toContain(
      "manifest.candidates.length !== REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT",
    );
    expect(creationFlow).toContain(
      "verifiedSourceProfileCreateEntries(manifest.candidates)",
    );
    expect(creationFlow).not.toContain("req.body as { manifest?: unknown }");
  });

  it("requires an administrator-bound, expiring server preview token before apply", () => {
    expect(creationFlow).toContain("isAdmin(req)");
    expect(creationFlow).toContain("requiresExplicitApply: true");
    expect(creationFlow).toContain("previewToken");
    expect(creationFlow).toContain("created_by = $2");
    expect(creationFlow).toContain(
      "REVIEWED_SOURCE_PROFILE_CREATE_PREVIEW_TTL_MS",
    );
    expect(creationFlow).toContain("preview.rows[0]?.completed_at == null");
    expect(creationFlow).toContain(
      "The preview token is missing, expired, already used",
    );
  });

  it("creates the exact batch atomically and rejects duplicate or Kinfolk conflicts before any insert", () => {
    expect(creationFlow).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(creationFlow).toContain("pg_advisory_xact_lock");
    expect(creationFlow).toContain("business_source_directory_receipts");
    expect(creationFlow).toContain("mwmDiasporaPromotionSqlPredicate");
    expect(creationFlow).toContain("if (blocked.length > 0)");
    expect(creationFlow).toContain('await client.query("ROLLBACK")');
    expect(creationFlow).toContain(
      "results.length !==\n          REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT",
    );
  });

  it("records every source-derived baseline fact and keeps ownership columns consistent", () => {
    expect(creationFlow).toContain('field: "identity"');
    expect(creationFlow).toContain('field: "category"');
    expect(creationFlow).toContain('field: "ownership"');
    expect(creationFlow).toContain('field: "address"');
    expect(creationFlow).toContain("business_profile_field_receipts");
    expect(creationFlow).toContain(
      "const blackOwned = entry.source.ownershipDesignations.includes",
    );
    expect(creationFlow).toContain("blackOwned,");
    expect(creationFlow).toContain("mapPin: null");
  });
});
