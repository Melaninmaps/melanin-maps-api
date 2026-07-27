import { useState, useEffect } from "react";
import { Globe, Award, ExternalLink, Search, MapPin, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const TYPE_LABELS: Record<string, string> = {
  restaurant: "🍽️ Restaurant",
  cafe: "☕ Café",
  hotel: "🏨 Hotel",
  salon: "💇🏾 Salon",
  market: "🛒 Market",
  attraction: "🎭 Attraction",
  guide: "🧭 Guide / Tour",
  healthcare: "🏥 Healthcare",
  transportation: "🚌 Transport",
  other: "📍 Other",
};

const BADGE_LABELS: Record<string, string> = {
  local_insider: "Local Insider",
  community_ambassador: "Community Ambassador",
  global_guide: "Global Guide",
};

const BADGE_COLORS: Record<string, string> = {
  local_insider: "#CA922B",
  community_ambassador: "#7B5EA7",
  global_guide: "#1E7A4E",
};

type Rec = {
  id: string;
  country: string;
  city: string | null;
  businessName: string;
  website: string | null;
  type: string;
  reason: string | null;
  personalConnection: string | null;
  badge: string | null;
  createdAt: string;
  contributorFirstName: string | null;
  contributorHomeCity: string | null;
};

export default function GlobalRecommendations() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}api/global-recommendations?limit=100`)
      .then(r => r.json())
      .then(data => setRecs(data.recommendations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const countries = Array.from(new Set(recs.map(r => r.country))).sort();

  const filtered = recs.filter(r => {
    if (selectedCountry && r.country !== selectedCountry) return false;
    if (selectedType && r.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        (r.reason ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A2E22] to-[#2D7A4F] text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-[#CA922B] mb-5">
            <Globe className="w-4 h-4" /> Community Verified
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Global Recommendations</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Trusted places around the world — curated by Black business owners, travellers, and community members who know them personally.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Search + filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, or country…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#3A1F0E]/15 bg-white text-[#2B1507] text-sm focus:outline-none focus:border-[#CA922B] shadow-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Country chips */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Country</span>
              <button
                onClick={() => setSelectedCountry(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedCountry === null ? "bg-[#2D7A4F] text-white border-[#2D7A4F]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/15 hover:border-[#3A1F0E]/30"}`}
              >All</button>
              {countries.map(c => (
                <button key={c} onClick={() => setSelectedCountry(c === selectedCountry ? null : c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedCountry === c ? "bg-[#2D7A4F] text-white border-[#2D7A4F]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/15 hover:border-[#3A1F0E]/30"}`}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider">Type</span>
            <button
              onClick={() => setSelectedType(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedType === null ? "bg-[#CA922B] text-white border-[#CA922B]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/15 hover:border-[#3A1F0E]/30"}`}
            >All types</button>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setSelectedType(k === selectedType ? null : k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedType === k ? "bg-[#CA922B] text-white border-[#CA922B]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/15 hover:border-[#3A1F0E]/30"}`}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#3A1F0E]/50 font-medium">
            {loading ? "Loading…" : `${filtered.length} recommendation${filtered.length !== 1 ? "s" : ""}${selectedCountry ? ` in ${selectedCountry}` : ""}`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#CA922B] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#3A1F0E]/8">
            <Globe className="w-12 h-12 text-[#3A1F0E]/15 mx-auto mb-4" />
            <p className="font-bold text-[#2B1507] text-lg mb-2">No recommendations yet</p>
            <p className="text-[#3A1F0E]/50 text-sm max-w-sm mx-auto">
              {search || selectedCountry || selectedType
                ? "Try adjusting your filters."
                : "Our community is just getting started. Check back soon!"}
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(rec => {
              const expanded = expandedId === rec.id;
              return (
                <div key={rec.id} className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2B1507] text-base leading-snug">{rec.businessName}</p>
                        <p className="text-[#3A1F0E]/50 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {rec.city ? `${rec.city}, ` : ""}{rec.country}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-[#FAF6EF] border border-[#CA922B]/20 text-[#CA922B] font-semibold">
                        {TYPE_LABELS[rec.type] ?? rec.type}
                      </span>
                    </div>

                    {rec.reason && (
                      <p className={`text-[#3A1F0E]/70 text-sm leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
                        "{rec.reason}"
                      </p>
                    )}

                    {(rec.reason?.length ?? 0) > 100 && (
                      <button onClick={() => setExpandedId(expanded ? null : rec.id)}
                        className="flex items-center gap-1 text-[#CA922B] text-xs font-medium mt-1">
                        {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                      </button>
                    )}
                  </div>

                  <div className="px-5 pb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {rec.badge && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                          style={{ borderColor: BADGE_COLORS[rec.badge] + "40", color: BADGE_COLORS[rec.badge], backgroundColor: BADGE_COLORS[rec.badge] + "10" }}>
                          <Award className="w-3 h-3" />
                          {BADGE_LABELS[rec.badge] ?? rec.badge}
                        </div>
                      )}
                      {rec.contributorFirstName && (
                        <span className="text-[#3A1F0E]/40 text-xs">by {rec.contributorFirstName}{rec.contributorHomeCity ? ` · ${rec.contributorHomeCity}` : ""}</span>
                      )}
                    </div>
                    {rec.website && (
                      <a href={rec.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#CA922B] text-xs font-medium hover:underline shrink-0">
                        <ExternalLink className="w-3 h-3" /> Visit
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to action */}
        {!loading && (
          <div className="bg-gradient-to-br from-[#1A2E22] to-[#2D7A4F] rounded-3xl p-8 text-center text-white">
            <Globe className="w-10 h-10 text-[#CA922B] mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold mb-2">Know a place worth sharing?</h2>
            <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">
              Business owners can submit global recommendations from their dashboard. Earn contributor badges as your recommendations get approved.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <a href={`${BASE}business-dashboard`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CA922B] hover:bg-[#B87E23] text-white text-sm font-bold transition-colors">
                Go to your dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
