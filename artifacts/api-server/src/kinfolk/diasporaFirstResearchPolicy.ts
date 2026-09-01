/**
 * Kinfolk retrieval-context policy.
 *
 * Historical export names are retained for compatibility, but there is no universal
 * demographic default. The only population qualifier permitted by this immediate
 * policy is wording explicitly present in the current user turn. Search terms never
 * create member identity or persistent memory.
 */

import { extractExplicitPopulationWording } from "./permitted-identity-context";

export type SearchSubject = "me" | "someone_else" | "general_research" | "unknown";

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
  /** Reserved until a purpose-consent ledger exists; ignored by the immediate policy. */
  rememberedAttributes?: Record<string, string>;
};

export type SearchContext = {
  subject: SearchSubject;
  /** Reserved until a purpose-consent ledger exists; ignored by the immediate policy. */
  temporaryAttributes?: Record<string, string>;
  memberContext?: MemberContext;
};

export type ResearchContext = {
  question: string;
  /** Must reproduce population wording explicitly present in `question`. */
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

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sameExplicitPopulation(question: string, requestedPopulation?: string): string | undefined {
  if (!requestedPopulation) return undefined;
  const explicitPopulation = extractExplicitPopulationWording(question);
  if (!explicitPopulation) return undefined;
  return explicitPopulation.toLowerCase() === clean(requestedPopulation).toLowerCase()
    ? explicitPopulation
    : undefined;
}

/**
 * Build a provider query without demographic inference. Population context is used
 * only when the same wording appears explicitly in this current question.
 */
export function buildDiasporaFirstQuery(context: ResearchContext): string {
  const question = clean(context.question);
  if (!question) throw new Error("QUESTION_REQUIRED");

  const explicitPopulation = context.explicitlyGeneral
    ? undefined
    : sameExplicitPopulation(question, context.requestedPopulation) ??
      extractExplicitPopulationWording(question) ??
      undefined;

  // The member's explicit wording is already in the raw question. Never double-prefix it.
  void explicitPopulation;
  return [question, context.place].filter(Boolean).join(" ");
}

/** Compatibility constant: neutral by design; no universal demographic values. */
export const KINFOLK_PERMANENT_RESEARCH_LENS = {
  version: "3.0.0",
  primaryQueryContext: null,
  broaderCommunityContext: "your community",
  rule: "Use only population wording explicitly present in the current turn. Never infer or persist identity from a query, name, place, preference, or stored cultural profile.",
} as const;

/** Final provider-boundary guard: normalize only; never inject a demographic. */
export function enforceDiasporaFirstProviderQuery(query: string): string {
  const cleanQuery = clean(query);
  if (!cleanQuery) throw new Error("QUESTION_REQUIRED");
  return cleanQuery;
}

/** Legacy signature retained for planning callers; saved attributes are not appended. */
export function buildDiasporaFirstResearchQuery(
  memberQuestion: string,
  _topic: TopicDomain,
  _search: SearchContext,
): string {
  return buildDiasporaFirstQuery({ question: memberQuestion });
}

/** Search context cannot establish identity, even when it contains a group term. */
export function prohibitsIdentityInference(question: string): boolean {
  return extractExplicitPopulationWording(question) !== null ||
    /\b(?:[a-z]+[-\s]+owned|diaspora|community|from\s+[A-Z][A-Za-z]+)\b/i.test(question);
}

export function contextStorageDecision(_search: SearchContext) {
  return {
    persistSearchSubject: false,
    persistTemporaryAttributes: false,
    mayUseMemberMemory: false,
    requireExplicitRememberPermission: true,
    purposeConsentLedgerRequired: true,
  } as const;
}
