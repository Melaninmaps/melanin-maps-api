import {
  documentedDiscoveryEligibilitySqlPredicate,
  isDocumentedDiscoveryEligible,
  type DocumentedDiscoveryEligibilityCandidate,
} from "./documentedDiscoveryEligibility";

/**
 * Compatibility module for existing directory, map, universal-search, Explore,
 * and Kinfolk callers. The policy is now one documented-evidence gate rather
 * than a source-cohort toggle. Keep these exports while the surface modules
 * converge on the clearer documentedDiscoveryEligibility name.
 */
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

/**
 * The compatibility signal is permanently enabled. A config value cannot
 * restore the former all-live catalog, because that would let a stale or
 * undocumented profile back into ordinary recommendations. Operational
 * disablement is fail-closed through MWM_DOCUMENTED_DISCOVERY_POLICY_MODE=hold.
 */
export function isMwmCoreDiscoveryEnabled(
  _configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): boolean {
  return true;
}

/** Ordinary discovery is always the documented Diaspora catalog. */
export function isMwmDiasporaPromotionEnabled(
  _configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): boolean {
  return true;
}

/**
 * Retained only for historic source-provenance reporting and admin review. It
 * never makes a business eligible for member-facing discovery by itself.
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

/** Historical importer marker for provenance/auditing only, never an eligibility predicate. */
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

/** Compatibility predicate for every existing ordinary discovery caller. */
export function mwmCoreDiscoverySqlPredicate(
  businessIdExpression: string,
  _configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): string {
  return documentedDiscoveryEligibilitySqlPredicate(businessIdExpression, "discovery");
}

/** Compatibility predicate for ownership-filtered Discovery, Kinfolk, and Explore. */
export function mwmDiasporaPromotionSqlPredicate(
  businessIdExpression: string,
  _configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): string {
  return documentedDiscoveryEligibilitySqlPredicate(businessIdExpression, "discovery");
}

/**
 * General directory browse is deliberately broader than Kinfolk and ownership
 * filtering: an active canonical profile with an active, time-bounded source
 * receipt and an official website or social destination remains searchable
 * even when no ownership designation is documented. It never grants an
 * ownership filter, Kinfolk recommendation, Discovery promotion, or map pin.
 */
export function sourceBackedGeneralDirectorySqlPredicate(
  businessIdExpression: string,
): string {
  return `EXISTS (
    SELECT 1
      FROM public.business_source_directory_receipts AS source_directory_receipt
     WHERE source_directory_receipt.business_id::text = ${businessIdExpression}::text
       AND source_directory_receipt.mapping_status = 'active'
       AND source_directory_receipt.observed_at + INTERVAL '180 days' > CURRENT_TIMESTAMP
       AND (
         NULLIF(BTRIM(source_directory_receipt.official_website_url), '') IS NOT NULL
         OR COALESCE(source_directory_receipt.official_socials, '{}'::jsonb) <> '{}'::jsonb
       )
  )`;
}

/**
 * Public directory browse can use source-backed general eligibility, while the
 * documented Diaspora predicate remains mandatory for ownership-filtered
 * results, Kinfolk, Discovery, and map surfaces.
 */
export function mwmPublicDirectorySqlPredicate(
  businessIdExpression: string,
): string {
  return `(${documentedDiscoveryEligibilitySqlPredicate(businessIdExpression, "discovery")}
    OR ${sourceBackedGeneralDirectorySqlPredicate(businessIdExpression)})`;
}

export type MwmCoreReceiptCandidate = DocumentedDiscoveryEligibilityCandidate & {
  mwmCoreCohort?: string | null;
  mwm_core_cohort?: string | null;
};

/** Pure compatibility counterpart used by tests and non-SQL callers. */
export function isMwmCoreDiscoveryEligible(
  record: MwmCoreReceiptCandidate,
  _configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): boolean {
  return isDocumentedDiscoveryEligible(record);
}

/** Pure counterpart for the documented Diaspora recommendation catalog. */
export function isMwmDiasporaPromotionEligible(
  record: MwmCoreReceiptCandidate,
  _configuredValue: string | undefined = process.env[MWM_PROMOTION_CATALOG_MODE_ENV],
): boolean {
  return isDocumentedDiscoveryEligible(record);
}

/** Visible copy used only where an operator needs the policy explanation. */
export const MWM_CORE_EVIDENCE_RULE =
  "Kinfolk, Discovery, map, and ownership-filtered browse require a current documented identity, ownership, and official-presence receipt. General directory browse may use a current active source receipt with an official website or social presence but never creates an ownership claim. A source designation is not owner verification; missing, conflicting, or stale ownership evidence fails closed for promoted surfaces.";

export const MWM_CORE_ACTIVATION_CONTRACT =
  "Record reviewed field-level evidence before an administrator marks a profile qualified for ownership-filtered or promoted surfaces. The server-owned documented gate applies to map pins, Discovery, universal search, Explore, and Kinfolk; general directory browse instead requires an active source receipt with an official member-facing destination. Neither path creates a map pin without separate sourced geocode evidence.";
