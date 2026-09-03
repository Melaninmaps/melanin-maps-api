export type BusinessSubjectKey =
  | "bookstore"
  | "restaurant"
  | "cafe"
  | "barber"
  | "salon"
  | "grocery"
  | "laundromat"
  | "hotel"
  | "nightlife";

export type NormalizedBusinessSubject = Readonly<{
  key: BusinessSubjectKey;
  label: string;
  searchTerms: readonly string[];
}>;

type SubjectDefinition = NormalizedBusinessSubject & Readonly<{
  match: RegExp;
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
    match: /\b(?:salons?|hair stylists?|natural hair)\b/i,
    searchTerms: ["salon", "hair salon", "hair stylist", "natural hair"],
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
] as const;

export function deriveBusinessSubject(message: string): NormalizedBusinessSubject | null {
  const subject = SUBJECTS.find((candidate) => candidate.match.test(message));
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

export const BUSINESS_SUBJECTS = SUBJECTS.map(({ match: _match, ...subject }) => subject);
