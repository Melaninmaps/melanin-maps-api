import { FOUNDER_TAXONOMY_CONTRACT } from "./founder-taxonomy-vibesnow";

/**
 * Mapping With Melanin™ — Master Business Category Taxonomy
 *
 * Values are derived from the versioned, founder-controlled VIBESNOW contract.
 * All UI clients and API validation must import this module rather than maintain
 * their own category or subcategory lists.
 */
export interface BusinessCategory {
  /** Stable URL-safe identifier retained for existing clients and links. */
  id: string;
  /** Founder-approved display name. */
  name: string;
  /** Founder-approved subcategories for this category only. */
  subcategories: string[];
}

export const BUSINESS_CATEGORY_TAXONOMY: BusinessCategory[] = FOUNDER_TAXONOMY_CONTRACT.map(
  ({ id, category, subcategories }) => ({
    id,
    name: category,
    subcategories: [...subcategories],
  }),
);

/** Flat list of founder-approved main category names for new records and dropdowns. */
export const MAIN_CATEGORY_NAMES: string[] = BUSINESS_CATEGORY_TAXONOMY.map((category) => category.name);

/** Map of main category name to its founder-approved dependent subcategory list. */
export const SUBCATEGORY_MAP: Record<string, string[]> = Object.fromEntries(
  BUSINESS_CATEGORY_TAXONOMY.map((category) => [category.name, category.subcategories]),
);

/** Flat list of every approved subcategory; use pair validation for writes. */
export const ALL_SUBCATEGORY_NAMES: string[] = BUSINESS_CATEGORY_TAXONOMY.flatMap(
  (category) => category.subcategories,
);

export function getBusinessCategory(category: string | null | undefined): BusinessCategory | undefined {
  const normalized = category?.trim();
  return normalized
    ? BUSINESS_CATEGORY_TAXONOMY.find((entry) => entry.name === normalized)
    : undefined;
}

export function isCanonicalBusinessCategory(category: string | null | undefined): boolean {
  return Boolean(getBusinessCategory(category));
}

/**
 * Returns true only when a non-empty subcategory belongs to the supplied
 * founder-approved category. This never infers or rewrites a classification.
 */
export function isCanonicalSubcategoryForCategory(
  category: string | null | undefined,
  subcategory: string | null | undefined,
): boolean {
  const normalizedSubcategory = subcategory?.trim();
  const definition = getBusinessCategory(category);
  return Boolean(
    normalizedSubcategory
      && definition?.subcategories.includes(normalizedSubcategory),
  );
}

/**
 * Legacy category names from before the founder-controlled taxonomy was
 * introduced. These remain readable and accepted on existing records so no
 * business is hidden, deleted, or silently reclassified before a reviewed
 * migration is separately authorized. New submissions use MAIN_CATEGORY_NAMES.
 */
export const LEGACY_CATEGORY_NAMES: string[] = [
  "Food & Beverage",
  "Shopping & Retail",
  "Home & Real Estate",
  "Home Improvement",
  "Automotive",
  "Technology",
  "Creative Services",
  "Events & Entertainment",
  "Family & Education",
  "Pet Services",
  "Community & Nonprofits",
  "Government & Public Resources",
  "Online & Mobile Businesses",
  "Home Services",
  "Real Estate & Housing",
  "Community & Nonprofit",
  "Restaurant & Food",
  "Retail & Shopping",
  "Education & Coaching",
  "Arts & Culture",
  "Restaurants & Nightlife",
  "Hotels & Stays",
  "Cultural Landmarks",
  "Beauty & Wellness",
  "Health & Fitness",
  "Beauty & Grooming",
  "Arts & Entertainment",
  "Education & Childcare",
  "Community Events",
  "Black Professionals",
];

/** Full readable set: founder-approved categories plus legacy stored values. */
export const ALL_VALID_CATEGORY_NAMES: string[] = [
  ...MAIN_CATEGORY_NAMES,
  ...LEGACY_CATEGORY_NAMES,
];
