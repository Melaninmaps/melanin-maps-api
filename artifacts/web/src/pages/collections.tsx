import { useState, useEffect, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Plus, Globe, Lock, Heart, Loader2, X, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Collection {
  id: string; title: string; description?: string; emoji?: string;
  visibility: string; itemCount?: number; followCount?: number;
  createdByUserId?: string; isFollowing?: boolean;
}

const EMOJIS = ["📍", "🍽️", "🏛️", "🌿", "🎵", "✈️", "🛍️", "☕", "🎨", "🏋️", "🌊", "💫"];

export default function Collections() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);
  const currentUserId = auth?.user?.id;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "discover">("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("📍");
  const [newVisibility, setNewVisibility] = useState<"public" | "private">("private");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab === "mine" && currentUserId ? `?userId=${currentUserId}` : "";
      const res = await fetch(`${BASE}api/collections${params}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setCollections(d.collections ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [activeTab, currentUserId]);

  useEffect(() => { if (isAuthenticated) load(); else setLoading(false); }, [isAuthenticated, load]);

  const createCollection = async () => {
    if (!newTitle.trim()) { toast({ title: "Collection name is required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}api/collections`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, emoji: newEmoji, visibility: newVisibility }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `${newEmoji} ${newTitle} created!` });
      setShowCreate(false); setNewTitle(""); setNewDesc("");
      load();
    } catch { toast({ title: "Could not create collection", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const followCollection = async (id: string, isFollowing: boolean) => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`${BASE}api/collections/${id}/follow`, { method, credentials: "include" });
      setCollections(cs => cs.map(c => c.id === id ? { ...c, isFollowing: !isFollowing, followCount: (c.followCount ?? 0) + (isFollowing ? -1 : 1) } : c));
    } catch { toast({ title: "Could not update", variant: "destructive" }); }
  };

  const isOwner = (c: Collection) => c.createdByUserId === currentUserId;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">Collections</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Your curated spots, saved and shared</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] hover:bg-[#b07e24] text-white rounded-full text-sm font-bold">
                <Plus className="w-4 h-4" /> New
              </button>
            )}
          </div>
          <div className="flex gap-0 border-b border-white/10 mt-4">
            {(["mine", "discover"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {tab === "mine" ? "My Collections" : "Discover"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to see your collections</h2>
            <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold">Sign In</a></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">
              {activeTab === "mine" ? "Start your first collection" : "No public collections yet"}
            </h2>
            {activeTab === "mine" && (
              <>
                <p className="text-[#3A1F0E]/60 mb-6">Group your favorite spots into themed collections — Philly Eats, Date Night Spots, and more.</p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold">Create a Collection</button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map(col => (
              <div key={col.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0] hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF6EF] flex items-center justify-center text-2xl shrink-0">{col.emoji ?? "📍"}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#2B1507]">{col.title}</span>
                        {col.visibility === "private" ? <Lock className="w-3 h-3 text-[#3A1F0E]/30" /> : <Globe className="w-3 h-3 text-[#3A1F0E]/30" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#3A1F0E]/50 mt-0.5">
                        {col.itemCount !== undefined && <span>{col.itemCount} spots</span>}
                        {col.followCount !== undefined && col.followCount > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {col.followCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {col.description && <p className="text-sm text-[#3A1F0E]/60 mt-2 line-clamp-2">{col.description}</p>}
                <div className="flex gap-2 mt-3">
                  <Link href={`/collections/${col.id}`}>
                    <a className="flex-1 py-2 text-center text-sm font-bold text-[#2B1507] bg-[#FAF6EF] rounded-xl hover:bg-[#E8DDD0] transition-colors">View</a>
                  </Link>
                  {!isOwner(col) && (
                    <button onClick={() => followCollection(col.id, !!col.isFollowing)}
                      className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${col.isFollowing ? "bg-[#CA922B]/10 text-[#CA922B] hover:bg-[#CA922B]/20" : "bg-[#CA922B] text-white hover:bg-[#b07e24]"}`}>
                      {col.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
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
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">New Collection</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-2 block">Pick an Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewEmoji(e)}
                      className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${newEmoji === e ? "bg-[#CA922B]/20 ring-2 ring-[#CA922B]" : "bg-[#FAF6EF] hover:bg-[#E8DDD0]"}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Collection Name *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Philly Eats, Date Night Spots…"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Description (optional)</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="What's in this collection?"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
              </div>
              <div className="flex gap-3">
                {(["private", "public"] as const).map(v => (
                  <button key={v} onClick={() => setNewVisibility(v)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${newVisibility === v ? "border-[#CA922B] text-[#CA922B] bg-[#CA922B]/10" : "border-[#E8DDD0] text-[#3A1F0E]/60"}`}>
                    {v === "private" ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createCollection} disabled={creating || !newTitle.trim()}
              className="w-full mt-6 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null} {creating ? "Creating…" : `Create ${newEmoji} ${newTitle || "Collection"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
