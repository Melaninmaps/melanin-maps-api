import { findVibeKeysForSearch } from "@workspace/constants";

export type BusinessSubjectKey =
  | "bookstore"
  | "restaurant"
  | "cafe"
  | "barber"
  | "braider"
  | "childcare"
  | "senior_home_care"
  | "salon"
  | "grocery"
  | "laundromat"
  | "hotel"
  | "nightlife"
  | "hvac"
  | "plumbing"
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
  /** Optional explicit atmosphere keys derived from the current request only. */
  vibeKeys?: readonly string[];
  /** A current-turn dietary requirement that every returned card must document. */
  dietaryRequirement?: DietaryRequirement;
}>;

export type DietaryRequirement = Readonly<{
  key: "vegan";
  label: "vegan";
  searchTerms: readonly string[];
}>;

type SubjectDefinition = NormalizedBusinessSubject &
  Readonly<{
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
    searchTerms: ["bookstore", "book store", "bookshop", "bookseller"],
  },
  {
    key: "restaurant",
    label: "restaurants",
    match:
      /\b(?:restaurants?|dining|dinner|lunch|breakfast|food(?: spots?)?|cuisine|places to eat)\b/i,
    searchTerms: ["restaurant", "restaurants", "dining", "food", "cuisine"],
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
    key: "braider",
    label: "braiders and protective-style specialists",
    match:
      /\b(?:braiders?|braiding|box braids?|knotless braids?|feed[ -]?in braids?|cornrows?|protective styles?)\b/i,
    searchTerms: [
      "braider",
      "braiding",
      "braids",
      "protective styles",
      "natural hair",
    ],
    priority: 20,
  },
  {
    key: "childcare",
    label: "daycares and childcare programs",
    match:
      /\b(?:day ?cares?|child ?cares?|childcare|early learning|preschools?|infant care|before(?:-| and )after school)\b/i,
    searchTerms: [
      "daycare",
      "child care",
      "childcare",
      "early learning",
      "preschool",
      "infant care",
      "before after school",
    ],
    priority: 24,
  },
  {
    key: "senior_home_care",
    label: "senior support and home-care services",
    match:
      /\b(?:senior support|senior care|senior services?|home ?care|home health(?:care)?|in[ -]?home care|caregiv(?:er|ing)|personal assistance)\b/i,
    // These are governed service terms. Retrieval is limited to name, category,
    // subcategory, and administrator-managed specialties—not free-form notes or
    // generic tags—so a member asking for senior support is matched to a record
    // explicitly classified as that service.
    searchTerms: [
      "senior support",
      "senior care",
      "senior services",
      "home care",
      "home health",
      "home healthcare",
      "in home care",
      "caregiver",
      "caregiving",
      "personal assistance",
    ],
    priority: 24,
  },
  {
    key: "salon",
    label: "salons",
    match:
      /\b(?:hair|salons?|hair stylists?|hairdressers?|hair color|wash and style)\b/i,
    searchTerms: [
      "salon",
      "hair salon",
      "hair stylist",
      "hair color",
      "wash and style",
    ],
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
    match:
      /\b(?:night[ -]?life|bars?|clubs?|lounges?|late[ -]?night venues?)\b/i,
    searchTerms: ["nightlife", "bar", "club", "lounge", "late night"],
  },
  {
    key: "hvac",
    label: "HVAC services",
    match:
      /\b(?:hvac|heating and (?:air|cooling)|air conditioning|a\/c repair)\b/i,
    searchTerms: ["hvac", "heating", "air conditioning", "cooling"],
  },
  {
    key: "plumbing",
    label: "plumbing services",
    match:
      /\b(?:plumb(?:er|ers|ing)?|drain(?:age)? services?|pipe repair|water heater repair|sewer services?)\b/i,
    // These governed service terms are matched only against the listing name,
    // category, subcategory, or administrator-managed specialty. They prevent a
    // saved nightlife or other preference from being presented as a plumber.
    searchTerms: [
      "plumber",
      "plumbing",
      "plumbing service",
      "drain service",
      "pipe repair",
      "water heater repair",
      "sewer service",
    ],
    priority: 24,
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
    match:
      /\b(?:locs?|dreadlocks?|protective styles?|braids?|natural[ -]?hair)\b/i,
    searchTerms: [
      "locs",
      "loc maintenance",
      "natural hair",
      "protective styles",
      "braids",
    ],
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
    match:
      /\b(?:wellness (?:businesses?|centers?|shops?)|apothecar(?:y|ies)|holistic wellness)\b/i,
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
    match:
      /\b(?:ob[\/-]?gyn|gynecologists?|medical practices?|primary care practices?)\b/i,
    searchTerms: ["OB/GYN", "gynecologist", "medical practice", "primary care"],
    requiresDiscoveryContext: true,
  },
  {
    key: "travel_advisor",
    label: "travel advisors and tour services",
    match:
      /\b(?:travel agents?|travel advisors?|tour operators?|tour guides?)\b/i,
    searchTerms: [
      "travel advisor",
      "travel agent",
      "tour operator",
      "tour guide",
    ],
  },
  {
    key: "gaming",
    label: "gaming and recreation",
    match:
      /\b(?:gaming|game caf[eé]s?|arcades?|board games?|virtual reality|vr experiences?)\b/i,
    searchTerms: [
      "gaming",
      "game cafe",
      "arcade",
      "board game",
      "virtual reality",
      "recreation",
    ],
    priority: 10,
  },
  {
    key: "activity",
    label: "things to do",
    match:
      /\b(?:things to do|something to do|activities|places to go|local experiences|bookable experiences)\b/i,
    searchTerms: [
      "attractions",
      "arts",
      "entertainment",
      "gaming",
      "recreation",
      "gallery",
      "museum",
      "tour experience",
    ],
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
    match:
      /\b(?:fashion|wardrobe|personal styl(?:ists?|ing)|product styl(?:ists?|ing)|clothing|apparel|boutiques?|lingerie|vintage shops?|thrift shops?)\b/i,
    searchTerms: [
      "fashion",
      "wardrobe stylist",
      "personal stylist",
      "personal styling",
      "product stylist",
      "clothing",
      "apparel",
      "boutique",
      "lingerie",
      "vintage",
      "thrift",
    ],
  },
  {
    key: "dessert",
    label: "bakeries and desserts",
    match: /\b(?:bakeries|bakery|desserts?|sweets?|chocolate shops?)\b/i,
    searchTerms: ["bakery", "dessert", "sweets", "chocolate"],
  },
] as const;

const VEGAN_REQUIREMENT: DietaryRequirement = {
  key: "vegan",
  label: "vegan",
  // Vegetarian is intentionally excluded. A vegetarian listing is not evidence
  // that it offers vegan food, drinks, or accommodations.
  searchTerms: ["vegan", "plant based", "plant-based"],
};

export function deriveDietaryRequirement(
  message: string,
): DietaryRequirement | undefined {
  return /\b(?:vegan|plant[ -]?based)\b/i.test(message)
    ? VEGAN_REQUIREMENT
    : undefined;
}

export function deriveBusinessSubject(
  message: string,
): NormalizedBusinessSubject | null {
  if (
    /\b(?:hair loss|alopecia|thinning hair|scalp (?:condition|pain|infection|disease))\b/i.test(
      message,
    )
  )
    return null;
  const discoveryContext =
    /\b(?:find|looking for|need|recommend|where|near|in|book|appointment|shop|go|visit|local)\b/i.test(
      message,
    );
  const subject = SUBJECTS.filter(
    (candidate) =>
      candidate.match.test(message) &&
      (!candidate.requiresDiscoveryContext || discoveryContext),
  ).sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0];
  if (!subject) {
    const bareStylistDiscovery =
      discoveryContext &&
      /\bstylists?\b/i.test(message) &&
      !/\b(?:fashion|wardrobe|clothing|apparel|editorial|photos?|photography|photo\s+shoots?|products?|personal styl(?:ists?|ing))\b/i.test(
        message,
      ) &&
      !/\b(?:what does|what is|how (?:do|can|should) I|career|training|school|become|recommends? this|said this)\b/i.test(
        message,
      );
    if (bareStylistDiscovery) {
      const salon = SUBJECTS.find((candidate) => candidate.key === "salon")!;
      return {
        key: salon.key,
        label: salon.label,
        searchTerms: salon.searchTerms,
        vibeKeys: findVibeKeysForSearch(message),
        dietaryRequirement: deriveDietaryRequirement(message),
      };
    }
    const booksAsShoppingRequest =
      /\bbooks\b/i.test(message) &&
      /\b(?:find|buy|shop|shopping|store|near|where)\b/i.test(message);
    if (!booksAsShoppingRequest) return null;
    const bookstore = SUBJECTS.find(
      (candidate) => candidate.key === "bookstore",
    )!;
    return {
      key: bookstore.key,
      label: bookstore.label,
      searchTerms: bookstore.searchTerms,
      vibeKeys: findVibeKeysForSearch(message),
      dietaryRequirement: deriveDietaryRequirement(message),
    };
  }
  return {
    key: subject.key,
    label: subject.label,
    searchTerms: subject.searchTerms,
    vibeKeys: findVibeKeysForSearch(message),
    dietaryRequirement: deriveDietaryRequirement(message),
  };
}

export function hasBusinessSubject(message: string): boolean {
  return deriveBusinessSubject(message) !== null;
}

/**
 * Business cards are permitted only when the stored service classification is a
 * direct match for the member's current request. Profile preferences may rank
 * those matching cards, but they can never substitute an unrelated service.
 */
export function matchesStructuredBusinessSubject(
  business: Readonly<{
    name?: string | null;
    category?: string | null;
    subcategory?: string | null;
    description?: string | null;
    tags?: readonly string[] | null;
    specialties?: readonly string[] | null;
  }>,
  subject: NormalizedBusinessSubject,
): boolean {
  const structured = [
    business.name ?? "",
    business.category ?? "",
    business.subcategory ?? "",
    ...(business.specialties ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!structured) return false;

  if (
    subject.key === "hvac" &&
    /\b(?:auto|automotive|car|vehicle)\b/.test(structured) &&
    !/\b(?:hvac|heating|furnace|heat pump)\b/.test(structured)
  ) {
    return false;
  }

  const matchesService = subject.searchTerms.some((term) => {
    const phrase = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return Boolean(phrase) && ` ${structured} `.includes(` ${phrase} `);
  });
  return (
    matchesService &&
    (!subject.dietaryRequirement ||
      matchesDocumentedDietaryRequirement(business, subject.dietaryRequirement))
  );
}

/**
 * Dietary requests are hard constraints. Only direct published listing metadata
 * can satisfy them; saved preferences and generic cuisine cards cannot.
 */
export function matchesDocumentedDietaryRequirement(
  business: Readonly<{
    name?: string | null;
    category?: string | null;
    subcategory?: string | null;
    description?: string | null;
    tags?: readonly string[] | null;
    specialties?: readonly string[] | null;
  }>,
  requirement: DietaryRequirement,
): boolean {
  const evidence = [
    business.name ?? "",
    business.category ?? "",
    business.subcategory ?? "",
    business.description ?? "",
    ...(business.tags ?? []),
    ...(business.specialties ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!evidence) return false;
  if (/\b(?:not|non)\s+vegan\b/.test(evidence)) return false;
  return requirement.searchTerms.some((term) => {
    const phrase = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return Boolean(phrase) && ` ${evidence} `.includes(` ${phrase} `);
  });
}

function searchTermPatterns(searchTerms: readonly string[]): string[] {
  return searchTerms
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
    .map(
      (term) =>
        `\\m${term
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/[\s-]+/g, "[[:space:]-]+")}\\M`,
    );
}

export function businessSubjectSearchPatterns(
  subject: NormalizedBusinessSubject,
): string[] {
  // PostgreSQL regex patterns with word boundaries. These are used only for
  // governed directory fields, never arbitrary descriptive copy, so "books
  // fast" does not qualify a restaurant as a bookstore while "bookstore-cafe"
  // remains an explicit match.
  return searchTermPatterns(subject.searchTerms);
}

export function dietaryRequirementSearchPatterns(
  requirement: DietaryRequirement,
): string[] {
  return searchTermPatterns(requirement.searchTerms);
}

export const BUSINESS_SUBJECTS = SUBJECTS.map(
  ({
    match: _match,
    requiresDiscoveryContext: _requiresDiscoveryContext,
    priority: _priority,
    ...subject
  }) => subject,
);
