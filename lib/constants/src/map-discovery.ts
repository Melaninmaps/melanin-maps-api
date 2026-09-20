export const MAP_DISCOVERY_FOCUSES = [
  {
    id: "food",
    label: "Food & nightlife",
    keywords: [
      "food", "restaurant", "dining", "cafe", "coffee", "bakery", "bar",
      "lounge", "nightlife", "brunch", "catering", "brewery", "winery",
    ],
  },
  {
    id: "beauty",
    label: "Beauty & wellness",
    keywords: [
      "beauty", "hair", "salon", "barber", "nail", "spa", "wellness",
      "massage", "fitness", "gym", "yoga", "skincare", "makeup",
    ],
  },
  {
    id: "family",
    label: "Family fun",
    keywords: [
      "family", "children", "child", "kids", "play", "youth", "camp",
      "water park", "bowling", "arcade", "zoo", "aquarium", "recreation",
    ],
  },
  {
    id: "culture",
    label: "Culture & museums",
    keywords: [
      "museum", "culture", "heritage", "history", "art", "gallery", "music",
      "theater", "theatre", "performing", "hbcu", "library", "festival",
    ],
  },
  {
    id: "care",
    label: "Care & resources",
    keywords: [
      "health", "medical", "doctor", "dent", "mental health", "therapy",
      "counsel", "legal", "law", "financial", "education", "school", "faith",
      "church", "community", "resource", "housing", "career",
    ],
  },
  {
    id: "everyday",
    label: "Everyday services",
    keywords: [
      "grocery", "market", "retail", "auto", "repair", "mechanic", "home",
      "hvac", "plumber", "electric", "cleaning", "laundry", "tailor", "bank",
      "insurance", "transport", "delivery",
    ],
  },
] as const;

export type MapDiscoveryFocusId = (typeof MAP_DISCOVERY_FOCUSES)[number]["id"];
export type MapDiscoveryFocus = MapDiscoveryFocusId | "all";

/** The smallest record shape needed to group existing, real map records. */
export type MapDiscoveryRecord = {
  name?: string | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  tags?: readonly string[] | null;
};

function normalizedRecordText(record: MapDiscoveryRecord): string {
  return [
    record.name,
    record.category,
    record.subcategory,
    record.description,
    ...(record.tags ?? []),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase();
}

/**
 * Filters an already-local map collection without inventing recommendations.
 * This is intentionally category/text based. Personal behavior belongs in an
 * explicit, explainable ranking layer, never in this default grouping helper.
 */
export function matchesMapDiscoveryFocus(
  record: MapDiscoveryRecord,
  focus: MapDiscoveryFocus,
): boolean {
  if (focus === "all") return true;
  const definition = MAP_DISCOVERY_FOCUSES.find((item) => item.id === focus);
  if (!definition) return false;
  const text = normalizedRecordText(record);
  return definition.keywords.some((keyword) => text.includes(keyword));
}

export function countMapDiscoveryFocuses(
  records: readonly MapDiscoveryRecord[],
): ReadonlyArray<{ id: MapDiscoveryFocusId; label: string; count: number }> {
  return MAP_DISCOVERY_FOCUSES.map((focus) => ({
    id: focus.id,
    label: focus.label,
    count: records.filter((record) => matchesMapDiscoveryFocus(record, focus.id)).length,
  }));
}
