import { z } from "zod";
export declare const discoverySurfaceV1Schema: z.ZodEnum<["discover", "businesses", "map", "explore", "smart_search"]>;
export declare const discoveryPlatformV1Schema: z.ZodEnum<["web_desktop", "web_mobile", "ios", "android"]>;
export declare const discoveryRecordTypeV1Schema: z.ZodEnum<["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]>;
export declare const discoveryEntryPointV1Schema: z.ZodEnum<["find_a_place", "search_bar", "results", "result_card", "filter_chip", "filter_sheet", "map_handoff", "save_button", "correction_form", "coverage_request"]>;
export declare const discoveryNormalizedIntentV1Schema: z.ZodEnum<["general_local", "food_or_offering", "category", "specialty", "none"]>;
export declare const discoveryFiltersV1Schema: z.ZodObject<{
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    specialtyIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    ownershipClaims: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    priceRanges: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    ownerTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    communityTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    accessNeedIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
    openNow: z.ZodOptional<z.ZodBoolean>;
    recordTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]>, "many">>;
}, "strict", z.ZodTypeAny, {
    categoryIds?: string[] | undefined;
    specialtyIds?: string[] | undefined;
    ownershipClaims?: string[] | undefined;
    priceRanges?: string[] | undefined;
    ownerTagIds?: string[] | undefined;
    communityTagIds?: string[] | undefined;
    accessNeedIds?: string[] | undefined;
    openNow?: boolean | undefined;
    recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
}, {
    categoryIds?: string[] | undefined;
    specialtyIds?: string[] | undefined;
    ownershipClaims?: string[] | undefined;
    priceRanges?: string[] | undefined;
    ownerTagIds?: string[] | undefined;
    communityTagIds?: string[] | undefined;
    accessNeedIds?: string[] | undefined;
    openNow?: boolean | undefined;
    recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
}>;
export declare const discoverySearchRequestV1Schema: z.ZodEffects<z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1">;
    requestId: z.ZodString;
    surface: z.ZodEnum<["discover", "businesses", "map", "explore", "smart_search"]>;
    platform: z.ZodEnum<["web_desktop", "web_mobile", "ios", "android"]>;
    entryPoint: z.ZodString;
    query: z.ZodString;
    location: z.ZodEffects<z.ZodObject<{
        source: z.ZodEnum<["typed", "device_coarse", "saved"]>;
        city: z.ZodOptional<z.ZodString>;
        stateRegion: z.ZodOptional<z.ZodString>;
        countryCode: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        radiusMiles: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<5>, z.ZodLiteral<10>, z.ZodLiteral<25>]>>;
    }, "strip", z.ZodTypeAny, {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    }, {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    }>, {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    }, {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    }>;
    filters: z.ZodObject<{
        categoryIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        specialtyIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        ownershipClaims: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        priceRanges: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        ownerTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        communityTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        accessNeedIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        openNow: z.ZodOptional<z.ZodBoolean>;
        recordTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]>, "many">>;
    }, "strict", z.ZodTypeAny, {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    }, {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    }>;
    consent: z.ZodObject<{
        personalizedSuggestions: z.ZodBoolean;
        searchImprovement: z.ZodBoolean;
        preciseLocation: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    }, {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    }>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: "1";
    requestId: string;
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: string;
    query: string;
    location: {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    };
    filters: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    };
    consent: {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    };
}, {
    schemaVersion: "1";
    requestId: string;
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: string;
    query: string;
    location: {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    };
    filters: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    };
    consent: {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    };
}>, {
    schemaVersion: "1";
    requestId: string;
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: string;
    query: string;
    location: {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    };
    filters: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    };
    consent: {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    };
}, {
    schemaVersion: "1";
    requestId: string;
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: string;
    query: string;
    location: {
        source: "typed" | "device_coarse" | "saved";
        city?: string | undefined;
        stateRegion?: string | undefined;
        countryCode?: string | undefined;
        postalCode?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        radiusMiles?: 5 | 10 | 25 | undefined;
    };
    filters: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    };
    consent: {
        personalizedSuggestions: boolean;
        searchImprovement: boolean;
        preciseLocation: boolean;
    };
}>;
export declare const discoveryEventV1Schema: z.ZodEffects<z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1">;
    eventId: z.ZodString;
    idempotencyKey: z.ZodString;
    eventName: z.ZodEnum<["search_submitted", "results_rendered", "result_exposed", "result_opened", "filter_opened", "filter_changed", "map_toggled", "radius_expanded", "save_changed", "directions_handoff", "contact_handoff", "share", "correction_submitted", "coverage_request", "return_to_results"]>;
    consent: z.ZodObject<{
        searchImprovement: z.ZodBoolean;
        version: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        searchImprovement: boolean;
        version: string;
    }, {
        searchImprovement: boolean;
        version: string;
    }>;
    surface: z.ZodEnum<["discover", "businesses", "map", "explore", "smart_search"]>;
    platform: z.ZodEnum<["web_desktop", "web_mobile", "ios", "android"]>;
    entryPoint: z.ZodEnum<["find_a_place", "search_bar", "results", "result_card", "filter_chip", "filter_sheet", "map_handoff", "save_button", "correction_form", "coverage_request"]>;
    appVersion: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
    resultSetId: z.ZodOptional<z.ZodString>;
    normalizedIntent: z.ZodOptional<z.ZodEnum<["general_local", "food_or_offering", "category", "specialty", "none"]>>;
    filters: z.ZodOptional<z.ZodObject<{
        categoryIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        specialtyIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        ownershipClaims: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        priceRanges: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        ownerTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        communityTagIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        accessNeedIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">>;
        openNow: z.ZodOptional<z.ZodBoolean>;
        recordTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]>, "many">>;
    }, "strict", z.ZodTypeAny, {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    }, {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    }>>;
    coarseLocationBucket: z.ZodOptional<z.ZodString>;
    radiusMiles: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<5>, z.ZodLiteral<10>, z.ZodLiteral<25>]>>;
    resultId: z.ZodOptional<z.ZodString>;
    rank: z.ZodOptional<z.ZodNumber>;
    recordType: z.ZodOptional<z.ZodEnum<["business", "cultural_site", "community_place", "event", "resource", "travel_destination"]>>;
    resultCount: z.ZodOptional<z.ZodNumber>;
    zeroResult: z.ZodOptional<z.ZodBoolean>;
    latencyMs: z.ZodOptional<z.ZodNumber>;
    fallbackState: z.ZodOptional<z.ZodEnum<["exact", "expanded_radius", "nearest_city", "none"]>>;
    coverageRequested: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: "1";
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: "find_a_place" | "search_bar" | "results" | "result_card" | "filter_chip" | "filter_sheet" | "map_handoff" | "save_button" | "correction_form" | "coverage_request";
    consent: {
        searchImprovement: boolean;
        version: string;
    };
    eventId: string;
    idempotencyKey: string;
    eventName: "coverage_request" | "search_submitted" | "results_rendered" | "result_exposed" | "result_opened" | "filter_opened" | "filter_changed" | "map_toggled" | "radius_expanded" | "save_changed" | "directions_handoff" | "contact_handoff" | "share" | "correction_submitted" | "return_to_results";
    appVersion: string;
    requestId?: string | undefined;
    radiusMiles?: 5 | 10 | 25 | undefined;
    filters?: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    } | undefined;
    resultSetId?: string | undefined;
    normalizedIntent?: "general_local" | "food_or_offering" | "category" | "specialty" | "none" | undefined;
    coarseLocationBucket?: string | undefined;
    resultId?: string | undefined;
    rank?: number | undefined;
    recordType?: "business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination" | undefined;
    resultCount?: number | undefined;
    zeroResult?: boolean | undefined;
    latencyMs?: number | undefined;
    fallbackState?: "none" | "exact" | "expanded_radius" | "nearest_city" | undefined;
    coverageRequested?: boolean | undefined;
}, {
    schemaVersion: "1";
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: "find_a_place" | "search_bar" | "results" | "result_card" | "filter_chip" | "filter_sheet" | "map_handoff" | "save_button" | "correction_form" | "coverage_request";
    consent: {
        searchImprovement: boolean;
        version: string;
    };
    eventId: string;
    idempotencyKey: string;
    eventName: "coverage_request" | "search_submitted" | "results_rendered" | "result_exposed" | "result_opened" | "filter_opened" | "filter_changed" | "map_toggled" | "radius_expanded" | "save_changed" | "directions_handoff" | "contact_handoff" | "share" | "correction_submitted" | "return_to_results";
    appVersion: string;
    requestId?: string | undefined;
    radiusMiles?: 5 | 10 | 25 | undefined;
    filters?: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    } | undefined;
    resultSetId?: string | undefined;
    normalizedIntent?: "general_local" | "food_or_offering" | "category" | "specialty" | "none" | undefined;
    coarseLocationBucket?: string | undefined;
    resultId?: string | undefined;
    rank?: number | undefined;
    recordType?: "business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination" | undefined;
    resultCount?: number | undefined;
    zeroResult?: boolean | undefined;
    latencyMs?: number | undefined;
    fallbackState?: "none" | "exact" | "expanded_radius" | "nearest_city" | undefined;
    coverageRequested?: boolean | undefined;
}>, {
    schemaVersion: "1";
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: "find_a_place" | "search_bar" | "results" | "result_card" | "filter_chip" | "filter_sheet" | "map_handoff" | "save_button" | "correction_form" | "coverage_request";
    consent: {
        searchImprovement: boolean;
        version: string;
    };
    eventId: string;
    idempotencyKey: string;
    eventName: "coverage_request" | "search_submitted" | "results_rendered" | "result_exposed" | "result_opened" | "filter_opened" | "filter_changed" | "map_toggled" | "radius_expanded" | "save_changed" | "directions_handoff" | "contact_handoff" | "share" | "correction_submitted" | "return_to_results";
    appVersion: string;
    requestId?: string | undefined;
    radiusMiles?: 5 | 10 | 25 | undefined;
    filters?: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    } | undefined;
    resultSetId?: string | undefined;
    normalizedIntent?: "general_local" | "food_or_offering" | "category" | "specialty" | "none" | undefined;
    coarseLocationBucket?: string | undefined;
    resultId?: string | undefined;
    rank?: number | undefined;
    recordType?: "business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination" | undefined;
    resultCount?: number | undefined;
    zeroResult?: boolean | undefined;
    latencyMs?: number | undefined;
    fallbackState?: "none" | "exact" | "expanded_radius" | "nearest_city" | undefined;
    coverageRequested?: boolean | undefined;
}, {
    schemaVersion: "1";
    surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
    platform: "web_desktop" | "web_mobile" | "ios" | "android";
    entryPoint: "find_a_place" | "search_bar" | "results" | "result_card" | "filter_chip" | "filter_sheet" | "map_handoff" | "save_button" | "correction_form" | "coverage_request";
    consent: {
        searchImprovement: boolean;
        version: string;
    };
    eventId: string;
    idempotencyKey: string;
    eventName: "coverage_request" | "search_submitted" | "results_rendered" | "result_exposed" | "result_opened" | "filter_opened" | "filter_changed" | "map_toggled" | "radius_expanded" | "save_changed" | "directions_handoff" | "contact_handoff" | "share" | "correction_submitted" | "return_to_results";
    appVersion: string;
    requestId?: string | undefined;
    radiusMiles?: 5 | 10 | 25 | undefined;
    filters?: {
        categoryIds?: string[] | undefined;
        specialtyIds?: string[] | undefined;
        ownershipClaims?: string[] | undefined;
        priceRanges?: string[] | undefined;
        ownerTagIds?: string[] | undefined;
        communityTagIds?: string[] | undefined;
        accessNeedIds?: string[] | undefined;
        openNow?: boolean | undefined;
        recordTypes?: ("business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination")[] | undefined;
    } | undefined;
    resultSetId?: string | undefined;
    normalizedIntent?: "general_local" | "food_or_offering" | "category" | "specialty" | "none" | undefined;
    coarseLocationBucket?: string | undefined;
    resultId?: string | undefined;
    rank?: number | undefined;
    recordType?: "business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination" | undefined;
    resultCount?: number | undefined;
    zeroResult?: boolean | undefined;
    latencyMs?: number | undefined;
    fallbackState?: "none" | "exact" | "expanded_radius" | "nearest_city" | undefined;
    coverageRequested?: boolean | undefined;
}>;
export type DiscoverySearchRequestV1 = z.infer<typeof discoverySearchRequestV1Schema>;
//# sourceMappingURL=discovery.d.ts.map