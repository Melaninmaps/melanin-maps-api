import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Grid, Map as MapIcon, Star, X } from "lucide-react";
import { useState } from "react";

const OWNERSHIP_OPTIONS = [
  { id: "minority-owned", label: "Minority-Owned", emoji: "✊🏾", color: "#3A1F0E" },
  { id: "women-owned", label: "Women-Owned", emoji: "👩🏾‍💼", color: "#7B2D8B" },
  { id: "veteran-owned", label: "Veteran-Owned", emoji: "🎖️", color: "#1D4ED8" },
  { id: "lgbtq-owned", label: "LGBTQIA+-Owned", emoji: "🏳️‍🌈", color: "#DC2626" },
  { id: "hispanic-owned", label: "Hispanic/Latino-Owned", emoji: "🤝", color: "#2D7A4F" },
  { id: "asian-owned", label: "Asian-Owned", emoji: "🌏", color: "#0891B2" },
  { id: "indigenous-owned", label: "Indigenous-Owned", emoji: "🌿", color: "#5E4B1A" },
  { id: "disability-owned", label: "Disability-Owned", emoji: "♿", color: "#4B5563" },
  { id: "immigrant-owned", label: "Immigrant-Owned", emoji: "🌍", color: "#6D28D9" },
];

const CATEGORIES = ["All", "Restaurants & Nightlife", "Hotels & Stays", "Cultural Landmarks", "Professional Services", "Community Events", "Hidden Gems"];

export default function Explore() {
  const { data: apiBusinesses } = useListBusinesses({ limit: 6 });

  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleOwnership = (id: string) => {
    setSelectedOwnership((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const staticBusinesses = [
    {
      id: "1",
      name: "The Gathering Table",
      category: "Restaurants & Nightlife",
      city: "Atlanta",
      state: "GA",
      description: "Award-winning Southern cuisine rooted in community and culture. A must-visit for any Atlanta trip.",
      confidenceScore: 96,
      recommend: "97%",
      returnAlone: "94%",
      safety: "4.9",
      featured: true,
      image: `${import.meta.env.BASE_URL}images/biz-gathering-table.jpg`,
      tags: ["Community Trusted", "Traveler Favorite", "Soul Food", "Dine-In"],
      ownershipTags: ["minority-owned", "women-owned"],
    },
    {
      id: "2",
      name: "Heritage Boutique Hotel",
      category: "Hotels & Stays",
      city: "New Orleans",
      state: "LA",
      description: "A beautifully restored historic property in the heart of the Tremé neighborhood.",
      confidenceScore: 97,
      recommend: "98%",
      returnAlone: "96%",
      safety: "4.9",
      featured: true,
      image: `${import.meta.env.BASE_URL}images/biz-heritage-hotel.jpg`,
      tags: ["Community Trusted", "Top Rated", "Boutique", "Historic"],
      ownershipTags: ["minority-owned"],
    },
    {
      id: "3",
      name: "Diaspora Arts Collective",
      category: "Cultural Landmarks",
      city: "Harlem",
      state: "NY",
      description: "A vibrant gallery and cultural center celebrating African and African-American art and history.",
      confidenceScore: 98,
      recommend: "99%",
      returnAlone: "97%",
      safety: "5",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-diaspora-arts.jpg`,
      tags: ["Highly Recommended", "Local Gem", "Art", "Culture", "Gallery"],
      ownershipTags: ["minority-owned", "women-owned"],
    },
    {
      id: "4",
      name: "Afrobeats & Culture Fest",
      category: "Community Events",
      city: "Houston",
      state: "TX",
      description: "Annual outdoor festival celebrating African and Caribbean music, food, and culture.",
      confidenceScore: 93,
      recommend: "95%",
      returnAlone: "91%",
      safety: "4.7",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-afrobeats-fest.jpg`,
      tags: ["Traveler Favorite", "Festival", "Music", "Food"],
      ownershipTags: ["hispanic-owned"],
    },
    {
      id: "5",
      name: "Carter & Associates Law",
      category: "Professional Services",
      city: "Chicago",
      state: "IL",
      description: "Full-service law firm specializing in business, real estate, and civil rights law.",
      confidenceScore: 92,
      recommend: "94%",
      returnAlone: "90%",
      safety: "4.8",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-carter-law.jpg`,
      tags: ["Community Trusted", "Legal", "Business", "Real Estate"],
      ownershipTags: ["minority-owned", "veteran-owned"],
    },
    {
      id: "6",
      name: "Roots & Routes Café",
      category: "Restaurants & Nightlife",
      city: "Washington",
      state: "D.C.",
      description: "Pan-African cuisine and specialty coffee in a warm, community-centered space.",
      confidenceScore: 89,
      recommend: "91%",
      returnAlone: "87%",
      safety: "4.6",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-roots-cafe.jpg`,
      tags: ["Local Gem", "Pan-African", "Coffee", "Brunch"],
      ownershipTags: ["minority-owned", "immigrant-owned"],
    }
  ];

  const filtered = staticBusinesses.filter((b) => {
    const matchesCategory = activeCategory === "All" || b.category === activeCategory;
    const matchesOwnership =
      selectedOwnership.length === 0 ||
      selectedOwnership.some((t) => b.ownershipTags.includes(t));
    const matchesSearch =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesOwnership && matchesSearch;
  });

  const hasFilters = selectedOwnership.length > 0 || activeCategory !== "All" || searchQuery;

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
            Find Minority-owned businesses, cultural landmarks, safe stays, and community events wherever you go.
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
                placeholder="Explore safety-first travel destinations"
                className="w-full bg-transparent border-none outline-none text-[#3A1F0E] placeholder:text-gray-400"
              />
            </div>
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-10">Search</Button>
          </div>
        </div>
      </section>

      {/* Category Filter Bar */}
      <div className="border-b border-[#3A1F0E]/10 bg-white sticky top-20 z-40">
        <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar items-center">
          {CATEGORIES.map((c) => (
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
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {hasFilters && <span className="text-[#3A1F0E]/50"> · filtered</span>}
            {!hasFilters && <span className="text-[#3A1F0E]/50"> · Most Relevant</span>}
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button className="p-2 bg-[#FAF6EF] text-[#3A1F0E] rounded-md"><Grid className="w-4 h-4" /></button>
            <button className="p-2 text-gray-400 hover:text-[#3A1F0E]"><MapIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Active filter pills */}
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

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map(b => (
              <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(43,21,7,0.08)] border border-[#3A1F0E]/5 flex flex-col group cursor-pointer hover:shadow-[0_8px_32px_rgba(43,21,7,0.14)] transition-shadow">
                <div className="h-52 bg-[#2B1507] relative overflow-hidden">
                  <img src={b.image} alt={b.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/80 via-[#2B1507]/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {b.featured && <div className="bg-[#CA922B] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Featured</div>}
                    <div className="bg-white/95 text-[#3A1F0E] text-xs font-bold px-2 py-1 rounded shadow-sm">{b.confidenceScore}/100</div>
                  </div>
                  {/* Ownership badges */}
                  {b.ownershipTags.length > 0 && (
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {b.ownershipTags.slice(0, 2).map((tag) => {
                        const opt = OWNERSHIP_OPTIONS.find((o) => o.id === tag);
                        return opt ? (
                          <span key={tag} className="text-white text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: opt.color + "CC" }}>
                            {opt.emoji} {opt.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider mb-2">{b.category} · {b.city}, {b.state}</div>
                  <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">{b.name}</h3>
                  <p className="text-sm text-[#3A1F0E]/70 mb-4 flex-1 leading-relaxed">{b.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-[#FAF6EF] p-3 rounded-xl text-center divide-x divide-[#3A1F0E]/10">
                    <div>
                      <div className="text-sm font-bold text-[#3A1F0E]">{b.recommend}</div>
                      <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Recommend</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#3A1F0E]">{b.returnAlone}</div>
                      <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Return Alone</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#3A1F0E] flex items-center justify-center gap-1">{b.safety}<Star className="w-3 h-3 fill-current text-[#CA922B]" /></div>
                      <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Safety</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {b.tags.map(t => (
                      <span key={t} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-medium">{t}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">View Details</Button>
                    <Button variant="outline" className="rounded-full border-gray-200">Review</Button>
                    <Button variant="outline" className="rounded-full border-gray-200">Report</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">No results found</h3>
            <p className="text-[#3A1F0E]/60 mb-6 max-w-sm">Try adjusting your filters or search terms to find what you're looking for.</p>
            <Button onClick={() => { setSelectedOwnership([]); setActiveCategory("All"); setSearchQuery(""); }} variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B]">
              Clear All Filters
            </Button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center text-[#3A1F0E]/50 text-sm mb-6">Showing {filtered.length} of 200+ results</div>
        )}
        
        <div className="bg-[#2B1507] rounded-3xl p-8 text-center text-white flex flex-col items-center max-w-4xl mx-auto mb-16">
          <h3 className="text-2xl font-serif font-bold mb-4">Upgrade to See All Results</h3>
          <p className="text-[#F5EBD8]/70 mb-6 max-w-xl">Get full access to community safety scores, verified business listings, group connections, and more.</p>
          <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8">See Membership Plans</Button>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">Navigate Beyond the Destination.</h2>
          <h2 className="text-3xl font-serif font-bold text-[#CA922B] italic">Discover the Community.</h2>
        </div>
      </div>
    </div>
  );
}
