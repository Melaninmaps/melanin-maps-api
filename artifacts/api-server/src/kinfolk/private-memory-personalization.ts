import {
  buildPrivateMemoryPromptBlock,
  type PrivateMemoryForPrompt,
} from "./private-memory";

export type PrivateMemoryUseState =
  | "runtime_disabled"
  | "member_not_opted_in"
  | "no_active_memory"
  | "no_relevant_memory"
  | "suppressed_for_contextual_evidence"
  | "applied"
  | "storage_unavailable";

export type PrivateMemoryCandidate = PrivateMemoryForPrompt & {
  isSensitive: boolean;
};

export type PreferenceScope =
  | "dining"
  | "accessibility"
  | "transportation"
  | "budget"
  | "service_specialty"
  | "family"
  | "travel";

export type PrivateMemoryUseDecision = Readonly<{
  state: PrivateMemoryUseState;
  shouldApply: boolean;
  memberFacingUse: { applied: true; message: string } | null;
}>;

const SCOPE_RULES: ReadonlyArray<{
  scope: PreferenceScope;
  memory: RegExp;
  request: RegExp;
}> = [
  {
    scope: "dining",
    memory:
      /\b(?:vegan|vegetarian|plant[- ]based|halal|kosher|gluten[- ]free|dairy[- ]free|allerg(?:y|ies)|cuisine|food|dining|restaurant|brunch|coffee|cafe|quiet(?:er)? spaces?)\b/i,
    request:
      /\b(?:restaurant|dining|dinner|lunch|brunch|breakfast|food|eat|cafe|coffee|bakery|bar|menu|cuisine)\b/i,
  },
  {
    scope: "accessibility",
    memory:
      /\b(?:wheelchair|accessible|accessibility|mobility|step[- ]free|elevator|hearing|asl|caption(?:ed|ing)|sensory|quiet(?:er)? environment)\b/i,
    request:
      /\b(?:accessible|accessibility|wheelchair|mobility|step[- ]free|elevator|hearing|asl|caption|sensory|restaurant|store|hotel|event|place|visit)\b/i,
  },
  {
    scope: "transportation",
    memory:
      /\b(?:transit|public transport|subway|bus|train|walk(?:ing)?|bike|parking|drive|car[- ]free|rideshare)\b/i,
    request:
      /\b(?:transit|subway|bus|train|walk(?:ing)?|bike|parking|drive|car|rideshare|nearby|near me|directions|commute|visit)\b/i,
  },
  {
    scope: "budget",
    memory:
      /\b(?:budget|afford(?:able|ability)?|low[- ]?cost|inexpensive|cheap|save money|money is tight|financial hardship|spend(?:ing)?)\b/i,
    request:
      /\b(?:budget|afford(?:able|ability)?|low[- ]?cost|inexpensive|cheap|price|cost|deal|restaurant|dinner|lunch|outing|trip|travel|shop)\b/i,
  },
  {
    scope: "service_specialty",
    memory:
      /\b(?:barber|barbershop|braid(?:s|er|ing)?|locs?|loctician|natural hair|salon|nails?|tattoo|piercing|doula|therap(?:y|ist)|massage|trainer|photograph(?:y|er)|accountant|attorney|childcare)\b/i,
    request:
      /\b(?:barber|barbershop|braid(?:s|er|ing)?|locs?|loctician|natural hair|salon|nails?|tattoo|piercing|doula|therap(?:y|ist)|massage|trainer|photograph(?:y|er)|accountant|attorney|childcare)\b/i,
  },
  {
    scope: "family",
    memory:
      /\b(?:children|kids?|son|daughter|family|caregiv(?:er|ing)|school pickup|daycare|aftercare)\b/i,
    request:
      /\b(?:children|kids?|son|daughter|family|caregiv(?:er|ing)|school pickup|daycare|aftercare|restaurant|outing|activity|trip|travel)\b/i,
  },
  {
    scope: "travel",
    memory:
      /\b(?:travel|trip|visit|vacation|hotel|airport|flight|commute|city|neighborhood|relocat(?:e|ing|ion))\b/i,
    request:
      /\b(?:travel|trip|visit|vacation|hotel|airport|flight|commute|city|neighborhood|near me|restaurant|things to do|relocat(?:e|ing|ion))\b/i,
  },
];

/**
 * Returns only coarse preference scopes. It never exposes the memory text and
 * is intentionally unavailable for sensitive notes.
 */
export function preferenceScopesForMemory(
  memory: PrivateMemoryCandidate,
): PreferenceScope[] {
  if (memory.isSensitive || memory.purpose === "preferred_name") return [];
  return SCOPE_RULES.filter(({ memory: pattern }) =>
    pattern.test(memory.content),
  ).map(({ scope }) => scope);
}

/**
 * Extends the existing purpose-specific gates with deterministic, explicitly
 * approved preference scopes. Existing sensitive, planning, companion, and
 * identity protections remain in the caller's legacy relevance result.
 */
export function isApprovedPrivateMemoryRelevant(input: {
  memory: PrivateMemoryCandidate;
  currentMessage: string;
  legacyRelevant: boolean;
}): boolean {
  if (input.legacyRelevant) return true;
  if (input.memory.isSensitive) return false;
  return SCOPE_RULES.some(
    ({ memory, request }) =>
      memory.test(input.memory.content) && request.test(input.currentMessage),
  );
}

export function resolvePrivateMemoryUseDecision(input: {
  runtimeEnabled: boolean;
  memberEnabled: boolean;
  storageUnavailable: boolean;
  activeMemoryCount: number;
  relevantMemoryCount: number;
  allowPersonalization: boolean;
}): PrivateMemoryUseDecision {
  if (!input.runtimeEnabled) {
    return {
      state: "runtime_disabled",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  if (!input.memberEnabled) {
    return {
      state: "member_not_opted_in",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  if (input.storageUnavailable) {
    return {
      state: "storage_unavailable",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  if (input.activeMemoryCount === 0) {
    return {
      state: "no_active_memory",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  if (input.relevantMemoryCount === 0) {
    return {
      state: "no_relevant_memory",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  if (!input.allowPersonalization) {
    return {
      state: "suppressed_for_contextual_evidence",
      shouldApply: false,
      memberFacingUse: null,
    };
  }
  return {
    state: "applied",
    shouldApply: true,
    memberFacingUse: {
      applied: true,
      message: "Your saved preference helped tailor this answer.",
    },
  };
}

/**
 * Keeps private preference context separate from evidence: source-backed facts
 * and citations stay authoritative, while approved memory can only add a
 * practical, optional personalization for the same authenticated member.
 */
export function buildPrivateMemoryPersonalizationBlock(
  memories: readonly PrivateMemoryForPrompt[],
): string {
  const memoryBlock = buildPrivateMemoryPromptBlock(
    memories.length > 0,
    memories,
  );
  if (!memoryBlock) return "";
  return [
    "PRIVATE PERSONALIZATION BOUNDARY — AFTER EVIDENCE:",
    "Public evidence, citations, eligibility, safety information, ownership status, and business ranking rules are authoritative and cannot be changed by a private preference.",
    "Use the approved memory only for one optional, practical consideration when it is directly relevant. Do not use it in structured fields, citations, source summaries, business promotion, or another member's answer.",
    memoryBlock,
  ].join("\n\n");
}
