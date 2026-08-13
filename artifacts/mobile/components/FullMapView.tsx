import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { CATEGORIES } from "@/constants/data";
import type { Business } from "@/constants/types";
import { useActivityAlerts, ALERT_META, type AlertType } from "@/hooks/useActivityAlerts";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useColors } from "@/hooks/useColors";
import { useGeoSafeAlert } from "@/hooks/useGeoSafeAlert";
import { useSafetyProximity } from "@/hooks/useSafetyProximity";
import { useAuth } from "@/lib/auth";

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

// US-wide overview so all business pins are visible on first load.
// The map animates to the user's GPS position once permission is granted,
// but if they're not near any businesses they would see an empty map.
// Starting zoomed out means pins are always visible before location is known.
const DEFAULT_REGION: Region = {
  latitude: 37.0,
  longitude: -95.0,
  latitudeDelta: 32,
  longitudeDelta: 52,
};

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

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface CategoryStyle {
  color: string;
  icon: FeatherIconName;
  label: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // ── Heritage categories (heritageCategory field) ───────────────────────────
  "HBCU":                      { color: "#7C3AED", icon: "book-open",    label: "HBCU" },
  "Civil Rights":               { color: "#DC2626", icon: "flag",          label: "Civil Rights" },
  "African American Heritage":  { color: "#92400E", icon: "star",          label: "Heritage" },
  "Native American Heritage":   { color: "#065F46", icon: "globe",         label: "Native" },
  "Hispanic & Latino Heritage": { color: "#B45309", icon: "map-pin",       label: "Latino" },
  "LGBTQ+ History":             { color: "#9D174D", icon: "heart",         label: "LGBTQ+" },
  "Women's History":            { color: "#7E22CE", icon: "user",          label: "Women's" },
  "Cultural Neighborhood":      { color: "#1D4ED8", icon: "home",          label: "Neighborhood" },
  "Freedom Trail":              { color: "#92400E", icon: "compass",       label: "Freedom Trail" },
  "Religious Heritage":         { color: "#78716C", icon: "sun",           label: "Church/Religious" },
  "Immigrant Heritage":         { color: "#0F766E", icon: "anchor",        label: "Immigrant" },
  // Archival color (warm stone) — no red/orange danger hue. Historical record only.
  "Historical Sundown Town":    { color: "#44403C", icon: "book-open",     label: "Sundown Towns" },
  // ── Pin types (pinType field — takes priority over heritageCategory) ───────
  "farmers_market":             { color: "#16A34A", icon: "shopping-bag",  label: "Farmers Market" },
  "pop_up_market":              { color: "#16A34A", icon: "shopping-bag",  label: "Pop-up Market" },
  "market":                     { color: "#16A34A", icon: "shopping-bag",  label: "Market" },
  "mural_or_public_art":        { color: "#0891B2", icon: "edit-2",        label: "Public Art" },
  "community_org":              { color: "#D97706", icon: "users",         label: "Community Org" },
  "cultural_organization":      { color: "#D97706", icon: "users",         label: "Cultural Org" },
  "festival_or_event":          { color: "#7C3AED", icon: "calendar",      label: "Festival/Event" },
  "community_event":            { color: "#2563EB", icon: "calendar",      label: "Community Event" },
  "park_or_outdoor":            { color: "#15803D", icon: "sun",           label: "Park/Outdoor" },
  "heritage_district":          { color: "#B45309", icon: "map",           label: "Heritage District" },
  "cultural_site":              { color: "#92400E", icon: "star",          label: "Cultural Site" },
  "heritage_landmark":          { color: "#92400E", icon: "flag",          label: "Heritage Landmark" },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = { color: "#6B7280", icon: "map-pin", label: "Site" };

/** pinType takes priority — it's more specific than heritageCategory */
function getCategoryStyle(heritageCategory: string, pinType?: string | null): CategoryStyle {
  if (pinType && CATEGORY_STYLES[pinType]) return CATEGORY_STYLES[pinType];
  return CATEGORY_STYLES[heritageCategory] ?? DEFAULT_CATEGORY_STYLE;
}

import { getApiBase } from "@/lib/api";

export function FullMapView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const pendingLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const hasFitToBusinessesRef = useRef(false); // fire fitToCoordinates only once on load

  const [locationGranted, setLocationGranted] = useState(false);
  const [locating, setLocating] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [scannerAlertIdx, setScannerAlertIdx] = useState(0);
  const [warningIdx, setWarningIdx] = useState(0);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCulturalSites, setShowCulturalSites] = useState(true);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [culturalSites, setCulturalSites] = useState<CulturalSite[]>([]);
  const [culturalSitesLoading, setCulturalSitesLoading] = useState(false);
  const [culturalSitesError, setCulturalSitesError] = useState(false);
  const isFetchingCulturalSites = useRef(false);
  const [selectedCulturalSite, setSelectedCulturalSite] = useState<CulturalSite | null>(null);
  const [activeCulturalCategory, setActiveCulturalCategory] = useState("");

  const [showMapEvents, setShowMapEvents] = useState(true);
  const [mapEvents, setMapEvents] = useState<MapEventItem[]>([]);
  const [selectedMapEvent, setSelectedMapEvent] = useState<MapEventItem | null>(null);
  const isFetchingMapEvents = useRef(false);

  // ── Tour community layers ────────────────────────────────────────────────
  const [showCommunityOrgs, setShowCommunityOrgs] = useState(false);
  const [communityOrgs, setCommunityOrgs] = useState<TourCommunityOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<TourCommunityOrg | null>(null);
  const isFetchingOrgs = useRef(false);

  const [showTourEvents, setShowTourEvents] = useState(false);
  const [tourEvents, setTourEvents] = useState<TourRecurringEvent[]>([]);
  const [selectedTourEvent, setSelectedTourEvent] = useState<TourRecurringEvent | null>(null);
  const isFetchingTourEvents = useRef(false);

  const [showTourSites, setShowTourSites] = useState(true);
  const [tourSites, setTourSites] = useState<TourHeritageSite[]>([]);
  const [selectedTourSite, setSelectedTourSite] = useState<TourHeritageSite | null>(null);
  const isFetchingTourSites = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );
  const { user } = useAuth();
  const pollingEnabled = isFocused && user !== null;

  const { businesses } = useBusinesses();

  const { alerts: activityAlerts, confirmAlert, clearAlert, dismissAlert } = useActivityAlerts({ enabled: pollingEnabled });
  const { warnings, dismissWarning } = useSafetyProximity({ enabled: pollingEnabled });
  const { alert: geoAlert, dismissAlert: dismissGeoAlert } = useGeoSafeAlert();

  const mapped = businesses.filter(
    (b) =>
      b.latitude != null &&
      b.longitude != null &&
      !isNaN(b.latitude) &&
      !isNaN(b.longitude) &&
      isFinite(b.latitude) &&
      isFinite(b.longitude) &&
      b.latitude >= -90 && b.latitude <= 90 &&
      b.longitude >= -180 && b.longitude <= 180 &&
      // Exclude "Null Island" (0,0) — means coordinates were never geocoded
      (Math.abs(b.latitude) > 0.001 || Math.abs(b.longitude) > 0.001) &&
      (activeCategory === "All"
        || (activeCategory === "International"
            ? (b.country && b.country !== "USA" && b.country !== "United States")
            : activeCategory === "Healthcare"
            ? b.category === "Health & Wellness"
            : b.category === activeCategory)),
  );

  // ── Auto-fit to business pins on first load ────────────────────────────────
  // Build 99 crash-blocker note: this effect previously sat ABOVE the
  // `mapped` declaration — a temporal-dead-zone ReferenceError (TS2448/
  // TS2454; Hermes throws at component mount). Moved below the declaration;
  // logic unchanged.
  // Fires once when both the map is ready and businesses have loaded.
  // Without this, the map opens at DEFAULT_REGION (US overview) which is fine,
  // but if the user pans away before businesses arrive they'd miss the pins.
  // Also handles the common case where the user's GPS location has no nearby
  // businesses — the fit ensures something is always visible.
  useEffect(() => {
    if (!mapReady || mapped.length === 0 || hasFitToBusinessesRef.current) return;
    hasFitToBusinessesRef.current = true;
    // Give the map a brief moment to finish rendering before fitting
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        mapped.map((b) => ({ latitude: b.latitude, longitude: b.longitude })),
        { edgePadding: { top: 80, right: 40, bottom: 100, left: 40 }, animated: true },
      );
    }, 600);
  }, [mapReady, mapped]);

  const filteredCulturalSites = activeCulturalCategory
    ? culturalSites.filter((s) => s.heritageCategory === activeCulturalCategory)
    : culturalSites;

  const currentWarning = warnings[warningIdx] ?? null;

  useEffect(() => {
    if (warningIdx >= warnings.length && warnings.length > 0) {
      setWarningIdx(warnings.length - 1);
    }
  }, [warnings.length, warningIdx]);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setLocating(false); return; }
        setLocationGranted(true);
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("location timeout")), 8_000)
          ),
        ]);
        const acquired = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        if (mapReadyRef.current) {
          mapRef.current?.animateToRegion({ ...acquired, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 800);
        } else {
          pendingLocationRef.current = acquired;
        }
      } catch {
        // permission denied — stays at default US overview
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (showHeatmap && heatmapPoints.length === 0) {
      void (async () => {
        try {
          const base = getApiBase();
          if (!base) return;
          const res = await fetch(`${base}/api/safety/heatmap`);
          if (res.ok) {
            const data = await res.json() as { points: HeatmapPoint[] };
            setHeatmapPoints(data.points ?? []);
          }
        } catch {}
      })();
    }
  }, [showHeatmap]);

  // ── Cultural-sites fetch (resilient) ────────────────────────────────────
  // hasData = true  → refresh in background; keep existing markers on failure
  // hasData = false → initial load; show error banner on failure, no retry storm
  const fetchCulturalSites = useCallback(async (hasData: boolean) => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (isFetchingCulturalSites.current) return;
    isFetchingCulturalSites.current = true;
    if (!hasData) setCulturalSitesLoading(true);
    try {
      const base = getApiBase();
      if (!base) return;
      const res = await fetch(`${base}/api/cultural-sites`);
      if (res.ok) {
        const data = await res.json() as { sites: CulturalSite[] };
        setCulturalSites(data.sites ?? []);
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
  }, []);

  // Heritage Sites load/refresh effects — all guarded by HERITAGE_SITES_ENABLED.
  // fetchCulturalSites() also has its own early-return guard; these effect-level
  // guards prevent any unnecessary setup/teardown while the feature is disabled.
  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (showCulturalSites && culturalSites.length === 0 && mapReady) {
      void fetchCulturalSites(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCulturalSites, mapReady]);

  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (isFocused && showCulturalSites && mapReady) {
      void fetchCulturalSites(culturalSites.length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, showCulturalSites, mapReady]);

  useEffect(() => {
    if (!HERITAGE_SITES_ENABLED) return;
    if (!culturalSitesError || !showCulturalSites) return;
    const timer = setInterval(() => { void fetchCulturalSites(false); }, 30_000);
    return () => clearInterval(timer);
  }, [culturalSitesError, showCulturalSites, fetchCulturalSites]);

  // ── Tour community layer fetches ──────────────────────────────────────────
  useEffect(() => {
    if (!showCommunityOrgs || communityOrgs.length > 0 || isFetchingOrgs.current || !mapReady) return;
    isFetchingOrgs.current = true;
    const base = getApiBase();
    if (!base) { isFetchingOrgs.current = false; return; }
    fetch(`${base}/api/community-orgs?limit=200`)
      .then((r) => r.ok ? r.json() as Promise<{ organizations: TourCommunityOrg[] }> : null)
      .then((d) => { if (d?.organizations) setCommunityOrgs(d.organizations.filter(o => o.latitude != null && o.longitude != null)); })
      .catch(() => {})
      .finally(() => { isFetchingOrgs.current = false; });
  }, [showCommunityOrgs, mapReady, communityOrgs.length]);

  useEffect(() => {
    if (!showTourEvents || tourEvents.length > 0 || isFetchingTourEvents.current || !mapReady) return;
    isFetchingTourEvents.current = true;
    const base = getApiBase();
    if (!base) { isFetchingTourEvents.current = false; return; }
    fetch(`${base}/api/recurring-events?limit=200`)
      .then((r) => r.ok ? r.json() as Promise<{ events: TourRecurringEvent[] }> : null)
      .then((d) => { if (d?.events) setTourEvents(d.events.filter(e => e.latitude != null && e.longitude != null)); })
      .catch(() => {})
      .finally(() => { isFetchingTourEvents.current = false; });
  }, [showTourEvents, mapReady, tourEvents.length]);

  useEffect(() => {
    if (!showTourSites || tourSites.length > 0 || isFetchingTourSites.current || !mapReady) return;
    isFetchingTourSites.current = true;
    const base = getApiBase();
    if (!base) { isFetchingTourSites.current = false; return; }
    fetch(`${base}/api/tour-cultural-sites?limit=300`)
      .then((r) => r.ok ? r.json() as Promise<{ sites: TourHeritageSite[] }> : null)
      .then((d) => { if (d?.sites) setTourSites(d.sites.filter(s => s.latitude != null && s.longitude != null)); })
      .catch(() => {})
      .finally(() => { isFetchingTourSites.current = false; });
  }, [showTourSites, mapReady, tourSites.length]);

  // ── Events fetch — loads once when map is ready, refreshes on focus ───────
  useEffect(() => {
    if (!mapReady || isFetchingMapEvents.current) return;
    isFetchingMapEvents.current = true;
    const base = getApiBase();
    if (!base) { isFetchingMapEvents.current = false; return; }
    fetch(`${base}/api/events`)
      .then((r) => r.ok ? r.json() as Promise<{ events: MapEventItem[] }> : null)
      .then((d) => {
        if (d?.events) {
          setMapEvents(
            d.events.filter((e) => e.latitude != null && e.longitude != null),
          );
        }
      })
      .catch(() => {})
      .finally(() => { isFetchingMapEvents.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, isFocused]);

  const recenter = async () => {
    try {
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("location timeout")), 8_000),
        ),
      ]) as Awaited<ReturnType<typeof Location.getCurrentPositionAsync>>;
      mapRef.current?.animateToRegion(
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.12, longitudeDelta: 0.12 },
        600,
      );
    } catch {}
  };

  const anyCardVisible = selectedBusiness !== null || selectedCulturalSite !== null || selectedMapEvent !== null
    || selectedOrg !== null || selectedTourEvent !== null || selectedTourSite !== null;

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
          mapReadyRef.current = true;
          setMapReady(true);
          const pending = pendingLocationRef.current;
          if (pending) {
            pendingLocationRef.current = null;
            mapRef.current?.animateToRegion({ ...pending, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 800);
          }
        }}
        {...(Platform.OS === "ios" ? {
          pointsOfInterestFilter: [
            "park", "nationalPark", "beach", "campground", "marina",
            "hospital", "pharmacy", "police", "fireStation",
            "museum", "theater", "library", "university", "school",
            "publicTransport", "airport", "stadium", "zoo", "aquarium",
            "postOffice", "restroom",
          ],
        } : {})}
        onPress={() => { setSelectedBusiness(null); setSelectedCulturalSite(null); setSelectedOrg(null); setSelectedTourEvent(null); setSelectedTourSite(null); }}
      >
        {/* Business pins — gold native platform pin (no custom children = no Fabric crash risk) */}
        {mapped.map((biz) => (
          <Marker
            key={biz.id}
            coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
            onPress={() => { setSelectedBusiness(biz); setSelectedCulturalSite(null); }}
            tracksViewChanges={false}
            pinColor={GOLD}
          />
        ))}

        {/* Safety heatmap circles */}
        {showHeatmap && heatmapPoints.map((p) => {
          const fillColor = p.avgScore >= 70
            ? "rgba(34,197,94,0.18)"
            : p.avgScore >= 50
            ? "rgba(251,191,36,0.18)"
            : "rgba(239,68,68,0.18)";
          const strokeColor = p.avgScore >= 70
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
        {HERITAGE_SITES_ENABLED && showCulturalSites && filteredCulturalSites.slice(0, MAX_HERITAGE_MARKERS).map((site) => {
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
        {showCommunityOrgs && communityOrgs.map((org) => {
          const lat = typeof org.latitude === "string" ? parseFloat(org.latitude) : (org.latitude ?? NaN);
          const lng = typeof org.longitude === "string" ? parseFloat(org.longitude) : (org.longitude ?? NaN);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={`org-${org.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => { setSelectedOrg(org); setSelectedBusiness(null); setSelectedCulturalSite(null); setSelectedMapEvent(null); setSelectedTourEvent(null); setSelectedTourSite(null); }}
              tracksViewChanges={false}
              pinColor="#7C3AED"
            />
          );
        })}

        {/* Recurring event pins — teal */}
        {showTourEvents && tourEvents.map((evt) => {
          const lat = typeof evt.latitude === "string" ? parseFloat(evt.latitude) : (evt.latitude ?? NaN);
          const lng = typeof evt.longitude === "string" ? parseFloat(evt.longitude) : (evt.longitude ?? NaN);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={`tevt-${evt.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => { setSelectedTourEvent(evt); setSelectedBusiness(null); setSelectedCulturalSite(null); setSelectedMapEvent(null); setSelectedOrg(null); setSelectedTourSite(null); }}
              tracksViewChanges={false}
              pinColor="#0D9488"
            />
          );
        })}

        {/* Tour heritage site pins — amber for landmarks, teal for murals/public art */}
        {showTourSites && tourSites.map((site) => {
          const lat = typeof site.latitude === "string" ? parseFloat(site.latitude) : (site.latitude ?? NaN);
          const lng = typeof site.longitude === "string" ? parseFloat(site.longitude) : (site.longitude ?? NaN);
          if (isNaN(lat) || isNaN(lng)) return null;
          const isMural = site.siteType === "mural";
          return (
            <Marker
              key={`tsite-${site.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => { setSelectedTourSite(site); setSelectedBusiness(null); setSelectedCulturalSite(null); setSelectedMapEvent(null); setSelectedOrg(null); setSelectedTourEvent(null); }}
              tracksViewChanges={false}
              pinColor={isMural ? "#0891B2" : "#D97706"}
            />
          );
        })}

        {/* Community event pins — orange, plain pinColor (safe on Android Fabric) */}
        {showMapEvents && mapEvents.map((evt) => {
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
        {activityAlerts.length > 0 && (() => {
          const a = activityAlerts[Math.min(scannerAlertIdx, activityAlerts.length - 1)];
          if (!a) return null;
          const meta = ALERT_META[a.type as AlertType] ?? ALERT_META.other;
          return (
            <View style={[s.banner, { backgroundColor: meta.bgColor }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
                  <Text style={s.bannerTitle}>{meta.label}</Text>
                  {activityAlerts.length > 1 && (
                    <View style={s.badgePill}><Text style={s.badgePillTxt}>{activityAlerts.length}</Text></View>
                  )}
                </View>
                <Text style={s.bannerSub}>
                  {a.distanceMeters < 1000
                    ? "< 0.1 mi away"
                    : `${(a.distanceMeters / 1609.34).toFixed(1)} mi away`}
                  {a.confirmedCount > 0 ? ` · ${a.confirmedCount} confirmed` : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <TouchableOpacity style={s.bannerBtn} onPress={() => void confirmAlert(a.id)}>
                  <Text style={s.bannerBtnTxt}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.bannerBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                  onPress={() => void clearAlert(a.id)}
                >
                  <Text style={s.bannerBtnTxt}>✗</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => dismissAlert(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
            <Text style={[s.navTxt, { color: GOLD }]}>Alert {scannerAlertIdx + 1} of {activityAlerts.length}</Text>
            <TouchableOpacity
              onPress={() => setScannerAlertIdx((i) => Math.min(activityAlerts.length - 1, i + 1))}
              disabled={scannerAlertIdx === activityAlerts.length - 1}
              style={{ opacity: scannerAlertIdx === activityAlerts.length - 1 ? 0.3 : 1 }}
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
                  : `${(currentWarning.distanceMeters / 1609.34).toFixed(1)} mi away`}
                {" "}· {currentWarning.reportCount} community {currentWarning.reportCount === 1 ? "report" : "reports"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { dismissWarning(currentWarning.targetId); setWarningIdx((i) => Math.max(0, i - 1)); }}
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
              {geoAlert.neighborhood ? ` · ${geoAlert.neighborhood}` : ""} — avg score{" "}
              {geoAlert.avgSafetyScore}/100 from {geoAlert.surveyCount} reports
            </Text>
          </TouchableOpacity>
        )}

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
          keyboardDismissMode="on-drag"
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill key={cat} label={cat} selected={activeCategory === cat} onPress={() => setActiveCategory(cat)} />
          ))}
        </ScrollView>

        {/* Map layer toggles */}
        <View style={s.layerRow}>
          <TouchableOpacity
            style={[s.layerBtn, showHeatmap && { backgroundColor: "#059669", borderColor: "transparent" }]}
            onPress={() => setShowHeatmap((v) => !v)}
            activeOpacity={0.85}
          >
            <Feather name="thermometer" size={12} color={showHeatmap ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showHeatmap ? "#fff" : GOLD }]}>Safety Heat</Text>
          </TouchableOpacity>
          {HERITAGE_SITES_ENABLED && (
            <TouchableOpacity
              style={[s.layerBtn, showCulturalSites && { backgroundColor: "#44403C", borderColor: "transparent" }]}
              onPress={() => { setShowCulturalSites((v) => !v); setSelectedCulturalSite(null); }}
              activeOpacity={0.85}
            >
              <Feather name="book-open" size={12} color={showCulturalSites ? "#fff" : GOLD} />
              <Text style={[s.layerBtnTxt, { color: showCulturalSites ? "#fff" : GOLD }]}>Heritage</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.layerBtn, showMapEvents && { backgroundColor: "#EA580C", borderColor: "transparent" }]}
            onPress={() => { setShowMapEvents((v) => !v); setSelectedMapEvent(null); }}
            activeOpacity={0.85}
          >
            <Feather name="calendar" size={12} color={showMapEvents ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showMapEvents ? "#fff" : GOLD }]}>
              Events{mapEvents.length > 0 ? ` (${mapEvents.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.layerBtn, showCommunityOrgs && { backgroundColor: "#7C3AED", borderColor: "transparent" }]}
            onPress={() => { setShowCommunityOrgs((v) => !v); setSelectedOrg(null); }}
            activeOpacity={0.85}
          >
            <Feather name="users" size={12} color={showCommunityOrgs ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showCommunityOrgs ? "#fff" : GOLD }]}>Orgs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.layerBtn, showTourEvents && { backgroundColor: "#0D9488", borderColor: "transparent" }]}
            onPress={() => { setShowTourEvents((v) => !v); setSelectedTourEvent(null); }}
            activeOpacity={0.85}
          >
            <Feather name="repeat" size={12} color={showTourEvents ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showTourEvents ? "#fff" : GOLD }]}>Gatherings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.layerBtn, showTourSites && { backgroundColor: "#D97706", borderColor: "transparent" }]}
            onPress={() => { setShowTourSites((v) => !v); setSelectedTourSite(null); }}
            activeOpacity={0.85}
          >
            <Feather name="flag" size={12} color={showTourSites ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showTourSites ? "#fff" : GOLD }]}>Heritage</Text>
          </TouchableOpacity>
        </View>

        {/* Heritage category filter chips — hidden until HERITAGE_SITES_ENABLED */}
        {HERITAGE_SITES_ENABLED && showCulturalSites && (
          <>
            {/* Loading state — initial fetch only */}
            {culturalSitesLoading && culturalSites.length === 0 && (
              <View style={s.sitesStatusRow}>
                <ActivityIndicator size="small" color={GOLD} />
                <Text style={s.sitesStatusTxt}>Loading heritage sites…</Text>
              </View>
            )}

            {/* Error state — shown only when fetch failed and we have no data to display */}
            {culturalSitesError && culturalSites.length === 0 && (
              <TouchableOpacity
                style={s.sitesErrorBanner}
                onPress={() => void fetchCulturalSites(false)}
                activeOpacity={0.8}
              >
                <Feather name="wifi-off" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={s.sitesErrorTxt}>
                  {culturalSitesLoading ? "Retrying…" : "Cultural sites couldn't load. Tap to retry."}
                </Text>
                {culturalSitesLoading && (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                )}
              </TouchableOpacity>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.legendRow}
            >
              {Object.entries(CATEGORY_STYLES).map(([key, cs]) => {
                const isActive = activeCulturalCategory === key;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.75}
                    style={[s.legendItem, isActive && { backgroundColor: cs.color, borderColor: cs.color }]}
                    onPress={() => {
                      const next = isActive ? "" : key;
                      setActiveCulturalCategory(next);
                      setSelectedCulturalSite(null);
                      if (next) {
                        const coords = culturalSites
                          .filter((site) => site.heritageCategory === next)
                          .map((site) => ({
                            latitude: parseFloat(site.latitude),
                            longitude: parseFloat(site.longitude),
                          }))
                          .filter((c) => !isNaN(c.latitude) && !isNaN(c.longitude));
                        if (coords.length > 0) {
                          mapRef.current?.fitToCoordinates(coords, {
                            edgePadding: { top: 140, right: 50, bottom: 260, left: 50 },
                            animated: true,
                          });
                        }
                      }
                    }}
                  >
                    <View style={[s.legendDot, { backgroundColor: isActive ? "#fff" : cs.color }]} />
                    <Text style={[s.legendTxt, isActive && { color: "#fff" }]}>{cs.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
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

      {/* Recenter FAB */}
      {locationGranted && (
        <TouchableOpacity
          style={[s.fab, { backgroundColor: colors.background, bottom: anyCardVisible ? KINFOLK_CLEAR + 210 : insets.bottom + 24 }]}
          onPress={() => void recenter()}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={20} color={GOLD} />
        </TouchableOpacity>
      )}

      {/* ── Cultural site bottom card ── */}
      {HERITAGE_SITES_ENABLED && selectedCulturalSite && (() => {
        const site = selectedCulturalSite;
        const cs = getCategoryStyle(site.heritageCategory, site.pinType);
        const isUnclaimed = site.listingStatus === "live_unclaimed";
        const bodyText = site.description || site.significance || null;

        return (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: cs.color + "40", paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
            <View style={s.cardHandle} />
            <TouchableOpacity style={s.cardClose} onPress={() => setSelectedCulturalSite(null)}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Unclaimed banner */}
            {isUnclaimed && (
              <View style={[s.unclaimedBanner, { borderColor: GOLD + "50" }]}>
                <Feather name="info" size={12} color={GOLD} />
                <Text style={[s.unclaimedTxt, { color: GOLD }]} numberOfLines={2}>
                  Community Listed — This place has not yet claimed its profile. Info provided by the MWM community.
                </Text>
              </View>
            )}

            {/* Category pill + cultural community chip */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <View style={[s.catPill, { backgroundColor: cs.color + "18" }]}>
                <Feather name={cs.icon} size={11} color={cs.color} />
                <Text style={[s.catPillTxt, { color: cs.color }]}>{cs.label}</Text>
              </View>
              {site.culturalCommunity ? (
                <View style={[s.catPill, { backgroundColor: colors.muted + "60", borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[s.catPillTxt, { color: colors.mutedForeground }]}>{site.culturalCommunity}</Text>
                </View>
              ) : null}
              {(site.yearEstablished || site.era) && (
                <Text style={[s.estTxt, { color: colors.mutedForeground }]}>
                  {site.yearEstablished ? `Est. ${site.yearEstablished}` : site.era}
                </Text>
              )}
            </View>

            {/* Name + city */}
            <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>
              {site.name}
            </Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
              {site.city}, {site.state}
            </Text>

            {/* Scrollable rich content */}
            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {bodyText ? (
                <Text style={[s.culturalDesc, { color: colors.foreground }]}>{bodyText}</Text>
              ) : null}
              {site.visitTip ? (
                <View style={[s.visitTipBox, { backgroundColor: cs.color + "10", borderLeftColor: cs.color }]}>
                  <Text style={[s.visitTipTxt, { color: colors.foreground }]}>{site.visitTip}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Action buttons */}
            <View style={s.cardBtnRow}>
              <TouchableOpacity
                style={[s.cardBtnHalf, { borderWidth: 1.5, borderColor: cs.color }]}
                activeOpacity={0.85}
                onPress={() => {
                  const lat = parseFloat(site.latitude);
                  const lng = parseFloat(site.longitude);
                  void Linking.openURL(
                    Platform.OS === "ios"
                      ? `maps://?ll=${lat},${lng}&q=${encodeURIComponent(site.name)}`
                      : `geo:${lat},${lng}?q=${encodeURIComponent(site.name)}`
                  );
                }}
              >
                <Feather name="navigation" size={14} color={cs.color} />
                <Text style={[s.cardBtnTxt, { color: cs.color }]}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.cardBtnHalf, { backgroundColor: cs.color }]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/cultural-heritage",
                    params: { initialCategory: site.heritageCategory, siteId: site.id },
                  })
                }
              >
                <Feather name={cs.icon} size={14} color="#fff" />
                <Text style={s.cardBtnTxt}>View Site</Text>
              </TouchableOpacity>
            </View>

            {/* Secondary links row */}
            <View style={{ flexDirection: "row", gap: 16, marginTop: 8, paddingHorizontal: 2 }}>
              {site.externalUrl ? (
                <TouchableOpacity
                  onPress={() => void Linking.openURL(site.externalUrl!)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Feather name="external-link" size={12} color={cs.color} />
                  <Text style={[s.linkTxt, { color: cs.color }]}>Learn More</Text>
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
                <Feather name="map" size={12} color={colors.mutedForeground} />
                <Text style={[s.linkTxt, { color: colors.mutedForeground }]}>
                  {site.city}&apos;s Living Legacy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      {/* ── Event bottom card ── */}
      {!selectedCulturalSite && !selectedBusiness && selectedMapEvent && (() => {
        const evt = selectedMapEvent;
        const dateStr = evt.date
          ? new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : null;
        return (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: "#EA580C40", paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
            <View style={s.cardHandle} />
            <TouchableOpacity style={s.cardClose} onPress={() => setSelectedMapEvent(null)}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <View style={[s.catPill, { backgroundColor: "#EA580C18" }]}>
                <Feather name="calendar" size={11} color="#EA580C" />
                <Text style={[s.catPillTxt, { color: "#EA580C" }]}>{evt.category}</Text>
              </View>
              {evt.isFree && (
                <View style={[s.catPill, { backgroundColor: "#16A34A18" }]}>
                  <Text style={[s.catPillTxt, { color: "#16A34A" }]}>Free</Text>
                </View>
              )}
            </View>

            <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>
              {evt.title}
            </Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
              {evt.city}, {evt.state}
            </Text>

            {evt.location ? (
              <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop: -4, marginBottom: 6 }]}>
                {evt.location}
              </Text>
            ) : null}
            {dateStr ? (
              <Text style={[s.catPillTxt, { color: "#EA580C", marginBottom: 12 }]}>{dateStr}</Text>
            ) : null}

            <TouchableOpacity
              style={[s.cardBtn, { backgroundColor: "#EA580C" }]}
              activeOpacity={0.85}
              onPress={() => {
                const lat = parseFloat(evt.latitude ?? "");
                const lng = parseFloat(evt.longitude ?? "");
                if (!isNaN(lat) && !isNaN(lng)) {
                  void Linking.openURL(
                    Platform.OS === "ios"
                      ? `maps://?ll=${lat},${lng}&q=${encodeURIComponent(evt.title)}`
                      : `geo:${lat},${lng}?q=${encodeURIComponent(evt.title)}`
                  );
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
      {selectedOrg && !selectedBusiness && !selectedCulturalSite && !selectedMapEvent && !selectedTourEvent && !selectedTourSite && (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: "#7C3AED40", paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
          <View style={s.cardHandle} />
          <TouchableOpacity style={s.cardClose} onPress={() => setSelectedOrg(null)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[s.catPill, { backgroundColor: "#7C3AED18", marginBottom: 8, alignSelf: "flex-start" }]}>
            <Feather name="users" size={11} color="#7C3AED" />
            <Text style={[s.catPillTxt, { color: "#7C3AED" }]}>{selectedOrg.category.replace(/_/g, " ")}</Text>
          </View>
          <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>{selectedOrg.name}</Text>
          <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{selectedOrg.city}, {selectedOrg.state}</Text>
          {selectedOrg.mission ? (
            <Text style={[s.culturalDesc, { color: colors.foreground }]} numberOfLines={3}>{selectedOrg.mission}</Text>
          ) : null}
          {selectedOrg.address ? (
            <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop: -4 }]}>{selectedOrg.address}</Text>
          ) : null}
          <View style={[s.cardBtnRow, { marginTop: 10 }]}>
            {selectedOrg.website ? (
              <TouchableOpacity
                style={[s.cardBtnHalf, { borderWidth: 1.5, borderColor: "#7C3AED" }]}
                activeOpacity={0.85}
                onPress={() => void Linking.openURL(selectedOrg.website!)}
              >
                <Feather name="external-link" size={14} color="#7C3AED" />
                <Text style={[s.cardBtnTxt, { color: "#7C3AED" }]}>Website</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[s.cardBtnHalf, { backgroundColor: "#7C3AED" }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/edit-suggestion", params: { entityType: "community_org", entityId: selectedOrg.id, entityName: selectedOrg.name } })}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={s.cardBtnTxt}>Suggest Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Recurring Event card ── */}
      {selectedTourEvent && !selectedBusiness && !selectedCulturalSite && !selectedMapEvent && !selectedOrg && !selectedTourSite && (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: "#0D948840", paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
          <View style={s.cardHandle} />
          <TouchableOpacity style={s.cardClose} onPress={() => setSelectedTourEvent(null)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <View style={[s.catPill, { backgroundColor: "#0D948818" }]}>
              <Feather name="repeat" size={11} color="#0D9488" />
              <Text style={[s.catPillTxt, { color: "#0D9488" }]}>{selectedTourEvent.frequency}</Text>
            </View>
            {selectedTourEvent.day_of_week ? (
              <View style={[s.catPill, { backgroundColor: colors.muted + "60", borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[s.catPillTxt, { color: colors.mutedForeground }]}>{selectedTourEvent.day_of_week}</Text>
              </View>
            ) : null}
            {selectedTourEvent.start_time ? (
              <Text style={[s.catPillTxt, { color: "#0D9488" }]}>{selectedTourEvent.start_time}{selectedTourEvent.end_time ? ` – ${selectedTourEvent.end_time}` : ""}</Text>
            ) : null}
          </View>
          <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>{selectedTourEvent.name}</Text>
          {selectedTourEvent.venue ? (
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{selectedTourEvent.venue} · {selectedTourEvent.city}, {selectedTourEvent.state}</Text>
          ) : (
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{selectedTourEvent.city}, {selectedTourEvent.state}</Text>
          )}
          {selectedTourEvent.description ? (
            <Text style={[s.culturalDesc, { color: colors.foreground }]} numberOfLines={3}>{selectedTourEvent.description}</Text>
          ) : null}
          <TouchableOpacity
            style={[s.cardBtn, { backgroundColor: "#0D9488", marginTop: 8 }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/edit-suggestion", params: { entityType: "recurring_event", entityId: selectedTourEvent.id, entityName: selectedTourEvent.name } })}
          >
            <Feather name="edit-2" size={14} color="#fff" />
            <Text style={s.cardBtnTxt}>Suggest an Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tour Heritage Site card ── */}
      {selectedTourSite && !selectedBusiness && !selectedCulturalSite && !selectedMapEvent && !selectedOrg && !selectedTourEvent && (() => {
        const isMural = selectedTourSite.siteType === "mural";
        const accent   = isMural ? "#0891B2" : "#D97706";
        const accentBg = isMural ? "#0891B218" : "#D9770618";
        const pillIcon: React.ComponentProps<typeof Feather>["name"] = isMural ? "edit-2" : "flag";
        const pillLabel = isMural ? "Public Art & Mural" : "Heritage Site";
        const lat = typeof selectedTourSite.latitude === "string" ? parseFloat(selectedTourSite.latitude) : (selectedTourSite.latitude ?? NaN);
        const lng = typeof selectedTourSite.longitude === "string" ? parseFloat(selectedTourSite.longitude) : (selectedTourSite.longitude ?? NaN);
        return (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: `${accent}40`, paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
            <View style={s.cardHandle} />
            <TouchableOpacity style={s.cardClose} onPress={() => setSelectedTourSite(null)}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[s.catPill, { backgroundColor: accentBg, marginBottom: 8, alignSelf: "flex-start" }]}>
              <Feather name={pillIcon} size={11} color={accent} />
              <Text style={[s.catPillTxt, { color: accent }]}>{pillLabel}</Text>
            </View>
            <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>{selectedTourSite.name}</Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{selectedTourSite.city}, {selectedTourSite.state}</Text>
            {selectedTourSite.address ? (
              <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop: -4, marginBottom: 6 }]}>{selectedTourSite.address}</Text>
            ) : null}
            {selectedTourSite.description ? (
              <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <Text style={[s.culturalDesc, { color: colors.foreground }]}>{selectedTourSite.description}</Text>
              </ScrollView>
            ) : null}
            <View style={[s.cardBtnRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={[s.cardBtnHalf, { borderWidth: 1.5, borderColor: accent }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isNaN(lat) && !isNaN(lng)) {
                    void Linking.openURL(
                      Platform.OS === "ios"
                        ? `maps://?ll=${lat},${lng}&q=${encodeURIComponent(selectedTourSite.name)}`
                        : `geo:${lat},${lng}?q=${encodeURIComponent(selectedTourSite.name)}`
                    );
                  }
                }}
              >
                <Feather name="navigation" size={14} color={accent} />
                <Text style={[s.cardBtnTxt, { color: accent }]}>Directions</Text>
              </TouchableOpacity>
              {isMural ? (
                <TouchableOpacity
                  style={[s.cardBtnHalf, { backgroundColor: accent }]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: "/mural-contribution", params: { siteId: selectedTourSite.id, siteName: selectedTourSite.name, siteAddress: selectedTourSite.address ?? "" } })}
                >
                  <Feather name="camera" size={14} color="#fff" />
                  <Text style={s.cardBtnTxt}>Share Memory</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[s.cardBtnHalf, { backgroundColor: accent }]}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: "/edit-suggestion", params: { entityType: "cultural_site", entityId: selectedTourSite.id, entityName: selectedTourSite.name } })}
                >
                  <Feather name="edit-2" size={14} color="#fff" />
                  <Text style={s.cardBtnTxt}>Suggest Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })()}

      {/* ── Business bottom card ── */}
      {!selectedCulturalSite && !selectedMapEvent && selectedBusiness && (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 12, bottom: KINFOLK_CLEAR }]}>
          <View style={s.cardHandle} />
          <TouchableOpacity style={s.cardClose} onPress={() => setSelectedBusiness(null)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {selectedBusiness.name}
          </Text>
          <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
            {selectedBusiness.subcategory} · {selectedBusiness.city}, {selectedBusiness.state}
          </Text>

          <View style={s.cardRow}>
            <View style={s.cardMeta}>
              <Feather name="star" size={13} color={GOLD} />
              <Text style={[s.cardMetaTxt, { color: colors.foreground }]}>
                {selectedBusiness.rating.toFixed(1)}
                <Text style={{ color: colors.mutedForeground }}> ({selectedBusiness.reviewCount})</Text>
              </Text>
            </View>
            {selectedBusiness.priceRange ? (
              <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>{selectedBusiness.priceRange}</Text>
            ) : null}
            {selectedBusiness.verified && (
              <View style={s.verifiedPill}>
                <Feather name="check-circle" size={11} color="#2D7A4F" />
                <Text style={s.verifiedTxt}>Verified</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[s.cardBtn, { backgroundColor: GOLD }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/business/[id]", params: { id: selectedBusiness.id } })}
          >
            <Feather name="briefcase" size={14} color="#fff" />
            <Text style={s.cardBtnTxt}>View Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, gap: 6 },

  banner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, gap: 4,
  },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bannerSub:   { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1 },
  bannerBtn:   { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bannerBtnTxt:{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff" },
  badgePill:   { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgePillTxt:{ fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },

  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginHorizontal: 12, borderRadius: 8, paddingVertical: 4 },
  navTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },

  catRow: { paddingHorizontal: 12, paddingVertical: 4, gap: 8 },

  layerRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 2 },
  layerBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(202,146,43,0.35)",
  },
  layerBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },

  legendRow: { paddingHorizontal: 12, paddingBottom: 6, gap: 8, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontFamily: "Inter_500Medium", fontSize: 10, color: "#fff" },

  locatingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  locatingPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.62)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  locatingTxt:  { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fff" },

  fab: {
    position: "absolute", right: 16,
    width: 46, height: 46, borderRadius: 23,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 5,
  },

  bizMarker: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },
  culturalMarker: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },
  culturalMarkerSelected: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 3,
    shadowOpacity: 0.45, shadowRadius: 4, elevation: 6,
  },

  cardBtnRow:  { flexDirection: "row", gap: 8, marginTop: 4 },
  cardBtnHalf: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 12, paddingVertical: 12,
  },

  card: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 8,
  },
  cardHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 14 },
  cardClose:  { position: "absolute", top: 16, right: 16, padding: 4 },
  cardName:   { fontFamily: "Inter_700Bold", fontSize: 18, paddingRight: 32, marginBottom: 3 },
  cardSub:    { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  cardRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaTxt:{ fontFamily: "Inter_500Medium", fontSize: 13 },
  cardBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
  cardBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },

  catPill:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  catPillTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  estTxt:     { fontFamily: "Inter_400Regular", fontSize: 11 },
  culturalSig:{ fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  culturalDesc:{ fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 8 },
  visitTipBox: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, marginBottom: 8, borderRadius: 4 },
  visitTipTxt: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  unclaimedBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 10, backgroundColor: "rgba(202,146,43,0.08)",
  },
  unclaimedTxt: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, flex: 1 },
  linkTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },

  verifiedPill:{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#DCFCE7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  verifiedTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#2D7A4F" },

  sitesStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 5 },
  sitesStatusTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sitesErrorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(185,28,28,0.80)",
    marginHorizontal: 12, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  sitesErrorTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#fff", flex: 1 },
});
