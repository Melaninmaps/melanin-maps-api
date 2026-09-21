export const MWM_CORE_PUBLICATION_MODE_ENV = "MWM_CORE_PUBLICATION_MODE" as const;
export const MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH_ENV =
  "MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH" as const;
export const MWM_CORE_PUBLICATION_POLICY_VERSION =
  "source-receipted-directory-publication-v1" as const;
export const MWM_CORE_CHAMBER_COHORT =
  "mwm_chamber_backed_candidate" as const;
export const MWM_CORE_INSTITUTIONAL_DIRECTORY_COHORT =
  "mwm_institutional_directory_candidate" as const;
export const SOURCE_REPUTABLE_LISTING_COHORT =
  "source_reputable_listing_candidate" as const;
export const MWM_CORE_AUTOMATIC_COHORTS = new Set<string>([
  MWM_CORE_CHAMBER_COHORT,
  MWM_CORE_INSTITUTIONAL_DIRECTORY_COHORT,
  SOURCE_REPUTABLE_LISTING_COHORT,
]);
export type MwmCoreEvidenceLane =
  | "chamber"
  | "institutional_directory"
  | "reputable_source";

export type MwmCorePublicationAdmission =
  | { ok: true }
  | { ok: false; code: string; message: string };

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Publication remains unchanged unless the dedicated source-receipted mode is
 * enabled. When enabled, this is an allow-list: every incoming row must carry
 * immutable source-row receipt metadata created by the offline classifier.
 * This gate distinguishes a source-reported designation from owner verification;
 * it never turns a directory reference into an owner-verified claim.
 */
export function isMwmCorePublicationEnabled(
  configuredValue: string | undefined = process.env[MWM_CORE_PUBLICATION_MODE_ENV],
): boolean {
  return configuredValue?.trim().toLowerCase() === "source_backed";
}

export function validateMwmCorePublicationRecord(
  record: unknown,
  environment: NodeJS.ProcessEnv = process.env,
): MwmCorePublicationAdmission {
  if (!isMwmCorePublicationEnabled(environment[MWM_CORE_PUBLICATION_MODE_ENV])) {
    return { ok: true };
  }

  const expectedRootHash = environment[MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH_ENV];
  if (!isSha256(expectedRootHash)) {
    return {
      ok: false,
      code: "MWM_CORE_PUBLICATION_CONFIGURATION_REQUIRED",
      message: "MWM Core publication requires a configured approved receipt root hash.",
    };
  }

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return {
      ok: false,
      code: "MWM_CORE_RECEIPT_REQUIRED",
      message: "MWM Core publication requires source-backed receipt metadata for every row.",
    };
  }

  const row = record as Record<string, unknown>;
  if (row.mwm_core_policy_version !== MWM_CORE_PUBLICATION_POLICY_VERSION) {
    return {
      ok: false,
      code: "MWM_CORE_POLICY_VERSION_REQUIRED",
      message: "MWM Core publication requires the approved source-evidence policy version.",
    };
  }
  const cohort = typeof row.mwm_core_cohort === "string"
    ? row.mwm_core_cohort
    : "";
  const evidenceLane = row.mwm_core_evidence_lane;
  const expectedCohort = evidenceLane === "chamber"
    ? MWM_CORE_CHAMBER_COHORT
    : evidenceLane === "institutional_directory"
      ? MWM_CORE_INSTITUTIONAL_DIRECTORY_COHORT
      : evidenceLane === "reputable_source"
        ? SOURCE_REPUTABLE_LISTING_COHORT
      : null;
  if (!expectedCohort || cohort !== expectedCohort || !MWM_CORE_AUTOMATIC_COHORTS.has(cohort)) {
    return {
      ok: false,
      code: "MWM_CORE_APPROVED_EVIDENCE_LANE_REQUIRED",
      message: "Source-receipted publication accepts only Chamber, institutional-directory, or reputable-source receipt lanes.",
    };
  }
  if (
    row.mwm_publication_classification !== "source_reported_mwm_designation" &&
    row.mwm_publication_classification !== "unverified_source_listing"
  ) {
    return {
      ok: false,
      code: "MWM_SOURCE_REPORTED_CLASSIFICATION_REQUIRED",
      message: "Source-receipted publication requires an explicit source-reported or unverified-listing classification.",
    };
  }
  if (row.mwm_core_receipt_root_hash !== expectedRootHash) {
    return {
      ok: false,
      code: "MWM_CORE_RECEIPT_ROOT_MISMATCH",
      message: "MWM Core publication receipt root does not match the approved cohort root.",
    };
  }
  if (!isSha256(row.mwm_core_receipt_hash) ||
      !isSha256(row.mwm_core_source_manifest_sha256) ||
      typeof row.mwm_core_source_manifest !== "string" ||
      !row.mwm_core_source_manifest.trim() ||
      !isPositiveInteger(row.mwm_core_source_row) ||
      (typeof row.mwm_core_source_row_id !== "string" &&
        typeof row.mwm_core_source_row_id !== "number")) {
    return {
      ok: false,
      code: "MWM_CORE_RECEIPT_METADATA_INVALID",
      message: "MWM Core publication requires complete immutable source-row receipt metadata.",
    };
  }

  return { ok: true };
}

export function validateMwmCorePublicationBatch(
  records: unknown[],
  environment: NodeJS.ProcessEnv = process.env,
): MwmCorePublicationAdmission {
  for (const record of records) {
    const result = validateMwmCorePublicationRecord(record, environment);
    if (!result.ok) return result;
  }
  return { ok: true };
}

export const MWM_CORE_PUBLICATION_ACTIVATION_CONTRACT =
  "Enable MWM_CORE_PUBLICATION_MODE=source_backed only with a derived, signed source-receipted cohort whose receipt root hash matches MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH. A source-reported designation is shown as unverified until an owner or approved verifier confirms it; an unverified source listing does not claim any ownership designation. This gate never infers identity and does not publish rows by itself.";
