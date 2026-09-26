import type {
  KinfolkAnswerMode,
  KinfolkPlanKind,
  KinfolkRetrievalKind,
  KinfolkResponseMeta,
} from "@workspace/constants";
import { requiresCurrentResearch } from "./current-research";
import type { EvidenceRoute } from "./evidence-route";
import type { LifeIntentGuidance } from "./life-intent-guidance";
import type { KinfolkRequestDecision } from "./request-classifier";

export type KinfolkDecisionRetrievalPlan = Readonly<{
  kind: KinfolkPlanKind;
  userGoal: string;
  decisionNeeded: string | null;
  tensions: readonly string[];
  retrieval: KinfolkRetrievalKind;
  sourceQuery: string | null;
  allowBusinessCards: boolean;
  requireEvidence: boolean;
  requiresClarification: boolean;
  answerMode: KinfolkAnswerMode;
}>;

const DRAFT_OR_REVISION_RE = /\b(?:draft|write|rewrite|revise|edit|email|text message|message to|make (?:that|it) (?:more |less )?(?:formal|casual|lighter|shorter|longer|warmer|clearer)|help me (?:say|talk|have (?:a )?conversation))\b/i;
const POLICY_TRADEOFF_RE = /\b(?:protect|overshadow(?:ed|ing)?|trade[- ]?off|balance|limited (?:options|choices)|where (?:the )?(?:community|people) gather|practical (?:information|guidance)|economic support)\b/i;

function responseMeta(plan: KinfolkDecisionRetrievalPlan): KinfolkResponseMeta {
  return {
    schemaVersion: 1,
    planKind: plan.kind,
    answerMode: plan.answerMode,
    retrieval: plan.retrieval,
    allowBusinessCards: plan.allowBusinessCards,
    evidenceRequired: plan.requireEvidence,
    requiresClarification: plan.requiresClarification,
  };
}

/**
 * Deterministically decides what Kinfolk is allowed to retrieve before any
 * catalog, named-business, Library, or web-research lookup. It intentionally
 * accepts only current-turn classifier outputs and never reads profile, memory,
 * history, preferences, catalog data, or an LLM.
 */
export function buildKinfolkDecisionRetrievalPlan(input: Readonly<{
  message: string;
  request: KinfolkRequestDecision;
  evidence: EvidenceRoute;
  lifeGuidance: LifeIntentGuidance | null;
}>): KinfolkDecisionRetrievalPlan {
  const message = input.message.trim();
  const currentRequired = requiresCurrentResearch(message);
  const isDraftOrRevision = DRAFT_OR_REVISION_RE.test(message);
  const isPlatformPolicy = input.request.reason === "platform_policy_question_routes_to_general_knowledge";
  const highConsequence = input.evidence.risk === "high" ||
    input.evidence.domain === "medical_health" ||
    input.evidence.domain === "legal_regulated" ||
    input.evidence.domain === "financial_regulated" ||
    input.evidence.domain === "safety_emergency";

  if (isPlatformPolicy) {
    return {
      kind: "platform_policy",
      userGoal: "Understand the platform policy tradeoff without receiving a directory search.",
      decisionNeeded: "How to distinguish economic promotion from practical community information.",
      tensions: POLICY_TRADEOFF_RE.test(message)
        ? ["economic support", "practical community information"]
        : ["promotion policy", "member usefulness"],
      retrieval: "none",
      sourceQuery: null,
      allowBusinessCards: false,
      requireEvidence: false,
      requiresClarification: false,
      answerMode: "policy_plus_action_plan",
    };
  }

  // A request to draft or revise a message is ordinary assistant work. A word
  // such as "boss" or "formal" must not accidentally make it a legal/financial
  // research request; the member has not asked Kinfolk to advise on that topic.
  if (isDraftOrRevision) {
    return {
      kind: "general_assistant",
      userGoal: "Draft, revise, or coach through an everyday communication task.",
      decisionNeeded: null,
      tensions: [],
      retrieval: "none",
      sourceQuery: null,
      allowBusinessCards: false,
      requireEvidence: false,
      requiresClarification: false,
      answerMode: "draft_or_revision",
    };
  }

  if (input.lifeGuidance) {
    return {
      kind: "life_decision",
      userGoal: "Get practical, source-aware next steps for a life decision.",
      decisionNeeded: "Which next step or question should come first.",
      tensions: ["practical planning", "evidence and professional limits"],
      retrieval: input.evidence.retrievalRequirement === "web_required"
        ? "existing_current_research"
        : "existing_authoritative_route",
      sourceQuery: input.lifeGuidance.sourceQuery,
      allowBusinessCards: false,
      requireEvidence: true,
      requiresClarification: false,
      answerMode: "life_plan",
    };
  }

  if (
    currentRequired ||
    highConsequence ||
    input.evidence.domain === "current_information" ||
    /\b(?:breast\s+(?:lump|mass|change)|new\s+lump|unusual\s+breast\s+change)\b/i.test(message)
  ) {
    return {
      kind: "current_or_high_consequence",
      userGoal: "Receive a current or high-consequence answer that is supported by appropriate evidence.",
      decisionNeeded: null,
      tensions: highConsequence ? ["helpfulness", "safety and evidence limits"] : ["timeliness", "verification"],
      retrieval: currentRequired || input.evidence.retrievalRequirement === "web_required"
        ? "existing_current_research"
        : "existing_authoritative_route",
      sourceQuery: null,
      allowBusinessCards: false,
      requireEvidence: true,
      requiresClarification: false,
      answerMode: "cited_answer",
    };
  }

  if (input.request.route === "clarification") {
    return {
      kind: "general_assistant",
      userGoal: "Clarify a direct request before searching.",
      decisionNeeded: "What location or service should be used.",
      tensions: [],
      retrieval: "none",
      sourceQuery: null,
      allowBusinessCards: false,
      requireEvidence: false,
      requiresClarification: true,
      answerMode: "conversation",
    };
  }

  if (input.request.route === "business_discovery") {
    return {
      kind: "direct_discovery",
      userGoal: "Find a current, directly requested local service or business.",
      decisionNeeded: null,
      tensions: [],
      retrieval: "governed_business_catalog",
      sourceQuery: null,
      allowBusinessCards: true,
      requireEvidence: false,
      requiresClarification: false,
      answerMode: "governed_discovery",
    };
  }

  return {
    kind: "general_assistant",
    userGoal: "Get a conversational answer or one useful clarification.",
    decisionNeeded: null,
    tensions: [],
    retrieval: "none",
    sourceQuery: null,
    allowBusinessCards: false,
    requireEvidence: false,
    requiresClarification: false,
    answerMode: "conversation",
  };
}

/** Member-facing transport metadata only; never serialize the raw plan. */
export function kinfolkDecisionResponseMeta(plan: KinfolkDecisionRetrievalPlan): KinfolkResponseMeta {
  return responseMeta(plan);
}
