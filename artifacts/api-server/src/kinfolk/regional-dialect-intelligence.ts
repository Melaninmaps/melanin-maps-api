import { pool } from "@workspace/db";
import {
  normalizeRegionalFlavor,
  resolveRegionalLanguageProfile,
  type RegionalFlavor,
} from "./voice-personalization";

export const CONVERSATION_LANGUAGES = ["en", "es"] as const;
export type ConversationLanguage = (typeof CONVERSATION_LANGUAGES)[number];
export const REGIONAL_SPEAKING_STYLES = [
  "standard",
  "member_selected",
] as const;
export type RegionalSpeakingStyle = (typeof REGIONAL_SPEAKING_STYLES)[number];
export const LANGUAGE_DETECTION_MODES = ["off", "ask", "automatic"] as const;
export type LanguageDetectionMode = (typeof LANGUAGE_DETECTION_MODES)[number];
export const CODE_SWITCHING_MODES = ["manual", "ask", "automatic"] as const;
export type CodeSwitchingMode = (typeof CODE_SWITCHING_MODES)[number];

export type MemberLanguagePreferenceInput = Readonly<{
  preferredConversationLanguage?: unknown;
  regionalSpeechComprehension?: unknown;
  regionalSpeakingStyle?: unknown;
  pronunciationAssistance?: unknown;
  languageDetectionMode?: unknown;
  codeSwitchingMode?: unknown;
  regionalFlavor?: unknown;
  personalityMode?: unknown;
}>;

export type MemberLanguagePreferences = Readonly<{
  preferredConversationLanguage: ConversationLanguage;
  regionalSpeechComprehension: RegionalFlavor;
  regionalSpeakingStyle: RegionalSpeakingStyle;
  pronunciationAssistance: boolean;
  languageDetectionMode: LanguageDetectionMode;
  codeSwitchingMode: CodeSwitchingMode;
  persona: string;
  /** True only when preserving a pre-foundation regional choice. */
  legacyRegionalStyleFallback: boolean;
}>;

export type ReviewedPlaceReference = Readonly<{
  id: string;
  canonicalId: string;
  writtenName: string;
  aliases: string[];
  languageCode: ConversationLanguage;
  regionalProfile: string | null;
  pronunciationGuidance: string | null;
}>;

export type BoundedVoiceLanguageContext = Readonly<{
  languageCode: ConversationLanguage;
  transcriptionPrompt: string | null;
  approvedReferences: ReadonlyArray<
    Pick<ReviewedPlaceReference, "canonicalId" | "writtenName">
  >;
}>;

function includes<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export function normalizeConversationLanguage(
  value: unknown,
): ConversationLanguage {
  return includes(CONVERSATION_LANGUAGES, value) ? value : "en";
}

export function normalizeRegionalSpeakingStyle(
  value: unknown,
): RegionalSpeakingStyle {
  return includes(REGIONAL_SPEAKING_STYLES, value) ? value : "standard";
}

export function normalizeLanguageDetectionMode(
  value: unknown,
): LanguageDetectionMode {
  return includes(LANGUAGE_DETECTION_MODES, value) ? value : "off";
}

export function normalizeCodeSwitchingMode(value: unknown): CodeSwitchingMode {
  return includes(CODE_SWITCHING_MODES, value) ? value : "manual";
}

/**
 * Preserves existing member-selected regional behavior while giving new controls
 * their own default. A legacy value never implies a language, identity, or new
 * speaking-style selection.
 */
export function normalizeMemberLanguagePreferences(
  input: MemberLanguagePreferenceInput | null | undefined,
): MemberLanguagePreferences {
  const regionalSpeechComprehension = normalizeRegionalFlavor(
    input?.regionalSpeechComprehension ?? input?.regionalFlavor,
  );
  const hasExplicitSpeakingStyle = input?.regionalSpeakingStyle !== undefined;
  const legacyRegionalStyleFallback =
    !hasExplicitSpeakingStyle && regionalSpeechComprehension !== "off";
  return {
    preferredConversationLanguage: normalizeConversationLanguage(
      input?.preferredConversationLanguage,
    ),
    regionalSpeechComprehension,
    regionalSpeakingStyle: hasExplicitSpeakingStyle
      ? normalizeRegionalSpeakingStyle(input?.regionalSpeakingStyle)
      : legacyRegionalStyleFallback
        ? "member_selected"
        : "standard",
    pronunciationAssistance: input?.pronunciationAssistance === true,
    languageDetectionMode: normalizeLanguageDetectionMode(
      input?.languageDetectionMode,
    ),
    codeSwitchingMode: normalizeCodeSwitchingMode(input?.codeSwitchingMode),
    persona:
      typeof input?.personalityMode === "string" && input.personalityMode.trim()
        ? input.personalityMode
        : "community",
    legacyRegionalStyleFallback,
  };
}

export function validateMemberLanguagePreferencePatch(
  patch: Record<string, unknown>,
): string[] {
  const issues: string[] = [];
  const enumFields: Array<[string, readonly string[]]> = [
    ["preferredConversationLanguage", CONVERSATION_LANGUAGES],
    ["regionalSpeakingStyle", REGIONAL_SPEAKING_STYLES],
    ["languageDetectionMode", LANGUAGE_DETECTION_MODES],
    ["codeSwitchingMode", CODE_SWITCHING_MODES],
  ];
  for (const [field, allowed] of enumFields) {
    if (patch[field] !== undefined && !includes(allowed, patch[field])) {
      issues.push(`${field} must be one of: ${allowed.join(", ")}`);
    }
  }
  if (
    patch.regionalSpeechComprehension !== undefined &&
    !(
      typeof patch.regionalSpeechComprehension === "string" &&
      normalizeRegionalFlavor(patch.regionalSpeechComprehension) ===
        patch.regionalSpeechComprehension
    )
  ) {
    issues.push(
      "regionalSpeechComprehension must be an approved regional setting",
    );
  }
  if (
    patch.pronunciationAssistance !== undefined &&
    typeof patch.pronunciationAssistance !== "boolean"
  ) {
    issues.push("pronunciationAssistance must be a boolean");
  }
  return issues;
}

function normalizedWords(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function containsWholePhrase(text: string, phrase: string): boolean {
  const haystack = ` ${normalizedWords(text)} `;
  const needle = normalizedWords(phrase);
  return Boolean(needle) && haystack.includes(` ${needle} `);
}

function normalizeAliases(value: unknown, writtenName: string): string[] {
  const aliases = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  return [
    ...new Set(
      [writtenName, ...aliases].map((item) => item.trim()).filter(Boolean),
    ),
  ].slice(0, 12);
}

export function matchReviewedPlaceReferences(
  text: string,
  references: readonly ReviewedPlaceReference[],
): ReadonlyArray<ReviewedPlaceReference> {
  return references.filter((reference) =>
    normalizeAliases(reference.aliases, reference.writtenName).some((alias) =>
      containsWholePhrase(text, alias),
    ),
  );
}

/**
 * Reads only reviewed references matching the member's explicit regional
 * comprehension setting. The optional destination is used solely to select a
 * configured regional profile; it is never copied into a provider prompt.
 */
export async function loadReviewedPlaceReferences(input: {
  preferences: MemberLanguagePreferences;
  destination?: string | null;
  limit?: number;
}): Promise<ReviewedPlaceReference[]> {
  const profile = resolveRegionalLanguageProfile(
    input.preferences.regionalSpeechComprehension,
    input.destination,
  );
  if (!profile || !input.preferences.pronunciationAssistance) return [];
  try {
    const result = await pool.query<{
      id: string;
      canonical_id: string;
      written_name: string;
      aliases: unknown;
      language_code: string;
      regional_profile: string | null;
      pronunciation_guidance: string | null;
    }>(
      `SELECT id, canonical_id, written_name, aliases, language_code, regional_profile, pronunciation_guidance
         FROM kinfolk_place_language_references
        WHERE review_status = 'approved'
          AND regional_profile = $1
        ORDER BY written_name ASC
        LIMIT $2`,
      [profile.id, Math.max(1, Math.min(input.limit ?? 8, 8))],
    );
    return result.rows
      .filter((row) => row.language_code === "en" || row.language_code === "es")
      .map((row) => ({
        id: row.id,
        canonicalId: row.canonical_id,
        writtenName: row.written_name,
        aliases: normalizeAliases(row.aliases, row.written_name),
        languageCode: row.language_code as ConversationLanguage,
        regionalProfile: row.regional_profile,
        pronunciationGuidance: row.pronunciation_guidance,
      }));
  } catch {
    // Optional enrichment must never block a transcript or speech response.
    return [];
  }
}

/** A tiny, reviewed context with no chat history, profile text, or personal data. */
export function buildBoundedVoiceLanguageContext(input: {
  preferences: MemberLanguagePreferences;
  references: readonly ReviewedPlaceReference[];
}): BoundedVoiceLanguageContext {
  const approvedReferences = input.references.slice(0, 8).map((reference) => ({
    canonicalId: reference.canonicalId,
    writtenName: reference.writtenName,
  }));
  const names = approvedReferences.map((reference) => reference.writtenName);
  return {
    languageCode: input.preferences.preferredConversationLanguage,
    approvedReferences,
    transcriptionPrompt: names.length
      ? `The member may mention reviewed place names: ${names.join(", ")}. Preserve unclear names and do not guess or invent place names.`
      : null,
  };
}

/**
 * Returns TTS-only guidance for already-visible text. It does not rewrite the
 * member-visible response or ask a provider to imitate an accent.
 */
export function buildReviewedPronunciationGuidance(input: {
  spokenText: string;
  references: readonly ReviewedPlaceReference[];
}): string | null {
  const matches = matchReviewedPlaceReferences(
    input.spokenText,
    input.references,
  )
    .filter((reference) => Boolean(reference.pronunciationGuidance))
    .slice(0, 3);
  if (!matches.length) return null;
  return [
    "PRONUNCIATION ASSISTANCE — reviewed place references only:",
    ...matches.map(
      (reference) =>
        `- ${reference.writtenName}: ${reference.pronunciationGuidance}`,
    ),
    "Use this only to pronounce the named place clearly. Do not imitate a regional accent or change the speaker identity.",
  ].join("\n");
}

export function buildRegionalComprehensionPrompt(input: {
  preferences: MemberLanguagePreferences;
  destination?: string | null;
  intentClass?: string | null;
}): string {
  if (
    input.intentClass &&
    [
      "medical_health",
      "hair_loss_care",
      "safety_emergency",
      "legal_regulated",
      "financial_regulated",
    ].includes(input.intentClass)
  ) {
    return "LANGUAGE SAFETY: Use calm, precise plain language. Do not use regional or AAVE style guidance in this high-stakes context.";
  }
  const profile = resolveRegionalLanguageProfile(
    input.preferences.regionalSpeechComprehension,
    input.destination,
  );
  const comprehension = profile
    ? `REGIONAL COMPREHENSION — MEMBER SELECTED (${profile.label}): Understand a clearly expressed regional term when relevant. Do not infer identity, location, dialect, or language from chat.`
    : "REGIONAL COMPREHENSION: No regional setting is active. Do not infer dialect, identity, language, or location from chat.";
  const style =
    profile && input.preferences.regionalSpeakingStyle === "member_selected"
      ? `REGIONAL SPEAKING STYLE — OPTIONAL MEMBER SELECTION: At most one natural ${profile.label} expression may be used only when it clearly improves warmth and understanding. Never perform an accent, force slang, or stereotype a community.`
      : "REGIONAL SPEAKING STYLE: Use plain language unless the member separately and explicitly selects a speaking style.";
  const language = `CONVERSATION LANGUAGE: Reply in ${input.preferences.preferredConversationLanguage === "es" ? "Spanish" : "English"} unless the member explicitly asks otherwise. Automatic detection and automatic code switching are not active.`;
  return [comprehension, style, language].join("\n");
}
