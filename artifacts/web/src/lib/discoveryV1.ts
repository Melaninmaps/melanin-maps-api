import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { emitDiscoveryAnalytics } from "@/lib/discoveryAnalytics";

export const V1_STATE_KEY = "mwm_v1_search_state";

export type V1SessionState = {
  q: string;
  area: string;
  radius?: number;
  resultSetId: string;
  resultIds: string[];
  fullResults: any[];
  total: number;
  capabilityMessage?: string;
  intentType?: string;
};

export function saveV1State(state: V1SessionState) {
  try {
    sessionStorage.setItem(V1_STATE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadV1State(): V1SessionState | null {
  try {
    const data = sessionStorage.getItem(V1_STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function mapV1ToUniversal(payload: any) {
  return {
    ...payload,
    results: {
      businesses: payload.results.filter((r: any) => r.recordType === "business").map((r: any) => ({
        id: r.id,
        name: r.title,
        category: r.subtitle,
        latitude: r.latitude,
        longitude: r.longitude,
        verified: r.isVerified,
        sourceUrl: r.sourceUrl,
        matchReason: r.matchReason,
        evidence: r.evidence
      })),
      heritage: [], events: [], libraryTopics: [], communityOrgs: []
    },
    intentType: payload.interpretedIntent,
    totalResults: payload.total,
    fallbackMessage: payload.capabilityMessage,
  };
}

export function getUniversalFromV1State(state: V1SessionState) {
  return mapV1ToUniversal({
    results: state.fullResults,
    interpretedIntent: state.intentType,
    total: state.total,
    capabilityMessage: state.capabilityMessage,
    resultSetId: state.resultSetId
  });
}

/**
 * Universal discovery remains authoritative for broad Discover and Map searches.
 * Discovery V1 returns a business-only result set, so it must not be used on
 * surfaces that promise canonical non-business records beside businesses.
 */
export async function executeUniversalDiscoverySearch(params: {
  query: string;
  surface: "discover" | "directory" | "map" | "explore";
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  limit?: number;
}) {
  const search = new URLSearchParams({
    q: params.query.trim(),
    surface: params.surface,
    limit: String(params.limit ?? 30),
  });
  if (params.latitude !== undefined && params.longitude !== undefined) {
    search.set("lat", String(params.latitude));
    search.set("lng", String(params.longitude));
    if (params.radiusMiles !== undefined) search.set("radius", String(params.radiusMiles));
  } else if (params.city) {
    search.set("city", params.city);
  }

  const response = await authenticatedFetch(`/api/search/universal?${search.toString()}`);
  if (!response.ok) throw new Error(`Universal discovery search failed (${response.status})`);
  return response.json();
}

export async function executeV1SearchWithFallback(params: {
  query: string;
  /** V1 is a governed business directory endpoint, never a broad surface. */
  surface: "businesses";
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  fallbackLimit?: number;
  filters?: {
    categoryIds?: string[];
    specialtyIds?: string[];
    ownershipClaims?: string[];
  };
  useBusinessApiFallback?: boolean;
}) {
  const { query, surface, city, stateRegion, postalCode, latitude, longitude, radiusMiles, fallbackLimit = 30, filters = {}, useBusinessApiFallback = false } = params;
  const requestId = crypto.randomUUID();

  let v1Failed = false;
  let fallbackReason = "";
  const hasLocation = city || postalCode || (latitude !== undefined && longitude !== undefined);

  if (hasLocation) {
    try {
      const roundedLat = latitude !== undefined ? Number(latitude.toFixed(2)) : undefined;
      const roundedLng = longitude !== undefined ? Number(longitude.toFixed(2)) : undefined;

      let source = "typed";
      if (roundedLat !== undefined && roundedLng !== undefined) {
        source = "device_coarse";
      }

      const locationPayload: any = { source };
      if (city) locationPayload.city = city;
      if (stateRegion) locationPayload.stateRegion = stateRegion;
      if (postalCode) locationPayload.postalCode = postalCode;
      if (roundedLat !== undefined) locationPayload.latitude = roundedLat;
      if (roundedLng !== undefined) locationPayload.longitude = roundedLng;

      if (radiusMiles !== undefined) {
        locationPayload.radiusMiles = [5, 10, 25].includes(radiusMiles) ? radiusMiles : 5;
      }

      const v1Res = await authenticatedFetch("/api/discovery/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1",
          requestId,
          surface,
          platform: "web_desktop",
          entryPoint: "search_bar",
          query: query.trim(),
          location: locationPayload,
          filters,
          consent: { personalizedSuggestions: false, searchImprovement: true, preciseLocation: false }
        })
      });

      if (v1Res.ok) {
        const payload = await v1Res.json();

        void emitDiscoveryAnalytics({
          eventName: "result_exposed",
          surface: "businesses",
          entryPoint: "results",
          resultCount: payload.total,
          zeroResult: payload.total === 0,
        });

        saveV1State({
          q: query.trim(),
          area: payload.locationLabel || city || "nearby",
          radius: payload.radiusMiles, // undefined if omitted by server
          resultSetId: payload.resultSetId,
          resultIds: payload.results.map((r: any) => r.id),
          fullResults: payload.results,
          total: payload.total,
          capabilityMessage: payload.capabilityMessage,
          intentType: payload.interpretedIntent,
        });

        return {
          source: "v1",
          payload: mapV1ToUniversal(payload)
        };
      } else {
        if (v1Res.status === 400) {
          // Do not silently fallback on validation 400
          throw new Error("Invalid search parameters (400 Bad Request)");
        } else if ([404, 501, 502, 503, 504].includes(v1Res.status)) {
          v1Failed = true;
          fallbackReason = `HTTP ${v1Res.status}`;
        } else {
           throw new Error(`Unexpected error (HTTP ${v1Res.status})`);
        }
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes("400") || e.message.includes("Unexpected error"))) {
        throw e;
      }
      v1Failed = true;
      fallbackReason = e instanceof Error ? e.message : "Network error";
    }
  } else {
    v1Failed = true;
    fallbackReason = "No location provided";
  }

  // Fallback to legacy
  if (v1Failed) {
    if (useBusinessApiFallback) {
      const p = new URLSearchParams({ limit: String(fallbackLimit) });
      if (query) p.set("search", query);
      if (city) p.set("city", city);
      if (stateRegion) p.set("stateCode", stateRegion);
      if (filters.categoryIds?.[0]) p.set("category", filters.categoryIds[0]);
      if (filters.specialtyIds?.[0]) p.set("specialty", filters.specialtyIds[0]);
      if (filters.ownershipClaims?.[0]) p.set("ownership", filters.ownershipClaims[0]);

      const legacyRes = await authenticatedFetch(`/api/businesses?${p}`);
      if (legacyRes.ok) {
        const data = await legacyRes.json();

        // Preserve exact returned IDs in handoff
        saveV1State({
          q: query.trim(),
          area: city || "nearby",
          radius: radiusMiles,
          resultSetId: `legacy-fallback-${crypto.randomUUID()}`,
          resultIds: data.businesses.map((r: any) => r.id),
          fullResults: data.businesses,
          total: data.total,
          capabilityMessage: `Degraded mode (Fallback: ${fallbackReason})`,
        });

        return {
          source: "legacy_degraded",
          payload: { businesses: data.businesses, totalResults: data.total, capabilityMessage: `Degraded mode (Fallback: ${fallbackReason})` }
        };
      }
    } else {
      const p = new URLSearchParams({ q: query, surface: surface === "businesses" ? "directory" : surface, limit: String(fallbackLimit) });
      if (latitude !== undefined && longitude !== undefined) {
        p.set("lat", String(latitude));
        p.set("lng", String(longitude));
        p.set("radius", String(radiusMiles || 5));
      } else if (city) {
        p.set("city", city);
      }
      const legacyRes = await authenticatedFetch(`/api/search/universal?${p}`);
      if (legacyRes.ok) {
        const payload = await legacyRes.json();
        const businesses = payload.results?.businesses ?? payload.businesses ?? [];

        // Preserve exact returned IDs in handoff
        saveV1State({
          q: query.trim(),
          area: city || "nearby",
          radius: radiusMiles,
          resultSetId: `legacy-fallback-${crypto.randomUUID()}`,
          resultIds: businesses.map((r: any) => r.id),
          fullResults: businesses,
          total: payload.totalResults || businesses.length,
          capabilityMessage: `Degraded mode (Fallback: ${fallbackReason})`,
        });

        return {
          source: "legacy_degraded",
          payload: { ...payload, capabilityMessage: `Degraded mode (Fallback: ${fallbackReason})` }
        };
      }
    }
  }

  return null;
}
