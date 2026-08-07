import { useListBusinesses, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, MapPin, X, SlidersHorizontal, Navigation, Navigation2 } from "lucide-react";
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

function getCulturalPinColor(site: CulturalSiteWeb): string {
  const pt = site.pinType ?? "";
  const hc = site.heritageCategory ?? "";
  if (pt === "farmers_market" || pt === "pop_up_market" || pt === "market") return "#16A34A";
  if (pt === "mural_or_public_art") return "#0891B2";
  if (pt === "community_org" || pt === "cultural_organization") return "#D97706";
  if (pt === "festival_or_event" || pt === "community_event") return "#7C3AED";
  if (pt === "park_or_outdoor") return "#15803D";
  if (hc === "HBCU") return "#7C3AED";
  if (hc === "Civil Rights") return "#DC2626";
  if (hc === "Religious Heritage") return "#78716C";
  return "#92400E"; // heritage / cultural site default
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

type RouteInfo = {
  distance: string;
  duration: string;
  bizName: string;
};

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

  const businesses = ((data?.businesses ?? []) as BizWithCoords[]).filter(
    (b) => b.latitude && b.longitude
  );

  const filtered = businesses.filter((b) => {
    // Tokenise by comma so "Philadelphia, PA" matches the city "Philadelphia"
    // AND the state "PA" independently — users naturally type "City, ST".
    const tokens = search.toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
    const fields = [b.name, b.city, b.state, b.category].map((f) => f?.toLowerCase() ?? "");
    const matchSearch =
      tokens.length === 0 ||
      tokens.every((token) => fields.some((f) => f.includes(token)));
    const matchCat =
      category === "All" || b.category?.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  // Fetch Philadelphia cultural sites once map is ready
  useEffect(() => {
    if (!ready) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/cultural-sites?city=Philadelphia`)
      .then((r) => r.json())
      .then((d: any) => {
        if (Array.isArray(d.sites)) setCulturalSites(d.sites as CulturalSiteWeb[]);
      })
      .catch(() => {});
  }, [ready]);

  // Render cultural site markers whenever sites load and map is initialized
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!g || !mapRef.current || culturalSites.length === 0) return;

    // Clean up previous cultural markers
    culturalMarkersRef.current.forEach((m) => m.setMap(null));
    culturalMarkersRef.current = [];

    culturalSites.forEach((site) => {
      const lat = parseFloat(site.latitude);
      const lng = parseFloat(site.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getCulturalPinColor(site);
      const label = getCulturalPinLabel(site);

      // Diamond shape SVG path for cultural sites — distinct from business circles
      const marker: GMarker = new g.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: site.name,
        icon: {
          path: "M 0,-9 7,0 0,9 -7,0 Z",
          scale: 1,
          fillColor: color,
          fillOpacity: 0.92,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
        zIndex: 2,
      });

      marker.addListener("click", () => {
        const snippet = site.visitTip
          ? site.visitTip.slice(0, 120) + (site.visitTip.length > 120 ? "…" : "")
          : site.description
          ? site.description.slice(0, 100) + (site.description.length > 100 ? "…" : "")
          : "";

        infoWindowRef.current?.setContent(
          `<div style="font-family:serif;padding:4px 2px;min-width:180px;max-width:240px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:sans-serif">${label}</span>
            </div>
            <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px;line-height:1.3">${site.name}</div>
            <div style="font-size:11px;color:#3A1F0E80;margin-bottom:4px">${site.city}, ${site.state}</div>
            ${snippet ? `<div style="font-size:11px;color:#3A1F0E;line-height:1.45;font-style:italic;margin-bottom:5px">${snippet}</div>` : ""}
            ${site.listingStatus === "live_unclaimed"
              ? `<div style="font-size:10px;color:#CA922B;margin-bottom:4px">Community Listed — not yet claimed</div>`
              : ""}
            ${site.externalUrl
              ? `<a href="${site.externalUrl}" target="_blank" rel="noopener" style="font-size:11px;color:${color};font-weight:bold;text-decoration:none;display:block">Learn More →</a>`
              : ""}
          </div>`
        );
        mapRef.current && infoWindowRef.current?.open(mapRef.current, marker);
      });

      culturalMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [culturalSites]);

  // Check subscription status
  useEffect(() => {
    if (!authData?.user) return;
    const base = BASE.replace(/\/$/, "");
    fetch(`${base}/api/stripe/subscription`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: any) => {
        if (d.subscription && ["active", "trialing"].includes(d.subscription.status)) {
          setIsPaidMember(true);
        }
      })
      .catch(() => {});
  }, [authData?.user]);

  // Load Google Maps JS API via the server-side key endpoint
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

  // Initialize map once script + data are ready
  useEffect(() => {
    if (!ready || !mapDivRef.current || isLoading) return;
    if (mapRef.current) return;

    const onGmError = (e: ErrorEvent) => {
      if (
        e.message?.toLowerCase().includes("invalidkey") ||
        e.message?.toLowerCase().includes("google maps")
      ) {
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
        scale: mid === id ? 12 : 8,
        fillColor: mid === id ? "#2B1507" : "#CA922B",
        fillOpacity: 0.9,
        strokeColor: mid === id ? "#CA922B" : "#2B1507",
        strokeWeight: 2,
      });
    });

    infoWindowRef.current?.setContent(
      `<div style="font-family:serif;padding:4px 2px;min-width:160px">
        <div style="font-weight:bold;font-size:14px;color:#2B1507;margin-bottom:2px">${biz.name ?? ""}</div>
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
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
      return;
    }

    const g = (window as any).google?.maps;
    if (!g || !mapRef.current) return;

    setRoutingBizId(biz.id);

    const doRoute = (origin: { lat: number; lng: number } | any) => {
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new g.DirectionsRenderer({
          polylineOptions: {
            strokeColor: "#CA922B",
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
          suppressMarkers: false,
        });
      }
      directionsRendererRef.current.setMap(mapRef.current);

      const service = new g.DirectionsService();
      service.route(
        {
          origin,
          destination: { lat, lng },
          travelMode: g.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          setRoutingBizId(null);
          if (status === "OK" && result) {
            directionsRendererRef.current.setDirections(result);
            const leg = result.routes?.[0]?.legs?.[0];
            setRouteInfo({
              distance: leg?.distance?.text ?? "",
              duration: leg?.duration?.text ?? "",
              bizName: biz.name ?? "",
            });
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

  // Show/hide markers based on active filters
  useEffect(() => {
    if (!mapRef.current) return;
    const filteredIds = new Set(filtered.map((b) => b.id));
    markersRef.current.forEach((marker, id) => {
      marker.setMap(filteredIds.has(id) ? mapRef.current : null);
    });
  }, [filtered]);

  const renderSidebar = () => (
    <div className="w-80 shrink-0 flex flex-col border-r border-[#3A1F0E]/10 bg-white overflow-hidden">
      <div className="p-4 border-b border-[#3A1F0E]/8 shrink-0">
        <h1 className="font-serif font-bold text-[#2B1507] text-lg mb-3">Explore the Map</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses, cities…"
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
      </div>
      <div className="px-4 py-2 text-xs text-[#3A1F0E]/40 font-medium border-b border-[#3A1F0E]/6 shrink-0 flex items-center justify-between">
        <span>{filtered.length} {filtered.length === 1 ? "location" : "locations"}</span>
        {selected && (
          <button onClick={resetView} className="text-[#CA922B] font-bold hover:underline">Reset view</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
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
            <SlidersHorizontal className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-3" />
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
                    {isRouting ? (
                      <Navigation2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Navigation className="w-3 h-3" />
                    )}
                    {isPaidMember ? "Route" : "Directions"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

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
      {renderSidebar()}

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {(!ready || isLoading) && (
          <div className="absolute inset-0 bg-[#F5EBD8] flex flex-col items-center justify-center z-10">
            <div className="w-10 h-10 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#3A1F0E]/50 text-sm">Loading map…</p>
          </div>
        )}
        <div ref={mapDivRef} className="w-full h-full" />

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

        {/* Legend */}
        <div className="absolute bottom-6 left-4 bg-white/92 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-[#3A1F0E]/8 flex flex-wrap items-center gap-x-4 gap-y-1.5 pointer-events-none max-w-[480px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#CA922B] border border-[#2B1507]/40" />
            <span className="text-[10px] font-semibold text-[#3A1F0E]/70">Business</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-[#92400E]" />
            <span className="text-[10px] font-semibold text-[#3A1F0E]/70">Cultural Site</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-[#7C3AED]" />
            <span className="text-[10px] font-semibold text-[#3A1F0E]/70">HBCU / Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-[#16A34A]" />
            <span className="text-[10px] font-semibold text-[#3A1F0E]/70">Market</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-[#0891B2]" />
            <span className="text-[10px] font-semibold text-[#3A1F0E]/70">Public Art</span>
          </div>
          {isPaidMember && (
            <div className="flex items-center gap-1.5 border-l border-[#3A1F0E]/10 pl-4">
              <Navigation className="w-3 h-3 text-[#CA922B]" />
              <span className="text-xs font-semibold text-[#CA922B]">In-app routing active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
