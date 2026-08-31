/** Privacy-safe normalization and matching for the Happening Now feed. */
export const HAPPENING_CATEGORIES = [
  "politics", "health", "safety", "housing", "education", "economy",
  "environment", "transportation", "culture", "community", "other",
] as const;

export type HappeningCategory = typeof HAPPENING_CATEGORIES[number];

// This deliberately small, reviewed vocabulary is the only synonym expansion
// permitted in feed preferences. Do not add member-provided words here.
export const APPROVED_TOPIC_SYNONYMS: Readonly<Record<string, HappeningCategory>> = {
  redistricting: "politics",
};

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA",
  michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

export function normalizeHappeningCategory(value: unknown): HappeningCategory | null {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  if ((HAPPENING_CATEGORIES as readonly string[]).includes(key)) return key as HappeningCategory;
  return APPROVED_TOPIC_SYNONYMS[key] ?? null;
}

export function normalizeHomeState(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim().toLowerCase().replace(/\./g, "") : "";
  if (!raw) return null;
  if (/^[a-z]{2}$/.test(raw)) return raw.toUpperCase();
  return STATE_NAMES[raw] ?? null;
}

export function normalizeCity(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
    : "";
}

export function isLocalStory(
  story: { scope: string; city: string | null; state: string | null },
  cities: ReadonlySet<string>,
  homeState: string | null,
  expandToState: boolean,
): boolean {
  if (story.scope !== "local") return true;
  if (cities.has(normalizeCity(story.city))) return true;
  // State expansion is opt-in; without it, a local story never crosses a city boundary.
  return expandToState && !!homeState && normalizeHomeState(story.state) === homeState;
}