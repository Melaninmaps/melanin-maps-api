import type { KinfolkModelPolicy } from "./staff-demo-policy";

export type KinfolkResponseDepth = "concise" | "standard" | "detailed";

export type KinfolkResponseDepthInput = Readonly<{
  message: string;
  intentClass: string | null | undefined;
  requiresCurrentEvidence: boolean;
  isTravelPlanning: boolean;
  hasLocation: boolean;
  hasContextualResearch: boolean;
}>;

const DETAIL_INTENTS = new Set([
  "business_discovery",
  "culture_entertainment",
  "education_discovery",
  "current_information",
  "hobby_lifestyle",
  "health",
  "legal",
  "financial",
]);

const DETAILED_REQUEST_PATTERN = /\b(?:explain|comparison|compare|versus|vs\.?|difference|plan|itinerary|step[ -]?by[ -]?step|pros?\s+and\s+cons?|options?|recommend|best|should\s+i|how\s+(?:do|does|can|would)|why|impact|affect|walk\s+me\s+through|details?|analysis|break\s+(?:it|this)\s+down|tell\s+me\s+about|what\s+(?:are|should)\s+(?:my|the)\s+next)\b/i;

const DIRECT_FACT_PATTERN = /^(?:who|what|when|where|which|is|are|can|does|do)\b/i;

/**
 * Selects answer depth before the model call. This is intentionally based only on
 * the current request's shape and route metadata, never identity, profile, or
 * private memory. A concise answer remains available for a simple question, but
 * planning, explanation, comparison, or current-information turns get room for
 * a complete chatbot-style answer.
 */
export function resolveKinfolkResponseDepth(input: KinfolkResponseDepthInput): KinfolkResponseDepth {
  const text = input.message.trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const asksForDetail = DETAILED_REQUEST_PATTERN.test(text);
  const hasMultipleQuestions = (text.match(/\?/g) ?? []).length > 1;
  const hasMultipleClauses = /[,;:]|\band\b|\bor\b/i.test(text);

  if (
    input.requiresCurrentEvidence ||
    input.isTravelPlanning ||
    input.hasLocation ||
    input.hasContextualResearch ||
    DETAIL_INTENTS.has(input.intentClass ?? "") ||
    asksForDetail ||
    hasMultipleQuestions ||
    (wordCount >= 18 && hasMultipleClauses)
  ) {
    return "detailed";
  }

  if (wordCount <= 8 && DIRECT_FACT_PATTERN.test(text)) return "concise";
  return "standard";
}

/**
 * Retains the established standard/staff output limits for ordinary turns and
 * enlarges only detailed turns, so multi-part answers do not get cut off while
 * simple questions stay fast and readable.
 */
export function resolveKinfolkOutputTokenBudget(
  policy: Pick<KinfolkModelPolicy, "mode" | "maxOutputTokens">,
  depth: KinfolkResponseDepth,
): number {
  if (depth === "detailed") return policy.mode === "staff_demo" ? 1_800 : 1_200;
  if (depth === "standard") return policy.mode === "staff_demo" ? 1_050 : 750;
  return policy.maxOutputTokens;
}

export function buildAdaptiveAnswerDepthPrompt(depth: KinfolkResponseDepth): string {
  const guidance = depth === "concise"
    ? "This is a simple direct question. Answer in one to three clear sentences unless safety, accuracy, or a requested source requires more."
    : depth === "standard"
      ? "Give a complete but compact answer: lead with the answer, then add only the context needed to make it useful."
      : "This question calls for a self-contained, complete answer. Lead with a clear recommendation or conclusion, then use short paragraphs and descriptive headings or bullets when they improve scanning. For a practical decision, include the recommended choice, why it fits, relevant tradeoffs, ranked alternatives when useful, and a concrete next step. Explain the reasoning, distinctions, tradeoffs, or next steps that the member needs; do not leave the answer at a teaser or make the member ask again for the basics.";

  return `ADAPTIVE ANSWER DEPTH — NON-NEGOTIABLE:\n${guidance}\nDo not narrate hidden work, say that you are researching or preparing an answer, promise a later answer, or expose internal process. Return the useful answer in this turn. Never add length as filler; match depth to the question.`;
}
