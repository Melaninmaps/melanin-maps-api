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
  if (pt === "farmers_market" || pt === "pop_up_market" || pt === "market") return "#16A34A";
  if (pt === "mural_or_public_art") return "#0891B2";
  if (pt === "community_org" || pt === "cultural_organization") return "#D97706";
  if (pt === "festival_or_event" || pt === "community_event") return "#EA580C"; // orange — Events
  if (pt === "park_or_outdoor") return "#15803D";
  if (hc === "HBCU") return "#7C3AED";                  // purple — HBCUs only
  if (hc === "Civil Rights") return "#DC2626";
  if (hc === "Religious Heritage") return "#78716C";
  return "#92400E";
}

function getCulturalPinLabel(site: CulturalSiteWeb): string {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  if (pt === "farmers_market" || pt === "pop_up_market") return "Farmers Market";
  if (pt === "market") return "Market";
  if (pt === "mural_or_public_art") return "Public Art";
  if (pt === "community_org" || pt === "cultural_organization") return "Community Org";
  if (pt === "festival_or_event" || pt === "community_event") return "Event";
  if (hc === "HBCU") return "HBCU";
  if (hc === "Civil Rights") return "Civil Rights";
  return hc || "Cultural Site";
}

// Which cultural sites match the active legend filter?
function siteMatchesFilter(site: CulturalSiteWeb, filter: string): boolean {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  const isHbcu   = hc === "HBCU";
  const isEvent  = pt === "festival_or_event" || pt === "community_event";
  const isMarket = pt === "farmers_market" || pt === "pop_up_market" || pt === "market";
  const isArt    = pt === "mural_or_public_art";
  if (filter === "hbcu")    return isHbcu;
  if (filter === "events")  return isEvent;
  if (filter === "market")  return isMarket;
  if (filter === "art")     return isArt;
  if (filter === "cultural") return !isHbcu && !isEvent && !isMarket && !isArt;
  return true;
}

// Universal diamond pin path — 16 × 16 px (same visual size as business circle scale:8)
const DIAMOND_PATH = "M 0,-8 8,0 0,8 -8,0 Z";

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

// Legend tile definitions
const LEGEND_TILES = [
  { key: "business", color: "#CA922B", shape: "circle",  label: "Businesses" },
  { key: "cultural", color: "#92400E", shape: "diamond", label: "Cultural Sites" },
  { key: "hbcu",     color: "#7C3AED", shape: "diamond", label: "HBCUs" },
  { key: "events",   color: "#EA580C", shape: "diamond", label: "Events" },
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

  const filtered = businesses.filter((b) => {
    const tokens = search.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
    const fields = [b.name, b.city, b.state, b.category].map((f) => f?.toLowerCase() ?? "");
    const matchSearch = tokens.length === 0 || tokens.every((t) => fields.some((f) => f.includes(t)));
    const matchCat = category === "All" || b.category?.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  // Cultural sites for the active city (starts with Philadelphia; updates on legend filter)
  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/cultural-sites?city=Philadelphia`)
      .then((r) => r.json())
      .then((d: any) => { if (Array.isArray(d.sites)) setCulturalSites(d.sites as CulturalSiteWeb[]); })
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
      const map: GMap = new g.Map(mapDivRef.current, {
        center: { lat: 37.09, lng: -95.71 },
        zoom: 4,
        styles: BRAND_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: g.ControlPosition.RIGHT_CENTER },
      });
      mapRef.current = map;
      infoWindowRef.current = new g.InfoWindow();

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
    mapRef.current.panTo({ lat: 37.09, lng: -95.71 });
    mapRef.current.setZoom(4);
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
                return (
                  <div key={site.id} className="p-4 border-b border-[#3A1F0E]/6 hover:bg-[#FAF6EF] transition-colors">
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
