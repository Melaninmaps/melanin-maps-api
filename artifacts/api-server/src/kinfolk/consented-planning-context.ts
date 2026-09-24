export type PlanningMemoryForContext = Readonly<{
  content: string;
  purpose: string;
  isSensitive: boolean;
}>;

type PlanningContextKind = "financial" | "family" | "relocation" | "employment";

const FINANCIAL_MEMORY = /\b(?:hours? (?:were|was|have been|got) reduced|reduced hours?|cut hours?|pay cut|income (?:dropped|reduced)|lost (?:my )?job|laid off|layoff|unemploy(?:ed|ment)|financial hardship|(?:money|funds?) (?:are|is) tight|tight budget|cannot afford|can't afford|behind on bills|debt)\b/i;
const FAMILY_MEMORY = /\b(?:my (?:child|children|kid|kids|son|daughter)|caregiv(?:er|ing)|my (?:mom|mother|dad|father|parent|grandmother|grandma|grandfather|grandpa))\b/i;
const RELOCATION_MEMORY = /\b(?:moving|relocat(?:e|ing|ion)|new (?:city|town|neighborhood|home)|looking for (?:housing|an apartment|a place to live))\b/i;
const EMPLOYMENT_MEMORY = /\b(?:new job|job search|job hunting|career change|work schedule|shift work|hours? at work|employer)\b/i;

const FINANCIAL_REQUEST = /\b(?:budget|afford(?:able|ability)?|cheap|low[- ]?cost|cost|price|prices|spend(?:ing)?|save|saving|gas|grocer(?:y|ies)|bill|bills|rent|payment|take (?:my )?(?:kid|kids|child|children) out|(?:plan|find|do|take).{0,40}\b(?:kid|kids|child|children|family)\b|dinner|lunch|brunch|restaurant|activity|activities|things to do|trip|travel|out(?:ing)?|purchase|buy|shopping)\b/i;
const FAMILY_REQUEST = /\b(?:my (?:child|children|kid|kids|son|daughter)|family|caregiv(?:er|ing)|my (?:mom|mother|dad|father|parent|grandmother|grandma|grandfather|grandpa)|daycare|aftercare|childcare|school pickup|extended hours?)\b/i;
const RELOCATION_REQUEST = /\b(?:moving|relocat(?:e|ing|ion)|housing|apartment|rent|lease|neighborhood|school district|commute|utilities|new city|new town)\b/i;
const EMPLOYMENT_REQUEST = /\b(?:job|career|work|employment|interview|resume|schedule|shift|benefits|pay|income|budget|afford(?:able|ability)?|cost|price|gas|grocer(?:y|ies)|bill|bills)\b/i;

function classifyPlanningMemory(content: string): PlanningContextKind | null {
  if (FINANCIAL_MEMORY.test(content)) return "financial";
  if (FAMILY_MEMORY.test(content)) return "family";
  if (RELOCATION_MEMORY.test(content)) return "relocation";
  if (EMPLOYMENT_MEMORY.test(content)) return "employment";
  return null;
}

function isDirectlyRelevant(kind: PlanningContextKind, message: string): boolean {
  switch (kind) {
    case "financial":
      return FINANCIAL_REQUEST.test(message);
    case "family":
      return FAMILY_REQUEST.test(message);
    case "relocation":
      return RELOCATION_REQUEST.test(message);
    case "employment":
      return EMPLOYMENT_REQUEST.test(message);
  }
}

/**
 * A planning memory is never used merely because it exists. Its user-selected
 * planning purpose and a concrete overlap with the current decision are both
 * required. This lets a member say that income changed and later ask about a
 * family outing without treating that fact as a permanent identity or using it
 * for unrelated questions.
 */
export function isConsentedPlanningMemoryRelevant(
  memory: PlanningMemoryForContext,
  currentMessage: string,
): boolean {
  if (memory.purpose !== "planning_context") return false;
  const kind = classifyPlanningMemory(memory.content);
  return kind !== null && isDirectlyRelevant(kind, currentMessage);
}

/**
 * Gives the model a bounded way to connect an explicitly saved planning fact to
 * a current decision. It does not make affordability, health, safety, legal, or
 * eligibility conclusions, and it never substitutes a saved memory for current
 * source evidence.
 */
export function buildConsentedPlanningContextPrompt(
  relevantMemories: readonly PlanningMemoryForContext[],
): string {
  if (relevantMemories.length === 0) return "";

  return `\n\nMEMBER-APPROVED PLANNING CONTEXT:\nOne or more private notes were explicitly saved for future planning and were selected only because they directly relate to this turn. Lead with the member's actual request; do not make the saved note the subject unless it helps explain a choice. When the request involves a purchase, outing, travel, work, housing, or another everyday decision, connect the answer to the practical impact: offer realistic lower-cost, time-aware, or family-aware alternatives where appropriate, and explain one useful next question the member may not know to ask. do not decide what the member can afford, diagnose their situation, infer a permanent income or identity, shame them, or let the memory override an explicit request. When discussing current prices, benefits, jobs, housing, laws, health, safety, or eligibility, use only supplied current source evidence and say when a claim needs checking. Never turn this private context into a Community trend, a public label, or a recommendation for another member.`;
}

/**
 * Deterministic directory results do not call a model. This bounded follow-up
 * preserves the same member-approved planning benefit without claiming pricing,
 * availability, or service hours that the directory has not verified.
 */
export function buildPlanningDiscoveryFollowUp(
  memories: readonly PlanningMemoryForContext[],
  request: string,
): string | null {
  const source = memories.map((memory) => memory.content).join(" ");
  const childcareRequest = /\b(?:daycare|aftercare|childcare|school pickup|early education)\b/i.test(request);
  if (childcareRequest && /\b(?:hours?|shift|schedule|work)\b/i.test(source)) {
    return "Would later pickup or extended hours make this work better with your schedule?";
  }
  const outingRequest = /\b(?:restaurant|dinner|lunch|brunch|outing|activity|trip|travel|spa|shopping)\b/i.test(request);
  if (outingRequest && FINANCIAL_MEMORY.test(source)) {
    return "Would you like me to prioritize lower-cost or closer options next?";
  }
  return null;
}

export const __planningContextTestOnly = {
  classifyPlanningMemory,
};
