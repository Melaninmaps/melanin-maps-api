export const BUSINESS_VOICE_TONES = [
  "warm",
  "direct",
  "celebratory",
  "professional",
  "playful",
  "calm",
] as const;

export type BusinessVoiceTone = (typeof BUSINESS_VOICE_TONES)[number];

export type BusinessVoiceProfileInput = Readonly<{
  tones: BusinessVoiceTone[];
  languagePreference: string | null;
  audienceGuidance: string | null;
  wordsToUse: string[];
  wordsToAvoid: string[];
  signaturePhrases: string[];
  ownerConfirmed: boolean;
}>;

export type SanitizedBusinessVoiceProfile = Omit<
  BusinessVoiceProfileInput,
  "ownerConfirmed"
>;

const MAX_LANGUAGE_LENGTH = 300;
const MAX_AUDIENCE_LENGTH = 600;
const MAX_TERM_LENGTH = 80;
const PROMPT_CONTROL_RE =
  /\b(?:ignore\s+(?:all\s+)?(?:previous|prior)|system\s+prompt|developer\s+message|act\s+as)\b/i;

function cleanText(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  if (!normalized || PROMPT_CONTROL_RE.test(normalized)) return null;
  return normalized;
}

function cleanTerms(value: unknown, limit: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [
    ...new Set(
      value
        .map((item) => cleanText(item, MAX_TERM_LENGTH))
        .filter((item): item is string => typeof item === "string"),
    ),
  ].slice(0, limit);
}

/**
 * Accept only a business owner's submitted, bounded profile values. The caller
 * must separately prove owner authorization; this function intentionally does
 * not inspect member chat, reviews, scraped content, location, or identity.
 */
export function sanitizeBusinessVoiceProfile(
  body: Record<string, unknown>,
):
  | { ok: true; profile: SanitizedBusinessVoiceProfile }
  | { ok: false; error: string } {
  if (body.ownerConfirmed !== true) {
    return {
      ok: false,
      error:
        "Confirm that these are authorized business profile inputs before saving.",
    };
  }

  const tones = Array.isArray(body.tones)
    ? [
        ...new Set(
          body.tones.filter(
            (tone): tone is BusinessVoiceTone =>
              typeof tone === "string" &&
              (BUSINESS_VOICE_TONES as readonly string[]).includes(tone),
          ),
        ),
      ].slice(0, 3)
    : [];
  const languagePreference = cleanText(
    body.languagePreference,
    MAX_LANGUAGE_LENGTH,
  );
  const audienceGuidance = cleanText(
    body.audienceGuidance,
    MAX_AUDIENCE_LENGTH,
  );
  const wordsToUse = cleanTerms(body.wordsToUse, 20);
  const wordsToAvoid = cleanTerms(body.wordsToAvoid, 20);
  const signaturePhrases = cleanTerms(body.signaturePhrases, 10);

  if (
    languagePreference === undefined ||
    audienceGuidance === undefined ||
    wordsToUse === undefined ||
    wordsToAvoid === undefined ||
    signaturePhrases === undefined
  ) {
    return {
      ok: false,
      error: "Use the supported Business Voice Profile fields.",
    };
  }

  return {
    ok: true,
    profile: {
      tones,
      languagePreference,
      audienceGuidance,
      wordsToUse,
      wordsToAvoid,
      signaturePhrases,
    },
  };
}

/**
 * A future business-facing drafting prompt may use this output only after the
 * authenticated owner has saved and confirmed the profile. It deliberately
 * excludes member language, reviews, community posts, and inferred traits.
 */
export function buildAuthorizedBusinessVoicePrompt(
  profile: SanitizedBusinessVoiceProfile,
): string {
  return [
    "BUSINESS VOICE PROFILE — OWNER-SUBMITTED:",
    profile.tones.length ? `Tone: ${profile.tones.join(", ")}.` : null,
    profile.languagePreference
      ? `Language preference: ${profile.languagePreference}`
      : null,
    profile.audienceGuidance ? `Audience: ${profile.audienceGuidance}` : null,
    profile.wordsToUse.length
      ? `Words or themes to use: ${profile.wordsToUse.join(", ")}.`
      : null,
    profile.wordsToAvoid.length
      ? `Words or themes to avoid: ${profile.wordsToAvoid.join(", ")}.`
      : null,
    profile.signaturePhrases.length
      ? `Signature phrasing: ${profile.signaturePhrases.join(" | ")}.`
      : null,
    "Use this only for the owner’s requested business-facing draft. Do not treat it as a member preference, community consensus, or a reason to imitate identity or dialect. Never invent business facts or promises.",
  ]
    .filter(Boolean)
    .join("\n");
}
