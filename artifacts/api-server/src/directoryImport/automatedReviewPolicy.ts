export type AutomatedReviewTargetKind =
  | "business"
  | "online_business"
  | "community_resource"
  | "cultural_place"
  | "regulated_review"
  | "manual_review"
  | "internal_only";

export type AutomatedReviewOutcome =
  | "auto_ready"
  | "deduplicated"
  | "needs_review"
  | "needs_research"
  | "invalid";

export interface AutomatedReviewCandidate {
  sourceRow: number;
  targetKind: AutomatedReviewTargetKind;
  name: string;
  city: string;
  state: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  socialSourceUrl: string | null;
  ownershipDesignations: readonly string[];
  /** Set only by protected ingress after every row passes MWM receipt admission. */
  sourceBackedMwmCore?: boolean;
  regulatedProfession: boolean;
  destinationReachable: boolean;
}

export interface AutomatedReviewDecision {
  outcome: AutomatedReviewOutcome;
  canonicalSourceRow: number | null;
  exceptionCodes: string[];
  identityKey: string | null;
  policyVersion: "directory-auto-review-v1";
}

const POLICY_VERSION = "directory-auto-review-v1" as const;
const PHYSICAL_ADDRESS_PATTERN = /\d/;

function normalized(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function publicDestinationHost(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      !url.hostname
    ) {
      return null;
    }
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Returns the strict identity used only for exact within-batch consolidation.
 * It deliberately does not treat a matching business name and city alone as a
 * duplicate because branches and common names must remain exceptions.
 */
export function exactBatchIdentity(
  candidate: Pick<
    AutomatedReviewCandidate,
    "targetKind" | "name" | "city" | "state" | "country" | "address" | "website" | "socialSourceUrl"
  >,
): string | null {
  const name = normalized(candidate.name);
  const city = normalized(candidate.city);
  const state = normalized(candidate.state);
  const country = normalized(candidate.country);
  if (!name || !city || !country) return null;

  if (candidate.targetKind === "online_business") {
    const host =
      publicDestinationHost(candidate.website) ??
      publicDestinationHost(candidate.socialSourceUrl);
    return host ? `online|${name}|${city}|${state}|${country}|${host}` : null;
  }

  const address = normalized(candidate.address);
  return address
    ? `physical|${name}|${city}|${state}|${country}|${address}`
    : null;
}

function candidateExceptions(candidate: AutomatedReviewCandidate): string[] {
  const exceptions: string[] = [];
  if (!Number.isInteger(candidate.sourceRow) || candidate.sourceRow < 1) {
    exceptions.push("invalid_source_row");
  }
  if (!normalized(candidate.name) || !normalized(candidate.city) || !normalized(candidate.country)) {
    exceptions.push("incomplete_identity");
  }
  if (candidate.targetKind === "internal_only") exceptions.push("internal_only");
  if (candidate.targetKind === "manual_review") exceptions.push("manual_review_target");
  if (candidate.targetKind === "cultural_place") exceptions.push("cultural_queue_only");
  if (candidate.targetKind === "community_resource") exceptions.push("resource_queue_only");
  if (candidate.targetKind === "regulated_review" || candidate.regulatedProfession) {
    exceptions.push("regulated_credential_review");
  }
  // Ordinary ownership claims remain review-only. The sole exception is a row
  // that protected ingress has already bound to the approved immutable MWM
  // Core source receipt; callers cannot self-authorize this flag from a raw
  // manifest because ingress sets it only after batch admission succeeds.
  if (candidate.ownershipDesignations.length > 0 && !candidate.sourceBackedMwmCore) {
    exceptions.push("ownership_evidence_review");
  }
  if (!candidate.destinationReachable) exceptions.push("customer_destination_requires_review");

  if (candidate.targetKind === "business") {
    if (!candidate.address?.trim() || !PHYSICAL_ADDRESS_PATTERN.test(candidate.address)) {
      exceptions.push("numbered_street_address_required");
    }
    if (!publicDestinationHost(candidate.website) && !publicDestinationHost(candidate.socialSourceUrl)) {
      exceptions.push("official_customer_destination_required");
    }
  }
  if (candidate.targetKind === "online_business") {
    if (candidate.address?.trim()) exceptions.push("online_only_must_be_mapless");
    if (!publicDestinationHost(candidate.website) && !publicDestinationHost(candidate.socialSourceUrl)) {
      exceptions.push("official_customer_destination_required");
    }
  }
  return [...new Set(exceptions)];
}

/**
 * Applies deterministic, conservative pre-review to one immutable package.
 * It never queries or writes the live directory, and it only identifies rows
 * eligible for a separately authorized batch release. All uncertain records
 * remain in the exception queue.
 */
export function classifyAutomatedReviewBatch(
  candidates: readonly AutomatedReviewCandidate[],
): Map<number, AutomatedReviewDecision> {
  const canonicalByIdentity = new Map<string, number>();
  const decisions = new Map<number, AutomatedReviewDecision>();

  for (const candidate of candidates) {
    const identityKey = exactBatchIdentity(candidate);
    const exceptions = candidateExceptions(candidate);
    if (exceptions.some((code) => code === "invalid_source_row" || code === "incomplete_identity")) {
      decisions.set(candidate.sourceRow, {
        outcome: "invalid",
        canonicalSourceRow: null,
        exceptionCodes: exceptions,
        identityKey,
        policyVersion: POLICY_VERSION,
      });
      continue;
    }

    if (identityKey) {
      const canonicalSourceRow = canonicalByIdentity.get(identityKey);
      if (canonicalSourceRow !== undefined) {
        decisions.set(candidate.sourceRow, {
          outcome: "deduplicated",
          canonicalSourceRow,
          exceptionCodes: ["duplicate_within_batch"],
          identityKey,
          policyVersion: POLICY_VERSION,
        });
        continue;
      }
      canonicalByIdentity.set(identityKey, candidate.sourceRow);
    }

    decisions.set(candidate.sourceRow, {
      outcome:
        exceptions.length === 0
          ? "auto_ready"
          : exceptions.some((code) =>
                ["customer_destination_requires_review", "numbered_street_address_required", "incomplete_identity"].includes(code),
              )
            ? "needs_research"
            : "needs_review",
      canonicalSourceRow: null,
      exceptionCodes: exceptions,
      identityKey,
      policyVersion: POLICY_VERSION,
    });
  }

  return decisions;
}

export const DIRECTORY_AUTOMATED_REVIEW_POLICY_VERSION = POLICY_VERSION;
