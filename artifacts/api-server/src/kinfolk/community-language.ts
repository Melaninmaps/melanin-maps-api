export type CommunityLanguageProposalInput = Readonly<{
  term: unknown;
  meaning: unknown;
  city?: unknown;
  usageExample?: unknown;
}>;

export type ValidCommunityLanguageProposal = {
  term: string;
  meaning: string;
  city: string | null;
  usageExample: string | null;
};

export type ApprovedCommunityLanguageTerm = Readonly<{
  term: string;
  meaning: string;
  city: string | null;
  usageExample: string | null;
}>;

type CityLanguageEntry = Readonly<{
  aliases: readonly string[];
  terms: readonly { term: string; meaning: string; clarification?: string }[];
}>;

const CITY_LANGUAGE: Record<string, CityLanguageEntry> = {
  "new york": {
    aliases: ["new york", "nyc", "manhattan", "brooklyn", "bronx", "queens", "staten island"],
    terms: [
      { term: "bodega", meaning: "a neighborhood convenience store, often with food and household basics" },
      {
        term: "chopped cheese",
        meaning: "a New York sandwich of chopped ground beef, cheese, onions, and toppings on a hero roll",
        clarification: "If the member asks for a cheesesteak, do not assume they are wrong. Briefly ask whether they mean a Philly-style cheesesteak or the New York corner-store classic, a chopped cheese.",
      },
      { term: "hero", meaning: "the local word for a long sandwich roll or sub" },
    ],
  },
  "washington dc": {
    aliases: ["washington dc", "washington, dc", "district of columbia", "the district", "dmv"],
    terms: [
      { term: "Chocolate City", meaning: "a longstanding cultural nickname for Washington, DC; use it as cultural context, not as a current demographic claim" },
      { term: "go-go", meaning: "DC's percussion-driven music tradition and a major local cultural touchstone" },
      { term: "half-smoke", meaning: "a local sausage specialty commonly associated with DC" },
      { term: "mumbo sauce", meaning: "a sweet-and-tangy sauce commonly associated with DC carryout food" },
      { term: "carryout", meaning: "a takeout-focused restaurant or order, a term commonly used in the DC area" },
    ],
  },
  baltimore: {
    aliases: ["baltimore", "b-more", "bmore", "charm city"],
    terms: [
      { term: "B-More", meaning: "a common shorthand for Baltimore" },
      { term: "Charm City", meaning: "a long-standing nickname for Baltimore" },
      { term: "carryout", meaning: "a takeout-focused restaurant or order, a common Baltimore-area usage" },
      { term: "chicken box", meaning: "a carryout meal commonly paired with fries and a drink" },
      { term: "half-and-half", meaning: "in Baltimore food context, often tea mixed with lemonade; clarify rather than assume because the phrase has other meanings" },
    ],
  },
  philadelphia: {
    aliases: ["philadelphia", "philly"],
    terms: [
      { term: "jawn", meaning: "a flexible Philly word for a person, place, thing, or situation" },
      { term: "water ice", meaning: "Philadelphia's name for a frozen dessert; do not automatically substitute Italian ice" },
      { term: "hoagie", meaning: "the local word for a long sandwich, similar to a sub or hero" },
      { term: "uptown", meaning: "a context-dependent local area reference; ask a focused neighborhood question if a route or recommendation depends on the exact area" },
      { term: "down North Philly", meaning: "a local directional expression for going to North Philadelphia; understand it as a location reference without correcting the member's wording" },
    ],
  },
};

const SAFE_TERM = /^[\p{L}\p{N}][\p{L}\p{N}\s.'&/-]{1,59}$/u;
const FORBIDDEN_PROPOSAL_CONTENT = /\b(?:ignore|system prompt|developer message|password|api key|token|secret|credential|http:\/\/|https:\/\/|<script|javascript:)\b/i;

function trimmedText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
  return text && text.length <= maximum ? text : null;
}

export function validateCommunityLanguageProposal(input: CommunityLanguageProposalInput):
  | { ok: true; value: ValidCommunityLanguageProposal }
  | { ok: false; error: string } {
  const term = trimmedText(input.term, 60);
  const meaning = trimmedText(input.meaning, 280);
  const city = input.city === undefined || input.city === null || input.city === "" ? null : trimmedText(input.city, 100);
  const usageExample = input.usageExample === undefined || input.usageExample === null || input.usageExample === "" ? null : trimmedText(input.usageExample, 240);
  if (!term || !SAFE_TERM.test(term)) return { ok: false, error: "Term must be 2–60 plain-text characters." };
  if (!meaning || meaning.length < 8) return { ok: false, error: "Meaning must be 8–280 plain-text characters." };
  if ((input.city !== undefined && input.city !== null && input.city !== "") && !city) return { ok: false, error: "City must be 1–100 plain-text characters when provided." };
  if ((input.usageExample !== undefined && input.usageExample !== null && input.usageExample !== "") && !usageExample) return { ok: false, error: "Example must be 1–240 plain-text characters when provided." };
  if (FORBIDDEN_PROPOSAL_CONTENT.test([term, meaning, city, usageExample].filter(Boolean).join(" "))) {
    return { ok: false, error: "Proposal contains unsupported or unsafe content." };
  }
  return { ok: true, value: { term, meaning, city, usageExample } };
}

function matchingCityLanguage(destination: string | null | undefined): CityLanguageEntry | null {
  if (!destination) return null;
  const normalized = destination.toLocaleLowerCase();
  return Object.values(CITY_LANGUAGE).find((entry) => entry.aliases.some((alias) => normalized.includes(alias))) ?? null;
}

/**
 * City vocabulary is a comprehension tool, not permission to imitate an accent.
 * It applies in every Kinfolk mode once a city is resolved, including when the
 * member has not enabled a regional-language preference.
 */
export function buildCityLanguageRecognitionPrompt(destination: string | null | undefined): string {
  const entry = matchingCityLanguage(destination);
  if (!entry) return "";
  const terms = entry.terms.map((item) => `• "${item.term}" means ${item.meaning}${item.clarification ? `\n  Clarification: ${item.clarification}` : ""}`).join("\n");
  return `CITY-AWARE LANGUAGE RECOGNITION — ${destination}:\nRecognize the following local vocabulary and use it to understand the member's intent. Do not correct a member harshly, presume a term's meaning when it is ambiguous, or imitate a dialect. When a city-specific distinction would change a recommendation, offer one brief, respectful clarification. If the member uses one of these exact terms in a low-stakes request, you may repeat that exact term once to confirm understanding; do not use a local term merely for style.\n${terms}`;
}

/** Approved member proposals are compact, city-scoped, and always subordinate to verified facts. */
export function buildApprovedCommunityLanguagePrompt(terms: readonly ApprovedCommunityLanguageTerm[]): string {
  if (terms.length === 0) return "";
  return `COMMUNITY-APPROVED LANGUAGE — GOVERNED REFERENCE:\nThese are approved meaning references contributed by members. Use them only to understand intent or offer a respectful clarification. They are not evidence for health, legal, financial, safety, political, news, ownership, or business claims. Do not infer identity or mimic a member's dialect.\n${terms.slice(0, 8).map((item) => `• "${item.term}"${item.city ? ` (${item.city})` : ""} — ${item.meaning}${item.usageExample ? ` Example context: ${item.usageExample}` : ""}`).join("\n")}`;
}

/** Non-city terms of warmth are understood, but never echoed as an assumed personal title. */
export const COMMUNITY_ADDRESS_RECOGNITION_PROMPT = `COMMUNITY ADDRESS RECOGNITION:\nUnderstand terms such as "beloved," "queen," "king," "cousin," and "auntie" as possible warmth, respect, kinship, or conversational address depending on context. Do not treat them as verified identity, relationship, age, gender, or rank. Avoid automatically calling a member by one of these terms; mirror it only when the member has used it in that same low-stakes conversation and it clearly fits their chosen Kinfolk mode.`;
