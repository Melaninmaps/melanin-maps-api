import type { Submission } from "./submissionRepository";
import type { CommunityBusinessSubmissionInput, SubmissionSocialProfiles } from "./types";

/**
 * This policy deliberately evaluates only injected evidence. It never fetches a
 * website, calls a provider, or infers proof from member-supplied copy. Runtime
 * verification adapters must supply evidence separately; source-only callers
 * receive a conservative private hold.
 */
export const COMMUNITY_VERIFICATION_POLICY_VERSION =
  "community-business-verification-v1" as const;

export type VerificationEvidenceState = "verified" | "missing" | "failed" | "escalate";

export type CommunityVerificationCheck =
  | "account_eligibility"
  | "business_existence"
  | "official_identity"
  | "cross_field_consistency"
  | "minority_ownership"
  | "operating_status"
  | "duplicate_risk"
  | "coordinated_activity"
  | "content_safety"
  | "precise_location";

export type CommunityVerificationOutcome = "PASS" | "INCOMPLETE" | "FAIL" | "ESCALATE";

export interface RetainedVerificationSourceReference {
  check: CommunityVerificationCheck;
  sourceUrl: string;
  sourceLabel?: string;
  observedAt: string;
  sourceSnapshotSha256?: string;
  /** Evidence is re-observed on the next publication attempt after this time. */
  revalidateAfter?: string;
}

export interface CommunityVerificationEvidence {
  accountEligibility: VerificationEvidenceState;
  businessExistence: VerificationEvidenceState;
  officialIdentity: VerificationEvidenceState;
  crossFieldConsistency: VerificationEvidenceState;
  minorityOwnership: VerificationEvidenceState;
  operatingStatus: VerificationEvidenceState;
  duplicateRisk: VerificationEvidenceState;
  coordinatedActivity: VerificationEvidenceState;
  contentSafety: VerificationEvidenceState;
  preciseLocation: VerificationEvidenceState;
  /** Server-supplied references only; member-provided URLs are never proof by themselves. */
  sourceReferences?: readonly RetainedVerificationSourceReference[];
}

export interface CommunityVerificationSubject {
  name: string;
  category: string;
  description?: string | null;
  address?: string | null;
  city: string;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  socialProfiles?: SubmissionSocialProfiles | null;
  ownershipDesignations: readonly string[];
  communityReportedOwnership: string;
  submitterNote?: string | null;
}

export interface CommunityVerificationDecision {
  policyVersion: typeof COMMUNITY_VERIFICATION_POLICY_VERSION;
  outcome: CommunityVerificationOutcome;
  canPublish: boolean;
  missingChecks: CommunityVerificationCheck[];
  failedChecks: CommunityVerificationCheck[];
  escalatedChecks: CommunityVerificationCheck[];
  evidenceSnapshot: Readonly<{
    checks: Record<CommunityVerificationCheck, VerificationEvidenceState>;
    sources: RetainedVerificationSourceReference[];
  }>;
  publicMessage: string;
  auditNote: string;
}

export type CommunityVerificationEvidenceResolver = (
  subject: CommunityVerificationSubject,
) => CommunityVerificationEvidence | Promise<CommunityVerificationEvidence>;

type VerificationEvidenceStateKey = Exclude<keyof CommunityVerificationEvidence, "sourceReferences">;

const CHECKS: ReadonlyArray<readonly [CommunityVerificationCheck, VerificationEvidenceStateKey]> = [
  ["account_eligibility", "accountEligibility"],
  ["business_existence", "businessExistence"],
  ["official_identity", "officialIdentity"],
  ["cross_field_consistency", "crossFieldConsistency"],
  ["minority_ownership", "minorityOwnership"],
  ["operating_status", "operatingStatus"],
  ["duplicate_risk", "duplicateRisk"],
  ["coordinated_activity", "coordinatedActivity"],
  ["content_safety", "contentSafety"],
  ["precise_location", "preciseLocation"],
] as const;

const EXTERNALLY_OBSERVED_CHECKS = new Set<CommunityVerificationCheck>([
  "business_existence",
  "official_identity",
  "minority_ownership",
  "operating_status",
  "precise_location",
]);
const MAX_SOURCE_AGE_MS = 31 * 24 * 60 * 60 * 1_000;
const MAX_FUTURE_OBSERVATION_SKEW_MS = 5 * 60 * 1_000;

const UNSUPPORTED_ALLEGATION_PATTERN = /\b(?:avoid|boycott|do\s+not\s+support|scam(?:mer)?|fraud(?:ulent)?|criminal|thief|racist|discriminat(?:ion|ory)|abuser|predator)\b/i;

function contentSafetyRequiresEscalation(subject: CommunityVerificationSubject): boolean {
  return [subject.description, subject.submitterNote, ...(subject.ownershipDesignations ?? [])]
    .filter((value): value is string => typeof value === "string")
    .some((value) => UNSUPPORTED_ALLEGATION_PATTERN.test(value));
}

function publicMessage(outcome: CommunityVerificationOutcome): string {
  switch (outcome) {
    case "PASS":
      return "Verification evidence is complete. This business can be published under the applicable surface rules.";
    case "INCOMPLETE":
      return "Saved privately. Add current official and ownership evidence before this business can be verified or published.";
    case "FAIL":
      return "Saved privately because the supporting evidence could not verify this business. You can correct it with current official sources.";
    case "ESCALATE":
      return "Saved privately for additional review. It is not public or eligible for the map.";
  }
}

function auditNote(
  outcome: CommunityVerificationOutcome,
  missingChecks: readonly CommunityVerificationCheck[],
  failedChecks: readonly CommunityVerificationCheck[],
  escalatedChecks: readonly CommunityVerificationCheck[],
): string {
  const groups = [
    missingChecks.length > 0 ? `missing=${missingChecks.join(",")}` : null,
    failedChecks.length > 0 ? `failed=${failedChecks.join(",")}` : null,
    escalatedChecks.length > 0 ? `escalated=${escalatedChecks.join(",")}` : null,
  ].filter(Boolean);
  return `${COMMUNITY_VERIFICATION_POLICY_VERSION}:${outcome}${groups.length > 0 ? ` (${groups.join("; ")})` : ""}`;
}

function retainedSourceReferences(
  evidence: CommunityVerificationEvidence,
): RetainedVerificationSourceReference[] {
  const allowedChecks = new Set<CommunityVerificationCheck>(CHECKS.map(([check]) => check));
  const unique = new Set<string>();
  const now = Date.now();
  return (evidence.sourceReferences ?? []).flatMap((reference) => {
    if (!allowedChecks.has(reference.check)) return [];
    let sourceUrl: URL;
    try {
      sourceUrl = new URL(reference.sourceUrl);
    } catch {
      return [];
    }
    if (sourceUrl.protocol !== "https:") return [];
    const observedAt = Date.parse(reference.observedAt);
    if (
      !Number.isFinite(observedAt)
      || observedAt < now - MAX_SOURCE_AGE_MS
      || observedAt > now + MAX_FUTURE_OBSERVATION_SKEW_MS
    ) return [];
    const fingerprint = `${reference.check}:${sourceUrl.toString()}:${reference.observedAt}`;
    if (unique.has(fingerprint)) return [];
    unique.add(fingerprint);
    const label = typeof reference.sourceLabel === "string"
      ? reference.sourceLabel.trim().slice(0, 240)
      : "";
    const sourceSnapshotSha256 = typeof reference.sourceSnapshotSha256 === "string"
      && /^[a-f0-9]{64}$/i.test(reference.sourceSnapshotSha256)
      ? reference.sourceSnapshotSha256.toLowerCase()
      : undefined;
    const revalidateAt = typeof reference.revalidateAfter === "string"
      ? Date.parse(reference.revalidateAfter)
      : Number.NaN;
    const revalidateAfter = Number.isFinite(revalidateAt)
      && revalidateAt > observedAt
      && revalidateAt <= observedAt + MAX_SOURCE_AGE_MS
      && revalidateAt > now
      ? new Date(revalidateAt).toISOString()
      : undefined;
    if (!sourceSnapshotSha256 || !revalidateAfter) return [];
    return [{
      check: reference.check,
      sourceUrl: sourceUrl.toString(),
      ...(label ? { sourceLabel: label } : {}),
      observedAt: new Date(observedAt).toISOString(),
      sourceSnapshotSha256,
      revalidateAfter,
    }];
  });
}

function verificationEvidenceSnapshot(
  evidence: CommunityVerificationEvidence,
): CommunityVerificationDecision["evidenceSnapshot"] {
  const checks = {} as Record<CommunityVerificationCheck, VerificationEvidenceState>;
  for (const [check, evidenceKey] of CHECKS) checks[check] = evidence[evidenceKey];
  return { checks, sources: retainedSourceReferences(evidence) };
}

/**
 * Default source-stage evidence. Member-provided URLs and ownership words are
 * useful leads, but none is proof by itself. This guarantees a fail-closed
 * private hold until an injected adapter returns independently verified facts.
 */
export function sourceOnlyCommunityVerificationEvidence(
  preciseLocation: VerificationEvidenceState = "missing",
): CommunityVerificationEvidence {
  return {
    accountEligibility: "verified",
    businessExistence: "missing",
    officialIdentity: "missing",
    crossFieldConsistency: "missing",
    minorityOwnership: "missing",
    operatingStatus: "missing",
    duplicateRisk: "missing",
    coordinatedActivity: "verified",
    contentSafety: "verified",
    preciseLocation,
  };
}

export function communityVerificationSubjectFromInput(
  input: CommunityBusinessSubmissionInput,
): CommunityVerificationSubject {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    website: input.website,
    socialProfiles: input.socialProfiles,
    ownershipDesignations: input.ownershipDesignations ?? [],
    communityReportedOwnership: input.communityReportedOwnership ?? "not_sure",
    submitterNote: input.submitterNote,
  };
}

export function communityVerificationSubjectFromSubmission(
  submission: Pick<
    Submission,
    | "name"
    | "category"
    | "description"
    | "address"
    | "city"
    | "state"
    | "country"
    | "website"
    | "social_profiles"
    | "ownership_designations"
    | "community_reported_ownership"
    | "submitter_note"
  >,
): CommunityVerificationSubject {
  return {
    name: submission.name,
    category: submission.category,
    description: submission.description,
    address: submission.address,
    city: submission.city,
    state: submission.state,
    country: submission.country,
    website: submission.website,
    socialProfiles: submission.social_profiles,
    ownershipDesignations: submission.ownership_designations ?? [],
    communityReportedOwnership: submission.community_reported_ownership,
    submitterNote: submission.submitter_note,
  };
}

export function withPreciseLocationEvidence(
  evidence: CommunityVerificationEvidence,
  preciseLocation: VerificationEvidenceState,
  sourceReference?: RetainedVerificationSourceReference,
): CommunityVerificationEvidence {
  return {
    ...evidence,
    preciseLocation,
    ...(sourceReference ? {
      sourceReferences: [...(evidence.sourceReferences ?? []), sourceReference],
    } : {}),
  };
}

export function assessCommunityVerification(
  subject: CommunityVerificationSubject,
  evidence: CommunityVerificationEvidence,
): CommunityVerificationDecision {
  const missingChecks: CommunityVerificationCheck[] = [];
  const failedChecks: CommunityVerificationCheck[] = [];
  const escalatedChecks: CommunityVerificationCheck[] = [];
  const evidenceSnapshot = verificationEvidenceSnapshot(evidence);

  for (const [check] of CHECKS) {
    if (
      EXTERNALLY_OBSERVED_CHECKS.has(check)
      && evidenceSnapshot.checks[check] === "verified"
      && !evidenceSnapshot.sources.some((source) => source.check === check)
    ) {
      evidenceSnapshot.checks[check] = "missing";
    }
  }

  for (const [check] of CHECKS) {
    const state = evidenceSnapshot.checks[check];
    if (state === "missing") missingChecks.push(check);
    if (state === "failed") failedChecks.push(check);
    if (state === "escalate") escalatedChecks.push(check);
  }
  if (contentSafetyRequiresEscalation(subject) && !escalatedChecks.includes("content_safety")) {
    escalatedChecks.push("content_safety");
    const missingIndex = missingChecks.indexOf("content_safety");
    if (missingIndex >= 0) missingChecks.splice(missingIndex, 1);
    const failedIndex = failedChecks.indexOf("content_safety");
    if (failedIndex >= 0) failedChecks.splice(failedIndex, 1);
  }

  const outcome: CommunityVerificationOutcome = escalatedChecks.length > 0
    ? "ESCALATE"
    : failedChecks.length > 0
      ? "FAIL"
      : missingChecks.length > 0
        ? "INCOMPLETE"
        : "PASS";

  return {
    policyVersion: COMMUNITY_VERIFICATION_POLICY_VERSION,
    outcome,
    canPublish: outcome === "PASS",
    missingChecks,
    failedChecks,
    escalatedChecks,
    evidenceSnapshot,
    publicMessage: publicMessage(outcome),
    auditNote: auditNote(outcome, missingChecks, failedChecks, escalatedChecks),
  };
}

export function needsOnlyPreciseLocation(
  decision: CommunityVerificationDecision,
): boolean {
  return decision.outcome === "INCOMPLETE"
    && decision.missingChecks.length === 1
    && decision.missingChecks[0] === "precise_location";
}
