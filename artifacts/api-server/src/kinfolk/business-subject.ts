export type BusinessSubjectKey =
  | "bookstore"
  | "restaurant"
  | "cafe"
  | "barber"
  | "salon"
  | "grocery"
  | "laundromat"
  | "hotel"
  | "nightlife"
  | "hvac"
  | "auto_repair"
  | "locs"
  | "spa"
  | "waxing"
  | "wellness"
  | "fitness"
  | "therapist"
  | "medical"
  | "travel_advisor"
  | "gaming"
  | "activity"
  | "museum"
  | "gallery"
  | "fragrance"
  | "jewelry"
  | "fashion"
  | "dessert";

export type NormalizedBusinessSubject = Readonly<{
  key: BusinessSubjectKey;
  label: string;
  searchTerms: readonly string[];
}>;

type SubjectDefinition = NormalizedBusinessSubject & Readonly<{
  match: RegExp;
  requiresDiscoveryContext?: boolean;
  priority?: number;
}>;

/**
 * Current-turn service vocabulary. Add a definition here to extend both intent
 * classification and the governed database/web retrieval path. These terms
 * describe what the member asked to find; they are never member attributes.
 */
const SUBJECTS: readonly SubjectDefinition[] = [
  {
    key: "bookstore",
    label: "bookstores",
    match: /\b(?:book[ -]?stores?|bookshops?|booksellers?)\b/i,
    searchTerms: ["bookstore", "book store", "bookshop", "bookseller", "books"],
  },
  {
    key: "restaurant",
    label: "restaurants",
    match: /\b(?:restaurants?|dining|dinner|lunch|breakfast|food spots?|places to eat)\b/i,
    searchTerms: ["restaurant", "restaurants", "dining", "food"],
  },
  {
    key: "cafe",
    label: "cafes and coffee shops",
    match: /\b(?:caf[eé]s?|coffee shops?|coffeehouses?)\b/i,
    searchTerms: ["cafe", "coffee shop", "coffeehouse", "coffee"],
  },
  {
    key: "barber",
    label: "barbershops",
    match: /\b(?:barbers?|barber[ -]?shops?)\b/i,
    searchTerms: ["barber", "barbershop", "barber shop"],
  },
  {
    key: "salon",
    label: "salons",
    match: /\b(?:hair|salons?|hair stylists?|hair color|wash and style)\b/i,
    searchTerms: ["salon", "hair salon", "hair stylist", "hair color", "wash and style"],
  },
  {
    key: "grocery",
    label: "grocery stores",
    match: /\b(?:grocer(?:y|ies)|grocery stores?|markets?)\b/i,
    searchTerms: ["grocery", "grocery store", "market", "food market"],
  },
  {
    key: "laundromat",
    label: "laundromats",
    match: /\b(?:laundromats?|laundr(?:y|ies))\b/i,
    searchTerms: ["laundromat", "laundry", "laundry service"],
  },
  {
    key: "hotel",
    label: "hotels",
    match: /\b(?:hotels?|lodging|places to stay)\b/i,
    searchTerms: ["hotel", "lodging", "accommodations"],
  },
  {
    key: "nightlife",
    label: "nightlife venues",
    match: /\b(?:night[ -]?life|bars?|clubs?|lounges?|late[ -]?night venues?)\b/i,
    searchTerms: ["nightlife", "bar", "club", "lounge", "late night"],
  },
  {
    key: "hvac",
    label: "HVAC services",
    match: /\b(?:hvac|heating and (?:air|cooling)|air conditioning|a\/c repair)\b/i,
    searchTerms: ["hvac", "heating", "air conditioning", "cooling"],
  },
  {
    key: "auto_repair",
    label: "auto repair services",
    match: /\b(?:auto repair|car repair|mechanics?|automotive service)\b/i,
    searchTerms: ["auto repair", "car repair", "mechanic", "automotive"],
  },
  {
    key: "locs",
    label: "loc and natural-hair care",
    match: /\b(?:locs?|dreadlocks?|protective styles?|braids?|natural hair)\b/i,
    searchTerms: ["locs", "loc maintenance", "natural hair", "protective styles", "braids"],
    priority: 10,
  },
  {
    key: "spa",
    label: "spas",
    match: /\b(?:day spas?|spas?|facials?|massage services?)\b/i,
    searchTerms: ["spa", "day spa", "facial", "massage"],
  },
  {
    key: "waxing",
    label: "waxing and brow services",
    match: /\b(?:waxing|wax studio|brow services?|brow studio)\b/i,
    searchTerms: ["waxing", "wax studio", "brow", "lashes"],
  },
  {
    key: "wellness",
    label: "wellness businesses",
    match: /\b(?:wellness (?:businesses?|centers?|shops?)|apothecar(?:y|ies)|holistic wellness)\b/i,
    searchTerms: ["wellness", "wellness center", "apothecary", "holistic"],
  },
  {
    key: "fitness",
    label: "fitness and gyms",
    match: /\b(?:fitness|gyms?|personal trainers?|yoga|pilates)\b/i,
    searchTerms: ["fitness", "gym", "personal trainer", "yoga", "pilates"],
    requiresDiscoveryContext: true,
  },
  {
    key: "therapist",
    label: "therapists and mental-wellness practices",
    match: /\b(?:therapists?|counselors?|mental health practices?)\b/i,
    searchTerms: ["therapist", "counselor", "mental wellness", "mental health"],
    requiresDiscoveryContext: true,
  },
  {
    key: "medical",
    label: "medical practices",
    match: /\b(?:ob[\/-]?gyn|gynecologists?|medical practices?|primary care practices?)\b/i,
    searchTerms: ["OB/GYN", "gynecologist", "medical practice", "primary care"],
    requiresDiscoveryContext: true,
  },
  {
    key: "travel_advisor",
    label: "travel advisors and tour services",
    match: /\b(?:travel agents?|travel advisors?|tour operators?|tour guides?)\b/i,
    searchTerms: ["travel advisor", "travel agent", "tour operator", "tour guide"],
  },
  {
    key: "gaming",
    label: "gaming and recreation",
    match: /\b(?:gaming|game caf[eé]s?|arcades?|board games?|virtual reality|vr experiences?)\b/i,
    searchTerms: ["gaming", "game cafe", "arcade", "board game", "virtual reality", "recreation"],
    priority: 10,
  },
  {
    key: "activity",
    label: "things to do",
    match: /\b(?:things to do|something to do|activities|places to go|local experiences|bookable experiences)\b/i,
    searchTerms: ["attractions", "arts", "entertainment", "gaming", "recreation", "gallery", "museum", "tour experience"],
  },
  {
    key: "museum",
    label: "museums and cultural centers",
    match: /\b(?:museums?|cultural centers?|archives?)\b/i,
    searchTerms: ["museum", "cultural center", "archive", "history"],
    requiresDiscoveryContext: true,
  },
  {
    key: "gallery",
    label: "art galleries",
    match: /\b(?:art galler(?:y|ies)|galler(?:y|ies)|art exhibits?)\b/i,
    searchTerms: ["art gallery", "gallery", "art exhibit", "visual arts"],
    requiresDiscoveryContext: true,
    priority: 10,
  },
  {
    key: "fragrance",
    label: "fragrance and scent experiences",
    match: /\b(?:fragrance|perfume|cologne|scent bars?)\b/i,
    searchTerms: ["fragrance", "perfume", "cologne", "scent"],
  },
  {
    key: "jewelry",
    label: "jewelry businesses",
    match: /\b(?:jewelers?|jewelry|jewellery)\b/i,
    searchTerms: ["jewelry", "jeweler", "accessories"],
  },
  {
    key: "fashion",
    label: "fashion and clothing businesses",
    match: /\b(?:fashion|clothing|apparel|boutiques?|lingerie|vintage shops?|thrift shops?)\b/i,
    searchTerms: ["fashion", "clothing", "apparel", "boutique", "lingerie", "vintage", "thrift"],
  },
  {
    key: "dessert",
    label: "bakeries and desserts",
    match: /\b(?:bakeries|bakery|desserts?|sweets?|chocolate shops?)\b/i,
    searchTerms: ["bakery", "dessert", "sweets", "chocolate"],
  },
] as const;

export function deriveBusinessSubject(message: string): NormalizedBusinessSubject | null {
  if (/\b(?:hair loss|alopecia|thinning hair|scalp (?:condition|pain|infection|disease))\b/i.test(message)) return null;
  const discoveryContext = /\b(?:find|looking for|need|recommend|where|near|in|book|appointment|shop|go|visit|local)\b/i.test(message);
  const subject = SUBJECTS
    .filter((candidate) => candidate.match.test(message) && (!candidate.requiresDiscoveryContext || discoveryContext))
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0];
  if (!subject) {
    const booksAsShoppingRequest = /\bbooks\b/i.test(message)
      && /\b(?:find|buy|shop|shopping|store|near|where)\b/i.test(message);
    if (!booksAsShoppingRequest) return null;
    const bookstore = SUBJECTS.find((candidate) => candidate.key === "bookstore")!;
    return {
      key: bookstore.key,
      label: bookstore.label,
      searchTerms: bookstore.searchTerms,
    };
  }
  return {
    key: subject.key,
    label: subject.label,
    searchTerms: subject.searchTerms,
  };
}

export function hasBusinessSubject(message: string): boolean {
  return deriveBusinessSubject(message) !== null;
}

export function businessSubjectSearchPatterns(subject: NormalizedBusinessSubject): string[] {
  return subject.searchTerms.map((term) => `%${term.toLowerCase()}%`);
}

export const BUSINESS_SUBJECTS = SUBJECTS.map(({ match: _match, requiresDiscoveryContext: _requiresDiscoveryContext, priority: _priority, ...subject }) => subject);
