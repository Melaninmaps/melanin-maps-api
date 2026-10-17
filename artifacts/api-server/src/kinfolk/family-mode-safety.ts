import type { AgeBand } from "../lib/audience-policy";

/**
 * Family Mode is an explicit, account-level delivery preference. It is not an
 * age assertion and it never overwrites user_age_assurance or a member's saved
 * Kinfolk voice/language settings. At request time it applies the more
 * protective audience band and prevents adult-oriented discovery.
 */
export const FAMILY_MODE_AUDIENCE_BAND: AgeBand = "13_15";

const FAMILY_MODE_RESTRICTED_REQUEST =
  /\b(?:adult\s+(?:entertainment|content|only|movie|movies|show|shows)|strip\s*club|gentlemen'?s\s*club|nightclub|night\s*club|sex(?:ual)?\s+(?:content|scene|show|shows)|porn(?:ography)?|hook(?:ing|ups?)|casinos?|sports\s*betting|bar\s*hopping|cocktail\s*(?:bar|crawl)|wine\s*bar|bars?|brew(?:ery|pub)|21\s*\+|18\s*\+)\b/i;

export function familyModeAudienceBand(
  memberBand: AgeBand | "mixed_all_ages",
): AgeBand {
  // An assured under-13 member remains under-13. For every other account,
  // Family Mode delivers the stricter 13–15 audience policy without recording
  // a false age classification.
  return memberBand === "under_13" ? "under_13" : FAMILY_MODE_AUDIENCE_BAND;
}

export function isFamilyModeRestrictedRequest(message: string): boolean {
  return FAMILY_MODE_RESTRICTED_REQUEST.test(message);
}

export function buildFamilyModeSystemInstruction(): string {
  return `FAMILY MODE OVERRIDE — MEMBER ENABLED, NON-NEGOTIABLE:
- Use a family-safe, respectful, practical delivery style for this request. Keep the member's factual question intact, but do not provide graphic, sexual, adult-entertainment, gambling, drinking, or nightlife recommendations.
- Use clear standard English and a calm professional tone. Do not apply AAVE, regional slang, language-detection, code-switching, or a casual/playful voice while Family Mode is enabled.
- Treat every local recommendation as an all-ages option. Do not surface adult venues, adult events, age-restricted media, alcohol-focused businesses, or ticket links.
- Offer a safe substitute when an adult-oriented request is made: all-ages activities, museums, bookstores, parks, family restaurants, classes, or age-appropriate cultural events.
- Do not ask the member to disclose an age, child, family relationship, or location. Family Mode is a saved preference, not evidence about identity or age.
- This override applies only to the current response. It does not change, save, or announce the member's regular Kinfolk voice, language, age assurance, or other preferences.`;
}

export function familyModeRestrictedResponse(): {
  reply: string;
  followUpSuggestions: string[];
} {
  return {
    reply:
      "Family Mode is on, so I cannot help with adult-oriented recommendations. I can help find an all-ages activity, museum, bookstore, family restaurant, class, or age-appropriate event instead.",
    followUpSuggestions: [
      "Find all-ages activities",
      "Find a family restaurant",
      "Find a museum or bookstore",
    ],
  };
}
