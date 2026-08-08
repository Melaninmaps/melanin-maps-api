import { useState, useEffect, useCallback, useRef } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, UserCheck, UserX, Clock, Loader2, X } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Connection {
  id: number;
  status: string;
  requesterId: string;
  recipientId: string;
  otherId: string | null;
  otherFirstName: string | null;
  otherLastName: string | null;
  otherProfileImageUrl: string | null;
}

interface SearchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
}

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const s = `w-${size} h-${size}`;
  if (url) return <img src={url} alt={name} className={`${s} rounded-full object-cover`} />;
  const initials = name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-[#CA922B]", "bg-[#2B6507]", "bg-[#07506B]", "bg-[#6B2507]", "bg-[#6B0765]"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${s} rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {initials || "?"}
    </div>
  );
}

export default function Connections() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);
  const currentUserId = auth?.user?.id;

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/connections`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setConnections(d.connections ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) loadConnections(); else setLoading(false); }, [isAuthenticated, loadConnections]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
        if (res.ok) { const d = await res.json(); setSearchResults(d.users ?? []); }
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const sendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${BASE}api/connections/request`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      });
      if (!res.ok) throw new Error("Failed");
      setRequestedIds(s => new Set([...s, userId]));
      toast({ title: "Connection request sent!" });
    } catch { toast({ title: "Could not send request", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const respond = async (id: number, accept: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${BASE}api/connections/${id}/respond`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: accept ? "accept" : "reject" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: accept ? "Connection accepted!" : "Request declined" });
      loadConnections();
    } catch { toast({ title: "Could not respond", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const removeConnection = async (id: number) => {
    if (!confirm("Remove this connection?")) return;
    setActionLoading(id);
    try {
      await fetch(`${BASE}api/connections/${id}`, { method: "DELETE", credentials: "include" });
      setConnections(cs => cs.filter(c => c.id !== id));
      toast({ title: "Connection removed" });
    } catch { toast({ title: "Could not remove", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const accepted = connections.filter(c => c.status === "accepted");
  const pending = connections.filter(c => c.status === "pending");
  const pendingReceived = pending.filter(c => c.recipientId === currentUserId);
  const pendingSent = pending.filter(c => c.requesterId === currentUserId);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
      <div className="text-center px-4">
        <Users className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
        <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to see your connections</h2>
        <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold hover:bg-[#3d1f08] transition-colors">Sign In</a></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif font-bold text-2xl text-white mb-1">Connections</h1>
          <p className="text-[#F5EBD8]/60 text-sm mb-4">Your community network</p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Find someone by name or username…"
              className="w-full bg-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#CA922B]"
            />
            {searching && <Loader2 className="w-4 h-4 animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/10">
            {[["all", `Connected (${accepted.length})`], ["pending", `Pending (${pending.length})`]] .map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab as "all" | "pending")}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wide mb-3">Search Results</h3>
            {searchResults.length === 0 && !searching ? (
              <p className="text-[#3A1F0E]/40 text-sm">No users found for "{searchQuery}"</p>
            ) : (
              <div className="space-y-2">
                {searchResults.filter(u => u.id !== currentUserId).map(user => {
                  const alreadyConnected = connections.some(c => (c.requesterId === user.id || c.recipientId === user.id));
                  const requested = requestedIds.has(user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0]">
                      <Avatar name={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "U"} url={user.profileImageUrl} size={12} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2B1507]">{user.firstName} {user.lastName}</p>
                        {user.username && <p className="text-xs text-[#3A1F0E]/50">@{user.username}</p>}
                        {user.bio && <p className="text-sm text-[#3A1F0E]/60 truncate">{user.bio}</p>}
                      </div>
                      {alreadyConnected ? (
                        <span className="text-xs text-[#CA922B] font-bold px-3 py-1 bg-[#CA922B]/10 rounded-full">Connected</span>
                      ) : requested ? (
                        <span className="text-xs text-[#3A1F0E]/40 font-bold px-3 py-1 bg-[#FAF6EF] rounded-full">Sent</span>
                      ) : (
                        <button onClick={() => sendRequest(user.id)} disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-4 py-2 bg-[#CA922B] text-white rounded-full text-sm font-bold hover:bg-[#b07e24] transition-colors">
                          {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : activeTab === "all" ? (
          accepted.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
              <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">No connections yet</h2>
              <p className="text-[#3A1F0E]/60">Search for people above to start building your network.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accepted.map(conn => {
                const name = `${conn.otherFirstName ?? ""} ${conn.otherLastName ?? ""}`.trim() || "Community Member";
                return (
                  <div key={conn.id} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0]">
                    <Avatar name={name} url={conn.otherProfileImageUrl} size={12} />
                    <div className="flex-1">
                      <p className="font-bold text-[#2B1507]">{name}</p>
                      <p className="text-xs text-[#CA922B] flex items-center gap-1"><UserCheck className="w-3 h-3" /> Connected</p>
                    </div>
                    <button onClick={() => removeConnection(conn.id)} disabled={actionLoading === conn.id}
                      className="p-2 text-[#3A1F0E]/30 hover:text-red-500 transition-colors">
                      {actionLoading === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {pendingReceived.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wide mb-3">Requests for you ({pendingReceived.length})</h3>
                <div className="space-y-2">
                  {pendingReceived.map(conn => {
                    const name = `${conn.otherFirstName ?? ""} ${conn.otherLastName ?? ""}`.trim() || "Community Member";
                    return (
                      <div key={conn.id} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0]">
                        <Avatar name={name} url={conn.otherProfileImageUrl} size={12} />
                        <div className="flex-1"><p className="font-bold text-[#2B1507]">{name}</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => respond(conn.id, true)} disabled={actionLoading === conn.id}
                            className="px-4 py-2 bg-[#CA922B] text-white rounded-full text-sm font-bold hover:bg-[#b07e24] transition-colors">Accept</button>
                          <button onClick={() => respond(conn.id, false)} disabled={actionLoading === conn.id}
                            className="px-4 py-2 bg-[#FAF6EF] text-[#3A1F0E] rounded-full text-sm font-bold hover:bg-[#E8DDD0] transition-colors">Decline</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {pendingSent.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wide mb-3">Requests you sent ({pendingSent.length})</h3>
                <div className="space-y-2">
                  {pendingSent.map(conn => {
                    const name = `${conn.otherFirstName ?? ""} ${conn.otherLastName ?? ""}`.trim() || "Community Member";
                    return (
                      <div key={conn.id} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0]">
                        <Avatar name={name} url={conn.otherProfileImageUrl} size={12} />
                        <div className="flex-1"><p className="font-bold text-[#2B1507]">{name}</p></div>
                        <span className="text-xs text-[#3A1F0E]/40 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {pending.length === 0 && (
              <div className="text-center py-16">
                <UserCheck className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
                <p className="text-[#3A1F0E]/60">No pending requests.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
