import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBase } from "./api";

export const V1_STATE_KEY = "mwm_v1_search_state";

export type V1SessionState = {
  q: string;
  area: string;
  radius: number | null;
  resultSetId: string;
  resultIds: string[];
  fullResults: DiscoveryResult[];
  total: number;
  capabilityMessage?: string;
  intentType?: string;
};

export type DiscoveryRecordType = "business" | "event" | "article" | "resource" | "cultural_site" | "community_place" | "travel_destination";
export type DiscoveryResult = {
  id: string;
  recordType: DiscoveryRecordType;
  title: string;
  subtitle?: string;
  matchReason?: string;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  sourceUrl?: string;
};
type UniversalResult = {
  id?: string | number;
  name?: string;
  title?: string;
  category?: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  verified?: boolean;
  isVerified?: boolean;
  sourceUrl?: string;
};
export type UniversalSearchResponse = {
  requestId?: string;
  resultSetId?: string;
  totalResults?: number;
  intentType?: string;
  fallbackMessage?: string;
  results?: {
    businesses?: UniversalResult[];
    events?: UniversalResult[];
    heritage?: UniversalResult[];
    libraryTopics?: UniversalResult[];
    communityOrgs?: UniversalResult[];
  };
};
export type DiscoveryEventName =
  | "search_submitted" | "results_rendered" | "result_exposed" | "result_opened"
  | "filter_changed" | "map_toggled" | "save_changed" | "correction_submitted" | "coverage_request";
type SafeDiscoveryEvent = {
  eventName: DiscoveryEventName;
  idempotencyKey: string;
  surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
  platform?: "ios" | "android" | "web_mobile";
  entryPoint?: "find_a_place";
  requestId?: string;
  resultSetId?: string;
  resultId?: string;
  recordType?: DiscoveryRecordType;
  resultCount?: number;
  zeroResult?: boolean;
  rank?: number;
  normalizedIntent?: string;
  fallbackState?: "exact" | "expanded_radius" | "nearest_city" | "none";
};

// For privacy, this V1 Search Session State is strictly process-memory-only.
// It is intentionally non-persistent and will clear when the app restarts or background context is destroyed.
let memoryState: V1SessionState | null = null;
let listeners: Array<() => void> = [];

export function saveV1State(state: V1SessionState | null) {
  memoryState = state;
  listeners.forEach(l => l());
}

export function loadV1State(): V1SessionState | null {
  return memoryState;
}

export function subscribeV1State(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export async function checkConsentAndEmit(event: SafeDiscoveryEvent) {
  try {
    const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const prefRes = await fetch(`${getApiBase()}/api/discovery/v1/preferences`, { headers });
    if (!prefRes.ok) return;
    const pref = await prefRes.json();
    if (!pref.searchImprovement) return;

    await fetch(`${getApiBase()}/api/discovery/v1/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...event,
        schemaVersion: "1",
        eventId: Crypto.randomUUID(),
        consent: { searchImprovement: true, version: pref.consentVersion },
        appVersion: "106",
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web_mobile"
      })
    });
  } catch {}
}

export async function executeV1Search(params: {
  query: string;
  surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
}) {
  const { query, surface, city, stateRegion, postalCode, latitude, longitude, radiusMiles } = params;

  // Only default to 5 if using coordinates; otherwise preserve undefined for pure city scopes
  const effectiveRadius = radiusMiles !== undefined ? radiusMiles : (latitude !== undefined ? 5 : undefined);
  const requestId = Crypto.randomUUID();

  const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Emit consent-gated search_submitted immediately before request
  await checkConsentAndEmit({
    idempotencyKey: requestId + "-submit",
    eventName: "search_submitted",
    surface,
    platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web_mobile",
    entryPoint: "find_a_place",
    requestId,
  });

  const v1Res = await fetch(`${getApiBase()}/api/discovery/v1/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      schemaVersion: "1",
      requestId,
      surface,
      platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web_mobile",
      entryPoint: "find_a_place",
      query: query.trim(),
      location: {
        source: latitude !== undefined ? "device_coarse" : "typed",
        city, stateRegion, postalCode, latitude, longitude,
        radiusMiles: effectiveRadius !== undefined && [5, 10, 25].includes(effectiveRadius) ? effectiveRadius : (latitude !== undefined ? 5 : undefined)
      },
      filters: {},
      consent: { personalizedSuggestions: false, searchImprovement: true, preciseLocation: false }
    })
  });

  if (!v1Res.ok) throw new Error("Search failed");
  const payload = await v1Res.json() as { requestId: string; resultSetId: string; results: DiscoveryResult[]; total: number; locationLabel?: string; radiusMiles?: number; capabilityMessage?: string; interpretedIntent?: string };

  checkConsentAndEmit({
    idempotencyKey: requestId + "-success",
    eventName: "results_rendered",
    surface,
    platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web_mobile",
    entryPoint: "find_a_place",
    requestId,
    resultSetId: payload.resultSetId,
    resultCount: payload.total,
    zeroResult: payload.total === 0,
  });

  saveV1State({
    q: query.trim(),
    area: payload.locationLabel || city || "nearby",
    radius: payload.radiusMiles !== undefined ? payload.radiusMiles : (city ? null : 5),
    resultSetId: payload.resultSetId,
    resultIds: payload.results.map((r: any) => r.id),
    fullResults: payload.results,
    total: payload.total,
    capabilityMessage: payload.capabilityMessage,
    intentType: payload.interpretedIntent,
  });

  return payload;
}

function mapUniversalResult(result: UniversalResult, recordType: DiscoveryRecordType): DiscoveryResult | null {
  if (result.id === undefined || result.id === null) return null;
  const latitude = typeof result.latitude === "string" ? Number(result.latitude) : result.latitude;
  const longitude = typeof result.longitude === "string" ? Number(result.longitude) : result.longitude;
  return {
    id: String(result.id),
    recordType,
    title: result.name ?? result.title ?? "Untitled result",
    subtitle: [result.category, result.city, result.state].filter(Boolean).join(" · ") || undefined,
    matchReason: result.description,
    isVerified: result.verified ?? result.isVerified,
    latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : undefined,
    longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : undefined,
    sourceUrl: result.sourceUrl,
  };
}

/**
 * Canonical broad discovery search. Discovery V1 is business-directory-only;
 * broad Smart Search must retain the universal endpoint's non-business records.
 */
export async function executeUniversalSearch(params: {
  query: string;
  surface: "smart_search";
  city?: string;
  stateRegion?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
}) {
  const requestId = Crypto.randomUUID();
  const search = new URLSearchParams({
    q: params.query.trim(),
    surface: params.surface,
    privacy_mode: "discovery_v1",
    limit: "30",
  });
  if (params.latitude !== undefined && params.longitude !== undefined) {
    search.set("lat", String(params.latitude));
    search.set("lng", String(params.longitude));
    search.set("radius", String(params.radiusMiles ?? 5));
  } else if (params.city) {
    search.set("city", params.city);
    if (params.stateRegion) search.set("state", params.stateRegion);
  }

  await checkConsentAndEmit({
    idempotencyKey: `${requestId}-submit`, eventName: "search_submitted",
    surface: params.surface, requestId,
  });
  const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${getApiBase()}/api/search/universal?${search.toString()}`, { headers });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  const payload = await response.json() as UniversalSearchResponse;
  const results = [
    ...(payload.results?.businesses ?? []).map((item) => mapUniversalResult(item, "business")),
    ...(payload.results?.events ?? []).map((item) => mapUniversalResult(item, "event")),
    ...(payload.results?.heritage ?? []).map((item) => mapUniversalResult(item, "cultural_site")),
    ...(payload.results?.libraryTopics ?? []).map((item) => mapUniversalResult(item, "resource")),
    ...(payload.results?.communityOrgs ?? []).map((item) => mapUniversalResult(item, "community_place")),
  ].filter((item): item is DiscoveryResult => item !== null);
  // Prefer server-issued correlation IDs whenever the canonical endpoint supplies them.
  const authoritativeRequestId = payload.requestId ?? requestId;
  const resultSetId = payload.resultSetId ?? authoritativeRequestId;
  const total = payload.totalResults ?? results.length;
  const data = {
    requestId: authoritativeRequestId, resultSetId, results, total,
    locationLabel: params.city ? [params.city, params.stateRegion].filter(Boolean).join(", ") : undefined,
    capabilityMessage: payload.fallbackMessage, interpretedIntent: payload.intentType,
  };
  void checkConsentAndEmit({
    idempotencyKey: `${resultSetId}-success`, eventName: "results_rendered",
    surface: params.surface, requestId: authoritativeRequestId, resultSetId,
    resultCount: total, zeroResult: total === 0,
  });
  saveV1State({
    q: params.query.trim(), area: data.locationLabel ?? "nearby",
    radius: params.latitude !== undefined ? params.radiusMiles ?? 5 : null,
    resultSetId, resultIds: results.map((result) => result.id), fullResults: results,
    total, capabilityMessage: data.capabilityMessage, intentType: data.interpretedIntent,
  });
  return data;
}
