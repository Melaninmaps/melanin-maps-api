import { useState, useEffect, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Plus, Search, MapPin, DollarSign, Loader2, X, Tag, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Listing {
  id: string; title: string; description: string; price: string | null;
  category: string; condition?: string; city?: string; state?: string;
  imageUrl?: string; userId?: string; createdAt?: string; isFree?: boolean;
  contactMethod?: string; contactValue?: string; isSaved?: boolean;
  sellerName?: string;
}

const CATEGORIES = ["All", "Furniture", "Clothing", "Electronics", "Books", "Food & Baked Goods", "Art & Crafts", "Services", "Housing", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function Marketplace() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "mine" | "post">("browse");
  const [category, setCategory] = useState("All");
  const [newType, setNewType] = useState<"product" | "service" | "skill_trade" | "digital" | "free">("product");
  const [search, setSearch] = useState("");
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);

  // Post form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [newPrice, setNewPrice] = useState("");
  const [newIsFree, setNewIsFree] = useState(false);
  const [newCondition, setNewCondition] = useState("Good");
  const [newCity, setNewCity] = useState("");
  const [newContact, setNewContact] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      if (activeTab === "mine") params.set("mine", "true");
      const endpoint = activeTab === "mine" ? `${BASE}api/marketplace/my/listings` : `${BASE}api/marketplace?${params}`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setListings(d.listings ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [category, search, activeTab]);

  useEffect(() => { load(); }, [load]);

  const postListing = async () => {
    if (!newTitle.trim() || !newDesc.trim()) { toast({ title: "Title and description are required", variant: "destructive" }); return; }
    setPosting(true);
    try {
      const res = await fetch(`${BASE}api/marketplace`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          title: newTitle.trim(), description: newDesc.trim(), category: newCategory,
          price: newIsFree ? null : (newPrice || null), isFree: newIsFree,
          condition: newCondition, city: newCity.trim() || null,
          contactMethod: "message", contactValue: newContact.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Your listing is live!" });
      setShowPost(false);
      setNewTitle(""); setNewDesc(""); setNewPrice(""); setNewCity(""); setNewContact("");
      setActiveTab("mine"); load();
    } catch { toast({ title: "Could not post listing", variant: "destructive" }); }
    finally { setPosting(false); }
  };

  const saveListing = async (id: string, isSaved: boolean) => {
    try {
      const method = isSaved ? "DELETE" : "POST";
      await fetch(`${BASE}api/marketplace/${id}/save`, { method, credentials: "include" });
      setListings(ls => ls.map(l => l.id === id ? { ...l, isSaved: !isSaved } : l));
    } catch { toast({ title: "Could not update", variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">Community Marketplace</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Buy, sell, and exchange within the community</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowPost(true)} className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] hover:bg-[#b07e24] text-white rounded-full text-sm font-bold">
                <Plus className="w-4 h-4" /> Post
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-4 mb-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…"
              className="w-full bg-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#CA922B]" />
          </div>

          <div className="flex gap-0 border-b border-white/10 mt-3">
            {(["browse", "mine"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {tab === "browse" ? "Browse" : "My Listings"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Category filter */}
        {activeTab === "browse" && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${category === cat ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E] border border-[#E8DDD0] hover:bg-[#FAF6EF]"}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to browse the marketplace</h2>
            <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold">Sign In</a></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">
              {activeTab === "mine" ? "You haven't posted anything yet" : "No listings found"}
            </h2>
            <p className="text-[#3A1F0E]/60 mb-6">{activeTab === "mine" ? "Share something with the community." : "Try a different category or search term."}</p>
            {activeTab === "mine" && <button onClick={() => setShowPost(true)} className="px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold">Post a Listing</button>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => setSelected(listing)}>
                {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="w-full h-40 object-cover" />}
                {!listing.imageUrl && (
                  <div className="w-full h-32 bg-[#FAF6EF] flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-[#CA922B]/30" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#2B1507] line-clamp-1">{listing.title}</h3>
                    <span className={`text-sm font-bold whitespace-nowrap ${listing.isFree ? "text-green-600" : "text-[#CA922B]"}`}>
                      {listing.isFree ? "Free" : listing.price ? `$${listing.price}` : "Make Offer"}
                    </span>
                  </div>
                  <p className="text-sm text-[#3A1F0E]/60 line-clamp-2 mt-1">{listing.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-[#3A1F0E]/40">
                      <span className="px-2 py-0.5 bg-[#FAF6EF] rounded-full">{listing.category}</span>
                      {listing.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.city}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-xl text-[#2B1507] line-clamp-1">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[#FAF6EF] rounded-full shrink-0"><X className="w-5 h-5" /></button>
            </div>
            {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="w-full h-52 object-cover rounded-xl mb-4" />}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-2xl font-bold ${selected.isFree ? "text-green-600" : "text-[#CA922B]"}`}>
                {selected.isFree ? "Free" : selected.price ? `$${selected.price}` : "Make Offer"}
              </span>
              {selected.condition && <span className="text-sm px-3 py-1 bg-[#FAF6EF] text-[#3A1F0E]/60 rounded-full">{selected.condition}</span>}
            </div>
            <p className="text-[#3A1F0E]/70 mb-4">{selected.description}</p>
            <div className="flex flex-wrap gap-2 text-sm text-[#3A1F0E]/50 mb-6">
              <span className="flex items-center gap-1 px-3 py-1 bg-[#FAF6EF] rounded-full"><Tag className="w-3 h-3" />{selected.category}</span>
              {selected.city && <span className="flex items-center gap-1 px-3 py-1 bg-[#FAF6EF] rounded-full"><MapPin className="w-3 h-3" />{selected.city}{selected.state ? `, ${selected.state}` : ""}</span>}
            </div>
            {selected.contactValue && (
              <a href={selected.contactMethod === "email" ? `mailto:${selected.contactValue}` : `tel:${selected.contactValue}`}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] transition-colors">
                Contact Seller
              </a>
            )}
          </div>
        </div>
      )}

      {/* Post Listing Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && setShowPost(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">Post a Listing</h2>
              <button onClick={() => setShowPost(false)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What are you selling or giving away?"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Description *</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Describe the item, condition, and any details…"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Listing Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["product","Item for Sale"],["service","Service"],["skill_trade","Skill/Trade"],["digital","Digital"],["free","Free"]] as [typeof newType, string][]).map(([val, lbl]) => (
                    <button key={val} type="button"
                      onClick={() => { setNewType(val); if (val === "free") setNewIsFree(true); else setNewIsFree(false); }}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition-colors ${newType === val ? "bg-[#2B1507] text-white border-[#2B1507]" : "border-[#E8DDD0] text-[#3A1F0E]/60 hover:border-[#CA922B]/50"}`}
                    >{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]">
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Condition</label>
                  <select value={newCondition} onChange={e => setNewCondition(e.target.value)}
                    className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide">Price</label>
                  <label className="flex items-center gap-2 text-sm text-[#3A1F0E]/60 cursor-pointer">
                    <input type="checkbox" checked={newIsFree} onChange={e => setNewIsFree(e.target.checked)} className="rounded" />
                    This is free
                  </label>
                </div>
                {!newIsFree && (
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#3A1F0E]/40" />
                    <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00"
                      className="w-full border border-[#E8DDD0] rounded-xl pl-10 pr-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">City (optional)</label>
                <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Philadelphia, PA"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Contact Info (optional)</label>
                <input value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="Email or phone number"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
            </div>
            <button onClick={postListing} disabled={posting || !newTitle.trim() || !newDesc.trim()}
              className="w-full mt-6 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : null} {posting ? "Posting…" : "Post Listing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
