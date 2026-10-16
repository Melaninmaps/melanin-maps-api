export const KINFOLK_RESPONSE_LENGTHS = [
  "brief",
  "balanced",
  "detailed",
  "adaptive",
] as const;
export type KinfolkResponseLength = (typeof KINFOLK_RESPONSE_LENGTHS)[number];

export const KINFOLK_RESPONSE_FORMATS = [
  "natural",
  "structured",
  "adaptive",
] as const;
export type KinfolkResponseFormat = (typeof KINFOLK_RESPONSE_FORMATS)[number];

export type KinfolkResponsePresentation = Readonly<{
  responseLength: KinfolkResponseLength;
  responseFormat: KinfolkResponseFormat;
  source: "saved" | "current_message" | "default";
}>;

const BRIEF_REQUEST = /\b(?:keep it short|short version|brief(?:ly)?|summari[sz]e(?:\s|$)|tl;?dr|just (?:give me )?(?:the )?answer|make it shorter)\b/i;
const DETAILED_REQUEST = /\b(?:long version|go deeper|tell me more|explain (?:it )?(?:thoroughly|in detail)|full (?:explanation|breakdown)|detailed (?:version|explanation)|walk me through)\b/i;
const NATURAL_FORMAT_REQUEST = /\b(?:natural conversation|conversational(?:ly)?|no (?:headings|list|bullets)|just talk(?: me)? through)\b/i;
const STRUCTURED_FORMAT_REQUEST = /\b(?:with headings|structured|(?:a )?bullet(?:ed)? list|step[ -]?by[ -]?step|make (?:it )?a list|put (?:it )?in (?:a )?table)\b/i;

export function isKinfolkResponseLength(value: unknown): value is KinfolkResponseLength {
  return typeof value === "string" && KINFOLK_RESPONSE_LENGTHS.includes(value as KinfolkResponseLength);
}

export function isKinfolkResponseFormat(value: unknown): value is KinfolkResponseFormat {
  return typeof value === "string" && KINFOLK_RESPONSE_FORMATS.includes(value as KinfolkResponseFormat);
}

/** Existing varchar storage values remain readable without a migration. */
export function responsePresentationFromDeliveryProfile(input: {
  detailLevel?: unknown;
  tonePreference?: unknown;
}): Pick<KinfolkResponsePresentation, "responseLength" | "responseFormat"> {
  const responseLength: KinfolkResponseLength = input.detailLevel === undefined || input.detailLevel === null
    ? "adaptive"
    : input.detailLevel === "quick"
      ? "brief"
      : input.detailLevel === "deep"
        ? "detailed"
        : input.detailLevel === "adaptive"
          ? "adaptive"
          : "balanced";
  const responseFormat: KinfolkResponseFormat = input.tonePreference === "format_natural"
    ? "natural"
    : input.tonePreference === "format_structured"
      ? "structured"
      : "adaptive";
  return { responseLength, responseFormat };
}

export function responsePresentationToDeliveryProfile(input: {
  responseLength: KinfolkResponseLength;
  responseFormat: KinfolkResponseFormat;
}): { detailLevel: "quick" | "standard" | "deep" | "adaptive"; tonePreference: "format_natural" | "format_structured" | "format_adaptive" } {
  return {
    detailLevel: input.responseLength === "brief"
      ? "quick"
      : input.responseLength === "detailed"
        ? "deep"
        : input.responseLength === "adaptive"
          ? "adaptive"
          : "standard",
    tonePreference: input.responseFormat === "natural"
      ? "format_natural"
      : input.responseFormat === "structured"
        ? "format_structured"
        : "format_adaptive",
  };
}

/** A direct instruction governs this turn only; it does not rewrite saved settings. */
export function resolveKinfolkResponsePresentation(input: {
  message: string;
  savedDetailLevel?: unknown;
  savedTonePreference?: unknown;
}): KinfolkResponsePresentation {
  const saved = responsePresentationFromDeliveryProfile({
    detailLevel: input.savedDetailLevel,
    tonePreference: input.savedTonePreference,
  });
  const currentLength = BRIEF_REQUEST.test(input.message)
    ? "brief"
    : DETAILED_REQUEST.test(input.message)
      ? "detailed"
      : null;
  const currentFormat = NATURAL_FORMAT_REQUEST.test(input.message)
    ? "natural"
    : STRUCTURED_FORMAT_REQUEST.test(input.message)
      ? "structured"
      : null;
  if (currentLength || currentFormat) {
    return {
      responseLength: currentLength ?? saved.responseLength,
      responseFormat: currentFormat ?? saved.responseFormat,
      source: "current_message",
    };
  }
  const hasSaved = input.savedDetailLevel !== undefined || input.savedTonePreference !== undefined;
  return { ...saved, source: hasSaved ? "saved" : "default" };
}

/**
 * This applies only to Kinfolk's conversational narration. Copyable artifacts
 * retain their audience, purpose, requested length, and artifact-format rules.
 */
export function buildKinfolkResponsePresentationPrompt(
  presentation: KinfolkResponsePresentation,
): string {
  const lengthGuidance: Record<KinfolkResponseLength, string> = {
    brief: "Start with a direct, concise answer and retain every qualification, safety consideration, and conclusion needed for it to remain accurate. A simple question should be short; a complex, consequential, or multi-part question may need more explanation. Do not omit meaning merely to be brief.",
    balanced: "Give a useful explanation with moderate detail, selecting only the context and examples that help this question.",
    detailed: "When the question benefits from depth, provide a thorough explanation with relevant context, distinctions, and examples; do not add repetitive paragraphs or depth the question does not need.",
    adaptive: "Choose useful depth from the question, complexity, active context, and safety needs rather than from a fixed response size.",
  };
  const formatGuidance: Record<KinfolkResponseFormat, string> = {
    natural: "Use flowing natural conversational paragraphs as the primary shape. Preserve readable paragraph breaks and explain related decision factors in prose, not as a multi-section checklist. A single small descriptive heading, compact list, or short copyable script is appropriate only when the member explicitly asks for steps or an inherently sequential task would otherwise become unclear. Do not make an ordinary conversation primarily a roadmap, matrix, checklist, or repeated headings.",
    structured: "Use descriptive headings, comparisons, or lists where they materially improve scanning; do not impose a business, academic, or checklist template on an unrelated question.",
    adaptive: "Choose natural paragraphs or structure based on what makes this exact answer easiest to understand; do not add formatting as decoration.",
  };
  return `MEMBER RESPONSE PRESENTATION — ${presentation.source === "current_message" ? "CURRENT-TURN OVERRIDE" : presentation.source === "saved" ? "SAVED PREFERENCE" : "DEFAULT"}:
- Response length: ${presentation.responseLength}. ${lengthGuidance[presentation.responseLength]}
- Response format: ${presentation.responseFormat}. ${formatGuidance[presentation.responseFormat]}
- This is not a rigid word, paragraph, section, or bullet limit. Simple questions stay direct even when Detailed is selected; complex, technical, educational, or safety-sensitive questions retain enough explanation even when Brief is selected.
- The selected Kinfolk persona changes conversational tone, cadence, warmth, and framing—not capability, factual standards, research quality, or available response formats.
- A current instruction such as “keep it short,” “summarize that,” “give me the long version,” or “use headings” applies only to this reply and overrides the saved presentation preference.
- This governs Kinfolk's direct commentary only. A standalone email, letter, resume, developer instruction, proposal, or other artifact follows its own audience, purpose, requested length, and format contract.`;
}

/**
 * Natural formatting permits occasional structure but should not turn a member's
 * ordinary conversation into a multi-section checklist. This guard is used only
 * to request one model rewrite that retains all content in readable paragraphs.
 */
export function needsKinfolkNaturalPresentationRevision(input: {
  presentation: Pick<KinfolkResponsePresentation, "responseFormat">;
  reply: string;
}): boolean {
  if (input.presentation.responseFormat !== "natural") return false;
  const listItems = input.reply
    .split("\n")
    .filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).length;
  return listItems > 4;
}

/**
 * Brief is a semantic preference, not a word cap. A crowded multi-section
 * response receives one model distillation so it can keep the core answer and
 * material caveats without mechanically dropping trailing text.
 */
export function needsKinfolkBriefPresentationRevision(input: {
  presentation: Pick<KinfolkResponsePresentation, "responseLength">;
  reply: string;
}): boolean {
  if (input.presentation.responseLength !== "brief") return false;
  const listItems = input.reply
    .split("\n")
    .filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).length;
  return listItems > 5 || /\n\s*(?:what|why|how|so what|limitations?|conclusion)\b[^\n]*:/i.test(input.reply) && input.reply.length > 1_400;
}
