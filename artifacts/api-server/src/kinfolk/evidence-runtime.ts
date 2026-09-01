import type { EvidenceRoute } from "./evidence-route";
import type { PermittedIdentityContext } from "./permitted-identity-context";

export const TRUTHFUL_EVIDENCE_UNAVAILABLE_REPLY =
  "I can’t verify claim-relevant, current evidence for that right now, so I won’t guess. Please try again when live sources are available or check an authoritative source directly.";

export const TRUTHFUL_MEDICAL_EVIDENCE_UNAVAILABLE_REPLY =
  "I can’t retrieve claim-relevant authoritative medical evidence for that right now, so I won’t fill the gap from memory. Please check an official public-health source or ask a licensed clinician; call local emergency services for urgent symptoms.";

export function hasRetrievedMedicalEvidence(contextBlock: string): boolean {
  return /RETRIEVED FROM NIH MEDLINEPLUS/i.test(contextBlock)
    && !/AUTHORITATIVE RETRIEVAL INCOMPLETE/i.test(contextBlock);
}

/**
 * Return the truthful server reply that must replace model generation when a
 * medical or live/current evidence requirement was not satisfied.
 */
export function evidenceFailureReply(input: {
  route: EvidenceRoute;
  medicalContextBlock: string;
  hasLiveWebEvidence: boolean;
}): string | null {
  if (
    input.route.domain === "medical_health"
    && !hasRetrievedMedicalEvidence(input.medicalContextBlock)
  ) {
    return TRUTHFUL_MEDICAL_EVIDENCE_UNAVAILABLE_REPLY;
  }
  if (
    input.route.retrievalRequirement === "web_required"
    && input.route.allowedSources.includes("reputable_current_reporting")
    && !input.hasLiveWebEvidence
  ) {
    return TRUTHFUL_EVIDENCE_UNAVAILABLE_REPLY;
  }
  return null;
}

export function evidenceRoutePromptBlock(
  route: EvidenceRoute,
  identity: PermittedIdentityContext,
): string {
  const identityLine = identity.demographicQualifier
    ? `Current-turn-only population wording: ${identity.demographicQualifier}. Use only for this answer as group-level, non-diagnostic context; do not persist it.`
    : "No identity or demographic qualifier is permitted for this turn. Do not infer one from profile, name, geography, history, or preferences.";
  const evaluationLine = route.claimMode === "evaluative"
    ? "State the criteria behind the judgment and acknowledge multiple defensible views. Do not add inline provenance boilerplate."
    : "Keep factual premises within the evidence supplied in this request.";
  return [
    "EVIDENCE ROUTE — SERVER CONTROLLED:",
    `Domain: ${route.domain}; risk: ${route.risk}; retrieval: ${route.retrievalRequirement}; claim mode: ${route.claimMode}.`,
    route.sourceGuidance,
    evaluationLine,
    identityLine,
    route.failClosed
      ? "If the supplied evidence does not support a material claim, omit the claim rather than answering from unsupported recall."
      : "Stable low-risk facts may be answered directly.",
  ].join("\n");
}
