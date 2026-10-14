export const BUSINESS_CULTURAL_TEACHING_MAX_TITLE_CHARS = 120;
export const BUSINESS_CULTURAL_TEACHING_MAX_TEXT_CHARS = 700;
export const BUSINESS_CULTURAL_TEACHING_MAX_WORDS = 90;

export type BusinessCulturalTeachingInput = Readonly<{
  title: string;
  teaching: string;
  ownerConfirmed: true;
}>;

export type SanitizedBusinessCulturalTeaching = Readonly<{
  title: string;
  teaching: string;
}>;

export type BusinessCulturalTeachingValidationResult =
  | { ok: true; teaching: SanitizedBusinessCulturalTeaching }
  | { ok: false; error: string };

const SUPPORTED_FIELDS = new Set(["title", "teaching", "ownerConfirmed"]);
// Tabs and ordinary line breaks normalize to a space. All other controls and
// invisible format controls are rejected rather than changed into new meaning.
const UNSAFE_CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u;
// The teaching is display text, not a rich-text, link, or markup channel.
const MARKUP_RE = /[<>]|&(?:lt|gt|amp|quot|#\d+|#x[\da-f]+);|```|\[[^\]\n]+\]\([^\n)]+\)/iu;
const DIRECT_LINK_RE = /(?:https?:\/\/|www\.)\S+/iu;

function normalizePlainText(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    UNSAFE_CONTROL_RE.test(value) ||
    MARKUP_RE.test(value) ||
    DIRECT_LINK_RE.test(value)
  ) {
    return null;
  }
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Accept only the three deliberate owner fields. This deliberately has no
 * culture, demographic, identity, audience, targeting, source, or metadata
 * inputs: a business may offer only its own bounded point-of-visit text.
 */
export function sanitizeBusinessCulturalTeaching(
  body: unknown,
): BusinessCulturalTeachingValidationResult {
  if (!isRecord(body) || Object.keys(body).some((key) => !SUPPORTED_FIELDS.has(key))) {
    return { ok: false, error: "Use only the supported teaching fields." };
  }
  if (body.ownerConfirmed !== true) {
    return { ok: false, error: "Confirm this teaching before saving." };
  }

  const title = normalizePlainText(body.title);
  const teaching = normalizePlainText(body.teaching);
  if (title === null || teaching === null) {
    return { ok: false, error: "Use plain text for the title and teaching." };
  }
  if (title.length < 2 || title.length > BUSINESS_CULTURAL_TEACHING_MAX_TITLE_CHARS) {
    return { ok: false, error: "Keep the title between 2 and 120 characters." };
  }
  const words = teaching ? teaching.split(" ") : [];
  if (
    !teaching ||
    teaching.length > BUSINESS_CULTURAL_TEACHING_MAX_TEXT_CHARS ||
    words.length > BUSINESS_CULTURAL_TEACHING_MAX_WORDS
  ) {
    return {
      ok: false,
      error: "Keep the teaching to 90 words and 700 characters or fewer.",
    };
  }

  return { ok: true, teaching: { title, teaching } };
}
