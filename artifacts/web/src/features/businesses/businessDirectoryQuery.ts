import { BUSINESS_SEARCH_NORMALIZATION_VERSION } from "@workspace/constants";
import type { LocationContext, LocationFirstQuery } from "@/shared/discoveryContracts";

type BusinessDirectoryQueryInput = {
  location: LocationContext;
  category: string | null;
  specialty: string | null;
  ownership: string[];
  searchText: string;
};

/** Build the exact location-first payload sent by the Finder UI. */
export function buildBusinessDirectoryQuery({
  location,
  category,
  specialty,
  ownership,
  searchText,
}: BusinessDirectoryQueryInput): LocationFirstQuery {
  return {
    surface: "businesses",
    location,
    locationMode: "exact",
    radiusMiles: null,
    filters: {
      recordTypes: ["business"],
      category,
      categoryNormalizationVersion: BUSINESS_SEARCH_NORMALIZATION_VERSION,
      specialty,
      ownership,
      tagSlugs: [],
      dateRange: null,
    },
    searchText: searchText.trim() || null,
  };
}
