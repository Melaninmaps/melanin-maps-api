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
  fullResults: any[];
  total: number;
  capabilityMessage?: string;
  intentType?: string;
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

export async function checkConsentAndEmit(event: any) {
  try {
    const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const prefRes = await fetch(`${getApiBase()}/api/discovery/v1/preferences`, { headers });
    if (!prefRes.ok) return;
    const pref = await prefRes.json();
    if (!pref.searchImprovement) return;

    const safeEvent = { ...event };
    delete safeEvent.query;
    if (safeEvent.filters) {
      delete safeEvent.filters.city;
      delete safeEvent.filters.latitude;
      delete safeEvent.filters.longitude;
    }

    await fetch(`${getApiBase()}/api/discovery/v1/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...safeEvent,
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
  const payload = await v1Res.json();

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
