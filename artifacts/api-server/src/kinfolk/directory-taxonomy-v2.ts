import type { BusinessSubjectKey, NormalizedBusinessSubject } from "./business-subject";

/**
 * V2 allows an imported source's explicit service tag to satisfy a service
 * search only when all gates are true: the member requested that service, the
 * business retains its documentary source receipt, and this feature flag is
 * explicitly enabled. It is never an ownership inference or a free-text scan.
 */
export function isDirectoryTaxonomyV2Enabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.DIRECTORY_TAXONOMY_V2 === "true";
}

export type DirectoryVertical =
  | "food_and_beverage"
  | "retail"
  | "beauty_and_personal_care"
  | "health_and_wellness"
  | "community_and_care"
  | "home_and_trades"
  | "arts_culture_and_entertainment"
  | "lodging_and_experiences"
  | "automotive"
  | "professional_services";

export type DirectoryTaxonomyService = Readonly<{
  subjectKey: BusinessSubjectKey;
  vertical: DirectoryVertical;
  facet: string;
  label: string;
}>;

/**
 * A complete service vocabulary catalog. Activation is not a claim of complete
 * city coverage: when an enabled city has no source-backed documented match,
 * Kinfolk returns a clean no-match rather than guessing or substituting.
 */
export const DIRECTORY_TAXONOMY_V2: readonly DirectoryTaxonomyService[] = [
  { subjectKey: "restaurant", vertical: "food_and_beverage", facet: "restaurant", label: "Restaurants" },
  { subjectKey: "cafe", vertical: "food_and_beverage", facet: "coffee_shop", label: "Coffee shops and cafés" },
  { subjectKey: "dessert", vertical: "food_and_beverage", facet: "bakery_and_dessert", label: "Bakeries and desserts" },
  { subjectKey: "grocery", vertical: "food_and_beverage", facet: "grocery", label: "Grocery and markets" },
  { subjectKey: "bookstore", vertical: "retail", facet: "bookstore", label: "Bookstores" },
  { subjectKey: "fashion", vertical: "retail", facet: "apparel", label: "Apparel and boutiques" },
  { subjectKey: "jewelry", vertical: "retail", facet: "jewelry", label: "Jewelry" },
  { subjectKey: "fragrance", vertical: "retail", facet: "fragrance", label: "Fragrance and scent" },
  { subjectKey: "barber", vertical: "beauty_and_personal_care", facet: "barber", label: "Barbershops" },
  { subjectKey: "salon", vertical: "beauty_and_personal_care", facet: "hair_salon", label: "Hair salons" },
  { subjectKey: "braider", vertical: "beauty_and_personal_care", facet: "braiding", label: "Braiding" },
  { subjectKey: "locs", vertical: "beauty_and_personal_care", facet: "natural_hair", label: "Natural hair and loc care" },
  { subjectKey: "spa", vertical: "beauty_and_personal_care", facet: "spa", label: "Spas" },
  { subjectKey: "waxing", vertical: "beauty_and_personal_care", facet: "waxing_and_brows", label: "Waxing and brow services" },
  { subjectKey: "wellness", vertical: "health_and_wellness", facet: "wellness", label: "Wellness" },
  { subjectKey: "fitness", vertical: "health_and_wellness", facet: "fitness", label: "Fitness" },
  { subjectKey: "therapist", vertical: "health_and_wellness", facet: "therapy", label: "Therapy and mental wellness" },
  { subjectKey: "medical", vertical: "health_and_wellness", facet: "medical_practice", label: "Medical practices" },
  { subjectKey: "childcare", vertical: "community_and_care", facet: "childcare", label: "Childcare" },
  { subjectKey: "senior_home_care", vertical: "community_and_care", facet: "senior_and_home_care", label: "Senior and home care" },
  { subjectKey: "plumbing", vertical: "home_and_trades", facet: "plumbing", label: "Plumbing" },
  { subjectKey: "hvac", vertical: "home_and_trades", facet: "hvac", label: "HVAC" },
  { subjectKey: "laundromat", vertical: "home_and_trades", facet: "laundry", label: "Laundry" },
  { subjectKey: "nightlife", vertical: "arts_culture_and_entertainment", facet: "nightlife", label: "Nightlife" },
  { subjectKey: "gaming", vertical: "arts_culture_and_entertainment", facet: "gaming", label: "Gaming and recreation" },
  { subjectKey: "activity", vertical: "arts_culture_and_entertainment", facet: "attractions", label: "Attractions and activities" },
  { subjectKey: "museum", vertical: "arts_culture_and_entertainment", facet: "museum_and_culture", label: "Museums and culture" },
  { subjectKey: "gallery", vertical: "arts_culture_and_entertainment", facet: "art_gallery", label: "Art galleries" },
  { subjectKey: "hotel", vertical: "lodging_and_experiences", facet: "hotel", label: "Hotels" },
  { subjectKey: "travel_advisor", vertical: "professional_services", facet: "travel_advisor", label: "Travel advisors and tours" },
  { subjectKey: "auto_repair", vertical: "automotive", facet: "auto_repair", label: "Auto repair" },
] as const;

export function directoryTaxonomyServiceForSubject(
  subject: Pick<NormalizedBusinessSubject, "key">,
): DirectoryTaxonomyService | null {
  return DIRECTORY_TAXONOMY_V2.find((service) => service.subjectKey === subject.key) ?? null;
}

export function mayUseSourceBackedTagEvidence(input: Readonly<{
  subject: Pick<NormalizedBusinessSubject, "key">;
  strictOwnershipEvidence: boolean;
  environment?: NodeJS.ProcessEnv;
}>): boolean {
  return input.strictOwnershipEvidence
    && Boolean(directoryTaxonomyServiceForSubject(input.subject))
    && isDirectoryTaxonomyV2Enabled(input.environment);
}

export function matchesDocumentedSourceTaxonomyTag(
  business: Readonly<{
    researchSourceUrl?: string | null;
    tags?: readonly string[] | null;
  }>,
  subject: Pick<NormalizedBusinessSubject, "searchTerms">,
): boolean {
  if (!business.researchSourceUrl?.startsWith("https://")) return false;
  const normalizedTags = (business.tags ?? []).map((tag) =>
    tag.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
  );
  return subject.searchTerms.some((term) => {
    const phrase = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return Boolean(phrase) && normalizedTags.some(
      (tag) => tag === phrase || tag === `${phrase}s` || phrase === `${tag}s`,
    );
  });
}
