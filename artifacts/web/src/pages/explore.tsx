import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Grid, Map as MapIcon, X, LoaderCircle, BadgeCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const OWNERSHIP_OPTIONS = [
  { id: "black-owned", label: "Black-Owned", emoji: "✊🏾", color: "#CA922B" },
  { id: "minority-owned", label: "Minority-Owned", emoji: "🏅", color: "#3A1F0E" },
  { id: "women-owned", label: "Women-Owned", emoji: "👩🏾‍💼", color: "#7B2D8B" },
  { id: "veteran-owned", label: "Veteran-Owned", emoji: "🎖️", color: "#1D4ED8" },
  { id: "lgbtq-owned", label: "LGBTQIA+-Owned", emoji: "🏳️‍🌈", color: "#DC2626" },
  { id: "hispanic-owned", label: "Hispanic/Latino-Owned", emoji: "🤝🏾", color: "#2D7A4F" },
  { id: "indigenous-owned", label: "Indigenous-Owned", emoji: "🌿", color: "#5E4B1A" },
  { id: "disability-owned", label: "Disability-Owned", emoji: "♿", color: "#4B5563" },
  { id: "immigrant-owned", label: "Melanated Diaspora-Owned", emoji: "🌍", color: "#6D28D9" },
  { id: "d9-affiliated", label: "D9 Affiliated", emoji: "🐾", color: "#7B1E1E" },
];

const normaliseDesignation = (value: string) =>
  value.trim().toLowerCase().replace(/[_\s]+/g, "-");

function documentedOwnershipTags(business: any): string[] {
  const verified = Array.isArray(business.verifiedDesignations)
    ? business.verifiedDesignations.map((value: string) => normaliseDesignation(value))
    : [];
  if (business.verified === true && business.blackOwned === true) verified.push("black-owned");
  return [...new Set(verified)].filter((tag) =>
    OWNERSHIP_OPTIONS.some((option) => option.id === tag),
  );
}

export default function Explore() {
  const [, navigate] = useLocation();

  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const { data, isLoading, isError } = useListBusinesses({
    limit: 50,
    search: submittedSearch.trim() || undefined,
  });

  const liveBusinesses = data?.businesses ?? [];

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(
      liveBusinesses.map((business: any) => business.category).filter(Boolean),
    )).sort() as string[]],
    [liveBusinesses],
  );

  const filtered = useMemo(() => liveBusinesses.filter((business: any) => {
    const categoryMatches = activeCategory === "All" || business.category === activeCategory;
    const ownership = documentedOwnershipTags(business);
    const ownershipMatches = selectedOwnership.length === 0 ||
      selectedOwnership.some((tag) => ownership.includes(tag));
    return categoryMatches && ownershipMatches;
  }), [liveBusinesses, activeCategory, selectedOwnership]);

  const hasFilters = selectedOwnership.length > 0 || activeCategory !== "All" || submittedSearch.trim().length > 0;

  const toggleOwnership = (id: string) => {
    setSelectedOwnership((previous) =>
      previous.includes(id) ? previous.filter((tag) => tag !== id) : [...previous, id],
    );
  };

  const handleSearch = () => setSubmittedSearch(searchQuery.trim());

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-16 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-explore-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">DISCOVER YOUR WORLD</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Explore With Purpose</h1>
          <p className="text-[#F5EBD8]/80 max-w-xl mx-auto mb-8 font-light">
            Find minority-owned businesses, cultural landmarks, safe stays, and community events wherever you go.
          </p>

          <div className="w-full max-w-2xl bg-white rounded-full p-2 flex items-center shadow-lg">
            <div className="px-4 py-2 border-r border-gray-200 flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-[#CA922B]" />
              <span className="font-medium text-[#3A1F0E]">Anywhere</span>
            </div>
            <div className="flex-1 flex items-center px-4">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search business name or type…"
                className="w-full bg-transparent border-none outline-none text-[#3A1F0E] placeholder:text-gray-400"
              />
              {submittedSearch && (
                <button onClick={() => { setSearchQuery(""); setSubmittedSearch(""); }} className="ml-2 text-gray-400 hover:text-[#3A1F0E]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-10">Search</Button>
          </div>

          <p className="mt-4 text-[#F5EBD8]/50 text-xs">
            Looking for businesses near a specific city?{" "}
            <button onClick={() => navigate("/map")} className="underline hover:text-[#CA922B]">Open the Map</button>
          </p>
        </div>
      </section>

      {/* Category Filter Bar — populated from live directory data */}
      <div className="border-b border-[#3A1F0E]/10 bg-white sticky top-20 z-40">
        <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar items-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeCategory === c
                  ? "bg-[#3A1F0E] text-white"
                  : "bg-[#FAF6EF] text-[#3A1F0E] hover:bg-[#3A1F0E]/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ownership Filter Row */}
      <div className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Ownership</span>
            {selectedOwnership.length > 0 && (
              <button
                onClick={() => setSelectedOwnership([])}
                className="text-xs text-[#CA922B] font-medium flex items-center gap-1 hover:underline"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {OWNERSHIP_OPTIONS.map((opt) => {
              const active = selectedOwnership.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOwnership(opt.id)}
                  style={active ? { backgroundColor: opt.color, borderColor: opt.color, color: "#FFFFFF" } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold border transition-colors shrink-0 ${
                    active
                      ? ""
                      : "bg-white border-[#3A1F0E]/20 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B]"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">
            {isLoading
              ? "Loading live listings…"
              : `${filtered.length} live listing${filtered.length === 1 ? "" : "s"}`}
            {!isLoading && hasFilters && <span className="text-[#3A1F0E]/50"> · filtered</span>}
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button className="p-2 bg-[#FAF6EF] text-[#3A1F0E] rounded-md"><Grid className="w-4 h-4" /></button>
            <button onClick={() => navigate("/map")} title="View on map" className="p-2 text-gray-400 hover:text-[#3A1F0E]"><MapIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Active ownership filter pills */}
        {selectedOwnership.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedOwnership.map((id) => {
              const opt = OWNERSHIP_OPTIONS.find((o) => o.id === id);
              if (!opt) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: opt.color }}
                >
                  {opt.emoji} {opt.label}
                  <button onClick={() => toggleOwnership(id)} className="ml-1 opacity-70 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Listings */}
        {isLoading ? (
          <div className="flex justify-center items-center gap-3 py-24 text-[#3A1F0E]" aria-live="polite">
            <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
            <span className="text-sm text-[#3A1F0E]/60">Loading live business listings…</span>
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E]">Live listings are unavailable right now</h3>
            <p className="mt-2 text-sm text-[#3A1F0E]/70">Please try again shortly or search on the Map.</p>
            <Button onClick={() => navigate("/map")} className="mt-6 rounded-full bg-[#CA922B] text-white">Open the Map</Button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((business: any) => {
              const ownership = documentedOwnershipTags(business);
              return (
                <article key={business.id} className="bg-white rounded-2xl overflow-hidden border border-[#3A1F0E]/5 shadow-[0_4px_20px_rgba(43,21,7,0.06)] flex flex-col">
                  <div className="h-52 bg-[#2B1507]/10 relative overflow-hidden">
                    {business.imageUrl ? (
                      <img src={business.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#2B1507]" aria-hidden="true" />
                    )}
                    {business.verified === true && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-[#3A1F0E] text-[10px] font-bold px-2 py-1 rounded">
                        <BadgeCheck className="w-3 h-3 text-[#CA922B]" aria-hidden="true" /> Verified listing
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider mb-2">
                      {business.category}
                      {(business.city || business.state) && (
                        <> · {business.city}{business.state ? `, ${business.state}` : ""}</>
                      )}
                    </p>
                    <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">{business.name}</h3>
                    {business.description ? (
                      <p className="text-sm text-[#3A1F0E]/70 mb-4 flex-1 leading-relaxed">{business.description}</p>
                    ) : null}
                    {ownership.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-5" aria-label="Documented business designations">
                        {ownership.map((tag) => {
                          const option = OWNERSHIP_OPTIONS.find((item) => item.id === tag)!;
                          return (
                            <span key={tag} className="text-[10px] font-semibold px-2 py-1 rounded bg-[#FAF6EF] text-[#3A1F0E]">
                              {option.emoji} {option.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                    <Link href={`/businesses/${business.id}`} className="mt-auto">
                      <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">View Details</Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">
              {submittedSearch ? `No listings match "${submittedSearch}"` : "No live listings match those filters"}
            </h3>
            <p className="text-[#3A1F0E]/60 mb-6 max-w-sm">
              Try a broader term, clear your filters, or search by city on the Map.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={() => { setSelectedOwnership([]); setActiveCategory("All"); setSearchQuery(""); setSubmittedSearch(""); }}
                variant="outline"
                className="rounded-full border-[#CA922B] text-[#CA922B]"
              >
                Clear filters
              </Button>
              <Button onClick={() => navigate("/map")} className="rounded-full bg-[#CA922B] text-white">
                Open the Map
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mt-4 mb-16">
          <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">Navigate Beyond the Destination.</h2>
          <h2 className="text-3xl font-serif font-bold text-[#CA922B] italic">Discover the Community.</h2>
        </div>
      </div>
    </div>
  );
}
