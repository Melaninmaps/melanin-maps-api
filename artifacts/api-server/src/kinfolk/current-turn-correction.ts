export type KinfolkCorrectionHistoryMessage = Readonly<{
  role: "user" | "assistant";
  content: string;
}>;

const REVISION_REQUEST = /\b(?:make|rewrite|reword|rephrase|edit|change|adjust|try)\b[\s\S]{0,90}\b(?:it|that|this|the (?:email|draft|message|answer|response))\b/i;
const REVISION_DIRECTION = /\b(?:(?:more|less)\s+(?:formal|professional|casual|light|lighter|warm|warmth|direct|brief|short|concise|detailed|friendly|firm|gentle)|(?:be|sound|feel)\s+(?:formal|professional|casual|light|lighter|warm|direct|brief|short|concise|detailed|friendly|firm|gentle))\b/i;
const CORRECTION_SIGNAL = /\b(?:that(?:'s| is) (?:not|wrong)|you (?:missed|misunderstood|got) (?:the point|that|it|this)|i meant|not what i asked|try again)\b/i;
const CONVERSATION_COACHING_REVISION = /\b(?:help me say|say that|put that)\b[\s\S]{0,90}\b(?:more|less)\s+(?:gently|gentle|warmly|warm|directly|direct|clearly|clear)\b/i;

/**
 * Applies a member's immediate correction to the preceding response only.
 * It is deliberately not memory: a correction becomes reusable only through
 * the existing explicit “remember …” consent command.
 */
export function buildKinfolkCurrentTurnCorrectionInstruction(input: Readonly<{
  message: string;
  history: readonly KinfolkCorrectionHistoryMessage[];
}>): string {
  const message = input.message.replace(/\s+/g, " ").trim();
  if (!message) return "";

  const isRevision =
    CORRECTION_SIGNAL.test(message) ||
    (REVISION_REQUEST.test(message) && REVISION_DIRECTION.test(message)) ||
    (/(?:make|rewrite|reword|rephrase|edit|change|adjust)\b/i.test(message) && REVISION_DIRECTION.test(message)) ||
    CONVERSATION_COACHING_REVISION.test(message);
  if (!isRevision) return "";

  const precedingAssistantAnswer = [...input.history]
    .reverse()
    .find((entry) => entry.role === "assistant" && entry.content.trim().length > 0)
    ?.content
    .replace(/\s+/g, " ")
    .trim();
  if (!precedingAssistantAnswer) return "";

  return [
    "CURRENT-CONVERSATION REVISION — MEMBER-AUTHORITATIVE:",
    "The member is correcting or revising the immediately preceding answer. Follow the current instruction before the earlier answer; do not repeat the same framing or defend it.",
    `PRECEDING ANSWER (context only): ${precedingAssistantAnswer.slice(0, 1_200)}`,
    `CURRENT REVISION REQUEST: ${message.slice(0, 1_000)}`,
    "Return the revised answer or draft directly. Preserve factual and safety boundaries. Do not store this as a future preference, personal memory, business fact, or platform-wide rule unless the member separately and explicitly asks Kinfolk to remember it.",
  ].join("\n");
}
