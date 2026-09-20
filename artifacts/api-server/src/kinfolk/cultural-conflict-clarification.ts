import {
  normalizeKinfolkConversationMode,
  type KinfolkConversationMode,
} from "./conversation-mode";

const GENERIC_CULTURAL_CONFLICT = /\b(?:who\s+(?:won|wins)(?:\s+in)?\s+(?:the\s+)?(?:rap\s+|artist\s+|music\s+)?beef|(?:the|this|that|their)\s+(?:rap\s+|artist\s+|music\s+)?beef|(?:rap|artist|music)\s+beef|feud)\b/i;
const NAMED_CONFLICT_CONTEXT = /\b(?:kendrick|drake|nicki|minaj|cardi|b|meek|mill|pusha|cole|j\.?\s*cole|lil\s*durk|pooh\s*shiesty|50\s*cent|ja\s*rule)\b/i;

/**
 * A generic “who won the beef?” is culturally legible as a music/public-figure
 * conflict question, but it is not enough evidence to select artists or claim a
 * winner. Clarify in the appropriate voice, then let the normal current-evidence
 * path handle a named conflict.
 */
export function buildCulturalConflictClarification(
  message: string,
  voiceMode: unknown,
): string | null {
  if (!GENERIC_CULTURAL_CONFLICT.test(message) || NAMED_CONFLICT_CONTEXT.test(message)) {
    return null;
  }

  const mode: KinfolkConversationMode = normalizeKinfolkConversationMode(voiceMode);
  if (mode === "professor") {
    return "Which public conflict do you mean—Kendrick vs. Drake, Nicki vs. Cardi, or someone else? Name the artists and I’ll separate the timeline, music, public statements, and current reporting from opinion about who “won.”";
  }
  if (mode === "business_manager") {
    return "Which artists are you asking about? Name the conflict and I’ll give you the verified timeline, the relevant releases and statements, and the current takeaway without treating fan opinion as fact.";
  }
  if (mode === "best_friend") {
    return "Which beef are we talking about—Kendrick vs. Drake, Nicki vs. Cardi, or somebody else? Name it and I’ll break down what actually happened versus the fan talk.";
  }

  return "Which beef do you mean—Kendrick vs. Drake, Nicki vs. Cardi, or somebody else? Name it and I’ll break down the timeline, music, public statements, and what current reporting says—not just fan talk.";
}
