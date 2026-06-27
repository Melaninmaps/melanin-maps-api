import { useState, useEffect, useCallback, useRef } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Check, X, Clock, Users, Mail, MapPin, Briefcase, Download, RefreshCw, Send, Store, ExternalLink, Trash2, Star, TrendingUp, Award, GitBranch, BarChart2, Flag, AlertTriangle, Trophy, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const BASE = import.meta.env.BASE_URL;

type WaitlistEntry = {
  id: string;
  firstName: string | null;
  email: string;
  firstName: string | null;
  city: string | null;
  state: string | null;
  isBusinessOwner: boolean;
  status: string;
  referralCode: string | null;
  referredBy: string | null;
  welcomeEmailSent: boolean;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  position: number | null;
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

type AdminBusiness = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  verified: boolean;
  blackOwned: boolean;
  status: string;
  phone: string | null;
  website: string | null;
  createdAt: string;
  outreach: {
    businessId: string;
    status: string;
    socialHandle: string;
    createdAt: string;
  } | null;
};

type CategoryWaitlistEntry = {
  id: number;
  parentCategory: string;
  subcategory: string | null;
  businessName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
};

type ChallengeApplicationRow = {
  id: number;
  businessId: string;
  businessName: string;
  businessCity: string | null;
  businessCategory: string | null;
  challengeId: string;
  challengeName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  message: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  appliedAt: string;
};

type AdminReview = {
  id: string;
  businessId: string;
  authorName: string | null;
  rating: number;
  text: string | null;
  createdAt: string;
};

type ContentReportRow = {
  id: string;
  reporterId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type MemberRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  memberType: string | null;
  trialEndsAt: string | null;
  foundingMemberNumber: number | null;
  referralCode: string | null;
  referralCount: number | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
};

type LeaderboardEntry = {
  rank: number;
  referralCode: string;
  email: string;
  name: string | null;
  referralCount: number;
};

type MetricsData = {
  total: number;
  approved: number;
  today: number;
  week: number;
  cities: { city: string | null; count: number }[];
  daily: { date: string; count: number }[];
};

type Tab = "waitlist" | "leaderboard" | "metrics" | "users" | "businesses" | "members" | "reviews" | "reports" | "challenges" | "category-waitlist";

function statusBadge(status: string) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check className="w-3 h-3" /> Approved</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold"><X className="w-3 h-3" /> Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>;
}

function OutreachCell({ business, onSent }: { business: AdminBusiness; onSent: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async () => {
    if (!email) return;
    setSending(true);
    setResult(null);
    try {
      const r = await fetch(`${BASE}api/admin/businesses/${business.id}/outreach`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (r.ok) {
        setResult({ ok: true, msg: `Sent to ${data.to}` });
        setEmail("");
        setTimeout(() => { setOpen(false); setResult(null); onSent(); }, 2500);
      } else {
        setResult({ ok: false, msg: data.error ?? "Failed" });
      }
    } catch {
      setResult({ ok: false, msg: "Network error" });
    } finally {
      setSending(false);
    }
  };

  if (business.outreach) {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
          <Mail className="w-3 h-3" /> Contacted
        </span>
        <span className="text-[10px] text-[#3A1F0E]/40">{business.outreach.socialHandle}</span>
        <button
          onClick={() => setOpen(!open)}
          className="text-[10px] text-[#CA922B] hover:underline text-left"
        >
          Send again
        </button>
        {open && (
          <div className="mt-1 flex flex-col gap-1.5">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Business email"
              className="w-44 border border-[#3A1F0E]/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#CA922B]"
            />
            <button
              onClick={send}
              disabled={sending || !email}
              className="flex items-center gap-1 bg-[#CA922B] text-white rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-50 hover:bg-[#B38024] transition-colors w-fit"
            >
              <Send className="w-3 h-3" /> {sending ? "Sending…" : "Send"}
            </button>
            {result && <span className={`text-xs ${result.ok ? "text-green-600" : "text-red-500"}`}>{result.msg}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-[#2B1507] text-[#F5EBD8] hover:bg-[#3A1F0E] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors w-fit"
        >
          <Send className="w-3 h-3" /> Send Outreach
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Business email address"
            autoFocus
            className="w-48 border border-[#3A1F0E]/20 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#CA922B]"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={send}
              disabled={sending || !email}
              className="flex items-center gap-1 bg-[#CA922B] text-white rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-[#B38024] transition-colors"
            >
              <Send className="w-3 h-3" /> {sending ? "Sending…" : "Send"}
            </button>
            <button
              onClick={() => { setOpen(false); setEmail(""); setResult(null); }}
              className="text-xs text-[#3A1F0E]/40 hover:text-[#3A1F0E] px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
          {result && <span className={`text-xs ${result.ok ? "text-green-600" : "text-red-500"}`}>{result.msg}</span>}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6 flex items-start gap-4">
      <div className="p-3 rounded-xl bg-[#CA922B]/10 text-[#CA922B] shrink-0">{icon}</div>
      <div>
        <div className="text-3xl font-bold text-[#3A1F0E]">{value}</div>
        <div className="text-sm font-semibold text-[#3A1F0E]/70 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-[#3A1F0E]/40 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [tab, setTab] = useState<Tab>("waitlist");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [requireApproval, setRequireApproval] = useState(false);

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistTotal, setWaitlistTotal] = useState(0);
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [waitlistTotalPages, setWaitlistTotalPages] = useState(1);
  const [pendingWaitlistCount, setPendingWaitlistCount] = useState(0);
  const PAGE_SIZE = 50;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<ContentReportRow[]>([]);
  const [challengeApps, setChallengeApps] = useState<ChallengeApplicationRow[]>([]);
  const [categoryWaitlistEntries, setCategoryWaitlistEntries] = useState<CategoryWaitlistEntry[]>([]);
  const [categoryWaitlistByCategory, setCategoryWaitlistByCategory] = useState<Record<string, number>>({});
  const [memberSearch, setMemberSearch] = useState("");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberEdit, setMemberEdit] = useState<{ memberType?: string; foundingMemberNumber?: string; trialEndsAt?: string }>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [nudgeSending, setNudgeSending] = useState(false);
  const [nudgeResult, setNudgeResult] = useState<string | null>(null);
  const [welcomeEmails, setWelcomeEmails] = useState("");
  const [welcomeSending, setWelcomeSending] = useState(false);
  const [welcomeResult, setWelcomeResult] = useState<string | null>(null);
  const [bizSearch, setBizSearch] = useState("");
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BASE}api/admin/check`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false);
        setRequireApproval(data.requireApproval ?? false);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const loadWaitlist = useCallback((page = 1, status = "all") => {
    setWaitlistLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (status !== "all") params.set("status", status);
    return fetch(`${BASE}api/admin/waitlist?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setWaitlist(data.entries ?? []);
        setWaitlistTotal(data.total ?? 0);
        setWaitlistPage(data.page ?? 1);
        setWaitlistTotalPages(data.totalPages ?? 1);
        setPendingWaitlistCount(data.pendingCount ?? 0);
      })
      .finally(() => setWaitlistLoading(false));
  }, [PAGE_SIZE]);

  const loadUsers = useCallback(() => {
    return fetch(`${BASE}api/admin/users`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLastRefreshed(new Date());
      });
  }, []);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardLoading(true);
    return fetch(`${BASE}api/admin/leaderboard`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard ?? []))
      .finally(() => setLeaderboardLoading(false));
  }, []);

  const loadMetrics = useCallback(() => {
    setMetricsLoading(true);
    return fetch(`${BASE}api/admin/metrics`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMetrics(data))
      .finally(() => setMetricsLoading(false));
  }, []);

  const loadBusinesses = useCallback(() => {
    return fetch(`${BASE}api/admin/businesses`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setBusinesses(data.businesses ?? []); setLastRefreshed(new Date()); });
  }, []);

  const loadMembers = useCallback(() => {
    return fetch(`${BASE}api/admin/members`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setMembers(data.members ?? []); setLastRefreshed(new Date()); });
  }, []);

  const loadReviews = useCallback(() => {
    return fetch(`${BASE}api/admin/reviews`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setReviews(data.reviews ?? []); setLastRefreshed(new Date()); });
  }, []);

  const loadReports = useCallback(() => {
    return fetch(`${BASE}api/admin/content-reports`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setReports(data.reports ?? []); setLastRefreshed(new Date()); })
      .catch(() => {});
  }, []);

  const loadChallengeApps = useCallback(() => {
    return fetch(`${BASE}api/admin/challenge-applications`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setChallengeApps(data.applications ?? []); setLastRefreshed(new Date()); })
      .catch(() => {});
  }, []);

  const loadCategoryWaitlist = useCallback(() => {
    return fetch(`${BASE}api/admin/category-waitlist`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setCategoryWaitlistEntries(data.entries ?? []);
        setCategoryWaitlistByCategory(data.byCategory ?? {});
        setLastRefreshed(new Date());
      })
      .catch(() => {});
  }, []);

  const refreshAll = useCallback(() => {
    return Promise.all([loadWaitlist(), loadUsers(), loadBusinesses(), loadMembers(), loadReviews(), loadReports(), loadChallengeApps(), loadCategoryWaitlist()]);
  }, [loadWaitlist, loadUsers, loadBusinesses, loadMembers, loadReviews, loadReports, loadChallengeApps, loadCategoryWaitlist]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    refreshAll().finally(() => setLoading(false));

    refreshTimer.current = setInterval(() => { refreshAll(); }, 2 * 60 * 1000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [isAdmin, refreshAll]);

  const handleStatusFilter = (newStatus: string) => {
    setStatusFilter(newStatus);
    setWaitlistPage(1);
    loadWaitlist(1, newStatus);
  };

  const handlePageChange = (newPage: number) => {
    loadWaitlist(newPage, statusFilter);
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "leaderboard" && leaderboard.length === 0) loadLeaderboard();
    if (tab === "metrics" && !metrics) loadMetrics();
  }, [tab, isAdmin, leaderboard.length, metrics, loadLeaderboard, loadMetrics]);

  const updateWaitlist = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`${BASE}api/admin/waitlist/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadWaitlist(waitlistPage, statusFilter);
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

  const deleteUser = async (id: string, email: string | null) => {
    if (!window.confirm(`Permanently delete user${email ? ` "${email}"` : ""}? This cannot be undone.`)) return;
    setUpdating(id + "-del");
    await fetch(`${BASE}api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
    await loadUsers();
    setUpdating(null);
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Permanently delete this review? This cannot be undone.")) return;
    setUpdating(id + "-del");
    await fetch(`${BASE}api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
    await loadReviews();
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

  const sendNudgePreview = async () => {
    setNudgeSending(true);
    setNudgeResult(null);
    try {
      const r = await fetch(`${BASE}api/admin/nudge-preview`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (data.sent) {
        setNudgeResult(`✅ Preview sent to ${data.to} (${data.waitlistTotal.toLocaleString()} total on waitlist)`);
      } else {
        setNudgeResult(`❌ ${data.error ?? "Failed to send"}`);
      }
    } catch {
      setNudgeResult("❌ Network error");
    } finally {
      setNudgeSending(false);
      setTimeout(() => setNudgeResult(null), 8000);
    }
  };

  const sendWelcomeTo = async () => {
    const emails = welcomeEmails.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setWelcomeSending(true);
    setWelcomeResult(null);
    try {
      const r = await fetch(`${BASE}api/admin/send-welcome-to`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
        credentials: "include",
      });
      const data = await r.json() as { sent: number; failed: number; notFound: number; results?: { email: string; status: string }[] };
      if (r.ok) {
        const lines = [`✅ Sent: ${data.sent}  |  Not found: ${data.notFound}  |  Failed: ${data.failed}`];
        if (data.results) {
          data.results.filter(x => x.status !== "sent").forEach(x => lines.push(`  • ${x.email} → ${x.status}`));
        }
        setWelcomeResult(lines.join("\n"));
        if (data.sent > 0) { setWelcomeEmails(""); loadWaitlist(); }
      } else {
        setWelcomeResult(`❌ ${(data as any).error ?? "Failed"}`);
      }
    } catch {
      setWelcomeResult("❌ Network error");
    }
    setWelcomeSending(false);
  };

  const sendWeeklyNudge = async () => {
    if (!window.confirm("This will email every pending waitlist member. Continue?")) return;
    setNudgeSending(true);
    setNudgeResult(null);
    try {
      const r = await fetch(`${BASE}api/admin/send-weekly-nudge`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (data.sent !== undefined) {
        setNudgeResult(`✅ Sent ${data.sent} nudge${data.sent !== 1 ? "s" : ""} (${data.failed} failed)`);
      } else {
        setNudgeResult(`❌ ${data.error ?? "Failed"}`);
      }
    } catch {
      setNudgeResult("❌ Network error");
    } finally {
      setNudgeSending(false);
      setTimeout(() => setNudgeResult(null), 12000);
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
  const approvedWaitlist = waitlist.filter(e => e.status === "approved").length;
  const pendingUsers = users.filter(u => !u.approved).length;
  const contactedCount = businesses.filter(b => b.outreach !== null).length;

  const filteredBiz = businesses.filter(b =>
    !bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.city.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.category.toLowerCase().includes(bizSearch.toLowerCase())
  );

  // ── Waitlist analytics (all computed client-side) ─────────────────────────
  const referralCounts: Record<string, number> = {};
  for (const e of waitlist) {
    if (e.referredBy) referralCounts[e.referredBy] = (referralCounts[e.referredBy] ?? 0) + 1;
  }

  const topReferrers = waitlist
    .map(e => ({ ...e, refCount: referralCounts[e.referralCode ?? ""] ?? 0 }))
    .filter(e => e.refCount > 0)
    .sort((a, b) => b.refCount - a.refCount)
    .slice(0, 8);

  const cityCounts: Record<string, number> = {};
  for (const e of waitlist) {
    if (!e.city) continue;
    const key = [e.city, e.state].filter(Boolean).join(", ");
    cityCounts[key] = (cityCounts[key] ?? 0) + 1;
  }
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCity = Math.max(...topCities.map(c => c[1]), 1);

  const last14: { label: string; count: number }[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: waitlist.filter(e => e.createdAt.slice(0, 10) === key).length,
    };
  });
  const maxDay = Math.max(...last14.map(d => d.count), 1);

  const bizOwnerCount = waitlist.filter(e => e.isBusinessOwner).length;
  const referredCount = waitlist.filter(e => e.referredBy).length;
  const emailSentCount = waitlist.filter(e => e.welcomeEmailSent).length;
  const totalWithCode = waitlist.filter(e => e.referralCode).length;

  const filteredWaitlist = waitlist.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.email.toLowerCase().includes(q) ||
      (e.city ?? "").toLowerCase().includes(q) ||
      (e.referralCode ?? "").toLowerCase().includes(q) ||
      (e.referredBy ?? "").toLowerCase().includes(q)
    );
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "waitlist", label: "Waitlist", icon: <Mail className="w-4 h-4" />, badge: pendingWaitlistCount || undefined },
    { id: "leaderboard", label: "Referral Leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { id: "metrics", label: "Metrics", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "users", label: "Registered Users", icon: <Users className="w-4 h-4" />, badge: pendingUsers || undefined },
    { id: "businesses", label: "Businesses", icon: <Store className="w-4 h-4" />, badge: contactedCount || undefined },
    { id: "members", label: "Members", icon: <Briefcase className="w-4 h-4" />, badge: members.length || undefined },
    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" />, badge: reviews.length || undefined },
    { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" />, badge: reports.filter(r => r.status === "pending").length || undefined },
    { id: "challenges", label: "Challenges", icon: <Award className="w-4 h-4" />, badge: challengeApps.filter(a => a.status === "pending").length || undefined },
    { id: "category-waitlist", label: "Category Waitlist", icon: <BarChart2 className="w-4 h-4" />, badge: categoryWaitlistEntries.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-1">Admin Dashboard</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Mapping with Melanin™ — Internal</p>
            </div>
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#CA922B]">{waitlistTotal}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Waitlist</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{pendingWaitlistCount}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#CA922B]">{users.length}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Users</div>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#CA922B]">{businesses.length}</div>
                <div className="text-[#F5EBD8]/60 text-xs uppercase tracking-wider">Businesses</div>
              </div>
            </div>
          </div>

          {/* Email actions */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={sendNudgePreview}
              disabled={nudgeSending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold text-[#F5EBD8] transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {nudgeSending ? "Sending…" : "Preview Nudge (to me)"}
            </button>
            <button
              onClick={sendWeeklyNudge}
              disabled={nudgeSending}
              className="flex items-center gap-2 bg-[#CA922B]/80 hover:bg-[#CA922B] rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {nudgeSending ? "Sending…" : "Send Weekly Nudge (All)"}
            </button>
            {nudgeResult && (
              <span className="text-sm text-[#F5EBD8]/80">{nudgeResult}</span>
            )}
          </div>

          {/* Force-send waitlist welcome email to specific addresses */}
          <div className="mt-4 bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#F5EBD8]">Send Waitlist Welcome Email to Specific Addresses</span>
            </div>
            <p className="text-xs text-[#F5EBD8]/50 mb-3">
              Paste one email per line (or comma-separated). Only emails on the waitlist will receive the waitlist confirmation email with their position and referral code.
            </p>
            <textarea
              value={welcomeEmails}
              onChange={e => setWelcomeEmails(e.target.value)}
              placeholder={"jane@example.com\njohn@example.com"}
              rows={4}
              className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm text-[#F5EBD8] placeholder-[#F5EBD8]/30 resize-none focus:outline-none focus:border-[#CA922B]/60"
            />
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <button
                onClick={sendWelcomeTo}
                disabled={welcomeSending || !welcomeEmails.trim()}
                className="flex items-center gap-2 bg-teal-600/80 hover:bg-teal-600 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {welcomeSending ? "Sending…" : "Send Waitlist Welcome Email"}
              </button>
              {welcomeResult && (
                <pre className="text-xs text-[#F5EBD8]/80 whitespace-pre-wrap">{welcomeResult}</pre>
              )}
            </div>
          </div>

          {!requireApproval && (
            <div className="mt-4 bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-amber-200">
              ⚠️ <strong>Approval gating is OFF.</strong> All users can access the platform regardless of approval status. Set{" "}
              <code className="bg-black/20 px-1 rounded">REQUIRE_APPROVAL=true</code> in environment secrets to enable gating.
            </div>
          )}
          {requireApproval && (
            <div className="mt-4 bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-sm text-green-200">
              ✅ <strong>Approval gating is ON.</strong> Unapproved users see the pending-approval screen. Remove{" "}
              <code className="bg-black/20 px-1 rounded">REQUIRE_APPROVAL</code> or set it to{" "}
              <code className="bg-black/20 px-1 rounded">false</code> to disable.
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#3A1F0E]/10 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex gap-0 items-center justify-between overflow-x-auto">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  tab === t.id
                    ? "border-[#CA922B] text-[#3A1F0E]"
                    : "border-transparent text-[#3A1F0E]/50 hover:text-[#3A1F0E]"
                }`}
              >
                {t.icon}
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
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
          <div className="space-y-6">

            {/* ── KPI Row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total", value: waitlist.length, icon: <Users className="w-4 h-4" />, color: "text-[#CA922B]" },
                { label: "Pending", value: pendingWaitlist, icon: <Clock className="w-4 h-4" />, color: "text-amber-500" },
                { label: "Approved", value: approvedWaitlist, icon: <Check className="w-4 h-4" />, color: "text-green-600" },
                { label: "Biz Owners", value: bizOwnerCount, icon: <Briefcase className="w-4 h-4" />, color: "text-blue-600" },
                { label: "Referred In", value: referredCount, icon: <GitBranch className="w-4 h-4" />, color: "text-purple-600" },
                { label: "Email Sent", value: emailSentCount, icon: <Mail className="w-4 h-4" />, color: "text-teal-600" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 text-center shadow-sm">
                  <div className={`flex items-center justify-center mb-1 ${color}`}>{icon}</div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-[#3A1F0E]/50 text-xs uppercase tracking-wider mt-0.5">{label}</div>
                  {waitlist.length > 0 && label !== "Total" && (
                    <div className="text-[#3A1F0E]/30 text-xs mt-1">{Math.round(value / waitlist.length * 100)}%</div>
                  )}
                </div>
              ))}
            </div>

            {/* ── 14-day Growth Sparkline ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#CA922B]" />
                <h3 className="font-bold text-sm text-[#3A1F0E] uppercase tracking-wider">Signups — Last 14 Days</h3>
                <span className="ml-auto text-xs text-[#3A1F0E]/40">
                  {last14.reduce((s, d) => s + d.count, 0)} this period
                </span>
              </div>
              <div className="flex items-end gap-1 h-20">
                {last14.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t-sm bg-[#CA922B]/80 hover:bg-[#CA922B] transition-colors"
                      style={{ height: `${Math.max(2, (d.count / maxDay) * 64)}px` }}
                    />
                    {d.count > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#CA922B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-[#3A1F0E]/30">{last14[0]?.label}</span>
                <span className="text-[10px] text-[#3A1F0E]/30">{last14[last14.length - 1]?.label}</span>
              </div>
            </div>

            {/* ── City Breakdown + Referral Leaderboard ────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* City breakdown */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-[#CA922B]" />
                  <h3 className="font-bold text-sm text-[#3A1F0E] uppercase tracking-wider">Top Cities</h3>
                  <span className="ml-auto text-xs text-[#3A1F0E]/40">{topCities.length} cities</span>
                </div>
                {topCities.length === 0 ? (
                  <p className="text-[#3A1F0E]/30 text-sm text-center py-4">No city data yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {topCities.map(([city, cnt]) => (
                      <div key={city}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[#3A1F0E] truncate max-w-[70%]">{city}</span>
                          <span className="text-[#CA922B] font-bold">{cnt}</span>
                        </div>
                        <div className="h-2 bg-[#FAF6EF] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#CA922B] rounded-full transition-all"
                            style={{ width: `${(cnt / maxCity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referral leaderboard */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-[#CA922B]" />
                  <h3 className="font-bold text-sm text-[#3A1F0E] uppercase tracking-wider">Referral Leaderboard</h3>
                  <span className="ml-auto text-xs text-[#3A1F0E]/40">
                    {totalWithCode} have codes
                  </span>
                </div>
                {topReferrers.length === 0 ? (
                  <p className="text-[#3A1F0E]/30 text-sm text-center py-4">No referrals yet</p>
                ) : (
                  <div className="space-y-2">
                    {topReferrers.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-[#3A1F0E]/5 last:border-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-slate-100 text-slate-600" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-[#FAF6EF] text-[#3A1F0E]/40"
                        }`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#3A1F0E] truncate">{e.firstName ?? e.email.split("@")[0]}</div>
                          <div className="text-xs text-[#3A1F0E]/40 truncate">{e.referralCode}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold text-[#CA922B]">{e.refCount}</div>
                          <div className="text-[10px] text-[#3A1F0E]/30">referred</div>
                        </div>
                        <div className="w-16 h-2 bg-[#FAF6EF] rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-[#CA922B] rounded-full"
                            style={{ width: `${(e.refCount / (topReferrers[0]?.refCount ?? 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Full Table ───────────────────────────────────────────── */}
            <div>
              <h2 className="text-base font-bold text-[#3A1F0E] mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#CA922B]" />
                All Signups ({waitlist.length})
              </h2>
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
                          <input type="checkbox" checked={selected.size === waitlist.length && waitlist.length > 0} onChange={toggleSelectAll} className="rounded accent-[#CA922B]" />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Location</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referrals</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Signed Up</th>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((entry, i) => {
                        const refCount = referralCounts[entry.referralCode ?? ""] ?? 0;
                        return (
                          <tr key={entry.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${selected.has(entry.id) ? "bg-[#CA922B]/5" : i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded accent-[#CA922B]" />
                            </td>
                            <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                              {entry.firstName ?? <span className="text-[#3A1F0E]/30">—</span>}
                            </td>
                            <td className="px-4 py-3 text-[#3A1F0E]/80">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#CA922B] shrink-0" />
                                {entry.email}
                                {entry.welcomeEmailSent && <span title="Welcome email sent" className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />}
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
                              {entry.isBusinessOwner
                                ? <span className="inline-flex items-center gap-1 text-xs text-[#CA922B] font-bold"><Briefcase className="w-3 h-3" /> Biz Owner</span>
                                : <span className="text-xs text-[#3A1F0E]/40">Community</span>}
                            </td>
                            <td className="px-4 py-3">
                              {refCount > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#CA922B]">{refCount}</span>
                                  <div className="flex gap-0.5">{Array.from({ length: Math.min(refCount, 5) }).map((_, j) => <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#CA922B]" />)}</div>
                                </div>
                              ) : (
                                <span className="text-[#3A1F0E]/20">—</span>
                              )}
                              {entry.referredBy && (
                                <div className="text-[10px] text-[#3A1F0E]/30 mt-0.5">via {entry.referredBy}</div>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : tab === "leaderboard" ? (
          <LeaderboardTab leaderboard={leaderboard} loading={leaderboardLoading} />
        ) : tab === "metrics" ? (
          <MetricsTab metrics={metrics} loading={metricsLoading} />
        ) : tab === "users" ? (
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateUser(user.id, !user.approved)}
                              disabled={updating === user.id}
                              className={`h-7 px-3 rounded-full text-xs ${user.approved ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-green-600 hover:bg-green-700 text-white"}`}
                              variant="outline"
                            >
                              {user.approved ? (<><X className="w-3 h-3 mr-1" /> Revoke</>) : (<><Check className="w-3 h-3 mr-1" /> Approve</>)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteUser(user.id, user.email)}
                              disabled={updating === user.id + "-del"}
                              className="h-7 px-2 rounded-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                              title="Delete account"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : tab === "members" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">Members ({members.length})</h2>
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search by email or name…"
                className="border border-[#3A1F0E]/15 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#CA922B] w-64 bg-white"
              />
            </div>
            {members.filter(m =>
              !memberSearch ||
              m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
              `${m.firstName ?? ""} ${m.lastName ?? ""}`.toLowerCase().includes(memberSearch.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No members found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">User</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Trial Ends</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referrals</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter(m =>
                      !memberSearch ||
                      m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      `${m.firstName ?? ""} ${m.lastName ?? ""}`.toLowerCase().includes(memberSearch.toLowerCase())
                    ).map((m, i) => (
                      <tr key={m.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#3A1F0E]">{m.firstName} {m.lastName}</div>
                          <div className="text-xs text-[#3A1F0E]/50">{m.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {editingMember === m.id ? (
                            <select
                              value={memberEdit.memberType ?? m.memberType ?? "individual"}
                              onChange={e => setMemberEdit(prev => ({ ...prev, memberType: e.target.value }))}
                              className="border border-[#CA922B] rounded-lg px-2 py-1 text-xs focus:outline-none"
                            >
                              {["individual","navigator","trailblazer","business","founding","beta","business_referral"].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              m.memberType === "trailblazer" ? "bg-[#CA922B]/20 text-[#CA922B]" :
                              m.memberType === "founding" ? "bg-amber-100 text-amber-700" :
                              m.memberType === "navigator" ? "bg-blue-100 text-blue-700" :
                              m.memberType === "beta" ? "bg-purple-100 text-purple-700" :
                              m.memberType === "business_referral" ? "bg-teal-100 text-teal-700" :
                              m.memberType === "business" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {m.memberType ?? "individual"}
                            </span>
                          )}
                          {m.stripeSubscriptionId && <span className="ml-1 text-green-600 text-xs">● paid</span>}
                          {m.foundingMemberNumber && <span className="ml-1 text-[#CA922B] text-xs">#{m.foundingMemberNumber}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#3A1F0E]/60">
                          {editingMember === m.id ? (
                            <input
                              type="date"
                              value={memberEdit.trialEndsAt ?? (m.trialEndsAt ? m.trialEndsAt.slice(0,10) : "")}
                              onChange={e => setMemberEdit(prev => ({ ...prev, trialEndsAt: e.target.value }))}
                              className="border border-[#CA922B] rounded-lg px-2 py-1 text-xs focus:outline-none"
                            />
                          ) : m.trialEndsAt ? (
                            <span className={new Date(m.trialEndsAt) > new Date() ? "text-green-600 font-bold" : "text-red-500"}>
                              {new Date(m.trialEndsAt).toLocaleDateString()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#3A1F0E]/60">
                          {m.referralCode ? <><span className="font-mono text-[#3A1F0E]">{m.referralCode}</span> ({m.referralCount ?? 0})</> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {editingMember === m.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 px-3 text-xs rounded-lg bg-[#CA922B] hover:bg-[#B38024] text-white font-bold"
                                onClick={async () => {
                                  const updates: Record<string, unknown> = {};
                                  if (memberEdit.memberType) updates.memberType = memberEdit.memberType;
                                  if (memberEdit.trialEndsAt) updates.trialEndsAt = memberEdit.trialEndsAt;
                                  await fetch(`${BASE}api/admin/members/${m.id}`, {
                                    method: "PATCH", credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(updates),
                                  });
                                  setEditingMember(null);
                                  setMemberEdit({});
                                  loadMembers();
                                }}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-3 text-xs rounded-lg"
                                onClick={() => { setEditingMember(null); setMemberEdit({}); }}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline"
                              className="h-7 px-3 text-xs rounded-lg border-[#3A1F0E]/20 text-[#3A1F0E]/60 hover:text-[#3A1F0E]"
                              onClick={() => { setEditingMember(m.id); setMemberEdit({}); }}>
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : tab !== "reviews" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">
                Businesses ({businesses.length})
                {contactedCount > 0 && <span className="ml-3 text-sm font-sans font-normal text-[#3A1F0E]/50">{contactedCount} outreach sent</span>}
              </h2>
              <input
                type="text"
                value={bizSearch}
                onChange={e => setBizSearch(e.target.value)}
                placeholder="Search by name, city, category…"
                className="border border-[#3A1F0E]/15 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#CA922B] w-64 bg-white"
              />
            </div>

            <div className="mb-4 bg-[#2B1507]/5 border border-[#2B1507]/10 rounded-xl px-4 py-3 text-sm text-[#3A1F0E]/70">
              <strong className="text-[#3A1F0E]">How to use:</strong> Find a business, click <strong>Send Outreach</strong>, enter their email address, and they'll receive an invitation to claim their profile. Each outreach is logged so you can track who's been contacted.
            </div>

            {filteredBiz.length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{bizSearch ? "No businesses match your search." : "No businesses found."}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Business</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Tags</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Outreach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBiz.map((biz, i) => (
                      <tr key={biz.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#3A1F0E]">{biz.name}</div>
                          <div className="text-xs text-[#3A1F0E]/50 mt-0.5">{biz.category}</div>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#CA922B] shrink-0" />
                            {biz.city}, {biz.state}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {biz.verified && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><Check className="w-2.5 h-2.5" /> Verified</span>}
                            {biz.blackOwned && <span className="px-2 py-0.5 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold">Minority-Owned</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#3A1F0E]/60">
                          {biz.phone && <div className="flex items-center gap-1 mb-1">📞 {biz.phone}</div>}
                          {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#CA922B] hover:underline">
                              <ExternalLink className="w-3 h-3" /> Website
                            </a>
                          )}
                          {!biz.phone && !biz.website && <span className="text-[#3A1F0E]/30">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <OutreachCell business={biz} onSent={loadBusinesses} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : tab === "reviews" ? (
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Community Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No reviews yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Author</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Business</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Rating</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Review</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review, i) => (
                      <tr key={review.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                        <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                          {review.authorName ?? <span className="text-[#3A1F0E]/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/60 text-xs font-mono">{review.businessId.slice(0, 8)}…</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-0.5 font-bold text-[#CA922B]">
                            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70 max-w-xs">
                          {review.text ? (
                            <span className="line-clamp-2">{review.text}</span>
                          ) : <span className="text-[#3A1F0E]/30 text-xs">No text</span>}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteReview(review.id)}
                            disabled={updating === review.id + "-del"}
                            className="h-7 px-2 rounded-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete review"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
            <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">
              Content Reports
              <span className="ml-3 text-sm font-sans font-normal text-[#3A1F0E]/50">({reports.length} total, {reports.filter(r => r.status === "pending").length} pending)</span>
            </h2>
            {reports.length === 0 ? (
              <div className="text-center py-20 text-[#3A1F0E]/40">
                <Flag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No content reports yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Target</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Reason</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Description</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, i) => (
                      <tr key={report.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3A1F0E]/10 text-[#3A1F0E] text-xs font-bold capitalize">
                            {report.targetType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/60 text-xs font-mono">{report.targetId.slice(0, 8)}…</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold capitalize">
                            {report.reason.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70 max-w-xs">
                          {report.description ? (
                            <span className="line-clamp-2">{report.description}</span>
                          ) : <span className="text-[#3A1F0E]/30 text-xs">No description</span>}
                        </td>
                        <td className="px-4 py-3">
                          {report.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                              <AlertTriangle className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {report.status === "reviewed" && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Reviewed</span>
                          )}
                          {report.status === "dismissed" && (
                            <span className="px-2 py-0.5 rounded-full bg-[#3A1F0E]/10 text-[#3A1F0E]/50 text-xs font-bold">Dismissed</span>
                          )}
                          {report.status === "actioned" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <Check className="w-3 h-3" /> Actioned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          {report.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updating === report.id + "-dismiss"}
                                onClick={async () => {
                                  setUpdating(report.id + "-dismiss");
                                  await fetch(`${BASE}api/admin/content-reports/${report.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ status: "dismissed" }),
                                  });
                                  setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "dismissed" } : r));
                                  setUpdating(null);
                                }}
                                className="h-7 px-2 rounded-full text-xs border-[#3A1F0E]/20 text-[#3A1F0E]/60 hover:bg-[#3A1F0E]/5"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                disabled={updating === report.id + "-action"}
                                onClick={async () => {
                                  setUpdating(report.id + "-action");
                                  await fetch(`${BASE}api/admin/content-reports/${report.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ status: "actioned" }),
                                  });
                                  setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "actioned" } : r));
                                  setUpdating(null);
                                }}
                                className="h-7 px-2 rounded-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                title="Mark actioned"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Challenges tab ─────────────────────────────────────────────── */}
        {tab === "challenges" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#3A1F0E]">Business Challenge Applications</h2>
                <p className="text-[#3A1F0E]/60 text-sm mt-0.5">Review businesses applying to be featured in community challenges</p>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg">{challengeApps.filter(a => a.status === "pending").length} pending</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 font-bold rounded-lg">{challengeApps.filter(a => a.status === "approved").length} approved</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-lg">{challengeApps.filter(a => a.status === "rejected").length} rejected</span>
              </div>
            </div>

            {challengeApps.length === 0 ? (
              <div className="text-center py-16 text-[#3A1F0E]/40">
                <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No applications yet</p>
                <p className="text-sm mt-1">When businesses apply to join challenges, they'll appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E8D5B7]">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D5B7]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Business</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Challenge</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Contact</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Message</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Applied</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D5B7]/60">
                    {challengeApps.map((app) => (
                      <tr key={app.id} className="hover:bg-[#FAF6EF]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#3A1F0E]">{app.businessName}</div>
                          {(app.businessCity || app.businessCategory) && (
                            <div className="text-[#3A1F0E]/50 text-xs mt-0.5">
                              {[app.businessCategory, app.businessCity].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold">
                            🏆 {app.challengeName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.ownerName && <div className="text-[#3A1F0E] text-xs font-medium">{app.ownerName}</div>}
                          {app.ownerEmail && (
                            <a href={`mailto:${app.ownerEmail}`} className="text-blue-600 hover:underline text-xs">{app.ownerEmail}</a>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {app.message ? (
                            <p className="text-[#3A1F0E]/70 text-xs line-clamp-2">{app.message}</p>
                          ) : (
                            <span className="text-[#3A1F0E]/30 text-xs italic">No message</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {app.status === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <Check className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {app.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                              <X className="w-3 h-3" /> Rejected
                            </span>
                          )}
                          {app.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs whitespace-nowrap">
                          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          {app.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updating === String(app.id) + "-reject"}
                                onClick={async () => {
                                  setUpdating(String(app.id) + "-reject");
                                  await fetch(`${BASE}api/admin/challenge-applications/${app.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ status: "rejected" }),
                                  });
                                  setChallengeApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "rejected" } : a));
                                  setUpdating(null);
                                }}
                                className="h-7 px-2 rounded-full text-xs border-[#3A1F0E]/20 text-[#3A1F0E]/60 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                title="Reject"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                disabled={updating === String(app.id) + "-approve"}
                                onClick={async () => {
                                  setUpdating(String(app.id) + "-approve");
                                  await fetch(`${BASE}api/admin/challenge-applications/${app.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ status: "approved" }),
                                  });
                                  setChallengeApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "approved" } : a));
                                  setUpdating(null);
                                }}
                                className="h-7 px-2 rounded-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                title="Approve"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {app.status !== "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updating === String(app.id) + "-reset"}
                              onClick={async () => {
                                setUpdating(String(app.id) + "-reset");
                                await fetch(`${BASE}api/admin/challenge-applications/${app.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ status: "pending" }),
                                });
                                setChallengeApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "pending" } : a));
                                setUpdating(null);
                              }}
                              className="h-7 px-2 rounded-full text-xs border-[#3A1F0E]/20 text-[#3A1F0E]/60"
                              title="Reset to pending"
                            >
                              Reset
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* ── Category Waitlist tab ──────────────────────────────────────── */}
        {tab === "category-waitlist" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#3A1F0E]">Category Interest Waitlist</h2>
              <p className="text-[#3A1F0E]/60 text-sm mt-0.5">
                Business owners who signed up to be notified when their category launches. Use this to prioritize which categories to build next.
              </p>
            </div>

            {/* Interest by category summary */}
            {Object.keys(categoryWaitlistByCategory).length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">Demand by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(categoryWaitlistByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div key={cat} className="bg-white rounded-xl border border-[#E8D5B7] p-4 flex items-center gap-3">
                        <div className="text-2xl font-bold text-[#CA922B] min-w-[2rem] text-center">{count}</div>
                        <div className="text-[#3A1F0E] text-xs font-semibold leading-tight">{cat}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Individual entries */}
            {categoryWaitlistEntries.length === 0 ? (
              <div className="text-center py-16 text-[#3A1F0E]/40">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No waitlist signups yet</p>
                <p className="text-sm mt-1">When business owners express interest in coming-soon categories, they'll appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E8D5B7]">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D5B7]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Category</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Business Name</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Email</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">City</th>
                      <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D5B7]/60">
                    {categoryWaitlistEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#FAF6EF]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#3A1F0E]">{entry.parentCategory}</div>
                          {entry.subcategory && (
                            <div className="text-[#3A1F0E]/50 text-xs mt-0.5">{entry.subcategory}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]">{entry.businessName ?? <span className="text-[#3A1F0E]/30 italic">—</span>}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${entry.email}`} className="text-blue-600 hover:underline text-xs">{entry.email}</a>
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/70 text-xs">
                          {[entry.city, entry.state].filter(Boolean).join(", ") || <span className="text-[#3A1F0E]/30 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs">
                          {new Date(entry.createdAt).toLocaleDateString()}
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

function WaitlistTab({
  waitlist,
  totalCount,
  page,
  totalPages,
  search,
  setSearch,
  statusFilter,
  onStatusFilter,
  onPageChange,
  isLoading,
  updating,
  updateWaitlist,
}: {
  waitlist: WaitlistEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  updating: string | null;
  updateWaitlist: (id: string, status: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">
          Waitlist Signups
          <span className="text-base font-normal text-[#3A1F0E]/50 ml-2">
            ({totalCount.toLocaleString()} total)
          </span>
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search email, city, referral code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#3A1F0E]/15 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 w-64"
          />
          <div className="flex rounded-xl overflow-hidden border border-[#3A1F0E]/15">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusFilter(s)}
                className={`px-3 py-2 text-xs font-bold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-[#CA922B] text-white"
                    : "bg-white text-[#3A1F0E]/60 hover:bg-[#FAF6EF]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : waitlist.length === 0 ? (
        <div className="text-center py-20 text-[#3A1F0E]/40">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No entries match your filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">City</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referral Code</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referred By</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}
                  >
                    <td className="px-4 py-3 text-[#3A1F0E]/40 text-xs font-mono">
                      {entry.position != null ? `#${entry.position}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3A1F0E]">
                      {entry.firstName ?? <span className="text-[#3A1F0E]/30">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#3A1F0E]">
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
                      ) : (
                        <span className="text-[#3A1F0E]/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.isBusinessOwner ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#CA922B] font-bold">
                          <Briefcase className="w-3 h-3" /> Business
                        </span>
                      ) : (
                        <span className="text-xs text-[#3A1F0E]/40">Community</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#3A1F0E]/60">
                      {entry.referralCode ?? <span className="text-[#3A1F0E]/30">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#3A1F0E]/60">
                      {entry.referredBy ?? <span className="text-[#3A1F0E]/30">—</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(entry.status)}</td>
                    <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => updateWaitlist(entry.id, "approved")}
                            disabled={updating === entry.id}
                            className="h-7 px-3 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        )}
                        {entry.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWaitlist(entry.id, "rejected")}
                            disabled={updating === entry.id}
                            className="h-7 px-3 rounded-full border-red-300 text-red-600 hover:bg-red-50 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        )}
                        {entry.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWaitlist(entry.id, "pending")}
                            disabled={updating === entry.id}
                            className="h-7 px-3 rounded-full text-xs"
                          >
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-[#3A1F0E]/50">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-8 px-4 rounded-xl text-xs"
                >
                  ← Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="h-8 px-4 rounded-xl text-xs"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardTab({
  leaderboard,
  loading,
}: {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-[#CA922B]" />
        <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">Referral Leaderboard</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 text-[#3A1F0E]/40">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No referrals recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3A1F0E]/10 bg-[#FAF6EF]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referrer</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referral Code</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Referrals</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.referralCode}
                  className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}
                >
                  <td className="px-5 py-3">
                    <span className="text-lg leading-none">{medals[i] ?? `#${entry.rank}`}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-[#3A1F0E]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#CA922B]/15 flex items-center justify-center text-[#CA922B] font-bold text-xs shrink-0">
                        {(entry.name ?? entry.email)[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        {entry.name && <div className="text-xs font-bold text-[#3A1F0E]">{entry.name}</div>}
                        <div className={entry.name ? "text-xs text-[#3A1F0E]/60" : ""}>{entry.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-[#3A1F0E]/60">{entry.referralCode}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#CA922B]/10 text-[#CA922B] font-bold text-sm">
                      <Award className="w-3.5 h-3.5" />
                      {entry.referralCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricsTab({
  metrics,
  loading,
}: {
  metrics: MetricsData | null;
  loading: boolean;
}) {
  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = metrics.total - metrics.approved;
  const approvalRate = metrics.total > 0 ? Math.round((metrics.approved / metrics.total) * 100) : 0;

  const chartData = (() => {
    const map = new Map(metrics.daily.map((d) => [d.date, d.count]));
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, label, count: map.get(key) ?? 0 });
    }
    return days;
  })();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-[#CA922B]" />
          <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Signups"
            value={metrics.total.toLocaleString()}
            sub="All time"
          />
          <StatCard
            icon={<Check className="w-5 h-5" />}
            label="Approved"
            value={metrics.approved.toLocaleString()}
            sub={`${approvalRate}% approval rate`}
          />
          <StatCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Signups Today"
            value={metrics.today.toLocaleString()}
            sub="UTC day"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="This Week"
            value={metrics.week.toLocaleString()}
            sub="Last 7 days"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-[#CA922B]" />
          <h3 className="font-bold text-[#3A1F0E]">Daily Signups — Last 30 Days</h3>
        </div>
        {chartData.every((d) => d.count === 0) ? (
          <div className="text-center py-12 text-[#3A1F0E]/40 text-sm">No signups in the last 30 days.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A1F0E10" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#3A1F0E80" }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#3A1F0E80" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#2B1507",
                  border: "none",
                  borderRadius: "8px",
                  color: "#F5EBD8",
                  fontSize: "12px",
                }}
                cursor={{ fill: "#CA922B15" }}
                formatter={(v: number) => [v, "Signups"]}
              />
              <Bar dataKey="count" fill="#CA922B" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-5 h-5 text-[#CA922B]" />
          <h3 className="font-bold text-[#3A1F0E]">Top Cities by Signup Volume</h3>
        </div>
        {metrics.cities.length === 0 ? (
          <div className="text-center py-8 text-[#3A1F0E]/40 text-sm">No city data available.</div>
        ) : (
          <div className="space-y-3">
            {metrics.cities.map((c, i) => {
              const maxCount = metrics.cities[0]?.count ?? 1;
              const pct = Math.round((c.count / maxCount) * 100);
              return (
                <div key={c.city ?? i} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-[#3A1F0E]/40 font-bold text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="w-32 text-sm font-medium text-[#3A1F0E] truncate shrink-0">
                    {c.city ?? "Unknown"}
                  </span>
                  <div className="flex-1 bg-[#FAF6EF] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#CA922B] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-bold text-[#CA922B] text-right shrink-0">
                    {c.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-2">Pending Approval</div>
          <div className="text-3xl font-bold text-amber-600">{pendingCount.toLocaleString()}</div>
          <div className="text-xs text-[#3A1F0E]/40 mt-1">awaiting review</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-2">Approval Rate</div>
          <div className="text-3xl font-bold text-green-600">{approvalRate}%</div>
          <div className="text-xs text-[#3A1F0E]/40 mt-1">of all signups approved</div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({
  users,
  updating,
  updateUser,
  updateUserRole,
}: {
  users: AdminUser[];
  updating: string | null;
  updateUser: (id: string, approved: boolean) => void;
  updateUserRole: (id: string, role: "user" | "tester") => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">
        Registered Users ({users.length})
      </h2>
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
                <tr
                  key={user.id}
                  className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}
                >
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
                        {user.firstName || user.lastName
                          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                          : <span className="text-[#3A1F0E]/40">No name</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#3A1F0E]/70">
                    {user.email ?? <span className="text-[#3A1F0E]/30">—</span>}
                  </td>
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
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      onClick={() => updateUser(user.id, !user.approved)}
                      disabled={updating === user.id}
                      className={`h-7 px-3 rounded-full text-xs ${user.approved ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-green-600 hover:bg-green-700 text-white"}`}
                      variant="outline"
                    >
                      {user.approved
                        ? <><X className="w-3 h-3 mr-1" /> Revoke</>
                        : <><Check className="w-3 h-3 mr-1" /> Approve</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
