import { pool } from "@workspace/db";

export const ACCESSIBILITY_REQUIREMENTS = [
  "wheelchair_accessible",
  "service_animals",
  "sensory_friendly",
] as const;

export type AccessibilityRequirement = (typeof ACCESSIBILITY_REQUIREMENTS)[number];
export type MaximumPrice = "any" | "$" | "$$" | "$$$" | "$$$$";
export type CrowdPreference = "any" | "quiet_or_low_sensory";
export type AgePreference = "member_default" | "all_ages";

/**
 * These are member-entered hard requirements. They are not derived from chat,
 * memory, location, identity, or behaviour. A missing public field fails closed
 * whenever the corresponding requirement is active.
 */
export type InterestDiscoveryConstraints = {
  crowdPreference: CrowdPreference;
  accessibilityRequirements: AccessibilityRequirement[];
  maximumPrice: MaximumPrice;
  agePreference: AgePreference;
  excludedCategories: string[];
};

export const DEFAULT_INTEREST_DISCOVERY_CONSTRAINTS: InterestDiscoveryConstraints = {
  crowdPreference: "any",
  accessibilityRequirements: [],
  maximumPrice: "any",
  agePreference: "member_default",
  excludedCategories: [],
};

export function normalizeExcludedCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " "))
    .filter((item) => item.length >= 2 && item.length <= 80)
    .slice(0, 12))];
}

export function isAccessibilityRequirement(value: unknown): value is AccessibilityRequirement {
  return typeof value === "string" && (ACCESSIBILITY_REQUIREMENTS as readonly string[]).includes(value);
}

export function isMaximumPrice(value: unknown): value is MaximumPrice {
  return typeof value === "string" && ["any", "$", "$$", "$$$", "$$$$"].includes(value);
}

export function isCrowdPreference(value: unknown): value is CrowdPreference {
  return value === "any" || value === "quiet_or_low_sensory";
}

export function isAgePreference(value: unknown): value is AgePreference {
  return value === "member_default" || value === "all_ages";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function normalizedWords(...values: unknown[]): string {
  return values
    .flatMap((value) => typeof value === "string" ? [value] : toStringArray(value))
    .join(" ")
    .toLocaleLowerCase("en-US")
    .replace(/[_-]/g, " ");
}

function priceLevel(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toLocaleLowerCase("en-US");
  if (normalized === "free") return 0;
  const dollarCount = (normalized.match(/\$/g) ?? []).length;
  return dollarCount >= 1 && dollarCount <= 4 ? dollarCount : null;
}

function meetsMaximumPrice(price: unknown, maximumPrice: MaximumPrice): boolean {
  if (maximumPrice === "any") return true;
  const value = priceLevel(price);
  return value !== null && value <= maximumPrice.length;
}

function categoryAllowed(category: unknown, excluded: readonly string[]): boolean {
  if (!excluded.length) return true;
  const normalized = typeof category === "string"
    ? category.toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim()
    : "";
  return !excluded.some((excludedCategory) => normalized === excludedCategory || normalized.includes(excludedCategory));
}

/** Only documented business attributes can satisfy a member's hard requirements. */
export function businessMeetsInterestDiscoveryConstraints(
  business: {
    category: unknown;
    price_range: unknown;
    audience_type: unknown;
    environment_tags: unknown;
    amenity_tags: unknown;
    accessibility_features: unknown;
  },
  constraints: InterestDiscoveryConstraints,
): boolean {
  if (!categoryAllowed(business.category, constraints.excludedCategories)) return false;
  if (!meetsMaximumPrice(business.price_range, constraints.maximumPrice)) return false;

  const documented = normalizedWords(
    business.environment_tags,
    business.amenity_tags,
    business.accessibility_features,
  );
  if (constraints.crowdPreference === "quiet_or_low_sensory" && !/\b(?:quiet|sensory[-_ ]friendly|low[-_ ]sensory)\b/.test(documented)) return false;
  if (constraints.accessibilityRequirements.some((requirement) => {
    if (requirement === "wheelchair_accessible") return !/\b(?:wheelchair|ada|step[-_ ]free|accessible)\b/.test(documented);
    if (requirement === "service_animals") return !/\bservice[-_ ]animals?\b/.test(documented);
    return !/\bsensory[-_ ]friendly\b/.test(documented);
  })) return false;

  if (constraints.agePreference === "all_ages") {
    const audience = typeof business.audience_type === "string" ? business.audience_type : "unknown";
    if (!['all_ages', 'family_friendly'].includes(audience)) return false;
  }
  return true;
}

/** Events with unknown price or audience never satisfy an active corresponding hard requirement. */
export function eventMeetsInterestDiscoveryConstraints(
  event: { category: unknown; price: unknown; audience_rating: unknown },
  constraints: InterestDiscoveryConstraints,
): boolean {
  if (!categoryAllowed(event.category, constraints.excludedCategories)) return false;
  if (!meetsMaximumPrice(event.price, constraints.maximumPrice)) return false;
  if (constraints.crowdPreference !== "any" || constraints.accessibilityRequirements.length > 0) return false;
  if (constraints.agePreference === "all_ages") {
    const audience = typeof event.audience_rating === "string" ? event.audience_rating.toLocaleLowerCase("en-US") : "unknown";
    if (!/^(?:everyone|all[_ -]?ages|family)/.test(audience)) return false;
  }
  return true;
}

export async function getInterestDiscoveryConstraints(userId: string): Promise<InterestDiscoveryConstraints> {
  const result = await pool.query<{
    crowd_preference: unknown;
    accessibility_requirements: unknown;
    maximum_price: unknown;
    age_preference: unknown;
    excluded_categories: unknown;
  }>(
    `SELECT crowd_preference, accessibility_requirements, maximum_price, age_preference, excluded_categories
       FROM kinfolk_interest_discovery_constraints
      WHERE user_id = $1
      LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return { ...DEFAULT_INTEREST_DISCOVERY_CONSTRAINTS };
  return {
    crowdPreference: isCrowdPreference(row.crowd_preference) ? row.crowd_preference : "any",
    accessibilityRequirements: toStringArray(row.accessibility_requirements).filter(isAccessibilityRequirement),
    maximumPrice: isMaximumPrice(row.maximum_price) ? row.maximum_price : "any",
    agePreference: isAgePreference(row.age_preference) ? row.age_preference : "member_default",
    excludedCategories: normalizeExcludedCategories(row.excluded_categories),
  };
}

export async function updateInterestDiscoveryConstraints(
  userId: string,
  patch: Partial<InterestDiscoveryConstraints>,
): Promise<InterestDiscoveryConstraints> {
  const current = await getInterestDiscoveryConstraints(userId);
  const next: InterestDiscoveryConstraints = {
    crowdPreference: isCrowdPreference(patch.crowdPreference) ? patch.crowdPreference : current.crowdPreference,
    accessibilityRequirements: Array.isArray(patch.accessibilityRequirements)
      ? [...new Set(patch.accessibilityRequirements.filter(isAccessibilityRequirement))]
      : current.accessibilityRequirements,
    maximumPrice: isMaximumPrice(patch.maximumPrice) ? patch.maximumPrice : current.maximumPrice,
    agePreference: isAgePreference(patch.agePreference) ? patch.agePreference : current.agePreference,
    excludedCategories: Array.isArray(patch.excludedCategories)
      ? normalizeExcludedCategories(patch.excludedCategories)
      : current.excludedCategories,
  };
  await pool.query(
    `INSERT INTO kinfolk_interest_discovery_constraints (
       user_id, crowd_preference, accessibility_requirements, maximum_price, age_preference, excluded_categories, created_at, updated_at
     ) VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       crowd_preference = EXCLUDED.crowd_preference,
       accessibility_requirements = EXCLUDED.accessibility_requirements,
       maximum_price = EXCLUDED.maximum_price,
       age_preference = EXCLUDED.age_preference,
       excluded_categories = EXCLUDED.excluded_categories,
       updated_at = NOW()`,
    [
      userId,
      next.crowdPreference,
      JSON.stringify(next.accessibilityRequirements),
      next.maximumPrice,
      next.agePreference,
      JSON.stringify(next.excludedCategories),
    ],
  );
  return next;
}
