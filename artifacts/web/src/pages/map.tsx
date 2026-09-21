import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { OWNERSHIP_FILTER_OPTIONS } from "@workspace/constants";
import { persistReducedSupportLensRemoval } from "@/lib/supportLensActions";
import {
  countMapDiscoveryFocuses,
  MAP_ESSENTIAL_SERVICE_CATEGORIES,
  matchesMapDiscoveryFocus,
  type MapEssentialServiceCategory,
  type MapDiscoveryFocus,
} from "@workspace/constants";
import { Link, useLocation, useSearch } from "wouter";
import { Search, MapPin, X, Navigation, Navigation2, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LocalBusinessResults } from "@/features/map/LocalBusinessResults";
import { applyLocalMapViewport, type MapViewportAdapter } from "@/features/map/applyLocalMapViewport";
import { parseLocalMapSearch } from "@/features/map/parseLocalMapSearch";
import AddPlaceModal from "@/components/AddPlaceModal";
import UniversalSearchResults, { type UniversalSearchResult } from "@/components/UniversalSearchResults";

const BASE = import.meta.env.BASE_URL;

/** Guard external URLs before rendering — rejects javascript:, data:, relative,
 *  and malformed values. Returns the absolute href or null. */
function safePublicUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type GMap = any;
type GMarker = any;
type GInfoWindow = any;

type BizWithCoords = {
  id: string;
  name?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  imageUrl?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  blackOwned?: boolean | null;
  description?: string | null;
};

type UniversalMapEntity = {
  id: string;
  entity_kind: "cultural_site" | "hbcu" | "festival" | "community_event" | "market" | "public_art" | "heritage_marker" | "travel_destination";
  title: string;
  slug: string;
  summary?: string | null;
  city: string;
  state_region?: string | null;
  country_code?: string | null;
  latitude: number;
  longitude: number;
  detail_url: string;
};

type EssentialServicePlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  primaryType: string | null;
  directionsUrl: string;
};

type EssentialServicesResponse = {
  category: MapEssentialServiceCategory;
  radiusMiles: number;
  places: EssentialServicePlace[];
  source: "Google Maps";
  disclaimer: string;
};

// ── Pin colour helpers ──────────────────────────────────────────────────────
function getCulturalPinColor(site: UniversalMapEntity): string {
  if (site.entity_kind === "travel_destination") return "#2563A8";
  if (site.entity_kind === "hbcu") return "#7C3AED";
  if (site.entity_kind === "festival") return "#C8960C";
  if (site.entity_kind === "market") return "#16A34A";
  if (site.entity_kind === "public_art") return "#0891B2";
  if (site.entity_kind === "community_event") return "#EA580C";
  if (site.entity_kind === "heritage_marker") return "#DC2626";
  return "#92400E";
}

function getCulturalPinLabel(site: UniversalMapEntity): string {
  return site.entity_kind.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Which cultural sites match the active legend filter?
function siteMatchesFilter(site: UniversalMapEntity, filter: string): boolean {
  if (filter === "destinations") return site.entity_kind === "travel_destination";
  if (filter === "hbcu") return site.entity_kind === "hbcu";
  if (filter === "festival") return site.entity_kind === "festival";
  if (filter === "events") return site.entity_kind === "community_event";
  if (filter === "market") return site.entity_kind === "market";
  if (filter === "art") return site.entity_kind === "public_art";
  if (filter === "cultural") return site.entity_kind === "cultural_site" || site.entity_kind === "heritage_marker";
  return true;
}

// Universal diamond pin path — 16 × 16 px (same visual size as business circle scale:8)
const DIAMOND_PATH = "M 0,-8 8,0 0,8 -8,0 Z";

// Upward-pointing triangle — Historical Sundown Towns layer
// Visually distinct from business circles and heritage diamonds (per Gate 5 spec)
const TRIANGLE_PATH = "M 0,-10 L 9,7 L -9,7 Z";

type SundownTown = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  confidence_level: string; // confirmed | probable | possible
  historical_evidence?: string | null;
  time_period?: string | null;
  excluded_population?: string | null;
  source_organization?: string | null;
  current_state: string;   // historical_neutral | historical_softened | historical_confirmed | current_active | current_escalated | current_faded
  report_count: number;
};

// Sundown pin color — varies by state (NOT by confidence — confidence drives opacity/fill)
function getSundownColor(state: string): string {
  if (state === "historical_softened") return "#5B8A3C"; // green dot: 3+ positive reports
  if (state === "historical_confirmed") return "#D4700A"; // warmer orange: 3+ negative
  if (state === "current_active")       return "#EA580C"; // active present-day concern
  if (state === "current_escalated")    return "#C2400B"; // escalated
  return "#B8860B"; // historical_neutral or current_faded — amber (default)
}

// Fill opacity: confidence determines how "solid" the triangle is
// Confirmed → solid; Probable → semi; Possible → outline only
function getSundownFillOpacity(state: string, confidence: string): number {
  if (state === "current_faded") return 0.15;
  const base = state === "current_escalated" ? 1.0 : state === "current_active" ? 0.92 : 0.82;
  if (confidence === "probable") return base * 0.55;
  if (confidence === "possible") return 0; // outline only — under research
  return base;
}

function getSundownScale(state: string): number {
  if (state === "current_escalated") return 11;
  if (state === "current_active")    return 10;
  return 8;
}

function getConfidenceLabel(level: string): string {
  if (level === "confirmed") return "Confirmed Historical Record";
  if (level === "probable")  return "Probable Historical Record";
  return "Under Historical Research";
}

type RouteInfo = { distance: string; duration: string; bizName: string };

const BRAND_STYLE: object[] = [
  { elementType: "geometry", stylers: [{ color: "#f5ede0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3a1f0e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#faf6ef" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#2b1507" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8d8c0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f0e0c8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8c89a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#ca922b" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9b99a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8b6e4e" }] },
];

// Haversine distance in km between two lat/lng points
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Legend tile definitions
const LEGEND_TILES = [
  { key: "business", color: "#CA922B", shape: "circle",   label: "Businesses" },
  { key: "destinations", color: "#2563A8", shape: "diamond", label: "Travel Destinations" },
  { key: "cultural", color: "#92400E", shape: "diamond",  label: "Cultural Sites" },
  { key: "hbcu",     color: "#7C3AED", shape: "diamond",  label: "HBCUs" },
  { key: "festival", color: "#C8960C", shape: "diamond",  label: "Festivals" },
  { key: "events",   color: "#EA580C", shape: "diamond",  label: "Community Events" },
  { key: "market",   color: "#16A34A", shape: "diamond",  label: "Markets" },
  { key: "art",      color: "#0891B2", shape: "diamond",  label: "Public Art" },
  { key: "sundown",  color: "#7F1D1D", shape: "triangle", label: "Sundown Town History" },
] as const;

export default function MapPage() {
  const [, navigate] = useLocation();
  // Load ALL geolocated businesses — uses dedicated map-pins endpoint (no 200-row cap)
  const [mapPins, setMapPins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapSupportScope, setMapSupportScope] = useState<"all_businesses" | null>(null);
  const [mapRefreshGeneration, setMapRefreshGeneration] = useState(0);
  const [savedDesignations, setSavedDesignations] = useState<string[]>([]);
  const [supportLensError, setSupportLensError] = useState<string | null>(null);
  useEffect(() => {
    const base = BASE.replace(/\/$/, "");
    const query = mapSupportScope ? `?supportScope=${mapSupportScope}` : "";
    fetch(`${base}/api/businesses/map-pins${query}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { pins: [] })
      .then((d: { pins?: any[] }) => { setMapPins(d.pins ?? []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [mapSupportScope, mapRefreshGeneration]);
  useEffect(() => {
    fetch(`${BASE.replace(/\/$/, "")}/api/kinfolk/preferences`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const prefs = payload?.preferences;
        const values = Array.isArray(prefs?.preferredOwnershipTypes)
          ? prefs.preferredOwnershipTypes
          : Array.isArray(prefs?.ownershipTypes) ? prefs.ownershipTypes : [];
        if (prefs?.supportLensMode === "strict_documented_designations") setSavedDesignations(values);
      })
      .catch(() => {});
  }, []);
  const removeMapDesignation = async (designation: string) => {
    setSupportLensError(null);
    const result = await persistReducedSupportLensRemoval({
      baseUrl: `${BASE.replace(/\/$/, "")}/`, savedDesignations, removeDesignation: designation,
    });
    if (result.error) {
      setSupportLensError(result.error);
    } else {
      const update = result.update;
      setSavedDesignations(update.preferredOwnershipTypes);
      setMapSupportScope(update.preferredOwnershipTypes.length ? null : "all_businesses");
      setMapRefreshGeneration((generation) => generation + 1);
      setUniversalResults(null);
    }
  };
  const { data: authData } = useGetCurrentAuthUser();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap>(null);
  const markersRef = useRef<Map<string, GMarker>>(new Map());
  const infoWindowRef = useRef<GInfoWindow>(null);
  const directionsRendererRef = useRef<any>(null);

  // Two-phase map readiness:
  //   gmLoaded = Google Maps JS API is available in window.google.maps
  //   ready    = map *object* is created and stored in mapRef.current
  // Effects that need mapRef.current (handoff, discoverability pins, etc.)
  // must guard on `ready`, not `gmLoaded`, so they never race against a null ref.
  const [gmLoaded, setGmLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routingBizId, setRoutingBizId] = useState<string | null>(null);
  // The universal API response is the sole source for non-business pins and
  // the category side panel. Never blend in a second global collection here.
  const [culturalSites, setCulturalSites] = useState<UniversalMapEntity[]>([]);
  const culturalMarkersRef = useRef<GMarker[]>([]);
  // Local search pin layer — separate from global discovery markers.
  // Cleared whenever a new local search begins or the search is reset.
  const localSearchMarkersRef = useRef<GMarker[]>([]);

  // Essential Services is an explicit, on-demand availability layer. It never
  // enters mapPins, the MWM directory, or recommendation scoring.
  const essentialServiceMarkersRef = useRef<GMarker[]>([]);

  // Sundown towns — available through the compact historical-context selector.
  const [sundownTowns, setSundownTowns] = useState<SundownTown[]>([]);
  const sundownMarkersRef = useRef<GMarker[]>([]);

  // Kept as an empty compatibility layer while the legacy marker effect winds
  // down below; event records are now rendered from `culturalSites` only.
  type MapEvent = {
    id: string; title: string; city: string; state: string;
    latitude: string | null; longitude: string | null;
    category: string; date?: string | null; location?: string | null;
    isFree?: boolean | null;
  };
  const [mapEvents] = useState<MapEvent[]>([]);
  const eventMarkersRef = useRef<GMarker[]>([]);

  // User's confirmed geolocation — set when browser grants permission
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  // A profile home city is useful when a member declines precise location. It is
  // still a local starting point, never permission to populate the whole map.
  const [profileCoords, setProfileCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Sidebar + legend filter state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [legendFilter, setLegendFilter] = useState<string | null>(null);
  const [showAddPlace, setShowAddPlace] = useState(false);
  // Business search must be explicitly triggered — map does not auto-populate businesses
  const [businessSearchActive, setBusinessSearchActive] = useState(false);
  // A broad collection is useful for intentional travel planning, but it is not
  // the default map experience. Normal map use remains close to the member's
  // confirmed location or a place they explicitly searched for.
  const exploreAllAreas = false;
  // Historical sundown-town records are intentionally opt-in. They remain
  // searchable and never represent a current safety rating.
  const [showSundownLayer, setShowSundownLayer] = useState(false);

  // ── Directory-to-map handoff — reads ?q= from the URL ───────────────────────
  // When the directory links to /map?q=restaurant%20in%20Phuket, the map must
  // automatically run the universal search and pan to Phuket instead of
  // defaulting to the member's home city. Applied exactly once per distinct query.
  const locationSearch = useSearch();
  const handoffQuery = useMemo(
    () => new URLSearchParams(locationSearch).get("q")?.trim() ?? "",
    [locationSearch],
  );
  // ?area=charlotte-nc — resolved via /api/locations/resolve to set detectedLocation,
  // which then activates LocalBusinessResults for the business results section.
  const handoffArea = useMemo(
    () => new URLSearchParams(locationSearch).get("area")?.trim() ?? "",
    [locationSearch],
  );
  const appliedHandoffQueryRef = useRef<string | null>(null);
  const appliedHandoffAreaRef = useRef<string | null>(null);
  // Prevent home-city geocoder and GPS from overriding a user-initiated search viewport
  const searchViewportLockedRef = useRef(false);
  const searchViewportSequenceRef = useRef(0);

  // ── Discoverability pins — tour cultural sites, recurring events, orgs ───────
  type DiscoverabilityPin = {
    id: string; sourceType: "tour_cultural_site" | "recurring_event" | "community_organization";
    name: string; city: string; state: string | null;
    latitude: number; longitude: number;
    description?: string | null; detailPath: string;
  };
  const [discoverabilityPins, setDiscoverabilityPins] = useState<DiscoverabilityPin[]>([]);
  const discoverabilityMarkersRef = useRef<GMarker[]>([]);

  // Nearby is the default. Members may deliberately broaden it through the
  // existing control, but a newly opened map never starts as a national list.
  const [nearMeRadius, setNearMeRadius] = useState<number | null>(25);

  // Additive map discovery focus. This only groups the real, already-local
  // records shown on the map; it does not hide data permanently or infer a
  // member's identity, health, budget, or other sensitive attributes.
  const [mapDiscoveryFocus, setMapDiscoveryFocus] = useState<MapDiscoveryFocus>("all");
  const [essentialServiceCategory, setEssentialServiceCategory] = useState<MapEssentialServiceCategory | null>(null);
  const [essentialServicePlaces, setEssentialServicePlaces] = useState<EssentialServicePlace[]>([]);
  const [essentialServicesLoading, setEssentialServicesLoading] = useState(false);
  const [essentialServicesError, setEssentialServicesError] = useState<string | null>(null);

  // Tracks whether the user explicitly denied location permission so we can
  // show a retry prompt instead of silently falling back to homeCity.
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);

  // Universal Search — populated on explicit submit; null = client-side filtering
  const [universalResults, setUniversalResults] = useState<UniversalSearchResult & {
    namedBusinessNotFound?: boolean; namedBusinessMessage?: string; namedBusinessNextActions?: string[];
    heritageGeoExpansion?: string; heritageGeoMessage?: string;
    libraryTopicQueued?: boolean; libraryQueueMessage?: string;
  } | null>(null);
  const [universalLoading, setUniversalLoading] = useState(false);

  // Detected geography from the last natural-language search.
  // Used to pan the map and show honest zero-result messaging.
  // PRODUCT RULE: this contains ONLY WHERE — never business/place data.
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number; lng: number; name: string;
  } | null>(null);

  const activeLocalScope = useMemo(() => {
    if (detectedLocation) return { lat: detectedLocation.lat, lng: detectedLocation.lng, label: detectedLocation.name };
    if (userCoords) return { lat: userCoords.lat, lng: userCoords.lng, label: "your location" };
    if (profileCoords) return { lat: profileCoords.lat, lng: profileCoords.lng, label: "your home area" };
    return null;
  }, [detectedLocation, profileCoords, userCoords]);

  const clearEssentialServices = useCallback(() => {
    essentialServiceMarkersRef.current.forEach((marker) => marker.setMap(null));
    essentialServiceMarkersRef.current = [];
    setEssentialServiceCategory(null);
    setEssentialServicePlaces([]);
    setEssentialServicesError(null);
  }, []);

  const loadEssentialServices = useCallback(async (category: MapEssentialServiceCategory) => {
    if (!activeLocalScope) {
      setEssentialServicesError("Use your location or search a city before looking for public services.");
      return;
    }
    const radius = Math.min(25, Math.max(1, nearMeRadius ?? 10));
    setEssentialServiceCategory(category);
    setEssentialServicesLoading(true);
    setEssentialServicesError(null);
    setEssentialServicePlaces([]);
    essentialServiceMarkersRef.current.forEach((marker) => marker.setMap(null));
    essentialServiceMarkersRef.current = [];

    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
      const params = new URLSearchParams({
        category,
        lat: String(activeLocalScope.lat),
        lng: String(activeLocalScope.lng),
        radius: String(radius),
      });
      const response = await fetch(`${apiBase}/api/map/essential-services?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Public services are unavailable right now.");
      }
      const payload = await response.json() as EssentialServicesResponse;
      if (payload.category !== category || !Array.isArray(payload.places)) {
        throw new Error("Public services returned an unexpected response.");
      }
      setEssentialServicePlaces(payload.places);
    } catch (error) {
      setEssentialServicesError(error instanceof Error ? error.message : "Public services are unavailable right now.");
    } finally {
      setEssentialServicesLoading(false);
    }
  }, [activeLocalScope, nearMeRadius]);

  // A location change invalidates the prior on-demand availability view. The
  // old facilities are removed instead of being silently re-used elsewhere.
  useEffect(() => {
    clearEssentialServices();
  }, [activeLocalScope?.lat, activeLocalScope?.lng, clearEssentialServices]);

  const isWithinActiveLocalScope = useCallback((latitude: number, longitude: number, radiusMiles = 50) => {
    if (exploreAllAreas) return true;
    if (!activeLocalScope) return false;
    return haversineKm(activeLocalScope.lat, activeLocalScope.lng, latitude, longitude) <= radiusMiles * 1.60934;
  }, [activeLocalScope, exploreAllAreas]);

  const visibleCulturalSites = useMemo(
    () => culturalSites.filter((site) => isWithinActiveLocalScope(site.latitude, site.longitude)),
    [culturalSites, isWithinActiveLocalScope],
  );

  const visibleSundownTowns = useMemo(
    () => sundownTowns.filter((town) => isWithinActiveLocalScope(town.latitude, town.longitude)),
    [sundownTowns, isWithinActiveLocalScope],
  );

  // Parses structured phrases like "Black-owned grocery stores in Atlanta"
  // into discrete API parameters so the business endpoint returns real results
  // instead of a universal-search zero-result fallback.
  function parseMapSearchPhrase(input: string): {
    search: string; city?: string; ownership?: "black-owned"; category?: string;
  } {
    const lower = input.toLowerCase().trim();
    const cityMatch = lower.match(/\bin\s+([a-z][a-z .'-]+?)(?:\s*$|\s+(?:near|around)\b)/);
    const city = cityMatch?.[1]?.trim().replace(/[.,]+$/, "");
    const ownership: "black-owned" | undefined = /\bblack[- ]owned\b/i.test(input) ? "black-owned" : undefined;
    const category =
      /\bgrocery\s+stores?\b/i.test(input) ? "Grocery" :
      /\brestaurants?\b|\bdining\b/i.test(input) ? "Food" :
      /\bbarber|salon|beauty\b/i.test(input) ? "Beauty & Personal Care" :
      undefined;
    const search = input
      .replace(/\bblack[- ]owned\b/gi, "")
      .replace(/\bgrocery\s+stores?\b/gi, "")
      .replace(/\bin\s+[a-z][a-z .'-]+?\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return { search, city, ownership, category };
  }

  // Universal Search — triggered on Enter or button click.
  //
  // ARCHITECTURE:
  //   Step 1 — geo-extract: parse "WHERE" from the natural query
  //             ("Phuket restaurants" → WHERE=Phuket, WHAT=restaurants)
  //             Geocode ONLY the WHERE portion via Nominatim. Pan map.
  //   Step 2 — MWM DB search: query our database with the full phrase +
  //             detected coordinates so Pass 2.5 (city detection) and
  //             geo-radius filtering both apply.
  //   Step 3 — display ONLY MWM records. Never surface Nominatim POIs.
  //
  // geocodeAndPan (the old single-step approach) sent the full phrase
  // "Phuket restaurants" to Nominatim, which returned a restaurant
  // named "Phuket" in Oslo. This is the fix.

  // Fits the map canvas to the bounding box of returned MWM business coordinates.
  // Returns true if at least one valid coordinate was found and the map was moved.
  // Locks searchViewportLockedRef so subsequent home-city/GPS callbacks cannot
  // override the search-result viewport.
  const fitMapToBusinessResults = useCallback((businesses: any[]) => {
    const g = (window as any).google?.maps;
    const map = mapRef.current;
    if (!g || !map) return false;

    const points = businesses
      .map((business) => ({
        lat: Number(business.latitude),
        lng: Number(business.longitude),
      }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)
        && !(point.lat === 0 && point.lng === 0));

    if (points.length === 0) return false;

    searchViewportLockedRef.current = true;
    const sequence = ++searchViewportSequenceRef.current;

    if (points.length === 1) {
      map.panTo(points[0]);
      map.setZoom(14);
      return true;
    }

    const bounds = new g.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 84, right: 32, bottom: 48, left: 352 });

    g.event.addListenerOnce(map, "idle", () => {
      if (searchViewportSequenceRef.current === sequence && (map.getZoom() ?? 0) > 14) {
        map.setZoom(14);
      }
    });
    return true;
  }, []);

  const runUniversalSearch = useCallback(async (queryOverride?: string) => {
    const q = (queryOverride ?? search).trim();
    if (!q || q.length < 2) return;
    const localIntent = parseLocalMapSearch(q);
    // Lock synchronously, before geo-extract awaits, so an older asynchronous
    // browser GPS callback can never recenter over a city or ZIP the member typed.
    if (localIntent.city) searchViewportLockedRef.current = true;
    // A direct search is always the current intent. Remove any optional public
    // facility availability pins instead of blending them into its result set.
    clearEssentialServices();
    setBusinessSearchActive(true);
    // A direct request always takes precedence over an exploratory grouping.
    setMapDiscoveryFocus("all");
    setUniversalResults(null);
    setUniversalLoading(true);
    setDetectedLocation(null);

    const apiBase = import.meta.env.VITE_API_URL ?? "";

    // Step 1 — geography extraction + map pan
    // Sends q to /api/maps/geo-extract which strips intent words (e.g.
    // "restaurants"), geocodes only the geographic portion, validates the
    // Nominatim result is a real place (not an amenity), and returns lat/lng.
    let geoLat: number | null = null;
    let geoLng: number | null = null;
    let geoName: string | null = null;
    if (!localIntent.usesDeviceLocation) {
      try {
        const geoRes = await fetch(
          `${apiBase}/api/maps/geo-extract?q=${encodeURIComponent(
            localIntent.city ? `${localIntent.city}${localIntent.stateCode ? `, ${localIntent.stateCode}` : ""}` : q,
          )}`,
          { credentials: "include" }
        );
        if (geoRes.ok) {
          const gd = await geoRes.json() as {
            hasLocation: boolean; locationQuery: string | null;
            contentQuery: string; lat: number | null; lng: number | null;
          };
          if (gd.hasLocation && typeof gd.lat === "number" && typeof gd.lng === "number") {
            geoLat = gd.lat;
            geoLng = gd.lng;
            geoName = gd.locationQuery ?? null;
            setDetectedLocation({ lat: gd.lat, lng: gd.lng, name: gd.locationQuery ?? q });
            if (mapRef.current) {
              mapRef.current.panTo({ lat: gd.lat, lng: gd.lng });
              mapRef.current.setZoom(12);
            }
          }
        }
      } catch { /* geo-extract failed — map stays at current position, search continues */ }
    }

    // Step 2 — search MWM database only
    // Pass the normalized current-turn subject to universal search and detected
    // coordinates for ranking. The governed local endpoint below is the only
    // source for the nearby list and its validated pin subset.
    try {
      const p = new URLSearchParams({
        q: localIntent.subject,
        surface: "smart_search",
        privacy_mode: "discovery_v1",
        limit: "20",
      });
      if (geoLat !== null && geoLng !== null) {
        // Override user GPS coords with the detected location so the MWM DB
        // search is geo-bounded around the identified city/region.
        // radius=50: wider than the near-me default (25 mi) so international
        // cities (Phuket province, Jamaica, etc.) are fully covered.
        p.set("lat", String(geoLat));
        p.set("lng", String(geoLng));
        p.set("radius", "50");
        // NOTE: we intentionally do NOT pass city= here. The geo-filter alone
        // (lat/lng + radius=50) is better for international searches: Phuket
        // businesses are stored as "Phuket Town", "Patong", "Karon" — city=Phuket
        // would AND-filter to only ILIKE '%Phuket%' matches, excluding Patong/Karon.
        // The radius covers the full region regardless of how each sub-area is named.
      } else if (userCoords && localIntent.usesDeviceLocation) {
        p.set("lat", String(userCoords.lat));
        p.set("lng", String(userCoords.lng));
      }
      const res = await fetch(`${apiBase}/api/search/universal?${p}`, { credentials: "include" });
      if (res.ok) {
        const payload = await res.json();
        const universalBusinesses: any[] = payload?.results?.businesses ?? [];

        // Phrase-search fallback: when universal search returns 0 businesses for a
        // structured phrase ("Black-owned grocery stores in Atlanta"), also call the
        // direct businesses endpoint with parsed ownership/category/city params.
        let phraseBusinesses: any[] = [];
        if (universalBusinesses.length === 0) {
          try {
            const parsed = parseMapSearchPhrase(q);
            if (parsed.ownership || parsed.category || parsed.city) {
              const bp = new URLSearchParams({ limit: "200" });
              if (parsed.search) bp.set("search", parsed.search);
              if (parsed.city) bp.set("city", parsed.city);
              if (parsed.ownership) bp.set("ownership", parsed.ownership);
              if (parsed.category) bp.set("category", parsed.category);
              if (mapSupportScope) bp.set("supportScope", mapSupportScope);
              const bizRes = await fetch(`${apiBase}/api/businesses?${bp}`, { credentials: "include" });
              if (bizRes.ok) {
                const bizPayload = await bizRes.json();
                phraseBusinesses = Array.isArray(bizPayload.businesses) ? bizPayload.businesses : [];
              }
            }
          } catch { /* phrase fallback failed — continue with universal results */ }
        }

        const finalBusinesses = phraseBusinesses.length > 0 ? phraseBusinesses : universalBusinesses;
        const finalPayload = phraseBusinesses.length > 0
          ? {
              ...payload,
              results: { ...payload.results, businesses: phraseBusinesses },
              totalResults: phraseBusinesses.length,
              fallbackMessage: null,
            }
          : payload;

        setUniversalResults(finalPayload);

        // Fit canvas to MWM results so the viewport reflects where businesses
        // actually are, not just the geocoded city center.
        // When coordinates are available, LocalBusinessResults.onPinsChange → applyLocalMapViewport
        // manages the business viewport. Skip fitMapToBusinessResults to avoid overriding it.
        const useLocalSearch = (geoLat !== null && geoLng !== null) || (userCoords !== null && localIntent.usesDeviceLocation === true);
        if (!useLocalSearch) {
          const fitted = fitMapToBusinessResults(finalBusinesses);
          if (!fitted && geoLat !== null && geoLng !== null && mapRef.current) {
            // No MWM records with valid coords — keep the geocoded pan.
            searchViewportLockedRef.current = true;
            mapRef.current.panTo({ lat: geoLat, lng: geoLng });
            mapRef.current.setZoom(12);
          }
        } else if (!searchViewportLockedRef.current && geoLat !== null && geoLng !== null && mapRef.current) {
          // Geo-extract found a city; pan there for immediate feedback.
          // Local search will then fit to the 1-2 results via applyLocalMapViewport.
          mapRef.current.panTo({ lat: geoLat, lng: geoLng });
          mapRef.current.setZoom(12);
        }
      }
    } catch { /* fall through to client-side filtered list */ }
    finally { setUniversalLoading(false); }
  }, [search, userCoords, mapSupportScope, fitMapToBusinessResults, clearEssentialServices]);

  // ── Apply directory ?q= handoff exactly once after the map is ready ──────────
  // Effect runs when handoffQuery or map object readiness changes.
  // Guards with appliedHandoffQueryRef so a stable URL doesn't re-trigger the search.
  // NOTE: isLoading (initial business-data fetch) is intentionally NOT a guard here —
  // the handoff must fire as soon as the Google Maps object is ready, regardless of
  // whether the initial sidebar data has finished loading.
  useEffect(() => {
    if (!handoffQuery || !ready || !mapRef.current) return;
    if (appliedHandoffQueryRef.current === handoffQuery) return;

    appliedHandoffQueryRef.current = handoffQuery;
    setSidebarOpen(true);
    setLegendFilter("business");
    setSearch(handoffQuery);
    void runUniversalSearch(handoffQuery);
  }, [handoffQuery, ready, runUniversalSearch]);

  // ── Resolve ?area= handoff once after the map is ready ───────────────────
  // Parses a slug like "charlotte-nc" via /api/locations/resolve and sets
  // detectedLocation, which activates LocalBusinessResults in the sidebar.
  useEffect(() => {
    if (!handoffArea || !ready) return;
    if (appliedHandoffAreaRef.current === handoffArea) return;
    appliedHandoffAreaRef.current = handoffArea;
    const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    fetch(`${apiBase}/api/locations/resolve?q=${encodeURIComponent(handoffArea)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.latitude && data?.longitude) {
          const lat = Number(data.latitude);
          const lng = Number(data.longitude);
          setDetectedLocation({ lat, lng, name: data.label ?? handoffArea });
          if (mapRef.current && !searchViewportLockedRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(12);
          }
        }
      })
      .catch(() => { /* area resolve failed — continue without it */ });
  }, [handoffArea, ready]);

  // The legacy discoverability endpoint is intentionally not rendered here.
  // Its former pins were independent of the side panel and could point to
  // different data than the category count. The canonical entity collection
  // below owns all non-business rendering.
  useEffect(() => {
    if (!ready) return;
    discoverabilityMarkersRef.current.forEach((marker) => marker.setMap(null));
    discoverabilityMarkersRef.current = [];
    setDiscoverabilityPins([]);
  }, [ready]);

  // ── Render discoverability markers when pins load ─────────────────────────
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current || discoverabilityPins.length === 0) return;

    discoverabilityMarkersRef.current.forEach(m => m.setMap(null));
    discoverabilityMarkersRef.current = [];

    discoverabilityPins.forEach(pin => {
      if (isNaN(pin.latitude) || isNaN(pin.longitude)) return;
      if (pin.latitude === 0 && pin.longitude === 0) return;

      // Style by source type — reuse existing brand-consistent pin colors
      let color: string;
      let label: string;
      let path: string;
      if (pin.sourceType === "tour_cultural_site") {
        color = "#92400E"; label = "Heritage Site"; path = DIAMOND_PATH;
      } else if (pin.sourceType === "recurring_event") {
        color = "#EA580C"; label = "Recurring Event"; path = (g.SymbolPath?.CIRCLE ?? "CIRCLE");
      } else {
        color = "#D97706"; label = "Community Org"; path = DIAMOND_PATH;
      }

      const isCircle = pin.sourceType === "recurring_event";
      const marker: GMarker = new g.Marker({
        position: { lat: pin.latitude, lng: pin.longitude },
        map: mapRef.current,
        title: pin.name,
        icon: isCircle
          ? { path: g.SymbolPath.CIRCLE, scale: 6, fillColor: color, fillOpacity: 0.85, strokeColor: "#fff", strokeWeight: 1.5 }
          : { path: DIAMOND_PATH, scale: 1, fillColor: color, fillOpacity: 0.88, strokeColor: "#fff", strokeWeight: 1.5 },
        zIndex: 2,
      });

      marker.addListener("click", () => {
        if (pin.detailPath.startsWith("/") && !pin.detailPath.startsWith("//")) {
          navigate(pin.detailPath);
          return;
        }
        const snippet = (pin.description ?? "").slice(0, 120);
        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:4px 2px;min-width:180px;max-width:240px">
            <div style="margin-bottom:4px">
              <span style="background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">${label}</span>
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${pin.name}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:4px">${pin.city}${pin.state ? `, ${pin.state}` : ""}</div>
            ${snippet ? `<div style="font-size:11px;color:#3A1F0E;line-height:1.45;font-style:italic;margin-bottom:5px">${snippet}${snippet.length === 120 ? "…" : ""}</div>` : ""}
            <a href="${BASE}${pin.detailPath.replace(/^\//, "")}" style="font-size:11px;color:#CA922B;font-weight:bold;text-decoration:none;display:block;margin-top:2px">View Details →</a>
          </div>`
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      discoverabilityMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverabilityPins, navigate]);

  // ── Render explicit Essential Services availability pins ──────────────────
  useEffect(() => {
    const g = (window as any).google?.maps;
    const map = mapRef.current;
    if (!g || !map) return;

    essentialServiceMarkersRef.current.forEach((marker) => marker.setMap(null));
    essentialServiceMarkersRef.current = [];

    essentialServicePlaces.forEach((place) => {
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return;
      const directionsUrl = safePublicUrl(place.directionsUrl);
      const marker: GMarker = new g.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map,
        title: place.name,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#0F766E",
          fillOpacity: 0.94,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
        zIndex: 4,
      });
      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(
          `<div style="font-family:system-ui,sans-serif;padding:4px 2px;min-width:195px;max-width:260px">
            <div style="margin-bottom:5px"><span style="background:#CCFBF1;color:#115E59;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">PUBLIC SERVICE · GOOGLE MAPS</span></div>
            <div style="font-weight:700;font-size:14px;color:#2B1507;margin-bottom:3px;line-height:1.3">${escapeHtml(place.name)}</div>
            <div style="font-size:11px;color:#3A1F0E99;line-height:1.4;margin-bottom:6px">${escapeHtml(place.address)}</div>
            <div style="font-size:10px;color:#3A1F0EB3;line-height:1.4;margin-bottom:7px">Not an MWM listing, ownership designation, safety rating, or recommendation.</div>
            ${directionsUrl ? `<a href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#0F766E;font-weight:700;text-decoration:none">Open directions →</a>` : ""}
          </div>`,
        );
        infoWindowRef.current?.open(map, marker);
      });
      essentialServiceMarkersRef.current.push(marker);
    });

    return () => {
      essentialServiceMarkersRef.current.forEach((marker) => marker.setMap(null));
      essentialServiceMarkersRef.current = [];
    };
  }, [essentialServicePlaces]);

  // Discoverability marker visibility — responds to legendFilter
  useEffect(() => {
    if (!mapRef.current) return;
    discoverabilityMarkersRef.current.forEach((marker, i) => {
      const pin = discoverabilityPins[i];
      if (!pin) { marker.setMap(null); return; }
      let visible = true;
      if (legendFilter === "business") {
        visible = false;
      } else if (legendFilter === "events") {
        visible = pin.sourceType === "recurring_event";
      } else if (legendFilter !== null) {
        // cultural / hbcu / festival / market / art — show tour_cultural_site and community_organization
        visible = pin.sourceType !== "recurring_event";
      }
      marker.setMap(visible ? mapRef.current : null);
    });
  }, [legendFilter, discoverabilityPins]);

  const businesses = (mapPins as BizWithCoords[]).filter(
    (b) => b.latitude && b.longitude
  );

  const filtered = (() => {
    const base = businesses.filter((b) => {
      const tokens = search.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
      const fields = [b.name, b.city, b.state, b.category].map((f) => f?.toLowerCase() ?? "");
      const matchSearch = tokens.length === 0 || tokens.every((t) => fields.some((f) => f.includes(t)));
      // Nearby is the standard map rule. Precise device location wins; a
      // geocoded profile home keeps the view useful after a member declines it.
      // Only an explicit all-area exploration can bypass this local filter.
      const nearbyOrigin = userCoords ?? profileCoords;
      const matchNear = exploreAllAreas || nearMeRadius === null || !nearbyOrigin || (() => {
        const distKm = haversineKm(nearbyOrigin.lat, nearbyOrigin.lng, parseFloat(String(b.latitude)), parseFloat(String(b.longitude)));
        return distKm <= nearMeRadius * 1.60934; // convert miles → km
      })();
      return matchSearch && matchNear;
    });
    // Sort the local scope by distance, not by a national ordering.
    const nearbyOrigin = userCoords ?? profileCoords;
    if (!nearbyOrigin) return base;
    return [...base].sort((a, b) => {
      const dA = haversineKm(nearbyOrigin.lat, nearbyOrigin.lng, parseFloat(String(a.latitude)), parseFloat(String(a.longitude)));
      const dB = haversineKm(nearbyOrigin.lat, nearbyOrigin.lng, parseFloat(String(b.latitude)), parseFloat(String(b.longitude)));
      return dA - dB;
    });
  })();

  const discoveryCounts = useMemo(
    () => countMapDiscoveryFocuses(filtered),
    [filtered],
  );
  const isDiscoveryFilterActive = mapDiscoveryFocus !== "all";
  const mapDiscoveryRecords = useMemo(
    () => filtered.filter((business) => matchesMapDiscoveryFocus(business, mapDiscoveryFocus)),
    [filtered, mapDiscoveryFocus],
  );
  const displayedBusinessResults = useMemo(() => {
    const source = universalResults?.results?.businesses ?? mapDiscoveryRecords;
    return isDiscoveryFilterActive
      ? source.filter((business: any) => matchesMapDiscoveryFocus(business, mapDiscoveryFocus))
      : source;
  }, [isDiscoveryFilterActive, mapDiscoveryFocus, mapDiscoveryRecords, universalResults]);
  const discoveryScopeLabel = activeLocalScope?.label ?? "this map area";
  const activeDiscoveryLabel = isDiscoveryFilterActive
    ? discoveryCounts.find((focus) => focus.id === mapDiscoveryFocus)?.label ?? "Your selection"
    : "All nearby places";
  const activateMapDiscoveryFocus = useCallback((focus: MapDiscoveryFocus) => {
    // A discovery card is an intentional, reversible map filter. It never
    // changes listings, pins, saves, or the member's stored preferences.
    setSearch("");
    setUniversalResults(null);
    setDetectedLocation(null);
    setMapDiscoveryFocus(focus);
    setBusinessSearchActive(true);
    setLegendFilter("business");
    setSidebarOpen(true);
  }, []);

  // One canonical `items` array drives every non-business pin and its matching
  // category row. A panel can never truthfully show zero while these records
  // remain visible as an unrelated marker layer.
  useEffect(() => {
    if (!ready) return;
    if (!activeLocalScope && !exploreAllAreas) {
      setCulturalSites([]);
      return;
    }
    const base = BASE.replace(/\/$/, "");
    const loadEntities = (url: string): Promise<{ items?: UniversalMapEntity[] }> =>
      fetch(url, { credentials: "include" })
        .then((response) => response.ok ? response.json() as Promise<{ items?: UniversalMapEntity[] }> : { items: [] })
        .catch(() => ({ items: [] }));
    Promise.all([
      loadEntities(`${base}/api/map/entities`),
      loadEntities(`${base}/api/map/entities?kind=travel_destination&limit=600`),
    ])
      .then(([general, destinations]) => {
        return [...(general.items ?? []), ...(destinations.items ?? [])];
      })
      .then((items) => setCulturalSites([...new Map(items.map((item) => [item.id, item])).values()]))
      .catch(() => {});
  }, [activeLocalScope, exploreAllAreas, ready]);

  // Older event markers used a separate endpoint from the category panel.
  // Clear any prior instances; recurring events now arrive through the same
  // universal collection as festivals, markets, art, HBCUs, and cultural sites.
  useEffect(() => {
    if (!ready) return;
    eventMarkersRef.current.forEach((marker) => marker.setMap(null));
    eventMarkersRef.current = [];
  }, [ready]);

  // Render cultural site markers whenever sites load
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;
    culturalMarkersRef.current.forEach((m) => m.setMap(null));
    culturalMarkersRef.current = [];
    if (visibleCulturalSites.length === 0) return;

    visibleCulturalSites.forEach((site) => {
      const lat = site.latitude;
      const lng = site.longitude;
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getCulturalPinColor(site);
      const label = getCulturalPinLabel(site);

      const marker: GMarker = new g.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: site.title,
        icon: {
          path: DIAMOND_PATH,
          scale: 1,
          fillColor: color,
          fillOpacity: 0.92,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
        zIndex: 2,
      });

      marker.addListener("click", () => {
        // A first-party detail path is the canonical MWM profile for this pin.
        // Keep informational windows only for entities without such a profile.
        if (site.detail_url.startsWith("/") && !site.detail_url.startsWith("//")) {
          navigate(site.detail_url);
          return;
        }
        const snippet = (site.summary ?? "").slice(0, 120);
        const actionLabel = site.entity_kind === "travel_destination" ? "View planning reference" : "Learn more on MWM";
        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:4px 2px;min-width:180px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">${escapeHtml(label)}</span>
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${escapeHtml(site.title)}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:4px">${escapeHtml(site.city)}${site.entity_kind === "travel_destination" && site.country_code ? `, ${escapeHtml(site.country_code)}` : site.state_region ? `, ${escapeHtml(site.state_region)}` : ""}</div>
            ${snippet ? `<div style="font-size:11px;color:#3A1F0E;line-height:1.45;font-style:italic;margin-bottom:5px">${escapeHtml(snippet)}${snippet.length === 120 ? "…" : ""}</div>` : ""}
            <a href="${escapeHtml(site.detail_url)}" style="font-size:11px;color:#CA922B;font-weight:bold;text-decoration:none;display:block;margin-top:2px">${actionLabel} →</a>
          </div>`
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      culturalMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCulturalSites, navigate]);

  // Cultural marker visibility — responds to legendFilter changes
  useEffect(() => {
    if (!mapRef.current) return;
    culturalMarkersRef.current.forEach((marker, i) => {
      const site = visibleCulturalSites[i];
      if (!site) { marker.setMap(null); return; }
      const visible =
        legendFilter !== "business" &&
        (legendFilter === null
          ? site.entity_kind !== "travel_destination"
          : siteMatchesFilter(site, legendFilter));
      marker.setMap(visible ? mapRef.current : null);
    });
  }, [legendFilter, visibleCulturalSites]);

  // ── Historical Sundown Towns layer ──────────────────────────────────────────
  // ALWAYS ON — layer is never hidden per Gate 5 Map UX Spec rule #2.
  // Amber (#B8860B) upward triangles, confidence-classified shapes.

  useEffect(() => {
    if (!ready) return;
    if (!activeLocalScope && !exploreAllAreas) {
      setSundownTowns([]);
      return;
    }
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/sundown-towns`)
      .then((r) => r.json())
      .then((d: any) => { if (Array.isArray(d.towns)) setSundownTowns(d.towns as SundownTown[]); })
      .catch(() => {});
  }, [activeLocalScope, exploreAllAreas, ready]);

  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;

    // Clear previous markers before re-rendering
    sundownMarkersRef.current.forEach((m) => m.setMap(null));
    sundownMarkersRef.current = [];
    if (!showSundownLayer || visibleSundownTowns.length === 0) return;

    visibleSundownTowns.forEach((town) => {
      if (isNaN(town.latitude) || isNaN(town.longitude)) return;
      const color = getSundownColor(town.current_state);
      const fillOpacity = getSundownFillOpacity(town.current_state, town.confidence_level);
      const scale = getSundownScale(town.current_state);
      const isPossible = town.confidence_level === "possible";

      const marker: GMarker = new g.Marker({
        position: { lat: town.latitude, lng: town.longitude },
        map: mapRef.current,
        title: town.name,
        icon: {
          path: TRIANGLE_PATH,
          scale,
          fillColor: color,
          fillOpacity,
          strokeColor: color,
          strokeWeight: isPossible ? 2 : 1.5,
          strokeOpacity: town.current_state === "current_faded" ? 0.3 : 0.9,
        },
        zIndex: 1, // below business pins and heritage pins
      });

      marker.addListener("click", () => {
        const confidenceLabel = getConfidenceLabel(town.confidence_level);
        const evidence = town.historical_evidence
          ? `<div style="font-size:11px;color:#3A1F0E;line-height:1.45;margin-bottom:8px">${town.historical_evidence.slice(0, 200)}${town.historical_evidence.length > 200 ? "…" : ""}</div>`
          : "";
        const timePeriod = town.time_period
          ? `<div style="font-size:10px;color:#92691E;font-weight:600;margin-bottom:6px">Era: ${town.time_period}</div>`
          : "";

        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:6px 2px;min-width:220px;max-width:280px">
            <div style="margin-bottom:5px">
              <span style="background:#B8860B18;color:#92691E;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;font-family:sans-serif;letter-spacing:0.04em">▲ Historical Context</span>
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${town.name}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:5px">${town.city}, ${town.state}</div>
            <div style="display:inline-block;font-size:9px;font-weight:700;background:#B8860B12;color:#92691E;border:1px solid #B8860B30;border-radius:4px;padding:1px 6px;margin-bottom:8px">${confidenceLabel}</div>
            <div style="font-size:11px;color:#3A1F0E;line-height:1.5;font-style:italic;margin-bottom:8px;padding:8px;background:#B8860B06;border-left:2px solid #B8860B50;border-radius:0 6px 6px 0">This location has a documented history of restricting the movement or residency of people of color. This indicator reflects historical practices and does not represent current conditions.</div>
            ${timePeriod}${evidence}
            <div style="font-size:9px;color:#3A1F0E40;border-top:1px solid #3A1F0E08;padding-top:6px;margin-top:2px;line-height:1.4">Source: Tougaloo College / Loewen (2005) · Rigby et al. (2025, Scientific Data)<br>This indicator reflects documented history, not a current safety rating.</div>
          </div>`
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      sundownMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSundownLayer, visibleSundownTowns]);

  // Render event markers from the events table
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current || mapEvents.length === 0) return;
    eventMarkersRef.current.forEach((m) => m.setMap(null));
    eventMarkersRef.current = [];
    const shouldShow = legendFilter === null || legendFilter === "events";

    mapEvents.forEach((evt) => {
      const lat = parseFloat(evt.latitude ?? "");
      const lng = parseFloat(evt.longitude ?? "");
      if (isNaN(lat) || isNaN(lng)) return;

      const marker: GMarker = new g.Marker({
        position: { lat, lng },
        map: shouldShow ? mapRef.current : null,
        title: evt.title,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#EA580C",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
        zIndex: 3,
      });

      marker.addListener("click", () => {
        // Recenter map to event location so user sees it in context
        if (mapRef.current && evt.latitude && evt.longitude) {
          mapRef.current.panTo({ lat: parseFloat(String(evt.latitude)), lng: parseFloat(String(evt.longitude)) });
          mapRef.current.setZoom(14);
        }
        const dateStr = evt.date
          ? new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "";
        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:4px 2px;min-width:180px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="background:#EA580C22;color:#EA580C;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">${evt.category}</span>
              ${evt.isFree ? '<span style="background:#16A34A22;color:#16A34A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">Free</span>' : ""}
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${evt.title}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:4px">${evt.city}, ${evt.state}</div>
            ${evt.location ? `<div style="font-size:11px;color:#3A1F0E;margin-bottom:2px">${evt.location}</div>` : ""}
            ${dateStr ? `<div style="font-size:11px;color:#EA580C;font-weight:600;margin-top:2px">${dateStr}</div>` : ""}
          </div>`,
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      eventMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapEvents]);

  // Event marker visibility — responds to legendFilter
  useEffect(() => {
    if (!mapRef.current) return;
    const visible = legendFilter === null || legendFilter === "events";
    eventMarkersRef.current.forEach((m) => m.setMap(visible ? mapRef.current : null));
  }, [legendFilter, mapEvents]);

  // Sundown town marker visibility — independent toggle, never affected by legendFilter
  useEffect(() => {
    if (!mapRef.current) return;
    sundownMarkersRef.current.forEach((m) => m.setMap(showSundownLayer ? mapRef.current : null));
  }, [showSundownLayer, visibleSundownTowns]);

  // Subscription check
  useEffect(() => {
    if (!authData?.user) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/stripe/subscription`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: any) => {
        if (d.subscription && ["active", "trialing"].includes(d.subscription.status)) setIsPaidMember(true);
      })
      .catch(() => {});
  }, [authData?.user]);

  // Load Google Maps JS
  useEffect(() => {
    if (gmLoaded) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/maps/js-key`)
      .then((r) => r.json())
      .then(({ key }: { key?: string }) => {
        if (!key) { setApiKeyError(true); return; }
        if (document.getElementById("gmaps-script")) { setGmLoaded(true); return; }
        (window as any).__mwmMapInit = () => setGmLoaded(true);
        (window as any).gm_authFailure = () => setApiKeyError(true);
        const script = document.createElement("script");
        script.id = "gmaps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=__mwmMapInit`;
        script.async = true;
        script.onerror = () => setApiKeyError(true);
        document.head.appendChild(script);
      })
      .catch(() => setApiKeyError(true));
  }, []);

  // Initialize map
  useEffect(() => {
    // Allow early initialization when a ?q= handoff query is waiting — the handoff
    // must fire as soon as the map object exists, not after the mapPins fetch completes.
    // Without this guard bypass, /map?q=... stalls 10+ seconds waiting for isLoading=false.
    if (!gmLoaded || !mapDivRef.current || (isLoading && !handoffQuery)) return;

    if (mapRef.current) {
      // Map already initialized — place initial mapPins markers if the data just
      // arrived (happens when the map was created early, before isLoading=false).
      if (!isLoading && markersRef.current.size === 0) {
        const g = (window as any).google?.maps;
        if (g) {
          businesses.forEach((biz) => {
            const lat = parseFloat(String(biz.latitude));
            const lng = parseFloat(String(biz.longitude));
            if (isNaN(lat) || isNaN(lng)) return;
            const marker: GMarker = new g.Marker({
              position: { lat, lng },
              map: null,
              title: biz.name ?? "",
              icon: {
                path: g.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#CA922B",
                fillOpacity: 0.9,
                strokeColor: "#2B1507",
                strokeWeight: 2,
              },
            });
            marker.addListener("click", () => selectBusiness(biz.id, biz, marker));
            markersRef.current.set(biz.id, marker);
          });
        }
      }
      return;
    }

    const onGmError = (e: ErrorEvent) => {
      if (e.message?.toLowerCase().includes("invalidkey") || e.message?.toLowerCase().includes("google maps")) {
        setApiKeyError(true);
      }
    };
    window.addEventListener("error", onGmError, true);

    const g = (window as any).google?.maps;
    if (!g) { setApiKeyError(true); return; }

    try {
      // Start at US center so no city feels "default". We'll immediately move to
      // homeCity from the user's profile, and geolocation can override that.
      const US_CENTER = { lat: 38.5, lng: -96.5 };
      const map: GMap = new g.Map(mapDivRef.current, {
        center: US_CENTER,
        zoom: 4,
        styles: BRAND_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: g.ControlPosition.RIGHT_CENTER },
      });
      mapRef.current = map;
      // `ready` now means the map *object* exists — set it here, not in __mwmMapInit,
      // so every effect that guards on `ready` is guaranteed mapRef.current !== null.
      setReady(true);
      infoWindowRef.current = new g.InfoWindow();

      // ── Location priority: (1) profile homeCity, then (2) GPS override ─────
      // Start by centering on the user's home city immediately from their profile.
      const homeCity = (authData?.user as any)?.homeCity as string | null | undefined;
      // Skip home-city centering if a ?q= handoff search is active or a search
      // has already locked the viewport to its result coordinates.
      if (homeCity && !handoffQuery && !searchViewportLockedRef.current) {
        new g.Geocoder().geocode(
          { address: homeCity },
          (results: any[], status: string) => {
            if (!searchViewportLockedRef.current && status === "OK" && results?.[0]?.geometry?.location) {
              const location = results[0].geometry.location;
              map.setCenter(location);
              map.setZoom(12);
              setProfileCoords({ lat: location.lat(), lng: location.lng() });
            }
          },
        );
      }

      // Geolocation can further refine to the user's exact position if allowed,
      // but must not override a search-locked viewport.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!searchViewportLockedRef.current) {
              map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              map.setZoom(13);
            }
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => { setGeoPermissionDenied(true); /* denied — homeCity is already center */ },
          { timeout: 6_000, maximumAge: 120_000 },
        );
      }

      businesses.forEach((biz) => {
        const lat = parseFloat(String(biz.latitude));
        const lng = parseFloat(String(biz.longitude));
        if (isNaN(lat) || isNaN(lng)) return;

        const marker: GMarker = new g.Marker({
          position: { lat, lng },
          // Construct the marker now to retain its existing click-through
          // behavior. Its locality-first visibility is set below, so an
          // unscoped initial map never flashes country-wide pins.
          map: null,
          title: biz.name ?? "",
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#CA922B",
            fillOpacity: 0.9,
            strokeColor: "#2B1507",
            strokeWeight: 2,
          },
        });

        // A public business pin is a doorway to its MWM profile, whether the
        // place is claimed, unclaimed, minority-owned, or community-listed.
        // The detail page is where members can safely add experiences and help
        // prevent a duplicate listing; it is never replaced by an external URL.
        marker.addListener("click", () => navigate(`/businesses/${biz.id}`));
        markersRef.current.set(biz.id, marker);
      });
    } catch {
      setApiKeyError(true);
    }

    return () => window.removeEventListener("error", onGmError, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isLoading, handoffQuery, navigate]);

  const selectBusiness = useCallback((id: string, biz: BizWithCoords, marker?: GMarker) => {
    setSelected(id);
    setSidebarOpen(true);
    setLegendFilter(null); // switch sidebar to business view
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;

    const m = marker ?? markersRef.current.get(id);
    if (!m) return;

    const lat = parseFloat(String(biz.latitude));
    const lng = parseFloat(String(biz.longitude));
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);

    markersRef.current.forEach((mk, mid) => {
      mk.setIcon({
        path: g.SymbolPath.CIRCLE,
        scale: mid === id ? 10 : 8,
        fillColor: mid === id ? "#2B1507" : "#CA922B",
        fillOpacity: 0.9,
        strokeColor: mid === id ? "#CA922B" : "#2B1507",
        strokeWeight: 2,
      });
    });

    const isDemo = biz.description?.startsWith("[DEMO]") ?? false;
    infoWindowRef.current?.setContent(
      `<div style="font-family:serif;padding:4px 2px;min-width:160px">
        <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px">${biz.name ?? ""}</div>
        ${isDemo ? `<div style="display:inline-block;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;background:#fef3c7;color:#b45309;border:1px solid #fcd34d;border-radius:4px;padding:1px 6px;margin-bottom:4px">Demo Listing</div>` : ""}
        <div style="font-size:12px;color:#CA922B;font-weight:600;margin-bottom:2px">${biz.category ?? ""}</div>
        <div style="font-size:11px;color:#3A1F0E80">${biz.city ?? ""}, ${biz.state ?? ""}</div>
        <a href="/businesses/${biz.id}" style="font-size:11px;color:#CA922B;font-weight:bold;text-decoration:none;margin-top:4px;display:block">View Business →</a>
      </div>`
    );
    infoWindowRef.current?.open(mapRef.current, m);
  }, []);

  const resetView = useCallback(() => {
    setSelected(null);
    clearRoute();
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;
    mapRef.current.panTo(userCoords ?? { lat: 39.9526, lng: -75.1652 });
    mapRef.current.setZoom(userCoords ? 13 : 12);
    infoWindowRef.current?.close();
    markersRef.current.forEach((mk) => {
      mk.setIcon({
        path: g.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#CA922B",
        fillOpacity: 0.9,
        strokeColor: "#2B1507",
        strokeWeight: 2,
      });
    });
  }, [userCoords]);

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    setRouteInfo(null);
    setRoutingBizId(null);
  }, []);

  const handleDirections = useCallback((biz: BizWithCoords, e: React.MouseEvent) => {
    e.stopPropagation();
    const lat = parseFloat(String(biz.latitude));
    const lng = parseFloat(String(biz.longitude));

    if (!isPaidMember) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
      return;
    }

    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;
    setRoutingBizId(biz.id);

    const doRoute = (origin: any) => {
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new g.DirectionsRenderer({
          polylineOptions: { strokeColor: "#CA922B", strokeWeight: 5, strokeOpacity: 0.85 },
          suppressMarkers: false,
        });
      }
      directionsRendererRef.current.setMap(mapRef.current);
      new g.DirectionsService().route(
        { origin, destination: { lat, lng }, travelMode: g.TravelMode.DRIVING },
        (result: any, status: any) => {
          setRoutingBizId(null);
          if (status === "OK" && result) {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes?.[0]?.legs?.[0];
            setRouteInfo({ distance: leg?.distance?.text ?? "", duration: leg?.duration?.text ?? "", bizName: biz.name ?? "" });
            infoWindowRef.current?.close();
          }
        }
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doRoute({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => doRoute(mapRef.current!.getCenter())
      );
    } else {
      doRoute(mapRef.current.getCenter());
    }
  }, [isPaidMember]);

  // Business marker visibility — only shown after user explicitly submits a search
  useEffect(() => {
    if (!mapRef.current) return;
    const localSearchIntent = parseLocalMapSearch(search);
    const localSearchOwnsPins = businessSearchActive && (
      detectedLocation !== null || (userCoords !== null && localSearchIntent.usesDeviceLocation === true)
    );
    const showBiz = (businessSearchActive || isDiscoveryFilterActive) && Boolean(activeLocalScope || exploreAllAreas) && !localSearchOwnsPins && (!legendFilter || legendFilter === "business");
    // When universal search returned results, only show those businesses as markers
    const activeIds = new Set(displayedBusinessResults.map((business: any) => business.id as string));
    markersRef.current.forEach((marker, id) => {
      marker.setMap(showBiz && activeIds.has(id) ? mapRef.current : null);
    });
  }, [activeLocalScope, displayedBusinessResults, isDiscoveryFilterActive, legendFilter, businessSearchActive, exploreAllAreas, detectedLocation, userCoords, search]);

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const activeCulturalSites = legendFilter && legendFilter !== "business"
    ? visibleCulturalSites.filter((s) => siteMatchesFilter(s, legendFilter))
    : [];

  const legendTileLabel = LEGEND_TILES.find((t) => t.key === legendFilter)?.label ?? "";

  // ── MapViewportAdapter backed by the live Google Maps instance ──────────────
  // Passed to applyLocalMapViewport(makeMapAdapter(), area, pins) inside the
  // LocalBusinessResults onPinsChange callback. Keeps local search pins on their
  // own layer so they are never mixed with global discovery or business markers.
  function makeMapAdapter(): MapViewportAdapter {
    return {
      clearSearchPins() {
        localSearchMarkersRef.current.forEach((m) => m.setMap(null));
        localSearchMarkersRef.current = [];
      },
      renderSearchPins(pins: Array<{ id: string; latitude: number; longitude: number }>) {
        const g = (window as any).google?.maps;
        const map = mapRef.current;
        if (!g || !map) return;
        pins.forEach((pin) => {
          const marker = new g.Marker({
            position: { lat: pin.latitude, lng: pin.longitude },
            map,
            title: pin.id,
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#CA922B",
              fillOpacity: 1,
              strokeColor: "#2B1507",
              strokeWeight: 2.5,
            },
          });
          localSearchMarkersRef.current.push(marker);
        });
      },
      setView([lat, lng]: [number, number], zoom: number) {
        if (mapRef.current) { mapRef.current.panTo({ lat, lng }); mapRef.current.setZoom(zoom); }
      },
      fitBounds(
        [[minLat, minLng], [maxLat, maxLng]]: [[number, number], [number, number]],
        { maxZoom }: { padding: [number, number]; maxZoom: number },
      ) {
        const g = (window as any).google?.maps;
        const map = mapRef.current;
        if (!g || !map) return;
        const bounds = new g.LatLngBounds({ lat: minLat, lng: minLng }, { lat: maxLat, lng: maxLng });
        map.fitBounds(bounds, { top: 84, right: 32, bottom: 48, left: 352 });
        g.event.addListenerOnce(map, "idle", () => {
          if ((map.getZoom() ?? 0) > maxZoom) map.setZoom(maxZoom);
        });
        searchViewportLockedRef.current = true;
      },
    };
  }

  const renderSidebar = () => {
    // Content when a cultural legend filter is active
    const showingCultural = legendFilter && legendFilter !== "business";
    const showingDestinations = legendFilter === "destinations";

    return (
      <div className="w-80 shrink-0 flex flex-col border-r border-[#3A1F0E]/10 bg-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#3A1F0E]/8 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-serif font-bold text-[#2B1507] text-lg">
              {showingCultural ? legendTileLabel : "Explore the Map"}
            </h1>
            <button
              onClick={() => { setSidebarOpen(false); setLegendFilter(null); }}
              className="w-7 h-7 rounded-full bg-[#3A1F0E]/6 flex items-center justify-center hover:bg-[#3A1F0E]/12 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4 text-[#3A1F0E]/60" />
            </button>
          </div>

          {/* Search — only shown in business view */}
          {!showingCultural && (
            <>
              <div className="relative mb-3">
                <button
                  onClick={() => runUniversalSearch()}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-[#CA922B] transition-colors"
                  aria-label="Search"
                >
                  {universalLoading
                    ? <span className="w-4 h-4 block rounded-full border-2 border-[#CA922B]/30 border-t-[#CA922B] animate-spin" />
                    : <Search className="w-4 h-4 text-[#3A1F0E]/40" />}
                </button>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setMapDiscoveryFocus("all");
                    if (businessSearchActive) setBusinessSearchActive(false);
                    if (universalResults) setUniversalResults(null);
                    if (detectedLocation) setDetectedLocation(null);
                    localSearchMarkersRef.current.forEach((m) => m.setMap(null));
                    localSearchMarkersRef.current = [];
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") runUniversalSearch(); }}
                  placeholder="Search businesses, heritage, events — press Enter"
                  className="w-full pl-9 pr-8 py-2 text-sm bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50 text-[#3A1F0E] placeholder:text-[#3A1F0E]/40"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch(""); setMapDiscoveryFocus("all"); setBusinessSearchActive(false); setUniversalResults(null); setDetectedLocation(null);
                      localSearchMarkersRef.current.forEach((m) => m.setMap(null)); localSearchMarkersRef.current = [];
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-[#3A1F0E]/40" />
                  </button>
                )}
              </div>
              {/* Shortcut chips are deliberately omitted here. Typed search keeps
                  the same category, HBCU, market, and need-based discovery
                  coverage without turning the map into a wall of controls. */}
              <button
                type="button"
                onClick={() => setShowSundownLayer((visible) => !visible)}
                className={`mt-2 w-full text-left rounded-lg border px-3 py-2 text-[11px] leading-snug transition-colors ${
                  showSundownLayer
                    ? "border-[#7C6F64] bg-[#F5F1EC] text-[#3A1F0E]"
                    : "border-[#3A1F0E]/12 bg-white text-[#3A1F0E]/70 hover:border-[#7C6F64]/60"
                }`}
                aria-pressed={showSundownLayer}
              >
                <span className="font-bold">{showSundownLayer ? "Hide" : "Show"} nearby sundown-town history</span>
                <span className="block mt-0.5 text-[#3A1F0E]/55">Documented historical context only — not a current safety rating.</span>
              </button>
            </>
          )}
        </div>

        {showingDestinations && (
          <div className="px-4 py-3 border-b border-[#2563A8]/15 bg-[#EFF6FF] text-xs leading-relaxed text-[#1E3A5F]">
            <strong>Travel destinations — planning references.</strong> These pins use supplied destination coordinates; related references may share one city or regional node. They are not business listings and do not certify current safety or accessibility. Check current official travel guidance before travel.
          </div>
        )}

        {/* Location denied — show one-tap retry so user doesn't have to refresh */}
        {!showingCultural && !userCoords && geoPermissionDenied && (
          <div className="px-4 py-2 border-b border-[#3A1F0E]/6 shrink-0">
            <button
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    if (mapRef.current) {
                      mapRef.current.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      mapRef.current.setZoom(13);
                    }
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGeoPermissionDenied(false);
                  },
                  () => { /* still denied — keep prompt visible */ },
                  { timeout: 8_000, maximumAge: 0 },
                );
              }}
              className="flex items-center gap-2 text-[10px] font-bold text-[#CA922B] hover:text-[#B38024] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              Use My Location
            </button>
          </div>
        )}

        {!showingCultural && activeLocalScope && (
          <section
            aria-label="Around you map discovery"
            data-testid="map-discovery-card"
            className="px-4 py-3 border-b border-[#CA922B]/20 bg-gradient-to-br from-[#FFFDF8] to-[#FDF5E8] shrink-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#CA922B]" aria-hidden="true" />
                  <h2 className="font-serif font-bold text-[#2B1507] text-sm">Around you</h2>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-[#3A1F0E]/60">
                  {filtered.length} mapped {filtered.length === 1 ? "place" : "places"} within {nearMeRadius ?? 10} miles of {discoveryScopeLabel}.
                </p>
              </div>
              {isDiscoveryFilterActive && (
                <button
                  type="button"
                  onClick={() => activateMapDiscoveryFocus("all")}
                  className="shrink-0 text-[10px] font-bold text-[#CA922B] hover:text-[#9F6E16] hover:underline"
                >
                  Show all
                </button>
              )}
            </div>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/45">Start with what you need</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {discoveryCounts.filter((focus) => focus.count > 0).map((focus) => (
                <button
                  key={focus.id}
                  type="button"
                  onClick={() => activateMapDiscoveryFocus(focus.id)}
                  aria-pressed={mapDiscoveryFocus === focus.id}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                    mapDiscoveryFocus === focus.id
                      ? "border-[#CA922B] bg-[#CA922B] text-white"
                      : "border-[#CA922B]/25 bg-white text-[#3A1F0E]/70 hover:border-[#CA922B]/60 hover:text-[#CA922B]"
                  }`}
                >
                  {focus.count} {focus.label}
                </button>
              ))}
            </div>
            {discoveryCounts.every((focus) => focus.count === 0) && (
              <p className="mt-2 text-[11px] leading-snug text-[#3A1F0E]/55">
                Search a business, need, or city to see matching map results.
              </p>
            )}
            {isDiscoveryFilterActive && (
              <p data-testid="map-discovery-focus-explanation" className="mt-2 text-[10px] leading-snug text-[#3A1F0E]/55">
                Showing <strong className="text-[#3A1F0E]/75">{activeDiscoveryLabel.toLowerCase()}</strong> because you chose it. This grouping uses existing listing categories and tags; it does not replace a direct search.
              </p>
            )}

            <div className="mt-3 border-t border-[#0F766E]/15 pt-2.5" data-testid="essential-services-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Everyday essentials</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-[#3A1F0E]/55">
                    Look up public facilities within {Math.min(25, nearMeRadius ?? 10)} miles. This opens an availability layer, not an MWM recommendation.
                  </p>
                </div>
                {essentialServiceCategory && (
                  <button
                    type="button"
                    onClick={clearEssentialServices}
                    className="shrink-0 text-[10px] font-bold text-[#0F766E] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MAP_ESSENTIAL_SERVICE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => void loadEssentialServices(category.id)}
                    disabled={essentialServicesLoading}
                    aria-pressed={essentialServiceCategory === category.id}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                      essentialServiceCategory === category.id
                        ? "border-[#0F766E] bg-[#0F766E] text-white"
                        : "border-[#0F766E]/25 bg-white text-[#115E59] hover:border-[#0F766E]/60"
                    }`}
                  >
                    {essentialServicesLoading && essentialServiceCategory === category.id ? "Loading…" : category.shortLabel}
                  </button>
                ))}
              </div>
              {essentialServicesError && (
                <p role="status" className="mt-2 text-[10px] leading-snug text-[#9F1239]">{essentialServicesError}</p>
              )}
              {!essentialServicesLoading && essentialServiceCategory && !essentialServicesError && (
                <p role="status" className="mt-2 text-[10px] leading-snug text-[#3A1F0E]/55">
                  {essentialServicePlaces.length === 0
                    ? "No matching public facilities were returned in this area. Try another radius or category."
                    : `${essentialServicePlaces.length} public ${essentialServicePlaces.length === 1 ? "facility is" : "facilities are"} shown as teal pins. Open a pin for directions.`} Source: Google Maps. No ownership, safety, or recommendation claim is implied.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Nearby radius — available for precise location, profile locality, or an explicit place search. */}
        {!showingCultural && activeLocalScope && (
          <div className="px-4 py-2 border-b border-[#3A1F0E]/6 shrink-0 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40">Near Me</span>
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setNearMeRadius(r)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  nearMeRadius === r
                    ? "bg-[#CA922B] text-white border-[#CA922B]"
                    : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/12 hover:border-[#CA922B]/50 hover:text-[#CA922B]"
                }`}
              >
                {r} mi
              </button>
            ))}
          </div>
        )}

        {/* Count row */}
        <div className="px-4 py-2 text-xs text-[#3A1F0E]/40 font-medium border-b border-[#3A1F0E]/6 shrink-0 flex items-center justify-between">
          <span>
            {showingCultural
              ? `${activeCulturalSites.length} ${showingDestinations ? (activeCulturalSites.length === 1 ? "destination" : "destinations") : (activeCulturalSites.length === 1 ? "site" : "sites")}`
              : businessSearchActive
                ? (() => {
                    const n = displayedBusinessResults.length;
                    return `${n} ${n === 1 ? "result" : "results"}`;
                  })()
                : "Search businesses, heritage, and more"}
            {nearMeRadius !== null && !showingCultural && businessSearchActive && (
              <span className="ml-1.5 text-[#CA922B] font-bold">within {nearMeRadius} mi</span>
            )}
          </span>
          {selected && !showingCultural && (
            <button onClick={resetView} className="text-[#CA922B] font-bold hover:underline">Reset view</button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {showingCultural ? (
            // ── Cultural sites list ──
            activeCulturalSites.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-3" />
                <p className="text-sm text-[#3A1F0E]/50">No {legendTileLabel.toLowerCase()} found in this area.</p>
              </div>
            ) : (
              activeCulturalSites.map((site) => {
                const color = getCulturalPinColor(site);
                const label = getCulturalPinLabel(site);
                const siteLat = site.latitude;
                const siteLng = site.longitude;
                const canFly = mapRef.current && !isNaN(siteLat) && !isNaN(siteLng) && (siteLat !== 0 || siteLng !== 0);
                return (
                  <div
                    key={site.id}
                    className={`p-4 border-b border-[#3A1F0E]/6 hover:bg-[#FAF6EF] transition-colors ${canFly ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (!canFly) return;
                      mapRef.current!.panTo({ lat: siteLat, lng: siteLng });
                      // Destination pins can be city/island/region planning nodes rather than street addresses.
                      mapRef.current!.setZoom(site.entity_kind === "travel_destination" ? 7 : site.entity_kind === "hbcu" ? 14 : 16);
                      setSidebarOpen(false);
                    }}
                    title={canFly ? `Fly to ${site.title}` : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rotate-45 shrink-0 mt-1.5"
                        style={{ background: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2B1507] text-sm leading-tight">{site.title}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{label}</div>
                        <div className="text-xs text-[#3A1F0E]/50 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {site.city}{site.entity_kind === "travel_destination" && site.country_code ? `, ${site.country_code}` : site.state_region ? `, ${site.state_region}` : ""}
                        </div>
                        {site.summary && (
                          <p className="text-xs text-[#3A1F0E]/60 mt-1 leading-relaxed line-clamp-2">
                            {site.summary.slice(0, 100)}{site.summary.length > 100 ? "…" : ""}
                          </p>
                        )}
                        <Link
                          href={site.detail_url}
                          className="text-[10px] font-bold mt-0.5 block hover:underline text-[#CA922B]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {site.entity_kind === "travel_destination" ? "View planning reference →" : "Learn more on MWM →"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // ── Universal Search results ──
            (isLoading || universalLoading) ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-[#3A1F0E]/6 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#3A1F0E]/8 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-[#3A1F0E]/8 rounded w-3/4" />
                      <div className="h-3 bg-[#3A1F0E]/6 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : !businessSearchActive ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-[#CA922B]/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#2B1507] mb-1">Discover the Community</p>
                <p className="text-xs text-[#3A1F0E]/50 mb-4 leading-relaxed">
                  Search businesses, heritage sites,<br />HBCUs, or community events.
                </p>
                <p className="text-[10px] text-[#3A1F0E]/35 leading-relaxed">
                  Start with your location or a city.<br />Use “Explore all areas” only to plan farther away.
                </p>
              </div>
            ) : (
              <div>
                {/* Heritage / cultural sites section */}
                {(universalResults?.results?.heritage?.length ?? 0) > 0 && (
                  <div className="border-b border-[#CA922B]/20 bg-[#FDF8F0]">
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#CA922B] mb-1.5">
                        Heritage &amp; Cultural Sites
                        {universalResults?.heritageGeoExpansion === "nearby" && (
                          <span className="normal-case font-normal text-[#3A1F0E]/50"> · Within 50 miles</span>
                        )}
                        {universalResults?.heritageGeoExpansion === "state" && (
                          <span className="normal-case font-normal text-[#3A1F0E]/50"> · Statewide</span>
                        )}
                        {universalResults?.heritageGeoExpansion === "national" && (
                          <span className="normal-case font-normal text-[#3A1F0E]/50"> · Nationwide</span>
                        )}
                      </p>
                      {universalResults?.heritageGeoMessage && (
                        <p className="text-[10px] text-[#3A1F0E]/50 mb-2 italic">{universalResults.heritageGeoMessage}</p>
                      )}
                      {(universalResults?.results?.heritage ?? []).slice(0, 4).map((site: any) => (
                        <div key={site.id ?? site.name} className="flex items-start gap-2 mb-2">
                          <div className="w-2 h-2 rotate-45 shrink-0 mt-[5px] bg-[#CA922B]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#2B1507] leading-tight">{site.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-[#3A1F0E]/50 truncate">
                                {site.city ?? ""}{site.city && (site.state || site.country) ? ", " : ""}{site.state ?? site.country ?? ""}
                                {site.distance_miles != null ? ` · ${site.distance_miles}mi away` : ""}
                              </p>
                              {site.id && (
                                <a
                                  href={`/cultural-sites/${encodeURIComponent(site.id)}`}
                                  className="shrink-0 text-[10px] text-[#CA922B] font-bold hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Named business not found banner */}
                {universalResults?.namedBusinessNotFound && (
                  <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                    <p className="text-xs font-bold text-amber-800 leading-tight">{universalResults.namedBusinessMessage}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Showing nearby alternatives below</p>
                  </div>
                )}

                {/* Library topic queued */}
                {universalResults?.libraryTopicQueued && (
                  <div className="px-4 py-2.5 bg-[#FDF8F0] border-b border-[#CA922B]/20">
                    <p className="text-[11px] text-[#3A1F0E]/60 leading-relaxed">{universalResults.libraryQueueMessage}</p>
                  </div>
                )}

                {/* Fallback message (only when no named-biz banner) */}
                {universalResults?.fallbackMessage && !universalResults?.namedBusinessNotFound && (
                  <div className="px-4 py-2 border-b border-[#3A1F0E]/6">
                    <p className="text-[11px] text-[#3A1F0E]/50 italic">{universalResults.fallbackMessage}</p>
                  </div>
                )}

                {/* Preserve Map's proven business/heritage pin controls above and
                    expose the universal record types that previously had no visible
                    result cards. These are cards/handoffs only, never fabricated pins. */}
                {universalResults && (
                  <div className="border-b border-[#3A1F0E]/6">
                    <UniversalSearchResults
                      result={universalResults}
                      surface="Map"
                      compact
                      includeKinds={["Event", "Library topic / resource", "Community organization"]}
                      hideWhenEmpty
                      onClarification={(suggestedQuery) => {
                        setSearch(suggestedQuery);
                        void runUniversalSearch(suggestedQuery);
                      }}
                    />
                  </div>
                )}

                {/* Business results — local-scoped endpoint when coordinates are known */}
                {!isDiscoveryFilterActive && businessSearchActive && (detectedLocation || (userCoords && parseLocalMapSearch(search).usesDeviceLocation)) ? (
                  <LocalBusinessResults
                    query={search}
                    subject={parseLocalMapSearch(search).subject}
                    area={
                      detectedLocation
                        ? {
                            latitude: detectedLocation.lat, longitude: detectedLocation.lng, label: detectedLocation.name,
                            city: parseLocalMapSearch(search).city,
                            stateCode: parseLocalMapSearch(search).stateCode,
                          }
                        : { latitude: userCoords!.lat, longitude: userCoords!.lng, label: "your location" }
                    }
                    onPinsChange={(pins, area) => applyLocalMapViewport(makeMapAdapter(), area, pins)}
                  />
                ) : !isDiscoveryFilterActive && businessSearchActive ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-semibold text-[#2B1507] mb-1">Add a city or ZIP code</p>
                    <p className="text-xs text-[#3A1F0E]/50 leading-relaxed">
                      Search nearby needs a location. Try “bookstores in Atlanta” or enable your location.
                    </p>
                  </div>
                ) : displayedBusinessResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-3" />
                    {detectedLocation ? (
                      <>
                        <p className="text-sm font-semibold text-[#2B1507] mb-1">
                          No MWM listings in {detectedLocation.name} yet
                        </p>
                        <p className="text-xs text-[#3A1F0E]/50 mb-4 leading-relaxed">
                          We haven't fully mapped this area yet.<br />
                          You can help the community by adding a place.
                        </p>
                        {/* "View all" resets the content filter, keeps the map centered on detected city */}
                        <button
                          onClick={() => {
                            setSearch(detectedLocation.name);
                            setUniversalResults(null);
                            setDetectedLocation(null);
                          }}
                          className="text-xs font-bold text-[#CA922B] hover:underline block mx-auto mb-3"
                        >
                          View all MWM places in {detectedLocation.name}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#2B1507] mb-1">No places found</p>
                        <p className="text-xs text-[#3A1F0E]/50 mb-4 leading-relaxed">
                          Don't see it on the map yet?<br />Add it and share your experience.
                        </p>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {supportLensError && <p role="alert" className="w-full text-sm font-semibold text-red-700">{supportLensError}</p>}
                      <button className="px-4 py-2 rounded-full bg-[#2B1507] text-white text-xs font-bold">
                        Keep exact focus
                      </button>
                      <button
                        onClick={() => { setSearch(""); setMapDiscoveryFocus("all"); setUniversalResults(null); }}
                        className="px-4 py-2 rounded-full border border-[#3A1F0E]/20 text-[#3A1F0E] text-xs font-bold"
                      >
                        Choose another community
                      </button>
                      {savedDesignations.length === 1 ? <button
                        onClick={() => void removeMapDesignation(savedDesignations[0])}
                        className="px-4 py-2 rounded-full border border-[#CA922B] text-[#CA922B] text-xs font-bold"
                      >
                        Remove {OWNERSHIP_FILTER_OPTIONS.find((option) => option.id === savedDesignations[0])?.label ?? "selection"}
                      </button> : savedDesignations.length > 1 ? savedDesignations.map((designation) => <button
                        key={designation}
                        onClick={() => void removeMapDesignation(designation)}
                        className="px-4 py-2 rounded-full border border-[#CA922B] text-[#CA922B] text-xs font-bold"
                      >
                        Remove {OWNERSHIP_FILTER_OPTIONS.find((option) => option.id === designation)?.label ?? designation}
                      </button>) : null}
                      <button
                        onClick={() => { void (async () => {
                          setSupportLensError(null);
                          try {
                            const response = await fetch(`${BASE.replace(/\/$/, "")}/api/kinfolk/preferences`, {
                            method: "PUT", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ preferredOwnershipTypes: [], supportLensMode: "all_businesses" }),
                            });
                            if (!response.ok) throw new Error("preference update failed");
                            setMapSupportScope("all_businesses");
                            setSearch(""); setMapDiscoveryFocus("all"); setBusinessSearchActive(false); setUniversalResults(null);
                          } catch {
                            setSupportLensError("Could not update Support Lens. Please try again.");
                          }
                        })(); }}
                        className="px-4 py-2 rounded-full border border-[#CA922B] text-[#CA922B] text-xs font-bold"
                      >
                        Show all businesses
                      </button>
                    </div>
                    {search.trim() && (
                      <Link href={`/travel?q=${encodeURIComponent(search.trim())}`}>
                        <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full border-2 border-[#CA922B] text-[#CA922B] text-xs font-bold hover:bg-[#CA922B] hover:text-white transition-colors mb-3">
                          Ask KinfolkAI™ instead
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => setShowAddPlace(true)}
                      className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full bg-[#CA922B] text-white text-xs font-bold hover:bg-[#B38024] transition-colors mb-3"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add a Place
                    </button>
                    <button
                      onClick={() => {
                        setSearch(""); setMapDiscoveryFocus("all"); setBusinessSearchActive(false); setUniversalResults(null); setDetectedLocation(null);
                        localSearchMarkersRef.current.forEach((m) => m.setMap(null)); localSearchMarkersRef.current = [];
                      }}
                      className="text-xs font-bold text-[#CA922B] hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  displayedBusinessResults.map((biz: any) => {
                const isRouting = routingBizId === biz.id;
                return (
                  <div
                    key={biz.id}
                    onClick={() => !apiKeyError && selectBusiness(biz.id, biz)}
                    className={`p-4 border-b border-[#3A1F0E]/6 transition-colors flex gap-3 ${
                      !apiKeyError ? "cursor-pointer" : ""
                    } ${selected === biz.id ? "bg-[#CA922B]/8 border-l-2 border-l-[#CA922B]" : "hover:bg-[#FAF6EF]"}`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#3A1F0E]/8">
                      {biz.imageUrl && (
                        <img src={biz.imageUrl} alt={biz.name ?? ""} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#2B1507] text-sm leading-tight truncate">{biz.name}</div>
                      {biz.description?.startsWith("[DEMO]") && (
                        <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 mb-0.5">
                          Demo Listing
                        </span>
                      )}
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#CA922B] mt-0.5">{biz.category}</div>
                      <div className="text-xs text-[#3A1F0E]/50 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {biz.city}, {biz.state}
                        {userCoords && (() => {
                          const dist = haversineKm(userCoords.lat, userCoords.lng, parseFloat(String(biz.latitude)), parseFloat(String(biz.longitude)));
                          const distMi = dist * 0.621371;
                          const label = distMi < 0.1 ? "< 0.1 mi" : `${distMi.toFixed(1)} mi`;
                          return <span className="ml-1 text-[#CA922B] font-semibold">{label} away</span>;
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Link
                        href={`/businesses/${biz.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-bold text-[#CA922B] hover:underline"
                      >
                        View →
                      </Link>
                      <button
                        onClick={(e) => handleDirections(biz, e)}
                        title={isPaidMember ? "Get in-app directions" : "Open in Google Maps"}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          isRouting
                            ? "bg-[#CA922B]/20 text-[#CA922B] animate-pulse"
                            : "bg-[#FAF6EF] text-[#3A1F0E]/60 hover:bg-[#CA922B]/15 hover:text-[#CA922B]"
                        }`}
                      >
                        {isRouting ? <Navigation2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                        {isPaidMember ? "Route" : "Directions"}
                      </button>
                    </div>
                  </div>
                );
              })
            )
          }
        </div>
        )
      )}
        </div>
      </div>
    );
  };

  if (apiKeyError) {
    return (
      <>
        {showAddPlace && (
          <AddPlaceModal initialSearch={search} onClose={() => setShowAddPlace(false)} />
        )}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#FAF6EF]">
        {renderSidebar()}
        <div className="hidden sm:flex flex-1 min-w-0 flex-col items-center justify-center bg-[#F5EBD8] text-center px-8 overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-[#CA922B]/15 flex items-center justify-center mb-5">
            <MapPin className="w-9 h-9 text-[#CA922B]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-2">Map view unavailable</h2>
          <p className="text-sm text-[#3A1F0E]/60 max-w-sm leading-relaxed">
            Search and business results remain available in the list. The map provider key is not configured in this deployment.
          </p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {showAddPlace && (
        <AddPlaceModal initialSearch={search} onClose={() => setShowAddPlace(false)} />
      )}
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#FAF6EF]">
      {/* Sidebar — only visible when open */}
      {sidebarOpen && renderSidebar()}

      {/* ── Map ── */}
      <div className="flex-1 min-w-0 relative">
        {(!ready || isLoading) && (
          <div className="absolute inset-0 bg-[#F5EBD8] flex flex-col items-center justify-center z-10">
            <div className="w-10 h-10 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#3A1F0E]/50 text-sm">Loading map…</p>
          </div>
        )}
        <div ref={mapDivRef} className="w-full h-full" />

        {/* Floating search pill — shown when sidebar is closed */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-10 w-[min(21rem,calc(100%-7rem))] space-y-2">
            <button
              onClick={() => { setSidebarOpen(true); setLegendFilter(null); }}
              className="w-full bg-white shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-2.5 border border-[#3A1F0E]/10 hover:shadow-xl hover:border-[#CA922B]/30 transition-all text-left"
            >
              <Search className="w-4 h-4 text-[#3A1F0E]/50 shrink-0" />
              <span className="text-sm text-[#3A1F0E]/50 font-medium">Search businesses, services, HBCUs…</span>
            </button>
            {activeLocalScope && (
              <section
                aria-label="Around you quick discovery"
                data-testid="map-discovery-quick-card"
                className="rounded-2xl border border-[#CA922B]/25 bg-white/95 p-3.5 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-full bg-[#CA922B]/12 p-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#CA922B]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-bold text-[#2B1507]">Around you</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#3A1F0E]/60">
                      {filtered.length} mapped {filtered.length === 1 ? "place" : "places"} within {nearMeRadius ?? 10} miles of {discoveryScopeLabel}.
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {discoveryCounts.filter((focus) => focus.count > 0).slice(0, 4).map((focus) => (
                    <button
                      key={focus.id}
                      type="button"
                      onClick={() => activateMapDiscoveryFocus(focus.id)}
                      className="rounded-full border border-[#CA922B]/25 bg-[#FFFDF8] px-2 py-1 text-[10px] font-bold text-[#3A1F0E]/75 transition-colors hover:border-[#CA922B]/60 hover:text-[#CA922B]"
                    >
                      {focus.count} {focus.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setSidebarOpen(true); setLegendFilter("business"); }}
                  className="mt-2.5 text-[11px] font-bold text-[#CA922B] hover:text-[#9F6E16] hover:underline"
                >
                  Choose a focus or see every nearby pin →
                </button>
              </section>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={resetView}
          aria-label={userCoords ? "Recenter map on my location" : "Reset map to Philadelphia"}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-2xl border border-[#3A1F0E]/10 bg-white px-4 py-2.5 text-sm font-bold text-[#2B1507] shadow-lg transition-all hover:border-[#CA922B]/30 hover:shadow-xl"
        >
          <Navigation className="h-4 w-4 text-[#CA922B]" />
          Recenter
        </button>

        {/* Active route info bar */}
        {routeInfo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2B1507] text-[#F5EBD8] rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4 z-10">
            <Navigation2 className="w-4 h-4 text-[#CA922B] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#CA922B] leading-none mb-0.5">Route to {routeInfo.bizName}</div>
              <div className="text-sm font-semibold">{routeInfo.duration} · {routeInfo.distance}</div>
            </div>
            <button
              onClick={clearRoute}
              className="ml-2 w-6 h-6 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* The former map shortcut strip was intentionally removed for a calmer
            map. Its data, typed search, and underlying filters remain intact:
            members can still search markets, HBCUs, cultural places, events,
            and every other supported category by name or need. */}
      </div>
    </div>
    </>
  );
}
