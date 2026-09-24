import {
  DIASPORA_OWNERSHIP_DESIGNATIONS,
  ownershipDesignationFilterId,
} from "@workspace/constants";

export const MWM_CORE_DISCOVERY_MODE_ENV = "MWM_CORE_DISCOVERY_MODE" as const;
export const MWM_CORE_SOURCE_BACKED_COHORT =
  "source_backed_mwm_candidate_live" as const;
export const MWM_PROMOTION_CATALOG_MODE_ENV =
  "MWM_PROMOTION_CATALOG_MODE" as const;
export const MWM_DOCUMENTED_DIASPORA_PROMOTION_MODE =
  "documented_diaspora" as const;
export const MWM_ALL_CURRENT_LIVE_PROMOTION_MODE =
  "all_current_live" as const;
export const COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY =
  "completed_cohort_directory_discovery_v1" as const;
export const COMPLETED_COHORT_MANIFEST_CHECKSUM =
  "ca576aeb92b6cd0e73a7b967bf510f7e26b6a3ceb909c5511a222c25d862469a" as const;
export const NATIONAL_MASTER_DIRECTORY_SOURCE =
  "national_diaspora_master_18294" as const;

const DIASPORA_OWNERSHIP_VALUE_SQL = DIASPORA_OWNERSHIP_DESIGNATIONS
  // The database expression below normalizes a stored source designation to
  // lower-case before comparing it. The approved literal set must use the
  // same normalization; otherwise every source-documented designation misses
  // the predicate and the promotion catalog (including map pins) is empty.
  .map((value) => `'${value.toLocaleLowerCase("en-US").replace(/'/g, "''")}'`)
  .join(", ");

/**
 * Discovery is only narrowed when the founder explicitly enables the
 * source-backed MWM Core mode. The default keeps existing public discovery
 * intact while receipts are being reconciled. When enabled, it is fail-closed:
 * a record needs a row-level receipt from the approved source-backed cohort.
 *
 * This historical receipt cohort is distinct from the Diaspora Promotion
 * Catalog below. It is retained for provenance and staged-publication audit,
 * not used to erase a documented existing business from the promotion catalog.
 */
export function isMwmCoreDiscoveryEnabled(
  configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): boolean {
  return configuredValue?.trim().toLowerCase() === "source_backed";
}

/**
 * During founder-led inventory cleanup, every current public listing remains
 * available to Kinfolk, map, city/category, and "Find me a business" results
 * until an administrator archives it. This is a source-controlled temporary
 * catalog rule, never a member-supplied query parameter. Exact ownership
 * preference filters still require explicit designations downstream.
 */
export function isMwmDiasporaPromotionEnabled(
  configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): boolean {
  void configuredValue;
  return false;
}

function ownershipDesignationExpressionFor(businessIdExpression: string): string {
  if (businessIdExpression.endsWith('."id"')) {
    return `${businessIdExpression.slice(0, -5)}."ownership_designations"`;
  }
  if (businessIdExpression.endsWith(".id")) {
    return `${businessIdExpression.slice(0, -3)}.ownership_designations`;
  }
  throw new Error("MWM_PROMOTION_BUSINESS_IDENTIFIER_REQUIRED");
}

/**
 * Static, source-controlled predicate for default recommendation surfaces. The
 * active founder-directed cleanup catalog includes every public, non-archived
 * listing. A request for a specific ownership designation adds a separate,
 * explicit designation predicate at the Kinfolk query layer.
 */
export function mwmDiasporaPromotionSqlPredicate(
  businessIdExpression: string,
  configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): string {
  if (!isMwmDiasporaPromotionEnabled(configuredValue)) return "TRUE";
  const designations = ownershipDesignationExpressionFor(businessIdExpression);
  return `EXISTS (
    SELECT 1
      FROM jsonb_array_elements_text(COALESCE(${designations}, '[]'::jsonb)) AS mwm_diaspora_designation(value)
     WHERE lower(trim(mwm_diaspora_designation.value)) IN (${DIASPORA_OWNERSHIP_VALUE_SQL})
  )`;
}

/**
 * Any profile already created or linked by the completed source cohort, plus
 * an activation-audited directory-only profile, is public search inventory.
 * Missing coordinate values never become fabricated map pins.
 */
export function completedCohortDirectoryDiscoverySqlPredicate(
  businessIdExpression: string,
): string {
  return `EXISTS (
    SELECT 1
      FROM public.directory_publication_provenance AS completed_cohort_provenance
     WHERE completed_cohort_provenance.record_id::text = ${businessIdExpression}::text
       AND completed_cohort_provenance.source_sha256 = '${COMPLETED_COHORT_MANIFEST_CHECKSUM}'
       AND completed_cohort_provenance.outcome IN ('created', 'linked_existing')
  ) OR EXISTS (
    SELECT 1
      FROM public.completed_cohort_directory_discovery_receipts AS cohort_directory_receipt
     WHERE cohort_directory_receipt.business_id::text = ${businessIdExpression}::text
       AND cohort_directory_receipt.policy_version = '${COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY}'
       AND cohort_directory_receipt.outcome IN ('created', 'linked_existing')
  )`;
}

/**
 * The national master uses its own checksum-locked activation route and
 * importer-only source marker. These are public directory profiles, not
 * inferred ownership badges and not a map-coordinate substitute.
 */
export function nationalMasterDirectoryDiscoverySqlPredicate(
  businessIdExpression: string,
): string {
  if (businessIdExpression.endsWith('."id"')) {
    return `COALESCE(${businessIdExpression.slice(0, -5)}."data_source", '') = '${NATIONAL_MASTER_DIRECTORY_SOURCE}'`;
  }
  if (businessIdExpression.endsWith(".id")) {
    return `COALESCE(${businessIdExpression.slice(0, -3)}.data_source, '') = '${NATIONAL_MASTER_DIRECTORY_SOURCE}'`;
  }
  throw new Error("NATIONAL_MASTER_BUSINESS_IDENTIFIER_REQUIRED");
}

/**
 * A static SQL predicate for receipt-audited MWM Core queries. This must be a
 * source-controlled expression such as `b.id`; callers never pass a request
 * value here.
 */
export function mwmCoreDiscoverySqlPredicate(
  businessIdExpression: string,
  configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): string {
  if (!isMwmCoreDiscoveryEnabled(configuredValue)) return "TRUE";

  return `EXISTS (
    SELECT 1
      FROM public.business_inventory_cohort_receipts AS mwm_core_receipt
     WHERE mwm_core_receipt.business_id::text = ${businessIdExpression}::text
       AND mwm_core_receipt.cohort = '${MWM_CORE_SOURCE_BACKED_COHORT}'
  )`;
}

export type MwmCoreReceiptCandidate = {
  mwmCoreCohort?: string | null;
  mwm_core_cohort?: string | null;
  ownershipDesignations?: readonly string[] | null;
  ownership_designations?: readonly string[] | null;
};

/** Pure counterpart used by tests and non-SQL callers. */
export function isMwmCoreDiscoveryEligible(
  record: MwmCoreReceiptCandidate,
  configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): boolean {
  if (!isMwmCoreDiscoveryEnabled(configuredValue)) return true;
  return (
    record.mwmCoreCohort ?? record.mwm_core_cohort ?? null
  ) === MWM_CORE_SOURCE_BACKED_COHORT;
}

/** Pure counterpart for the current all-live recommendation catalog. */
export function isMwmDiasporaPromotionEligible(
  record: MwmCoreReceiptCandidate,
  configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): boolean {
  if (!isMwmDiasporaPromotionEnabled(configuredValue)) return true;
  const documentedIds = new Set(
    (record.ownershipDesignations ?? record.ownership_designations ?? [])
      .map(ownershipDesignationFilterId),
  );
  return DIASPORA_OWNERSHIP_DESIGNATIONS.some(
    (designation) => documentedIds.has(ownershipDesignationFilterId(designation)),
  );
}

/** Visible copy used only where the promotion policy needs operator explanation. */
export const MWM_CORE_EVIDENCE_RULE =
  "During founder-led cleanup, every public, non-archived listing remains eligible for Kinfolk, map, city/category, and Find Me a Business results until an administrator archives it. Exact ownership filters require an explicit designation; identity is never inferred from a name, cuisine, language, image, or neighborhood.";

export const MWM_CORE_ACTIVATION_CONTRACT =
  "Use source-backed receipts for publication provenance. Keep the active catalog on all current public listings during duplicate and ownership review; archive a record to remove it from default recommendation, map, and category/city discovery.";
