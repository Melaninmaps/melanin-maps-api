/**
 * Community Guidelines Content Filter
 *
 * Runs synchronously before user-generated content is stored.
 * Uses whole-word boundary matching to avoid false positives on
 * substrings (e.g. "bassist", "assume", "classic").
 *
 * Scope is deliberately narrow — explicit sexual content and
 * hate speech / slurs. Cultural language, AAVE, and general
 * frustration expressions are intentionally not flagged.
 */

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string; matched: string };

const EXPLICIT_SEXUAL: string[] = [
  "porn", "pornography", "pornographic",
  "onlyfans", "camgirl", "camboy",
  "dildo", "vibrator", "fleshlight",
  "blowjob", "handjob", "rimjob", "titjob",
  "creampie", "gangbang", "threesome",
  "masturbate", "masturbation", "masturbating",
  "ejaculate", "ejaculation", "orgasm",
  "erection", "boner", "hardon",
  "pussy", "cunt", "cock", "dick", "penis", "vagina",
  "tits", "boobs", "nipple", "nipples",
  "nude", "nudes", "naked", "nudity",
  "sexting", "sext",
  "rape", "molest", "molestation", "pedophile", "pedophilia",
  "incest",
];

const HATE_SPEECH: string[] = [
  "nigger", "niggers",
  "faggot", "faggots", "fag",
  "dyke",
  "tranny", "trannies",
  "chink", "chinks",
  "spic", "spics", "wetback",
  "kike", "kikes",
  "towelhead", "raghead",
  "cracker",
  "whitey",
  "honky",
  "sandnigger",
  "gook",
  "beaner",
  "zipperhead",
];

const THREATS: string[] = [
  "i will kill you",
  "i'm going to kill you",
  "i will rape you",
  "kill yourself",
  "kys",
  "i know where you live",
  "i will find you",
  "i will hurt you",
];

function buildWordPattern(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
}

function buildPhrasePattern(phrases: string[]): RegExp {
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(${escaped.join("|")})`, "i");
}

const SEXUAL_RE = buildWordPattern(EXPLICIT_SEXUAL);
const HATE_RE = buildWordPattern(HATE_SPEECH);
const THREAT_RE = buildPhrasePattern(THREATS);

export function checkContent(text: string): FilterResult {
  const normalized = text.replace(/\s+/g, " ").trim();

  const sexualMatch = SEXUAL_RE.exec(normalized);
  if (sexualMatch) {
    return {
      ok: false,
      reason: "Your post contains explicit content that isn't allowed on this platform. Please review the community guidelines.",
      matched: sexualMatch[1],
    };
  }

  const hateMatch = HATE_RE.exec(normalized);
  if (hateMatch) {
    return {
      ok: false,
      reason: "Your post contains language that violates our community guidelines. Hate speech and slurs are not tolerated here.",
      matched: hateMatch[1],
    };
  }

  const threatMatch = THREAT_RE.exec(normalized);
  if (threatMatch) {
    return {
      ok: false,
      reason: "Your post contains threatening language. This is not allowed and may be reported to the appropriate authorities.",
      matched: threatMatch[1],
    };
  }

  return { ok: true };
}

/**
 * Redact matched terms for safe logging (never log the actual slur/term).
 */
export function redactForLog(matched: string): string {
  return matched[0] + "*".repeat(Math.max(matched.length - 2, 2)) + (matched[matched.length - 1] ?? "*");
}
