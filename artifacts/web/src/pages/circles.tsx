import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Lock, MapPin, Loader2, X, ChevronRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface Circle {
  id: number;
  name: string;
  emoji: string;
  hostUserId: string;
  description: string | null;
  city: string | null;
  memberCount?: number;
  role?: string;
}

export default function Circles() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌟");
  const [newCity, setNewCity] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const loadCircles = useCallback(async () => {
    setLoading(true);
    try {
      const myRes = await fetch(`${BASE}api/circles`, { credentials: "include" });
      if (myRes.ok) { const d = await myRes.json(); setMyCircles(d.circles ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) loadCircles(); else setLoading(false); }, [isAuthenticated, loadCircles]);

  const createCircle = async () => {
    if (!newName.trim()) { toast({ title: "Circle name is required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}api/circles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, city: newCity.trim() || null, description: newDescription.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `${newEmoji} ${newName} created!` });
      setShowCreate(false);
      setNewName(""); setNewEmoji("🌟"); setNewCity(""); setNewDescription("");
      loadCircles();
    } catch {
      toast({ title: "Could not create circle", variant: "destructive" });
    } finally { setCreating(false); }
  };
  const EMOJIS = ["🌟", "🏙️", "🍽️", "🌿", "🎵", "✈️", "💫", "🔥", "🌊", "🎉", "👨‍👩‍👧", "💪"];

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">Circles</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Your private, invite-only crew coordination space.</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] hover:bg-[#b07e24] text-white rounded-full text-sm font-bold transition-colors">
                <Plus className="w-4 h-4" /> New Circle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to see your circles</h2>
            <p className="text-[#3A1F0E]/60 mb-6">Circles let you coordinate with friends, family, and community members.</p>
            <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold hover:bg-[#3d1f08] transition-colors">Sign In</a></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : (
          <>
            {myCircles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🌟</div>
                <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Start your first circle</h2>
                <p className="text-[#3A1F0E]/60 mb-6">A Circle is private and invite-only for up to eight people you choose. Larger discoverable communities belong in Groups.</p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold hover:bg-[#b07e24] transition-colors">
                  Create a Circle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myCircles.map(circle => (
                  <Link key={circle.id} href={`/circles/${circle.id}`}>
                    <a className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-[#E8DDD0]">
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF6EF] flex items-center justify-center text-3xl shrink-0">{circle.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2B1507] truncate">{circle.name}</span>
                          <Lock className="w-3 h-3 text-[#3A1F0E]/40 shrink-0" aria-label="Invite-only Circle" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#3A1F0E]/50 mt-1">
                          <span>Private Circle</span>
                          <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" />Invite-only</span>
                          {circle.city && <><MapPin className="w-3 h-3" /><span>{circle.city}</span></>}
                          {circle.role && <span className="px-2 py-0.5 bg-[#CA922B]/10 text-[#CA922B] rounded-full font-medium capitalize">{circle.role}</span>}
                        </div>
                        {circle.description && <p className="text-sm text-[#3A1F0E]/60 truncate mt-1">{circle.description}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 shrink-0" />
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Circle Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">New Circle</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {/* Emoji picker */}
            <div className="mb-4">
              <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-2 block">Choose an Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewEmoji(e)}
                    className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${newEmoji === e ? "bg-[#CA922B]/20 ring-2 ring-[#CA922B]" : "bg-[#FAF6EF] hover:bg-[#E8DDD0]"}`}>{e}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Circle Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Philly Crew, Fam Trip Planning…"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div className="rounded-xl border border-[#CA922B]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E]/70">
                <span className="font-bold text-[#2B1507]">Private by design.</span> Every Circle is invite-only and limited to eight people. Use Groups for larger discoverable communities.
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">City (optional)</label>
                <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Philadelphia, PA"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Description (optional)</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={2} placeholder="What's this circle for?"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
              </div>
            </div>

            <button onClick={createCircle} disabled={creating || !newName.trim()}
              className="w-full mt-6 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {creating ? "Creating…" : `Create ${newEmoji} ${newName || "Circle"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
