import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  initializeFeatureReleasePublicationStartup,
  initializeFeatureReleaseStartup,
  NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS,
  NON_STRICT_STARTUP_SCHEMA_OPERATIONS,
  strictFeatureReleaseSchemaRequirementsFromEnvironment,
  verifyStrictDirectoryReviewSchema,
  verifyStrictFeatureReleaseSchema,
} from "../strictFeatureReleaseStartup";

const indexSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../index.ts"),
  "utf8",
);

const safePublicBusinessFunction = `SELECT COALESCE(p_status, 'active') NOT IN ('suspended', 'removed', 'deleted', 'permanently_hidden')
  AND COALESCE(p_listing_status, '') IN ('live_unclaimed', 'live_claimed')
  AND COALESCE(p_permanently_hidden, false) = false
  AND NOT (
    COALESCE(p_name, '') ILIKE '%[DEMO]%'
    OR COALESCE(p_description, '') ILIKE '%[DEMO]%'
    OR LOWER(BTRIM(COALESCE(p_data_source, ''))) IN ('demo', 'demo_seed')
    OR LOWER(BTRIM(COALESCE(p_status, ''))) IN ('demo', 'test')
    OR LOWER(BTRIM(COALESCE(p_listing_status, ''))) = 'demo'
    OR REGEXP_REPLACE(COALESCE(p_phone, ''), '[^0-9]', '', 'g') IN ('15555550100', '5555550100')
  );`;
const safePublicBusinessesView = `SELECT b.* FROM public.businesses b
  WHERE public.business_record_is_public(b.status, b.listing_status, b.is_duplicate, b.permanently_hidden, b.name, b.description, b.data_source, b.phone)`;

describe("strict feature-release startup", () => {
  it("runs only the read-only compatibility preflight in strict mode", async () => {
    const verify = vi.fn().mockResolvedValue(undefined);
    const runSchemaOperation = vi.fn().mockResolvedValue(undefined);

    await expect(initializeFeatureReleaseStartup({
      strictFeatureReleaseMode: true,
      verifyStrictFeatureReleaseSchema: verify,
      runNonStrictStartupSchemaOperation: runSchemaOperation,
    })).resolves.toBe("strict");

    expect(verify).toHaveBeenCalledTimes(1);
    expect(runSchemaOperation).not.toHaveBeenCalled();
  });

  it("retains every ordered schema bootstrap helper in normal mode", async () => {
    const verify = vi.fn().mockResolvedValue(undefined);
    const operations: string[] = [];

    await expect(initializeFeatureReleaseStartup({
      strictFeatureReleaseMode: false,
      verifyStrictFeatureReleaseSchema: verify,
      runNonStrictStartupSchemaOperation: async (operation) => {
        operations.push(operation);
      },
    })).resolves.toBe("normal");

    expect(verify).not.toHaveBeenCalled();
    expect(operations).toEqual([...NON_STRICT_STARTUP_SCHEMA_OPERATIONS]);
  });

  it("suppresses both publication schema helpers only in strict mode", async () => {
    const strictOperations: string[] = [];
    await initializeFeatureReleasePublicationStartup({
      strictFeatureReleaseMode: true,
      runNonStrictPublicationSchemaOperation: async (operation) => {
        strictOperations.push(operation);
      },
    });
    expect(strictOperations).toEqual([]);

    const normalOperations: string[] = [];
    await initializeFeatureReleasePublicationStartup({
      strictFeatureReleaseMode: false,
      runNonStrictPublicationSchemaOperation: async (operation) => {
        normalOperations.push(operation);
      },
    });
    expect(normalOperations).toEqual([...NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS]);
  });

  it("starts successfully in strict mode when the active release schema contract is present", async () => {
    const statements: string[] = [];
    const reader = {
      query: async <T extends Record<string, unknown>>(statement: string) => {
        statements.push(statement);
        return {
          rows: [{
            missing_relations: [], invalid_relation_kinds: [], missing_columns: [],
            present_forbidden_columns: [], invalid_columns: [], missing_constraints: [],
            malformed_constraints: [], missing_indexes: [], malformed_indexes: [],
            missing_triggers: [], malformed_triggers: [], missing_functions: [], invalid_functions: [],
            public_view_definition: safePublicBusinessesView,
            public_function_definition: safePublicBusinessFunction,
            public_function_immutable: true,
            public_function_security_definer: false,
            public_function_returns_boolean: true,
          }] as unknown as T[],
        };
      },
    };

    await expect(initializeFeatureReleaseStartup({
      strictFeatureReleaseMode: true,
      verifyStrictFeatureReleaseSchema: () => verifyStrictFeatureReleaseSchema(reader),
      runNonStrictStartupSchemaOperation: async () => {
        throw new Error("normal startup operation must not run in strict mode");
      },
    })).resolves.toBe("strict");

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("information_schema.columns");
    expect(statements[0]).toContain("pg_get_viewdef");
    expect(statements[0]).toContain("pg_get_constraintdef");
    expect(statements[0]).toContain("JOIN pg_constraint AS constraint_row");
    expect(statements[0]).not.toMatch(/\bAS constraint\s/);
    expect(statements[0]).toContain("businesses_prevent_queued_kinfolk_current_review_lifecycle_muta");
    expect(statements[0]).not.toContain("businesses_prevent_queued_kinfolk_current_review_lifecycle_mutation");
    expect(statements[0]).toContain("before delete or update|for each row");
    expect(statements[0]).not.toContain("before update or delete|for each row");
    expect(statements[0]).toContain("pg_get_indexdef");
    expect(statements[0]).toContain("pg_get_triggerdef");
    expect(statements[0]).toContain("business_directory_reconciliation_audit_business_idx");
    expect(statements[0]).not.toContain("business_directory_reconciliation_audit_events_business_idx");
    expect(statements[0]).toContain("user_id|archived_at|is_pinned desc|updated_at desc");
    expect(statements[0]).not.toContain("user_id|continuity_enabled|updated_at desc");
    expect(statements[0]).toContain("public_function_definition");
    expect(statements[0]).toContain("unexpected_columns");
    expect(statements[0]).toContain("trigger.tgenabled <> 'O'");
    expect(statements[0]).toMatch(/^\s*WITH[\s\S]*SELECT[\s\S]*$/i);
    expect(statements[0]).not.toMatch(/^\s*(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/im);
  });

  it("fails closed when a catalog-compatible public Directory view or predicate body is semantically weakened", async () => {
    const reader = {
      query: async <T extends Record<string, unknown>>(_statement: string) => ({
        rows: [{
          missing_relations: [], invalid_relation_kinds: [], missing_columns: [],
          present_forbidden_columns: [], invalid_columns: [], missing_constraints: [],
          malformed_constraints: [], missing_indexes: [], malformed_indexes: [],
          missing_triggers: [], malformed_triggers: [], missing_functions: [], invalid_functions: [],
          public_view_definition: "SELECT b.* FROM public.businesses b",
          public_function_definition: safePublicBusinessFunction.replace("'suspended', 'removed'", "'suspended'"),
          public_function_immutable: true,
          public_function_security_definer: false,
          public_function_returns_boolean: true,
        }] as unknown as T[],
      }),
    };

    await expect(verifyStrictFeatureReleaseSchema(reader, {
      requireQuestionImageSchema: false,
      requirePrivatePlacesSchema: false,
    })).rejects.toThrow("public Directory view or predicate function safety");
  });

  it("fails closed instead of repairing a missing strict-release schema dependency", async () => {
    const reader = {
      query: async <T extends Record<string, unknown>>(_statement: string) => ({
        rows: [{
          missing_relations: ["public.kinfolk_private_memories"],
          missing_columns: ["public.user_settings.kinfolk_continuity_disclosure_decision"],
        }] as unknown as T[],
      }),
    };

    await expect(verifyStrictFeatureReleaseSchema(reader)).rejects.toThrow(
      "Strict feature-release schema preflight failed (relations: public.kinfolk_private_memories; columns: public.user_settings.kinfolk_continuity_disclosure_decision).",
    );
  });

  it("fails closed for incompatible strict-release relation, column, constraint, index, and trigger contracts", async () => {
    const reader = {
      query: async <T extends Record<string, unknown>>(_statement: string) => ({
        rows: [{
          missing_relations: [],
          invalid_relation_kinds: ["public.public_businesses expected v found r"],
          missing_columns: [],
          invalid_columns: ["public.user_settings.kinfolk_continuity_enabled expected type bool nullable NO found type text nullable YES"],
          missing_constraints: ["public.user_settings.user_settings_kinfolk_continuity_disclosure_decision_check"],
          missing_indexes: ["public.kinfolk_sessions.kinfolk_sessions_owner_continuity_idx"],
          missing_triggers: ["public.businesses.businesses_prevent_queued_kinfolk_current_review_deletion"],
        }] as unknown as T[],
      }),
    };

    await expect(verifyStrictFeatureReleaseSchema(reader, {
      requireQuestionImageSchema: false,
      requirePrivatePlacesSchema: false,
    })).rejects.toThrow(
      "Strict feature-release schema preflight failed (relation kinds: public.public_businesses expected v found r; column definitions: public.user_settings.kinfolk_continuity_enabled expected type bool nullable NO found type text nullable YES; constraints: public.user_settings.user_settings_kinfolk_continuity_disclosure_decision_check; indexes: public.kinfolk_sessions.kinfolk_sessions_owner_continuity_idx; triggers: public.businesses.businesses_prevent_queued_kinfolk_current_review_deletion).",
    );
  });

  it("fails closed for weakened constraint, index, trigger, and enabled encrypted-location privacy contracts", async () => {
    const reader = {
      query: async <T extends Record<string, unknown>>(_statement: string) => ({
        rows: [{
          missing_relations: [], invalid_relation_kinds: [], missing_columns: [
            "public.kinfolk_private_places.encryption_key_version",
            "public.kinfolk_private_place_events.private_place_id",
          ],
          unexpected_columns: ["public.kinfolk_private_places.street_address"],
          present_forbidden_columns: ["public.kinfolk_private_places.exact_address"],
          invalid_columns: [], missing_constraints: [],
          malformed_constraints: ["public.kinfolk_private_places.kinfolk_private_places_encrypted_payload_check"],
          missing_indexes: [], malformed_indexes: ["public.kinfolk_private_places.kinfolk_private_places_owner_active_idx"],
          missing_triggers: [], malformed_triggers: ["public.businesses.businesses_prevent_queued_kinfolk_current_review_deletion (replica-only)"],
          missing_functions: [], invalid_functions: [],
        }] as unknown as T[],
      }),
    };

    await expect(verifyStrictFeatureReleaseSchema(reader, {
      requireQuestionImageSchema: false,
      requirePrivatePlacesSchema: true,
    })).rejects.toThrow(
      "columns: public.kinfolk_private_places.encryption_key_version, public.kinfolk_private_place_events.private_place_id; unexpected columns: public.kinfolk_private_places.street_address; forbidden plaintext columns: public.kinfolk_private_places.exact_address; constraint definitions: public.kinfolk_private_places.kinfolk_private_places_encrypted_payload_check; index definitions: public.kinfolk_private_places.kinfolk_private_places_owner_active_idx; trigger definitions: public.businesses.businesses_prevent_queued_kinfolk_current_review_deletion (replica-only)",
    );
  });

  it("fails closed for an enabled isolated Directory Review database without invoking its bootstrap writer", async () => {
    const statements: string[] = [];
    const reader = {
      query: async <T extends Record<string, unknown>>(statement: string) => {
        statements.push(statement);
        return {
          rows: [{ missing_relations: ["directory_review_outbox"] }] as unknown as T[],
        };
      },
    };

    await expect(verifyStrictDirectoryReviewSchema(reader)).rejects.toThrow(
      "Strict Directory Review schema preflight failed (relations: directory_review_outbox).",
    );
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatch(/^\s*WITH[\s\S]*SELECT[\s\S]*$/i);
    expect(statements[0]).not.toMatch(/\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
  });

  it("fails closed when Directory Review outbox lease, status, or index integrity is incompatible", async () => {
    const reader = {
      query: async <T extends Record<string, unknown>>(_statement: string) => ({
        rows: [{
          missing_relations: [],
          invalid_relation_kinds: [],
          missing_columns: [],
          invalid_columns: ["public.directory_review_outbox.lease_until expected type timestamptz nullable YES found type text nullable YES"],
          missing_constraints: ["public.directory_review_outbox.directory_review_outbox_status_check"],
          missing_indexes: ["public.directory_review_outbox.directory_review_outbox_ready"],
          missing_triggers: [],
        }] as unknown as T[],
      }),
    };

    await expect(verifyStrictDirectoryReviewSchema(reader)).rejects.toThrow(
      "Strict Directory Review schema preflight failed (column definitions: public.directory_review_outbox.lease_until expected type timestamptz nullable YES found type text nullable YES; constraints: public.directory_review_outbox.directory_review_outbox_status_check; indexes: public.directory_review_outbox.directory_review_outbox_ready).",
    );
  });

  it("requires optional privacy schemas only when their runtime paths are explicitly enabled", () => {
    expect(strictFeatureReleaseSchemaRequirementsFromEnvironment({})).toEqual({
      requireQuestionImageSchema: false,
      requirePrivatePlacesSchema: false,
    });
    expect(strictFeatureReleaseSchemaRequirementsFromEnvironment({
      KINFOLK_MEDIA_BUCKET_ID: "bucket-id",
      KINFOLK_PRIVATE_PLACES_ENABLED: "true",
    })).toEqual({
      requireQuestionImageSchema: true,
      requirePrivatePlacesSchema: true,
    });
    expect(strictFeatureReleaseSchemaRequirementsFromEnvironment({
      KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE: "true",
    })).toEqual({
      requireQuestionImageSchema: false,
      requirePrivatePlacesSchema: false,
    });
  });

  it("binds all identified schema helpers to the normal-only operation runner and suppresses automatic writers in strict mode", () => {
    for (const operation of [
      ...NON_STRICT_STARTUP_SCHEMA_OPERATIONS,
      ...NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS,
    ]) {
      expect(indexSource).toContain(`case "${operation}"`);
    }

    expect(indexSource).toContain("initializeFeatureReleaseStartup({");
    expect(indexSource).toContain("initializeFeatureReleasePublicationStartup({");
    expect(indexSource).toContain("await verifyStrictFeatureReleaseSchema(pool)");
    expect(indexSource).toContain("await verifyStrictDirectoryReviewSchema(directoryReviewPool)");
    expect(indexSource).toContain("if (!explicitFeatureReleaseMode && shouldRunPrivatePlacesSyntheticQaAcceptance())");

    const strictWorkerReturn = indexSource.indexOf(
      "Explicit feature release mode: skipping automatic startup writers, seeds, publishers, and workers",
    );
    const mapRestorationWorker = indexSource.indexOf("startFounderMapRestorationWorker(pool, logger)");
    const deletionWorker = indexSource.indexOf("startBusinessDeletionHoldWorker(pool, logger)");
    const temporaryStayScheduler = indexSource.indexOf("startTemporaryStayRetentionScheduler(logger)");
    expect(strictWorkerReturn).toBeGreaterThan(-1);
    expect(mapRestorationWorker).toBeGreaterThan(strictWorkerReturn);
    expect(deletionWorker).toBeGreaterThan(strictWorkerReturn);
    expect(temporaryStayScheduler).toBeGreaterThan(strictWorkerReturn);
  });
});
