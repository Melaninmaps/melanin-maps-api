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
  | "dessert"
  /** Exact, uncommon service phrase; never a broad category or silent substitute. */
  | "general_business";

/** Food timing is a current-turn service need, not a saved preference. */
export type FoodIntent = "dining_now" | "dining_later" | "takeout_or_delivery" | "event_catering" | "private_chef";

export type NormalizedBusinessSubject = Readonly<{
  key: BusinessSubjectKey;
  label: string;
  searchTerms: readonly string[];
  /** Optional explicit atmosphere keys derived from the current request only. */
  vibeKeys?: readonly string[];
  /** A current-turn dietary requirement that every returned card must document. */
  dietaryRequirement?: DietaryRequirement;
  /** A current-turn service detail that every returned card must document. */
  documentedServiceRequirement?: DocumentedServiceRequirement;
  /** Current-turn street or amenity cues that must be documented on the listing. */
  contextualEvidenceTerms?: readonly string[];
  /** Prevents a caterer-only record from being offered as dinner tonight. */
  foodIntent?: FoodIntent;
}>;

export type DietaryRequirement = Readonly<{
  key: "vegan";
  label: "vegan";
  searchTerms: readonly string[];
}>;

export type DocumentedServiceRequirement = Readonly<{
  label: string;
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
      /\b(?:hair|salons?|hair stylists?|hairdressers?|hair color|wash and style|wigs?|bundles?|extensions?)\b/i,
    searchTerms: [
      "salon",
      "hair salon",
      "hair stylist",
      "hair color",
      "wash and style",
      "wig",
      "bundle",
      "hair extension",
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
    match: /\b(?:auto[- ]?repair|car[- ]?repair|mechanics?|automotive service)\b/i,
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

const WASHING_SERVICE_REQUIREMENT: DocumentedServiceRequirement = {
  label: "washing service included",
  searchTerms: [
    "full wash and detangle",
    "wash and detangle",
    "washing and detangling",
    "wash and braid",
    "wash and braiding",
    "wash and style",
  ],
};

// Wigs and bundles are not interchangeable with a generic salon listing. The
// member's current-turn wording is a hard published-service requirement, so a
// general stylist cannot be substituted for documented installation work.
const WIG_INSTALLATION_SERVICE_REQUIREMENT: DocumentedServiceRequirement = {
  label: "wig installation",
  searchTerms: [
    "wig installation",
    "wig install",
    "wig installs",
    "wigs",
  ],
};

const BUNDLE_INSTALLATION_SERVICE_REQUIREMENT: DocumentedServiceRequirement = {
  label: "bundle or extension installation",
  searchTerms: [
    "bundle installation",
    "bundle install",
    "bundle installs",
    "hair extension",
    "hair extensions",
    "extension installation",
    "extension install",
  ],
};

/**
 * A cuisine is a current-turn capability, not a generic restaurant category.
 * “Ethiopian food” must therefore match documented published business data;
 * a general restaurant must not be surfaced merely because it is nearby.
 */
const ETHIOPIAN_CUISINE_REQUIREMENT: DocumentedServiceRequirement = {
  label: "Ethiopian",
  searchTerms: ["ethiopian"],
};

const AMENITY_EVIDENCE_TERMS = [
  "coffee",
  "tea",
  "outdoor seating",
  "parking",
  "delivery",
  "wheelchair accessible",
] as const;

function normalizeEvidenceTerm(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Extract only a small, documented set of location/amenity cues from the
 * current turn. These are hard result constraints, not inferred preferences:
 * “bookstore on Germantown Avenue that sells coffee” must have both pieces of
 * evidence in the published business record before Kinfolk presents its card.
 */
export function deriveContextualBusinessEvidenceTerms(
  message: string,
): readonly string[] {
  const terms = new Set<string>();
  const streetSuffix = "avenue|ave\\.?|street|st\\.?|road|rd\\.?|boulevard|blvd\\.?|drive|dr\\.?|lane|ln\\.?|place|pl\\.?|court|ct\\.?|way|pike";
  // “Place” is a valid street suffix only when the member deliberately uses a
  // street preposition. In a free-form fallback it commonly appears in phrases
  // such as “dinner place,” which must never become a hard directory constraint.
  const fallbackStreetSuffix = "avenue|ave\\.?|street|st\\.?|road|rd\\.?|boulevard|blvd\\.?|drive|dr\\.?|lane|ln\\.?|court|ct\\.?|way|pike";
  // Prefer a deliberate location preposition so “the bookstore in Philadelphia
  // on Germantown Avenue” extracts only the street, not the preceding request.
  const explicitStreetPattern = new RegExp(
    `\\b(?:on|at|near|along)\\s+([A-Za-z][A-Za-z0-9.'-]*(?:\\s+[A-Za-z][A-Za-z0-9.'-]*){0,3}\\s+(?:${streetSuffix}))\\b`,
    "gi",
  );
  const fallbackStreetPattern = new RegExp(
    `\\b([A-Za-z][A-Za-z0-9.'-]*(?:\\s+[A-Za-z][A-Za-z0-9.'-]*){0,1}\\s+(?:${fallbackStreetSuffix}))\\b`,
    "gi",
  );
  const streetMatches = [...message.matchAll(explicitStreetPattern)];
  for (const match of streetMatches.length ? streetMatches : message.matchAll(fallbackStreetPattern)) {
    const normalized = normalizeEvidenceTerm(match[1] ?? "");
    if (normalized) terms.add(normalized);
  }
  for (const term of AMENITY_EVIDENCE_TERMS) {
    const normalized = normalizeEvidenceTerm(term);
    if (new RegExp(`(^|[^a-z0-9])${normalized.replace(/ /g, "\\s+")}([^a-z0-9]|$)`, "i").test(message)) {
      terms.add(normalized);
    }
  }
  return [...terms].slice(0, 4);
}

export function deriveDietaryRequirement(
  message: string,
): DietaryRequirement | undefined {
  return /\b(?:vegan|plant[ -]?based)\b/i.test(message)
    ? VEGAN_REQUIREMENT
    : undefined;
}

function quotedServiceRequirement(
  message: string,
): DocumentedServiceRequirement | undefined {
  // Quotes deliberately turn a member's test/search phrase into a literal
  // published-evidence requirement. Bound the phrase to avoid a broad scan.
  const match = /["“]([^"”]{3,100})["”]/.exec(message);
  const phrase = match?.[1]?.replace(/\s+/g, " ").trim();
  return phrase ? { label: phrase, searchTerms: [phrase] } : undefined;
}

export function deriveDocumentedServiceRequirement(
  message: string,
): DocumentedServiceRequirement | undefined {
  const quoted = quotedServiceRequirement(message);
  if (quoted) return quoted;
  if (/\bethiopian\b/i.test(message)) return ETHIOPIAN_CUISINE_REQUIREMENT;
  if (/\b(?:wig(?:s)?|wig[ -]?install(?:ation|s)?)\b/i.test(message)) {
    return WIG_INSTALLATION_SERVICE_REQUIREMENT;
  }
  if (/\b(?:bundles?|hair[ -]?extensions?|extension[ -]?install(?:ation|s)?)\b/i.test(message)) {
    return BUNDLE_INSTALLATION_SERVICE_REQUIREMENT;
  }
  return /\b(?:full\s+wash\s+and\s+detangle|wash\s+and\s+detangle|washing\s+and\s+detangling|wash\s+and\s+braid(?:ing)?|wash\s+and\s+style)\b/i.test(
    message,
  )
    ? WASHING_SERVICE_REQUIREMENT
    : undefined;
}

export function deriveFoodIntent(message: string): FoodIntent | undefined {
  if (/\b(?:cater(?:er|ing)?|feeding\s+\d+|event|wedding|reception|corporate\s+lunch)\b/i.test(message)) return "event_catering";
  if (/\bprivate\s+chef\b/i.test(message)) return "private_chef";
  if (/\b(?:delivery|deliver|take[ -]?out|pick[ -]?up)\b/i.test(message)) return "takeout_or_delivery";
  if (/\b(?:dinner|lunch|breakfast|brunch)\s+(?:tonight|now)\b|\b(?:where|what).{0,32}\b(?:eat|dine)\s+now\b/i.test(message)) return "dining_now";
  if (/\b(?:dinner|lunch|breakfast|brunch)\b/i.test(message)) return "dining_later";
  return undefined;
}

/**
 * Preserve an uncommon, explicitly requested local service as its own exact
 * governed subject rather than letting it fall through to model prose. This is
 * intentionally narrow: generic "business/place" wording remains a request
 * for clarification, and the phrase must be a direct search target.
 */
function deriveExactUnmappedBusinessSubject(
  message: string,
): NormalizedBusinessSubject | null {
  const match = /\b(?:find|locate|recommend|search\s+for|where\s+can\s+i\s+(?:find|go|get))\s+(?:me\s+)?(?:(?:a|an|the|some)\s+)?(?:(?:black|african[- ]american|minority|women|woman|veteran|immigrant|lgbtq|indigenous|latino|disability|family)[- ]owned\s+)?([A-Za-z][A-Za-z0-9/'-]*(?:\s+[A-Za-z][A-Za-z0-9/'-]*){0,7}?)(?=\s+(?:in|near|around|at)\s+[A-Za-z]|[?.!,]|$)/i.exec(message);
  const phrase = match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (
    phrase.length < 4 ||
    /^(?:business(?:es)?|place(?:s)?|option(?:s)?|something)$/i.test(phrase)
  ) {
    return null;
  }
  return {
    key: "general_business",
    label: phrase,
    // The exact requested phrase is a hard structured-listing predicate. It
    // cannot become a nearby, preference-ranked, or model-invented substitute.
    searchTerms: [phrase],
    vibeKeys: findVibeKeysForSearch(message),
    contextualEvidenceTerms: deriveContextualBusinessEvidenceTerms(message),
  };
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
        documentedServiceRequirement: deriveDocumentedServiceRequirement(message),
        contextualEvidenceTerms: deriveContextualBusinessEvidenceTerms(message),
    foodIntent: deriveFoodIntent(message),
      };
    }
    const booksAsShoppingRequest =
      /\bbooks\b/i.test(message) &&
      /\b(?:find|buy|shop|shopping|store|near|where)\b/i.test(message);
    if (!booksAsShoppingRequest) return deriveExactUnmappedBusinessSubject(message);
    const bookstore = SUBJECTS.find(
      (candidate) => candidate.key === "bookstore",
    )!;
    return {
      key: bookstore.key,
      label: bookstore.label,
      searchTerms: bookstore.searchTerms,
      vibeKeys: findVibeKeysForSearch(message),
      dietaryRequirement: deriveDietaryRequirement(message),
      documentedServiceRequirement: deriveDocumentedServiceRequirement(message),
      contextualEvidenceTerms: deriveContextualBusinessEvidenceTerms(message),
    foodIntent: deriveFoodIntent(message),
    };
  }
  return {
    key: subject.key,
    label: subject.label,
    searchTerms: subject.searchTerms,
    vibeKeys: findVibeKeysForSearch(message),
    dietaryRequirement: deriveDietaryRequirement(message),
    documentedServiceRequirement: deriveDocumentedServiceRequirement(message),
    contextualEvidenceTerms: deriveContextualBusinessEvidenceTerms(message),
    foodIntent: deriveFoodIntent(message),
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

/**
 * A documented service detail can refine a known business category, but cannot
 * independently qualify a listing. This keeps a salon search specific without
 * treating incidental description text as a standalone service taxonomy.
 */
export function matchesDocumentedServiceRequirement(
  business: Readonly<{
    name?: string | null;
    category?: string | null;
    subcategory?: string | null;
    description?: string | null;
    tags?: readonly string[] | null;
    specialties?: readonly string[] | null;
  }>,
  requirement: DocumentedServiceRequirement,
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
  return requirement.searchTerms.some((term) => {
    const phrase = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return Boolean(phrase) && ` ${evidence} `.includes(` ${phrase} `);
  });
}

/**
 * A member can add a street or amenity cue to a category search. The cue must
 * be present in published listing data; it never classifies a business on its
 * own and it never searches private, unreviewed information.
 */
export function matchesDocumentedContextualEvidence(
  business: Readonly<{
    name?: string | null;
    category?: string | null;
    subcategory?: string | null;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    stateCode?: string | null;
    tags?: readonly string[] | null;
    specialties?: readonly string[] | null;
  }>,
  evidenceTerms: readonly string[] | undefined,
): boolean {
  if (!evidenceTerms?.length) return true;
  const evidence = [
    business.name ?? "",
    business.category ?? "",
    business.subcategory ?? "",
    business.description ?? "",
    business.address ?? "",
    business.city ?? "",
    business.stateCode ?? "",
    ...(business.tags ?? []),
    ...(business.specialties ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return evidenceTerms.every((term) => {
    const phrase = normalizeEvidenceTerm(term);
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

export function documentedServiceRequirementSearchPatterns(
  requirement: DocumentedServiceRequirement,
): string[] {
  return searchTermPatterns(requirement.searchTerms);
}

export function contextualEvidenceSearchPatterns(
  evidenceTerms: readonly string[] | undefined,
): string[] {
  return searchTermPatterns(evidenceTerms ?? []);
}

export const BUSINESS_SUBJECTS = SUBJECTS.map(
  ({
    match: _match,
    requiresDiscoveryContext: _requiresDiscoveryContext,
    priority: _priority,
    ...subject
  }) => subject,
);
