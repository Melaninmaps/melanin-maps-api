export const COMPLETED_COHORT_RECEIPT_ROOT =
  "948c818563f36f7cd6da67e003b3d6c8eb3e220e6561d898c4e94a7c31371653";
export const COMPLETED_COHORT_MANIFEST_CHECKSUM =
  "ca576aeb92b6cd0e73a7b967bf510f7e26b6a3ceb909c5511a222c25d862469a";
export const COMPLETED_COHORT_ROW_COUNT = 4183;

export type CohortDiscoveryState =
  | "public_listing"
  | "duplicate_source_alias"
  | "location_hold"
  | "publication_error_hold"
  | "review_hold";

export interface CohortCandidateForReconciliation {
  sourceRow: number;
  sourceRowId: string;
  dedupeKey: string | null;
  targetKind: string | null;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  rawRecord: unknown;
  outboxStatus: string | null;
  outboxError: string | null;
}

export interface CohortPublicationProvenance {
  sourceRow: number;
  recordId: string;
  outcome: "created" | "linked_existing";
}

export interface CohortReconciliationRow {
  sourceRow: number;
  sourceRowId: string;
  canonicalSourceRow: number | null;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  targetKind: string | null;
  discoveryState: CohortDiscoveryState;
  publicBusinessId: string | null;
  publicationOutcome: "created" | "linked_existing" | null;
  holdReason: string | null;
  sourceDesignationCount: number;
  sourceUrl: string | null;
}

function rawObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function designationCount(raw: Record<string, unknown>): number {
  const candidate = raw.ownership_designations ?? raw.ownershipDesignations;
  return Array.isArray(candidate) ? candidate.filter((value) => typeof value === "string" && value.trim()).length : 0;
}

export function classifyCohortHold(error: string | null | undefined): string | null {
  const normalized = String(error ?? "").trim();
  if (!normalized) return null;
  if (normalized.startsWith("geocode_unverified:")) return "geocode_unverified";
  if (normalized.startsWith("Physical publication requires address and non-zero coordinates.")) {
    return "physical_record_incomplete";
  }
  if (normalized.startsWith("Publication payload hash mismatch.")) return "payload_hash_mismatch";
  if (normalized.startsWith("Command ID payload hash mismatch.")) return "idempotency_hash_mismatch";
  return "unclassified_publication_error";
}

function isDuplicateSourceRow(
  raw: Record<string, unknown>,
  retainedStatus: string | null,
): boolean {
  // Protected ingress records exact within-batch duplicates as `declined`.
  // Receipt exports also retain the explicit outcome, so support both forms.
  return (
    retainedStatus === "declined" ||
    raw.directoryOutcome === "deduplicated" ||
    raw.directory_outcome === "deduplicated"
  );
}

/**
 * Converts immutable review/outbox/provenance facts into a member-safe, read-only
 * reconciliation row. It never creates, updates, publishes, hides, or deletes a
 * business. A duplicate source row remains an alias to its canonical record rather
 * than being converted into a conflicting second profile.
 */
export function reconcileCompletedCohortRow(
  candidate: CohortCandidateForReconciliation,
  provenance: CohortPublicationProvenance | undefined,
  canonicalSourceRow: number | null = null,
  canonicalProvenance: CohortPublicationProvenance | undefined = undefined,
): CohortReconciliationRow {
  const raw = rawObject(candidate.rawRecord);
  const holdReason = classifyCohortHold(candidate.outboxError);
  const sourceUrl = nullableText(raw.source_url ?? raw.sourceUrl);

  if (provenance) {
    return {
      sourceRow: candidate.sourceRow,
      sourceRowId: candidate.sourceRowId,
      canonicalSourceRow: candidate.sourceRow,
      name: candidate.name,
      city: candidate.city,
      state: candidate.state,
      country: candidate.country,
      targetKind: candidate.targetKind,
      discoveryState: "public_listing",
      publicBusinessId: provenance.recordId,
      publicationOutcome: provenance.outcome,
      holdReason: null,
      sourceDesignationCount: designationCount(raw),
      sourceUrl,
    };
  }

  if (isDuplicateSourceRow(raw, candidate.status)) {
    return {
      sourceRow: candidate.sourceRow,
      sourceRowId: candidate.sourceRowId,
      canonicalSourceRow,
      name: candidate.name,
      city: candidate.city,
      state: candidate.state,
      country: candidate.country,
      targetKind: candidate.targetKind,
      discoveryState: "duplicate_source_alias",
      publicBusinessId: canonicalProvenance?.recordId ?? null,
      publicationOutcome: canonicalProvenance?.outcome ?? null,
      holdReason: "duplicate_within_completed_cohort",
      sourceDesignationCount: designationCount(raw),
      sourceUrl,
    };
  }

  if (holdReason === "geocode_unverified" || holdReason === "physical_record_incomplete") {
    return {
      sourceRow: candidate.sourceRow,
      sourceRowId: candidate.sourceRowId,
      canonicalSourceRow: null,
      name: candidate.name,
      city: candidate.city,
      state: candidate.state,
      country: candidate.country,
      targetKind: candidate.targetKind,
      discoveryState: "location_hold",
      publicBusinessId: null,
      publicationOutcome: null,
      holdReason,
      sourceDesignationCount: designationCount(raw),
      sourceUrl,
    };
  }

  if (["needs_review", "pending_review", "manual_review"].includes(String(candidate.status ?? ""))) {
    return {
      sourceRow: candidate.sourceRow,
      sourceRowId: candidate.sourceRowId,
      canonicalSourceRow: null,
      name: candidate.name,
      city: candidate.city,
      state: candidate.state,
      country: candidate.country,
      targetKind: candidate.targetKind,
      discoveryState: "review_hold",
      publicBusinessId: null,
      publicationOutcome: null,
      holdReason: String(candidate.status),
      sourceDesignationCount: designationCount(raw),
      sourceUrl,
    };
  }

  return {
    sourceRow: candidate.sourceRow,
    sourceRowId: candidate.sourceRowId,
    canonicalSourceRow: null,
    name: candidate.name,
    city: candidate.city,
    state: candidate.state,
    country: candidate.country,
    targetKind: candidate.targetKind,
    discoveryState: "publication_error_hold",
    publicBusinessId: null,
    publicationOutcome: null,
    holdReason: holdReason ?? candidate.status ?? "unclassified_review_state",
    sourceDesignationCount: designationCount(raw),
    sourceUrl,
  };
}

export function summarizeCohortReconciliation(rows: readonly CohortReconciliationRow[]) {
  return rows.reduce<Record<CohortDiscoveryState, number>>(
    (summary, row) => {
      summary[row.discoveryState] += 1;
      return summary;
    },
    {
      public_listing: 0,
      duplicate_source_alias: 0,
      location_hold: 0,
      publication_error_hold: 0,
      review_hold: 0,
    },
  );
}

export function cohortRowsToCsv(rows: readonly CohortReconciliationRow[]): string {
  const headers = [
    "source_row",
    "source_row_id",
    "canonical_source_row",
    "name",
    "city",
    "state",
    "country",
    "target_kind",
    "discovery_state",
    "public_business_id",
    "publication_outcome",
    "hold_reason",
    "source_designation_count",
    "source_url",
  ];
  // A source name or URL can legitimately start with `=`, `+`, `-`, or `@`.
  // Prefix it before CSV quoting so spreadsheet applications cannot execute it
  // as a formula when an administrator opens the reconciliation export.
  const escape = (value: unknown) => {
    const raw = String(value ?? "");
    const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((row) => [
      row.sourceRow,
      row.sourceRowId,
      row.canonicalSourceRow,
      row.name,
      row.city,
      row.state,
      row.country,
      row.targetKind,
      row.discoveryState,
      row.publicBusinessId,
      row.publicationOutcome,
      row.holdReason,
      row.sourceDesignationCount,
      row.sourceUrl,
    ].map(escape).join(",")),
  ].join("\n");
}
