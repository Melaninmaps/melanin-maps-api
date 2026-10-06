import {
  normalizeRegionalFlavor,
  resolveRegionalLanguageProfile,
  type RegionalFlavor,
} from "./voice-personalization";

export type VoiceTranscriptMeaningReview = Readonly<{
  originalText: string;
  suggestedText: string | null;
  clarification: string | null;
  requiresConfirmation: true;
  regionalLanguage: "off" | "member_selected";
}>;

const MAX_TRANSCRIPT_REVIEW_CHARS = 2_000;
const MAX_CLARIFICATION_CHARS = 180;

function normalizeText(value: unknown, limit = MAX_TRANSCRIPT_REVIEW_CHARS): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, limit)
    : "";
}

function tokenOverlap(first: string, second: string): number {
  const source = new Set(first.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []);
  const candidate = new Set(second.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []);
  if (source.size === 0 || candidate.size === 0) return 0;
  let shared = 0;
  for (const token of source) if (candidate.has(token)) shared += 1;
  return shared / Math.max(source.size, candidate.size);
}

function selectedRegionalLanguage(value: unknown): {
  flavor: RegionalFlavor;
  label: string | null;
} {
  const flavor = normalizeRegionalFlavor(value);
  if (flavor === "off" || flavor === "follow_destination") {
    return { flavor, label: null };
  }
  return { flavor, label: resolveRegionalLanguageProfile(flavor, null)?.label ?? null };
}

/**
 * Builds a bounded, review-only prompt. The transcript is the only member text
 * the reviewer receives. It never receives identity, chat history, location
 * history, memories, preferences other than a member-confirmed regional choice,
 * or business data.
 */
export function buildVoiceTranscriptMeaningPrompt(input: {
  transcript: string;
  regionalFlavor: unknown;
}): { system: string; user: string } {
  const regional = selectedRegionalLanguage(input.regionalFlavor);
  const regionalInstruction = regional.label
    ? `The member explicitly selected ${regional.label} regional language. You may recognize only a clearly spoken expression from that selected setting, but you must not add slang, infer identity, dialect, location, or language, or rewrite the member into a regional register.`
    : "No member-confirmed regional language applies. Do not infer, add, or normalize regional vocabulary, dialect, identity, or language.";

  return {
    system: [
      "You prepare a private, review-only transcription suggestion for Kinfolk.",
      "Return JSON only with exactly these keys: suggestedText and clarification.",
      "suggestedText must be either a string or null. clarification must be either a short string or null.",
      "Never answer the member's question, add facts, remove requests, infer identity, or turn a transcript into advice.",
      "Preserve the member's wording and intent. You may only propose clearly supported punctuation, list structure, ordinary speech-to-text spelling, and obvious word-boundary corrections.",
      "Never silently replace a named person, business, place, medicine, law, financial product, amount, date, diagnosis, or other material fact. If such a term is unclear, keep it unchanged and use clarification to ask one focused question.",
      "A rambling or list-like request may be made easier to read only when every requested item remains present.",
      "The member must review or edit the original before anything is sent. A suggestion is optional and never becomes a chat message by itself.",
      regionalInstruction,
    ].join("\n"),
    user: `Original voice transcript:\n${input.transcript}`,
  };
}

/**
 * Accepts only a conservative optional proposal. The original transcript is
 * always returned separately and remains the default composer content.
 */
export function parseVoiceTranscriptMeaningReview(input: {
  transcript: string;
  regionalFlavor: unknown;
  modelContent: unknown;
}): VoiceTranscriptMeaningReview {
  const originalText = normalizeText(input.transcript);
  const regional = selectedRegionalLanguage(input.regionalFlavor);
  const base: VoiceTranscriptMeaningReview = {
    originalText,
    suggestedText: null,
    clarification: null,
    requiresConfirmation: true,
    regionalLanguage: regional.label ? "member_selected" : "off",
  };
  if (!originalText || typeof input.modelContent !== "string") return base;

  const json = input.modelContent
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(json) as {
      suggestedText?: unknown;
      clarification?: unknown;
    };
    const suggestedText = normalizeText(parsed.suggestedText);
    // Do not surface a proposal that could be an answer, a replacement request,
    // or an unrelated rewrite. The original remains available even when this
    // guard rejects the model output.
    const safeSuggestion =
      suggestedText &&
      suggestedText !== originalText &&
      tokenOverlap(originalText, suggestedText) >= 0.55
        ? suggestedText
        : null;
    const clarification = normalizeText(
      parsed.clarification,
      MAX_CLARIFICATION_CHARS,
    );
    return {
      ...base,
      suggestedText: safeSuggestion,
      clarification: clarification || null,
    };
  } catch {
    return base;
  }
}
