import type { BusinessAudienceBand } from "./business-personalization";
import {
  deriveBusinessSubject,
  type BusinessSubjectKey,
  type NormalizedBusinessSubject,
} from "./business-subject";
import { routeEvidence } from "./evidence-route";
import type { ClarificationStep } from "./intentClarification";
import { classifyKinfolkRequest } from "./request-classifier";

type BusinessDiscoveryConversationEntry = Readonly<{
  role: "user" | "assistant";
  content: string;
}>;

/**
 * Continue only the immediate city/neighborhood clarification that Kinfolk
 * itself issued for a governed directory request. This restores the original
 * service subject without treating a saved location, an older conversation, or
 * a generic geography follow-up as authorization to search the directory.
 */
export function resolveBusinessLocationClarificationFollowUp(
  messages: readonly BusinessDiscoveryConversationEntry[],
): Readonly<{
  priorQuestion: string;
  subject: NormalizedBusinessSubject;
}> | null {
  const priorAssistant = messages.at(-1);
  const priorUser = messages.at(-2);
  if (
    priorAssistant?.role !== "assistant" ||
    priorUser?.role !== "user" ||
    !/\b(?:which\s+city\s+or\s+neighborhood\s+should\s+i\s+search|what\s+city\s+or\s+neighborhood\s+should\s+i\s+use)\b/i.test(
      priorAssistant.content,
    )
  ) {
    return null;
  }
  const priorDecision = classifyKinfolkRequest(priorUser.content, null);
  if (priorDecision.route !== "clarification") return null;
  const evidenceDomain = routeEvidence(priorUser.content).domain;
  if (
    evidenceDomain === "medical_health" ||
    evidenceDomain === "legal_regulated" ||
    evidenceDomain === "financial_regulated" ||
    evidenceDomain === "safety_emergency"
  ) {
    return null;
  }
  const subject = deriveBusinessSubject(priorUser.content);
  return subject ? { priorQuestion: priorUser.content, subject } : null;
}

export function temporaryBusinessAudienceBand(message: string): BusinessAudienceBand | null {
  // A broad "teen" request uses the younger canonical teen band so results are
  // safe across the full 13–17 range without inventing a persisted 13_17 value.
  if (/\b(?:teens?|teenagers?|13\s*(?:-|to)\s*17)\b/i.test(message)) return "13_15";
  if (/\b(?:child|children|kid|kids|under 13)\b/i.test(message)) return "under_13";
  if (/\b(?:adult|adults|grown[- ]?ups?)\b/i.test(message)) return "18_plus";
  if (/\b(?:mixed ages|all ages|keep this search broad)\b/i.test(message)) return "mixed_all_ages";
  return null;
}

export function effectiveBusinessAudienceBand(
  persistedBand: BusinessAudienceBand,
  temporaryBand: BusinessAudienceBand | null,
): BusinessAudienceBand {
  if (!temporaryBand) return persistedBand;
  // Only an assured adult may temporarily request adult-oriented results.
  // Adult language in a prompt must never weaken a persisted minor, unknown,
  // or mixed-age audience policy.
  if (temporaryBand === "18_plus" && persistedBand !== "18_plus") return persistedBand;
  // A temporary younger/mixed audience always makes an adult search safer.
  if (persistedBand === "18_plus") return temporaryBand;
  if (persistedBand === "under_13") return persistedBand;
  if (persistedBand === "13_15" && temporaryBand === "under_13") return temporaryBand;
  return persistedBand;
}

export function businessDiscoveryClarification(input: {
  message: string;
  subjectKey: BusinessSubjectKey;
  ageBand: BusinessAudienceBand;
  city?: string;
  /**
   * Broad hair preferences refine results after the first search. They must not
   * prevent a member from seeing the matching public MWM listings in the first
   * place; the UI can offer the same temporary options as follow-ups.
   */
  includeOptionalHairRefinement?: boolean;
}): ClarificationStep[] {
  const locationSuffix = input.city?.trim() ? ` in ${input.city.trim()}` : "";
  const broadHairRequest = input.subjectKey === "salon"
    && !/\b(?:locs?|natural hair|braids?|protective styles?|hair color|wash and style|wash and go|silk press|barber|general hair salon|keep this search broad)\b/i.test(input.message);
  if (broadHairRequest && input.includeOptionalHairRefinement === true) {
    return [{
      id: "business-hair-service",
      question: "What kind of hair service should I focus on?",
      explanation: "You can skip this and I’ll keep the search broad.",
      options: [
        { value: "locs", label: `Loc and natural-hair care${locationSuffix}` },
        { value: "braids", label: `Braids or protective styles${locationSuffix}` },
        { value: "hair-color", label: `Hair color or wash and style${locationSuffix}` },
        { value: "general-salon", label: `General hair salon${locationSuffix}` },
      ],
      skippable: true,
      persistence: "temporary",
    }];
  }
  if (input.subjectKey === "activity" && input.ageBand === "unknown") {
    return [{
      id: "business-activity-audience",
      question: "Who should these things to do work for?",
      explanation: "Age range helps me avoid adult-only options. You can skip and keep it broad.",
      options: [
        { value: "adults", label: `Things to do for adults${locationSuffix}` },
        { value: "teens", label: `Things to do for teens${locationSuffix}` },
        { value: "kids", label: `Things to do for kids${locationSuffix}` },
        { value: "mixed", label: `Things to do for mixed ages${locationSuffix}` },
      ],
      skippable: true,
      persistence: "temporary",
    }];
  }
  return [];
}
