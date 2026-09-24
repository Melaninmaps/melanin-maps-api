import { createHash } from "node:crypto";
import {
  OWNERSHIP_FILTER_OPTIONS,
  isBlackOwned,
  normalizeOwnershipDesignationFilterIds,
} from "@workspace/constants";
import { COMPLETED_COHORT_MANIFEST_CHECKSUM, COMPLETED_COHORT_RECEIPT_ROOT } from "./cohortReconciliation";

export const COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY =
  "completed_cohort_directory_discovery_v1" as const;

export type CompletedCohortHeldCandidate = {
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
  outboxError: string | null;
};

export type DirectoryOnlyBusinessProfile = {
  id: string;
  dedupeKey: string;
  name: string;
  category: string;
  subcategory: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  isOnlineOnly: boolean;
  ownershipDesignations: string[];
  ownershipClaim: "source_reported_ownership_unverified" | "source_reputable_listing_unverified";
  blackOwned: boolean;
  description: string;
  website: string | null;
  sourceUrl: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, maxLength?: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

function safeHttpUrl(value: unknown): string | null {
  const candidate = text(value, 2_000);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !parsed.username && !parsed.password && parsed.hostname
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function sourceDesignationLabels(raw: Record<string, unknown>): string[] {
  const sourceValues = raw.ownership_designations ?? raw.ownershipDesignations;
  if (!Array.isArray(sourceValues)) return [];
  const explicitValues = sourceValues
    .filter((value): value is string => typeof value === "string")
    .map((value) => text(value, 160))
    .filter((value): value is string => Boolean(value));
  const normalizedIds = normalizeOwnershipDesignationFilterIds(explicitValues, 90);
  const canonicalLabels = normalizedIds.flatMap((id) =>
    OWNERSHIP_FILTER_OPTIONS.filter((option) => option.id === id).map((option) => option.label),
  );
  // Preserve the literal source wording and add a known canonical label only
  // when the controlled designation catalogue recognizes it. Nothing is inferred.
  return [...new Set([...explicitValues, ...canonicalLabels])];
}

function normalizedKind(candidate: CompletedCohortHeldCandidate): string {
  return String(candidate.targetKind ?? "").trim().toLowerCase();
}

export function isDirectoryOnlyDiscoveryCandidate(candidate: CompletedCohortHeldCandidate): boolean {
  const kind = normalizedKind(candidate);
  if (kind !== "business" && kind !== "online_business") return false;
  if (!text(candidate.name, 255) || !text(candidate.city, 100)) return false;
  return String(candidate.outboxError ?? "").startsWith("geocode_unverified:") ||
    String(candidate.outboxError ?? "").startsWith("Physical publication requires address and non-zero coordinates.");
}

/**
 * Builds a public directory profile with intentionally null coordinates. This
 * is a search record, not a pin, directions origin, or a claim of a precise
 * physical location. The returned values are deterministic and idempotent.
 */
export function buildDirectoryOnlyBusinessProfile(
  candidate: CompletedCohortHeldCandidate,
): DirectoryOnlyBusinessProfile {
  if (!isDirectoryOnlyDiscoveryCandidate(candidate)) {
    throw new Error("COMPLETED_COHORT_DIRECTORY_ONLY_CANDIDATE_REQUIRED");
  }
  const raw = asRecord(candidate.rawRecord);
  const name = text(candidate.name, 255)!;
  const city = text(candidate.city, 100)!;
  const state = text(candidate.state, 50);
  const country = text(candidate.country, 100) ?? "United States";
  const sourceDesignations = sourceDesignationLabels(raw);
  const receiptIdentity = [
    COMPLETED_COHORT_RECEIPT_ROOT,
    candidate.sourceRow,
    candidate.sourceRowId,
    candidate.dedupeKey ?? "",
  ].join("|");
  const digest = createHash("sha256").update(receiptIdentity).digest("hex");
  const sourceClassification = text(
    raw.mwm_publication_classification ?? raw.mwmPublicationClassification,
    120,
  );
  const retainedDedupeKey = text(candidate.dedupeKey, 500);
  const category = text(raw.category, 100) ?? "Other";
  const subcategory = text(raw.subcategory, 100) ?? category;
  const address = text(raw.address, 255);
  const description = text(raw.description, 12_000) ?? "";
  const website = safeHttpUrl(raw.website);
  const sourceUrl = safeHttpUrl(raw.source_url ?? raw.sourceUrl);
  const designationIsExplicit = sourceClassification === "source_reported_mwm_designation" &&
    sourceDesignations.length > 0;

  return {
    id: `cohort-${digest.slice(0, 24)}`,
    // Re-use the protected ingress identity if it is retained. That lets this
    // activation link to an already-created canonical profile rather than make
    // a second copy. The receipt-root key is a deterministic fallback only.
    dedupeKey: retainedDedupeKey ?? `completed-cohort-directory-only|${digest}`,
    name,
    category,
    subcategory,
    address,
    city,
    state,
    country,
    isOnlineOnly: normalizedKind(candidate) === "online_business",
    ownershipDesignations: sourceDesignations,
    ownershipClaim: designationIsExplicit
      ? "source_reported_ownership_unverified"
      : "source_reputable_listing_unverified",
    blackOwned: isBlackOwned(sourceDesignations),
    description,
    website,
    sourceUrl,
  };
}

export function activationReceiptHash(candidate: CompletedCohortHeldCandidate): string {
  const raw = asRecord(candidate.rawRecord);
  return createHash("sha256").update(JSON.stringify({
    receiptRoot: COMPLETED_COHORT_RECEIPT_ROOT,
    manifest: COMPLETED_COHORT_MANIFEST_CHECKSUM,
    sourceRow: candidate.sourceRow,
    sourceRowId: candidate.sourceRowId,
    dedupeKey: candidate.dedupeKey,
    raw,
    outboxError: candidate.outboxError,
  })).digest("hex");
}

export function completedCohortDiscoveryDescription(): string {
  return "A public, source-listed directory record with no verified map coordinates yet.";
}
