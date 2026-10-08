import type { TemporalEvidencePolicy } from "./current-research";

/**
 * Kinfolk's shared recovery policy. It deliberately lives outside discovery and
 * prompt code so external knowledge remains available for ordinary questions
 * while business promotion stays governed by its separate directory boundary.
 */
export type KinfolkProtectedBoundary =
  | "safety"
  | "privacy"
  | "legal"
  | "capability"
  | "business_promotion";

export type KinfolkAlwaysHelpAction =
  | "answer_directly"
  | "run_deterministic_capability"
  | "retrieve_time_specific_evidence"
  | "provide_qualified_partial"
  | "ask_focused_clarification"
  | "explain_boundary_and_help_adjacent";

export type KinfolkAlwaysHelpPlan = Readonly<{
  action: KinfolkAlwaysHelpAction;
  reason:
    | "stable_knowledge"
    | "deterministic_capability"
    | "evidence_required"
    | "partial_evidence"
    | "material_ambiguity"
    | "protected_boundary";
}>;

export function resolveKinfolkAlwaysHelpPlan(input: Readonly<{
  temporalPolicy: TemporalEvidencePolicy;
  requiresEvidence: boolean;
  hasSupportingEvidence: boolean;
  hasRelevantPartialEvidence: boolean;
  requiresClarification: boolean;
  protectedBoundary: KinfolkProtectedBoundary | null;
}>): KinfolkAlwaysHelpPlan {
  if (input.protectedBoundary) {
    return {
      action: "explain_boundary_and_help_adjacent",
      reason: "protected_boundary",
    };
  }
  if (input.requiresClarification) {
    return { action: "ask_focused_clarification", reason: "material_ambiguity" };
  }
  if (!input.requiresEvidence) {
    return {
      action: input.temporalPolicy.calculationEligible
        ? "run_deterministic_capability"
        : "answer_directly",
      reason: input.temporalPolicy.calculationEligible
        ? "deterministic_capability"
        : "stable_knowledge",
    };
  }
  if (input.hasSupportingEvidence) {
    return { action: "answer_directly", reason: "evidence_required" };
  }
  if (input.hasRelevantPartialEvidence) {
    return { action: "provide_qualified_partial", reason: "partial_evidence" };
  }
  return {
    action: "retrieve_time_specific_evidence",
    reason: "evidence_required",
  };
}

export function buildKinfolkPartialEvidenceInstruction(
  temporalPolicy: TemporalEvidencePolicy,
): string {
  const timeLabel = temporalPolicy.freshness === "historical"
    ? "historical"
    : "current";
  return [
    "DIRECTLY RELEVANT PARTIAL EVIDENCE — SERVER POLICY:",
    `The available evidence is only partially sufficient for this ${timeLabel} request.`,
    "State only what the linked source directly supports, identify the specific remaining uncertainty, and invite a retry when that is useful.",
    "Do not calculate, extrapolate, or fill a gap with model memory. Do not portray partial evidence as corroborated or complete.",
  ].join(" ");
}

/**
 * A brief, member-facing limit for the rare path where a current or historical
 * request has one directly relevant source but not enough evidence for every
 * claim. Stable education deliberately receives no provenance slogan here.
 */
export function buildKinfolkPartialEvidenceMemberNotice(
  temporalPolicy: TemporalEvidencePolicy,
): string | null {
  if (temporalPolicy.freshness === "stable") return null;
  if (temporalPolicy.freshness === "historical") {
    return "I’ve kept this to what the available source can confirm for that period. A different historical source may be needed for the remaining detail.";
  }
  return "I’ve kept this to what the available source can confirm. A fresh check is safest for any detail it does not establish.";
}

export function buildKinfolkEvidenceRecoveryReply(input: Readonly<{
  temporalPolicy: TemporalEvidencePolicy;
  requestedConsensus: boolean;
}>): string {
  if (input.temporalPolicy.requestedFact === "currency_conversion") {
    return input.temporalPolicy.freshness === "historical"
      ? "I could not retrieve a reliable historical exchange-rate source for the requested period, so I cannot calculate that conversion safely right now. Try again shortly or share a source you want me to interpret."
      : "I could not retrieve a reliable current exchange rate, so I cannot calculate that conversion safely right now. Rates fluctuate; try again shortly or share a source you want me to interpret.";
  }
  if (input.temporalPolicy.requestedFact === "merchant_payment_policy") {
    return "I could not verify that establishment's current payment policy from an authoritative source, so I will not guess. Its official contact or payment page is the safest next check.";
  }
  if (input.temporalPolicy.requestedFact === "operating_status") {
    return "I could not verify the current operating status from an authoritative source, so I will not guess. Check the establishment's official hours or contact channel before you go.";
  }
  if (input.temporalPolicy.requestedFact === "public_estimate") {
    return "I could not retrieve a reliable current estimate from an established source, so I will not guess. Public estimates can vary and change over time.";
  }
  if (input.requestedConsensus) {
    return "I found some related material, but I could not corroborate the requested consensus with enough independent reliable sources. I will not present a consensus that the evidence does not establish.";
  }
  return "I could not complete a sufficiently supported answer from the permitted current sources, so I will not guess. Try the current check again shortly, or ask for stable background if that would still help.";
}
