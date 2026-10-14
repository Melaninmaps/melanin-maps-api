import type { SessionMessage } from "@workspace/db";

export type KinfolkConversationHandoff = {
  state: "saved" | "resumed";
  summary: string;
};

export type ConversationContextScope = {
  /** Only the relevant, recent thread goes to the model. */
  messages: SessionMessage[];
  /** Member-facing, current-turn-only handoff status. */
  handoff: KinfolkConversationHandoff | null;
  /** Marks a clear request to return later in the existing private session. */
  handoffRequested: boolean;
  /** A return reference was clear but did not identify one safe prior subject. */
  requiresReferenceClarification: boolean;
};

/** A member-owned, active session considered only after an explicit resume. */
export type ConversationHandoffSessionCandidate = {
  id: string;
  messages: SessionMessage[];
};

type HandoffMarkedSessionMessage = SessionMessage & {
  conversationHandoff?: { kind: "return_later"; requestedAt: string } | null;
};

const HANDOFF_SAVED_SUMMARY =
  "This conversation is saved privately in your Kinfolk history while continuity stays on. No separate memory was created.";

const SENSITIVE_HANDOFF_TOPIC =
  /\b(?:address|home\s+address|medical|medication|diagnos(?:is|ed)|doctor|therap(?:y|ist)|suicid|self[- ]?harm|abuse|assault|trauma|pregnan|credit|debt|income|salary|bank|race|religion|muslim|christian|jewish|sexual(?:ity)?|gender|phone|email)\b/i;

function compactText(value: string, maxLength = 150): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const boundary = normalized.lastIndexOf(" ", maxLength - 1);
  return `${normalized.slice(0, boundary > 40 ? boundary : maxLength).trimEnd()}…`;
}

/** Only a deliberate request to return later creates a session handoff marker. */
export function isExplicitConversationHandoffRequest(message: string): boolean {
  const value = message.trim().toLowerCase();
  return /\b(?:pick\s+(?:this|it|that)\s+up|continue|resume|return(?:\s+to)?|come\s+back|circle\s+back)\b[\s\S]{0,80}\b(?:tomorrow|later|next\s+time|when\s+i(?:'m|\s+am)\s+back)\b/.test(value)
    && /\b(?:this|it|that|conversation|thread|plan(?:ning)?|discussion)\b/.test(value);
}

/** A resume needs both a previously saved handoff and an explicit continuation signal. */
export function isExplicitConversationResumeRequest(message: string): boolean {
  const value = message.trim().toLowerCase();
  return /^(?:yes[,!]?\s*)?(?:(?:let'?s|can\s+we)\s+)?(?:continue|resume)\b/.test(value)
    || /\b(?:pick\s+(?:this|it|that)\s+up|where\s+(?:were|did)\s+we\s+(?:leave\s+off|stop)|continue\s+from\s+where\s+we\s+left\s+off)\b/.test(value);
}

/**
 * Direct references are a short, in-session continuation. They are deliberately
 * narrower than a generic new question so another topic in the same saved chat
 * cannot quietly become context for an unrelated answer.
 */
export function isDirectConversationFollowUp(message: string): boolean {
  const value = message.trim().toLowerCase();
  return /^(?:and\s+)?(?:what\s+about|how\s+about|can\s+you\s+(?:expand|explain|revise)|the\s+next\s+step|that|this|those|them|it)\b/.test(value)
    || /\b(?:based\s+on\s+that|from\s+the\s+last\s+(?:answer|message)|earlier\s+in\s+this\s+(?:chat|conversation))\b/.test(value);
}

const CURRENT_THREAD_REFERENCE_RE = /\b(?:which|what|how|why|when|where|who|can|could|should|would|is|are|do|does|did|will)\b[\s\S]{0,72}\b(?:one|option|choice|approach|plan|draft|version|idea|recommendation|alternative|them|those|it|that|this)\b/i;
const COMPARISON_THREAD_RE = /\b(?:compare|comparison|evaluate|evaluat(?:e|ing|ion)|weigh|trade[ -]?off|pros?\s*(?:and|&)\s*cons?|offer|options?|choices?|alternatives?)\b/i;
const COMPARATIVE_FOLLOW_UP_RE = /\b(?:which|better|best|worse|less|more|safer|risk(?:y|ier)?|stronger|weaker|prefer|recommend)\b/i;
const DRAFT_REQUEST_RE = /\b(?:draft|write|compose|revise|rewrite|edit)\b[\s\S]{0,100}\b(?:email|letter|message|note|proposal)\b/i;
const PRIOR_DRAFT_REFERENCE_RE = /\b(?:go\s+back|return|back\s+to|earlier)\b[\s\S]{0,80}\b(?:email|letter|message|draft|paragraph|tone|version)\b/i;
const SENSITIVE_DRAFT_CONTENT = /\b(?:address|home\s+address|medical|medication|diagnos(?:is|ed)|doctor|therap(?:y|ist)|suicid|self[- ]?harm|abuse|assault|trauma|pregnan|credit|debt|income|salary|bank|race|religion|muslim|christian|jewish|sexual(?:ity)?|gender|phone)\b|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const PRIOR_SUBJECT_REFERENCE_RE = /\b(?:go\s+back|return|back\s+to|earlier)\b[\s\S]{0,60}\b(?:that|the)\s+([a-z][a-z-]{2,40})(?=\s+(?:and|but|please|make|can|could|to)\b|[,.!?]|$)/i;
const IMMEDIATE_REVISION_RE = /^(?:please\s+)?(?:make|rewrite|reword|rephrase|edit|proofread|polish|shorten|expand|tighten|change|adjust)\b[\s\S]{0,100}\b(?:it|that|this|the|more|less)\b/i;

/**
 * An explicit return-to-writing request may recover only the most recent earlier
 * drafting pair in this same session. It excludes intervening topics entirely,
 * especially health or other sensitive turns, and never becomes cross-session
 * memory or generic conversation context.
 */
function resolvePriorDraftScope(messages: readonly SessionMessage[], currentMessage: string): SessionMessage[] {
  if (!PRIOR_DRAFT_REFERENCE_RE.test(currentMessage) || SENSITIVE_DRAFT_CONTENT.test(currentMessage)) return [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (candidate?.role !== "user" || !DRAFT_REQUEST_RE.test(candidate.content) || SENSITIVE_DRAFT_CONTENT.test(candidate.content)) continue;
    const reply = messages[index + 1];
    return reply?.role === "assistant" && !SENSITIVE_DRAFT_CONTENT.test(reply.content)
      ? [candidate, reply]
      : [candidate];
  }
  return [];
}

/**
 * A member may explicitly return to one non-sensitive subject in the current
 * session. This stays narrower than generic semantic recall: the member has to
 * name the subject, exactly one safe pair must match, and intervening turns are
 * never supplied to the model.
 */
function resolvePriorSubjectScope(messages: readonly SessionMessage[], currentMessage: string): SessionMessage[] | null {
  if (SENSITIVE_HANDOFF_TOPIC.test(currentMessage)) return [];
  const subject = PRIOR_SUBJECT_REFERENCE_RE.exec(currentMessage)?.[1]?.trim().toLowerCase();
  if (!subject) return [];
  const matches = messages.flatMap((candidate, index) => {
    if (candidate.role !== "user" || SENSITIVE_HANDOFF_TOPIC.test(candidate.content)) return [];
    const subjectPattern = new RegExp(`\\b${subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!subjectPattern.test(candidate.content)) return [];
    const reply = messages[index + 1];
    return reply?.role === "assistant" && !SENSITIVE_HANDOFF_TOPIC.test(reply.content)
      ? [[candidate, reply] as SessionMessage[]]
      : [];
  });
  return matches.length === 1 ? matches[0] : null;
}

function isImmediateRevisionRequest(message: string): boolean {
  return !SENSITIVE_HANDOFF_TOPIC.test(message) && IMMEDIATE_REVISION_RE.test(message);
}

/**
 * Resolves a clear reference to the immediately preceding private session
 * thread without treating every new question in that session as a continuation.
 * This is deliberately bounded to recent, non-sensitive same-session turns;
 * cross-session context still requires the explicit handoff path below.
 */
export function isBoundedSameSessionContinuation(input: {
  messages: readonly SessionMessage[];
  currentMessage: string;
}): boolean {
  const current = input.currentMessage.trim();
  if (!current || SENSITIVE_HANDOFF_TOPIC.test(current)) return false;
  const recent = input.messages.slice(-4);
  const priorText = recent.map((message) => message.content).join(" ");
  if (!priorText || SENSITIVE_HANDOFF_TOPIC.test(priorText)) return false;

  if (CURRENT_THREAD_REFERENCE_RE.test(current)) return true;
  return COMPARISON_THREAD_RE.test(priorText)
    && COMPARATIVE_FOLLOW_UP_RE.test(current)
    && /\b(?:one|option|choice|alternative|risk|safer|better|worse|less|more)\b/i.test(current);
}

function latestHandoffIndex(messages: readonly SessionMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as HandoffMarkedSessionMessage | undefined;
    if (message?.conversationHandoff?.kind === "return_later") return index;
  }
  return -1;
}

function handoffTopic(messages: readonly SessionMessage[], markerIndex: number): string {
  for (let index = markerIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    const content = message.content.trim();
    if (!content || isExplicitConversationHandoffRequest(content)) continue;
    if (SENSITIVE_HANDOFF_TOPIC.test(content)) {
      return "a private topic you asked to continue";
    }
    return `“${compactText(content)}”`;
  }
  return "your earlier Kinfolk conversation";
}

export function buildConversationResumePreview(
  messages: readonly SessionMessage[],
): KinfolkConversationHandoff | null {
  const markerIndex = latestHandoffIndex(messages);
  if (markerIndex < 0) return null;
  return {
    state: "resumed",
    summary: `Picking up where you left off: ${handoffTopic(messages, markerIndex)}. Kinfolk will use only this recent conversation thread.`,
  };
}

/**
 * Finds the most recent eligible owner session from a caller-supplied, newest-first
 * list. The route is responsible for the owner/active-session database boundary;
 * this policy refuses all cross-session context unless the member explicitly asks
 * to continue or resume.
 */
export function resolveExplicitCrossSessionHandoff(input: {
  sessions: readonly ConversationHandoffSessionCandidate[];
  currentMessage: string;
}): { sourceSessionId: string; scope: ConversationContextScope } | null {
  if (!isExplicitConversationResumeRequest(input.currentMessage)) return null;

  for (const session of input.sessions) {
    const scope = resolveConversationContextScope({
      messages: session.messages,
      currentMessage: input.currentMessage,
    });
    if (scope.handoff?.state === "resumed") {
      return { sourceSessionId: session.id, scope };
    }
  }

  return null;
}

/**
 * Scope a model's conversation window to a clear continuation only. This does
 * not create or promote private memory; saved session messages remain governed
 * by the member's existing continuity setting and owner-only session controls.
 */
export function resolveConversationContextScope(input: {
  messages: readonly SessionMessage[];
  currentMessage: string;
}): ConversationContextScope {
  const handoffRequested = isExplicitConversationHandoffRequest(input.currentMessage);
  const savedResume = buildConversationResumePreview(input.messages);
  const resumeRequested = savedResume !== null
    && isExplicitConversationResumeRequest(input.currentMessage);
  const priorDraftScope = !resumeRequested ? resolvePriorDraftScope(input.messages, input.currentMessage) : [];
  const priorSubjectScope = !resumeRequested && priorDraftScope.length === 0
    ? resolvePriorSubjectScope(input.messages, input.currentMessage)
    : [];
  const directFollowUp = !resumeRequested && priorDraftScope.length === 0 && priorSubjectScope?.length === 0 && (
    isImmediateRevisionRequest(input.currentMessage)
    || isDirectConversationFollowUp(input.currentMessage)
    || isBoundedSameSessionContinuation(input)
  );
  const requiresReferenceClarification = !resumeRequested && priorDraftScope.length === 0 && priorSubjectScope === null;

  return {
    messages: resumeRequested
      ? input.messages.slice(-6)
      : priorDraftScope.length > 0
        ? priorDraftScope
      : priorSubjectScope && priorSubjectScope.length > 0
        ? priorSubjectScope
      : directFollowUp
        ? input.messages.slice(-4)
        : [],
    handoff: handoffRequested
      ? { state: "saved", summary: HANDOFF_SAVED_SUMMARY }
      : resumeRequested
        ? savedResume
        : null,
    handoffRequested,
    requiresReferenceClarification,
  };
}
