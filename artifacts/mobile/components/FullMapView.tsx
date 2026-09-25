import { Feather } from "@expo/vector-icons";
import {
  countMapDiscoveryFocuses,
  MAP_ESSENTIAL_SERVICE_CATEGORIES,
  matchesMapDiscoveryFocus,
  type MapEssentialServiceCategory,
  type MapDiscoveryFocus,
} from "@workspace/constants";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Circle,
  Marker,
  PROVIDER_DEFAULT,
  type Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Business } from "@/constants/types";
import {
  useActivityAlerts,
  ALERT_META,
  type AlertType,
} from "@/hooks/useActivityAlerts";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useCanonicalMapPins } from "@/hooks/useCanonicalMapPins";
import { isDeliberateMapBusinessNameSearch } from "@/hooks/support-lens-request";
import { useColors } from "@/hooks/useColors";
import { useGeoSafeAlert } from "@/hooks/useGeoSafeAlert";
import { useSafetyProximity } from "@/hooks/useSafetyProximity";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/lib/auth";
import {
  canLoadLocalCollections,
  isSafeLocalFit,
  mapCollectionScopeQuery,
  mapLocalityKey,
  NEUTRAL_LOCAL_REGION,
  parseMapSearchLocality,
  parseProfileHomeLocality,
  resolveMapLocality,
} from "@/lib/mapLocality";
import { openExternalUrl, openMapDirections } from "@/lib/safeLinking";

import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const GOLD = "#CA922B";
// KinfolkAI restore tab lives at bottom: insets.bottom + 90 in the root layout.
// FullMapView content area base is ~83px from raw screen bottom (tab bar).
// Adding ~7px net = 90px clearance keeps cards and FAB above the widget.
const KINFOLK_CLEAR = 90;

// ─── FEATURE FLAG: Heritage Sites ────────────────────────────────────────────
// Build 97: disabled after Android Fabric crash during real-device testing.
// Root cause (documented in code comment at Android marker block below):
//   Rendering a View with a Text/Feather node inside a react-native-maps
//   Marker triggered view.draw(canvas) in an unattached-Window context on
//   Android Fabric, corrupting the Marker's native touch descriptor → crash
//   on first tap interaction.
// Fix applied in VC71 isolation step: Android markers use plain colored
//   circle only — no Text/Feather children inside the Marker on Android.
//   iOS retains Feather icons (was never crashing).
// Build 98: re-enabled. Android isolation fix is in place. Additional
//   safeguards: MAX_HERITAGE_MARKERS cap, coordiante validation, stable
//   UUID keys, isFetchingCulturalSites guard against fetch/render loops.
const HERITAGE_SITES_ENABLED = true;

// Hard cap: prevents memory pressure if the API grows unexpectedly.
// Current production total is 170 — this allows 47% headroom.
const MAX_HERITAGE_MARKERS = 250;
const MAX_TRAVEL_DESTINATION_MARKERS = 600;

// Do not open to a country-wide overview. The map moves to a confirmed device
// location or fits a profile/search locality once that scoped data arrives.
const DEFAULT_REGION: Region = NEUTRAL_LOCAL_REGION;

function distanceMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface HeatmapPoint {
  city: string;
  state: string;
  lat: number;
  lng: number;
  avgScore: number;
  surveyCount: number;
  tier: "safe" | "moderate" | "alert";
}

interface CulturalSite {
  id: string;
  name: string;
  description: string;
  category: string;
  heritageCategory: string;
  subcategory?: string | null;
  city: string;
  state: string;
  address?: string | null;
  latitude: string;
  longitude: string;
  era: string | null;
  significance: string | null;
  externalUrl?: string | null;
  yearEstablished?: number | null;
  visitTip?: string | null;
  contentNote?: string | null;
  pinType?: string | null;
  listingStatus?: string | null;
  culturalCommunity?: string | null;
}

interface MapEventItem {
  id: string;
  title: string;
  city: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
  category: string;
  date?: string | null;
  location?: string | null;
  isFree?: boolean | null;
}

interface TourCommunityOrg {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  mission: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface TourRecurringEvent {
  id: string;
  name: string;
  city: string;
  state: string;
  venue: string | null;
  address: string | null;
  description: string | null;
  frequency: string;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  category: string;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface TourHeritageSite {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  description: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  siteType?: string; // 'landmark' | 'mural' | etc.
}

interface TravelDestination {
  id: string;
  entity_kind: "travel_destination";
  title: string;
  slug: string;
  summary: string | null;
  city: string;
  state_region: string | null;
  country_code: string | null;
  latitude: number;
  longitude: number;
  source_url: string | null;
  detail_url: string;
}

interface EssentialServicePlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  primaryType: string | null;
  directionsUrl: string;
}

interface EssentialServicesResponse {
  category: MapEssentialServiceCategory;
  radiusMiles: number;
  places: EssentialServicePlace[];
  source: "Google Maps";
  disclaimer: string;
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface CategoryStyle {
  color: string;
  icon: FeatherIconName;
  label: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // ── Heritage categories (heritageCategory field) ───────────────────────────
  HBCU: { color: "#7C3AED", icon: "book-open", label: "HBCU" },
  "Civil Rights": { color: "#DC2626", icon: "flag", label: "Civil Rights" },
  "African American Heritage": {
    color: "#92400E",
    icon: "star",
    label: "Heritage",
  },
  "Native American Heritage": {
    color: "#065F46",
    icon: "globe",
    label: "Native",
  },
  "Hispanic & Latino Heritage": {
    color: "#B45309",
    icon: "map-pin",
    label: "Latino",
  },
  "LGBTQ+ History": { color: "#9D174D", icon: "heart", label: "LGBTQ+" },
  "Women's History": { color: "#7E22CE", icon: "user", label: "Women's" },
  "Cultural Neighborhood": {
    color: "#1D4ED8",
    icon: "home",
    label: "Neighborhood",
  },
  "Freedom Trail": {
    color: "#92400E",
    icon: "compass",
    label: "Freedom Trail",
  },
  "Religious Heritage": {
    color: "#78716C",
    icon: "sun",
    label: "Church/Religious",
  },
  "Immigrant Heritage": {
    color: "#0F766E",
    icon: "anchor",
    label: "Immigrant",
  },
  // Archival color (warm stone) — no red/orange danger hue. Historical record only.
  "Historical Sundown Town": {
    color: "#44403C",
    icon: "book-open",
    label: "Sundown Towns",
  },
  // ── Pin types (pinType field — takes priority over heritageCategory) ───────
  farmers_market: {
    color: "#16A34A",
    icon: "shopping-bag",
    label: "Farmers Market",
  },
  pop_up_market: {
    color: "#16A34A",
    icon: "shopping-bag",
    label: "Pop-up Market",
  },
  market: { color: "#16A34A", icon: "shopping-bag", label: "Market" },
  mural_or_public_art: {
    color: "#0891B2",
    icon: "edit-2",
    label: "Public Art",
  },
  community_org: { color: "#D97706", icon: "users", label: "Community Org" },
  cultural_organization: {
    color: "#D97706",
    icon: "users",
    label: "Cultural Org",
  },
  festival_or_event: {
    color: "#7C3AED",
    icon: "calendar",
    label: "Festival/Event",
  },
  community_event: {
    color: "#2563EB",
    icon: "calendar",
    label: "Community Event",
  },
  park_or_outdoor: { color: "#15803D", icon: "sun", label: "Park/Outdoor" },
  heritage_district: {
    color: "#B45309",
    icon: "map",
    label: "Heritage District",
  },
  cultural_site: { color: "#92400E", icon: "star", label: "Cultural Site" },
  heritage_landmark: {
    color: "#92400E",
    icon: "flag",
    label: "Heritage Landmark",
  },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  color: "#6B7280",
  icon: "map-pin",
  label: "Site",
};

/** pinType takes priority — it's more specific than heritageCategory */
function getCategoryStyle(
  heritageCategory: string,
  pinType?: string | null,
): CategoryStyle {
  if (pinType && CATEGORY_STYLES[pinType]) return CATEGORY_STYLES[pinType];
  return CATEGORY_STYLES[heritageCategory] ?? DEFAULT_CATEGORY_STYLE;
}

interface FullMapViewProps {
  /** When set, the map pans to this tour_cultural_sites ID and opens its card. */
  focusSiteId?: string;
  /** A distinct cultural_sites ID; never interpreted as a tour site. */
  focusCulturalSiteId?: string;
  focusLat?: string;
  focusLng?: string;
  /** Explicit city/state scope supplied by a search or deep link. */
  searchCity?: string;
  searchState?: string;
}

export function FullMapView({
  focusSiteId,
  focusCulturalSiteId,
  focusLat,
  focusLng,
  searchCity,
  searchState,
}: FullMapViewProps = {}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  // react-native-maps may dispatch a MapView press after a Marker press on
  // some iOS/Android combinations. Without this guard, a selected restaurant
  // card can be set and immediately cleared in the same tap.
  const markerPressInFlightRef = useRef(false);
  const hasFitToBusinessesRef = useRef(false); // fire fitToCoordinates only once per scope
  const hasRequestedInitialLocationRef = useRef(false);
  // Native location may resolve before MapView finishes initializing. Queue its
  // first camera update rather than calling into an unready native map surface.
  const mapReadyRef = useRef(false);
  const pendingLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  // A deliberate name lookup must center the exact MWM listing, but it can
  // resolve before Android finishes attaching its native map surface. Queue
  // that one camera action using the same guarded path as device location.
  const pendingBusinessFocusRef = useRef<Business | null>(null);
  // Android can unmount the native map surface before delayed focus/fit work
  // completes (for example, when a member presses Back while a lookup resolves).
  // Never send an imperative camera action to a detached MapView.
  const isMapMountedRef = useRef(true);
  const mapAnimationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const safelyAnimateToRegion = useCallback((region: Region, duration: number) => {
    if (!isMapMountedRef.current || !mapReadyRef.current) return;
    const map = mapRef.current;
    if (!map) return;
    try {
      map.animateToRegion(region, duration);
    } catch {
      // The screen can be leaving while Android detaches the native MapView.
    }
  }, []);

  const safelyFitToCoordinates = useCallback((coordinates: { latitude: number; longitude: number }[]) => {
    if (!isMapMountedRef.current || !mapReadyRef.current) return;
    const map = mapRef.current;
    if (!map) return;
    try {
      map.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 100, left: 40 },
        animated: true,
      });
    } catch {
      // The screen can be leaving while Android detaches the native MapView.
    }
  }, []);

  const scheduleMapAction = useCallback((action: () => void, delayMs: number) => {
    const timer = setTimeout(() => {
      mapAnimationTimersRef.current = mapAnimationTimersRef.current.filter(
        (activeTimer) => activeTimer !== timer,
      );
      if (!isMapMountedRef.current || !mapReadyRef.current) return;
      action();
    }, delayMs);
    mapAnimationTimersRef.current.push(timer);
    return timer;
  }, []);

  useEffect(() => {
    isMapMountedRef.current = true;
    return () => {
      isMapMountedRef.current = false;
      mapReadyRef.current = false;
      pendingLocationRef.current = null;
      pendingBusinessFocusRef.current = null;
      mapAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
      mapAnimationTimersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  const { user } = useAuth();
  const { preferences: memberPreferences } = useUserPreferences();

  const [locationGranted, setLocationGranted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [memberLocation, setMemberLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [memberPlace, setMemberPlace] = useState<{
    city?: string | null;
    state?: string | null;
  } | null>(null);
  // Global collections are never a default. This is an explicit exploration
  // mode; individual travel and deep-link focus actions remain available.
  const exploringAllAreas = false;
  const [searchedLocality, setSearchedLocality] = useState<ReturnType<
    typeof parseMapSearchLocality
  >>(null);
  // Keep the member's draft separate from the submitted request so typing in
  // the single map search field never floods the business API or resets a
  // local map view. A city must include its state (for example, "Atlanta, GA")
  // so ordinary service searches such as "girls clothes" are never mistaken
  // for a city.
  const [businessSearchInput, setBusinessSearchInput] = useState("");
  const [submittedBusinessSearch, setSubmittedBusinessSearch] = useState("");
  // Reversible local grouping for the map's actual loaded records. It never
  // persists assumptions about a member or suppresses records from search.
  const [mapDiscoveryFocus, setMapDiscoveryFocus] = useState<MapDiscoveryFocus>("all");
  const [mapDiscoveryRadius, setMapDiscoveryRadius] = useState<5 | 10 | 25 | 50>(10);
  // The public-facility layer is opt-in and remains distinct from MWM
  // businesses, reviews, ownership designations, and safety information.
  const [essentialServiceCategory, setEssentialServiceCategory] = useState<MapEssentialServiceCategory | null>(null);
  const [essentialServicePlaces, setEssentialServicePlaces] = useState<EssentialServicePlace[]>([]);
  const [selectedEssentialService, setSelectedEssentialService] = useState<EssentialServicePlace | null>(null);
  const [essentialServicesLoading, setEssentialServicesLoading] = useState(false);
  const [essentialServicesError, setEssentialServicesError] = useState<string | null>(null);
  // The map remains a clean locality-first canvas, but it must honor the
  // member's saved Support Lens in the same way as Directory and Kinfolk.
  // Only documented designations are sent; no identity is inferred here.
  const designationIds =
    memberPreferences?.supportLensMode === "strict_documented_designations"
      ? memberPreferences.preferredOwnershipTypes
      : [];
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [scannerAlertIdx, setScannerAlertIdx] = useState(0);
  const [warningIdx, setWarningIdx] = useState(0);

  const showHeatmap = false;
  const showCulturalSites = true;
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [culturalSites, setCulturalSites] = useState<CulturalSite[]>([]);
  const [culturalSitesLoading, setCulturalSitesLoading] = useState(false);
  const [culturalSitesError, setCulturalSitesError] = useState(false);
  const isFetchingCulturalSites = useRef(false);
  const [selectedCulturalSite, setSelectedCulturalSite] =
    useState<CulturalSite | null>(null);
  const activeCulturalCategory = "";

  const showMapEvents = true;
  const [mapEvents, setMapEvents] = useState<MapEventItem[]>([]);
  const [selectedMapEvent, setSelectedMapEvent] = useState<MapEventItem | null>(
    null,
  );
  const isFetchingMapEvents = useRef(false);

  // ── Tour community layers ────────────────────────────────────────────────
  const showCommunityOrgs = false;
  const [communityOrgs, setCommunityOrgs] = useState<TourCommunityOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<TourCommunityOrg | null>(null);
  const isFetchingOrgs = useRef(false);

  const showTourEvents = false;
  const [tourEvents, setTourEvents] = useState<TourRecurringEvent[]>([]);
  const [selectedTourEvent, setSelectedTourEvent] =
    useState<TourRecurringEvent | null>(null);
  const isFetchingTourEvents = useRef(false);

  const [showTourSites, setShowTourSites] = useState(true);
  const [tourSites, setTourSites] = useState<TourHeritageSite[]>([]);
  const [selectedTourSite, setSelectedTourSite] =
    useState<TourHeritageSite | null>(null);
  const isFetchingTourSites = useRef(false);
  const isFetchingFocusedTourSite = useRef(false);
  const isFetchingFocusedCulturalSite = useRef(false);

  // Global destination coordinates are an opt-in travel planning layer. They
  // are never mixed with business pins and do not represent verified venues.
  const showTravelDestinations = false;
  const [travelDestinations, setTravelDestinations] = useState<
    TravelDestination[]
  >([]);
  const [selectedTravelDestination, setSelectedTravelDestination] =
    useState<TravelDestination | null>(null);
  const [travelDestinationsLoading, setTravelDestinationsLoading] =
    useState(false);
  const [travelDestinationsError, setTravelDestinationsError] = useState(false);
  const isFetchingTravelDestinations = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  // iPad, Android tablet, and Chromebook map surfaces should keep controls
  // comfortably reachable without stretching every field across a desktop-wide
  // map. Phone layouts retain the existing full-width presentation.
  const isWideMapSurface = containerSize.w >= 720;
  const wideMapOverlayStyle = isWideMapSurface ? s.wideMapOverlay : undefined;

  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  // Background proximity monitoring is off until a member explicitly chooses
  // a location-based safety action from Safety Hub.
  const pollingEnabled = false;

  const profileLocality = parseProfileHomeLocality(user?.homeCity);
  const routeSearchLocality = parseMapSearchLocality(searchCity, searchState);
  // A submitted search (including a map deep link) is an explicit geography
  // choice, so it overrides automatic device/profile locality until cleared.
  const mapLocality =
    searchedLocality ??
    routeSearchLocality ??
    resolveMapLocality(memberLocation, memberPlace, profileLocality);
  const hasLocalCollectionScope = canLoadLocalCollections(mapLocality);
  const localityScopeKey = mapLocalityKey(mapLocality, exploringAllAreas);
  const collectionScopeQuery = mapCollectionScopeQuery(mapLocality, exploringAllAreas);
  const collectionScopeSuffix = collectionScopeQuery ? `?${collectionScopeQuery}` : "";
  const deliberateMapNameSearch = isDeliberateMapBusinessNameSearch(
    submittedBusinessSearch,
  );

  // GPS remains on-device. Confirmed device coordinates are proximity-ranked;
  // a profile home locality is a city/state fallback. No ordinary map request
  // is allowed to omit both locality sources.
  const {
    businesses,
    isLoading: isBusinessSearchLoading,
    error: businessSearchError,
    searchScope: businessSearchScope,
  } = useBusinesses({
    search: submittedBusinessSearch,
    latitude: deliberateMapNameSearch ? null : memberLocation?.latitude ?? null,
    longitude: deliberateMapNameSearch ? null : memberLocation?.longitude ?? null,
    city: deliberateMapNameSearch ? "" : mapLocality?.city,
    state: deliberateMapNameSearch ? "" : mapLocality?.state,
    radiusMiles: mapDiscoveryRadius,
    designations: designationIds,
    supportScope: memberPreferences?.supportLensMode,
    directName: deliberateMapNameSearch,
    enabled: deliberateMapNameSearch || exploringAllAreas || mapLocality !== null,
  });
  // This is the same small, canonical MWM marker feed that keeps the website
  // populated. It is intentionally separate from locality search: a location
  // permission change or an empty 50-mile local response must not clear a pin
  // layer the member was already able to use.
  const { pins: canonicalMapPins } = useCanonicalMapPins({ enabled: isFocused });

  const {
    alerts: activityAlerts,
    confirmAlert,
    clearAlert,
    dismissAlert,
  } = useActivityAlerts({ enabled: pollingEnabled });
  const { warnings, dismissWarning } = useSafetyProximity({
    enabled: pollingEnabled,
  });
  const { alert: geoAlert, dismissAlert: dismissGeoAlert } = useGeoSafeAlert();

  useEffect(() => {
    if (
      selectedBusiness ||
      selectedCulturalSite ||
      selectedMapEvent ||
      selectedOrg ||
      selectedTourEvent ||
      selectedTourSite ||
      selectedEssentialService
    ) {
      // Keep travel destinations mutually exclusive with all other map cards.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTravelDestination(null);
    }
  }, [
    selectedBusiness,
    selectedCulturalSite,
    selectedMapEvent,
    selectedOrg,
    selectedTourEvent,
    selectedTourSite,
    selectedEssentialService,
  ]);

  const mapped = businesses.filter(
    (b) =>
      b.latitude != null &&
      b.longitude != null &&
      !isNaN(b.latitude) &&
      !isNaN(b.longitude) &&
      isFinite(b.latitude) &&
      isFinite(b.longitude) &&
      b.latitude >= -90 &&
      b.latitude <= 90 &&
      b.longitude >= -180 &&
      b.longitude <= 180 &&
      // Exclude "Null Island" (0,0) — means coordinates were never geocoded
      (Math.abs(b.latitude) > 0.001 || Math.abs(b.longitude) > 0.001),
  );
  const mapDiscoveryCounts = useMemo(
    () => countMapDiscoveryFocuses(mapped),
    [mapped],
  );
  const focusedMappedBusinesses = useMemo(
    () => mapped.filter((business) => matchesMapDiscoveryFocus(business, mapDiscoveryFocus)),
    [mapped, mapDiscoveryFocus],
  );
  const nearbyCanonicalMapPins = useMemo(() => {
    // Canonical pins remain available during an empty local refresh, but they
    // must still respect the member-selected radius so the map count and camera
    // never claim that distant pins are nearby.
    const scopePins = memberLocation
      ? canonicalMapPins.filter((business) =>
          distanceMiles(memberLocation, business) <= mapDiscoveryRadius,
        )
      : canonicalMapPins;
    return scopePins.filter((business) =>
      matchesMapDiscoveryFocus(business, mapDiscoveryFocus),
    );
  }, [canonicalMapPins, mapDiscoveryFocus, mapDiscoveryRadius, memberLocation]);
  const directMatch = businessSearchScope === "explicit_public_listing"
    ? businesses[0] ?? null
    : null;
  const directMatchHasCoordinates = Boolean(
    directMatch &&
    Number.isFinite(directMatch.latitude) &&
    Number.isFinite(directMatch.longitude) &&
    (Math.abs(directMatch.latitude) > 0.001 || Math.abs(directMatch.longitude) > 0.001),
  );
  const displayBusinessPins = useMemo(() => {
    // A member who deliberately searched a named business asked for its exact
    // location, not a broad city overview. Keep the map to the one documented
    // match; the bottom card still opens that listing's MWM profile.
    if (directMatchHasCoordinates && directMatch) return [directMatch];
    // Local/direct results have richer card data and therefore win when the
    // same business exists in both layers. Canonical pins remain underneath as
    // a stable fallback so valid markers do not disappear during a scope change.
    const localById = new Map(focusedMappedBusinesses.map((business) => [business.id, business]));
    nearbyCanonicalMapPins.forEach((business) => {
      if (!localById.has(business.id)) localById.set(business.id, business);
    });
    return [...localById.values()];
  }, [directMatch, directMatchHasCoordinates, focusedMappedBusinesses, nearbyCanonicalMapPins]);
  const visibleMapPinCount = displayBusinessPins.length;
  const activeMapDiscoveryLabel = mapDiscoveryFocus === "all"
    ? "All nearby places"
    : mapDiscoveryCounts.find((focus) => focus.id === mapDiscoveryFocus)?.label ?? "Your selection";
  const localScopeDescription = memberLocation
    ? `within ${mapDiscoveryRadius} miles of your location`
    : mapLocality?.city
      ? `in ${mapLocality.city}${mapLocality.state ? `, ${mapLocality.state}` : ""}`
      : "in your map area";
  const hasSubmittedBusinessSearch = submittedBusinessSearch.length > 0;
  const focusDirectBusinessOnMap = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setSelectedCulturalSite(null);
    setSelectedMapEvent(null);
    setSelectedOrg(null);
    setSelectedTourEvent(null);
    setSelectedTourSite(null);
    setSelectedTravelDestination(null);
    setSelectedEssentialService(null);

    if (!mapReadyRef.current) {
      pendingBusinessFocusRef.current = business;
      return;
    }

    safelyAnimateToRegion({
      latitude: business.latitude,
      longitude: business.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    }, 500);
  }, [safelyAnimateToRegion]);

  const showDirectMatchOnMap = useCallback(() => {
    if (!directMatch || !directMatchHasCoordinates) return;
    focusDirectBusinessOnMap(directMatch);
  }, [directMatch, directMatchHasCoordinates, focusDirectBusinessOnMap]);

  useEffect(() => {
    if (!directMatch || !directMatchHasCoordinates) return;
    focusDirectBusinessOnMap(directMatch);
  }, [directMatch, directMatchHasCoordinates, focusDirectBusinessOnMap]);

  const clearEssentialServices = useCallback(() => {
    setEssentialServiceCategory(null);
    setEssentialServicePlaces([]);
    setSelectedEssentialService(null);
    setEssentialServicesError(null);
  }, []);

  const loadEssentialServices = useCallback(async (category: MapEssentialServiceCategory) => {
    if (!memberLocation) {
      setEssentialServicesError("Use your precise location before looking for public services nearby.");
      return;
    }
    setEssentialServiceCategory(category);
    setEssentialServicePlaces([]);
    setSelectedEssentialService(null);
    setEssentialServicesError(null);
    setEssentialServicesLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      const params = new URLSearchParams({
        category,
        lat: String(memberLocation.latitude),
        lng: String(memberLocation.longitude),
        // Public-facility availability has a separate upstream ceiling. The
        // member-selected 50-mile business expansion never widens this layer.
        radius: String(Math.min(mapDiscoveryRadius, 25)),
      });
      const response = await fetch(`${base}/api/map/essential-services?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  }, [mapDiscoveryRadius, memberLocation]);

  // A changed device coordinate invalidates old availability data. We never
  // re-use a previous location's facilities as though they were still nearby.
  useEffect(() => {
    clearEssentialServices();
  }, [memberLocation?.latitude, memberLocation?.longitude, clearEssentialServices]);

  // A focused Kinfolk/travel link is an explicit single-place request. Load only
  // that item instead of widening the default tour layer to a global collection.
  useEffect(() => {
    if (!focusSiteId || !mapReady || isFetchingFocusedTourSite.current) return;
    if (tourSites.some((site) => site.id === focusSiteId)) return;
    const base = getApiBase();
    if (!base) return;
    isFetchingFocusedTourSite.current = true;
    fetch(`${base}/api/tour-cultural-sites/${encodeURIComponent(focusSiteId)}`)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<TourHeritageSite & { site_type?: string }>)
          : null,
      )
      .then((site) => {
        if (!site) return;
        setTourSites([{
          ...site,
          siteType: site.siteType ?? site.site_type,
        }]);
      })
      .catch(() => {})
      .finally(() => {
        isFetchingFocusedTourSite.current = false;
      });
  }, [focusSiteId, mapReady, tourSites]);

  // ── Focus a specific heritage site when navigated from Kinfolk chat ─────────
  // Runs whenever mapReady, tourSites, or focusSiteId changes so it can resolve
  // even if tour sites finish loading after the screen first opens.
  useEffect(() => {
    if (!focusSiteId || !mapReady) return;

    const site = tourSites.find((s) => s.id === focusSiteId);
    const timer = setTimeout(() => {
      if (site) {
        const lat =
          typeof site.latitude === "string"
            ? parseFloat(site.latitude)
            : (site.latitude ?? NaN);
        const lng =
          typeof site.longitude === "string"
            ? parseFloat(site.longitude)
            : (site.longitude ?? NaN);
        if (!isNaN(lat) && !isNaN(lng)) {
          setShowTourSites(true);
          setSelectedTourSite(site);
          setSelectedBusiness(null);
          setSelectedCulturalSite(null);
          setSelectedMapEvent(null);
          setSelectedOrg(null);
          setSelectedTourEvent(null);
          scheduleMapAction(() => {
            safelyAnimateToRegion(
              {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              },
              700,
            );
          }, 400);
        }
      } else if (focusLat && focusLng) {
        // Site not loaded yet (tourSites still fetching) — pan to coordinates and
        // enable the layer; the effect will re-run once tourSites arrives and select it.
        const lat = parseFloat(focusLat);
        const lng = parseFloat(focusLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setShowTourSites(true);
          safelyAnimateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            },
            700,
          );
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [focusSiteId, focusLat, focusLng, mapReady, safelyAnimateToRegion, scheduleMapAction, tourSites]);

  // Cultural Explorer uses canonical cultural_sites records, which have a
  // different contract from the tour layer above. Keep these focus paths
  // distinct so an HBCU/landmark never becomes a tour-site deep link.
  useEffect(() => {
    if (!focusCulturalSiteId || !mapReady || isFetchingFocusedCulturalSite.current) return;
    if (culturalSites.some((site) => site.id === focusCulturalSiteId)) return;
    isFetchingFocusedCulturalSite.current = true;
    void (async () => {
      try {
        const headers = await getMemberApiHeaders();
        const response = await fetch(`${getApiBase()}/api/cultural-sites/${encodeURIComponent(focusCulturalSiteId)}`, { headers, credentials: "include" });
        if (!response.ok) return;
        const payload = await response.json() as { site?: CulturalSite } & CulturalSite;
        const site = payload.site ?? payload;
        if (site?.id) setCulturalSites((current) => current.some((item) => item.id === site.id) ? current : [...current, site]);
      } catch {}
      finally { isFetchingFocusedCulturalSite.current = false; }
    })();
  }, [focusCulturalSiteId, mapReady, culturalSites]);

  useEffect(() => {
    if (!focusCulturalSiteId || !mapReady) return;
    const site = culturalSites.find((item) => item.id === focusCulturalSiteId);
    const lat = site ? Number(site.latitude) : Number(focusLat);
    const lng = site ? Number(site.longitude) : Number(focusLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setSelectedCulturalSite(site ?? null);
    setSelectedBusiness(null);
    setSelectedMapEvent(null);
    setSelectedOrg(null);
    setSelectedTourEvent(null);
    setSelectedTourSite(null);
    safelyAnimateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 700);
  }, [focusCulturalSiteId, focusLat, focusLng, mapReady, culturalSites, safelyAnimateToRegion]);

  // Markets and recurring events do not share a cultural-site detail route, but
  // a card with verified coordinates may still open the map at that location.
  useEffect(() => {
    if (focusSiteId || focusCulturalSiteId || !mapReady) return;
    const lat = Number(focusLat);
    const lng = Number(focusLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    safelyAnimateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 700);
  }, [focusSiteId, focusCulturalSiteId, focusLat, focusLng, mapReady, safelyAnimateToRegion]);

  // A new local/search scope earns a new fit. Ordinary map views must never
  // fit a country- or world-sized result set; only explicit exploration may.
  useEffect(() => {
    hasFitToBusinessesRef.current = false;
  }, [localityScopeKey, mapDiscoveryFocus, mapDiscoveryRadius]);

  useEffect(() => {
    if (directMatchHasCoordinates) return;
    // Local search results stay first. When a location/radius refresh returns
    // no local rows, fit the stable website-equivalent pins instead of leaving
    // a 50-mile choice on a blank map.
    const pinsToFit = focusedMappedBusinesses.length > 0
      ? focusedMappedBusinesses
      : nearbyCanonicalMapPins;
    if (!mapReady || pinsToFit.length === 0 || hasFitToBusinessesRef.current)
      return;
    const coordinates = pinsToFit.map((b) => ({
      latitude: b.latitude,
      longitude: b.longitude,
    }));
    if (!exploringAllAreas && !isSafeLocalFit(coordinates)) return;
    hasFitToBusinessesRef.current = true;
    scheduleMapAction(() => safelyFitToCoordinates(coordinates), 600);
  }, [directMatchHasCoordinates, mapReady, focusedMappedBusinesses, nearbyCanonicalMapPins, exploringAllAreas, localityScopeKey, mapDiscoveryRadius, safelyFitToCoordinates, scheduleMapAction]);

  const normalizedMapSearch = submittedBusinessSearch.trim().toLowerCase();
  const filteredCulturalSites = culturalSites.filter((site) => {
    // Historical sundown-town records remain source-backed data for the
    // optional travel-alert system. They are intentionally not persistent map
    // pins or a present-day safety rating.
    if (site.heritageCategory === "Historical Sundown Town") return false;
    if (activeCulturalCategory && site.heritageCategory !== activeCulturalCategory) return false;
    if (!normalizedMapSearch) return true;
    return [site.name, site.heritageCategory, site.city, site.state, site.description, site.significance]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(normalizedMapSearch));
  });
  const culturalSearchMatchCount = normalizedMapSearch ? filteredCulturalSites.length : 0;

  const currentWarning =
    warnings[Math.min(warningIdx, Math.max(0, warnings.length - 1))] ?? null;

  useEffect(() => {
    if (
      showHeatmap &&
      heatmapPoints.length === 0 &&
      (exploringAllAreas || hasLocalCollectionScope)
    ) {
      void (async () => {
        try {
          const base = getApiBase();
          if (!base) return;
          const res = await fetch(`${base}/api/safety/heatmap${collectionScopeSuffix}`);
          if (res.ok) {
            const data = (await res.json()) as { points: HeatmapPoint[] };
            setHeatmapPoints(data.points ?? []);
          }
        } catch {}
      })();
    }
  }, [
    showHeatmap,
    heatmapPoints.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    collectionScopeSuffix,
  ]);

  // ── Cultural-sites fetch (resilient) ────────────────────────────────────
  // hasData = true  → refresh in background; keep existing markers on failure
  // hasData = false → initial load; show error banner on failure, no retry storm
  const fetchCulturalSites = useCallback(async (hasData: boolean) => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (!exploringAllAreas && !hasLocalCollectionScope) return;
    if (isFetchingCulturalSites.current) return;
    isFetchingCulturalSites.current = true;
    if (!hasData) setCulturalSitesLoading(true);
    try {
      const base = getApiBase();
      if (!base) return;
      const res = await fetch(`${base}/api/cultural-sites${collectionScopeSuffix}`, {
        headers: await getMemberApiHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          sites?: CulturalSite[];
          items?: CulturalSite[];
        };
        // The canonical map API returns `items`; the legacy route returns
        // `sites`. Supporting both keeps heritage detail cards intact while
        // the local-scope API is rolled out additively.
        setCulturalSites(data.sites ?? data.items ?? []);
        setCulturalSitesError(false);
      } else {
        // Preserve existing markers silently; only surface error when we have nothing
        if (!hasData) setCulturalSitesError(true);
      }
    } catch {
      if (!hasData) setCulturalSitesError(true);
    } finally {
      setCulturalSitesLoading(false);
      isFetchingCulturalSites.current = false;
    }
  }, [exploringAllAreas, hasLocalCollectionScope, collectionScopeSuffix]);

  // Clear stale pins before a changed device/profile/exploration scope reloads.
  useEffect(() => {
    setCulturalSites([]);
    setMapEvents([]);
    setCommunityOrgs([]);
    setTourEvents([]);
    setTourSites([]);
    setHeatmapPoints([]);
    setSelectedCulturalSite(null);
    setSelectedMapEvent(null);
    setSelectedOrg(null);
    setSelectedTourEvent(null);
    setSelectedTourSite(null);
  }, [localityScopeKey]);

  // Heritage Sites load/refresh effects — all guarded by HERITAGE_SITES_ENABLED.
  // fetchCulturalSites() also has its own early-return guard; these effect-level
  // guards prevent any unnecessary setup/teardown while the feature is disabled.
  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (
      showCulturalSites &&
      culturalSites.length === 0 &&
      mapReady &&
      (exploringAllAreas || hasLocalCollectionScope)
    ) {
      void Promise.resolve().then(() => fetchCulturalSites(false));
    }
  }, [
    showCulturalSites,
    mapReady,
    culturalSites.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    fetchCulturalSites,
  ]);

  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (
      isFocused &&
      showCulturalSites &&
      mapReady &&
      (exploringAllAreas || hasLocalCollectionScope)
    ) {
      void Promise.resolve().then(() =>
        fetchCulturalSites(culturalSites.length > 0),
      );
    }
  }, [
    isFocused,
    showCulturalSites,
    mapReady,
    culturalSites.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    fetchCulturalSites,
  ]);

  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (
      !culturalSitesError ||
      !showCulturalSites ||
      (!exploringAllAreas && !hasLocalCollectionScope)
    ) return;
    const timer = setInterval(() => {
      void fetchCulturalSites(false);
    }, 30_000);
    return () => clearInterval(timer);
  }, [
    culturalSitesError,
    showCulturalSites,
    exploringAllAreas,
    hasLocalCollectionScope,
    fetchCulturalSites,
  ]);

  // ── Tour community layer fetches ──────────────────────────────────────────
  useEffect(() => {
    if (
      !showCommunityOrgs ||
      communityOrgs.length > 0 ||
      isFetchingOrgs.current ||
      !mapReady ||
      (!exploringAllAreas && !hasLocalCollectionScope)
    )
      return;
    isFetchingOrgs.current = true;
    const base = getApiBase();
    if (!base) {
      isFetchingOrgs.current = false;
      return;
    }
    fetch(`${base}/api/community-orgs?limit=200${collectionScopeQuery ? `&${collectionScopeQuery}` : ""}`)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ organizations: TourCommunityOrg[] }>)
          : null,
      )
      .then((d) => {
        if (d?.organizations)
          setCommunityOrgs(
            d.organizations.filter(
              (o) => o.latitude != null && o.longitude != null,
            ),
          );
      })
      .catch(() => {})
      .finally(() => {
        isFetchingOrgs.current = false;
      });
  }, [
    showCommunityOrgs,
    mapReady,
    communityOrgs.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    collectionScopeQuery,
  ]);

  useEffect(() => {
    if (
      !showTourEvents ||
      tourEvents.length > 0 ||
      isFetchingTourEvents.current ||
      !mapReady ||
      (!exploringAllAreas && !hasLocalCollectionScope)
    )
      return;
    isFetchingTourEvents.current = true;
    const base = getApiBase();
    if (!base) {
      isFetchingTourEvents.current = false;
      return;
    }
    fetch(`${base}/api/recurring-events?limit=200${collectionScopeQuery ? `&${collectionScopeQuery}` : ""}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ events: TourRecurringEvent[] }>) : null,
      )
      .then((d) => {
        if (d?.events)
          setTourEvents(
            d.events.filter((e) => e.latitude != null && e.longitude != null),
          );
      })
      .catch(() => {})
      .finally(() => {
        isFetchingTourEvents.current = false;
      });
  }, [
    showTourEvents,
    mapReady,
    tourEvents.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    collectionScopeQuery,
  ]);

  useEffect(() => {
    if (
      !showTourSites ||
      tourSites.length > 0 ||
      isFetchingTourSites.current ||
      !mapReady ||
      (!exploringAllAreas && !hasLocalCollectionScope)
    )
      return;
    isFetchingTourSites.current = true;
    const base = getApiBase();
    if (!base) {
      isFetchingTourSites.current = false;
      return;
    }
    fetch(`${base}/api/tour-cultural-sites?limit=300${collectionScopeQuery ? `&${collectionScopeQuery}` : ""}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ sites: TourHeritageSite[] }>) : null,
      )
      .then((d) => {
        if (d?.sites)
          setTourSites(
            d.sites.filter((s) => s.latitude != null && s.longitude != null),
          );
      })
      .catch(() => {})
      .finally(() => {
        isFetchingTourSites.current = false;
      });
  }, [
    showTourSites,
    mapReady,
    tourSites.length,
    exploringAllAreas,
    hasLocalCollectionScope,
    collectionScopeQuery,
  ]);

  useEffect(() => {
    if (
      !showTravelDestinations ||
      travelDestinations.length > 0 ||
      isFetchingTravelDestinations.current ||
      !mapReady
    )
      return;
    isFetchingTravelDestinations.current = true;
    setTravelDestinationsLoading(true);
    setTravelDestinationsError(false);
    const base = getApiBase();
    fetch(
      `${base}/api/map/entities?kind=travel_destination&limit=${MAX_TRAVEL_DESTINATION_MARKERS}`,
    )
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ items: TravelDestination[] }>)
          : Promise.reject(new Error("destination fetch failed")),
      )
      .then((data) => {
        setTravelDestinations(
          (data.items ?? []).filter(
            (item) =>
              item.entity_kind === "travel_destination" &&
              Number.isFinite(item.latitude) &&
              Number.isFinite(item.longitude) &&
              item.latitude >= -90 &&
              item.latitude <= 90 &&
              item.longitude >= -180 &&
              item.longitude <= 180 &&
              (item.latitude !== 0 || item.longitude !== 0),
          ),
        );
      })
      .catch(() => setTravelDestinationsError(true))
      .finally(() => {
        isFetchingTravelDestinations.current = false;
        setTravelDestinationsLoading(false);
      });
  }, [showTravelDestinations, mapReady, travelDestinations.length]);

  // ── Events fetch — location scoped unless member explicitly explores ──────
  useEffect(() => {
    if (
      !mapReady ||
      isFetchingMapEvents.current ||
      (!exploringAllAreas && !hasLocalCollectionScope)
    ) return;
    isFetchingMapEvents.current = true;
    const base = getApiBase();
    if (!base) {
      isFetchingMapEvents.current = false;
      return;
    }
    fetch(`${base}/api/events${collectionScopeSuffix}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<{ events: MapEventItem[] }>) : null,
      )
      .then((d) => {
        if (d?.events) {
          setMapEvents(
            d.events.filter((e) => e.latitude != null && e.longitude != null),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetchingMapEvents.current = false;
      });
  }, [
    mapReady,
    isFocused,
    exploringAllAreas,
    hasLocalCollectionScope,
    collectionScopeSuffix,
  ]);

  const recenter = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMapMountedRef.current) return;
      if (status !== "granted") return;
      setLocationGranted(true);
      const loc = (await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("location timeout")), 8_000),
        ),
      ])) as Awaited<ReturnType<typeof Location.getCurrentPositionAsync>>;
      if (!isMapMountedRef.current) return;
      setMemberLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setMemberPlace({
          city: place?.city ?? place?.subregion ?? null,
          state: place?.region ?? null,
        });
      } catch {
        // Coordinates still provide a valid nearby-business scope.
      }
      const location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      if (!isMapMountedRef.current) return;
      if (!mapReadyRef.current) {
        pendingLocationRef.current = location;
      } else {
        safelyAnimateToRegion(
          { ...location, latitudeDelta: 0.12, longitudeDelta: 0.12 },
          600,
        );
      }
    } catch {} finally {
      if (isMapMountedRef.current) setLocating(false);
    }
  }, [safelyAnimateToRegion]);

  // Ask once when the native map is first opened so nearby results and the
  // camera can use the member's precise device location. A declined request
  // remains safe: profile/search locality stays available and no worldwide
  // default request is introduced.
  useEffect(() => {
    if (Platform.OS === "web" || !isFocused || hasRequestedInitialLocationRef.current) return;
    hasRequestedInitialLocationRef.current = true;
    void recenter();
  }, [isFocused, recenter]);

  const anyCardVisible =
    selectedBusiness !== null ||
    selectedCulturalSite !== null ||
    selectedMapEvent !== null ||
    selectedOrg !== null ||
    selectedTourEvent !== null ||
    selectedTourSite !== null ||
    selectedTravelDestination !== null ||
    selectedEssentialService !== null;

  return (
    <View
      style={s.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onMapReady={() => {
          if (!isMapMountedRef.current) return;
          mapReadyRef.current = true;
          setMapReady(true);
          const pending = pendingLocationRef.current;
          if (pending) {
            pendingLocationRef.current = null;
            safelyAnimateToRegion(
              { ...pending, latitudeDelta: 0.12, longitudeDelta: 0.12 },
              600,
            );
          }
          const pendingBusiness = pendingBusinessFocusRef.current;
          if (pendingBusiness) {
            pendingBusinessFocusRef.current = null;
            safelyAnimateToRegion(
              {
                latitude: pendingBusiness.latitude,
                longitude: pendingBusiness.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              },
              500,
            );
          }
        }}
        {...(Platform.OS === "ios"
          ? {
              pointsOfInterestFilter: [
                "park",
                "nationalPark",
                "beach",
                "campground",
                "marina",
                "hospital",
                "pharmacy",
                "police",
                "fireStation",
                "museum",
                "theater",
                "library",
                "university",
                "school",
                "publicTransport",
                "airport",
                "stadium",
                "zoo",
                "aquarium",
                "postOffice",
                "restroom",
              ],
            }
          : {})}
        onPress={() => {
          Keyboard.dismiss();
          if (markerPressInFlightRef.current) {
            markerPressInFlightRef.current = false;
            return;
          }
          setSelectedBusiness(null);
          setSelectedCulturalSite(null);
          setSelectedOrg(null);
          setSelectedTourEvent(null);
          setSelectedTourSite(null);
          setSelectedTravelDestination(null);
          setSelectedEssentialService(null);
        }}
      >
        {/* Business pins — the canonical MWM layer remains mounted beneath
            locality/direct-search results, matching the website and preventing
            location permission or an empty radius refresh from blanking pins. */}
        {displayBusinessPins.map((biz) => (
          <Marker
            key={biz.id}
            coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
            onPress={() => {
              markerPressInFlightRef.current = true;
              setTimeout(() => {
                markerPressInFlightRef.current = false;
              }, 250);
              setSelectedBusiness(biz);
              setSelectedCulturalSite(null);
            }}
            tracksViewChanges={false}
            pinColor={GOLD}
          />
        ))}

        {/* Explicit public-facility availability pins. They are intentionally
            teal, visually distinct from MWM business gold, and never carry
            ownership, review, safety, or recommendation meaning. */}
        {essentialServicePlaces.map((place) => (
          <Marker
            key={`essential-${place.id}`}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            onPress={() => {
              setSelectedEssentialService(place);
              setSelectedBusiness(null);
              setSelectedCulturalSite(null);
              setSelectedMapEvent(null);
              setSelectedOrg(null);
              setSelectedTourEvent(null);
              setSelectedTourSite(null);
              setSelectedTravelDestination(null);
            }}
            tracksViewChanges={false}
            pinColor="#0F766E"
          />
        ))}

        {/* Safety heatmap circles */}
        {showHeatmap &&
          heatmapPoints.map((p) => {
            const fillColor =
              p.avgScore >= 70
                ? "rgba(34,197,94,0.18)"
                : p.avgScore >= 50
                  ? "rgba(251,191,36,0.18)"
                  : "rgba(239,68,68,0.18)";
            const strokeColor =
              p.avgScore >= 70
                ? "rgba(34,197,94,0.60)"
                : p.avgScore >= 50
                  ? "rgba(251,191,36,0.60)"
                  : "rgba(239,68,68,0.60)";
            return (
              <Circle
                key={`heat-${p.city}`}
                center={{ latitude: p.lat, longitude: p.lng }}
                radius={9000}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={1.5}
              />
            );
          })}

        {/* Cultural heritage pins — consistent shape, category color.
            Capped at MAX_HERITAGE_MARKERS to bound memory on low-end devices.
            filteredCulturalSites already coordinate-validated below. */}
        {HERITAGE_SITES_ENABLED &&
          showCulturalSites &&
          filteredCulturalSites.slice(0, MAX_HERITAGE_MARKERS).map((site) => {
            const lat = parseFloat(site.latitude);
            const lng = parseFloat(site.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            const cs = getCategoryStyle(site.heritageCategory, site.pinType);
            const isSelected = selectedCulturalSite?.id === site.id;
            return (
              <Marker
                key={site.id}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  setSelectedCulturalSite(site);
                  setSelectedBusiness(null);
                  setSelectedMapEvent(null);
                }}
                zIndex={isSelected ? 10 : 1}
                tracksViewChanges={false}
                pinColor={cs.color}
              />
            );
          })}

        {/* Community org pins — purple */}
        {showCommunityOrgs &&
          communityOrgs.map((org) => {
            const lat =
              typeof org.latitude === "string"
                ? parseFloat(org.latitude)
                : (org.latitude ?? NaN);
            const lng =
              typeof org.longitude === "string"
                ? parseFloat(org.longitude)
                : (org.longitude ?? NaN);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={`org-${org.id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  setSelectedOrg(org);
                  setSelectedBusiness(null);
                  setSelectedCulturalSite(null);
                  setSelectedMapEvent(null);
                  setSelectedTourEvent(null);
                  setSelectedTourSite(null);
                }}
                tracksViewChanges={false}
                pinColor="#7C3AED"
              />
            );
          })}

        {/* Recurring event pins — teal */}
        {showTourEvents &&
          tourEvents.map((evt) => {
            const lat =
              typeof evt.latitude === "string"
                ? parseFloat(evt.latitude)
                : (evt.latitude ?? NaN);
            const lng =
              typeof evt.longitude === "string"
                ? parseFloat(evt.longitude)
                : (evt.longitude ?? NaN);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={`tevt-${evt.id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  setSelectedTourEvent(evt);
                  setSelectedBusiness(null);
                  setSelectedCulturalSite(null);
                  setSelectedMapEvent(null);
                  setSelectedOrg(null);
                  setSelectedTourSite(null);
                }}
                tracksViewChanges={false}
                pinColor="#0D9488"
              />
            );
          })}

        {/* Tour heritage site pins — amber for landmarks, teal for murals/public art */}
        {showTourSites &&
          tourSites.map((site) => {
            const lat =
              typeof site.latitude === "string"
                ? parseFloat(site.latitude)
                : (site.latitude ?? NaN);
            const lng =
              typeof site.longitude === "string"
                ? parseFloat(site.longitude)
                : (site.longitude ?? NaN);
            if (isNaN(lat) || isNaN(lng)) return null;
            const isMural = site.siteType === "mural";
            return (
              <Marker
                key={`tsite-${site.id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  setSelectedTourSite(site);
                  setSelectedBusiness(null);
                  setSelectedCulturalSite(null);
                  setSelectedMapEvent(null);
                  setSelectedOrg(null);
                  setSelectedTourEvent(null);
                }}
                tracksViewChanges={false}
                pinColor={isMural ? "#0891B2" : "#D97706"}
              />
            );
          })}

        {/* Global travel planning destinations — blue and opt-in, never business pins. */}
        {showTravelDestinations &&
          travelDestinations
            .slice(0, MAX_TRAVEL_DESTINATION_MARKERS)
            .map((destination) => (
              <Marker
                key={`destination-${destination.id}`}
                coordinate={{
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                }}
                onPress={() => {
                  setSelectedTravelDestination(destination);
                  setSelectedBusiness(null);
                  setSelectedCulturalSite(null);
                  setSelectedMapEvent(null);
                  setSelectedOrg(null);
                  setSelectedTourEvent(null);
                  setSelectedTourSite(null);
                }}
                tracksViewChanges={false}
                pinColor="#2563A8"
              />
            ))}

        {/* Community event pins — orange, plain pinColor (safe on Android Fabric) */}
        {showMapEvents &&
          mapEvents.map((evt) => {
            const lat = parseFloat(evt.latitude ?? "");
            const lng = parseFloat(evt.longitude ?? "");
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={evt.id}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  setSelectedMapEvent(evt);
                  setSelectedBusiness(null);
                  setSelectedCulturalSite(null);
                }}
                tracksViewChanges={false}
                pinColor="#EA580C"
              />
            );
          })}
      </MapView>

      {/* ── Top overlay ── */}
      <View style={[s.topOverlay, { paddingTop: insets.top + 6 }]}>
        {/* Activity scanner banner */}
        {activityAlerts.length > 0 &&
          (() => {
            const a =
              activityAlerts[
                Math.min(scannerAlertIdx, activityAlerts.length - 1)
              ];
            if (!a) return null;
            const meta = ALERT_META[a.type as AlertType] ?? ALERT_META.other;
            return (
              <View style={[s.banner, { backgroundColor: meta.bgColor }]}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
                    <Text style={s.bannerTitle}>{meta.label}</Text>
                    {activityAlerts.length > 1 && (
                      <View style={s.badgePill}>
                        <Text style={s.badgePillTxt}>
                          {activityAlerts.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.bannerSub}>
                    {a.distanceMeters < 1000
                      ? "< 0.1 mi away"
                      : `${(a.distanceMeters / 1609.34).toFixed(1)} mi away`}
                    {a.confirmedCount > 0
                      ? ` · ${a.confirmedCount} confirmed`
                      : ""}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
                >
                  <TouchableOpacity
                    style={s.bannerBtn}
                    onPress={() => void confirmAlert(a.id)}
                  >
                    <Text style={s.bannerBtnTxt}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.bannerBtn,
                      { backgroundColor: "rgba(255,255,255,0.15)" },
                    ]}
                    onPress={() => void clearAlert(a.id)}
                  >
                    <Text style={s.bannerBtnTxt}>✗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => dismissAlert(a.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

        {activityAlerts.length > 1 && (
          <View style={[s.navRow, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setScannerAlertIdx((i) => Math.max(0, i - 1))}
              disabled={scannerAlertIdx === 0}
              style={{ opacity: scannerAlertIdx === 0 ? 0.3 : 1 }}
            >
              <Feather name="chevron-left" size={15} color={GOLD} />
            </TouchableOpacity>
            <Text style={[s.navTxt, { color: GOLD }]}>
              Alert {scannerAlertIdx + 1} of {activityAlerts.length}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setScannerAlertIdx((i) =>
                  Math.min(activityAlerts.length - 1, i + 1),
                )
              }
              disabled={scannerAlertIdx === activityAlerts.length - 1}
              style={{
                opacity:
                  scannerAlertIdx === activityAlerts.length - 1 ? 0.3 : 1,
              }}
            >
              <Feather name="chevron-right" size={15} color={GOLD} />
            </TouchableOpacity>
          </View>
        )}

        {/* Proximity safety warning */}
        {currentWarning && (
          <View style={[s.banner, { backgroundColor: "#7F1D1D" }]}>
            <Feather name="alert-octagon" size={13} color="#fff" />
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={s.bannerTitle}>{currentWarning.name}</Text>
              <Text style={s.bannerSub}>
                {currentWarning.distanceMeters < 1000
                  ? "< 0.1 mi away"
                  : `${(currentWarning.distanceMeters / 1609.34).toFixed(1)} mi away`}{" "}
                · {currentWarning.reportCount} community{" "}
                {currentWarning.reportCount === 1 ? "report" : "reports"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                dismissWarning(currentWarning.targetId);
                setWarningIdx((i) => Math.max(0, i - 1));
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        {/* Geo-safe area alert */}
        {!currentWarning && geoAlert && (
          <TouchableOpacity
            style={[s.banner, { backgroundColor: "#92400E" }]}
            onPress={dismissGeoAlert}
            activeOpacity={0.85}
          >
            <Feather name="alert-triangle" size={13} color="#fff" />
            <Text style={[s.bannerSub, { flex: 1, marginLeft: 6 }]}>
              Safety alert · {geoAlert.city}
              {geoAlert.neighborhood ? ` · ${geoAlert.neighborhood}` : ""} — avg
              score {geoAlert.avgSafetyScore}/100 from {geoAlert.surveyCount}{" "}
              reports
            </Text>
          </TouchableOpacity>
        )}

        {/* One canonical search drives local business, service, item, and explicit
            city queries. The existing server search supplies normalization and
            typo-tolerant matching; an explicit "City, ST" changes the map scope. */}
        <View style={[s.businessSearchWrap, wideMapOverlayStyle]}>
          <Feather name="search" size={16} color="#F5EBD8" />
          <TextInput
            value={businessSearchInput}
            onChangeText={setBusinessSearchInput}
          onSubmitEditing={() => {
              Keyboard.dismiss();
              clearEssentialServices();
              const query = businessSearchInput.trim();
              const locality = parseMapSearchLocality(query);
              if (locality?.state) {
                setSearchedLocality(locality);
                setSubmittedBusinessSearch("");
              } else {
                setSubmittedBusinessSearch(query);
              }
              setSelectedBusiness(null);
            }}
            placeholder="Search a business, service, item, or city"
            placeholderTextColor="rgba(255,255,255,0.72)"
            style={s.businessSearchInput}
            returnKeyType="search"
            blurOnSubmit
            accessibilityLabel="Search the map by business, service, item, or city"
          />
          <TouchableOpacity
            onPress={() => Keyboard.dismiss()}
            accessibilityRole="button"
            accessibilityLabel="Close keyboard and continue exploring the map"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={s.dismissKeyboardButton}
          >
            <Feather name="chevron-down" size={18} color="#F5EBD8" />
          </TouchableOpacity>
          {(businessSearchInput.length > 0 || searchedLocality || routeSearchLocality) && (
            <TouchableOpacity
              onPress={() => {
                setBusinessSearchInput("");
                setSubmittedBusinessSearch("");
                setSearchedLocality(null);
                setSelectedBusiness(null);
              }}
              accessibilityLabel="Clear map search and return to my local map"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={15} color="#F5EBD8" />
            </TouchableOpacity>
          )}
        </View>
        {hasSubmittedBusinessSearch && (
          <View style={[s.businessSearchStatus, wideMapOverlayStyle]}>
            <Text style={s.businessSearchStatusText}>
              {isBusinessSearchLoading
                ? deliberateMapNameSearch
                  ? "Finding the business you named…"
                  : "Searching local listings…"
                : businessSearchError
                  ? "Couldn’t search local listings. Try again."
                  : directMatch
                    ? `${directMatch.name} is available by direct name${directMatchHasCoordinates ? ". Show its pin below." : "."}`
                    : mapped.length + culturalSearchMatchCount > 0
                    ? `${mapped.length + culturalSearchMatchCount} mapped local result${mapped.length + culturalSearchMatchCount === 1 ? "" : "s"}`
                    : "No mapped local results. Try another name, service, or location."}
            </Text>
            {directMatchHasCoordinates && !isBusinessSearchLoading && (
              <TouchableOpacity
                onPress={showDirectMatchOnMap}
                accessibilityLabel={`Show ${directMatch?.name ?? "this business"} on the map`}
                style={s.directMatchAction}
              >
                <Feather name="map-pin" size={13} color="#FFFFFF" />
                <Text style={s.directMatchActionText}>Show pin</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {mapLocality && (
          <View
            accessibilityLabel="Around you map discovery"
            style={[s.mapDiscoveryCard, wideMapOverlayStyle]}
          >
            <View style={s.mapDiscoveryHeader}>
              <View style={s.mapDiscoveryIcon}>
                <Feather name="compass" size={14} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.mapDiscoveryTitle}>Around you</Text>
                <Text style={s.mapDiscoverySubtitle}>
                  {visibleMapPinCount} MWM map {visibleMapPinCount === 1 ? "pin" : "pins"} {localScopeDescription}.
                </Text>
              </View>
              {mapDiscoveryFocus !== "all" && (
                <TouchableOpacity
                  onPress={() => setMapDiscoveryFocus("all")}
                  accessibilityLabel="Show every nearby map pin"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.mapDiscoveryReset}>Show all</Text>
                </TouchableOpacity>
              )}
            </View>

            {memberLocation && (
              <View style={s.mapDiscoveryRadiusRow}>
                {[5, 10, 25, 50].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    onPress={() => setMapDiscoveryRadius(radius as 5 | 10 | 25 | 50)}
                    accessibilityLabel={`Show places within ${radius} miles`}
                    accessibilityState={{ selected: mapDiscoveryRadius === radius }}
                    style={[
                      s.mapDiscoveryRadius,
                      mapDiscoveryRadius === radius && s.mapDiscoveryRadiusActive,
                    ]}
                  >
                    <Text style={[
                      s.mapDiscoveryRadiusText,
                      mapDiscoveryRadius === radius && s.mapDiscoveryRadiusTextActive,
                    ]}>{radius} mi</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.mapDiscoveryFocusRow}
            >
              {mapDiscoveryCounts.filter((focus) => focus.count > 0).map((focus) => (
                <TouchableOpacity
                  key={focus.id}
                  onPress={() => {
                    setMapDiscoveryFocus(focus.id);
                    setSelectedBusiness(null);
                  }}
                  accessibilityLabel={`Show ${focus.label} nearby`}
                  accessibilityState={{ selected: mapDiscoveryFocus === focus.id }}
                  style={[
                    s.mapDiscoveryFocus,
                    mapDiscoveryFocus === focus.id && s.mapDiscoveryFocusActive,
                  ]}
                >
                  <Text style={[
                    s.mapDiscoveryFocusText,
                    mapDiscoveryFocus === focus.id && s.mapDiscoveryFocusTextActive,
                  ]}>
                    {focus.count} {focus.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {mapDiscoveryFocus !== "all" && (
              <Text style={s.mapDiscoveryExplanation}>
                Showing {activeMapDiscoveryLabel.toLowerCase()} because you chose it. This uses existing listing categories and tags; direct search stays in charge.
              </Text>
            )}

            <View style={s.essentialServicesSection} testID="essential-services-card">
              <View style={s.essentialServicesHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.essentialServicesTitle}>Everyday essentials</Text>
                  <Text style={s.essentialServicesSubtitle}>
                    Public facilities within {mapDiscoveryRadius} miles. This is availability, not an MWM recommendation.
                  </Text>
                </View>
                {essentialServiceCategory && (
                  <TouchableOpacity
                    onPress={clearEssentialServices}
                    accessibilityLabel="Clear public service map pins"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.essentialServicesClear}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.essentialServicesChipRow}
              >
                {MAP_ESSENTIAL_SERVICE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    disabled={essentialServicesLoading}
                    onPress={() => void loadEssentialServices(category.id)}
                    accessibilityLabel={`Show nearby ${category.label}`}
                    accessibilityState={{ selected: essentialServiceCategory === category.id, disabled: essentialServicesLoading }}
                    style={[
                      s.essentialServicesChip,
                      essentialServiceCategory === category.id && s.essentialServicesChipActive,
                    ]}
                  >
                    <Text style={[
                      s.essentialServicesChipText,
                      essentialServiceCategory === category.id && s.essentialServicesChipTextActive,
                    ]}>
                      {essentialServicesLoading && essentialServiceCategory === category.id ? "Loading…" : category.shortLabel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {essentialServicesError ? (
                <Text accessibilityRole="alert" style={s.essentialServicesError}>{essentialServicesError}</Text>
              ) : essentialServiceCategory && !essentialServicesLoading ? (
                <Text accessibilityLiveRegion="polite" style={s.essentialServicesStatus}>
                  {essentialServicePlaces.length === 0
                    ? "No matching public facilities were returned. Try another category or radius."
                    : `${essentialServicePlaces.length} public ${essentialServicePlaces.length === 1 ? "facility is" : "facilities are"} shown as teal pins. Tap a pin for directions.`} Source: Google Maps. No ownership, safety, or recommendation claim is implied.
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {!mapLocality && !exploringAllAreas && (
          <View style={[s.localityPrompt, wideMapOverlayStyle]}>
            <Text style={s.localityPromptText}>
              Choose a city or use your location to see nearby businesses, culture, events, and safety context.
            </Text>
          </View>
        )}

        {/* Search is the map’s sole discovery control. Category, support, and layer
            shortcuts remain searchable without crowding the locality-first map. */}

      </View>

      {/* Locating spinner */}
      {locating && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={s.locatingWrap}>
            <View style={s.locatingPill}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={s.locatingTxt}>Finding your location…</Text>
            </View>
          </View>
        </View>
      )}

      {/* Explicit opt-in for precise nearby discovery. */}
      <TouchableOpacity
          style={[
            s.fab,
            {
              backgroundColor: colors.background,
              bottom: anyCardVisible ? KINFOLK_CLEAR + 210 : insets.bottom + 24,
            },
          ]}
          onPress={() => void recenter()}
          accessibilityLabel={locationGranted ? "Refresh my precise map location" : "Use my precise location for nearby businesses"}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={20} color={GOLD} />
      </TouchableOpacity>

      {/* ── Essential service availability card ── */}
      {selectedEssentialService &&
        !selectedBusiness &&
        !selectedCulturalSite &&
        !selectedMapEvent &&
        !selectedOrg &&
        !selectedTourEvent &&
        !selectedTourSite &&
        !selectedTravelDestination && (
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.card,
                borderColor: "#0F766E40",
                paddingBottom: insets.bottom + 12,
                bottom: KINFOLK_CLEAR,
              },
            ]}
          >
            <View style={s.cardHandle} />
            <TouchableOpacity
              style={s.cardClose}
              onPress={() => setSelectedEssentialService(null)}
              accessibilityLabel="Close public service details"
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[s.catPill, { backgroundColor: "#CCFBF1", alignSelf: "flex-start", marginBottom: 8 }]}>
              <Feather name="map-pin" size={11} color="#115E59" />
              <Text style={[s.catPillTxt, { color: "#115E59" }]}>Public service · Google Maps</Text>
            </View>
            <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>
              {selectedEssentialService.name}
            </Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop: 2 }]} numberOfLines={3}>
              {selectedEssentialService.address}
            </Text>
            <Text style={[s.essentialServiceDisclaimer, { color: colors.mutedForeground }]}>
              This is not an MWM listing, ownership designation, safety rating, or recommendation. Confirm hours, accessibility, and current eligibility directly with the provider.
            </Text>
            <View style={[s.cardBtnRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={[s.cardBtnHalf, { borderWidth: 1.5, borderColor: "#0F766E" }]}
                activeOpacity={0.85}
                onPress={() => void openMapDirections(
                  selectedEssentialService.latitude,
                  selectedEssentialService.longitude,
                  selectedEssentialService.name,
                )}
              >
                <Feather name="navigation" size={14} color="#0F766E" />
                <Text style={[s.cardBtnTxt, { color: "#0F766E" }]}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.cardBtnHalf, { backgroundColor: "#0F766E" }]}
                activeOpacity={0.85}
                onPress={() => void openExternalUrl(selectedEssentialService.directionsUrl)}
              >
                <Feather name="external-link" size={14} color="#fff" />
                <Text style={s.cardBtnTxt}>Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* ── Cultural site bottom card ── */}
      {HERITAGE_SITES_ENABLED &&
        selectedCulturalSite &&
        (() => {
          const site = selectedCulturalSite;
          const cs = getCategoryStyle(site.heritageCategory, site.pinType);
          const isUnclaimed = site.listingStatus === "live_unclaimed";
          const bodyText = site.description || site.significance || null;

          return (
            <View
              style={[
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: cs.color + "40",
                  paddingBottom: insets.bottom + 12,
                  bottom: KINFOLK_CLEAR,
                },
              ]}
            >
              <View style={s.cardHandle} />
              <TouchableOpacity
                style={s.cardClose}
                onPress={() => setSelectedCulturalSite(null)}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              {/* Unclaimed banner */}
              {isUnclaimed && (
                <View style={[s.unclaimedBanner, { borderColor: GOLD + "50" }]}>
                  <Feather name="info" size={12} color={GOLD} />
                  <Text
                    style={[s.unclaimedTxt, { color: GOLD }]}
                    numberOfLines={2}
                  >
                    Community Listed — This place has not yet claimed its
                    profile. Info provided by the MWM community.
                  </Text>
                </View>
              )}

              {/* Category pill + cultural community chip */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <View style={[s.catPill, { backgroundColor: cs.color + "18" }]}>
                  <Feather name={cs.icon} size={11} color={cs.color} />
                  <Text style={[s.catPillTxt, { color: cs.color }]}>
                    {cs.label}
                  </Text>
                </View>
                {site.culturalCommunity ? (
                  <View
                    style={[
                      s.catPill,
                      {
                        backgroundColor: colors.muted + "60",
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[s.catPillTxt, { color: colors.mutedForeground }]}
                    >
                      {site.culturalCommunity}
                    </Text>
                  </View>
                ) : null}
                {(site.yearEstablished || site.era) && (
                  <Text style={[s.estTxt, { color: colors.mutedForeground }]}>
                    {site.yearEstablished
                      ? `Est. ${site.yearEstablished}`
                      : site.era}
                  </Text>
                )}
              </View>

              {/* Name + city */}
              <Text
                style={[s.cardName, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {site.name}
              </Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {site.city}, {site.state}
              </Text>

              {/* Scrollable rich content */}
              <ScrollView
                style={{ maxHeight: 120 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {bodyText ? (
                  <Text style={[s.culturalDesc, { color: colors.foreground }]}>
                    {bodyText}
                  </Text>
                ) : null}
                {site.visitTip ? (
                  <View
                    style={[
                      s.visitTipBox,
                      {
                        backgroundColor: cs.color + "10",
                        borderLeftColor: cs.color,
                      },
                    ]}
                  >
                    <Text style={[s.visitTipTxt, { color: colors.foreground }]}>
                      {site.visitTip}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* Action buttons */}
              <View style={s.cardBtnRow}>
                <TouchableOpacity
                  style={[
                    s.cardBtnHalf,
                    { borderWidth: 1.5, borderColor: cs.color },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const lat = parseFloat(site.latitude);
                    const lng = parseFloat(site.longitude);
                    void openMapDirections(lat, lng, site.name);
                  }}
                >
                  <Feather name="navigation" size={14} color={cs.color} />
                  <Text style={[s.cardBtnTxt, { color: cs.color }]}>
                    Directions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cardBtnHalf, { backgroundColor: cs.color }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/cultural-heritage",
                      params: {
                        initialCategory: site.heritageCategory,
                        siteId: site.id,
                      },
                    })
                  }
                >
                  <Feather name={cs.icon} size={14} color="#fff" />
                  <Text style={s.cardBtnTxt}>View Site</Text>
                </TouchableOpacity>
              </View>

              {/* Secondary links row */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  marginTop: 8,
                  paddingHorizontal: 2,
                }}
              >
                {site.externalUrl ? (
                  <TouchableOpacity
                    onPress={() => void openExternalUrl(site.externalUrl)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Feather name="external-link" size={12} color={cs.color} />
                    <Text style={[s.linkTxt, { color: cs.color }]}>
                      Learn More
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/cultural-heritage",
                      params: { city: site.city },
                    })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Feather
                    name="map"
                    size={12}
                    color={colors.mutedForeground}
                  />
                  <Text style={[s.linkTxt, { color: colors.mutedForeground }]}>
                    {site.city}&apos;s Living Legacy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

      {/* ── Event bottom card ── */}
      {!selectedCulturalSite &&
        !selectedBusiness &&
        selectedMapEvent &&
        (() => {
          const evt = selectedMapEvent;
          const dateStr = evt.date
            ? new Date(evt.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;
          return (
            <View
              style={[
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: "#EA580C40",
                  paddingBottom: insets.bottom + 12,
                  bottom: KINFOLK_CLEAR,
                },
              ]}
            >
              <View style={s.cardHandle} />
              <TouchableOpacity
                style={s.cardClose}
                onPress={() => setSelectedMapEvent(null)}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <View style={[s.catPill, { backgroundColor: "#EA580C18" }]}>
                  <Feather name="calendar" size={11} color="#EA580C" />
                  <Text style={[s.catPillTxt, { color: "#EA580C" }]}>
                    {evt.category}
                  </Text>
                </View>
                {evt.isFree && (
                  <View style={[s.catPill, { backgroundColor: "#16A34A18" }]}>
                    <Text style={[s.catPillTxt, { color: "#16A34A" }]}>
                      Free
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[s.cardName, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {evt.title}
              </Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {evt.city}, {evt.state}
              </Text>

              {evt.location ? (
                <Text
                  style={[
                    s.cardSub,
                    {
                      color: colors.mutedForeground,
                      marginTop: -4,
                      marginBottom: 6,
                    },
                  ]}
                >
                  {evt.location}
                </Text>
              ) : null}
              {dateStr ? (
                <Text
                  style={[s.catPillTxt, { color: "#EA580C", marginBottom: 12 }]}
                >
                  {dateStr}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[s.cardBtn, { backgroundColor: "#EA580C" }]}
                activeOpacity={0.85}
                onPress={() => {
                  const lat = parseFloat(evt.latitude ?? "");
                  const lng = parseFloat(evt.longitude ?? "");
                  if (!isNaN(lat) && !isNaN(lng)) {
                    void openMapDirections(lat, lng, evt.title);
                  }
                }}
              >
                <Feather name="navigation" size={14} color="#fff" />
                <Text style={s.cardBtnTxt}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

      {/* ── Community Org card ── */}
      {selectedOrg &&
        !selectedBusiness &&
        !selectedCulturalSite &&
        !selectedMapEvent &&
        !selectedTourEvent &&
        !selectedTourSite && (
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.card,
                borderColor: "#7C3AED40",
                paddingBottom: insets.bottom + 12,
                bottom: KINFOLK_CLEAR,
              },
            ]}
          >
            <View style={s.cardHandle} />
            <TouchableOpacity
              style={s.cardClose}
              onPress={() => setSelectedOrg(null)}
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View
              style={[
                s.catPill,
                {
                  backgroundColor: "#7C3AED18",
                  marginBottom: 8,
                  alignSelf: "flex-start",
                },
              ]}
            >
              <Feather name="users" size={11} color="#7C3AED" />
              <Text style={[s.catPillTxt, { color: "#7C3AED" }]}>
                {selectedOrg.category.replace(/_/g, " ")}
              </Text>
            </View>
            <Text
              style={[s.cardName, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {selectedOrg.name}
            </Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
              {selectedOrg.city}, {selectedOrg.state}
            </Text>
            {selectedOrg.mission ? (
              <Text
                style={[s.culturalDesc, { color: colors.foreground }]}
                numberOfLines={3}
              >
                {selectedOrg.mission}
              </Text>
            ) : null}
            {selectedOrg.address ? (
              <Text
                style={[
                  s.cardSub,
                  { color: colors.mutedForeground, marginTop: -4 },
                ]}
              >
                {selectedOrg.address}
              </Text>
            ) : null}
            <View style={[s.cardBtnRow, { marginTop: 10 }]}>
              {selectedOrg.website ? (
                <TouchableOpacity
                  style={[
                    s.cardBtnHalf,
                    { borderWidth: 1.5, borderColor: "#7C3AED" },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => void openExternalUrl(selectedOrg.website)}
                >
                  <Feather name="external-link" size={14} color="#7C3AED" />
                  <Text style={[s.cardBtnTxt, { color: "#7C3AED" }]}>
                    Website
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[s.cardBtnHalf, { backgroundColor: "#7C3AED" }]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/edit-suggestion",
                    params: {
                      entityType: "community_org",
                      entityId: selectedOrg.id,
                      entityName: selectedOrg.name,
                    },
                  })
                }
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={s.cardBtnTxt}>Suggest Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* ── Recurring Event card ── */}
      {selectedTourEvent &&
        !selectedBusiness &&
        !selectedCulturalSite &&
        !selectedMapEvent &&
        !selectedOrg &&
        !selectedTourSite && (
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.card,
                borderColor: "#0D948840",
                paddingBottom: insets.bottom + 12,
                bottom: KINFOLK_CLEAR,
              },
            ]}
          >
            <View style={s.cardHandle} />
            <TouchableOpacity
              style={s.cardClose}
              onPress={() => setSelectedTourEvent(null)}
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <View style={[s.catPill, { backgroundColor: "#0D948818" }]}>
                <Feather name="repeat" size={11} color="#0D9488" />
                <Text style={[s.catPillTxt, { color: "#0D9488" }]}>
                  {selectedTourEvent.frequency}
                </Text>
              </View>
              {selectedTourEvent.day_of_week ? (
                <View
                  style={[
                    s.catPill,
                    {
                      backgroundColor: colors.muted + "60",
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[s.catPillTxt, { color: colors.mutedForeground }]}
                  >
                    {selectedTourEvent.day_of_week}
                  </Text>
                </View>
              ) : null}
              {selectedTourEvent.start_time ? (
                <Text style={[s.catPillTxt, { color: "#0D9488" }]}>
                  {selectedTourEvent.start_time}
                  {selectedTourEvent.end_time
                    ? ` – ${selectedTourEvent.end_time}`
                    : ""}
                </Text>
              ) : null}
            </View>
            <Text
              style={[s.cardName, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {selectedTourEvent.name}
            </Text>
            {selectedTourEvent.venue ? (
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {selectedTourEvent.venue} · {selectedTourEvent.city},{" "}
                {selectedTourEvent.state}
              </Text>
            ) : (
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {selectedTourEvent.city}, {selectedTourEvent.state}
              </Text>
            )}
            {selectedTourEvent.description ? (
              <Text
                style={[s.culturalDesc, { color: colors.foreground }]}
                numberOfLines={3}
              >
                {selectedTourEvent.description}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[s.cardBtn, { backgroundColor: "#0D9488", marginTop: 8 }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/edit-suggestion",
                  params: {
                    entityType: "recurring_event",
                    entityId: selectedTourEvent.id,
                    entityName: selectedTourEvent.name,
                  },
                })
              }
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={s.cardBtnTxt}>Suggest an Edit</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* ── Tour Heritage Site card ── */}
      {selectedTourSite &&
        !selectedBusiness &&
        !selectedCulturalSite &&
        !selectedMapEvent &&
        !selectedOrg &&
        !selectedTourEvent &&
        (() => {
          const isMural = selectedTourSite.siteType === "mural";
          const accent = isMural ? "#0891B2" : "#D97706";
          const accentBg = isMural ? "#0891B218" : "#D9770618";
          const pillIcon: React.ComponentProps<typeof Feather>["name"] = isMural
            ? "edit-2"
            : "flag";
          const pillLabel = isMural ? "Public Art & Mural" : "Heritage Site";
          const lat =
            typeof selectedTourSite.latitude === "string"
              ? parseFloat(selectedTourSite.latitude)
              : (selectedTourSite.latitude ?? NaN);
          const lng =
            typeof selectedTourSite.longitude === "string"
              ? parseFloat(selectedTourSite.longitude)
              : (selectedTourSite.longitude ?? NaN);
          return (
            <View
              style={[
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: `${accent}40`,
                  paddingBottom: insets.bottom + 12,
                  bottom: KINFOLK_CLEAR,
                },
              ]}
            >
              <View style={s.cardHandle} />
              <TouchableOpacity
                style={s.cardClose}
                onPress={() => setSelectedTourSite(null)}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <View
                style={[
                  s.catPill,
                  {
                    backgroundColor: accentBg,
                    marginBottom: 8,
                    alignSelf: "flex-start",
                  },
                ]}
              >
                <Feather name={pillIcon} size={11} color={accent} />
                <Text style={[s.catPillTxt, { color: accent }]}>
                  {pillLabel}
                </Text>
              </View>
              <Text
                style={[s.cardName, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {selectedTourSite.name}
              </Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {selectedTourSite.city}, {selectedTourSite.state}
              </Text>
              {selectedTourSite.address ? (
                <Text
                  style={[
                    s.cardSub,
                    {
                      color: colors.mutedForeground,
                      marginTop: -4,
                      marginBottom: 6,
                    },
                  ]}
                >
                  {selectedTourSite.address}
                </Text>
              ) : null}
              {selectedTourSite.description ? (
                <ScrollView
                  style={{ maxHeight: 100 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={[s.culturalDesc, { color: colors.foreground }]}>
                    {selectedTourSite.description}
                  </Text>
                </ScrollView>
              ) : null}
              <View style={[s.cardBtnRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={[
                    s.cardBtnHalf,
                    { borderWidth: 1.5, borderColor: accent },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!isNaN(lat) && !isNaN(lng)) {
                      void openMapDirections(lat, lng, selectedTourSite.name);
                    }
                  }}
                >
                  <Feather name="navigation" size={14} color={accent} />
                  <Text style={[s.cardBtnTxt, { color: accent }]}>
                    Directions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cardBtnHalf, { backgroundColor: accent }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/mural-contribution",
                      params: {
                        siteId: selectedTourSite.id,
                        siteName: selectedTourSite.name,
                        siteAddress: selectedTourSite.address ?? "",
                        siteType: selectedTourSite.siteType ?? "landmark",
                      },
                    })
                  }
                >
                  <Feather name="camera" size={14} color="#fff" />
                  <Text style={s.cardBtnTxt}>Share Memory</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

      {/* ── Global travel destination planning card ── */}
      {selectedTravelDestination &&
        !selectedBusiness &&
        !selectedCulturalSite &&
        !selectedMapEvent &&
        !selectedOrg &&
        !selectedTourEvent &&
        !selectedTourSite &&
        (() => {
          const destination = selectedTravelDestination;
          const base = getApiBase();
          const detailUrl = base
            ? `${base.replace(/\/$/, "")}${destination.detail_url}`
            : null;
          return (
            <View
              style={[
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: "#2563A840",
                  paddingBottom: insets.bottom + 12,
                  bottom: KINFOLK_CLEAR,
                },
              ]}
            >
              <View style={s.cardHandle} />
              <TouchableOpacity
                style={s.cardClose}
                onPress={() => setSelectedTravelDestination(null)}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <View
                style={[
                  s.catPill,
                  {
                    backgroundColor: "#2563A818",
                    marginBottom: 8,
                    alignSelf: "flex-start",
                  },
                ]}
              >
                <Feather name="globe" size={11} color="#2563A8" />
                <Text style={[s.catPillTxt, { color: "#2563A8" }]}>
                  Travel planning destination
                </Text>
              </View>
              <Text
                style={[s.cardName, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {destination.title}
              </Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                {destination.city}
                {destination.country_code
                  ? `, ${destination.country_code}`
                  : destination.state_region
                    ? `, ${destination.state_region}`
                    : ""}
              </Text>
              {destination.summary ? (
                <Text
                  style={[s.culturalDesc, { color: colors.foreground }]}
                  numberOfLines={4}
                >
                  {destination.summary}
                </Text>
              ) : null}
              <Text
                style={[
                  s.cardSub,
                  { color: "#2563A8", marginTop: 2, marginBottom: 8 },
                ]}
              >
                Planning reference only — not a business listing or verified
                venue. Check current official travel guidance.
              </Text>
              <View style={s.cardBtnRow}>
                {destination.source_url ? (
                  <TouchableOpacity
                    style={[
                      s.cardBtnHalf,
                      { borderWidth: 1.5, borderColor: "#2563A8" },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => void openExternalUrl(destination.source_url)}
                  >
                    <Feather name="external-link" size={14} color="#2563A8" />
                    <Text style={[s.cardBtnTxt, { color: "#2563A8" }]}>
                      Source
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {detailUrl ? (
                  <TouchableOpacity
                    style={[s.cardBtnHalf, { backgroundColor: "#2563A8" }]}
                    activeOpacity={0.85}
                    onPress={() => void openExternalUrl(detailUrl)}
                  >
                    <Feather name="map" size={14} color="#fff" />
                    <Text style={s.cardBtnTxt}>Planning Page</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })()}

      {/* ── Business bottom card ── */}
      {!selectedCulturalSite && !selectedMapEvent && selectedBusiness && (
        <View
          style={[
            s.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 12,
              bottom: KINFOLK_CLEAR,
            },
          ]}
        >
          <View style={s.cardHandle} />
          <TouchableOpacity
            style={s.cardClose}
            onPress={() => setSelectedBusiness(null)}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text
            style={[s.cardName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {selectedBusiness.name}
          </Text>
          <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
            {selectedBusiness.subcategory} · {selectedBusiness.city},{" "}
            {selectedBusiness.state}
          </Text>

          <View style={s.cardRow}>
            {selectedBusiness.reviewCount > 0 ? (
              <View style={s.cardMeta}>
                <Feather name="star" size={13} color={GOLD} />
                <Text style={[s.cardMetaTxt, { color: colors.foreground }]}>
                  {selectedBusiness.rating.toFixed(1)}
                  <Text style={{ color: colors.mutedForeground }}>
                    {" "}
                    ({selectedBusiness.reviewCount})
                  </Text>
                </Text>
              </View>
            ) : null}
            {selectedBusiness.priceRange ? (
              <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>
                {selectedBusiness.priceRange}
              </Text>
            ) : null}
            {selectedBusiness.verified && (
              <View style={s.verifiedPill}>
                <Feather name="check-circle" size={11} color="#2D7A4F" />
                <Text style={s.verifiedTxt}>Verified</Text>
              </View>
            )}
          </View>

          <View style={s.cardBtnRow}>
            <TouchableOpacity
              style={[s.cardBtnHalf, { borderWidth: 1.5, borderColor: GOLD }]}
              activeOpacity={0.85}
              onPress={() =>
                void openMapDirections(
                  selectedBusiness.latitude,
                  selectedBusiness.longitude,
                  selectedBusiness.name,
                )
              }
            >
              <Feather name="navigation" size={14} color={GOLD} />
              <Text style={[s.cardBtnTxt, { color: GOLD }]}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.cardBtnHalf, { backgroundColor: GOLD }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/business/[id]",
                  params: { id: selectedBusiness.id },
                })
              }
            >
              <Feather name="briefcase" size={14} color="#fff" />
              <Text style={s.cardBtnTxt}>View Business</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, gap: 6 },

  wideMapOverlay: {
    alignSelf: "flex-start",
    width: 440,
    maxWidth: "100%",
    marginLeft: 16,
    marginRight: 0,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  bannerBtn: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bannerBtnTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  badgePill: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgePillTxt: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    paddingVertical: 4,
  },
  navTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },

  businessSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(31,15,5,0.88)",
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.72)",
  },
  businessSearchInput: {
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingVertical: 9,
  },
  dismissKeyboardButton: {
    minWidth: 30,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  businessSearchStatus: {
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  businessSearchStatusText: {
    color: "#F5EBD8",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  directMatchAction: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
    borderRadius: 14,
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  directMatchActionText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  localityPrompt: {
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.66)",
  },
  localityPromptText: {
    color: "#F5EBD8",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    lineHeight: 16,
  },

  mapDiscoveryCard: {
    marginHorizontal: 12,
    marginTop: 7,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.42)",
    backgroundColor: "rgba(255,253,248,0.96)",
  },
  mapDiscoveryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  mapDiscoveryIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(202,146,43,0.12)",
  },
  mapDiscoveryTitle: {
    color: "#2B1507",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  mapDiscoverySubtitle: {
    color: "rgba(58,31,14,0.64)",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  mapDiscoveryReset: {
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    paddingTop: 3,
  },
  mapDiscoveryRadiusRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  mapDiscoveryRadius: {
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.28)",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  mapDiscoveryRadiusActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  mapDiscoveryRadiusText: {
    color: "rgba(58,31,14,0.68)",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  mapDiscoveryRadiusTextActive: { color: "#FFFFFF" },
  mapDiscoveryFocusRow: {
    gap: 6,
    paddingTop: 8,
    paddingRight: 8,
  },
  mapDiscoveryFocus: {
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.28)",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mapDiscoveryFocusActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  mapDiscoveryFocusText: {
    color: "rgba(58,31,14,0.72)",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  mapDiscoveryFocusTextActive: { color: "#FFFFFF" },
  mapDiscoveryExplanation: {
    color: "rgba(58,31,14,0.58)",
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 7,
  },
  essentialServicesSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(15,118,110,0.16)",
    marginTop: 9,
    paddingTop: 8,
  },
  essentialServicesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  essentialServicesTitle: {
    color: "#115E59",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  essentialServicesSubtitle: {
    color: "rgba(58,31,14,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },
  essentialServicesClear: {
    color: "#0F766E",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    paddingTop: 2,
  },
  essentialServicesChipRow: {
    gap: 6,
    paddingTop: 7,
    paddingRight: 8,
  },
  essentialServicesChip: {
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.28)",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  essentialServicesChipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  essentialServicesChipText: {
    color: "#115E59",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  essentialServicesChipTextActive: { color: "#FFFFFF" },
  essentialServicesStatus: {
    color: "rgba(58,31,14,0.62)",
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 7,
  },
  essentialServicesError: {
    color: "#9F1239",
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 7,
  },
  essentialServiceDisclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 10,
  },

  catRow: { paddingHorizontal: 12, paddingVertical: 4, gap: 8 },

  designationWrap: {
    paddingHorizontal: 12,
    paddingBottom: 2,
    alignItems: "flex-start",
  },
  designationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  designationToggleText: {
    color: "#F5EBD8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  designationPanel: {
    marginTop: 5,
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
  },
  designationHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  designationScroll: { gap: 7, paddingHorizontal: 10, paddingRight: 18 },
  designationChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  designationChipText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },

  layerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  layerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.35)",
  },
  layerBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },

  legendRow: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontFamily: "Inter_500Medium", fontSize: 10, color: "#fff" },

  locatingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  locatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  locatingTxt: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fff" },

  fab: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },

  bizMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  culturalMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  culturalMarkerSelected: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 6,
  },

  cardBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  cardBtnHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 14,
  },
  cardClose: { position: "absolute", top: 16, right: 16, padding: 4 },
  cardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    paddingRight: 32,
    marginBottom: 3,
  },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  cardBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },

  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  catPillTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  estTxt: { fontFamily: "Inter_400Regular", fontSize: 11 },
  culturalSig: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  culturalDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  visitTipBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 4,
  },
  visitTipTxt: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  unclaimedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
    backgroundColor: "rgba(202,146,43,0.08)",
  },
  unclaimedTxt: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  linkTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#2D7A4F",
  },

  sitesStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  sitesStatusTxt: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  sitesErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(185,28,28,0.80)",
    marginHorizontal: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sitesErrorTxt: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#fff",
    flex: 1,
  },
});
