/**
 * Diaspora-first research policy — permanent retrieval lens for Kinfolk.
 *
 * PRODUCT RULE: before any web search, Kinfolk prepends "Black women" to the
 * member's question unless the member has already supplied an equivalent context.
 *
 * This is a retrieval policy. It is NOT a claim about the member's identity.
 * A question about Black maternal health, trans-friendly doctors, halal food,
 * or wheelchair-accessible hotels can shape retrieval without establishing any
 * identity attribute for the member. Never infer identity from a search term.
 */

export type SearchSubject = "me" | "someone_else" | "general_research" | "unknown";
export type TopicDomain = "health" | "travel" | "legal" | "housing" | "career" | "general";

export type MemberContext = {
  /** Only values explicitly volunteered by the member and expressly approved for memory. */
  rememberedAttributes?: Record<string, string>;
};

export type SearchContext = {
  subject: SearchSubject;
  /** Temporary search-only context. Never copy to member memory automatically. */
  temporaryAttributes?: Record<string, string>;
  memberContext?: MemberContext;
};

export const KINFOLK_PERMANENT_RESEARCH_LENS = {
  version: "1.0.0",
  primaryQueryContext: "Black women",
  broaderCommunityContext: "African diaspora communities",
  rule: "Apply the cultural research lens to source discovery. Never convert the lens or a search term into a claim about the member's identity.",
} as const;

function includesBlackWomenContext(query: string): boolean {
  return /\bblack\s+(women|woman)\b/i.test(query);
}

export function buildDiasporaFirstResearchQuery(
  memberQuestion: string,
  topic: TopicDomain,
  search: SearchContext,
): string {
  const cleanQuestion = memberQuestion.trim().replace(/\s+/g, " ");
  if (!cleanQuestion) throw new Error("QUESTION_REQUIRED");

  const lens = includesBlackWomenContext(cleanQuestion)
    ? ""
    : `${KINFOLK_PERMANENT_RESEARCH_LENS.primaryQueryContext} `;

  const subjectContext =
    search.subject === "me" && search.memberContext?.rememberedAttributes
      ? relevantRememberedContext(topic, search.memberContext.rememberedAttributes)
      : "";

  const temporaryContext = search.temporaryAttributes
    ? Object.values(search.temporaryAttributes).filter(Boolean).join(" ")
    : "";

  return [lens + cleanQuestion, subjectContext, temporaryContext].filter(Boolean).join(" ");
}

function relevantRememberedContext(
  topic: TopicDomain,
  attributes: Record<string, string>,
): string {
  // Memory is intentionally minimal and relevance-gated. Not used for general queries.
  if (topic === "health") {
    return [attributes["life_stage"], attributes["accessibility_needs"]]
      .filter(Boolean)
      .join(" ");
  }
  if (topic === "travel") {
    return [attributes["travel_style"], attributes["accessibility_needs"]]
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

/**
 * Returns true when a search term contains a cultural or accessibility modifier
 * that can improve retrieval but must never be stored as a member identity attribute.
 */
export function prohibitsIdentityInference(question: string): boolean {
  return /\b(black-owned|black\s+maternal|trans-friendly|halal|wheelchair-accessible|black\s+women)\b/i.test(
    question,
  );
}

export function contextStorageDecision(search: SearchContext) {
  return {
    persistSearchSubject: false,
    persistTemporaryAttributes: false,
    mayUseMemberMemory: search.subject === "me",
    requireExplicitRememberPermission: true,
  };
}
