import { requiresCurrentResearch } from "./current-research";
import type { EvidenceRoute } from "./evidence-route";

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

export type GenericAnswerRouteDecision = Readonly<{
  evidenceNeed: "stable" | "current" | "authoritative";
  purpose:
    | "answer"
    | "planning_or_writing"
    | "approved_memory_recall"
    | "clarification"
    | "unsafe_or_unverifiable";
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
  if (
    (evidenceNeed !== "stable" &&
      evidenceNeed !== "current" &&
      evidenceNeed !== "authoritative") ||
    (purpose !== "answer" &&
      purpose !== "planning_or_writing" &&
      purpose !== "approved_memory_recall" &&
      purpose !== "clarification" &&
      purpose !== "unsafe_or_unverifiable")
  ) {
    return null;
  }
  const clarificationQuestion = text(record.clarificationQuestion) || null;
  return {
    evidenceNeed,
    purpose,
    clarificationQuestion:
      purpose === "clarification" ? clarificationQuestion : null,
  };
}

/**
 * This prompt deliberately describes answer properties rather than entity
 * classes, names, locations, or canned questions. It receives only the current
 * member turn and never profile, history, memory, identity, or directory data.
 */
export function buildGenericAnswerRouteClassifierPrompt(): string {
  return [
    "Classify the member's conversational need before an answer is written.",
    "Return JSON only with evidenceNeed, purpose, and clarificationQuestion.",
    "evidenceNeed must be one of: stable, current, authoritative.",
    "purpose must be one of: answer, planning_or_writing, approved_memory_recall, clarification, unsafe_or_unverifiable.",
    "Choose current when the truth depends on changing external conditions, a live status, a recent development, a current estimate, availability, a price, a ranking, or another time-sensitive public fact.",
    "Choose authoritative when an answer can materially affect health, law, finances, safety, or another high-consequence decision.",
    "Choose stable for explanations, everyday knowledge, or self-contained reasoning that does not depend on changing facts.",
    "Choose planning_or_writing for drafting, revising, organizing, brainstorming, or practical next-step help that can be completed without external verification.",
    "Choose approved_memory_recall only when the member asks about information they explicitly saved and authorized Kinfolk to use. Do not infer, create, or broaden memory.",
    "Choose clarification only when one missing detail materially prevents a useful response; provide one short, focused clarificationQuestion. Do not ask a question when a safe, useful answer can be given without it.",
    "Choose unsafe_or_unverifiable only when the requested action is unsafe. Do not use it merely because you do not have sources; the server retrieves evidence after this classification.",
    "Do not answer the member. Do not infer identity, location, preferences, or facts not present in the turn.",
  ].join(" ");
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
  const deterministicCurrent = requiresCurrentResearch(input.message);
  const highConsequence = input.evidence.risk === "high";
  const semanticCurrent = input.semantic?.evidenceNeed === "current";
  const semanticAuthoritative =
    input.semantic?.evidenceNeed === "authoritative";
  const requiresCurrentEvidence = deterministicCurrent || semanticCurrent;
  const requiresAuthoritativeEvidence =
    highConsequence || semanticAuthoritative;
  const purpose = input.semantic?.purpose ?? "answer";
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
    (purpose === "clarification" && !selfContainedWriting) ||
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
