import { z } from "zod";
import {
  ALL_SPECIALTIES,
  ALL_VALID_CATEGORY_NAMES,
  OWNERSHIP_FILTER_OPTIONS,
  THE_REAL_TAGS,
} from "@workspace/constants";

export const discoverySurfaceV1Schema = z.enum(["discover", "businesses", "map", "explore", "smart_search"]);
export const discoveryPlatformV1Schema = z.enum(["web_desktop", "web_mobile", "ios", "android"]);
export const discoveryRecordTypeV1Schema = z.enum(["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]);
export const discoveryEntryPointV1Schema = z.enum(["find_a_place", "search_bar", "results", "result_card", "filter_chip", "filter_sheet", "map_handoff", "save_button", "correction_form", "coverage_request"]);
export const discoveryNormalizedIntentV1Schema = z.enum(["general_local", "food_or_offering", "category", "specialty", "none"]);
// Values are server-owned catalogue identifiers. This prevents analytics from
// becoming a side channel for raw searches, addresses, or arbitrary JSON.
const canonicalFilterId = (value: string) => value.normalize("NFKD").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const approvedIds = (values: readonly string[]) => {
  const allowed = new Set(values.map(canonicalFilterId));
  return z.string().trim().max(80).refine((value) => allowed.has(canonicalFilterId(value)), "Unknown analytics filter identifier");
};
// These lists are versioned source constants, not client-shaped strings. Search
// can remain flexible; only the small retained analytics payload is constrained.
const categoryFilterId = approvedIds(ALL_VALID_CATEGORY_NAMES);
const specialtyFilterId = approvedIds(ALL_SPECIALTIES);
const ownershipFilterId = approvedIds(OWNERSHIP_FILTER_OPTIONS.map((option) => option.id));
const trustedTagId = approvedIds(THE_REAL_TAGS.map((tag) => tag.tag_key));
const priceFilterId = approvedIds(["budget", "moderate", "premium", "$", "$$", "$$$", "$$$$"]);
export const discoveryFiltersV1Schema = z.object({
  categoryIds: z.array(categoryFilterId).max(25).optional(),
  specialtyIds: z.array(specialtyFilterId).max(25).optional(),
  ownershipClaims: z.array(ownershipFilterId).max(25).optional(),
  priceRanges: z.array(priceFilterId).max(10).optional(),
  ownerTagIds: z.array(trustedTagId).max(25).optional(),
  communityTagIds: z.array(trustedTagId).max(25).optional(),
  accessNeedIds: z.array(trustedTagId).max(25).optional(),
  openNow: z.boolean().optional(),
  recordTypes: z.array(discoveryRecordTypeV1Schema).max(6).optional(),
}).strict();
export const discoverySearchRequestV1Schema = z.object({
  schemaVersion: z.literal("1"), requestId: z.string().uuid(), surface: discoverySurfaceV1Schema,
  platform: discoveryPlatformV1Schema, entryPoint: z.string().trim().min(1).max(100),
  query: z.string().trim().min(1).max(300),
  location: z.object({
    source: z.enum(["typed", "device_coarse", "saved"]), city: z.string().trim().min(1).max(100).optional(),
    stateRegion: z.string().trim().min(1).max(100).optional(), countryCode: z.string().length(2).optional(),
    postalCode: z.string().trim().min(3).max(16).optional(), latitude: z.number().finite().min(-90).max(90).optional(),
    longitude: z.number().finite().min(-180).max(180).optional(), radiusMiles: z.union([z.literal(5), z.literal(10), z.literal(25)]).optional(),
  }).superRefine((v, c) => {
    if (!v.city && !v.postalCode && (v.latitude === undefined || v.longitude === undefined)) c.addIssue({ code: z.ZodIssueCode.custom, message: "A typed city/ZIP or approximate location is required." });
    if ((v.latitude === undefined) !== (v.longitude === undefined)) c.addIssue({ code: z.ZodIssueCode.custom, message: "Latitude and longitude must be supplied together." });
  }),
  filters: discoveryFiltersV1Schema,
  consent: z.object({ personalizedSuggestions: z.boolean(), searchImprovement: z.boolean(), preciseLocation: z.boolean() }).strict(),
}).strict().superRefine((v, c) => {
  const hasCoordinates = v.location.latitude !== undefined || v.location.longitude !== undefined;
  if (!hasCoordinates) return;
  // Device-coarse location may be used without precise-location consent, but
  // must be rounded to a ~1 km bucket (two decimal places at most).
  const isCoarseDeviceLocation = v.location.source === "device_coarse"
    && [v.location.latitude, v.location.longitude].every((coordinate) =>
      coordinate !== undefined && Math.abs(coordinate * 100 - Math.round(coordinate * 100)) < 1e-8,
    );
  if (!v.consent.preciseLocation && !isCoarseDeviceLocation) {
    c.addIssue({ code: z.ZodIssueCode.custom, message: "Precise-location permission is required for exact or saved coordinates." });
  }
});

export const discoveryEventV1Schema = z.object({
  schemaVersion: z.literal("1"), eventId: z.string().uuid(), idempotencyKey: z.string().min(8).max(200),
  eventName: z.enum(["search_submitted", "results_rendered", "result_exposed", "result_opened", "filter_opened", "filter_changed", "map_toggled", "radius_expanded", "save_changed", "directions_handoff", "contact_handoff", "share", "correction_submitted", "coverage_request", "return_to_results"]),
  consent: z.object({ searchImprovement: z.boolean(), version: z.string().min(1).max(50) }).strict(),
  surface: discoverySurfaceV1Schema, platform: discoveryPlatformV1Schema, entryPoint: discoveryEntryPointV1Schema, appVersion: z.string().regex(/^[0-9A-Za-z._-]{1,64}$/),
  requestId: z.string().uuid().optional(), resultSetId: z.string().uuid().optional(), normalizedIntent: discoveryNormalizedIntentV1Schema.optional(),
  filters: discoveryFiltersV1Schema.optional(), coarseLocationBucket: z.string().regex(/^(city:[a-z0-9-]{2,80}|region:[a-z0-9-]{2,80}|postal3:[a-z0-9]{3})$/).optional(), radiusMiles: z.union([z.literal(5), z.literal(10), z.literal(25)]).optional(), resultId: z.string().regex(/^[a-zA-Z0-9._:-]{1,160}$/).optional(), rank: z.number().int().positive().max(1000).optional(), recordType: discoveryRecordTypeV1Schema.optional(), resultCount: z.number().int().min(0).max(10000).optional(), zeroResult: z.boolean().optional(), latencyMs: z.number().int().min(0).max(120000).optional(), fallbackState: z.enum(["exact", "expanded_radius", "nearest_city", "none"]).optional(), coverageRequested: z.boolean().optional(),
}).strict().superRefine((v, c) => { if (v.eventName === "coverage_request" && v.coverageRequested !== true) c.addIssue({ code: z.ZodIssueCode.custom, message: "Coverage requests require explicit member action." }); });
export type DiscoverySearchRequestV1 = z.infer<typeof discoverySearchRequestV1Schema>;