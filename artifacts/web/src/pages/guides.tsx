import { useState, useEffect, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Map, Plus, Heart, Eye, Globe, Lock, Loader2, X, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Guide {
  id: string; title: string; description?: string; city?: string; state?: string;
  coverImageUrl?: string; isPublic?: boolean; followCount?: number; viewCount?: number;
  itemCount?: number; createdAt?: string; authorName?: string; authorId?: string;
  isFollowing?: boolean; tags?: string[];
}

export default function Guides() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);
  const currentUserId = auth?.user?.id;

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "mine">("discover");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPublic, setNewPublic] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "mine" && currentUserId
        ? `${BASE}api/users/${currentUserId}/guides`
        : `${BASE}api/guides`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setGuides(d.guides ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [activeTab, currentUserId]);

  useEffect(() => { if (isAuthenticated) load(); else setLoading(false); }, [isAuthenticated, load]);

  const createGuide = async () => {
    if (!newTitle.trim()) { toast({ title: "Guide title is required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}api/guides`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, city: newCity.trim() || null, isPublic: newPublic }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      toast({ title: `"${newTitle}" guide created!` });
      setShowCreate(false); setNewTitle(""); setNewDesc(""); setNewCity("");
      setActiveTab("mine"); load();
    } catch { toast({ title: "Could not create guide", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const followGuide = async (id: string, isFollowing: boolean) => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`${BASE}api/guides/${id}/follow`, { method, credentials: "include" });
      setGuides(gs => gs.map(g => g.id === id ? { ...g, isFollowing: !isFollowing, followCount: (g.followCount ?? 0) + (isFollowing ? -1 : 1) } : g));
    } catch { toast({ title: "Could not update", variant: "destructive" }); }
  };

  const GUIDE_COLORS = ["from-[#2B1507]", "from-[#07506B]", "from-[#2B6507]", "from-[#6B2507]", "from-[#6B0765]"];

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">City Guides</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Community-curated guides for every city</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] hover:bg-[#b07e24] text-white rounded-full text-sm font-bold">
                <Plus className="w-4 h-4" /> Create Guide
              </button>
            )}
          </div>
          <div className="flex gap-0 border-b border-white/10 mt-4">
            {(["discover", "mine"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {tab === "discover" ? "Discover" : "My Guides"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to explore city guides</h2>
            <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold">Sign In</a></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">
              {activeTab === "mine" ? "Create your first guide" : "No guides yet"}
            </h2>
            <p className="text-[#3A1F0E]/60 mb-6">
              {activeTab === "mine" ? "Share your local knowledge — the best spots, hidden gems, and must-dos." : "Be the first to create a community guide."}
            </p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold">Create a Guide</button>
          </div>
        ) : (
          <div className="space-y-4">
            {guides.map((guide, i) => (
              <div key={guide.id} className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden hover:shadow-md transition-all">
                {/* Cover */}
                {guide.coverImageUrl ? (
                  <img src={guide.coverImageUrl} alt={guide.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className={`w-full h-32 bg-gradient-to-br ${GUIDE_COLORS[i % GUIDE_COLORS.length]} to-transparent flex items-end p-4`}>
                    <span className="text-white/30 font-serif text-4xl font-bold">{guide.title[0]}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#2B1507] truncate">{guide.title}</h3>
                        {guide.isPublic === false && <Lock className="w-3 h-3 text-[#3A1F0E]/30 shrink-0" />}
                      </div>
                      {guide.city && <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{guide.city}{guide.state ? `, ${guide.state}` : ""}</p>}
                      {guide.description && <p className="text-sm text-[#3A1F0E]/60 mt-1 line-clamp-2">{guide.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-[#3A1F0E]/40">
                      {guide.itemCount !== undefined && <span>{guide.itemCount} stops</span>}
                      {guide.viewCount !== undefined && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {guide.viewCount}</span>}
                      {guide.followCount !== undefined && guide.followCount > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {guide.followCount}</span>}
                      {guide.authorName && guide.authorId !== currentUserId && <span>by {guide.authorName}</span>}
                    </div>
                    <div className="flex gap-2">
                      {guide.authorId !== currentUserId && (
                        <button onClick={() => followGuide(guide.id, !!guide.isFollowing)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${guide.isFollowing ? "bg-[#CA922B]/10 text-[#CA922B]" : "bg-[#CA922B] text-white hover:bg-[#b07e24]"}`}>
                          {guide.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                      <Link href={`/guides/${guide.id}`}>
                        <a className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#2B1507] text-white hover:bg-[#3d1f08] transition-colors flex items-center gap-1">
                          View <ChevronRight className="w-3 h-3" />
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">Create a Guide</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Guide Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Best Spots in West Philly, DC Date Night Guide…"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Description (optional)</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="What will people find in this guide?"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">City (optional)</label>
                <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Philadelphia, PA"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div className="flex gap-3">
                {[true, false].map(pub => (
                  <button key={String(pub)} onClick={() => setNewPublic(pub)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${newPublic === pub ? "border-[#CA922B] text-[#CA922B] bg-[#CA922B]/10" : "border-[#E8DDD0] text-[#3A1F0E]/60"}`}>
                    {pub ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {pub ? "Public" : "Private"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createGuide} disabled={creating || !newTitle.trim()}
              className="w-full mt-6 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null} {creating ? "Creating…" : "Create Guide"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
