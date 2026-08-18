import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { Search, MapPin, X, Navigation, Navigation2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LocalBusinessResults } from "@/features/map/LocalBusinessResults";
import { applyLocalMapViewport, type MapViewportAdapter } from "@/features/map/applyLocalMapViewport";
import AddPlaceModal from "@/components/AddPlaceModal";

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

type CulturalSiteWeb = {
  id: string;
  name: string;
  description?: string | null;
  heritageCategory?: string | null;
  pinType?: string | null;
  listingStatus?: string | null;
  culturalCommunity?: string | null;
  visitTip?: string | null;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  externalUrl?: string | null;
};

// ── Pin colour helpers ──────────────────────────────────────────────────────
function getCulturalPinColor(site: CulturalSiteWeb): string {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  // Heritage festivals & cultural celebrations — warm gold, communicates reverence
  if (pt === "heritage_festival" || pt === "cultural_celebration" || pt === "community_tradition") return "#C8960C";
  if (pt === "farmers_market" || pt === "pop_up_market" || pt === "market") return "#16A34A";
  if (pt === "mural_or_public_art") return "#0891B2";
  if (pt === "community_org" || pt === "cultural_organization") return "#D97706";
  // community_event / festival_or_event = community-created pop-ups (not annual heritage events)
  if (pt === "festival_or_event" || pt === "community_event") return "#EA580C";
  if (pt === "park_or_outdoor") return "#15803D";
  if (hc === "HBCU") return "#7C3AED";
  if (hc === "Civil Rights") return "#DC2626";
  if (hc === "Religious Heritage") return "#78716C";
  return "#92400E";
}

function getCulturalPinLabel(site: CulturalSiteWeb): string {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  if (pt === "heritage_festival")    return "Heritage Festival";
  if (pt === "cultural_celebration") return "Cultural Celebration";
  if (pt === "community_tradition")  return "Community Tradition";
  if (pt === "farmers_market" || pt === "pop_up_market") return "Farmers Market";
  if (pt === "market") return "Market";
  if (pt === "mural_or_public_art") return "Public Art";
  if (pt === "community_org" || pt === "cultural_organization") return "Community Org";
  if (pt === "festival_or_event" || pt === "community_event") return "Community Event";
  if (hc === "HBCU") return "HBCU";
  if (hc === "Civil Rights") return "Civil Rights";
  return hc || "Cultural Site";
}

// Which cultural sites match the active legend filter?
function siteMatchesFilter(site: CulturalSiteWeb, filter: string): boolean {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  const isHbcu     = hc.toUpperCase() === "HBCU";
  const isFestival = pt === "heritage_festival" || pt === "cultural_celebration" || pt === "community_tradition";
  const isEvent    = pt === "festival_or_event" || pt === "community_event";
  const isMarket   = pt === "farmers_market" || pt === "pop_up_market" || pt === "market";
  const isArt      = pt === "mural_or_public_art";
  if (filter === "hbcu")     return isHbcu;
  if (filter === "festival") return isFestival;
  if (filter === "events")   return isEvent;
  if (filter === "market")   return isMarket;
  if (filter === "art")      return isArt;
  if (filter === "cultural") return !isHbcu && !isFestival && !isEvent && !isMarket && !isArt;
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

const CATEGORIES = ["All", "Food", "Beauty", "Finance", "Wellness", "Retail", "Cultural", "Professional", "Healthcare", "Trades & Education", "International"];

// ── "What are you in the mood for?" discovery intent chips ─────────────────
type MoodChip = { id: string; label: string };
const MOOD_CHIPS: MoodChip[] = [
  { id: "romantic",    label: "Romantic"    },
  { id: "chill",       label: "Chill"       },
  { id: "turn-up",     label: "Turn Up"     },
  { id: "grown-folks", label: "Grown Folks" },
  { id: "family",      label: "Family Time" },
  { id: "culture",     label: "Culture"     },
  { id: "live-music",  label: "Live Music"  },
  { id: "eat-good",    label: "Eat Good"    },
];

function matchesMood(biz: BizWithCoords, moodId: string): boolean {
  const cat  = (biz.category    ?? "").toLowerCase();
  const name = (biz.name        ?? "").toLowerCase();
  const desc = (biz.description ?? "").toLowerCase();
  const text = `${name} ${desc}`;
  switch (moodId) {
    case "romantic":
      return cat.includes("food") || cat.includes("wellness") ||
        ["wine", "fine dining", "upscale", "steakhouse", "intimate", "rooftop", "date night"].some((k) => text.includes(k));
    case "chill":
      return ["coffee", "cafe", "café", "tea", "lounge", "bookstore", "bakery", "brunch", "smoothie", "chill", "relaxed"].some((k) => text.includes(k)) ||
        cat.includes("wellness");
    case "turn-up":
      return ["bar", "club", "nightlife", "nightclub", "party", "rooftop", "hookah", "dance", "dj", "brunch", "day party"].some((k) => text.includes(k));
    case "grown-folks":
      return ["lounge", "wine bar", "jazz", "speakeasy", "cocktail", "steakhouse", "fine dining", "cigar", "whiskey", "bourbon", "spirits", "grown"].some((k) => text.includes(k));
    case "family":
      return (cat.includes("food") || cat.includes("retail") || cat.includes("cultural")) ||
        ["family", "kids", "children", "ice cream", "pizza", "diner", "friendly"].some((k) => text.includes(k));
    case "culture":
      return cat.includes("cultural") ||
        ["museum", "gallery", "heritage", "history", "art", "historic", "hbcu", "monument", "landmark"].some((k) => text.includes(k));
    case "live-music":
      return ["live music", "jazz", "blues", "open mic", "music venue", "concert", "band", "soul", "gospel", "hip-hop", "hip hop"].some((k) => text.includes(k));
    case "eat-good":
      return cat.includes("food");
    default:
      return true;
  }
}

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
  { key: "cultural", color: "#92400E", shape: "diamond",  label: "Cultural Sites" },
  { key: "hbcu",     color: "#7C3AED", shape: "diamond",  label: "HBCUs" },
  { key: "festival", color: "#C8960C", shape: "diamond",  label: "Festivals" },
  { key: "events",   color: "#EA580C", shape: "diamond",  label: "Community Events" },
  { key: "market",   color: "#16A34A", shape: "diamond",  label: "Markets" },
  { key: "art",      color: "#0891B2", shape: "diamond",  label: "Public Art" },
  { key: "sundown",  color: "#7F1D1D", shape: "triangle", label: "Sundown Town History" },
] as const;

export default function MapPage() {
  // Load ALL geolocated businesses — uses dedicated map-pins endpoint (no 200-row cap)
  const [mapPins, setMapPins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/businesses/map-pins`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { pins: [] })
      .then((d: { pins?: any[] }) => { setMapPins(d.pins ?? []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);
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
  const [category, setCategory] = useState("All");
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routingBizId, setRoutingBizId] = useState<string | null>(null);
  const [culturalSites, setCulturalSites] = useState<CulturalSiteWeb[]>([]);
  const culturalMarkersRef = useRef<GMarker[]>([]);
  // Local search pin layer — separate from global discovery markers.
  // Cleared whenever a new local search begins or the search is reset.
  const localSearchMarkersRef = useRef<GMarker[]>([]);

  // Sundown towns — ALWAYS ON per Gate 5 Map UX Spec non-negotiable rule #2
  const [sundownTowns, setSundownTowns] = useState<SundownTown[]>([]);
  const sundownMarkersRef = useRef<GMarker[]>([]);

  type MapEvent = {
    id: string; title: string; city: string; state: string;
    latitude: string | null; longitude: string | null;
    category: string; date?: string | null; location?: string | null;
    isFree?: boolean | null;
  };
  const [mapEvents, setMapEvents] = useState<MapEvent[]>([]);
  const eventMarkersRef = useRef<GMarker[]>([]);

  // User's confirmed geolocation — set when browser grants permission
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Sidebar + legend filter state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [legendFilter, setLegendFilter] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [showAddPlace, setShowAddPlace] = useState(false);
  // Business search must be explicitly triggered — map does not auto-populate businesses
  const [businessSearchActive, setBusinessSearchActive] = useState(false);
  // Sundown layer has its own independent toggle (not subject to legendFilter single-select)
  const [showSundownLayer, setShowSundownLayer] = useState(true);

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

  // Near Me mode — radius in miles (null = show all, number = geo-filtered)
  const [nearMeRadius, setNearMeRadius] = useState<number | null>(null);

  // Tracks whether the user explicitly denied location permission so we can
  // show a retry prompt instead of silently falling back to homeCity.
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);

  // Universal Search — populated on explicit submit; null = client-side filtering
  const [universalResults, setUniversalResults] = useState<{
    results: { businesses: any[]; heritage: any[]; events: any[]; libraryTopics: any[] };
    intentType: string; totalResults: number; fallbackMessage?: string | null;
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
    setBusinessSearchActive(true);
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
    try {
      const geoRes = await fetch(
        `${apiBase}/api/maps/geo-extract?q=${encodeURIComponent(q)}`,
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

    // Step 2 — search MWM database only
    // Pass full query so Pass 2.5 city detection works ("Phuket" found in
    // businesses table → filters to Phuket). Also pass detected lat/lng so
    // geo-radius ranking activates for that geography.
    try {
      const p = new URLSearchParams({ q, surface: "map", limit: "20" });
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
      } else if (userCoords) {
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
        const useLocalSearch = (geoLat !== null && geoLng !== null) || userCoords !== null;
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
  }, [search, userCoords, fitMapToBusinessResults]);

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

  // ── Fetch discoverability pins after map is ready ─────────────────────────
  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/maps/discoverability-pins`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { pins: [] })
      .then((d: { pins?: DiscoverabilityPin[] }) => setDiscoverabilityPins(d.pins ?? []))
      .catch(() => {});
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
  }, [discoverabilityPins]);

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
      const bAny = b as any;
      const matchCat = category === "All"
        || (category === "International"
            ? bAny.country && bAny.country !== "USA" && bAny.country !== "United States"
            : category === "Healthcare"
            ? b.category?.toLowerCase().includes("health")
            : category === "Trades & Education"
            ? b.category?.toLowerCase().includes("education") ||
              (b as any).subcategory?.toLowerCase().includes("trade") ||
              (b as any).subcategory?.toLowerCase().includes("workforce") ||
              (b as any).subcategory?.toLowerCase().includes("apprenticeship")
            : b.category?.toLowerCase().includes(category.toLowerCase()));
      const matchMood = mood === null || matchesMood(b, mood);
      // Near Me radius filter — only applied when GPS is available and mode is active
      const matchNear = nearMeRadius === null || !userCoords || (() => {
        const distKm = haversineKm(userCoords.lat, userCoords.lng, parseFloat(String(b.latitude)), parseFloat(String(b.longitude)));
        return distKm <= nearMeRadius * 1.60934; // convert miles → km
      })();
      return matchSearch && matchCat && matchMood && matchNear;
    });
    // If we have the user's location, sort by proximity (closest first)
    if (!userCoords) return base;
    return [...base].sort((a, b) => {
      const dA = haversineKm(userCoords.lat, userCoords.lng, parseFloat(String(a.latitude)), parseFloat(String(a.longitude)));
      const dB = haversineKm(userCoords.lat, userCoords.lng, parseFloat(String(b.latitude)), parseFloat(String(b.longitude)));
      return dA - dB;
    });
  })();

  // Cultural sites for the active city (starts with Philadelphia; updates on legend filter)
  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/cultural-sites?limit=2000`)
      .then((r) => r.json())
      .then((d: any) => { if (Array.isArray(d.sites)) setCulturalSites(d.sites as CulturalSiteWeb[]); })
      .catch(() => {});
  }, [ready]);

  // Fetch active events with coordinates for map pins
  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/events`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: any) => {
        const evts = (d.events ?? []).filter(
          (e: any) => e.latitude != null && e.longitude != null,
        );
        setMapEvents(evts);
      })
      .catch(() => {});
  }, [ready]);

  // Render cultural site markers whenever sites load
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current || culturalSites.length === 0) return;
    culturalMarkersRef.current.forEach((m) => m.setMap(null));
    culturalMarkersRef.current = [];

    culturalSites.forEach((site) => {
      const lat = parseFloat(site.latitude);
      const lng = parseFloat(site.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getCulturalPinColor(site);
      const label = getCulturalPinLabel(site);

      const marker: GMarker = new g.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: site.name,
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
        const snippet = (site.visitTip ?? site.description ?? "").slice(0, 120);
        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:4px 2px;min-width:180px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">${label}</span>
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${site.name}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:4px">${site.city}, ${site.state}</div>
            ${snippet ? `<div style="font-size:11px;color:#3A1F0E;line-height:1.45;font-style:italic;margin-bottom:5px">${snippet}${snippet.length === 120 ? "…" : ""}</div>` : ""}
            ${safePublicUrl(site.externalUrl) ? `<a href="${safePublicUrl(site.externalUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:${color};font-weight:bold;text-decoration:none;display:block;margin-bottom:4px">Official website ↗</a>` : ""}
            <a href="/cultural-sites/${encodeURIComponent(site.id)}" style="font-size:11px;color:#CA922B;font-weight:bold;text-decoration:none;display:block;margin-top:2px">Learn more on MWM →</a>
          </div>`
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      culturalMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [culturalSites]);

  // Cultural marker visibility — responds to legendFilter changes
  useEffect(() => {
    if (!mapRef.current) return;
    culturalMarkersRef.current.forEach((marker, i) => {
      const site = culturalSites[i];
      if (!site) { marker.setMap(null); return; }
      const visible =
        legendFilter !== "business" &&
        (legendFilter === null || siteMatchesFilter(site, legendFilter));
      marker.setMap(visible ? mapRef.current : null);
    });
  }, [legendFilter, culturalSites]);

  // ── Historical Sundown Towns layer ──────────────────────────────────────────
  // ALWAYS ON — layer is never hidden per Gate 5 Map UX Spec rule #2.
  // Amber (#B8860B) upward triangles, confidence-classified shapes.

  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/sundown-towns`)
      .then((r) => r.json())
      .then((d: any) => { if (Array.isArray(d.towns)) setSundownTowns(d.towns as SundownTown[]); })
      .catch(() => {});
  }, [ready]);

  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current || sundownTowns.length === 0) return;

    // Clear previous markers before re-rendering
    sundownMarkersRef.current.forEach((m) => m.setMap(null));
    sundownMarkersRef.current = [];

    sundownTowns.forEach((town) => {
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
  }, [sundownTowns]);

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
  }, [showSundownLayer, sundownTowns]);

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
              map: mapRef.current,
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
              map.setCenter(results[0].geometry.location);
              map.setZoom(12);
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
          map,
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
    } catch {
      setApiKeyError(true);
    }

    return () => window.removeEventListener("error", onGmError, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isLoading, handoffQuery]);

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
    mapRef.current.panTo({ lat: 39.9526, lng: -75.1652 }); // Philadelphia — live city
    mapRef.current.setZoom(12);
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
  }, []);

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
    const showBiz = businessSearchActive && (!legendFilter || legendFilter === "business");
    // When universal search returned results, only show those businesses as markers
    const activeIds = universalResults
      ? new Set((universalResults.results.businesses ?? []).map((b: any) => b.id as string))
      : new Set(filtered.map((b) => b.id));
    markersRef.current.forEach((marker, id) => {
      marker.setMap(showBiz && activeIds.has(id) ? mapRef.current : null);
    });
  }, [filtered, legendFilter, businessSearchActive, universalResults]);

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const activeCulturalSites = legendFilter && legendFilter !== "business"
    ? culturalSites.filter((s) => siteMatchesFilter(s, legendFilter))
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
                      setSearch(""); setBusinessSearchActive(false); setUniversalResults(null); setDetectedLocation(null);
                      localSearchMarkersRef.current.forEach((m) => m.setMap(null)); localSearchMarkersRef.current = [];
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-[#3A1F0E]/40" />
                  </button>
                )}
              </div>
              {/* Mood / discovery intent */}
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-2">
                  What are you in the mood for?
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {MOOD_CHIPS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMood(mood === m.id ? null : m.id)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors border ${
                        mood === m.id
                          ? "bg-[#CA922B] text-white border-[#CA922B]"
                          : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/12 hover:border-[#CA922B]/50 hover:text-[#CA922B]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                  {mood !== null && (
                    <button
                      onClick={() => setMood(null)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 transition-colors flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category filter */}
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
                      category === cat
                        ? "bg-[#2B1507] text-[#F5EBD8]"
                        : "bg-[#FAF6EF] text-[#3A1F0E]/60 hover:bg-[#3A1F0E]/8"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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

        {/* Near Me toggle — only shown in business view when GPS is available */}
        {!showingCultural && userCoords && (
          <div className="px-4 py-2 border-b border-[#3A1F0E]/6 shrink-0 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40">Near Me</span>
            {[5, 10, 25].map((r) => (
              <button
                key={r}
                onClick={() => setNearMeRadius(nearMeRadius === r ? null : r)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  nearMeRadius === r
                    ? "bg-[#CA922B] text-white border-[#CA922B]"
                    : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/12 hover:border-[#CA922B]/50 hover:text-[#CA922B]"
                }`}
              >
                {r} mi
              </button>
            ))}
            {nearMeRadius !== null && (
              <button
                onClick={() => setNearMeRadius(null)}
                className="text-[10px] text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 font-semibold"
              >
                ✕ All
              </button>
            )}
          </div>
        )}

        {/* Count row */}
        <div className="px-4 py-2 text-xs text-[#3A1F0E]/40 font-medium border-b border-[#3A1F0E]/6 shrink-0 flex items-center justify-between">
          <span>
            {showingCultural
              ? `${activeCulturalSites.length} ${activeCulturalSites.length === 1 ? "site" : "sites"}`
              : businessSearchActive
                ? (() => {
                    const n = universalResults ? universalResults.totalResults : filtered.length;
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
                const siteLat = typeof site.latitude === "string" ? parseFloat(site.latitude) : (site.latitude as number);
                const siteLng = typeof site.longitude === "string" ? parseFloat(site.longitude) : (site.longitude as number);
                const canFly = mapRef.current && !isNaN(siteLat) && !isNaN(siteLng) && (siteLat !== 0 || siteLng !== 0);
                return (
                  <div
                    key={site.id}
                    className={`p-4 border-b border-[#3A1F0E]/6 hover:bg-[#FAF6EF] transition-colors ${canFly ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (!canFly) return;
                      mapRef.current!.panTo({ lat: siteLat, lng: siteLng });
                      // HBCUs and cultural heritage use city-level zoom; specific addresses use street level
                      mapRef.current!.setZoom((site.heritageCategory ?? "").toUpperCase() === "HBCU" || !site.address ? 14 : 16);
                      setSidebarOpen(false);
                    }}
                    title={canFly ? `Fly to ${site.name}` : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rotate-45 shrink-0 mt-1.5"
                        style={{ background: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2B1507] text-sm leading-tight">{site.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{label}</div>
                        <div className="text-xs text-[#3A1F0E]/50 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {site.city}, {site.state}
                        </div>
                        {site.description && (
                          <p className="text-xs text-[#3A1F0E]/60 mt-1 leading-relaxed line-clamp-2">
                            {site.description.slice(0, 100)}{site.description.length > 100 ? "…" : ""}
                          </p>
                        )}
                        {safePublicUrl(site.externalUrl) && (
                          <a
                            href={safePublicUrl(site.externalUrl)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold mt-1 block hover:underline"
                            style={{ color }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Official website ↗
                          </a>
                        )}
                        <Link
                          href={`/cultural-sites/${encodeURIComponent(site.id)}`}
                          className="text-[10px] font-bold mt-0.5 block hover:underline text-[#CA922B]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Learn more on MWM →
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
                  Cultural sites and HBCUs<br />are always visible on the map.
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

                {/* Business results — local-scoped endpoint when coordinates are known */}
                {businessSearchActive && (detectedLocation ?? userCoords) ? (
                  <LocalBusinessResults
                    query={search}
                    area={
                      detectedLocation
                        ? { latitude: detectedLocation.lat, longitude: detectedLocation.lng, label: detectedLocation.name }
                        : { latitude: userCoords!.lat, longitude: userCoords!.lng, label: "your location" }
                    }
                    onPinsChange={(pins, area) => applyLocalMapViewport(makeMapAdapter(), area, pins)}
                  />
                ) : (universalResults?.results?.businesses ?? filtered).length === 0 ? (
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
                        setSearch(""); setCategory("All"); setBusinessSearchActive(false); setUniversalResults(null); setDetectedLocation(null);
                        localSearchMarkersRef.current.forEach((m) => m.setMap(null)); localSearchMarkersRef.current = [];
                      }}
                      className="text-xs font-bold text-[#CA922B] hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  (universalResults?.results?.businesses ?? filtered).map((biz: any) => {
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
          <button
            onClick={() => { setSidebarOpen(true); setLegendFilter(null); }}
            className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-2.5 border border-[#3A1F0E]/10 hover:shadow-xl hover:border-[#CA922B]/30 transition-all"
          >
            <Search className="w-4 h-4 text-[#3A1F0E]/50" />
            <span className="text-sm text-[#3A1F0E]/50 font-medium">Search businesses…</span>
          </button>
        )}

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

        {/* Interactive legend — two rows so Sundown toggle is always visible */}
        <div className="absolute bottom-6 left-4 flex flex-col gap-1.5">
          {/* Row 1: Cultural / heritage layer filters */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-[#3A1F0E]/8 flex flex-wrap items-center gap-x-1 gap-y-1">
            {LEGEND_TILES.filter(t => t.key !== "sundown").map(({ key, color, shape, label }) => {
              const isActive = legendFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    const next = isActive ? null : key;
                    setLegendFilter(next);
                    setSidebarOpen(next !== null);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-left ${
                    isActive
                      ? "bg-[#3A1F0E]/10 ring-1 ring-[#3A1F0E]/20"
                      : "hover:bg-[#3A1F0E]/5"
                  }`}
                >
                  {shape === "circle" ? (
                    <div className="w-3 h-3 rounded-full border border-[#2B1507]/40 shrink-0" style={{ background: color }} />
                  ) : (
                    <div className="w-3 h-3 rotate-45 shrink-0" style={{ background: color }} />
                  )}
                  <span className={`text-[10px] font-semibold ${isActive ? "text-[#3A1F0E]" : "text-[#3A1F0E]/70"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
            {isPaidMember && (
              <div className="flex items-center gap-1.5 border-l border-[#3A1F0E]/10 pl-3 ml-1">
                <Navigation className="w-3 h-3 text-[#CA922B]" />
                <span className="text-xs font-semibold text-[#CA922B]">Routing active</span>
              </div>
            )}
          </div>

          {/* Row 2: Sundown Town History — always its own row, never overflows */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg border border-[#3A1F0E]/8 w-fit">
            <button
              onClick={() => setShowSundownLayer(v => !v)}
              title={showSundownLayer ? "Hide Sundown Town History layer" : "Show Sundown Town History layer"}
              className={`flex items-center gap-2 px-1 py-0.5 rounded-lg transition-all ${
                showSundownLayer
                  ? "opacity-100"
                  : "opacity-45 hover:opacity-70"
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" className="shrink-0">
                <polygon points="6,1 11,11 1,11" fill="#7F1D1D" opacity={showSundownLayer ? "0.85" : "0.35"} />
              </svg>
              <span className={`text-[10px] font-semibold ${showSundownLayer ? "text-[#7F1D1D]" : "text-[#3A1F0E]/45"}`}>
                {showSundownLayer ? "Sundown Town History — ON" : "Sundown Town History — OFF"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
