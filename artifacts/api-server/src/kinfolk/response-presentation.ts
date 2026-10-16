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
    brief: "Start with the answer and use only the reasoning needed to make it accurate and usable. Synthesize related support instead of expanding every supporting fact into its own section or point. Retain every material qualification, safety consideration, and conclusion. A simple question should be short; a complex, consequential, or multi-part question may need a compact explanation. Do not omit meaning merely to be brief.",
    balanced: "Give a useful explanation with moderate detail, selecting only the context and examples that help this question. This preference reserves room for useful context beyond the shortest possible reply.",
    detailed: "When the question benefits from depth, provide a thorough explanation with relevant context, distinctions, and examples; for a simple question, add the useful context a Detailed preference asks for without turning it into an essay. Do not add repetitive paragraphs or depth the question does not need.",
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
 * This final first-call check reconciles response depth and member presentation
 * before generation. It deliberately describes an editorial judgment rather
 * than a word, sentence, heading, or marker quota, so it cannot flatten a
 * consequential answer or force every conversational answer into one shape.
 */
export function buildKinfolkFirstCallCompositionCheck(input: {
  presentation: Pick<KinfolkResponsePresentation, "responseLength" | "responseFormat">;
  depth: "concise" | "standard" | "detailed";
}): string {
  const lengthCheck = input.presentation.responseLength === "brief"
    ? "The member chose Brief. Give the answer and its material reasoning in the smallest complete shape that fits this question. Combine related support rather than expanding it into a multi-part framework; preserve every safety, uncertainty, and decision-relevant qualification."
    : input.presentation.responseLength === "detailed"
      ? "The member chose Detailed. Give the question enough context, distinctions, and examples to be self-contained, but stop when the useful explanation is complete; do not repeat the same point in a new label or section."
      : input.presentation.responseLength === "balanced"
        ? "The member chose Balanced. Give a direct answer and the context that makes it useful, leaving out optional depth and repetition."
        : "The member chose Adaptive length. Let the actual question, active context, and safety needs decide the useful amount of explanation."
  const formatCheck = input.presentation.responseFormat === "natural"
    ? "The member chose Natural format. For an ordinary explanation, conversation, or emotional check-in, use connected paragraphs as the primary shape. Do not default to headings, a numbered plan, or a multi-bullet checklist. A compact list is appropriate only when the member asks for one or when several independent options, comparisons, or ordered actions genuinely become clearer that way."
    : input.presentation.responseFormat === "structured"
      ? "The member chose Structured format. Organize only the distinctions that materially improve scanning; do not create empty headings or a framework just to look organized."
      : "The member chose Adaptive format. Select paragraphs, headings, or a compact list only when that shape makes this exact answer clearer."
  const depthCheck = input.depth === "concise"
    ? "This is a simple question: lead with one clear answer and do not add an unsolicited mini-lesson, script, or follow-up invitation."
    : input.depth === "detailed"
      ? "This needs real depth: keep the explanation readable and proportionate, using paragraphs first and structure only where it clarifies a genuine distinction or sequence."
      : "This needs a complete but compact answer: include the answer and the context needed to use it, without turning it into a guidebook."
  return `FINAL FIRST-CALL RESPONSE CHECK — APPLY BEFORE RETURNING:\n${lengthCheck}\n${formatCheck}\n${depthCheck}\nThis is an instruction to compose the correct answer on this first call, not a request for a later rewrite. Preserve the selected persona and any active language preference while applying it.`;
}
