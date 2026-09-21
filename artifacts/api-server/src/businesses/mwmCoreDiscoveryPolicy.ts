export const MWM_CORE_DISCOVERY_MODE_ENV = "MWM_CORE_DISCOVERY_MODE" as const;
export const MWM_CORE_SOURCE_BACKED_COHORT =
  "source_backed_mwm_candidate_live" as const;

/**
 * Discovery is only narrowed when the founder explicitly enables the
 * source-backed MWM Core mode. The default keeps existing public discovery
 * intact while receipts are being reconciled. When enabled, it is fail-closed:
 * a record needs a row-level receipt from the approved source-backed cohort.
 */
export function isMwmCoreDiscoveryEnabled(
  configuredValue: string | undefined = process.env[MWM_CORE_DISCOVERY_MODE_ENV],
): boolean {
  return configuredValue?.trim().toLowerCase() === "source_backed";
}

/**
 * A static SQL predicate for vetted discovery queries. `businessIdExpression`
 * must be a source-controlled SQL identifier/expression such as `b.id` or
 * `businesses.id`; callers never pass a request value here.
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

/** Visible copy used only where the mode needs to be explained to an operator. */
export const MWM_CORE_EVIDENCE_RULE =
  "Only source-backed Black/African American or Latino/a/x/Hispanic ownership evidence qualifies for MWM Core discovery. Identity is never inferred from a name, cuisine, language, image, or neighborhood.";

export const MWM_CORE_ACTIVATION_CONTRACT =
  "Activate MWM_CORE_DISCOVERY_MODE=source_backed only after the complete row-level receipt migration succeeds against the approved live-count proof.";
