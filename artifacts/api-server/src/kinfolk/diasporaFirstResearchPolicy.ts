/**
 * Diaspora-first research policy — permanent retrieval lens for Kinfolk.
 *
 * PRODUCT RULE: before any web search, Kinfolk prepends the appropriate
 * diaspora-community context to the member's question unless the member has
 * already supplied an equivalent context or explicitly requested general research.
 *
 * This is a retrieval policy. It is NOT a claim about the member's identity.
 * A question about Black maternal health, trans-friendly doctors, halal food,
 * or wheelchair-accessible hotels can shape retrieval without establishing any
 * identity attribute for the member. Never infer identity from a search term.
 *
 * SOURCE OF TRUTH:
 *   See "Kinfolk AI — Diaspora-First Research System Instructions" in the
 *   attached founder docs for the authoritative spec and acceptance checks.
 */

export type SearchSubject = "me" | "someone_else" | "general_research" | "unknown";

/** Expanded topic domain — covers all spec-defined routing cases */
export type TopicDomain =
  | "health"
  | "travel"
  | "legal"
  | "housing"
  | "career"
  | "stem"
  | "education"
  | "business"
  | "culture"
  | "local_services"
  | "general";

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

// ── Spec-defined ResearchContext (deterministic query builder, Section 3) ──────

/**
 * ResearchContext — input type for the deterministic query builder.
 *
 * `question`            The member's raw question (required).
 * `requestedPopulation` When the member explicitly names a diaspora/community,
 *                       use their exact language instead of the default lens.
 * `explicitlyGeneral`   When true, suppress the population prefix entirely.
 * `place`               City/region; appended after the population and topic.
 * `topic`               Routing hint — selects the default population prefix.
 */
export type ResearchContext = {
  question: string;
  requestedPopulation?: string;
  explicitlyGeneral?: boolean;
  place?: string;
  topic?:
    | "health"
    | "legal"
    | "education"
    | "stem"
    | "housing"
    | "business"
    | "culture"
    | "local_services"
    | "other";
};

// ── Deterministic query builder (enforcement layer, not just a prompt) ─────────

/**
 * buildDiasporaFirstQuery — authoritative implementation from the spec.
 *
 * Apply this BEFORE every call to the web-research provider (Tavily or any
 * replacement). The system prompt reinforces the intent; this function enforces it.
 *
 * Routing rules:
 *   health → "Black women {topic}"
 *   stem | education → "Black women {topic}"
 *   business | culture | local_services → "Black community {topic}"
 *   legal | housing | other → "Black community {topic}"
 *   member-supplied population → member's exact language
 *   explicitlyGeneral → no population prefix
 */
export function buildDiasporaFirstQuery(context: ResearchContext): string {
  const topic = context.question.trim();
  if (!topic) throw new Error("QUESTION_REQUIRED");

  // Member overrides: explicit general research or explicit population
  if (context.explicitlyGeneral) {
    return [topic, context.place].filter(Boolean).join(" ");
  }

  const population =
    context.requestedPopulation ??
    (context.topic === "health"
      ? "Black women"
      : context.topic === "stem" || context.topic === "education"
        ? "Black women"
        : context.topic === "business" ||
            context.topic === "culture" ||
            context.topic === "local_services"
          ? "Black community"
          : "Black community");

  return [population, topic, context.place].filter(Boolean).join(" ");
}

// ── Legacy query builder — kept for backward compat with prepareResearchPlan ──

export const KINFOLK_PERMANENT_RESEARCH_LENS = {
  version: "2.0.0",
  primaryQueryContext: "Black women",
  broaderCommunityContext: "Black community",
  rule: "Apply the cultural research lens to source discovery. Never convert the lens or a search term into a claim about the member's identity.",
} as const;

function includesBlackWomenContext(query: string): boolean {
  return /\b(black\s+(women|woman|community|owned)|african\s+american|diaspora)\b/i.test(query);
}

/**
 * buildDiasporaFirstResearchQuery — original function, kept for backward compat.
 * New code should prefer buildDiasporaFirstQuery with ResearchContext.
 */
export function buildDiasporaFirstResearchQuery(
  memberQuestion: string,
  topic: TopicDomain,
  search: SearchContext,
): string {
  const cleanQuestion = memberQuestion.trim().replace(/\s+/g, " ");
  if (!cleanQuestion) throw new Error("QUESTION_REQUIRED");

  // Delegate to the canonical deterministic builder
  const ctx: ResearchContext = {
    question: cleanQuestion,
    explicitlyGeneral: search.subject === "general_research",
    topic: topic === "career" || topic === "travel" || topic === "general" ? "other" : topic,
  };

  // If the question already contains diaspora context, don't double-prefix
  if (includesBlackWomenContext(cleanQuestion)) {
    ctx.requestedPopulation = ""; // triggers [" " + topic + place].filter(Boolean) but topic includes the context
    ctx.explicitlyGeneral = true; // preserve as-is
  }

  const base = buildDiasporaFirstQuery(ctx);

  // Append any remembered or temporary subject context (legacy path)
  const subjectContext =
    search.subject === "me" && search.memberContext?.rememberedAttributes
      ? relevantRememberedContext(topic, search.memberContext.rememberedAttributes)
      : "";
  const temporaryContext = search.temporaryAttributes
    ? Object.values(search.temporaryAttributes).filter(Boolean).join(" ")
    : "";

  return [base, subjectContext, temporaryContext].filter(Boolean).join(" ");
}

function relevantRememberedContext(
  topic: TopicDomain,
  attributes: Record<string, string>,
): string {
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
  return /\b(black-owned|black\s+maternal|trans-friendly|halal|wheelchair-accessible|black\s+women|black\s+community)\b/i.test(
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
