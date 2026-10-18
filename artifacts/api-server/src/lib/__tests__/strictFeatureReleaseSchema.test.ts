import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());
vi.mock("@workspace/db", () => ({ pool: { query: poolQuery } }));

import {
  assertExplicitFeatureReleaseSchema,
  explicitFeatureReleaseSchemaRequirements,
} from "../strictFeatureReleaseSchema";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const startup = readFileSync(resolve(sourceRoot, "index.ts"), "utf8");
const gateSource = readFileSync(
  resolve(sourceRoot, "lib/strictFeatureReleaseSchema.ts"),
  "utf8",
);

function completeCatalogRows(requirements: Record<string, readonly string[]>) {
  return Object.entries(requirements).flatMap(([tableName, columns]) =>
    columns.map((columnName) => ({
      table_name: tableName,
      column_name: columnName,
    })),
  );
}

describe("explicit feature-release startup schema gate", () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it("executes only two catalog reads and accepts a fully pre-provisioned request-path schema", async () => {
    const requirements = explicitFeatureReleaseSchemaRequirements({
      KINFOLK_MEDIA_BUCKET_ID: "configured",
      KINFOLK_PRIVATE_PLACES_ENABLED: "true",
    });
    poolQuery
      .mockResolvedValueOnce({
        rows: Object.keys(requirements).map((table_name) => ({ table_name })),
      })
      .mockResolvedValueOnce({ rows: completeCatalogRows(requirements) });

    await expect(
      assertExplicitFeatureReleaseSchema({
        KINFOLK_MEDIA_BUCKET_ID: "configured",
        KINFOLK_PRIVATE_PLACES_ENABLED: "true",
      }),
    ).resolves.toBeUndefined();

    expect(poolQuery).toHaveBeenCalledTimes(2);
    expect(poolQuery.mock.calls[0]?.[0]).toContain("information_schema.tables");
    expect(poolQuery.mock.calls[1]?.[0]).toContain(
      "information_schema.columns",
    );
    expect(poolQuery.mock.calls.flatMap((call) => call).join(" ")).not.toMatch(
      /\b(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP)\b/,
    );
  });

  it("fails before traffic with the missing pre-provisioned table or column named", async () => {
    const requirements = explicitFeatureReleaseSchemaRequirements();
    const tableNames = Object.keys(requirements);
    poolQuery
      .mockResolvedValueOnce({
        rows: tableNames
          .filter(
            (table_name) =>
              table_name !== "business_catalog_cohort_audit_events",
          )
          .map((table_name) => ({ table_name })),
      })
      .mockResolvedValueOnce({
        rows: completeCatalogRows(requirements).filter(
          ({ table_name, column_name }) =>
            !(
              table_name === "business_website_cleanup_audit_events" &&
              column_name === "cleanup_status"
            ),
        ),
      });

    await expect(assertExplicitFeatureReleaseSchema()).rejects.toThrow(
      "business_catalog_cohort_audit_events, business_website_cleanup_audit_events.cleanup_status",
    );
    expect(poolQuery).toHaveBeenCalledTimes(2);
  });

  it("uses source-defined columns for every formerly strict-reachable request-path schema family", () => {
    const requirements = explicitFeatureReleaseSchemaRequirements({
      KINFOLK_MEDIA_BUCKET_ID: "configured",
      KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE: "true",
    });
    expect(requirements.business_directory_reconciliation_ledger).toContain(
      "reconciliation_state",
    );
    expect(requirements.business_legacy_map_location_attestations).toContain(
      "historical_baseline_sha",
    );
    expect(
      requirements.business_legacy_map_location_attestation_events,
    ).toContain("action");
    expect(requirements.business_website_cleanup_audit_events).toContain(
      "cleanup_status",
    );
    expect(requirements.business_admin_profile_edit_audit_events).toContain(
      "changed_fields",
    );
    expect(requirements.business_catalog_cohort_memberships).toContain(
      "cohort_key",
    );
    expect(requirements.business_catalog_cohort_audit_events).toContain(
      "after_state",
    );
    expect(requirements.media_assets).toEqual(
      expect.arrayContaining([
        "vision_consent_granted_at",
        "retention_expires_at",
        "deleted_at",
      ]),
    );
    expect(requirements.kinfolk_private_places).toContain("encrypted_payload");
    expect(requirements.kinfolk_private_place_events).toContain(
      "private_place_id",
    );
    expect(requirements.kinfolk_temporary_stays).toContain("encrypted_payload");
  });

  it("keeps the explicit startup path free of automatic schema writers and workers", () => {
    const strictGate = startup.indexOf(
      "await assertExplicitFeatureReleaseSchema(process.env, logger)",
    );
    const strictReturn = startup.indexOf("catalog-only startup gate passed");
    const strictPreflight = startup.slice(
      strictGate,
      startup.indexOf("} else {", strictGate),
    );
    expect(strictGate).toBeGreaterThan(-1);
    expect(strictReturn).toBeGreaterThan(strictGate);

    for (const writer of [
      "ensureKinfolkPreferredNameSchema(logger)",
      "ensureKinfolkQuestionImageSchemaOnly()",
      "ensureKinfolkPrivatePlacesSchema(",
      "ensureKinfolkTemporaryStaysSchema(",
      "ensureDirectoryReconciliationLedgerSchema(logger)",
      "ensureFounderMapRestorationSchema(logger)",
      "ensureLegacyMapLocationAttestationSchema(logger)",
      "ensureInternationalDirectoryOnlyVisibilitySchema(",
      "ensureBusinessWebsiteCleanupAuditSchema(",
      "ensureAdminBusinessProfileReceiptsAndCatalogSchema(logger)",
      "ensureBusinessDeletionHoldSchema(pool)",
      "ensureKinfolkCurrentOnlinePresenceReviewSchema(pool)",
      "runPrivatePlacesProductionSyntheticAcceptance()",
      "runStartupMigrations(logger)",
    ]) {
      expect(strictPreflight).not.toContain(writer);
    }
    expect(startup).toContain(
      "if (!explicitFeatureReleaseMode && shouldRunPrivatePlacesSyntheticQaAcceptance())",
    );
    for (const writer of [
      "initPoolInstrumentation(pool, getPool)",
      "startFounderMapRestorationWorker(pool, logger)",
      "startBusinessDeletionHoldWorker(pool, logger)",
      "startTemporaryStayRetentionScheduler(logger)",
      "startDirectoryPublicationWorker(directoryReviewPool, pool)",
      "startHealthMonitor()",
      "initStripe().catch(",
      "startLatinxLehighValleyPublication(pool,",
      "runStartupMigrations(logger)",
      "seedLibraryStarterTopics(pool)",
      "seedLibraryStarterEntries(pool)",
      "startCityHealthAlertScheduler()",
      "startKinfolkQuestionImageRetentionScheduler(logger)",
      "startNudgeCronScheduler()",
      "startLibraryGrowthWorker()",
      "startCityRequestFlush()",
    ]) {
      expect(startup.indexOf(writer)).toBeGreaterThan(strictReturn);
    }
    expect(gateSource).not.toMatch(
      /\b(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP)\b/,
    );
  });
});
