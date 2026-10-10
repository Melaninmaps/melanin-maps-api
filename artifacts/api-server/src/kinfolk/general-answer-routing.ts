import { requiresTimeSpecificResearch } from "./current-research";
import type { EvidenceRoute } from "./evidence-route";
import {
  buildEmotionalSupportResponseContract,
  type EmotionalSupportGuidance,
} from "./emotional-support";

/**
 * The single, member-facing purpose selected for a Kinfolk turn. This is an
 * answer-plan decision, not a topic taxonomy: it is intentionally independent
 * of a person, place, product, or sample question.
 */
export type KinfolkAnswerStrategy =
  | "stable_knowledge"
  | "current_evidence"
  | "approved_member_memory"
  | "planning_or_writing"
  | "focused_clarification"
  | "honest_decline";

/** A bounded disposition which affects framing, not truth, evidence, or memory scope. */
export type KinfolkConversationalIntent =
  | "informational"
  | "emotional_support"
  | "decision_support"
  | "planning"
  | "drafting"
  | "social_interpretation"
  | "approved_memory_recall"
  | "clarification"
  | "unsafe_or_unverifiable";

export type GenericAnswerRouteDecision = Readonly<{
  evidenceNeed: "stable" | "current" | "authoritative";
  purpose:
    | "answer"
    | "planning_or_writing"
    | "approved_memory_recall"
    | "clarification"
    | "unsafe_or_unverifiable";
  conversationIntent: KinfolkConversationalIntent;
  clarificationQuestion: string | null;
}>;

export type KinfolkGeneralAnswerRoute = Readonly<{
  strategy: KinfolkAnswerStrategy;
  requiresCurrentEvidence: boolean;
  mayUseApprovedMemory: boolean;
  requiresFocusedClarification: boolean;
  shouldDecline: boolean;
  clarificationQuestion: string | null;
}>;

const MAX_CLARIFICATION_LENGTH = 220;
const WRITING_TRANSFORMATION_RE = /\b(?:rewrite|revise|edit|proofread|polish|rephrase)\b/i;
const PERSONAL_CONVERSATIONAL_INTENTS = new Set<KinfolkConversationalIntent>([
  "emotional_support",
  "decision_support",
  "planning",
  "drafting",
  "social_interpretation",
]);
const PROVISIONAL_HELPFUL_RESPONSE_INTENTS = new Set<KinfolkConversationalIntent>([
  "emotional_support",
  "decision_support",
  "social_interpretation",
]);

function hasSelfContainedWritingInput(message: string): boolean {
  if (!WRITING_TRANSFORMATION_RE.test(message)) return false;
  const colon = message.indexOf(":");
  if (colon >= 0 && message.slice(colon + 1).trim().split(/\s+/).length >= 3) {
    return true;
  }
  return /[“"']\S[\s\S]{2,}?[”"']/.test(message);
}

function text(value: unknown, max = MAX_CLARIFICATION_LENGTH): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Rejects malformed or over-broad model output. The semantic classifier is
 * advisory: evidence and safety requirements already imposed by the server can
 * only become stricter, never weaker.
 */
export function parseGenericAnswerRouteDecision(
  value: unknown,
): GenericAnswerRouteDecision | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const evidenceNeed = record.evidenceNeed;
  const purpose = record.purpose;
  const conversationIntent = record.conversationIntent;
  if (
    (evidenceNeed !== "stable" &&
      evidenceNeed !== "current" &&
      evidenceNeed !== "authoritative") ||
    (purpose !== "answer" &&
      purpose !== "planning_or_writing" &&
      purpose !== "approved_memory_recall" &&
      purpose !== "clarification" &&
      purpose !== "unsafe_or_unverifiable") ||
    (conversationIntent !== "informational" &&
      conversationIntent !== "emotional_support" &&
      conversationIntent !== "decision_support" &&
      conversationIntent !== "planning" &&
      conversationIntent !== "drafting" &&
      conversationIntent !== "social_interpretation" &&
      conversationIntent !== "approved_memory_recall" &&
      conversationIntent !== "clarification" &&
      conversationIntent !== "unsafe_or_unverifiable")
  ) {
    return null;
  }
  const clarificationQuestion = text(record.clarificationQuestion) || null;
  return {
    evidenceNeed,
    purpose,
    conversationIntent,
    clarificationQuestion:
      purpose === "clarification" ? clarificationQuestion : null,
  };
}

/**
 * This prompt deliberately describes answer properties rather than entity
 * classes, names, locations, or canned questions. It receives the current turn
 * and a short recent conversation window, never profile, memory, identity,
 * location, directory, or community data.
 */
export function buildGenericAnswerRouteClassifierPrompt(): string {
  return [
    "Classify the member's conversational need before an answer is written. This is not a subject-support gate: an ordinary permitted question remains answerable even when it is unfamiliar or does not match a product capability.",
    "The input JSON contains currentMessage and a bounded recentConversation. Use the history only to resolve the current message's purpose; do not repeat it or infer profile information from it. The classifier never receives profile, memory, identity, location, directory, or community data.",
    "Return JSON only with evidenceNeed, purpose, conversationIntent, and clarificationQuestion.",
    "evidenceNeed must be one of: stable, current, authoritative.",
    "purpose must be one of: answer, planning_or_writing, approved_memory_recall, clarification, unsafe_or_unverifiable.",
    "conversationIntent must be one of: informational, emotional_support, decision_support, planning, drafting, social_interpretation, approved_memory_recall, clarification, unsafe_or_unverifiable.",
    "Choose current when the truth depends on changing external conditions, a live status, a recent development, a current estimate, availability, a price, a ranking, or another time-sensitive public fact.",
    "Choose authoritative when an answer can materially affect health, law, finances, safety, or another high-consequence decision.",
    "Choose stable for explanations, everyday knowledge, or self-contained reasoning that does not depend on changing facts.",
    "Choose planning_or_writing for drafting, revising, organizing, brainstorming, or practical next-step help that can be completed without external verification.",
    "A personal event, emotion, relationship, decision, plan, or document does not itself require current evidence. Choose current only when the turn actually depends on a changing external fact.",
    "Recognize ordinary, indirect, and transcript-like descriptions of emotion or support needs without requiring exact keywords. Do not diagnose or infer an emotion when the turn is an ordinary non-emotional question.",
    "For emotional support, social interpretation, and low-stakes decision support, offer a safe provisional next step instead of asking for clarification when the turn already supports a useful response.",
    "Choose approved_memory_recall only when the member asks about information they explicitly saved and authorized Kinfolk to use. Do not infer, create, or broaden memory.",
    "Choose clarification only when one missing detail materially prevents a useful response; provide one short, focused clarificationQuestion. Do not ask a question when a safe, useful answer can be given without it.",
    "Choose unsafe_or_unverifiable only when the requested action is unsafe. Do not use it because a subject is unfamiliar, because a specialized tool is unavailable, or merely because you do not have sources; the server retrieves evidence after this classification.",
    "Do not answer the member. Do not infer identity, location, preferences, or facts not present in the turn.",
  ].join(" ");
}

/**
 * Adds response-quality guidance only after server evidence, safety, memory,
 * and mode policies are fixed. It never creates memory, identity claims,
 * dialect, sources, or factual certainty.
 */
export function buildKinfolkConversationalIntentPrompt(
  intent: KinfolkConversationalIntent | null | undefined,
  emotionalSupportGuidance: EmotionalSupportGuidance | null = null,
): string {
  const emotionalSupportContract = buildEmotionalSupportResponseContract(
    emotionalSupportGuidance,
  );
  if (emotionalSupportContract) return emotionalSupportContract;
  switch (intent) {
    case "emotional_support":
      return "CONVERSATIONAL INTENT — EMOTIONAL SUPPORT: Begin with calm acknowledgment, then offer a grounded next step if useful. Do not diagnose, claim to feel the member's emotions, overpromise, or turn ordinary distress into an emergency without supported signs.";
    case "decision_support":
      return "CONVERSATIONAL INTENT — DECISION SUPPORT: Help the member compare realistic options, tradeoffs, and next steps. State uncertainty plainly; do not invent stakes, values, costs, or outcomes.";
    case "planning":
      return "CONVERSATIONAL INTENT — PLANNING: Organize a practical path with concise, adjustable steps. Ask one focused question only when a missing detail materially changes the plan.";
    case "drafting":
      return "CONVERSATIONAL INTENT — DRAFTING: Produce or improve the requested text using the member's supplied purpose and content. Do not introduce claims, commitments, or personal details they did not provide.";
    case "social_interpretation":
      return "CONVERSATIONAL INTENT — SOCIAL INTERPRETATION: Separate observable wording from possible interpretations. Do not assert another person's hidden intent, identity, diagnosis, or motive as fact; name uncertainty and offer a respectful way to clarify when appropriate.";
    case "approved_memory_recall":
      return "CONVERSATIONAL INTENT — APPROVED MEMORY: Use only the explicit, server-authorized memory supplied for this turn. Do not infer, extend, or save additional personal information.";
    default:
      return "CONVERSATIONAL INTENT — GENERAL: Answer directly and naturally. Preserve evidence, safety, and member-consent boundaries already supplied by the server.";
  }
}

/**
 * Combines the generic semantic decision with deterministic server constraints.
 * A classifier cannot downgrade current/high-consequence evidence requirements.
 */
export function resolveKinfolkGeneralAnswerRoute(
  input: Readonly<{
    message: string;
    evidence: EvidenceRoute;
    semantic: GenericAnswerRouteDecision | null;
    hasApprovedRelevantMemory?: boolean;
    hasMateriallyMissingDetail?: boolean;
  }>,
): KinfolkGeneralAnswerRoute {
  // This gate covers both live and explicitly historical external facts. The
  // field name is retained for response compatibility, but the evidence policy
  // independently determines the requested fact's freshness and threshold.
  const deterministicCurrent = requiresTimeSpecificResearch(input.message);
  const stableEducationalScope = input.evidence.stableEducationalScope ?? "none";
  const highConsequence =
    input.evidence.risk === "high" && stableEducationalScope === "none";
  // A semantic classifier can describe a personal turn as "current" merely
  // because it happened recently. Personal framing alone is not an external,
  // changing fact. Deterministic current cues and high-consequence safeguards
  // remain authoritative and cannot be weakened here.
  const semanticCurrent =
    input.semantic?.evidenceNeed === "current" &&
    !(
      !deterministicCurrent &&
      !highConsequence &&
      PERSONAL_CONVERSATIONAL_INTENTS.has(
        input.semantic?.conversationIntent ?? "informational",
      )
    );
  const semanticAuthoritative =
    input.semantic?.evidenceNeed === "authoritative" &&
    stableEducationalScope === "none";
  const requiresCurrentEvidence = deterministicCurrent || semanticCurrent;
  const requiresAuthoritativeEvidence =
    highConsequence || semanticAuthoritative;
  const purpose = input.semantic?.purpose ?? "answer";
  const canOfferProvisionalHelpfulResponse =
    input.semantic !== null &&
    input.semantic !== undefined &&
    PROVISIONAL_HELPFUL_RESPONSE_INTENTS.has(
      input.semantic.conversationIntent,
    );
  const selfContainedWriting = hasSelfContainedWritingInput(input.message);

  if (purpose === "unsafe_or_unverifiable") {
    return {
      strategy: "honest_decline",
      requiresCurrentEvidence: false,
      mayUseApprovedMemory: false,
      requiresFocusedClarification: false,
      shouldDecline: true,
      clarificationQuestion: null,
    };
  }

  if (
    (purpose === "clarification" &&
      !selfContainedWriting &&
      !canOfferProvisionalHelpfulResponse) ||
    input.hasMateriallyMissingDetail === true
  ) {
    return {
      strategy: "focused_clarification",
      requiresCurrentEvidence: false,
      mayUseApprovedMemory: false,
      requiresFocusedClarification: true,
      shouldDecline: false,
      clarificationQuestion:
        input.semantic?.clarificationQuestion ??
        "What detail would help me give you the most useful answer?",
    };
  }

  // A transformation with its source text is already fully specified. Keep it
  // out of unnecessary research and clarification paths; this changes wording,
  // not the underlying claim, advice, or evidence.
  if (selfContainedWriting && !requiresAuthoritativeEvidence) {
    return {
      strategy: "planning_or_writing",
      requiresCurrentEvidence: false,
      mayUseApprovedMemory: false,
      requiresFocusedClarification: false,
      shouldDecline: false,
      clarificationQuestion: null,
    };
  }

  if (requiresCurrentEvidence || requiresAuthoritativeEvidence) {
    return {
      strategy: "current_evidence",
      requiresCurrentEvidence:
        requiresCurrentEvidence || requiresAuthoritativeEvidence,
      mayUseApprovedMemory: false,
      requiresFocusedClarification: false,
      shouldDecline: false,
      clarificationQuestion: null,
    };
  }

  if (purpose === "approved_memory_recall" && input.hasApprovedRelevantMemory) {
    return {
      strategy: "approved_member_memory",
      requiresCurrentEvidence: false,
      mayUseApprovedMemory: true,
      requiresFocusedClarification: false,
      shouldDecline: false,
      clarificationQuestion: null,
    };
  }

  if (purpose === "planning_or_writing") {
    return {
      strategy: "planning_or_writing",
      requiresCurrentEvidence: false,
      mayUseApprovedMemory: false,
      requiresFocusedClarification: false,
      shouldDecline: false,
      clarificationQuestion: null,
    };
  }

  return {
    strategy: "stable_knowledge",
    requiresCurrentEvidence: false,
    mayUseApprovedMemory: false,
    requiresFocusedClarification: false,
    shouldDecline: false,
    clarificationQuestion: null,
  };
}

/**
 * The final evidence gate used after retrieval. It prevents the response layer
 * from rendering a source list beside a generic "could not verify" answer.
 */
export function resolveKinfolkEvidenceOutcome(
  input: Readonly<{
    route: KinfolkGeneralAnswerRoute;
    hasSupportingEvidence: boolean;
  }>,
): "answer" | "decline" {
  if (input.route.shouldDecline) return "decline";
  if (input.route.requiresCurrentEvidence && !input.hasSupportingEvidence)
    return "decline";
  return "answer";
}
