/**
 * Narrow direct-name lookup is a public-directory escape hatch, not a broad
 * discovery mode. Keep this pure helper shared across API, Web, and native
 * clients so a client that asks for a direct listing cannot accidentally enter
 * a broader Map or Discovery result path on the server.
 */
const GENERIC_DIRECT_NAME_TERMS = new Set([
  "a", "an", "and", "attorney", "bar", "bars", "bookstore", "business",
  "businesses", "cafe", "clothes", "club", "clubs", "coffee", "doctor",
  "doctors", "food", "girls", "hair", "hospital", "hospitals", "near",
  "me", "pharmacy", "philly", "philadelphia", "houston", "atlanta",
  "minneapolis", "restaurant", "restaurants", "salon", "service", "services",
  "shop", "shops", "store", "stores", "vegan", "vegetarian",
]);

// These are member Discovery preferences, not name evidence. Keep exact lookup
// available for a real name such as "Amina Restaurant", while ensuring phrases
// such as "Black-owned restaurants" cannot bypass governed Discovery.
const OWNERSHIP_BROWSE_PHRASE = /\b(?:black|african\s+american|latino|latina|latinx|hispanic|minority|women?|lgbtq\+?|queer|veteran|disabled|indigenous|native|asian)[\s/-]+owned\b/iu;

/**
 * Accept a plausible member-entered business name while rejecting generic
 * browse/category phrases. This decides only whether a client requests the
 * strict direct-name route; the route itself still enforces public visibility
 * and literal, case-insensitive name equality.
 */
export function isDeliberateBusinessNameLookup(value: string): boolean {
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (normalized.length < 3 || normalized.length > 100) return false;
  if (OWNERSHIP_BROWSE_PHRASE.test(normalized)) return false;

  const words = normalized
    .toLocaleLowerCase("en-US")
    .split(" ")
    // Keep Unicode letters and numbers. Punctuation is irrelevant to deciding
    // whether a phrase is a generic category; it is never removed from the
    // subsequent exact-name database comparison.
    .map((word) => word.replace(/[\p{P}\p{S}]/gu, ""))
    .filter(Boolean);

  return words.length > 0
    && words.length <= 7
    && words.some((word) => !GENERIC_DIRECT_NAME_TERMS.has(word));
}
