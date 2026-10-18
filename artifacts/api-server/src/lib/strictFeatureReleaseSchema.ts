import { pool } from "@workspace/db";
import type { Logger } from "pino";

export type StrictFeatureReleaseSchemaRequirements = Readonly<
  Record<string, readonly string[]>
>;

/**
 * Request-path structures formerly created automatically before traffic. In
 * explicit feature-release mode they must be provisioned by an operator; the
 * startup gate below reads PostgreSQL catalogs only and never repairs them.
 */
export function explicitFeatureReleaseSchemaRequirements(
  environment: NodeJS.ProcessEnv = process.env,
): StrictFeatureReleaseSchemaRequirements {
  const required: Record<string, readonly string[]> = {
    kinfolk_private_memories: [
      "id",
      "user_id",
      "content",
      "purpose",
      "expires_at",
      "paused_at",
      "revoked_at",
      "created_at",
      "updated_at",
    ],
    business_directory_reconciliation_ledger: [
      "business_id",
      "reconciliation_state",
      "reason_code",
      "recommended_action",
    ],
    business_directory_reconciliation_audit_events: [
      "business_id",
      "action",
      "after_state",
    ],
    business_map_restoration_outcomes: [
      "business_id",
      "policy_version",
      "outcome",
      "reason",
    ],
    business_legacy_map_location_attestations: [
      "business_id",
      "historical_baseline_sha",
      "receipt_gate_sha",
      "manifest_row_checksum",
    ],
    business_legacy_map_location_attestation_events: [
      "attestation_id",
      "action",
    ],
    international_directory_only_visibility_receipts: [
      "business_id",
      "policy_version",
      "valid_until",
      "revoked_at",
    ],
    international_directory_only_visibility_audit_events: [
      "business_id",
      "action",
      "after_state",
    ],
    businesses: ["website_cleanup_status", "website_cleanup_at"],
    business_website_cleanup_audit_events: [
      "business_id",
      "cleanup_status",
      "evidence_source_url",
    ],
    business_admin_profile_edit_audit_events: [
      "business_id",
      "changed_fields",
      "before_state",
      "after_state",
    ],
    business_admin_ownership_source_receipts: ["business_id", "source_url"],
    business_profile_field_receipts: [
      "business_id",
      "field_name",
      "source_url",
    ],
    business_catalog_cohort_memberships: [
      "business_id",
      "cohort_key",
      "state",
      "reason",
    ],
    business_catalog_cohort_audit_events: [
      "business_id",
      "action",
      "after_state",
    ],
    business_permanent_deletion_audit_events: [
      "business_id",
      "snapshot",
      "created_at",
    ],
    business_deletion_holds: [
      "business_id",
      "state",
      "delete_after",
      "snapshot",
    ],
    business_deletion_hold_events: [
      "business_id",
      "action",
      "delete_after",
      "snapshot",
    ],
    kinfolk_current_online_presence_reviews: [
      "business_id",
      "state",
      "original_listing_state",
      "verification_evidence",
      "source_manifest",
    ],
    kinfolk_current_online_presence_review_events: ["business_id", "action"],
  };

  if (environment.KINFOLK_MEDIA_BUCKET_ID?.trim()) {
    required.media_assets = [
      "id",
      "purpose",
      "status",
      "vision_consent_granted_at",
      "retention_expires_at",
      "deleted_at",
    ];
  }
  if (
    environment.KINFOLK_PRIVATE_PLACES_ENABLED === "true" ||
    environment.KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE === "true"
  ) {
    required.kinfolk_private_places = ["id", "user_id", "encrypted_payload"];
    required.kinfolk_private_place_events = [
      "id",
      "private_place_id",
      "action",
    ];
    required.kinfolk_temporary_stays = ["id", "user_id", "encrypted_payload"];
  }

  return required;
}

/**
 * The explicit feature-release service must never repair its database during
 * startup. Operators provision these request-path schemas before enabling the
 * mode; this gate only inspects PostgreSQL catalogs and stops traffic clearly
 * when a prerequisite is absent.
 */
export async function assertExplicitFeatureReleaseSchema(
  environment: NodeJS.ProcessEnv = process.env,
  logger?: Logger,
): Promise<void> {
  const required = explicitFeatureReleaseSchemaRequirements(environment);
  const tableNames = Object.keys(required);
  const tableResult = await pool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [tableNames],
  );
  const presentTables = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = tableNames.filter((table) => !presentTables.has(table));

  const columnResult = await pool.query<{
    table_name: string;
    column_name: string;
  }>(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [tableNames],
  );
  const presentColumns = new Set(
    columnResult.rows.map((row) => `${row.table_name}.${row.column_name}`),
  );
  const missingColumns = Object.entries(required).flatMap(([table, columns]) =>
    columns
      .filter((column) => !presentColumns.has(`${table}.${column}`))
      .map((column) => `${table}.${column}`),
  );

  if (missingTables.length > 0 || missingColumns.length > 0) {
    const missing = [...missingTables, ...missingColumns].join(", ");
    throw new Error(
      `Explicit feature-release startup schema gate failed: pre-provision required schema before release [${missing}].`,
    );
  }

  logger?.info(
    { checkedTables: tableNames.length },
    "Explicit feature-release startup schema gate passed with catalog reads only",
  );
}
