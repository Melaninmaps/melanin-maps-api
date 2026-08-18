// Shared discovery contracts — mirrors the server shared/discoveryContracts.ts.
// The web client imports from here so both sides use the same type definitions.
export type DiscoverySurface = "map" | "businesses" | "explore" | "events" | "kinfolk";
export type CanonicalRecordType = "business" | "cultural_site" | "event" | "community_place" | "resource";
export type LocationMode = "exact" | "expanded_radius" | "nearest_city" | "all_locations";

export type LocationContext = {
  city: string | null;
  stateCode: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  source: "explicit" | "saved" | "device" | "none";
};

export type DiscoveryFilters = {
  recordTypes: CanonicalRecordType[];
  category: string | null;
  specialty: string | null;
  ownership: string[];
  tagSlugs: string[];
  dateRange: "today" | "weekend" | "month" | null;
};

export type LocationFirstQuery = {
  surface: DiscoverySurface;
  location: LocationContext;
  locationMode: LocationMode;
  radiusMiles: number | null;
  filters: DiscoveryFilters;
  searchText: string | null;
};

export type DiscoveryRecord = {
  id: string;
  recordType: CanonicalRecordType;
  name: string;
  category: string | null;
  specialty: string | null;
  city: string | null;
  stateCode: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMiles: number | null;
  detailUrl: string;
  isVerified: boolean;
  contextTags: Array<{ slug: string; label: string; reason: string }>;
};

export type CoverageGap = {
  city: string;
  stateCode: string | null;
  recordType: CanonicalRecordType;
  category: string | null;
  specialty: string | null;
  observedAt: string;
};

export type LocationFirstResponse = {
  query: LocationFirstQuery;
  requiresLocation: boolean;
  records: DiscoveryRecord[];
  coverageGap: CoverageGap | null;
  suggestedActions: Array<"expand_radius" | "show_nearest_city" | "show_all_locations" | "submit_listing" | "submit_event">;
  nearestAvailableLocation: { city: string; stateCode: string | null; distanceMiles: number | null } | null;
};

export const BUSINESS_SPECIALTIES = [
  { slug: "barber", label: "Barbers" },
  { slug: "natural-hair-specialist", label: "Natural hair" },
  { slug: "hair-loss-support", label: "Hair loss support" },
  { slug: "dermatologist", label: "Dermatologists" },
  { slug: "obgyn", label: "OB-GYNs" },
  { slug: "attorney", label: "Attorneys" },
  { slug: "accountant", label: "Accountants" },
  { slug: "contractor", label: "Contractors" },
  { slug: "church", label: "Churches" },
] as const;
