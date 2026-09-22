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

const DIASPORA_OWNERSHIP_VALUE_SQL = DIASPORA_OWNERSHIP_DESIGNATIONS
  .map((value) => `'${value.replace(/'/g, "''")}'`)
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
 * The product defaults to documented Diaspora promotion. `all_public` is an
 * operator-only emergency rollback, never a member-supplied query parameter.
 */
export function isMwmDiasporaPromotionEnabled(
  configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): boolean {
  return configuredValue?.trim().toLowerCase() !== "all_public";
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
 * Static, source-controlled predicate for default promotion surfaces. A member
 * can search an explicitly named public business through the separate direct
 * lookup path, but it is not promoted by default unless this predicate passes.
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

/** Pure counterpart for recommendation and default discovery surfaces. */
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
  "Only a business with an explicit documented Diaspora ownership designation is promoted by default. A member can still deliberately search an otherwise public listing or explicitly broaden to all places. Identity is never inferred from a name, cuisine, language, image, or neighborhood.";

export const MWM_CORE_ACTIVATION_CONTRACT =
  "Use source-backed receipts for publication provenance. Keep default promotion in documented_diaspora mode and use a separate explicit all-places action for broad public lookup.";
