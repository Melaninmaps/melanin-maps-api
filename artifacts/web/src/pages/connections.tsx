import { useState, useEffect, useCallback, useRef } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, UserCheck, Clock, Loader2, X, Shield, CalendarCheck, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

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

interface MeetupVerification {
  id: number;
  initiatorId: string;
  partnerId: string;
  connectionId: number | null;
  city: string | null;
  venueName: string | null;
  scheduledFor: string | null;
  note: string | null;
  status: string;
  initiatedAt: string;
  rescheduleNote: string | null;
}

interface TrustedSafetyContact {
  id: string;
  contactName: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

interface MeetupEligibility {
  allowed: boolean;
  code: string;
  message: string;
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
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [meetupEligibility, setMeetupEligibility] = useState<MeetupEligibility | null>(null);
  const [trustedContacts, setTrustedContacts] = useState<TrustedSafetyContact[]>([]);
  const [meetingConnection, setMeetingConnection] = useState<Connection | null>(null);
  const [meetingCity, setMeetingCity] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [trustedContactId, setTrustedContactId] = useState("");
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [meetingSaving, setMeetingSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const [connectionResponse, meetupResponse, eligibilityResponse, contactResponse] = await Promise.all([
        authenticatedFetch(`${BASE}api/connections`),
        authenticatedFetch(`${BASE}api/meetups`),
        authenticatedFetch(`${BASE}api/meetups/eligibility`),
        authenticatedFetch(`${BASE}api/meetups/trusted-contacts`),
      ]);
      if (connectionResponse.ok) { const d = await connectionResponse.json(); setConnections(d.connections ?? []); }
      if (meetupResponse.ok) { const d = await meetupResponse.json(); setMeetups(d.verifications ?? []); }
      if (eligibilityResponse.ok) setMeetupEligibility(await eligibilityResponse.json() as MeetupEligibility);
      if (contactResponse.ok) { const d = await contactResponse.json(); setTrustedContacts(d.contacts ?? []); }
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

  const openMeetupPlanner = (connection: Connection) => {
    setMeetingConnection(connection);
    setMeetingCity("");
    setMeetingVenue("");
    setMeetingTime("");
    setMeetingNote("");
    setTrustedContactId("");
    setSafetyAcknowledged(false);
  };

  const submitMeetup = async () => {
    if (!meetingConnection?.otherId || !meetupEligibility?.allowed || !safetyAcknowledged) return;
    setMeetingSaving(true);
    try {
      const res = await authenticatedFetch(`${BASE}api/meetups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: meetingConnection.otherId,
          connectionId: meetingConnection.id,
          city: meetingCity.trim() || undefined,
          venueName: meetingVenue.trim() || undefined,
          scheduledFor: meetingTime ? new Date(meetingTime).toISOString() : undefined,
          note: meetingNote.trim() || undefined,
          trustedSafetyContactId: trustedContactId || undefined,
          acknowledgedSafetyNotice: true,
        }),
      });
      const data = await res.json() as { verification?: MeetupVerification; error?: string };
      if (!res.ok || !data.verification) throw new Error(data.error ?? "Failed to send request");
      setMeetups((current) => [data.verification!, ...current]);
      setMeetingConnection(null);
      toast({ title: "Meetup Verification request sent" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Could not send meetup request", variant: "destructive" });
    } finally { setMeetingSaving(false); }
  };

  const respondToMeetup = async (id: number, action: "confirm" | "decline" | "request_reschedule") => {
    setActionLoading(`meetup-${id}`);
    try {
      const url = action === "confirm" ? `${BASE}api/meetups/${id}/confirm` : `${BASE}api/meetups/${id}/respond`;
      const res = await authenticatedFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "confirm" ? undefined : JSON.stringify({ action }),
      });
      const data = await res.json() as { verification?: MeetupVerification; error?: string };
      if (!res.ok || !data.verification) throw new Error(data.error ?? "Could not update request");
      setMeetups((current) => current.map((meeting) => meeting.id === id ? data.verification! : meeting));
      toast({ title: action === "confirm" ? "Meetup confirmed" : action === "decline" ? "Meetup declined" : "Reschedule requested" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Could not update meetup request", variant: "destructive" });
    } finally { setActionLoading(null); }
  };

  const cancelMeetup = async (id: number) => {
    if (!confirm("Cancel this meetup request? This removes consent to the plan for both participants.")) return;
    setActionLoading(`meetup-${id}`);
    try {
      const res = await authenticatedFetch(`${BASE}api/meetups/${id}/cancel`, { method: "PATCH" });
      const data = await res.json() as { verification?: MeetupVerification; error?: string };
      if (!res.ok || !data.verification) throw new Error(data.error ?? "Could not cancel meetup request");
      setMeetups((current) => current.map((meeting) => meeting.id === id ? data.verification! : meeting));
      toast({ title: "Meetup request cancelled" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Could not cancel meetup request", variant: "destructive" });
    } finally { setActionLoading(null); }
  };

  const accepted = connections.filter(c => c.status === "accepted");
  const pending = connections.filter(c => c.status === "pending");
  const pendingReceived = pending.filter(c => c.recipientId === currentUserId);
  const pendingSent = pending.filter(c => c.requesterId === currentUserId);
  const pendingMeetups = meetups.filter((meetup) => meetup.partnerId === currentUserId && meetup.status === "pending");

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

        <section className="mb-6 rounded-2xl border border-[#D9C9AE] bg-[#FFF9F0] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#CA922B]/15 p-2"><Shield className="h-5 w-5 text-[#8A5E0A]" /></div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#2B1507]">Meetup Verification</h2>
              <p className="mt-1 text-sm leading-5 text-[#5B4030]">Use this voluntary, consent-first feature with an accepted connection. Choose a public city or venue name only—never share an exact address. Verification is not a guarantee of safety.</p>
              {meetupEligibility && !meetupEligibility.allowed && <p className="mt-2 text-sm font-semibold text-[#9B1C1C]">{meetupEligibility.message}</p>}
            </div>
          </div>

          {pendingMeetups.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B4A2C]">Meetup requests for you</p>
              {pendingMeetups.map((meetup) => (
                <div key={meetup.id} className="rounded-xl border border-[#E8DDD0] bg-white p-4">
                  <p className="text-sm font-semibold text-[#2B1507]">A connected member requested a meetup verification.</p>
                  {(meetup.venueName || meetup.city) && <p className="mt-1 text-xs text-[#5B4030]">Public plan: {[meetup.venueName, meetup.city].filter(Boolean).join(" · ")}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => void respondToMeetup(meetup.id, "confirm")} disabled={actionLoading === `meetup-${meetup.id}`} className="rounded-full bg-[#2B6507] px-3 py-2 text-xs font-bold text-white">Confirm</button>
                    <button onClick={() => void respondToMeetup(meetup.id, "request_reschedule")} disabled={actionLoading === `meetup-${meetup.id}`} className="rounded-full border border-[#CA922B] px-3 py-2 text-xs font-bold text-[#77500A]">Reschedule</button>
                    <button onClick={() => void respondToMeetup(meetup.id, "decline")} disabled={actionLoading === `meetup-${meetup.id}`} className="rounded-full border border-[#C43B2F] px-3 py-2 text-xs font-bold text-[#A52820]">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meetups.filter((meetup) => !["declined", "cancelled"].includes(meetup.status)).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B4A2C]">Your meetup records</p>
              {meetups.filter((meetup) => !["declined", "cancelled"].includes(meetup.status)).map((meetup) => (
                <div key={meetup.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E8DDD0] bg-white p-3">
                  <div className="min-w-40 flex-1"><p className="text-sm font-semibold capitalize text-[#2B1507]">{meetup.status.replace(/_/g, " ")}</p>{(meetup.venueName || meetup.city) && <p className="mt-0.5 text-xs text-[#5B4030]">{[meetup.venueName, meetup.city].filter(Boolean).join(" · ")}</p>}</div>
                  <button onClick={() => void cancelMeetup(meetup.id)} disabled={actionLoading === `meetup-${meetup.id}`} className="rounded-full border border-[#C43B2F] px-3 py-2 text-xs font-bold text-[#A52820] disabled:opacity-50">Cancel</button>
                </div>
              ))}
            </div>
          )}

          {meetingConnection && (
            <div className="mt-5 rounded-xl border border-[#CA922B]/40 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-[#8A5E0A]" /><h3 className="font-bold text-[#2B1507]">Plan a public meetup</h3></div>
                <button onClick={() => setMeetingConnection(null)} className="text-sm font-semibold text-[#5B4030]">Close</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[#3A1F0E]">City or area<input value={meetingCity} onChange={(event) => setMeetingCity(event.target.value)} placeholder="Downtown Atlanta" className="mt-1 w-full rounded-lg border border-[#DCCDBA] px-3 py-2 font-normal" /></label>
                <label className="text-sm font-semibold text-[#3A1F0E]">Public venue name<input value={meetingVenue} onChange={(event) => setMeetingVenue(event.target.value)} placeholder="Coffee shop or public landmark" className="mt-1 w-full rounded-lg border border-[#DCCDBA] px-3 py-2 font-normal" /></label>
                <label className="text-sm font-semibold text-[#3A1F0E]">Meeting time<input type="datetime-local" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} className="mt-1 w-full rounded-lg border border-[#DCCDBA] px-3 py-2 font-normal" /></label>
                <label className="text-sm font-semibold text-[#3A1F0E]">Trusted contact (optional)<select value={trustedContactId} onChange={(event) => setTrustedContactId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#DCCDBA] bg-white px-3 py-2 font-normal"><option value="">No check-in contact</option>{trustedContacts.map((contact) => <option key={contact.id} value={contact.id}>{[contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.contactName || contact.username}</option>)}</select></label>
              </div>
              <label className="mt-3 block text-sm font-semibold text-[#3A1F0E]">Optional note<textarea value={meetingNote} onChange={(event) => setMeetingNote(event.target.value)} maxLength={300} placeholder="Keep it brief; do not add an exact address or sensitive personal details." className="mt-1 min-h-20 w-full rounded-lg border border-[#DCCDBA] px-3 py-2 font-normal" /></label>
              <label className="mt-4 flex items-start gap-2 rounded-lg bg-[#FFF4E1] p-3 text-sm text-[#50351F]"><input type="checkbox" checked={safetyAcknowledged} onChange={(event) => setSafetyAcknowledged(event.target.checked)} className="mt-1" /><span>I understand that this is voluntary, I should meet in a public setting, and Meetup Verification is not a guarantee of safety.</span></label>
              <button onClick={() => void submitMeetup()} disabled={meetingSaving || !safetyAcknowledged || !meetupEligibility?.allowed} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck className="h-4 w-4" />{meetingSaving ? "Sending…" : "Send meetup request"}</button>
            </div>
          )}
        </section>

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
                    <button onClick={() => openMeetupPlanner(conn)} disabled={!meetupEligibility?.allowed || !conn.otherId}
                      className="inline-flex items-center gap-1 rounded-full border border-[#CA922B] px-3 py-2 text-xs font-bold text-[#7A5209] disabled:cursor-not-allowed disabled:opacity-50">
                      <Shield className="h-3 w-3" /> Verify Meetup
                    </button>
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
