/**
 * Versioned, browser-safe normalization contract for public business discovery.
 *
 * Bump this version whenever aliases or canonical intents change so clients can
 * identify the vocabulary used to build a discovery request.
 */
export const BUSINESS_SEARCH_NORMALIZATION_VERSION = 1 as const;

export const RESTAURANT_CAPABLE_FOOD_INTENT = "food-and-restaurants" as const;

/** Fold labels the same way the repository folds category/subcategory values. */
export function foldBusinessSearchLabel(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const RESTAURANT_CAPABLE_FOOD_ALIASES = [
  "Food",
  "Food & Drink",
  "Restaurant",
  "Restaurants",
] as const;

const RESTAURANT_CAPABLE_FOOD_ALIAS_KEYS = Object.freeze(
  RESTAURANT_CAPABLE_FOOD_ALIASES.map(foldBusinessSearchLabel),
);

/** Return the stable canonical intent represented by a UI or stored label. */
export function normalizeBusinessCategoryIntent(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const folded = foldBusinessSearchLabel(value);
  return RESTAURANT_CAPABLE_FOOD_ALIAS_KEYS.includes(folded)
    ? RESTAURANT_CAPABLE_FOOD_INTENT
    : folded;
}

/**
 * Return folded stored-value aliases accepted for a category/search intent.
 * Generic labels retain their single folded value; food/restaurant labels share
 * one deliberately narrow alias family.
 */
export function getBusinessCategorySearchAliases(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return normalizeBusinessCategoryIntent(value) === RESTAURANT_CAPABLE_FOOD_INTENT
    ? [...RESTAURANT_CAPABLE_FOOD_ALIAS_KEYS]
    : [foldBusinessSearchLabel(value)];
}

/** Pure matcher used by fixtures and non-SQL discovery implementations. */
export function matchesBusinessCategoryIntent(
  requested: string | null | undefined,
  category: string | null | undefined,
  subcategory: string | null | undefined,
): boolean {
  if (!requested?.trim()) return true;
  const aliases = getBusinessCategorySearchAliases(requested);
  return [category, subcategory]
    .filter((value): value is string => Boolean(value))
    .map(foldBusinessSearchLabel)
    .some((value) => aliases.includes(value));
}
