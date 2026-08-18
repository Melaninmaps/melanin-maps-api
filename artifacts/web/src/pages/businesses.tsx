import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, MapPin, Star, Loader2, ArrowRight, Plus, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import BookstoreDiscoveryPanel from "@/components/BookstoreDiscoveryPanel";

const BASE = import.meta.env.BASE_URL;
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ── Types ───────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  city: string;
  state?: string | null;
  country?: string | null;
  description?: string;
  blackOwned?: boolean;
  ownershipDesignations?: string[];
  averageRating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  imageUrl?: string;
  website?: string;
  matchTier?: string;
  matchReason?: string;
}

interface HeritageSite {
  id: string;
  name: string;
  description?: string | null;
  heritageCategory?: string | null;
  heritage_category?: string | null;
  pinType?: string | null;
  pin_type?: string | null;
  city: string;
  state: string;
  externalUrl?: string | null;
}

interface CommunityOrg {
  id: string;
  name: string;
  category?: string;
  city: string;
  state?: string;
  description?: string | null;
  website?: string | null;
}

interface UniversalResult {
  query: string;
  intentType: string;
  totalResults: number;
  fallbackMessage?: string | null;
  namedBusinessNotFound?: boolean;
  namedBusinessMessage?: string;
  namedBusinessNextActions?: string[];
  results: {
    businesses: Business[];
    heritage: HeritageSite[];
    events: any[];
    libraryTopics: any[];
    communityOrgs?: CommunityOrg[];
  };
}

// ── Constants ───────────────────────────────────────────────────────────────

const OWNERSHIP_FILTERS = [
  "Black-Owned", "Minority-Owned", "Hispanic-Owned", "Women-Owned",
  "Veteran-Owned", "LGBTQ+-Owned", "Indigenous-Owned", "Melanated Diaspora-Owned", "Disability-Owned",
];

const CATEGORY_FILTERS = [
  "All", "Food & Drink", "Beauty & Personal Care", "Health & Wellness",
  "Retail & Boutiques", "Professional Services", "Arts & Culture",
  "Home & Property", "Technology", "Automotive",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function ownershipLabel(biz: Business): string | null {
  if (biz.ownershipDesignations && biz.ownershipDesignations.length > 0) {
    return biz.ownershipDesignations[0];
  }
  if (biz.blackOwned) return "Black / African American-Owned";
  return null;
}

function heritagePinLabel(site: HeritageSite): string {
  // API returns snake_case (heritage_category, pin_type) — normalize both cases
  const hc = site.heritageCategory ?? site.heritage_category ?? "";
  const pt = site.pinType ?? site.pin_type ?? "";
  if (hc === "HBCU") return "HBCU";
  if (hc === "Civil Rights" || hc === "civil_rights_landmark") return "Civil Rights Site";
  if (hc === "Religious Heritage" || hc === "church_faith_landmark") return "Historic Faith Site";
  if (hc === "African American Heritage") return "African American Heritage";
  if (pt === "mural_or_public_art") return "Public Art";
  if (pt === "community_org") return "Community Organization";
  return hc || "Cultural Site";
}

// Determine whether a heritage site is a faith institution
function isFaithSite(site: HeritageSite): boolean {
  const hc = (site.heritageCategory ?? site.heritage_category ?? "").toLowerCase();
  const pt = (site.pinType ?? site.pin_type ?? "").toLowerCase();
  return hc.includes("church") || hc.includes("faith") || hc.includes("religious") ||
    hc.includes("chapel") || hc.includes("temple") || hc.includes("mosque") ||
    hc.includes("synagogue") || hc.includes("gurdwara") || pt.includes("faith");
}

// Derive contextual section label for heritage based on intent + site types
function heritageSection(intentType: string, sites: HeritageSite[]): string {
  if (intentType === "faith") {
    const allFaith = sites.every(isFaithSite);
    const someFaith = sites.some(isFaithSite);
    if (allFaith) return "Houses of Faith";
    if (someFaith) return "Houses of Faith & Historic Sites";
  }
  return "Historic & Cultural Sites";
}

// Derive contextual section label for businesses based on intent
function businessesSection(intentType: string): string {
  if (intentType === "faith") return "Faith Communities";
  return "Businesses";
}

// ── Business card ────────────────────────────────────────────────────────────

function BusinessCard({ biz }: { biz: Business }) {
  const ownership = ownershipLabel(biz);
  return (
    <Link href={`/businesses/${biz.id}`}
      className="block bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-[#2B1507]/8 flex items-center justify-center">
        {biz.imageUrl ? (
          <img src={biz.imageUrl} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2B1507]/10 to-[#CA922B]/10">
            <ShieldCheck className="w-12 h-12 text-[#CA922B]/30" />
          </div>
        )}
        {ownership && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#2B1507]/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm capitalize">
              {ownership}
            </span>
          </div>
        )}
        {biz.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#CA922B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Featured</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#CA922B] uppercase mb-1">
          {biz.category}{biz.subcategory ? ` · ${biz.subcategory}` : ""} · {biz.city}{biz.state ? `, ${biz.state}` : ""}
        </div>
        <h3 className="font-serif font-bold text-lg text-[#3A1F0E] mb-2 group-hover:text-[#CA922B] transition-colors">{biz.name}</h3>
        {biz.description && (
          <p className="text-sm text-[#3A1F0E]/60 line-clamp-2 mb-3 font-light leading-relaxed">
            {biz.description.replace(/^\[DEMO\]\s*/i, "")}
          </p>
        )}
        <div className="flex items-center justify-between">
          {(biz.reviewCount ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-[#CA922B] text-[#CA922B]" />
              <span className="text-sm font-bold text-[#3A1F0E]">{(biz.averageRating ?? 0).toFixed(1)}</span>
              <span className="text-xs text-[#3A1F0E]/50">({biz.reviewCount})</span>
            </div>
          ) : (
            <span className="text-xs text-[#3A1F0E]/40">No reviews yet</span>
          )}
          <span className="text-xs font-bold text-[#CA922B] group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}

// ── Heritage site card ────────────────────────────────────────────────────────

function HeritageSiteCard({ site }: { site: HeritageSite }) {
  const label = heritagePinLabel(site);
  const Inner = (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="h-24 bg-gradient-to-br from-[#78716C]/10 to-[#CA922B]/10 flex items-center justify-center">
        <span className="text-3xl">🏛️</span>
      </div>
      <div className="p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#78716C] uppercase mb-1">
          {label} · {site.city}, {site.state}
        </div>
        <h3 className="font-serif font-bold text-base text-[#3A1F0E] mb-2 group-hover:text-[#CA922B] transition-colors">{site.name}</h3>
        {site.description && (
          <p className="text-xs text-[#3A1F0E]/60 line-clamp-2 font-light leading-relaxed">{site.description}</p>
        )}
      </div>
    </div>
  );

  if (site.externalUrl) {
    return <a href={site.externalUrl} target="_blank" rel="noopener noreferrer">{Inner}</a>;
  }
  return Inner;
}

// ── Community org card ────────────────────────────────────────────────────────

function CommunityOrgCard({ org }: { org: CommunityOrg }) {
  const Inner = (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#CA922B] uppercase">
            {org.category ?? "Community"} · {org.city}{org.state ? `, ${org.state}` : ""}
          </div>
        </div>
      </div>
      <h3 className="font-serif font-bold text-base text-[#3A1F0E] mb-2 group-hover:text-[#CA922B] transition-colors">{org.name}</h3>
      {org.description && (
        <p className="text-xs text-[#3A1F0E]/60 line-clamp-2 font-light leading-relaxed mb-3">{org.description}</p>
      )}
      {org.website && (
        <span className="text-xs font-bold text-[#CA922B] group-hover:underline">Visit website →</span>
      )}
    </div>
  );
  if (org.website) {
    return <a href={org.website} target="_blank" rel="noopener noreferrer">{Inner}</a>;
  }
  return Inner;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mb-6">
        <Search className="w-7 h-7 text-[#CA922B]/60" />
      </div>
      <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">
        {query ? `We don't have enough MWM listings for "${query}" yet.` : "No businesses match your filters."}
      </h3>
      <p className="text-sm text-[#3A1F0E]/50 max-w-md mb-8 font-light leading-relaxed">
        {query
          ? "Our directory grows every week. You can help by suggesting a place, or ask KinfolkAI to recommend alternatives."
          : "Try clearing your filters to see the full directory."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {query && (
          <>
            <Link href={`/map?q=${encodeURIComponent(query)}`}>
              <Button className="rounded-full bg-[#2B1507] text-white px-6 h-10 text-sm gap-2">
                <MapPin className="w-4 h-4" /> Search on Map
              </Button>
            </Link>
            <Link href="/travel">
              <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-6 h-10 text-sm gap-2 bg-transparent">
                <MessageCircle className="w-4 h-4" /> Ask KinfolkAI
              </Button>
            </Link>
            <Link href="/for-business-owners">
              <Button variant="outline" className="rounded-full border-[#3A1F0E]/20 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] px-6 h-10 text-sm gap-2 bg-transparent">
                <Plus className="w-4 h-4" /> Suggest a Place
              </Button>
            </Link>
          </>
        )}
        <button onClick={onClear} className="text-sm font-bold text-[#CA922B] hover:underline px-4">
          Clear Filters
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Businesses() {
  // Directory state — loaded once on mount, used for browse mode
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);

  // Search state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOwnership, setActiveOwnership] = useState<string | null>(null);

  // Universal Search state — populated on Enter/submit, null = browse mode
  const [universalResult, setUniversalResult] = useState<UniversalResult | null>(null);
  const [universalLoading, setUniversalLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  // bookstore intent bypasses universal search and shows the discovery panel
  const [searchMode, setSearchMode] = useState<"default" | "bookstore">("default");
  // Detected geography — set when geo-extract identifies a destination in the query
  const [detectedLocation, setDetectedLocation] = useState<{ name: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load directory on mount
  useEffect(() => {
    fetch(`${BASE}api/businesses?limit=200`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list: Business[] = Array.isArray(d) ? d : (d?.businesses ?? d?.data ?? []);
        setAllBusinesses(list);
      })
      .catch(() => {})
      .finally(() => setDirectoryLoading(false));
  }, []);

  // Universal Search — fires on Enter or button click.
  // Architecture mirrors the Map page: geo-extract runs FIRST to detect any
  // geographic intent ("Phuket", "Bangkok", "Jamaica"). If a destination is
  // found its coordinates are passed to universal-search so PASS 3 geo-bounds
  // the query to MWM businesses in that region rather than using the user's
  // current location. Geocoder coordinates only — never geocoder businesses.
  const runSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query || query.length < 2) return;
    setSearchedQuery(query);

    // Bookstore intent is location-first — never goes to universal search.
    if (/\b(bookstore|book\s*-?\s*store|bookshop)\b/i.test(query)) {
      setSearchMode("bookstore");
      setUniversalResult(null);
      setUniversalLoading(false);
      setDetectedLocation(null);
      return;
    }

    setSearchMode("default");
    setUniversalLoading(true);
    setUniversalResult(null);
    setDetectedLocation(null);

    let geoLat: number | null = null;
    let geoLng: number | null = null;

    // Step 1 — geography extraction (same logic as Map page)
    try {
      const geoRes = await fetch(
        `${API_BASE}/api/maps/geo-extract?q=${encodeURIComponent(query)}`,
        { credentials: "include" }
      );
      if (geoRes.ok) {
        const gd = await geoRes.json() as {
          hasLocation: boolean; locationQuery: string | null;
          lat: number | null; lng: number | null;
        };
        if (gd.hasLocation && typeof gd.lat === "number" && typeof gd.lng === "number") {
          geoLat = gd.lat;
          geoLng = gd.lng;
          setDetectedLocation({ name: gd.locationQuery ?? query });
        }
      }
    } catch { /* geo-extract failed — search continues with no geo-bounds */ }

    // Step 2 — MWM database search only (never display geocoder businesses)
    try {
      const p = new URLSearchParams({ q: query, surface: "directory", limit: "30" });
      if (geoLat !== null && geoLng !== null) {
        // Geo-bound to the detected destination.
        // radius=50 mirrors the map page — covers a full province/island/metro area
        // regardless of how individual sub-areas are stored (e.g. "Patong" for Phuket).
        p.set("lat", String(geoLat));
        p.set("lng", String(geoLng));
        p.set("radius", "50");
      }
      const res = await fetch(`${API_BASE}/api/search/universal?${p}`, { credentials: "include" });
      if (res.ok) {
        setUniversalResult(await res.json());
      }
    } catch { /* fall through to client-side browse */ }
    finally { setUniversalLoading(false); }
  }, []);

  // Client-side filter for browse mode (when no active search)
  const browseFiltered = (() => {
    let result = allBusinesses;
    if (activeCategory !== "All") {
      result = result.filter(b => b.category?.toLowerCase().includes(activeCategory.toLowerCase()));
    }
    if (activeOwnership) {
      const term = activeOwnership.replace("-Owned", "").toLowerCase();
      result = result.filter(b => {
        const label = ownershipLabel(b)?.toLowerCase() ?? "";
        return label.includes(term) || (term === "black" && b.blackOwned);
      });
    }
    return result;
  })();

  const clearSearch = () => {
    setSearch("");
    setSearchedQuery("");
    setUniversalResult(null);
    setDetectedLocation(null);
    setSearchMode("default");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") runSearch(search);
  };

  // Determine what to display
  const isSearchMode = !!universalResult || universalLoading || searchMode === "bookstore";
  const universalBusinesses = universalResult?.results.businesses ?? [];
  const universalHeritage = universalResult?.results.heritage ?? [];
  const universalCommunityOrgs = universalResult?.results.communityOrgs ?? [];
  const intentType = universalResult?.intentType ?? "general";
  const hasUniversalResults = universalBusinesses.length > 0 || universalHeritage.length > 0 || universalCommunityOrgs.length > 0;

  const loading = directoryLoading;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">

      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-businesses-bg.jpg`} alt=""
          className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/82 z-0" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Community Business Directory</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Support Trusted<br />
            <span className="text-[#CA922B]">Businesses.</span><br />
            Everywhere You Go.
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-10 font-light">
            Search naturally — churches, dentists, OBGYN, tax attorneys, Ethiopian restaurants. The directory finds what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#directory">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg">Browse Directory →</Button>
            </a>
            <Link href="/for-business-owners">
              <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-14 text-lg bg-transparent">List Your Business</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-16" id="directory">

        {/* Search bar */}
        <div className="mb-8 space-y-5">
          <div className="relative flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3A1F0E]/40 pointer-events-none" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  // Clear universal results when user changes the query
                  if (universalResult) { setUniversalResult(null); setSearchedQuery(""); }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Try: Churches in Philadelphia · OBGYN Atlanta · Ethiopian restaurant DC · tax attorney"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] placeholder-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/50 shadow-sm text-base"
              />
            </div>
            <button
              onClick={() => runSearch(search)}
              disabled={universalLoading || !search.trim()}
              className="px-6 py-4 rounded-2xl bg-[#2B1507] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#3A1F0E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {universalLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Search className="w-4 h-4" /> Search</>}
            </button>
          </div>

          {/* Search hint — only shown when not in search mode */}
          {!isSearchMode && (
            <p className="text-xs text-[#3A1F0E]/40 font-medium pl-1">
              Press Enter or click Search to find anything — businesses, faith communities, healthcare providers, and more.
            </p>
          )}

          {/* Browse filters — shown only in browse mode */}
          {!isSearchMode && (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORY_FILTERS.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${c === activeCategory ? 'bg-[#3A1F0E] text-white' : 'bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] hover:border-[#CA922B]'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {OWNERSHIP_FILTERS.map(c => (
                  <button key={c} onClick={() => setActiveOwnership(activeOwnership === c ? null : c)}
                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${activeOwnership === c ? 'bg-[#CA922B] text-white border border-[#CA922B]' : 'bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] hover:border-[#CA922B]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── SEARCH MODE ─────────────────────────────────────────────────── */}
        {isSearchMode && (
          <div className="mb-10">
            {/* Back to browse */}
            <button onClick={clearSearch}
              className="flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors mb-6">
              ← Back to directory
            </button>

            {/* ── Bookstore discovery panel — location-first, never goes to AI ── */}
            {searchMode === "bookstore" && (
              <BookstoreDiscoveryPanel key={searchedQuery} query={searchedQuery} />
            )}

            {/* Loading */}
            {universalLoading && (
              <div className="flex items-center justify-center py-24 gap-3">
                <Loader2 className="w-6 h-6 text-[#CA922B] animate-spin" />
                <span className="text-sm text-[#3A1F0E]/60 font-medium">Searching the community directory…</span>
              </div>
            )}

            {/* Results */}
            {universalResult && !universalLoading && (
              <>
                {/* Intent label + result count */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-bold text-[#3A1F0E]">
                      {universalResult.totalResults > 0
                        ? `${universalResult.totalResults} result${universalResult.totalResults === 1 ? "" : "s"} for "${searchedQuery}"`
                        : `No results for "${searchedQuery}"`}
                    </p>
                    {detectedLocation && (
                      <p className="text-xs text-[#CA922B] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Showing MWM businesses near {detectedLocation.name}
                      </p>
                    )}
                    {universalResult.fallbackMessage && (
                      <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{universalResult.fallbackMessage}</p>
                    )}
                  </div>
                  {universalResult.intentType && universalResult.intentType !== "unknown" && (
                    <span className="text-[10px] font-bold tracking-widest text-[#CA922B]/70 uppercase">
                      {universalResult.intentType.replace(/_/g, " ")} intent
                    </span>
                  )}
                </div>

                {/* Heritage / Faith sites — label is intent-aware */}
                {universalHeritage.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                      <span className="text-[10px] font-bold tracking-widest text-[#78716C] uppercase">
                        {heritageSection(intentType, universalHeritage)}
                      </span>
                      <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {universalHeritage.map(site => (
                        <HeritageSiteCard key={site.id} site={site} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Business results — label is intent-aware */}
                {universalBusinesses.length > 0 && (
                  <div className="mb-8">
                    {(universalHeritage.length > 0 || universalCommunityOrgs.length > 0) && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                        <span className="text-[10px] font-bold tracking-widest text-[#3A1F0E]/40 uppercase">
                          {businessesSection(intentType)}
                        </span>
                        <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {universalBusinesses.map(biz => (
                        <BusinessCard key={biz.id} biz={biz} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Community organizations */}
                {universalCommunityOrgs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                      <span className="text-[10px] font-bold tracking-widest text-[#3A1F0E]/40 uppercase">Community Organizations</span>
                      <div className="h-px flex-1 bg-[#3A1F0E]/8" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {universalCommunityOrgs.map(org => (
                        <CommunityOrgCard key={org.id} org={org} />
                      ))}
                    </div>
                  </div>
                )}

                {/* No results empty state */}
                {!hasUniversalResults && (
                  <div className="grid grid-cols-1">
                    <EmptyState query={searchedQuery} onClear={clearSearch} />
                  </div>
                )}

                {/* Next actions — always shown after search, even with results */}
                {hasUniversalResults && (
                  <div className="mt-8 flex flex-wrap gap-3 items-center justify-center border-t border-[#3A1F0E]/6 pt-8">
                    <span className="text-xs text-[#3A1F0E]/40 font-medium">Not what you were looking for?</span>
                    <Link href={`/map?q=${encodeURIComponent(searchedQuery)}`}>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/60 hover:text-[#CA922B] transition-colors">
                        <MapPin className="w-3.5 h-3.5" /> Search on Map
                      </button>
                    </Link>
                    <Link href="/travel">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/60 hover:text-[#CA922B] transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> Ask KinfolkAI
                      </button>
                    </Link>
                    <Link href="/for-business-owners">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/60 hover:text-[#CA922B] transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Suggest a Place
                      </button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BROWSE MODE ──────────────────────────────────────────────────── */}
        {!isSearchMode && (
          <>
            {/* Result count row */}
            {!loading && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-[#3A1F0E]/60 font-medium">
                  {browseFiltered.length} {browseFiltered.length === 1 ? "business" : "businesses"}
                  {activeCategory !== "All" || activeOwnership ? " matching filters" : " in directory"}
                </p>
                <div className="flex gap-3">
                  <Link href="/for-business-owners">
                    <Button variant="outline" className="rounded-full border-[#3A1F0E]/30 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] text-sm bg-transparent">Submit a Business</Button>
                  </Link>
                  <Link href="/map">
                    <Button className="rounded-full bg-[#2B1507] text-white text-sm">
                      <MapPin className="w-4 h-4 mr-2" /> Near Me
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden animate-pulse">
                    <div className="h-48 bg-[#3A1F0E]/5" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-[#3A1F0E]/5 rounded w-3/4" />
                      <div className="h-4 bg-[#3A1F0E]/5 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : browseFiltered.length === 0 ? (
                <EmptyState query="" onClear={() => { setActiveCategory("All"); setActiveOwnership(null); }} />
              ) : (
                browseFiltered.map(biz => <BusinessCard key={biz.id} biz={biz} />)
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="bg-[#FAF6EF] p-12 rounded-3xl border border-[#3A1F0E]/10 flex flex-col md:flex-row items-center gap-12 mt-8">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-[#CA922B] uppercase mb-4">For Business Owners & Community</div>
            <h3 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-4">Know a Business Worth Sharing?</h3>
            <p className="text-[#3A1F0E]/70 mb-6 leading-relaxed">
              Help grow the directory by submitting a business you love. Community members can nominate any business they trust — and owners can claim their listing at any stage.
            </p>
            <div className="bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-2xl px-5 py-4 mb-8">
              <p className="text-sm text-[#3A1F0E] leading-relaxed">
                <span className="font-bold text-[#CA922B]">All minority-owned businesses are welcome.</span> We understand every business is at a different stage in its journey — you don't need to be established to join.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/for-business-owners">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Submit a Business</Button>
              </Link>
              <Link href="/map">
                <Button variant="outline" className="rounded-full border-[#2B1507] text-[#2B1507] px-8 h-12 bg-transparent">Explore the Map</Button>
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white p-8 rounded-2xl shadow-lg border border-[#3A1F0E]/5 transform rotate-2">
            <div className="w-16 h-16 bg-[#2B1507] rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#CA922B]" />
            </div>
            <div className="text-center font-serif font-bold text-2xl text-[#3A1F0E] mb-2">Get Listed</div>
            <div className="text-center text-[#3A1F0E]/60 text-sm">Join the network of trusted minority-owned businesses today.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
