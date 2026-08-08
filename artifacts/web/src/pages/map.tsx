import { useListBusinesses, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, MapPin, X, Navigation, Navigation2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

const BASE = import.meta.env.BASE_URL;

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
  const isHbcu     = hc === "HBCU";
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

const CATEGORIES = ["All", "Food", "Beauty", "Finance", "Wellness", "Retail", "Cultural", "Professional"];

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
  { key: "business", color: "#CA922B", shape: "circle",  label: "Businesses" },
  { key: "cultural", color: "#92400E", shape: "diamond", label: "Cultural Sites" },
  { key: "hbcu",     color: "#7C3AED", shape: "diamond", label: "HBCUs" },
  { key: "festival", color: "#C8960C", shape: "diamond", label: "Festivals" },
  { key: "events",   color: "#EA580C", shape: "diamond", label: "Community Events" },
  { key: "market",   color: "#16A34A", shape: "diamond", label: "Markets" },
  { key: "art",      color: "#0891B2", shape: "diamond", label: "Public Art" },
] as const;

export default function MapPage() {
  const { data, isLoading } = useListBusinesses({}, { query: { queryKey: ["businesses", "map-full"] } });
  const { data: authData } = useGetCurrentAuthUser();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap>(null);
  const markersRef = useRef<Map<string, GMarker>>(new Map());
  const infoWindowRef = useRef<GInfoWindow>(null);
  const directionsRendererRef = useRef<any>(null);

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

  // Geocode search string and pan map
  const geocodeAndPan = useCallback(() => {
    if (!mapRef.current || !search.trim()) return;
    const g = (window as any).google?.maps;
    if (!g) return;
    new g.Geocoder().geocode({ address: search.trim() }, (results: any[], status: string) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        mapRef.current.panTo(results[0].geometry.location);
        mapRef.current.setZoom(13);
      }
    });
  }, [search]);

  const businesses = ((data?.businesses ?? []) as BizWithCoords[]).filter(
    (b) => b.latitude && b.longitude
  );

  const filtered = (() => {
    const base = businesses.filter((b) => {
      const tokens = search.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
      const fields = [b.name, b.city, b.state, b.category].map((f) => f?.toLowerCase() ?? "");
      const matchSearch = tokens.length === 0 || tokens.every((t) => fields.some((f) => f.includes(t)));
      const matchCat = category === "All" || b.category?.toLowerCase().includes(category.toLowerCase());
      return matchSearch && matchCat;
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
            ${site.externalUrl ? `<a href="${site.externalUrl}" target="_blank" rel="noopener" style="font-size:11px;color:${color};font-weight:bold;text-decoration:none;display:block">Learn More →</a>` : ""}
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
    if (ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/maps/js-key`)
      .then((r) => r.json())
      .then(({ key }: { key?: string }) => {
        if (!key) { setApiKeyError(true); return; }
        if (document.getElementById("gmaps-script")) { setReady(true); return; }
        (window as any).__mwmMapInit = () => setReady(true);
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
    if (!ready || !mapDivRef.current || isLoading) return;
    if (mapRef.current) return;

    const onGmError = (e: ErrorEvent) => {
      if (e.message?.toLowerCase().includes("invalidkey") || e.message?.toLowerCase().includes("google maps")) {
        setApiKeyError(true);
      }
    };
    window.addEventListener("error", onGmError, true);

    const g = (window as any).google?.maps;
    if (!g) { setApiKeyError(true); return; }

    try {
      // Philadelphia is the live city — default to it so users see real pins, not a continent view.
      // Geolocation request immediately after init will override this if the user allows it.
      const PHILLY = { lat: 39.9526, lng: -75.1652 };
      const map: GMap = new g.Map(mapDivRef.current, {
        center: PHILLY,
        zoom: 12,
        styles: BRAND_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: g.ControlPosition.RIGHT_CENTER },
      });
      mapRef.current = map;
      infoWindowRef.current = new g.InfoWindow();

      // ── Location permission → center the map on the user ──────────────────
      // Priority: (1) GPS if granted, (2) homeCity from profile, (3) Philadelphia
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // User granted — center on their actual location AND store coords
            // so the sidebar can sort businesses by proximity.
            map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            map.setZoom(13);
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // Denied or unavailable — try their profile home city
            const homeCity = (authData?.user as any)?.homeCity as string | null | undefined;
            if (homeCity) {
              new g.Geocoder().geocode(
                { address: homeCity },
                (results: any[], status: string) => {
                  if (status === "OK" && results?.[0]?.geometry?.location) {
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(12);
                  }
                  // else stay at Philadelphia — already the default
                },
              );
            }
            // else stay at Philadelphia — already the default
          },
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
  }, [ready, isLoading]);

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

  // Business marker visibility — respects legendFilter + search/category filter
  useEffect(() => {
    if (!mapRef.current) return;
    const showBiz = !legendFilter || legendFilter === "business";
    const filteredIds = new Set(filtered.map((b) => b.id));
    markersRef.current.forEach((marker, id) => {
      marker.setMap(showBiz && filteredIds.has(id) ? mapRef.current : null);
    });
  }, [filtered, legendFilter]);

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const activeCulturalSites = legendFilter && legendFilter !== "business"
    ? culturalSites.filter((s) => siteMatchesFilter(s, legendFilter))
    : [];

  const legendTileLabel = LEGEND_TILES.find((t) => t.key === legendFilter)?.label ?? "";

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
                  onClick={geocodeAndPan}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-[#CA922B] transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4 text-[#3A1F0E]/40" />
                </button>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); }}
                  onKeyDown={(e) => e.key === "Enter" && geocodeAndPan()}
                  placeholder="Search city or business…"
                  className="w-full pl-9 pr-8 py-2 text-sm bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50 text-[#3A1F0E] placeholder:text-[#3A1F0E]/40"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5">
                    <X className="w-3.5 h-3.5 text-[#3A1F0E]/40" />
                  </button>
                )}
              </div>
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

        {/* Count row */}
        <div className="px-4 py-2 text-xs text-[#3A1F0E]/40 font-medium border-b border-[#3A1F0E]/6 shrink-0 flex items-center justify-between">
          <span>
            {showingCultural
              ? `${activeCulturalSites.length} ${activeCulturalSites.length === 1 ? "site" : "sites"}`
              : `${filtered.length} ${filtered.length === 1 ? "location" : "locations"}`}
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
                      mapRef.current!.setZoom(site.siteType === "hbcu" || !site.address ? 14 : 16);
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
                        {site.externalUrl && (
                          <a
                            href={site.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold mt-1 block hover:underline"
                            style={{ color }}
                          >
                            Learn More →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // ── Business list ──
            isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
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
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-3" />
                <p className="text-sm text-[#3A1F0E]/50 mb-3">No businesses match your filters.</p>
                <button
                  onClick={() => { setSearch(""); setCategory("All"); }}
                  className="text-xs font-bold text-[#CA922B] hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filtered.map((biz) => {
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
                          const label = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
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
          )}
        </div>
      </div>
    );
  };

  if (apiKeyError) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#FAF6EF]">
        {renderSidebar()}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F5EBD8] text-center px-8">
          <div className="w-20 h-20 rounded-full bg-[#CA922B]/15 flex items-center justify-center mb-5">
            <MapPin className="w-9 h-9 text-[#CA922B]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-2">Interactive map coming soon</h2>
          <p className="text-sm text-[#3A1F0E]/50 max-w-xs leading-relaxed">
            Browse businesses from the list on the left. The full map with location pins will be available in production.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#FAF6EF]">
      {/* Sidebar — only visible when open */}
      {sidebarOpen && renderSidebar()}

      {/* ── Map ── */}
      <div className="flex-1 relative">
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

        {/* Interactive legend */}
        <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-[#3A1F0E]/8 flex flex-wrap items-center gap-x-1 gap-y-1 max-w-[520px]">
          {LEGEND_TILES.map(({ key, color, shape, label }) => {
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
      </div>
    </div>
  );
}
