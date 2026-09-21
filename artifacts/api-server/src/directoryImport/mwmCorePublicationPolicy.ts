export const MWM_CORE_PUBLICATION_MODE_ENV = "MWM_CORE_PUBLICATION_MODE" as const;
export const MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH_ENV =
  "MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH" as const;
export const MWM_CORE_PUBLICATION_POLICY_VERSION =
  "mwm-core-black-latino-source-evidence-v2" as const;
export const MWM_CORE_SOURCE_BACKED_COHORT =
  "mwm_source_backed_candidate" as const;

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
 * Publication remains unchanged unless the dedicated MWM Core mode is enabled.
 * When enabled, this is an allow-list: every incoming row must carry immutable,
 * source-row receipt metadata created by the offline evidence classifier.
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
  if (row.mwm_core_cohort !== MWM_CORE_SOURCE_BACKED_COHORT) {
    return {
      ok: false,
      code: "MWM_CORE_SOURCE_BACKED_COHORT_REQUIRED",
      message: "MWM Core publication accepts only the approved source-backed cohort.",
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
  "Enable MWM_CORE_PUBLICATION_MODE=source_backed only with a derived, signed cohort whose receipt root hash matches MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH. This gate never infers identity and does not publish rows by itself.";
