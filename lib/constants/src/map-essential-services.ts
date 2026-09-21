export const MAP_ESSENTIAL_SERVICE_CATEGORIES = [
  {
    id: "medical-care",
    label: "Medical care",
    shortLabel: "Medical",
    description: "Hospitals and clinics",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    shortLabel: "Pharmacy",
    description: "Pharmacies and drugstores",
  },
  {
    id: "groceries",
    label: "Groceries",
    shortLabel: "Groceries",
    description: "Grocers and supermarkets",
  },
  {
    id: "transit",
    label: "Transit",
    shortLabel: "Transit",
    description: "Transit and rail stations",
  },
  {
    id: "fuel",
    label: "Gas",
    shortLabel: "Gas",
    description: "Gas stations",
  },
  {
    id: "library",
    label: "Libraries",
    shortLabel: "Library",
    description: "Public libraries",
  },
  {
    id: "public-services",
    label: "Public services",
    shortLabel: "Public help",
    description: "Fire, police, post, and city services",
  },
] as const;

export type MapEssentialServiceCategory =
  (typeof MAP_ESSENTIAL_SERVICE_CATEGORIES)[number]["id"];

export type MapEssentialServiceCategoryDefinition =
  (typeof MAP_ESSENTIAL_SERVICE_CATEGORIES)[number];

export function findMapEssentialServiceCategory(
  value: string | null | undefined,
): MapEssentialServiceCategoryDefinition | null {
  if (!value) return null;
  return (
    MAP_ESSENTIAL_SERVICE_CATEGORIES.find((category) => category.id === value) ??
    null
  );
}

/**
 * Category-specific Google Place type filters. These are intentionally limited
 * to ordinary, public facilities. Crisis, domestic-violence, and temporary
 * shelter locations require a separate official-source workflow and are never
 * silently represented as a general map result.
 */
export const MAP_ESSENTIAL_SERVICE_PLACE_TYPES: Record<
  MapEssentialServiceCategory,
  readonly string[]
> = {
  "medical-care": [
    "hospital",
    "general_hospital",
    "medical_center",
    "medical_clinic",
  ],
  pharmacy: ["pharmacy", "drugstore"],
  groceries: ["grocery_store", "supermarket", "food_store"],
  transit: [
    "transit_station",
    "bus_station",
    "train_station",
    "subway_station",
  ],
  fuel: ["gas_station"],
  library: ["library"],
  "public-services": ["fire_station", "police", "post_office", "city_hall"],
};

export const MAP_ESSENTIAL_SERVICE_RESULT_CAP = 12;
export const MAP_ESSENTIAL_SERVICE_MAX_RADIUS_MILES = 25;
export const MAP_ESSENTIAL_SERVICE_DEFAULT_RADIUS_MILES = 10;
