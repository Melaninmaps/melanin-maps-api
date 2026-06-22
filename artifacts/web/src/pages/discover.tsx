import { useState } from "react";
import { useListBusinesses } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, Grid, Map as MapIcon, Compass, Clock, PlusCircle, X, Building2, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE = import.meta.env.BASE_URL;

const VIBES = [
  { emoji: "🍽️", label: "Soul Food", category: "Restaurants & Nightlife" },
  { emoji: "💇🏾", label: "Hair & Beauty", category: "Professional Services" },
  { emoji: "🌙", label: "Date Night", category: "Restaurants & Nightlife" },
  { emoji: "☕", label: "Café Vibes", category: "Restaurants & Nightlife" },
  { emoji: "💼", label: "Minority Biz", category: "Minority-Owned Businesses" },
  { emoji: "🏨", label: "Stay & Explore", category: "Hotels & Stays" },
  { emoji: "🎭", label: "Culture", category: "Cultural Landmarks" },
  { emoji: "🎉", label: "Events & More", category: "Community Events" },
];

function isOpenNow(hours: string | null | undefined): boolean {
  if (!hours) return false;
  const lower = hours.toLowerCase();
  if (lower.includes("24") || lower.includes("always open")) return true;
  if (lower.includes("closed")) return false;
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const current = hour * 60 + minute;
  const timeMatch = hours.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatch) return true;
  const parseTime = (h: string, m: string | undefined, period: string | undefined) => {
    let hr = parseInt(h);
    const mn = m ? parseInt(m) : 0;
    if (period?.toLowerCase() === "pm" && hr !== 12) hr += 12;
    if (period?.toLowerCase() === "am" && hr === 12) hr = 0;
    return hr * 60 + mn;
  };
  const open = parseTime(timeMatch[1], timeMatch[2], timeMatch[3]);
  const close = parseTime(timeMatch[4], timeMatch[5], timeMatch[6]);
  return current >= open && current <= close;
}

// ─── Submit a Business Modal ─────────────────────────────────────────────────

const BUSINESS_CATEGORIES = [
  "Restaurants & Nightlife",
  "Hotels & Stays",
  "Cultural Landmarks",
  "Professional Services",
  "Retail & Shopping",
  "Health & Wellness",
  "Beauty & Grooming",
  "Arts & Entertainment",
  "Education & Childcare",
  "Community Events",
  "Other",
];

function SubmitBusinessModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", category: "", city: "", state: "", website: "", phone: "", description: "", submitterEmail: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) return;
    setStatus("loading");
    try {
      const r = await fetch(`${BASE}api/submit-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      setStatus(r.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-8 pt-8 pb-4 border-b border-[#3A1F0E]/8 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6EF] border border-[#CA922B]/30 mb-3">
                <Building2 className="w-3 h-3 text-[#CA922B]" />
                <span className="text-[10px] font-bold tracking-widest text-[#CA922B] uppercase">Submit a Business</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#3A1F0E]">Know a great spot?</h2>
              <p className="text-sm text-[#3A1F0E]/60 mt-1">Help grow the directory. We review every submission within 48 hours.</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#FAF6EF] flex items-center justify-center hover:bg-[#3A1F0E]/10 transition-colors shrink-0">
              <X className="w-4 h-4 text-[#3A1F0E]/60" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E]">Submission received!</h3>
              <p className="text-[#3A1F0E]/60 max-w-sm">Thank you for helping grow the community. We'll review the listing and add it within 48 hours.</p>
              <Button onClick={onClose} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-11 mt-2">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Business Name <span className="text-red-500">*</span></label>
                <Input required value={form.name} onChange={set("name")} placeholder="e.g. Soul Kitchen ATL" className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B]" />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={set("category")}
                  className="w-full h-12 bg-[#FAF6EF] border-0 rounded-xl px-4 text-sm text-[#3A1F0E] focus:outline-none focus:ring-2 focus:ring-[#CA922B]"
                >
                  <option value="">Select a category...</option>
                  {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">City <span className="text-red-500">*</span></label>
                  <Input required value={form.city} onChange={set("city")} placeholder="Atlanta" className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B]" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">State <span className="text-red-500">*</span></label>
                  <Input required value={form.state} onChange={set("state")} placeholder="GA" maxLength={2} className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B] uppercase" />
                </div>
              </div>

              {/* Website + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Website</label>
                  <Input value={form.website} onChange={set("website")} type="url" placeholder="https://..." className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B]" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Phone</label>
                  <Input value={form.phone} onChange={set("phone")} type="tel" placeholder="(404) 555-0100" className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B]" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Brief Description</label>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Tell us a little about this business..."
                  rows={3}
                  className="w-full bg-[#FAF6EF] border-0 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none"
                />
              </div>

              {/* Submitter email */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60 block mb-1.5">Your Email (optional — for updates)</label>
                <Input value={form.submitterEmail} onChange={set("submitterEmail")} type="email" placeholder="you@example.com" className="bg-[#FAF6EF] border-transparent h-12 rounded-xl focus-visible:ring-[#CA922B]" />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">Something went wrong. Please try again.</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-full flex-1 h-12 border-[#3A1F0E]/15">Cancel</Button>
                <Button type="submit" disabled={status === "loading"} className="rounded-full flex-1 h-12 bg-[#CA922B] hover:bg-[#B38024] text-white font-bold">
                  {status === "loading" ? "Submitting..." : "Submit Business"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Discover() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeVibe, setActiveVibe] = useState<string | null>(null);

  const scrollToResults = () => {
    document.getElementById("discover-results")?.scrollIntoView({ behavior: "smooth" });
  };
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [openNow, setOpenNow] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const effectiveCategory = activeVibe
    ? VIBES.find(v => v.label === activeVibe)?.category ?? undefined
    : activeCategory === "All" ? undefined : activeCategory;

  const { data, isLoading } = useListBusinesses({
    search: query || undefined,
    category: effectiveCategory,
  }, { query: { queryKey: ['businesses', query, activeCategory, activeVibe] } });

  const businesses = openNow
    ? (data?.businesses ?? []).filter(b => isOpenNow((b as any).hours))
    : (data?.businesses ?? []);

  const categories = [
    "All",
    "Minority-Owned Businesses",
    "Restaurants & Nightlife",
    "Hotels & Stays",
    "Cultural Landmarks",
    "Professional Services",
    "Community Events"
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {submitOpen && <SubmitBusinessModal onClose={() => setSubmitOpen(false)} />}

      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <Compass className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Discover Your World</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Explore With Purpose</h1>
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-8 font-light">
            Find the best Black-owned businesses, authentic experiences, and trusted community spots.
          </p>

          <div className="w-full max-w-2xl bg-white rounded-full p-2 flex items-center shadow-lg">
            <Search className="w-5 h-5 text-muted-foreground ml-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for restaurants, services, landmarks..."
              className="border-0 focus-visible:ring-0 shadow-none text-base h-12 bg-transparent rounded-full"
            />
            <Button onClick={scrollToResults} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Search</Button>
          </div>

          {/* Vibe Match chips */}
          <div className="flex gap-2 mt-6 flex-wrap justify-center">
            {VIBES.map(v => (
              <button
                key={v.label}
                onClick={() => setActiveVibe(activeVibe === v.label ? null : v.label)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  activeVibe === v.label
                    ? "bg-[#CA922B] text-white border-[#CA922B] shadow-md"
                    : "bg-white/10 text-[#F5EBD8] border-white/20 hover:bg-white/20 hover:border-[#CA922B]/60 backdrop-blur-sm"
                }`}
              >
                <span>{v.emoji}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Filter Chips */}
        <div id="discover-results" className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveVibe(null); setActiveCategory(cat); }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                !activeVibe && activeCategory === cat
                  ? "bg-[#2B1507] text-white border-[#2B1507]"
                  : "bg-transparent text-[#3A1F0E] border-[#2B1507]/20 hover:border-[#CA922B] hover:text-[#CA922B]"
              }`}
            >
              {cat}
            </button>
          ))}
          {activeVibe && (
            <button
              onClick={() => { setActiveVibe(null); setActiveCategory("All"); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#CA922B]/10 text-[#CA922B] border border-[#CA922B]/30 hover:bg-[#CA922B]/20 transition-all"
            >
              <X size={13} />
              Clear vibe filter
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[#3A1F0E] font-medium">
              {isLoading ? "Loading..." : <span className="font-bold">{businesses.length}</span>} results found
            </div>
            <button
              onClick={() => setSubmitOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA922B] hover:text-[#B38024] transition-colors"
            >
              <PlusCircle size={14} />
              Submit a Business
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenNow(!openNow)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                openNow
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-white text-[#3A1F0E] border-[#2B1507]/20 hover:border-green-500 hover:text-green-700"
              }`}
            >
              <Clock size={14} className={openNow ? "text-white" : "text-green-600"} />
              Open Now
            </button>
            <Select defaultValue="recommended">
              <SelectTrigger className="w-[180px] bg-white border-[#2B1507]/10 rounded-full h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white rounded-full p-1 border border-[#2B1507]/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full ${viewMode === "grid" ? "bg-[#FAF6EF] text-[#2B1507]" : "text-muted-foreground"}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-full ${viewMode === "map" ? "bg-[#FAF6EF] text-[#2B1507]" : "text-muted-foreground"}`}
              >
                <MapIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm h-[400px]">
                <Skeleton className="h-2/3 w-full rounded-none" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : businesses.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-[#2B1507]/5 px-8">
              <Search size={40} className="mx-auto text-[#2B1507]/20 mb-4" />
              <h3 className="text-xl font-bold text-[#3A1F0E] mb-2">
                {openNow ? "No businesses open right now" : "No businesses found"}
              </h3>
              <p className="text-[#3A1F0E]/60 text-sm mb-6 max-w-md mx-auto">
                {openNow
                  ? "Try turning off the 'Open Now' filter to see all businesses."
                  : query || activeVibe || activeCategory !== "All"
                    ? "Try removing a filter or broadening your search."
                    : "We're adding new Black-owned businesses every day. Know one we're missing?"}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {(query || activeVibe || activeCategory !== "All" || openNow) && (
                  <button
                    onClick={() => { setQuery(""); setActiveVibe(null); setActiveCategory("All"); setOpenNow(false); }}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#FAF6EF] border border-[#2B1507]/10 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] transition-all"
                  >
                    Clear all filters
                  </button>
                )}
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#CA922B] text-white hover:bg-[#B38024] transition-all"
                >
                  <PlusCircle size={14} />
                  Submit a Business
                </button>
              </div>
            </div>
          ) : (
            businesses.map((business) => (
              <Link key={business.id} href={`/businesses/${business.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(43,21,7,0.05)] hover:shadow-[0_8px_30px_rgba(43,21,7,0.12)] transition-all duration-300 cursor-pointer h-[420px] flex flex-col border border-[#2B1507]/5">
                  <div className="h-[60%] w-full relative overflow-hidden bg-[#2B1507]/10">
                    {business.imageUrl ? (
                      <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center"
                        style={{ background: `linear-gradient(135deg, #2B1507 0%, #4A2510 50%, #2B1507 100%)` }}>
                        <div className="w-20 h-20 rounded-full bg-[#CA922B]/20 border-2 border-[#CA922B]/40 flex items-center justify-center mb-3">
                          <span className="text-[#CA922B] font-serif font-bold text-4xl leading-none">
                            {business.name?.[0]?.toUpperCase() ?? "M"}
                          </span>
                        </div>
                        <span className="text-[#F5EBD8]/50 text-xs font-bold tracking-widest uppercase px-4 text-center line-clamp-1">{business.category}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/90 via-[#2B1507]/30 to-transparent" />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {(business as any).featured && (
                        <div className="bg-[#CA922B] text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-md w-fit">
                          Featured
                        </div>
                      )}
                      {business.confidenceScore && (
                        <div className="score-badge shadow-md">
                          {business.confidenceScore}/100
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif font-bold text-2xl leading-tight mb-1">{business.name}</h3>
                      <div className="flex items-center gap-1.5 text-[#F5EBD8] text-sm">
                        <span className="text-[#CA922B] font-medium">{business.category}</span>
                        <span>•</span>
                        <MapPin size={12} />
                        <span className="line-clamp-1">{business.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <p className="text-[#3A1F0E]/70 text-sm line-clamp-3 leading-relaxed">
                      {business.description || "Discover this highly-rated business. Visit their profile to learn more about their offerings, location, and community reviews."}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2B1507]/10">
                      {business.averageRating ? (
                        <div className="flex items-center gap-1">
                          <div className="flex text-[#CA922B]">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={14} fill={i < Math.round(business.averageRating!) ? "currentColor" : "none"} strokeWidth={i < Math.round(business.averageRating!) ? 0 : 2} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-[#3A1F0E] ml-1">{business.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-[#3A1F0E]/50">({business.reviewCount || 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#3A1F0E]/50">No reviews yet</span>
                      )}
                      {business.blackOwned && (
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#2B1507]">
                          <ShieldCheck size={14} className="text-[#CA922B]" />
                          Minority Owned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Submit a Business CTA banner */}
        <div className="mt-16 mb-4 rounded-3xl bg-[#2B1507] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #CA922B 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
              <Building2 className="w-3 h-3 text-[#CA922B]" />
              <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Grow the Directory</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Know a business we're missing?</h2>
            <p className="text-[#F5EBD8]/70 text-base md:text-lg max-w-xl">
              Help build the most comprehensive guide to Black-owned businesses. Every submission is reviewed and credited.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Button
              onClick={() => setSubmitOpen(true)}
              className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-14 text-base font-bold shadow-lg"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Submit a Business
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
