import { useState, useEffect, useCallback, useRef } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { getWebToken, syncTokenToCookie } from "@/lib/webAuth";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Check, X, Clock, Users, Mail, MapPin, Briefcase, Download, RefreshCw, Send, Store, ExternalLink, Trash2, Star, TrendingUp, Award, GitBranch, BarChart2, Flag, AlertTriangle, Trophy, CalendarDays, Globe, Activity, MessageSquarePlus, PlusCircle, CheckCircle, BookOpen, AlertCircle, Eye, ChevronDown } from "lucide-react";
import { AdminAddBusiness } from "@/components/AdminAddBusiness";
import { AdminEditBusiness } from "@/components/AdminEditBusiness";
import { AdminFeedbackTab } from "@/components/AdminFeedbackTab";
import AdminBusinessReview from "@/pages/admin-business-review";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

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
  listingStatus: string;
  needsVerification: boolean;
  permanentlyClosed: boolean;
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

type PendingGlobalRec = {
  id: string;
  country: string;
  city: string | null;
  businessName: string;
  website: string | null;
  type: string;
  reason: string | null;
  personalConnection: string | null;
  status: string;
  badge: string | null;
  createdAt: string;
  contributorFirstName: string | null;
  contributorHomeCity: string | null;
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
  businessName?: string;
  authorName: string | null;
  rating: number;
  text: string | null;
  status: string;
  nonMinorityOwned: boolean | null;
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
  platform?: {
    uptimeSeconds: number;
    generatedAt: string;
    pool: { total: number; idle: number; waiting: number };
    activeSessions: number;
    membersTotal: number;
    membersToday: number;
    communityPostsToday: number;
    loginsLastHour: number;
    failuresLastHour: number;
  };
};

type Tab = "waitlist" | "leaderboard" | "metrics" | "users" | "businesses" | "members" | "reviews" | "reports" | "challenges" | "category-waitlist" | "global-recs" | "health" | "cities" | "feedback" | "knowledge-contrib" | "library-growth" | "biz-review";

type ChecklistSection = {
  pre_launch: Record<string, boolean>;
  community: Record<string, boolean>;
  marketing: Record<string, boolean>;
  operations: Record<string, boolean>;
};

type CityLaunch = {
  id: string;
  city: string;
  state: string;
  slug: string;
  sequenceOrder: number;
  status: "planning" | "pre_launch" | "soft_launch" | "live" | "paused";
  launchDate: string | null;
  checklist: ChecklistSection;
  notes: string | null;
  rolloutPercentage: number;
  autoAdvance: boolean;
  healthLevel: "ok" | "warning" | "critical";
  checklistProgress: { completed: number; total: number; pct: number };
  metrics: {
    waitlistSize: number;
    activeMembers: number;
    businessesOnboarded: number;
    eventsLive: number;
    ambassadorCount: number;
    communityPosts: number;
  };
  createdAt: string;
  updatedAt: string;
};

type CityTrendPoint = {
  date: string;
  waitlist: number;
  members: number;
  businesses: number;
  events: number;
  posts: number;
};

type CityHealthSignal = { level: "ok" | "warning" | "critical"; message: string };
type CityHealth = {
  level: "ok" | "warning" | "critical";
  signals: CityHealthSignal[];
  probeMs: number;
  poolStats: { total: number; idle: number; waiting: number };
  activity: {
    signups24h: number;
    signups7d: number;
    posts24h: number;
    posts7d: number;
    waitlistSignups24h: number;
  };
  requestMetrics?: {
    totalRequests: number;
    totalErrors: number;
    errorRatePct: number | null;
    avgResponseMs: number;
    windowHours: number;
  };
  cityStatus: string;
  checkedAt: string;
};

type HealthData = {
  status: "ok" | "degraded" | "down";
  poolStats: { total: number; idle: number; waiting: number };
  checks: { rawSql: boolean; drizzle: boolean; rawSqlMs: number | null; drizzleMs: number | null };
  uptimeSeconds: number;
  checkedAt: string;
  poolConfig: { max: number; idleTimeoutMs: number; maxLifetimeS: number; connectionTimeoutMs: number };
  loadTestBaseline: { concurrentRequests: number; successRate: string; maxMs: number; testedAt: string; note: string };
  escalationMatrix: { level: string; condition: string; action: string }[];
  kinfolkAI?: {
    activeGenerations: number;
    queuedGenerations: number;
    tpmEventsLast60m: number;
    tpmEventsMostRecentAt: string | null;
    concurrencyCap: number;
    queueMax: number;
  };
};

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

// ─── AdminBootstrap ───────────────────────────────────────────────────────────
// Shown when no admin exists yet. Lets the founder claim admin on first login.
function AdminBootstrap({ currentEmail, onBootstrapped }: { currentEmail: string | null; onBootstrapped: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const claim = async () => {
    setStatus("loading");
    try {
      const r = await fetch(`${BASE}api/admin/bootstrap`, { method: "POST", credentials: "include" });
      const body = await r.json() as { success?: boolean; error?: string };
      if (r.ok && body.success) {
        setStatus("success");
        setTimeout(onBootstrapped, 1200);
      } else {
        setErrorMsg(body.error ?? "Bootstrap failed");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error — try again");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#CA3A2B" strokeWidth="2" strokeLinecap="round">
            <circle cx="16" cy="16" r="14"/>
            <line x1="10" y1="10" x2="22" y2="22"/>
            <line x1="22" y1="10" x2="10" y2="22"/>
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">Admin Access Required</h1>
        <p className="text-[#3A1F0E]/60 mb-2">This account doesn't have admin access yet.</p>
        {currentEmail ? (
          <p className="text-sm text-[#3A1F0E]/40 mb-6">Signed in as <span className="font-medium">{currentEmail}</span></p>
        ) : (
          <p className="text-sm text-[#3A1F0E]/40 mb-6">Signed in without an email — admin requires email login.</p>
        )}
        {status === "success" ? (
          <p className="text-green-700 font-semibold text-sm mb-4">Admin access granted! Reloading…</p>
        ) : (
          <>
            {status === "error" && <p className="text-red-600 text-sm mb-3">{errorMsg}</p>}
            <button onClick={claim} disabled={status === "loading"}
              className="w-full px-6 py-3 bg-[#CA922B] text-white rounded-full font-semibold text-sm hover:bg-[#b07d24] disabled:opacity-50 transition-colors mb-3">
              {status === "loading" ? "Claiming access…" : "Claim Admin Access"}
            </button>
            <button
              onClick={async () => { const { clearWebToken } = await import("@/lib/webAuth"); await clearWebToken(); window.location.href = `${BASE}login?returnTo=/admin`; }}
              className="px-6 py-2 text-[#3A1F0E]/50 text-sm hover:text-[#CA922B] transition-colors">
              Sign out &amp; switch account
            </button>
          </>
        )}
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
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [nudgeSending, setNudgeSending] = useState(false);
  const [nudgeResult, setNudgeResult] = useState<string | null>(null);
  const [nudgeDetails, setNudgeDetails] = useState<{ sent: number; skipped: number; newSignupsThisWeek: number; errors?: string[] } | null>(null);
  const [nudgeConfirmOpen, setNudgeConfirmOpen] = useState(false);
  const [betaBlastSending, setBetaBlastSending] = useState(false);
  const [betaBlastResult, setBetaBlastResult] = useState<string | null>(null);
  const [welcomeEmails, setWelcomeEmails] = useState("");
  const [welcomeSending, setWelcomeSending] = useState(false);
  const [welcomeResult, setWelcomeResult] = useState<string | null>(null);
  const [bizSearch, setBizSearch] = useState("");
  const [bizStatusFilter, setBizStatusFilter] = useState<"all" | "permanently_closed" | "needs_review" | "archived">("all");
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthNextRefresh, setHealthNextRefresh] = useState<number | null>(null);
  const [healthCountdown, setHealthCountdown] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState<{
    runAt: string;
    importEmailCount: number;
    waitlistByStatus: { status: string; total: string }[];
    usersOverview: { total_users: string; admins: string; testers: string; regular_users: string; onboarded: string; has_profile_photo: string } | null;
    contentCounts: { safety_surveys: string; safety_reports: string; community_posts: string; events: string; saved_places: string; reviews: string; messages: string } | null;
    waitlistOverlap: { count: number; rows: { email: string; status: string; created_at: string }[] };
    userOverlap: { count: number; rows: { email: string; role: string; created_at: string }[] };
  } | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [pendingGlobalRecs, setPendingGlobalRecs] = useState<PendingGlobalRec[]>([]);
  const [globalRecsLoading, setGlobalRecsLoading] = useState(false);
  const [globalRecUpdating, setGlobalRecUpdating] = useState<string | null>(null);

  const [cityLaunches, setCityLaunches] = useState<CityLaunch[]>([]);
  const [cityLaunchesLoading, setCityLaunchesLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityLaunch | null>(null);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [editingBiz, setEditingBiz] = useState<{ id: string; name: string } | null>(null);
  const [addBizSuccess, setAddBizSuccess] = useState<{ id: string; name: string } | null>(null);
  const [checklistUpdating, setChecklistUpdating] = useState<string | null>(null);
  const [cityStatusUpdating, setCityStatusUpdating] = useState<string | null>(null);
  const [triggerLaunching, setTriggerLaunching] = useState<string | null>(null);
  const [cityTrend, setCityTrend] = useState<CityTrendPoint[]>([]);
  const [cityTrendLoading, setCityTrendLoading] = useState(false);
  const [cityStatusBanner, setCityStatusBanner] = useState<{ message: string; newStatus: string } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cityHealth, setCityHealth] = useState<CityHealth | null>(null);
  const [cityHealthLoading, setCityHealthLoading] = useState(false);

  useEffect(() => {
    if (!selectedCity) { setCityTrend([]); setCityHealth(null); return; }
    setCityTrendLoading(true);
    fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/trend`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setCityTrend(data.trend ?? []))
      .catch(() => setCityTrend([]))
      .finally(() => setCityTrendLoading(false));
    setCityHealthLoading(true);
    fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/health`, { credentials: "include" })
      .then(r => r.json())
      .then((data: CityHealth) => setCityHealth(data))
      .catch(() => setCityHealth(null))
      .finally(() => setCityHealthLoading(false));
  }, [selectedCity?.slug]);

  useEffect(() => {
    syncTokenToCookie();
    const token = getWebToken();
    fetch(`${BASE}api/admin/check`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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
      .then((data) => {
        // Only store valid metrics — reject error responses like { error: "Forbidden" }
        if (typeof data?.total === "number") {
          setMetrics(data);
          setLastRefreshed(new Date());
        }
      })
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

  const loadPendingGlobalRecs = useCallback(() => {
    setGlobalRecsLoading(true);
    return fetch(`${BASE}api/global-recommendations/pending`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setPendingGlobalRecs(data.recommendations ?? []); setLastRefreshed(new Date()); })
      .catch(() => {})
      .finally(() => setGlobalRecsLoading(false));
  }, []);

  const loadCityLaunches = useCallback(() => {
    setCityLaunchesLoading(true);
    return fetch(`${BASE}api/admin/city-launches`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const cities = data.cities ?? [];
        setCityLaunches(cities);
        setSelectedCity(prev => prev ? (cities.find((c: CityLaunch) => c.slug === prev.slug) ?? prev) : null);
        setLastRefreshed(new Date());
      })
      .catch(() => {})
      .finally(() => setCityLaunchesLoading(false));
  }, []);

  const refreshAll = useCallback(() => {
    return Promise.all([loadWaitlist(), loadUsers(), loadBusinesses(), loadMembers(), loadReviews(), loadReports(), loadChallengeApps(), loadCategoryWaitlist(), loadPendingGlobalRecs(), loadMetrics(), loadCityLaunches()]);
  }, [loadWaitlist, loadUsers, loadBusinesses, loadMembers, loadReviews, loadReports, loadChallengeApps, loadCategoryWaitlist, loadPendingGlobalRecs, loadMetrics, loadCityLaunches]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    refreshAll().finally(() => setLoading(false));

    const startTimer = () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = setInterval(() => {
        if (!document.hidden) refreshAll();
      }, 60 * 1000);
    };

    startTimer();

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshAll();
        startTimer();
      } else {
        if (refreshTimer.current) clearInterval(refreshTimer.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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
  }, [tab, isAdmin, leaderboard.length, loadLeaderboard]);

  useEffect(() => {
    setSecondsSinceUpdate(0);
    const ticker = setInterval(() => setSecondsSinceUpdate(s => s + 1), 1000);
    return () => clearInterval(ticker);
  }, [lastRefreshed]);

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

  const decideReview = async (id: string, action: "approve" | "reject") => {
    if (action === "reject" && !window.confirm("Reject and permanently remove this review?")) return;
    setUpdating(id + "-" + action);
    await fetch(`${BASE}api/admin/reviews/${id}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    });
    await loadReviews();
    setUpdating(null);
  };

  const bulkUpdate = async (status: string) => {
    if (selected.size === 0 && !selectAllFiltered) return;
    setBulkUpdating(true);
    const body = selectAllFiltered
      ? { filter: { status: statusFilter !== "all" ? statusFilter : undefined }, status }
      : { ids: Array.from(selected), status };
    await fetch(`${BASE}api/admin/waitlist/bulk`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSelected(new Set());
    setSelectAllFiltered(false);
    await loadWaitlist(waitlistPage, statusFilter);
    setBulkUpdating(false);
  };

  const toggleSelect = (id: string) => {
    setSelectAllFiltered(false);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAllFiltered || selected.size === waitlist.length) {
      setSelected(new Set());
      setSelectAllFiltered(false);
    } else {
      setSelected(new Set(waitlist.map(e => e.id)));
    }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    window.open(`${BASE}api/admin/waitlist/export${qs ? `?${qs}` : ""}`, "_blank");
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

  const sendBetaBlast = async () => {
    if (!window.confirm("This will send a beta testing invitation to all waitlist members who haven't received it yet. Continue?")) return;
    setBetaBlastSending(true);
    setBetaBlastResult(null);
    try {
      const r = await fetch(`${BASE}api/admin/send-beta-blast`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyUnsent: true }),
      });
      const data = await r.json();
      if (data.sent !== undefined) {
        setBetaBlastResult(`✅ Sent ${data.sent} beta invite${data.sent !== 1 ? "s" : ""} (${data.failed} failed, ${data.skipped} already sent)`);
      } else {
        setBetaBlastResult(`❌ ${data.error ?? "Failed"}`);
      }
    } catch {
      setBetaBlastResult("❌ Network error");
    } finally {
      setBetaBlastSending(false);
      setTimeout(() => setBetaBlastResult(null), 12000);
    }
  };

  const sendWeeklyNudge = async () => {
    setNudgeSending(true);
    setNudgeResult(null);
    setNudgeDetails(null);
    setNudgeConfirmOpen(false);
    try {
      const r = await fetch(`${BASE}api/admin/send-weekly-nudge`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (data.sent !== undefined) {
        setNudgeDetails({
          sent: data.sent ?? 0,
          skipped: data.skipped ?? 0,
          newSignupsThisWeek: data.newSignupsThisWeek ?? 0,
          errors: data.errors,
        });
        setNudgeResult("success");
      } else {
        setNudgeResult(`❌ ${data.error ?? "Failed"}`);
      }
    } catch {
      setNudgeResult("❌ Network error");
    } finally {
      setNudgeSending(false);
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth?.user) return <Redirect to="/login?returnTo=/admin" />;
  if (!isAdmin) {
    const currentEmail = (auth?.user as any)?.email as string | null | undefined;
    return (
      <AdminBootstrap
        currentEmail={currentEmail ?? null}
        onBootstrapped={() => {
          setIsAdmin(true);
          window.location.reload();
        }}
      />
    );
  }

  const pendingWaitlist = waitlist.filter(e => e.status === "pending").length;
  const approvedWaitlist = waitlist.filter(e => e.status === "approved").length;
  const pendingUsers = users.filter(u => !u.approved).length;
  const contactedCount = businesses.filter(b => b.outreach !== null).length;

  const filteredBiz = businesses.filter(b => {
    if (bizStatusFilter === "permanently_closed" && !b.permanentlyClosed) return false;
    if (bizStatusFilter === "needs_review" && !b.needsVerification) return false;
    if (bizStatusFilter === "archived" && b.listingStatus !== "archived") return false;
    if (!bizSearch) return true;
    const q = bizSearch.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });
  const permanentlyClosedCount = businesses.filter(b => b.permanentlyClosed).length;
  const needsReviewCount = businesses.filter(b => b.needsVerification).length;
  const archivedCount = businesses.filter(b => b.listingStatus === "archived").length;

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

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const token = getWebToken();
      const r = await fetch(`${BASE}api/admin/health`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const data = await r.json() as HealthData;
        setHealth(data);
        const next = Date.now() + 60 * 60 * 1000;
        setHealthNextRefresh(next);
      }
    } catch { /* silent */ }
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin || tab !== "health") return;
    if (!health) void loadHealth();
    const autoRefresh = setInterval(() => void loadHealth(), 60 * 60 * 1000);
    return () => clearInterval(autoRefresh);
  }, [tab, isAdmin, health, loadHealth]);

  useEffect(() => {
    if (!healthNextRefresh) return;
    const tick = setInterval(() => {
      const secs = Math.max(0, Math.round((healthNextRefresh - Date.now()) / 1000));
      setHealthCountdown(secs);
    }, 1000);
    return () => clearInterval(tick);
  }, [healthNextRefresh]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "waitlist", label: "Waitlist", icon: <Mail className="w-4 h-4" />, badge: pendingWaitlistCount || undefined },
    { id: "leaderboard", label: "Referral Leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { id: "metrics", label: "Metrics", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "users", label: "Registered Users", icon: <Users className="w-4 h-4" />, badge: pendingUsers || undefined },
    { id: "businesses", label: "Businesses", icon: <Store className="w-4 h-4" />, badge: contactedCount || undefined },
    { id: "members", label: "Members", icon: <Briefcase className="w-4 h-4" />, badge: members.length || undefined },
    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" />, badge: reviews.filter(r => r.status === "pending_review").length || undefined },
    { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" />, badge: reports.filter(r => r.status === "pending").length || undefined },
    { id: "challenges", label: "Challenges", icon: <Award className="w-4 h-4" />, badge: challengeApps.filter(a => a.status === "pending").length || undefined },
    { id: "category-waitlist", label: "Category Waitlist", icon: <BarChart2 className="w-4 h-4" />, badge: categoryWaitlistEntries.length || undefined },
    { id: "global-recs", label: "Global Recs", icon: <Globe className="w-4 h-4" />, badge: pendingGlobalRecs.filter(r => r.status === "pending").length || undefined },
    { id: "health", label: "Production Health", icon: <Activity className="w-4 h-4" /> },
    { id: "cities", label: "City Launches", icon: <MapPin className="w-4 h-4" /> },
    { id: "feedback", label: "Beta Feedback", icon: <MessageSquarePlus className="w-4 h-4" />, badge: undefined },
    { id: "knowledge-contrib", label: "Knowledge Contributions", icon: <BookOpen className="w-4 h-4" /> },
    { id: "library-growth", label: "Library Growth", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "biz-review", label: "Business Review Queue", icon: <Store className="w-4 h-4" /> },
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
              <a
                href={BASE}
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#F5EBD8]/50 hover:text-[#CA922B] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5 2 6l5.5 4.5"/></svg>
                View Community Site
              </a>
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
              onClick={() => setNudgeConfirmOpen(true)}
              disabled={nudgeSending}
              className="flex items-center gap-2 bg-[#CA922B]/80 hover:bg-[#CA922B] rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {nudgeSending ? "Sending…" : "Send Weekly Nudge (All)"}
            </button>
            {nudgeResult && nudgeResult !== "success" && (
              <span className="text-sm text-[#F5EBD8]/80">{nudgeResult}</span>
            )}
            <button
              onClick={sendBetaBlast}
              disabled={betaBlastSending}
              className="flex items-center gap-2 bg-emerald-700/80 hover:bg-emerald-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {betaBlastSending ? "Sending…" : "🧪 Send Beta Invite (All)"}
            </button>
            {betaBlastResult && (
              <span className="text-sm text-[#F5EBD8]/80">{betaBlastResult}</span>
            )}
          </div>

          {/* Weekly nudge batch result card */}
          {nudgeResult === "success" && nudgeDetails && (
            <div className="mt-4 bg-white/10 rounded-2xl p-4 border border-[#CA922B]/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-[#F5EBD8]">Weekly Nudge — Batch Result</span>
                </div>
                <button
                  onClick={() => { setNudgeResult(null); setNudgeDetails(null); }}
                  className="text-[#F5EBD8]/40 hover:text-[#F5EBD8]/80 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-emerald-400">{nudgeDetails.sent}</div>
                  <div className="text-[#F5EBD8]/60 text-xs mt-0.5">Emails Sent</div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-[#CA922B]">{nudgeDetails.skipped}</div>
                  <div className="text-[#F5EBD8]/60 text-xs mt-0.5">Skipped</div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-xl font-bold text-[#F5EBD8]">{nudgeDetails.newSignupsThisWeek}</div>
                  <div className="text-[#F5EBD8]/60 text-xs mt-0.5">New This Week</div>
                </div>
              </div>
              {nudgeDetails.errors && nudgeDetails.errors.length > 0 && (
                <div className="bg-red-900/30 rounded-xl px-3 py-2 border border-red-500/30">
                  <div className="text-xs font-bold text-red-400 mb-1">Errors ({nudgeDetails.errors.length})</div>
                  <ul className="text-xs text-red-300/80 space-y-0.5 max-h-24 overflow-y-auto">
                    {nudgeDetails.errors.map((e, i) => <li key={i}>{typeof e === "object" ? JSON.stringify(e) : String(e ?? "")}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Auto-schedule: cron URL for external scheduler */}
          <div className="mt-4 bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#F5EBD8]">Auto-Schedule Weekly Nudge</span>
            </div>
            <p className="text-xs text-[#F5EBD8]/50 mb-3">
              Set <code className="bg-white/10 px-1 rounded">ADMIN_CRON_KEY</code> in environment secrets, then point any weekly cron service (GitHub Actions, Render Cron, EasyCron, etc.) at this URL:
            </p>
            <code className="block text-xs bg-black/30 rounded-lg px-3 py-2 text-[#CA922B] break-all select-all">
              GET https://www.mappingwithmelanin.com/api/admin/cron-weekly-nudge?key=YOUR_ADMIN_CRON_KEY
            </code>
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
              {secondsSinceUpdate < 5
                ? "Just updated"
                : secondsSinceUpdate < 60
                ? `Updated ${secondsSinceUpdate}s ago`
                : `Updated ${Math.floor(secondsSinceUpdate / 60)}m ago`}
            </span>
            <button
              onClick={() => refreshAll()}
              className="flex items-center gap-1.5 text-xs text-[#3A1F0E]/50 hover:text-[#3A1F0E] transition-colors py-1 px-2 rounded-lg hover:bg-[#FAF6EF]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {tab === "waitlist" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors py-1 px-3 rounded-lg border border-[#CA922B]/30 hover:bg-[#CA922B]/5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={async () => {
                    setAuditLoading(true);
                    setAuditError(null);
                    try {
                      const r = await fetch(`${BASE}api/admin/waitlist/audit`, { credentials: "include" });
                      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `HTTP ${r.status}`); }
                      setAuditData(await r.json());
                    } catch (e) {
                      setAuditError(String(e));
                    } finally {
                      setAuditLoading(false);
                    }
                  }}
                  disabled={auditLoading}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors py-1 px-3 rounded-lg border border-blue-400/40 hover:bg-blue-50 disabled:opacity-50"
                >
                  {auditLoading ? <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                  {auditLoading ? "Running…" : "Run Import Audit"}
                </button>
              </div>
            )}
            {tab === "businesses" && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setShowAddBusiness(true); setAddBizSuccess(null); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors py-1 px-3 rounded-lg border border-[#CA922B]/30 hover:bg-[#CA922B]/5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Business
                </button>
                <a
                  href={`${BASE}api/admin/businesses/export-csv`}
                  download
                  className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors py-1 px-3 rounded-lg border border-[#CA922B]/30 hover:bg-[#CA922B]/5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Leads CSV ({businesses.length})
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {tab === "waitlist" && (selected.size > 0 || selectAllFiltered) && (
        <div className="bg-[#2B1507] text-white px-6 py-3 flex items-center gap-4">
          <div className="max-w-6xl mx-auto w-full flex flex-col gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold text-[#CA922B]">
                {selectAllFiltered ? `All ${waitlistTotal.toLocaleString()} entries selected` : `${selected.size} selected`}
              </span>
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
                onClick={() => { setSelected(new Set()); setSelectAllFiltered(false); }}
                className="ml-auto text-[#F5EBD8]/50 hover:text-white text-xs"
              >
                Clear selection
              </button>
            </div>
            {/* Cross-page select all filtered banner */}
            {!selectAllFiltered && selected.size === waitlist.length && waitlistTotalPages > 1 && (
              <div className="text-xs text-[#F5EBD8]/70 flex items-center gap-2">
                <span>All {waitlist.length} entries on this page are selected.</span>
                <button
                  onClick={() => setSelectAllFiltered(true)}
                  className="underline text-[#CA922B] hover:text-amber-300 font-semibold"
                >
                  Select all {waitlistTotal.toLocaleString()} matching entries instead
                </button>
              </div>
            )}
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

            {/* ── Import Audit Results ──────────────────────────────────── */}
            {auditError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
                <strong>Audit failed:</strong> {auditError}
              </div>
            )}
            {auditData && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <h3 className="font-bold text-sm text-blue-800 uppercase tracking-wider">Production Import Audit</h3>
                  </div>
                  <span className="text-xs text-blue-500">{new Date(auditData.runAt).toLocaleString()}</span>
                </div>

                {/* Waitlist by status */}
                <div>
                  <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Waitlist by Status</div>
                  <div className="flex flex-wrap gap-2">
                    {auditData.waitlistByStatus.map(r => (
                      <span key={r.status} className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono">
                        <span className="font-bold text-blue-800">{r.total}</span> <span className="text-blue-500">{r.status}</span>
                      </span>
                    ))}
                    {auditData.waitlistByStatus.length === 0 && <span className="text-xs text-blue-400 italic">No waitlist rows found</span>}
                  </div>
                </div>

                {/* Overlap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Import Emails Already in Waitlist ({auditData.waitlistOverlap.count} of {auditData.importEmailCount})
                    </div>
                    {auditData.waitlistOverlap.rows.length === 0
                      ? <p className="text-xs text-green-700 font-semibold">None — all 55 emails are new</p>
                      : <div className="space-y-0.5 max-h-40 overflow-y-auto">
                          {auditData.waitlistOverlap.rows.map(r => (
                            <div key={r.email} className="text-xs font-mono bg-white border border-blue-100 rounded px-2 py-0.5 flex justify-between">
                              <span className="text-blue-800 truncate">{r.email}</span>
                              <span className="ml-2 text-blue-400 shrink-0">{r.status}</span>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Import Emails with Registered Accounts ({auditData.userOverlap.count} of {auditData.importEmailCount})
                    </div>
                    {auditData.userOverlap.rows.length === 0
                      ? <p className="text-xs text-green-700 font-semibold">None — no accounts yet</p>
                      : <div className="space-y-0.5 max-h-40 overflow-y-auto">
                          {auditData.userOverlap.rows.map(r => (
                            <div key={r.email} className="text-xs font-mono bg-white border border-blue-100 rounded px-2 py-0.5 flex justify-between">
                              <span className="text-blue-800 truncate">{r.email}</span>
                              <span className="ml-2 text-blue-400 shrink-0">{r.role}</span>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                </div>

                {/* Users + Content */}
                {auditData.usersOverview && (
                  <div>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Production Accounts</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(auditData.usersOverview).map(([k, v]) => (
                        <span key={k} className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono">
                          <span className="font-bold text-blue-800">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}</span> <span className="text-blue-500">{k.replace(/_/g, " ")}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {auditData.contentCounts && (
                  <div>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">User-Generated Content</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(auditData.contentCounts).map(([k, v]) => (
                        <span key={k} className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono">
                          <span className="font-bold text-blue-800">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}</span> <span className="text-blue-500">{k.replace(/_/g, " ")}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-blue-500 italic">Share a screenshot of this panel — it gives everything needed to complete the import plan.</p>
              </div>
            )}

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
                          <input type="checkbox" checked={(selected.size === waitlist.length && waitlist.length > 0) || selectAllFiltered} onChange={toggleSelectAll} className="rounded accent-[#CA922B]" />
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

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: "all", label: `All (${businesses.length})` },
                { key: "permanently_closed", label: `⚠️ Permanently Closed (${permanentlyClosedCount})`, warn: permanentlyClosedCount > 0 },
                { key: "needs_review", label: `🔍 Needs Review (${needsReviewCount})`, warn: needsReviewCount > 0 },
                { key: "archived", label: `📦 Archived (${archivedCount})` },
              ] as const).map(({ key, label, warn }) => (
                <button
                  key={key}
                  onClick={() => setBizStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    bizStatusFilter === key
                      ? "bg-[#2B1507] text-white"
                      : warn
                        ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        : "bg-white border border-[#3A1F0E]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {bizStatusFilter === "permanently_closed" && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <strong>Action needed:</strong> These businesses were marked permanently closed by Google Places during enrichment. Review each one and click <strong>Archive</strong> to remove it from the live directory, or leave it if you believe Google is incorrect.
              </div>
            )}
            {bizStatusFilter === "needs_review" && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                These businesses had low-confidence Google Places matches or other data quality flags. Review their contact info before promoting to a claimed listing.
              </div>
            )}

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
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Edit</th>
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
                            {biz.blackOwned && <span className="px-2 py-0.5 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold">Black-Owned</span>}
                            {biz.permanentlyClosed && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">Perm. Closed</span>}
                            {biz.needsVerification && !biz.permanentlyClosed && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Needs Review</span>}
                            {biz.listingStatus === "archived" && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">Archived</span>}
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
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => setEditingBiz({ id: biz.id, name: biz.name })}
                              className="flex items-center gap-1 text-xs font-bold text-[#CA922B] hover:text-[#B38024] border border-[#CA922B]/30 hover:bg-[#CA922B]/5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              ✏️ Edit
                            </button>
                            {biz.listingStatus !== "archived" ? (
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`Archive "${biz.name}"? It will be removed from the live directory but not deleted.`)) return;
                                  try {
                                    const r = await fetch(`${BASE}api/admin/businesses/${biz.id}/listing-status`, {
                                      method: "PATCH", credentials: "include",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ listingStatus: "archived" }),
                                    });
                                    if (r.ok) loadBusinesses();
                                  } catch { /* ignore */ }
                                }}
                                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                📦 Archive
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`${BASE}api/admin/businesses/${biz.id}/listing-status`, {
                                      method: "PATCH", credentials: "include",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ listingStatus: "live_unclaimed" }),
                                    });
                                    if (r.ok) loadBusinesses();
                                  } catch { /* ignore */ }
                                }}
                                className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                ♻️ Restore
                              </button>
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
        ) : tab === "reviews" ? (
          <div className="space-y-8">
            {/* ── Pending Moderation Queue ── */}
            {(() => {
              const pending = reviews.filter(r => r.status === "pending_review");
              return (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">Pending Moderation Queue</h2>
                    {pending.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{pending.length} awaiting review</span>
                    )}
                  </div>
                  <p className="text-sm text-[#3A1F0E]/60 mb-4">
                    Negative reviews (≤ 3★) for businesses are held here before going public. Approve to publish, or reject to remove.
                  </p>
                  {pending.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center text-green-700">
                      <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">Queue is clear — no reviews pending moderation.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-orange-100 bg-orange-50">
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Author</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Business</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Rating</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Review</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-orange-700/70">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pending.map((review, i) => (
                            <tr key={review.id} className={`border-b border-orange-50 hover:bg-orange-50/40 transition-colors ${i % 2 === 0 ? "" : "bg-orange-50/20"}`}>
                              <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                                {review.authorName ?? <span className="text-[#3A1F0E]/30">—</span>}
                              </td>
                              <td className="px-4 py-3 text-[#3A1F0E]/70 text-xs max-w-[140px]">
                                <span className="font-medium">{review.businessName ?? review.businessId.slice(0, 8) + "…"}</span>
                                <span className="block text-[#3A1F0E]/40 mt-0.5">Not minority-owned</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-0.5 font-bold text-red-500">
                                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#3A1F0E]/70 max-w-xs">
                                {review.text ? (
                                  <span className="line-clamp-3">{review.text}</span>
                                ) : <span className="text-[#3A1F0E]/30 text-xs">No text</span>}
                              </td>
                              <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs whitespace-nowrap">
                                {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => decideReview(review.id, "approve")}
                                    disabled={updating === review.id + "-approve" || updating === review.id + "-reject"}
                                    className="h-7 px-3 rounded-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {updating === review.id + "-approve" ? "…" : "Approve"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => decideReview(review.id, "reject")}
                                    disabled={updating === review.id + "-approve" || updating === review.id + "-reject"}
                                    className="h-7 px-3 rounded-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    {updating === review.id + "-reject" ? "…" : "Reject"}
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
              );
            })()}

            {/* ── All Published Reviews ── */}
            {(() => {
              const published = reviews.filter(r => r.status !== "pending_review");
              return (
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4">Published Reviews ({published.length})</h2>
                  {published.length === 0 ? (
                    <div className="text-center py-20 text-[#3A1F0E]/40">
                      <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No published reviews yet.</p>
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
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {published.map((review, i) => (
                            <tr key={review.id} className={`border-b border-[#3A1F0E]/5 hover:bg-[#FAF6EF]/50 transition-colors ${i % 2 === 0 ? "" : "bg-[#FAF6EF]/30"}`}>
                              <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                                {review.authorName ?? <span className="text-[#3A1F0E]/30">—</span>}
                              </td>
                              <td className="px-4 py-3 text-[#3A1F0E]/60 text-xs">
                                {review.businessName ?? review.businessId.slice(0, 8) + "…"}
                              </td>
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
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  review.status === "auto_approved" ? "bg-green-100 text-green-700" :
                                  review.status === "pending_video" ? "bg-blue-100 text-blue-700" :
                                  "bg-[#3A1F0E]/10 text-[#3A1F0E]/60"
                                }`}>
                                  {review.status === "auto_approved" ? "5★ Auto" : review.status === "pending_video" ? "Video Review" : "Posted"}
                                </span>
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
              );
            })()}
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

        {/* ── Global Recs tab ─────────────────────────────────────────────── */}
        {tab === "global-recs" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#3A1F0E]">Global Recommendations Review</h2>
                <p className="text-[#3A1F0E]/60 text-sm mt-0.5">Approve or reject community-submitted place recommendations from around the world.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { void loadPendingGlobalRecs(); }} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            {globalRecsLoading && <div className="text-center py-12 text-[#3A1F0E]/40 text-sm">Loading…</div>}

            {!globalRecsLoading && pendingGlobalRecs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E8D5B7]">
                <Globe className="w-10 h-10 text-[#3A1F0E]/15 mx-auto mb-3" />
                <p className="font-bold text-[#3A1F0E]/40">No recommendations in queue</p>
              </div>
            )}

            {!globalRecsLoading && pendingGlobalRecs.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E8D5B7] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8D5B7] bg-[#FAF6EF]">
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Place</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Location</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Contributor</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Reason</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">Badge</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D5B7]">
                      {pendingGlobalRecs.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#2B1507]">{rec.businessName}</div>
                            <div className="text-[#3A1F0E]/50 text-xs capitalize">{rec.type.replace(/_/g, " ")}</div>
                            {rec.website && (
                              <a href={rec.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#CA922B] text-xs mt-0.5 hover:underline">
                                <ExternalLink className="w-3 h-3" /> Website
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#3A1F0E]/70 text-xs">
                            {rec.city ? `${rec.city}, ` : ""}{rec.country}
                          </td>
                          <td className="px-4 py-3 text-[#3A1F0E]/70 text-xs">
                            {rec.contributorFirstName ?? "—"}
                            {rec.contributorHomeCity && <div className="text-[#3A1F0E]/40">{rec.contributorHomeCity}</div>}
                          </td>
                          <td className="px-4 py-3 text-[#3A1F0E]/60 text-xs max-w-[200px]">
                            <div className="line-clamp-2">{rec.reason ?? "—"}</div>
                            {rec.personalConnection && <div className="text-[#3A1F0E]/40 mt-0.5 italic line-clamp-1">{rec.personalConnection}</div>}
                          </td>
                          <td className="px-4 py-3">{statusBadge(rec.status)}</td>
                          <td className="px-4 py-3 text-[#3A1F0E]/50 text-xs">{rec.badge ?? "—"}</td>
                          <td className="px-4 py-3">
                            {rec.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" disabled={globalRecUpdating === rec.id}
                                  className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white rounded-full gap-1"
                                  onClick={async () => {
                                    setGlobalRecUpdating(rec.id);
                                    await fetch(`${BASE}api/global-recommendations/${rec.id}/status`, {
                                      method: "PATCH", credentials: "include",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: "approved" }),
                                    });
                                    await loadPendingGlobalRecs();
                                    setGlobalRecUpdating(null);
                                  }}>
                                  <Check className="w-3 h-3" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" disabled={globalRecUpdating === rec.id}
                                  className="h-7 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-full gap-1"
                                  onClick={async () => {
                                    setGlobalRecUpdating(rec.id);
                                    await fetch(`${BASE}api/global-recommendations/${rec.id}/status`, {
                                      method: "PATCH", credentials: "include",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: "rejected" }),
                                    });
                                    await loadPendingGlobalRecs();
                                    setGlobalRecUpdating(null);
                                  }}>
                                  <X className="w-3 h-3" /> Reject
                                </Button>
                              </div>
                            )}
                            {rec.status !== "pending" && (
                              <Button size="sm" variant="outline" disabled={globalRecUpdating === rec.id}
                                className="h-7 px-3 text-xs rounded-full gap-1"
                                onClick={async () => {
                                  setGlobalRecUpdating(rec.id);
                                  await fetch(`${BASE}api/global-recommendations/${rec.id}/status`, {
                                    method: "PATCH", credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "pending" }),
                                  });
                                  await loadPendingGlobalRecs();
                                  setGlobalRecUpdating(null);
                                }}>
                                <Clock className="w-3 h-3" /> Reset
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weekly nudge confirmation modal */}
      {nudgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A0E00] border border-[#CA922B]/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#CA922B]/20 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-[#CA922B]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5EBD8]">Send Weekly Nudge?</h3>
                <p className="text-xs text-[#F5EBD8]/50 mt-0.5">This will email every pending waitlist member</p>
              </div>
            </div>
            <p className="text-sm text-[#F5EBD8]/70 mb-5">
              A nudge email will be sent to all pending waitlist members who haven't already received one this week.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setNudgeConfirmOpen(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold text-[#F5EBD8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendWeeklyNudge}
                className="flex-1 bg-[#CA922B] hover:bg-[#CA922B]/80 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Send Nudge
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Production Health tab ─────────────────────────────────────────── */}
      {tab === "health" && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#3A1F0E]">Production Health Monitor</h2>
              <p className="text-[#3A1F0E]/60 text-sm mt-0.5">
                Live DB pool stats, health checks, and escalation matrix. Auto-refreshes every hour.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {healthCountdown !== null && (
                <span className="text-xs text-[#3A1F0E]/40">
                  Next refresh in {Math.floor(healthCountdown / 60)}m {healthCountdown % 60}s
                </span>
              )}
              <Button size="sm" variant="outline" onClick={() => void loadHealth()} disabled={healthLoading} className="gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} /> Check Now
              </Button>
            </div>
          </div>

          {healthLoading && !health && (
            <div className="text-center py-12 text-[#3A1F0E]/40 text-sm">Running health checks…</div>
          )}

          {health && (
            <>
              <div className={`rounded-2xl border px-6 py-4 flex items-center gap-4 ${
                health.status === "ok"       ? "bg-green-50 border-green-200" :
                health.status === "degraded" ? "bg-amber-50 border-amber-200" :
                                               "bg-red-50 border-red-200"
              }`}>
                <div className={`w-4 h-4 rounded-full shrink-0 ${
                  health.status === "ok"       ? "bg-green-500" :
                  health.status === "degraded" ? "bg-amber-500" :
                                                 "bg-red-500"
                }`} />
                <div>
                  <span className={`font-bold text-lg ${
                    health.status === "ok"       ? "text-green-700" :
                    health.status === "degraded" ? "text-amber-700" :
                                                   "text-red-700"
                  }`}>
                    {health.status === "ok" ? "HEALTHY" : health.status === "degraded" ? "DEGRADED" : "DOWN"}
                  </span>
                  <span className="text-[#3A1F0E]/50 text-sm ml-3">
                    Checked {new Date(health.checkedAt).toLocaleTimeString()} · Uptime {Math.floor(health.uptimeSeconds / 3600)}h {Math.floor((health.uptimeSeconds % 3600) / 60)}m
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">Connection Pool</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Active",       value: health.poolStats.total,                       sub: `/ ${health.poolConfig.max} max` },
                    { label: "Idle",         value: health.poolStats.idle,                        sub: "free connections" },
                    { label: "Waiting",      value: health.poolStats.waiting,                     sub: health.poolStats.waiting > 2 ? "⚠ high" : "queued" },
                    { label: "Idle Timeout", value: `${health.poolConfig.idleTimeoutMs / 1000}s`, sub: "recycle after" },
                    { label: "Max Lifetime", value: `${health.poolConfig.maxLifetimeS / 60}m`,    sub: "hard recycle" },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-xl border border-[#E8D5B7] p-4">
                      <div className={`text-2xl font-bold ${m.label === "Waiting" && health.poolStats.waiting > 2 ? "text-amber-600" : "text-[#CA922B]"}`}>{m.value}</div>
                      <div className="text-xs font-semibold text-[#3A1F0E]/70 mt-0.5">{m.label}</div>
                      <div className="text-xs text-[#3A1F0E]/40">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">DB Health Checks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Raw SQL (SELECT 1)",       ok: health.checks.rawSql,  ms: health.checks.rawSqlMs },
                    { label: "Drizzle ORM (businesses)", ok: health.checks.drizzle, ms: health.checks.drizzleMs },
                  ].map((c) => (
                    <div key={c.label} className={`rounded-xl border p-4 flex items-center gap-3 ${c.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      {c.ok ? <Check className="w-5 h-5 text-green-600 shrink-0" /> : <X className="w-5 h-5 text-red-600 shrink-0" />}
                      <div>
                        <div className="font-semibold text-[#3A1F0E] text-sm">{c.label}</div>
                        <div className="text-xs text-[#3A1F0E]/50">{c.ok ? `${c.ms ?? "?"}ms` : "FAILED"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KinfolkAI Generation Queue */}
              {health.kinfolkAI && (
                <div>
                  <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">KinfolkAI Generation Queue</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Active Now",
                        value: health.kinfolkAI.activeGenerations,
                        sub: `/ ${health.kinfolkAI.concurrencyCap} cap`,
                        warn: health.kinfolkAI.activeGenerations >= health.kinfolkAI.concurrencyCap,
                      },
                      {
                        label: "Queued",
                        value: health.kinfolkAI.queuedGenerations,
                        sub: `/ ${health.kinfolkAI.queueMax} max`,
                        warn: health.kinfolkAI.queuedGenerations > 10,
                      },
                      {
                        label: "Rate Limits (60m)",
                        value: health.kinfolkAI.tpmEventsLast60m,
                        sub: health.kinfolkAI.tpmEventsLast60m === 0 ? "none — good" : "TPM 429 retries",
                        warn: health.kinfolkAI.tpmEventsLast60m > 0,
                      },
                      {
                        label: "Last Rate Limit",
                        value: health.kinfolkAI.tpmEventsMostRecentAt
                          ? new Date(health.kinfolkAI.tpmEventsMostRecentAt).toLocaleTimeString()
                          : "—",
                        sub: health.kinfolkAI.tpmEventsMostRecentAt ? "retried automatically" : "no events",
                        warn: false,
                      },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-xl border p-4 ${m.warn ? "bg-amber-50 border-amber-200" : "bg-white border-[#E8D5B7]"}`}>
                        <div className={`text-2xl font-bold ${m.warn ? "text-amber-600" : "text-[#CA922B]"}`}>{m.value}</div>
                        <div className="text-xs font-semibold text-[#3A1F0E]/70 mt-0.5">{m.label}</div>
                        <div className="text-xs text-[#3A1F0E]/40">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  {health.kinfolkAI.tpmEventsLast60m > 5 && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <p className="text-xs text-amber-800">
                        <span className="font-bold">{health.kinfolkAI.tpmEventsLast60m} TPM rate-limit events</span> in the past hour.
                        KinfolkAI is retrying automatically, but sustained load may slow responses.
                        Consider scheduling heavy usage at off-peak times or requesting a higher OpenAI TPM limit.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">Load Test Baseline</h3>
                <div className="bg-white rounded-2xl border border-[#E8D5B7] p-5">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div><span className="text-[#3A1F0E]/50">Concurrent:</span> <span className="font-bold text-[#3A1F0E]">{health.loadTestBaseline.concurrentRequests}</span></div>
                    <div><span className="text-[#3A1F0E]/50">Success rate:</span> <span className="font-bold text-green-700">{health.loadTestBaseline.successRate}</span></div>
                    <div><span className="text-[#3A1F0E]/50">Max latency:</span> <span className="font-bold text-[#3A1F0E]">{health.loadTestBaseline.maxMs}ms</span></div>
                    <div><span className="text-[#3A1F0E]/50">Tested:</span> <span className="font-bold text-[#3A1F0E]">{health.loadTestBaseline.testedAt}</span></div>
                  </div>
                  <p className="text-xs text-[#3A1F0E]/40 mt-2">{health.loadTestBaseline.note}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3A1F0E]/70 uppercase tracking-wider mb-3">Escalation Matrix</h3>
                <div className="bg-white rounded-2xl border border-[#E8D5B7] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF6EF] border-b border-[#E8D5B7]">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70 w-24">Level</th>
                        <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Condition</th>
                        <th className="px-4 py-3 text-left font-bold text-[#3A1F0E]/70">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D5B7]/60">
                      {health.escalationMatrix.map((row) => (
                        <tr key={row.level} className="hover:bg-[#FAF6EF]/50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              row.level === "GREEN"    ? "bg-green-100 text-green-700" :
                              row.level === "YELLOW"   ? "bg-yellow-100 text-yellow-700" :
                              row.level === "ORANGE"   ? "bg-orange-100 text-orange-700" :
                              row.level === "RED"      ? "bg-red-100 text-red-700" :
                                                         "bg-red-900 text-white"
                            }`}>{row.level}</span>
                          </td>
                          <td className="px-4 py-3 text-[#3A1F0E]/70 text-xs">{row.condition}</td>
                          <td className="px-4 py-3 text-[#3A1F0E] text-xs font-medium">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── City Launches ─────────────────────────────────────────────── */}
      {tab === "cities" && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#3A1F0E]">City Launch Dashboard</h2>
              <p className="text-[#3A1F0E]/60 text-sm mt-0.5">
                Operational playbook for every city. Track readiness, metrics, and launch status in one place.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadCityLaunches()} disabled={cityLaunchesLoading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${cityLaunchesLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {cityLaunchesLoading && cityLaunches.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!selectedCity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityLaunches.map((city) => {
                const statusColors: Record<string, string> = {
                  live:        "bg-green-100 text-green-700 border-green-200",
                  soft_launch: "bg-blue-100 text-blue-700 border-blue-200",
                  pre_launch:  "bg-amber-100 text-amber-700 border-amber-200",
                  planning:    "bg-[#3A1F0E]/10 text-[#3A1F0E]/60 border-[#3A1F0E]/10",
                  paused:      "bg-red-100 text-red-700 border-red-200",
                };
                const statusLabel: Record<string, string> = {
                  live: "Live", soft_launch: "Soft Launch", pre_launch: "Pre-Launch",
                  planning: "Planning", paused: "Paused",
                };
                const sc = statusColors[city.status] ?? statusColors.planning;
                const p = city.checklistProgress;
                return (
                  <button
                    key={city.slug}
                    onClick={() => setSelectedCity(city)}
                    className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5 text-left hover:border-[#CA922B]/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#3A1F0E]/30">#{city.sequenceOrder}</span>
                        <h3 className="font-bold text-[#3A1F0E] text-lg leading-tight">{city.city}</h3>
                        <span className="text-sm text-[#3A1F0E]/40">{city.state}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {city.healthLevel === "critical" && (
                          <span title="Health critical" className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        )}
                        {city.healthLevel === "warning" && (
                          <span title="Health warning" className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sc}`}>
                          {statusLabel[city.status] ?? city.status}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#3A1F0E]/50">Checklist</span>
                        <span className="font-bold text-[#3A1F0E]">{p.completed}/{p.total}</span>
                      </div>
                      <div className="h-2 bg-[#FAF6EF] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.pct === 100 ? "bg-green-500" : p.pct > 50 ? "bg-[#CA922B]" : "bg-[#CA922B]/40"}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Waitlist", val: city.metrics.waitlistSize },
                        { label: "Members", val: city.metrics.activeMembers },
                        { label: "Businesses", val: city.metrics.businessesOnboarded },
                      ].map(m => (
                        <div key={m.label} className="bg-[#FAF6EF] rounded-xl px-2 py-1.5 text-center">
                          <div className="text-base font-bold text-[#3A1F0E]">{m.val.toLocaleString()}</div>
                          <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-[#CA922B] font-medium group-hover:underline">View checklist →</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status advancement banner */}
              {cityStatusBanner && (
                <div className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium ${cityStatusBanner.newStatus === "live" ? "bg-green-50 border border-green-200 text-green-800" : "bg-[#CA922B]/10 border border-[#CA922B]/30 text-[#3A1F0E]"}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {cityStatusBanner.message}
                  </div>
                  <button onClick={() => setCityStatusBanner(null)} className="text-current opacity-50 hover:opacity-100 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1 1 13"/></svg>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCity(null)}
                    className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 hover:text-[#3A1F0E] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4 6 8l4 4"/></svg>
                    All Cities
                  </button>
                  <h3 className="text-xl font-bold text-[#3A1F0E]">
                    {selectedCity.city}, {selectedCity.state}
                    <span className="ml-2 text-sm font-normal text-[#3A1F0E]/40">#{selectedCity.sequenceOrder}</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={async () => {
                      await fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/status`, {
                        method: "PATCH", credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ autoAdvance: !selectedCity.autoAdvance }),
                      });
                      await loadCityLaunches();
                    }}
                    title={selectedCity.autoAdvance ? "Auto-advance is ON — click to switch to notify-only" : "Auto-advance is OFF — click to enable"}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${selectedCity.autoAdvance ? "bg-green-50 border-green-200 text-green-700" : "bg-[#FAF6EF] border-[#3A1F0E]/20 text-[#3A1F0E]/50"}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4"/></svg>
                    {selectedCity.autoAdvance ? "Auto-advance on" : "Auto-advance off"}
                  </button>
                  <span className="text-xs text-[#3A1F0E]/30 select-none">|</span>
                  <span className="text-xs text-[#3A1F0E]/50">Status:</span>
                  {(["planning","pre_launch","soft_launch","live","paused"] as const).map(s => (
                    <button
                      key={s}
                      disabled={cityStatusUpdating === selectedCity.slug}
                      onClick={async () => {
                        if (selectedCity.status === s) return;
                        setCityStatusUpdating(selectedCity.slug);
                        try {
                          await fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/status`, {
                            method: "PATCH", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: s }),
                          });
                          await loadCityLaunches();
                        } finally { setCityStatusUpdating(null); }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        selectedCity.status === s
                          ? s === "live" ? "bg-green-600 text-white border-green-600"
                          : s === "soft_launch" ? "bg-blue-600 text-white border-blue-600"
                          : s === "paused" ? "bg-red-600 text-white border-red-600"
                          : "bg-[#3A1F0E] text-white border-[#3A1F0E]"
                          : "bg-white text-[#3A1F0E]/50 border-[#3A1F0E]/20 hover:border-[#3A1F0E]/40"
                      }`}
                    >
                      {s === "pre_launch" ? "Pre-Launch" : s === "soft_launch" ? "Soft Launch" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Go Live — promotes staged businesses, hides demo pins, marks city live ── */}
              {selectedCity.status !== "live" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-green-900 text-sm">Ready to go live?</div>
                    <div className="text-green-700 text-xs mt-0.5">
                      Promotes {selectedCity.city} staged businesses to live · hides demo pins · marks city as live
                    </div>
                  </div>
                  <button
                    disabled={triggerLaunching === selectedCity.slug}
                    onClick={async () => {
                      if (!confirm(`Launch ${selectedCity.city}, ${selectedCity.state}?\n\nThis will:\n• Promote all staged businesses to live\n• Hide demo/seed pins\n• Mark city as live\n\nThis cannot be undone.`)) return;
                      setTriggerLaunching(selectedCity.slug);
                      try {
                        const r = await fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/trigger-launch`, {
                          method: "POST", credentials: "include",
                        });
                        const data = await r.json();
                        if (data.ok) {
                          setCityStatusBanner({ message: data.message ?? `🚀 ${selectedCity.city} is now live!`, newStatus: "live" });
                          await loadCityLaunches();
                        } else {
                          alert(data.error ?? "Launch failed — check the console.");
                        }
                      } finally {
                        setTriggerLaunching(null);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
                  >
                    {triggerLaunching === selectedCity.slug ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.5-1.5 3-1.5 3s1.5 0 3-1.5L20 4l-4-4z M12 8 8 12"/>
                      </svg>
                    )}
                    {triggerLaunching === selectedCity.slug ? "Launching…" : "🚀 Go Live"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Waitlist", val: selectedCity.metrics.waitlistSize, color: "text-[#CA922B]" },
                  { label: "Active Members", val: selectedCity.metrics.activeMembers, color: "text-green-600" },
                  { label: "Businesses", val: selectedCity.metrics.businessesOnboarded, color: "text-blue-600" },
                  { label: "Events", val: selectedCity.metrics.eventsLive, color: "text-purple-600" },
                  { label: "Ambassadors", val: selectedCity.metrics.ambassadorCount, color: "text-amber-600" },
                  { label: "Community Posts", val: selectedCity.metrics.communityPosts, color: "text-teal-600" },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-2xl border border-[#3A1F0E]/10 px-4 py-3 text-center">
                    <div className={`text-2xl font-bold ${m.color}`}>{m.val.toLocaleString()}</div>
                    <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Trend sparklines */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#3A1F0E]">30-Day Growth Trend</h4>
                  {cityTrendLoading && (
                    <div className="w-4 h-4 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
                  )}
                  {!cityTrendLoading && cityTrend.length === 0 && (
                    <span className="text-xs text-[#3A1F0E]/40">No data yet — updates each time this tab loads</span>
                  )}
                  {!cityTrendLoading && cityTrend.length > 0 && (
                    <span className="text-xs text-[#3A1F0E]/40">{cityTrend.length} day{cityTrend.length !== 1 ? "s" : ""} of data</span>
                  )}
                </div>
                {cityTrend.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { key: "waitlist" as const, label: "Waitlist Growth", color: "#CA922B" },
                      { key: "members" as const, label: "Active Members", color: "#16a34a" },
                    ].map(({ key, label, color }) => {
                      const latest = cityTrend[cityTrend.length - 1]?.[key] ?? 0;
                      const first = cityTrend[0]?.[key] ?? 0;
                      const delta = latest - first;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#3A1F0E]">{label}</span>
                            <span className="text-xs font-bold" style={{ color }}>
                              {latest.toLocaleString()}
                              {delta !== 0 && (
                                <span className={`ml-1.5 ${delta > 0 ? "text-green-600" : "text-red-500"}`}>
                                  {delta > 0 ? "+" : ""}{delta.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                          <ResponsiveContainer width="100%" height={80}>
                            <LineChart data={cityTrend} margin={{ top: 2, right: 4, left: 0, bottom: 2 }}>
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={["auto", "auto"]} />
                              <Tooltip
                                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2d5c3", background: "#fffbf5" }}
                                labelFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                formatter={(v: number) => [v.toLocaleString(), label]}
                              />
                              <Line
                                type="monotone"
                                dataKey={key}
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 3, fill: color }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>
                ) : !cityTrendLoading ? (
                  <div className="h-20 flex items-center justify-center text-sm text-[#3A1F0E]/30">
                    Trend data will appear here after the dashboard is opened on multiple days.
                  </div>
                ) : null}
              </div>

              {/* Health Signals */}
              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#3A1F0E]">Health Signals</h4>
                    {cityHealth && cityHealth.level !== "ok" && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cityHealth.level === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {cityHealth.level === "critical" ? "Critical" : "Warning"}
                      </span>
                    )}
                    {cityHealth && cityHealth.level === "ok" && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Healthy</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {cityHealth && (
                      <span className="text-xs text-[#3A1F0E]/40">DB {cityHealth.probeMs}ms · pool {cityHealth.poolStats.total}/{cityHealth.poolStats.idle} idle</span>
                    )}
                    {cityHealthLoading && (
                      <div className="w-4 h-4 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
                {cityHealth ? (
                  <div className="space-y-2">
                    {cityHealth.signals.map((sig, i) => (
                      <div key={i} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                        sig.level === "critical" ? "bg-red-50 border border-red-200 text-red-800"
                        : sig.level === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800"
                        : "bg-green-50 border border-green-200 text-green-800"
                      }`}>
                        {sig.level === "critical" ? (
                          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                        ) : sig.level === "warning" ? (
                          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
                        ) : (
                          <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        )}
                        {sig.message}
                      </div>
                    ))}
                    {/* API error rate + response time */}
                    {cityHealth.requestMetrics && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className={`rounded-xl px-3 py-2.5 text-center border ${
                          cityHealth.requestMetrics.errorRatePct !== null && cityHealth.requestMetrics.errorRatePct >= 20
                            ? "bg-red-50 border-red-200"
                            : cityHealth.requestMetrics.errorRatePct !== null && cityHealth.requestMetrics.errorRatePct >= 5
                            ? "bg-amber-50 border-amber-200"
                            : "bg-[#FAF6EF] border-transparent"
                        }`}>
                          <div className={`text-base font-bold ${
                            cityHealth.requestMetrics.errorRatePct !== null && cityHealth.requestMetrics.errorRatePct >= 20
                              ? "text-red-700"
                              : cityHealth.requestMetrics.errorRatePct !== null && cityHealth.requestMetrics.errorRatePct >= 5
                              ? "text-amber-700"
                              : "text-[#3A1F0E]"
                          }`}>
                            {cityHealth.requestMetrics.errorRatePct !== null
                              ? `${cityHealth.requestMetrics.errorRatePct}%`
                              : "—"}
                          </div>
                          <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide mt-0.5">Error rate (24h)</div>
                          {cityHealth.requestMetrics.totalRequests > 0 && (
                            <div className="text-[10px] text-[#3A1F0E]/30 mt-0.5">
                              {cityHealth.requestMetrics.totalErrors}/{cityHealth.requestMetrics.totalRequests} reqs
                            </div>
                          )}
                        </div>
                        <div className={`rounded-xl px-3 py-2.5 text-center border ${
                          cityHealth.requestMetrics.avgResponseMs >= 2000
                            ? "bg-red-50 border-red-200"
                            : cityHealth.requestMetrics.avgResponseMs >= 800
                            ? "bg-amber-50 border-amber-200"
                            : "bg-[#FAF6EF] border-transparent"
                        }`}>
                          <div className={`text-base font-bold ${
                            cityHealth.requestMetrics.avgResponseMs >= 2000
                              ? "text-red-700"
                              : cityHealth.requestMetrics.avgResponseMs >= 800
                              ? "text-amber-700"
                              : "text-[#3A1F0E]"
                          }`}>
                            {cityHealth.requestMetrics.totalRequests > 0
                              ? `${cityHealth.requestMetrics.avgResponseMs}ms`
                              : "—"}
                          </div>
                          <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide mt-0.5">Avg response (24h)</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {[
                        { label: "Signups 24h", val: cityHealth.activity.signups24h },
                        { label: "Signups 7d", val: cityHealth.activity.signups7d },
                        { label: "Posts 24h", val: cityHealth.activity.posts24h },
                        { label: "Posts 7d", val: cityHealth.activity.posts7d },
                      ].map(m => (
                        <div key={m.label} className="bg-[#FAF6EF] rounded-xl px-2 py-2 text-center">
                          <div className="text-base font-bold text-[#3A1F0E]">{m.val}</div>
                          <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : cityHealthLoading ? (
                  <div className="h-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-sm text-[#3A1F0E]/30">
                    Health data unavailable
                  </div>
                )}
              </div>

              {(["pre_launch","community","marketing","operations"] as const).map(section => {
                const sectionLabels: Record<string, string> = {
                  pre_launch: "Pre-Launch", community: "Community",
                  marketing: "Marketing", operations: "Operations",
                };
                const itemLabels: Record<string, Record<string, string>> = {
                  pre_launch: {
                    businesses_seeded: "Businesses Seeded", cultural_sites: "Cultural Sites",
                    historical_sites: "Historical Sites", community_resources: "Community Resources",
                    events: "Events", city_imagery: "City Imagery", moderation_review: "Moderation Review",
                    kinfolk_city_context: "Kinfolk City Context", search_validation: "Search Validation",
                    map_validation: "Map Validation", analytics_enabled: "Analytics Enabled",
                  },
                  community: {
                    founding_members: "Founding Members", founding_businesses: "Founding Businesses",
                    ambassadors: "Ambassadors", creators: "Creators",
                    volunteers: "Volunteers", local_organizations: "Local Organizations",
                  },
                  marketing: {
                    city_landing_page: "City Landing Page", launch_announcement: "Launch Announcement",
                    social_assets: "Social Assets", founder_interview_prompts: "Founder Interview Prompts",
                    local_press_checklist: "Local Press Checklist", city_hashtags: "City Hashtags",
                    referral_campaign: "Referral Campaign",
                  },
                  operations: {
                    feature_flags: "Feature Flags", rollout_percentage: "Rollout Percentage",
                    monitoring: "Monitoring", crash_dashboard: "Crash Dashboard",
                    waitlist_activation: "Waitlist Activation", rollback_plan: "Rollback Plan",
                  },
                };
                const items = selectedCity.checklist[section] as Record<string, boolean>;
                const completed = Object.values(items).filter(Boolean).length;
                const total = Object.keys(items).length;
                return (
                  <div key={section} className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-[#3A1F0E]">{sectionLabels[section]}</h4>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-[#FAF6EF] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${completed === total ? "bg-green-500" : "bg-[#CA922B]"}`}
                            style={{ width: `${Math.round((completed / total) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#3A1F0E]/50">{completed}/{total}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(items).map(([key, val]) => {
                        const updKey = `${selectedCity.slug}-${section}-${key}`;
                        const isUpdating = checklistUpdating === updKey;
                        return (
                          <button
                            key={key}
                            disabled={isUpdating}
                            onClick={async () => {
                              setChecklistUpdating(updKey);
                              try {
                                const r = await fetch(`${BASE}api/admin/city-launches/${selectedCity.slug}/checklist`, {
                                  method: "PATCH", credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ section, item: key, value: !val }),
                                });
                                if (r.ok) {
                                  const data = await r.json() as { statusAdvanced?: boolean; newStatus?: string; autoAdvance?: boolean; advancedSection?: string };
                                  await loadCityLaunches();
                                  if (data.newStatus) {
                                    const statusLabels: Record<string, string> = {
                                      pre_launch: "Pre-Launch", soft_launch: "Soft Launch", live: "Live",
                                    };
                                    const sectionLabels: Record<string, string> = {
                                      pre_launch: "Pre-Launch", operations: "Operations",
                                    };
                                    const msg = data.statusAdvanced
                                      ? `${sectionLabels[data.advancedSection ?? ""] ?? data.advancedSection} checklist complete — status advanced to ${statusLabels[data.newStatus] ?? data.newStatus}`
                                      : `${sectionLabels[data.advancedSection ?? ""] ?? data.advancedSection} checklist complete — consider advancing to ${statusLabels[data.newStatus] ?? data.newStatus}`;
                                    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
                                    setCityStatusBanner({ message: msg, newStatus: data.newStatus });
                                    bannerTimerRef.current = setTimeout(() => setCityStatusBanner(null), 6000);
                                  }
                                }
                              } finally { setChecklistUpdating(null); }
                            }}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left ${
                              val
                                ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                                : "bg-[#FAF6EF] border border-[#3A1F0E]/10 text-[#3A1F0E]/50 hover:border-[#3A1F0E]/20"
                            } disabled:opacity-50`}
                          >
                            {isUpdating ? (
                              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : val ? (
                              <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            ) : (
                              <div className="w-4 h-4 rounded border border-[#3A1F0E]/20 shrink-0" />
                            )}
                            {itemLabels[section]?.[key] ?? key.replace(/_/g, " ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-5">
                <h4 className="font-bold text-[#3A1F0E] mb-3">Launch Notes</h4>
                <CityNotesEditor
                  slug={selectedCity.slug}
                  notes={selectedCity.notes ?? ""}
                  base={BASE}
                  onSave={loadCityLaunches}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "feedback" && (
        <div className="p-6">
          <AdminFeedbackTab />
        </div>
      )}

      {tab === "knowledge-contrib" && (
        <div className="p-6">
          <KnowledgeContribTab />
        </div>
      )}

      {tab === "library-growth" && (
        <div className="p-6">
          <LibraryGrowthTab />
        </div>
      )}

      {tab === "biz-review" && (
        <div className="p-6">
          <AdminBusinessReview embedded />
        </div>
      )}

      {/* Edit Business modal */}
      {editingBiz && (
        <AdminEditBusiness
          businessId={editingBiz.id}
          businessName={editingBiz.name}
          onClose={() => setEditingBiz(null)}
          onSaved={() => { void loadBusinesses(); }}
        />
      )}

      {/* Add Business modal */}
      {showAddBusiness && (
        <AdminAddBusiness
          onClose={() => setShowAddBusiness(false)}
          onSuccess={(bizId, bizName) => {
            setShowAddBusiness(false);
            setAddBizSuccess({ id: bizId, name: bizName });
            void loadBusinesses();
            setTimeout(() => setAddBizSuccess(null), 8000);
          }}
        />
      )}

      {/* Add Business success toast */}
      {addBizSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2B1507] text-[#F5EBD8] rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-3 max-w-sm w-full mx-4">
          <CheckCircle className="w-5 h-5 text-[#CA922B] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">"{addBizSuccess.name}" saved</p>
            <p className="text-xs text-[#F5EBD8]/50 mt-0.5">Listed under Businesses tab · staged</p>
          </div>
          <a
            href={`${BASE}businesses/${addBizSuccess.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-[#CA922B] underline hover:text-amber-300"
          >
            View
          </a>
          <button
            onClick={() => setAddBizSuccess(null)}
            className="shrink-0 text-[#F5EBD8]/40 hover:text-[#F5EBD8]/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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
  // Guard against null AND against error-response objects (e.g. { error: "Forbidden" })
  const isValid = metrics && typeof metrics.total === "number";
  if (loading || !isValid) {
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

  const p = metrics.platform;
  const poolOk = !p || p.pool.waiting === 0;
  const poolWarn = p && p.pool.waiting > 0 && p.pool.waiting < 3;
  const poolCrit = p && p.pool.waiting >= 3;
  const uptimeStr = p
    ? (() => {
        const s = p.uptimeSeconds;
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
      })()
    : "—";

  return (
    <div className="space-y-8">
      {/* ── Live Platform Status ── */}
      {p && (
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#CA922B]" />
              <h3 className="font-bold text-[#3A1F0E]">Live Platform Status</h3>
            </div>
            <span className="text-xs text-[#3A1F0E]/40">
              as of {new Date(p.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              {" · "}uptime {uptimeStr}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {/* Pool health */}
            <div className={`rounded-xl p-4 border ${poolCrit ? "bg-red-50 border-red-200" : poolWarn ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">DB Pool</div>
              <div className={`text-2xl font-bold ${poolCrit ? "text-red-600" : poolWarn ? "text-amber-600" : "text-green-600"}`}>
                {poolCrit ? "Busy" : poolWarn ? "Warm" : "OK"}
              </div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">
                {p.pool.total} open · {p.pool.idle} idle · {p.pool.waiting} waiting
              </div>
            </div>
            {/* Active sessions */}
            <div className="rounded-xl p-4 border border-[#3A1F0E]/10 bg-[#FAF6EF]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">Active Sessions</div>
              <div className="text-2xl font-bold text-[#3A1F0E]">{p.activeSessions}</div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">valid tokens in DB</div>
            </div>
            {/* Logins last hour */}
            <div className="rounded-xl p-4 border border-[#3A1F0E]/10 bg-[#FAF6EF]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">Logins / hr</div>
              <div className="text-2xl font-bold text-green-600">{p.loginsLastHour}</div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">
                {p.failuresLastHour > 0
                  ? <span className="text-amber-600 font-medium">{p.failuresLastHour} failed</span>
                  : "0 failures"}
              </div>
            </div>
            {/* Posts today */}
            <div className="rounded-xl p-4 border border-[#3A1F0E]/10 bg-[#FAF6EF]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">Posts Today</div>
              <div className="text-2xl font-bold text-[#CA922B]">{p.communityPostsToday}</div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">community activity</div>
            </div>
          </div>
          {/* Member row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border border-[#3A1F0E]/10 bg-[#FAF6EF]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">Total Members</div>
              <div className="text-2xl font-bold text-[#3A1F0E]">{p.membersTotal.toLocaleString()}</div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">registered accounts</div>
            </div>
            <div className="rounded-xl p-4 border border-[#3A1F0E]/10 bg-[#FAF6EF]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#3A1F0E]/50">New Today</div>
              <div className="text-2xl font-bold text-[#CA922B]">{p.membersToday}</div>
              <div className="text-xs text-[#3A1F0E]/40 mt-0.5">since midnight UTC</div>
            </div>
          </div>
        </div>
      )}

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

function CityNotesEditor({ slug, notes, base, onSave }: {
  slug: string; notes: string; base: string; onSave: () => void;
}) {
  const [value, setValue] = useState(notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setValue(notes); }, [notes]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${base}api/admin/city-launches/${slug}/status`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        placeholder="Add launch notes, founder decisions, blockers, or context for this city…"
        className="w-full border border-[#3A1F0E]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#CA922B] resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || value === notes}
          className="flex items-center gap-1.5 bg-[#CA922B] text-white rounded-xl px-4 py-1.5 text-sm font-bold disabled:opacity-50 hover:bg-[#B38024] transition-colors"
        >
          {saving ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> : null}
          {saving ? "Saving…" : "Save Notes"}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
      </div>
    </div>
  );
}

// ── Knowledge Contributions Moderation Tab ─────────────────────────────────
type KContrib = {
  id: string; topic_id: string; topic_name: string; category: string;
  geography_ref: string | null; authority_tier: string;
  source_name: string; source_url: string | null;
  claim: string | null; status: string; confidence: string | null;
  contributor_id: string | null; contributor_email: string | null;
  created_at: string;
};

function KnowledgeContribTab() {
  const BASE = import.meta.env.BASE_URL as string;
  const [contribs, setContribs] = useState<KContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async (status: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}api/admin/knowledge/contributions?status=${status}`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setContribs(d.contributions ?? []); }
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(statusFilter); }, [statusFilter]);

  const act = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const r = await fetch(`${BASE}api/admin/knowledge/contributions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, notes: notes[id] || undefined }),
      });
      if (r.ok) {
        setContribs(cs => cs.filter(c => c.id !== id));
      }
    } finally { setActionLoading(null); }
  };

  const TIER_COLOR: Record<string, string> = {
    community: "#059669", ambassador: "#CA922B",
    authoritative: "#7C3AED", professional: "#2563EB",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#2B1507] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#CA922B]" />
            Knowledge Contributions
          </h2>
          <p className="text-sm text-[#3A1F0E]/50 mt-0.5">
            Community and ambassador evidence submitted for moderation.
            Approved contributions enter the knowledge graph at the community tier — always distinct from authoritative/professional sources.
          </p>
        </div>
        <button onClick={() => load(statusFilter)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:underline">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {["pending_review", "active", "removed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              statusFilter === s
                ? "bg-[#2B1507] text-white border-[#2B1507]"
                : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
            }`}>
            {s === "pending_review" ? "Pending Review" : s === "active" ? "Approved" : "Rejected"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && contribs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#3A1F0E]/8">
          <BookOpen className="w-8 h-8 text-[#CA922B]/30 mx-auto mb-2" />
          <p className="text-sm text-[#3A1F0E]/50">
            {statusFilter === "pending_review" ? "No pending contributions" : "No contributions with this status"}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {contribs.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5">
            {/* Topic + tier header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40">
                    {c.geography_ref ?? c.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#3A1F0E]/20" />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TIER_COLOR[c.authority_tier] ?? "#9CA3AF" }}>
                    {c.authority_tier}
                  </span>
                </div>
                <p className="font-bold text-sm text-[#2B1507]">{c.topic_name}</p>
              </div>
              <span className="text-xs text-[#3A1F0E]/40 shrink-0">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>

            {/* Claim */}
            {c.claim && (
              <div className="bg-[#FAF6EF] rounded-xl p-3.5 mb-3">
                <p className="text-xs font-bold text-[#3A1F0E]/50 mb-1">Claim</p>
                <p className="text-sm text-[#2B1507] leading-relaxed">"{c.claim}"</p>
              </div>
            )}

            {/* Source */}
            <div className="mb-3">
              <p className="text-xs font-bold text-[#3A1F0E]/50 mb-1">Source</p>
              <p className="text-sm text-[#2B1507] font-medium">{c.source_name}</p>
              {c.source_url && (
                <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#CA922B] hover:underline mt-1">
                  <Eye className="w-3 h-3" /> {c.source_url.slice(0, 60)}{c.source_url.length > 60 ? "…" : ""}
                </a>
              )}
            </div>

            {/* Contributor */}
            <p className="text-xs text-[#3A1F0E]/40 mb-3">
              Submitted by: {c.contributor_email ?? c.contributor_id ?? "Anonymous"}
            </p>

            {/* Admin notes + actions (only for pending) */}
            {statusFilter === "pending_review" && (
              <div className="space-y-2.5 border-t border-[#3A1F0E]/8 pt-3 mt-3">
                <input
                  value={notes[c.id] ?? ""}
                  onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                  placeholder="Optional review notes…"
                  className="w-full px-3 py-2 text-xs border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => act(c.id, "approve")}
                    disabled={actionLoading === c.id}
                    className="flex-1 py-2 bg-[#059669] text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-[#047857] transition-colors flex items-center justify-center gap-1.5">
                    {actionLoading === c.id ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve → Community Tier
                  </button>
                  <button
                    onClick={() => act(c.id, "reject")}
                    disabled={actionLoading === c.id}
                    className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Status badge for non-pending */}
            {statusFilter !== "pending_review" && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-2 ${
                c.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {c.status === "active" ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {c.status === "active" ? "Approved — Live in knowledge graph" : "Rejected"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Library Growth Tab ───────────────────────────────────────────────────────
type GrowthCandidate = {
  id: string;
  canonical_subject: string;
  category: string;
  desired_node_type: string;
  distinct_user_count: number;
  signal_count: number;
  sensitivity_tier: string;
  proposed_status: string;
  first_seen_at: string;
  last_seen_at: string;
  parent_topic_id: string | null;
  geography_scope: string | null;
};

type WorkerStatus = {
  running: boolean;
  health: {
    lastRunAt: string | null;
    eligibleSignalsProcessed: number;
    candidatesCreatedOrUpdated: number;
    errorCount: number;
    lastError: string | null;
  };
};

function LibraryGrowthTab() {
  const BASE_URL = import.meta.env.BASE_URL as string;
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [candidates, setCandidates] = useState<GrowthCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pending_review");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decideModal, setDecideModal] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const [reason, setReason] = useState("");
  const [materializeLoading, setMaterializeLoading] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState<string | null>(null);
  const [publishTopicId, setPublishTopicId] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const showNotice = (kind: "ok" | "err", msg: string) => {
    setNotice({ kind, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadWorkerHealth = async () => {
    try {
      const r = await fetch(`${BASE_URL}api/admin/library-growth/worker-health`, { credentials: "include" });
      if (r.ok) setWorkerStatus(await r.json());
    } catch { /* non-critical */ }
  };

  const loadCandidates = async (status: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}api/admin/library-growth/candidates?status=${status}&limit=50`, { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setCandidates(d.candidates ?? []);
        setTotal(d.total ?? 0);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void loadWorkerHealth();
    void loadCandidates(statusFilter);
  }, [statusFilter]);

  const decide = async () => {
    if (!decideModal || !reason.trim()) return;
    setActionLoading(decideModal.id);
    try {
      const r = await fetch(`${BASE_URL}api/admin/library-growth/candidates/${decideModal.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision: decideModal.action,
          reason: reason.trim(),
          evidencePlan: decideModal.action === "approved"
            ? { requiredAuthorityTiers: ["authoritative", "professional"], minimumSources: 2, requiresDomainReviewer: false }
            : undefined,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        showNotice("ok", `Candidate ${decideModal.action}.`);
        setDecideModal(null);
        setReason("");
        void loadCandidates(statusFilter);
      } else {
        showNotice("err", d.error ?? "Action failed.");
      }
    } finally { setActionLoading(null); }
  };

  const materialize = async (candidateId: string) => {
    setMaterializeLoading(candidateId);
    try {
      const r = await fetch(`${BASE_URL}api/admin/library-growth/candidates/${candidateId}/materialize`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      if (r.ok) {
        showNotice("ok", `Draft node created. Topic ID: ${d.topicId}`);
        setPublishTopicId(prev => ({ ...prev, [candidateId]: d.topicId }));
        void loadCandidates(statusFilter);
      } else {
        showNotice("err", d.error ?? "Materialization failed.");
      }
    } finally { setMaterializeLoading(null); }
  };

  const publish = async (candidateId: string, topicId: string) => {
    setPublishLoading(candidateId);
    try {
      const r = await fetch(`${BASE_URL}api/admin/library-growth/topics/${topicId}/publish`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      if (r.ok) {
        showNotice("ok", "Library topic published and now visible to members.");
        void loadCandidates(statusFilter);
      } else {
        showNotice("err", d.error ?? "Publish failed.");
      }
    } finally { setPublishLoading(null); }
  };

  const statusOptions = [
    { value: "pending_review", label: "Needs Review" },
    { value: "approved", label: "Approved" },
    { value: "materialized", label: "Draft Nodes" },
    { value: "rejected", label: "Rejected" },
  ];

  const tierColors: Record<string, string> = {
    standard: "bg-green-50 text-green-700",
    professional: "bg-amber-50 text-amber-700",
    sensitive: "bg-orange-50 text-orange-700",
  };

  const statusColors: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-700",
    approved: "bg-blue-50 text-blue-700",
    materialized: "bg-purple-50 text-purple-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#3A1F0E]">Library Growth Engine</h2>
          <p className="text-sm text-[#3A1F0E]/60 mt-0.5">
            Governed community-demand pipeline. Candidates require ≥10 distinct members before curator review.
          </p>
        </div>
        <button onClick={() => { void loadWorkerHealth(); void loadCandidates(statusFilter); }}
          className="text-xs text-[#CA922B] hover:underline flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Notice banner */}
      {notice && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${notice.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {notice.kind === "ok" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {notice.msg}
        </div>
      )}

      {/* Worker health card */}
      {workerStatus && (
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#CA922B]" />
            <h3 className="font-semibold text-[#3A1F0E] text-sm">Hourly Worker</h3>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${workerStatus.running ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {workerStatus.running ? "Running" : "Stopped"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#FAF6EF] rounded-xl p-3">
              <p className="text-xl font-bold text-[#3A1F0E]">{total}</p>
              <p className="text-xs text-[#3A1F0E]/50 mt-0.5">Total candidates</p>
            </div>
            <div className="bg-[#FAF6EF] rounded-xl p-3">
              <p className="text-xl font-bold text-[#3A1F0E]">{workerStatus.health.candidatesCreatedOrUpdated}</p>
              <p className="text-xs text-[#3A1F0E]/50 mt-0.5">Created/updated</p>
            </div>
            <div className="bg-[#FAF6EF] rounded-xl p-3">
              <p className="text-xl font-bold text-[#CA922B]">{workerStatus.health.errorCount}</p>
              <p className="text-xs text-[#3A1F0E]/50 mt-0.5">Errors</p>
            </div>
          </div>
          {workerStatus.health.lastRunAt && (
            <p className="text-xs text-[#3A1F0E]/40 mt-2.5">
              Last run: {new Date(workerStatus.health.lastRunAt).toLocaleString()}
            </p>
          )}
          {workerStatus.health.lastError && (
            <p className="text-xs text-red-600 mt-1 font-mono truncate">{workerStatus.health.lastError}</p>
          )}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === opt.value ? "bg-[#3A1F0E] text-white" : "bg-white border border-[#3A1F0E]/10 text-[#3A1F0E]/70 hover:border-[#CA922B]/40"}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Candidates list */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-[#CA922B] border-t-transparent animate-spin" /></div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 text-[#3A1F0E]/40 text-sm">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No candidates with status "{statusFilter}". Growth signals accumulate as members use Kinfolk and Search.
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#3A1F0E] text-sm leading-snug">{c.canonical_subject}</p>
                  <p className="text-xs text-[#3A1F0E]/50 mt-0.5 capitalize">{c.category} · {c.desired_node_type}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[c.proposed_status] ?? "bg-gray-50 text-gray-600"}`}>
                  {c.proposed_status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-[#3A1F0E]/55">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.distinct_user_count} distinct members</span>
                <span>{c.signal_count} signals</span>
                {c.geography_scope && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.geography_scope}</span>}
                <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${tierColors[c.sensitivity_tier] ?? "bg-gray-50 text-gray-600"}`}>
                  {c.sensitivity_tier}
                </span>
              </div>

              {/* Time range */}
              <p className="text-xs text-[#3A1F0E]/40">
                First seen: {new Date(c.first_seen_at).toLocaleDateString()} · Last: {new Date(c.last_seen_at).toLocaleDateString()}
              </p>

              {/* Actions */}
              {c.proposed_status === "pending_review" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setDecideModal({ id: c.id, action: "approved" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CA922B] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setDecideModal({ id: c.id, action: "rejected" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}

              {c.proposed_status === "approved" && (
                <div className="pt-1">
                  <button
                    onClick={() => void materialize(c.id)}
                    disabled={materializeLoading === c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {materializeLoading === c.id
                      ? <><div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />Creating draft…</>
                      : <><PlusCircle className="w-3.5 h-3.5" />Create Draft Library Node</>}
                  </button>
                </div>
              )}

              {c.proposed_status === "materialized" && (
                <div className="pt-1 flex items-center gap-2">
                  {publishTopicId[c.id] ? (
                    <button
                      onClick={() => void publish(c.id, publishTopicId[c.id])}
                      disabled={publishLoading === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {publishLoading === c.id
                        ? <><div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />Publishing…</>
                        : <><CheckCircle className="w-3.5 h-3.5" />Publish (2+ sources verified)</>}
                    </button>
                  ) : (
                    <p className="text-xs text-[#3A1F0E]/50 italic">
                      Draft node created. Add ≥2 authoritative sources via Knowledge Contributions, then refresh and publish.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve / Reject modal */}
      {decideModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-bold text-[#3A1F0E] text-lg capitalize">
              {decideModal.action === "approved" ? "Approve" : "Reject"} Candidate
            </h3>
            <p className="text-sm text-[#3A1F0E]/60">
              {decideModal.action === "approved"
                ? "Approving creates a pending-materialization record. You'll need to materialize a draft node and add sources before it publishes."
                : "Rejecting permanently closes this candidate. It will not be re-raised unless demand crosses the threshold again."}
            </p>
            <div>
              <label className="text-xs font-semibold text-[#3A1F0E]/70 uppercase tracking-wide">Reason (required)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why are you approving or rejecting this candidate?"
                rows={3}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-[#3A1F0E]/15 rounded-xl focus:outline-none focus:border-[#CA922B]/50 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => void decide()}
                disabled={!reason.trim() || actionLoading === decideModal.id}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 ${decideModal.action === "approved" ? "bg-[#CA922B]" : "bg-red-600"}`}>
                {actionLoading === decideModal.id ? "Saving…" : `Confirm ${decideModal.action === "approved" ? "Approval" : "Rejection"}`}
              </button>
              <button onClick={() => { setDecideModal(null); setReason(""); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#3A1F0E]/15 text-[#3A1F0E]/60 hover:bg-[#FAF6EF] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
