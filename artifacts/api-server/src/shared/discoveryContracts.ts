// Shared discovery contracts — single source of truth for Location-First Discovery.
// The server and any typed API client import from here; no duplication.
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

export type FlywheelSignal = {
  surface: DiscoverySurface;
  action:
    | "search"
    | "filter_applied"
    | "layer_selected"
    | "zero_result"
    | "expanded_search"
    | "nearest_city_selected"
    | "record_saved"
    | "directions_requested"
    | "event_empty_state";
  city: string | null;
  stateCode: string | null;
  recordType: CanonicalRecordType | null;
  category: string | null;
  specialty: string | null;
  occurredAt: string;
};

export const BUSINESS_SPECIALTIES = [
  "barber",
  "natural-hair-specialist",
  "hair-loss-support",
  "dermatologist",
  "obgyn",
  "dentist",
  "therapist",
  "attorney",
  "accountant",
  "contractor",
  "church",
] as const;
