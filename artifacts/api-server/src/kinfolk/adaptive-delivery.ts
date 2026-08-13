/**
 * Kinfolk Adaptive Delivery
 *
 * Composes audience-aware answers from a validated consensus plan.
 * Age/depth policy is applied AFTER evidence is evaluated and consensus is
 * determined — never before. Age band cannot change who "won" an opinion
 * question, which sources count, or whether a consensus exists.
 */

import type { AgeBand } from "../lib/audience-policy";

export type ConsensusState =
  | "broad_consensus"
  | "segmented_consensus"
  | "contested"
  | "insufficient_evidence"
  | "not_applicable";

export type DomainClass =
  | "general"
  | "culture"
  | "education"
  | "local_discovery"
  | "current_events"
  | "health"
  | "legal"
  | "financial"
  | "safety"
  | "relationships"
  | "religion_culture";

export type Depth = "brief" | "standard" | "deep";

export interface ConsensusAnswerPlan {
  directAnswer: string;
  consensusState: ConsensusState;
  evidencePoints: string[];
  nuance: string | null;
  sources: Array<{ name: string; url: string; tier: string; date?: string }>;
  safetyNotice?: string;
  currentness?: string;
  relatedLibraryTopicId?: string;
  domainClass: DomainClass;
  containsGraphicDetail: boolean;
  containsAdultDetail: boolean;
}

export interface DeliveredKinfolkAnswer {
  response: string;
  answerPlanId: string;
  depth: Depth;
  canShowMore: boolean;
  canShowLess: boolean;
  consensusState: ConsensusState;
  sources: ConsensusAnswerPlan["sources"];
  provenanceNote?: string;
  libraryAction?: { type: "open_library_node"; topicId: string; label: string };
}

const NON_LEARNING_DOMAINS = new Set<DomainClass>([
  "health",
  "legal",
  "financial",
  "safety",
  "relationships",
  "religion_culture",
]);

export function normalizeDepth(detailLevel: string | null | undefined): Depth {
  return detailLevel === "quick"
    ? "brief"
    : detailLevel === "deep"
      ? "deep"
      : "standard";
}

/**
 * Whether a Show more/less action in this domain is eligible to eventually
 * update a global depth default (after 3 consistent taps with explicit user confirmation).
 * Sensitive domains are never used for silent preference learning.
 */
export function eligibleForDefaultLearning(domain: DomainClass, ageBand: AgeBand): boolean {
  return (
    ageBand !== "unknown" &&
    ageBand !== "under_13" &&
    !NON_LEARNING_DOMAINS.has(domain)
  );
}

function teenSafeEvidencePoints(plan: ConsensusAnswerPlan, depth: Depth): string[] {
  const points = plan.evidencePoints.filter(
    (p) => !/graphic|gore|sexual|explicit|slur/i.test(p),
  );
  return depth === "brief"
    ? points.slice(0, 2)
    : depth === "standard"
      ? points.slice(0, 4)
      : points;
}

export function composeAudienceAwareAnswer(input: {
  plan: ConsensusAnswerPlan;
  ageBand: AgeBand;
  depth: Depth;
  isAgeAssured: boolean;
}): Omit<DeliveredKinfolkAnswer, "answerPlanId"> {
  const { plan, ageBand, depth } = input;
  const teenMode = ageBand === "13_15";
  const protectedMode = teenMode || ageBand === "16_17" || ageBand === "unknown";

  // Block graphic/adult content for protected audiences entirely
  if (protectedMode && (plan.containsGraphicDetail || plan.containsAdultDetail)) {
    return {
      response:
        "I can share a non-graphic, age-appropriate overview of this topic. Some details are not shown here.",
      depth: "brief",
      canShowMore: false,
      canShowLess: false,
      consensusState: plan.consensusState,
      sources: plan.sources,
      provenanceNote: plan.safetyNotice,
      ...(plan.relatedLibraryTopicId && {
        libraryAction: {
          type: "open_library_node" as const,
          topicId: plan.relatedLibraryTopicId,
          label: "Read the age-appropriate Library overview",
        },
      }),
    };
  }

  const evidence = teenMode
    ? teenSafeEvidencePoints(plan, depth)
    : depth === "brief"
      ? plan.evidencePoints.slice(0, 2)
      : depth === "standard"
        ? plan.evidencePoints.slice(0, 5)
        : plan.evidencePoints;

  const consensusLead: Record<ConsensusState, string> = {
    broad_consensus: "Based on broad, source-backed public and cultural consensus:",
    segmented_consensus:
      "There is not one single consensus. Different documented perspectives emphasize different things:",
    contested: "This remains contested in credible coverage:",
    insufficient_evidence:
      "I cannot confirm a broad public consensus from reliable evidence:",
    not_applicable: "",
  };

  const lines: string[] = [plan.directAnswer];
  if (plan.consensusState !== "not_applicable") {
    lines.push(consensusLead[plan.consensusState]);
  }
  if (evidence.length) lines.push(...evidence.map((p) => `• ${p}`));
  if (plan.nuance && depth !== "brief") lines.push(`Context: ${plan.nuance}`);
  if (plan.safetyNotice) lines.push(plan.safetyNotice);
  if (teenMode && depth === "brief") {
    lines.push("Tap Show more for a fuller explanation and sources.");
  }

  return {
    response: lines.join("\n\n"),
    depth,
    canShowMore: depth !== "deep",
    canShowLess: depth !== "brief",
    consensusState: plan.consensusState,
    sources: plan.sources,
    provenanceNote: plan.currentness,
    ...(plan.relatedLibraryTopicId && {
      libraryAction: {
        type: "open_library_node" as const,
        topicId: plan.relatedLibraryTopicId,
        label: "Learn more in the Library",
      },
    }),
  };
}
