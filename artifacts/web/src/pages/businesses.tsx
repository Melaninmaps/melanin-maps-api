import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, MapPin, CheckCircle, Star, Loader2, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  city: string;
  state: string;
  description?: string;
  blackOwned?: boolean;
  ownershipDesignations?: string[];
  averageRating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  imageUrl?: string;
  website?: string;
}

const OWNERSHIP_FILTERS = [
  "Black-Owned", "Minority-Owned", "Hispanic-Owned", "Women-Owned",
  "Veteran-Owned", "LGBTQ+-Owned", "Indigenous-Owned", "Melanated Diaspora-Owned", "Disability-Owned",
];

const CATEGORY_FILTERS = [
  "All", "Food & Drink", "Beauty & Personal Care", "Health & Wellness",
  "Retail & Boutiques", "Professional Services", "Arts & Culture",
  "Home & Property", "Technology", "Automotive",
];

function ownershipLabel(biz: Business): string | null {
  if (biz.ownershipDesignations && biz.ownershipDesignations.length > 0) {
    return biz.ownershipDesignations[0];
  }
  if (biz.blackOwned) return "Black / African American-Owned";
  return null;
}

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOwnership, setActiveOwnership] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}api/businesses?limit=100`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list: Business[] = Array.isArray(d) ? d : (d?.businesses ?? d?.data ?? []);
        setBusinesses(list);
        setFiltered(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = businesses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        (b.ownershipDesignations ?? []).some(d => d.toLowerCase().includes(q))
      );
    }
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
    setFiltered(result);
  }, [search, activeCategory, activeOwnership, businesses]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-businesses-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
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
            Connect with community-verified minority-owned businesses, service providers, and entrepreneurs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#directory"><Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg">Browse Directory →</Button></a>
            <Link href="/for-business-owners"><Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-14 text-lg bg-transparent">List Your Business</Button></Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-16">
        {/* Search + filters */}
        <div className="mb-10 space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3A1F0E]/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search businesses, cities, or categories…"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] placeholder-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B]/50 shadow-sm text-base"
            />
          </div>
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
        </div>

        {/* Result count */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[#3A1F0E]/60 font-medium">
              {filtered.length} {filtered.length === 1 ? "business" : "businesses"} found
            </p>
            <div className="flex gap-3">
              <Link href="/for-business-owners"><Button variant="outline" className="rounded-full border-[#3A1F0E]/30 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] text-sm">Submit a Business</Button></Link>
              <Link href="/map"><Button className="rounded-full bg-[#2B1507] text-white text-sm"><MapPin className="w-4 h-4 mr-2"/> Near Me</Button></Link>
            </div>
          </div>
        )}

        {/* Grid */}
        <div id="directory" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <Search className="w-12 h-12 text-[#3A1F0E]/20 mx-auto mb-4" />
              <p className="text-xl text-[#3A1F0E]/50 font-medium">No businesses match your search.</p>
              <button onClick={() => { setSearch(""); setActiveCategory("All"); setActiveOwnership(null); }}
                className="mt-4 text-[#CA922B] font-bold text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            filtered.map(biz => {
              const ownership = ownershipLabel(biz);
              return (
                <Link key={biz.id} href={`/businesses/${biz.id}`}
                  className="block bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Image / placeholder */}
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
                        <span className="bg-[#2B1507]/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
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
                      {biz.category} · {biz.city}{biz.state ? `, ${biz.state}` : ""}
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#3A1F0E] mb-2 group-hover:text-[#CA922B] transition-colors">{biz.name}</h3>
                    {biz.description && (
                      <p className="text-sm text-[#3A1F0E]/60 line-clamp-2 mb-3 font-light leading-relaxed">{biz.description.replace(/^\[DEMO\]\s*/i, "")}</p>
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
            })
          )}
        </div>

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
              <Link href="/for-business-owners"><Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Submit a Business</Button></Link>
              <Link href="/map"><Button variant="outline" className="rounded-full border-[#2B1507] text-[#2B1507] px-8 h-12">Explore the Map</Button></Link>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white p-8 rounded-2xl shadow-lg border border-[#3A1F0E]/5 transform rotate-2">
            <div className="w-16 h-16 bg-[#2B1507] rounded-full mx-auto mb-6 flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-[#CA922B]"/></div>
            <div className="text-center font-serif font-bold text-2xl text-[#3A1F0E] mb-2">Get Listed</div>
            <div className="text-center text-[#3A1F0E]/60 text-sm">Join the network of trusted minority-owned businesses today.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
