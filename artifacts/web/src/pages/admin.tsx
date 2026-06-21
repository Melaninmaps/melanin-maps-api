import { useState, useEffect, useCallback, useRef } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Check, X, Clock, Users, Mail, MapPin, Briefcase, Download, RefreshCw } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type WaitlistEntry = {
  id: string;
  firstName: string | null;
  email: string;
  city: string | null;
  state: string | null;
  isBusinessOwner: boolean;
  status: string;
  referralCode: string | null;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
};

type AdminUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  approved: boolean;
  role: "user" | "tester" | "admin";
  createdAt: string;
};

type Tab = "waitlist" | "users";

function statusBadge(status: string) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check className="w-3 h-3" /> Approved</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold"><X className="w-3 h-3" /> Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>;
}

export default function Admin() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [tab, setTab] = useState<Tab>("waitlist");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [requireApproval, setRequireApproval] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${BASE}api/admin/check`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setIsAdmin(data.isAdmin ?? false);
        setRequireApproval(data.requireApproval ?? false);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const loadWaitlist = useCallback(() => {
    return fetch(`${BASE}api/admin/waitlist`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setWaitlist(data.entries ?? []); setLastRefreshed(new Date()); });
  }, []);

  const loadUsers = useCallback(() => {
    return fetch(`${BASE}api/admin/users`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setUsers(data.users ?? []); setLastRefreshed(new Date()); });
  }, []);

  const refreshAll = useCallback(() => {
    return Promise.all([loadWaitlist(), loadUsers()]);
  }, [loadWaitlist, loadUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    refreshAll().finally(() => setLoading(false));

    refreshTimer.current = setInterval(() => { refreshAll(); }, 2 * 60 * 1000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [isAdmin, refreshAll]);

  const updateWaitlist = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`${BASE}api/admin/waitlist/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadWaitlist();
    setUpdating(null);
  };

  const updateUser = async (id: string, approved: boolean) => {
    setUpdating(id);
    await fetch(`${BASE}api/admin/users/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    await loadUsers();
    setUpdating(null);
  };

  const updateUserRole = async (id: string, role: "user" | "tester") => {
    setUpdating(id + "-role");
    await fetch(`${BASE}api/admin/users/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await loadUsers();
    setUpdating(null);
  };

  const bulkUpdate = async (status: string) => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    await fetch(`${BASE}api/admin/waitlist/bulk`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    });
    setSelected(new Set());
    await loadWaitlist();
    setBulkUpdating(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === waitlist.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(waitlist.map(e => e.id)));
    }
  };

  const exportCsv = () => {
    window.open(`${BASE}api/admin/waitlist/export`, "_blank");
  };

  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!auth?.user) return <Redirect to="/login" />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">Access Denied</h1>
          <p className="text-[#3A1F0E]/60">You don't have admin access to this page.</p>
        </div>
      </div>
    );
  }

  const pendingWaitlist = waitlist.filter(e => e.status === "pending").length;
  const pendingUsers = users.filter(u => !u.approved).length;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Admin Dashboard</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Mapping with Melanin™ — Internal</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#CA922B]">{waitlist.length}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Total Waitlist</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{pendingWaitlist}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#CA922B]">{users.length}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Registered Users</div>
              </div>
            </div>
          </div>

          {!requireApproval && (
            <div className="mt-4 bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-amber-200">
              ⚠️ <strong>Approval gating is OFF.</strong> All users can access the platform regardless of approval status. Set <code className="bg-black/20 px-1 rounded">REQUIRE_APPROVAL=true</code> in environment secrets to enable gating.
            </div>
          )}
          {requireApproval && (
            <div className="mt-4 bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-sm text-green-200">
              ✅ <strong>Approval gating is ON.</strong> Unapproved users see the pending-approval screen.
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#3A1F0E]/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex gap-0 items-center justify-between">
          <div className="flex">
            <button
              onClick={() => setTab("waitlist")}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === "waitlist" ? "border-[#CA922B] text-[#3A1F0E]" : "border-transparent text-[#3A1F0E]/50 hover:text-[#3A1F0E]"}`}
            >
              <Mail className="w-4 h-4" />
              Waitlist
              {pendingWaitlist > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingWaitlist}</span>}
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === "users" ? "border-[#CA922B] text-[#3A1F0E]" : "border-transparent text-[#3A1F0E]/50 hover:text-[#3A1F0E]"}`}
            >
              <Users className="w-4 h-4" />
              Registered Users
              {pendingUsers > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers}</span>}
            </button>
          </div>
          <div className="flex items-center gap-3 pr-2">
            <span className="text-[#3A1F0E]/30 text-xs">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => refreshAll()}
              className="flex items-center gap-1.5 text-xs text-[#3A1F0E]/50 hover:text-[#3A1F0E] transition-colors py-1 px-2 rounded-lg hover:bg-[#FAF6EF]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {tab === "waitlist" && (
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors py-1 px-3 rounded-lg border border-[#CA922B]/30 hover:bg-[#CA922B]/5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {tab === "waitlist" && selected.size > 0 && (
        <div className="bg-[#2B1507] text-white px-6 py-3 flex items-center gap-4">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-4">
            <span className="text-sm font-bold text-[#CA922B]">{selected.size} selected</span>
            <Button
              size="sm"
              onClick={() => bulkUpdate("approved")}
              disabled={bulkUpdating}
              className="h-7 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
            >
              <Check className="w-3 h-3 mr-1" /> Approve All
            </Button>
            <Button
              size="sm"
              onClick={() => bulkUpdate("rejected")}
              disabled={bulkUpdating}
              className="h-7 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              <X className="w-3 h-3 mr-1" /> Reject All
            </Button>
            <Button
              size="sm"
              onClick={() => bulkUpdate("pending")}
              disabled={bulkUpdating}
              variant="outline"
              className="h-7 px-4 rounded-full border-white/30 text-white hover:bg-white/10 text-xs"
            >
              Reset All
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[#F5EBD8]/50 hover:text-white text-xs"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "waitlist" ? (
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Waitlist Signups ({waitlist.length})</h2>
            {waitlist.length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No waitlist signups yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selected.size === waitlist.length && waitlist.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded accent-[#CA922B]"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Signed Up</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((entry, i) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${selected.has(entry.id) ? "bg-[#CA922B]/5" : i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="rounded accent-[#CA922B]"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                          {entry.firstName ? entry.firstName : <span className="text-[#3A1F0E]/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/80">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#CA922B] shrink-0" />
                            {entry.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70">
                          {entry.city || entry.state ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#CA922B]" />
                              {[entry.city, entry.state].filter(Boolean).join(", ")}
                            </div>
                          ) : <span className="text-[#3A1F0E]/30">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {entry.isBusinessOwner ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#CA922B] font-bold"><Briefcase className="w-3 h-3" /> Business Owner</span>
                          ) : (
                            <span className="text-xs text-[#3A1F0E]/40">Community</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{statusBadge(entry.status)}</td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {entry.status !== "approved" && (
                              <Button size="sm" onClick={() => updateWaitlist(entry.id, "approved")} disabled={updating === entry.id}
                                className="h-7 px-3 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs">
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                            )}
                            {entry.status !== "rejected" && (
                              <Button size="sm" variant="outline" onClick={() => updateWaitlist(entry.id, "rejected")} disabled={updating === entry.id}
                                className="h-7 px-3 rounded-full border-red-300 text-red-600 hover:bg-red-50 text-xs">
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            )}
                            {entry.status !== "pending" && (
                              <Button size="sm" variant="outline" onClick={() => updateWaitlist(entry.id, "pending")} disabled={updating === entry.id}
                                className="h-7 px-3 rounded-full text-xs">
                                Reset
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Registered Users ({users.length})</h2>
            {users.length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No registered users yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">User</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Access</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={user.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#CA922B]/20 flex items-center justify-center text-[#CA922B] font-bold text-sm shrink-0 overflow-hidden">
                              {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()
                              )}
                            </div>
                            <span className="font-medium text-[#3A1F0E]">
                              {user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : <span className="text-[#3A1F0E]/40">No name</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70">{user.email ?? <span className="text-[#3A1F0E]/30">—</span>}</td>
                        <td className="px-4 py-3">
                          {user.approved
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check className="w-3 h-3" /> Approved</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() => updateUserRole(user.id, user.role === "tester" ? "user" : "tester")}
                            disabled={updating === user.id + "-role"}
                            className={`h-7 px-3 rounded-full text-xs ${user.role === "tester" ? "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200" : "bg-white text-[#3A1F0E]/50 border border-[#3A1F0E]/15 hover:bg-[#FAF6EF]"}`}
                            variant="outline"
                          >
                            {user.role === "tester" ? "Tester ✓" : "Tester"}
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs">
                          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() => updateUser(user.id, !user.approved)}
                            disabled={updating === user.id}
                            className={`h-7 px-3 rounded-full text-xs ${user.approved ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-green-600 hover:bg-green-700 text-white"}`}
                            variant="outline"
                          >
                            {user.approved ? (<><X className="w-3 h-3 mr-1" /> Revoke</>) : (<><Check className="w-3 h-3 mr-1" /> Approve</>)}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
