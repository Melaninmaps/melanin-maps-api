import { BUSINESS_CATEGORY_TAXONOMY } from "@workspace/constants";

export type SubCategory = { name: string };

export type CategoryGroup = {
  emoji: string;
  name: string;
  subcategories: SubCategory[];
  liveAtLaunch: boolean;
};

/** Presentation metadata only. Category names and subcategories come from @workspace/constants. */
const CATEGORY_EMOJI: Readonly<Record<string, string>> = {
  "Food & Drink": "🍽️",
  "Beauty & Personal Care": "💇",
  "Health & Wellness": "🏥",
  "Shopping & Retail": "🛍️",
  "Travel & Hospitality": "✈️",
  "Arts, Culture & Entertainment": "🎭",
  "Professional Services": "💼",
  "Home & Property Services": "🏠",
  "Automotive & Transportation": "🚗",
  "Events & Celebrations": "🎉",
  "Education & Learning": "🎓",
  "Children & Family": "👨🏾‍👩🏾‍👧🏾",
  "Community & Nonprofit": "🤝",
  "Faith & Spirituality": "🕊️",
  "Media & Creative Services": "📸",
  "Sports & Recreation": "🏅",
  "Pets & Animal Services": "🐾",
  "Technology & Digital Services": "💻",
  "Financial & Business Services": "📈",
  "Legal & Government Services": "⚖️",
  "Agriculture & Specialty Producers": "🌱",
  "Other Services": "🏪",
};

/**
 * Mobile's category selector is derived from the shared founder taxonomy.
 * Every approved category is available; no device keeps a divergent waitlist.
 */
export const CATEGORY_GROUPS: CategoryGroup[] = BUSINESS_CATEGORY_TAXONOMY.map((category) => ({
  emoji: CATEGORY_EMOJI[category.name] ?? "🏪",
  name: category.name,
  subcategories: category.subcategories.map((name) => ({ name })),
  liveAtLaunch: true,
}));

export const LIVE_CATEGORY_NAMES = CATEGORY_GROUPS.map((group) => group.name);
export const ALL_PARENT_CATEGORY_NAMES = LIVE_CATEGORY_NAMES;

export function getCategoryGroup(name: string | null | undefined): CategoryGroup | undefined {
  const normalized = name?.trim();
  return normalized ? CATEGORY_GROUPS.find((group) => group.name === normalized) : undefined;
}

export function isLiveCategory(name: string | null | undefined): boolean {
  return Boolean(getCategoryGroup(name));
}
