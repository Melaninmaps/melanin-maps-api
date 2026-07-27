import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  TrendingUp, Star, MapPin, Zap, Calendar, Users, Package, Tag, Gift,
  Search, Award, Mic, Shield, AlertCircle, CheckCircle2, Loader2, ChevronRight,
  Heart, Clock, ExternalLink, Info,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type PromotionCategory = "announce" | "updates" | "events" | "visibility" | "special";

interface ToolConfig {
  type: string;
  category: PromotionCategory;
  name: string;
  description: string;
  priceCents: number;
  priceDisplay: string;
  durationDays: number;
  icon: string;
  tagline: string;
  searchLabel: string;
  highlight?: boolean;
  applicationOnly?: boolean;
}

interface GrowthData {
  business: { id: string; name: string; category: string; city: string; verified: boolean };
  eligibility: { eligible: boolean; reasons: string[]; warnings: string[] };
  activePromotions: { id: string; type: string; endsAt?: string | null; campaignLabel?: string | null }[];
  pendingPromotions: { id: string; type: string }[];
  catalogue: ToolConfig[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  star: Star,
  "map-pin": MapPin,
  award: Award,
  package: Package,
  users: Users,
  tag: Tag,
  calendar: Calendar,
  heart: Heart,
  gift: Gift,
  search: Search,
  zap: Zap,
  mic: Mic,
  "trending-up": TrendingUp,
};

function ToolIcon({ icon, className, style }: { icon: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[icon] ?? TrendingUp;
  return <Icon className={className} style={style} />;
}

const CATEGORY_META: Record<PromotionCategory, { label: string; sub: string; color: string }> = {
  announce: { label: "Announce a Moment", sub: "Big news deserves big visibility.", color: "#CA922B" },
  updates:  { label: "Business Updates",  sub: "Keep your community informed.",      color: "#2D7A4F" },
  events:   { label: "Events & Community",sub: "Give back and get discovered.",      color: "#5C3D9E" },
  visibility: { label: "Visibility Boosts", sub: "Reach searchers already looking for you.", color: "#1A5C35" },
  special:  { label: "Special Programs",   sub: "Unique opportunities for standout businesses.", color: "#C9A84C" },
};

const CATEGORY_ORDER: PromotionCategory[] = ["announce", "updates", "events", "visibility", "special"];

function SpotlightModal({
  onClose,
  businessName,
}: {
  onClose: () => void;
  businessName: string;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/businesses/mine/growth-center/spotlight`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (res.ok) setDone(true);
      else alert("Could not submit. Please try again.");
    } catch { alert("Something went wrong."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#2B1507] to-[#442A19] p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-[#CA922B]" />
            </div>
            <div>
              <p className="font-bold text-base">Community Spotlight</p>
              <p className="text-white/60 text-xs">Application — no cost</p>
            </div>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            Tell us what makes <span className="font-bold text-white">{businessName}</span> a community landmark. Our team will review your application within 5 business days.
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-bold text-[#2B1507] text-lg text-center">Application Submitted!</p>
            <p className="text-[#3A1F0E]/60 text-sm text-center">We'll review your story and reach out within 5 business days.</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-[#CA922B] text-white font-bold text-sm">Done</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-1.5 block">
                What makes your business special? (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Share your story — founding journey, community involvement, what drives you..."
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-3.5 py-3 text-sm text-[#2B1507] focus:outline-none focus:border-[#CA922B] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#3A1F0E]/15 text-[#3A1F0E]/60 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessGrowthCenter() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<{ id?: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [successType, setSuccessType] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get("tool"); } catch { return null; }
  });

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}api/auth/user`, { credentials: "include" })
        .then((r) => r.json()).then((d) => setAuth((d as { user?: { id?: string } }).user ?? null)).catch(() => {}),
      fetch(`${BASE}api/businesses/mine/growth-tools`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : null).then((d) => { if (d) setData(d as GrowthData); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCheckout(type: string) {
    setCheckoutLoading(type);
    try {
      const res = await fetch(`${BASE}api/businesses/mine/growth-tools/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const d = await res.json() as { checkoutUrl?: string; error?: string };
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      } else {
        alert(d.error ?? "Could not start checkout. Please try again.");
      }
    } catch { alert("Could not connect. Please try again."); }
    finally { setCheckoutLoading(null); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#CA922B] animate-spin" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#CA922B]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-2">Sign In Required</h2>
          <p className="text-[#3A1F0E]/60 text-sm mb-6">
            Access your Business Growth Center by signing in to your business account.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <button className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/list-business">
              <button className="w-full py-3 rounded-full border border-[#3A1F0E]/15 text-[#2B1507] font-bold hover:border-[#CA922B] transition-colors">
                List Your Business First
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-2">No Business Found</h2>
          <p className="text-[#3A1F0E]/60 text-sm mb-6">
            You need to list and claim a business before accessing Growth Center tools.
          </p>
          <Link href="/list-business">
            <button className="px-8 py-3 rounded-full bg-[#CA922B] text-white font-bold">List Your Business</button>
          </Link>
        </div>
      </div>
    );
  }

  const { business, eligibility, activePromotions, pendingPromotions, catalogue } = data;
  const grouped = CATEGORY_ORDER.reduce<Record<PromotionCategory, ToolConfig[]>>((acc, cat) => {
    acc[cat] = catalogue.filter((t) => t.category === cat);
    return acc;
  }, { announce: [], updates: [], events: [], visibility: [], special: [] });

  const launchPackage = catalogue.find((t) => t.type === "launch_package");

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {spotlightOpen && (
        <SpotlightModal businessName={business.name} onClose={() => setSpotlightOpen(false)} />
      )}

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#1A0A00] via-[#2B1507] to-[#442A19] text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#CA922B]" />
            <span className="text-[#CA922B] font-bold text-sm uppercase tracking-wider">Business Growth Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            Grow <span className="text-[#CA922B]">{business.name}</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed mb-8">
            Reach community members who are already looking for what you offer. Promotional visibility, announced moments, and community connections — all in one place.
          </p>

          {/* Three-system policy */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Star,      color: "#CA922B", title: "Community Trust",  sub: "Earned — never purchased. Based on reviews, safety scores, and community engagement." },
              { icon: TrendingUp,color: "#2D7A4F", title: "Promotion",        sub: "Purchased — clear labeling, always. Reach more people for announcements, events, and offers." },
              { icon: Search,    color: "#5C3D9E", title: "Relevance",        sub: "Algorithmic — personalized to each user's location, interests, and travel plans." },
            ].map((s, i) => (
              <div key={i} className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.color + "20" }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <p className="font-bold text-sm mb-1.5">{s.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white/6 border border-white/10 rounded-2xl">
            <p className="text-white/70 text-sm italic text-center leading-relaxed">
              "Businesses may purchase visibility — they can never purchase higher ratings, better reviews, or increased trust."
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Success banner ── */}
        {successType && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-sm">Campaign activated!</p>
              <p className="text-green-700 text-xs mt-0.5">
                Your {successType.replace(/_/g, " ")} campaign is now live. It may take a few minutes to appear across the platform.
              </p>
            </div>
            <button onClick={() => setSuccessType(null)} className="ml-auto text-green-600/50 hover:text-green-600 text-xs">Dismiss</button>
          </div>
        )}

        {/* ── Eligibility ── */}
        <div className={`rounded-2xl border p-5 ${eligibility.eligible ? "bg-white border-[#2D7A4F]/30" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${eligibility.eligible ? "bg-[#2D7A4F]/10" : "bg-red-100"}`}>
              {eligibility.eligible
                ? <CheckCircle2 className="w-5 h-5 text-[#2D7A4F]" />
                : <AlertCircle className="w-5 h-5 text-red-500" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className={`font-bold text-sm ${eligibility.eligible ? "text-[#2D7A4F]" : "text-red-700"}`}>
                  {eligibility.eligible ? "Eligible for Promotions" : "Not Eligible for Promotions"}
                </p>
                {business.verified && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#CA922B]/12 text-[#CA922B] text-xs font-bold border border-[#CA922B]/20">
                    Verified Business
                  </span>
                )}
                {!business.verified && (
                  <Link href="/verify-business">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#3A1F0E]/8 text-[#3A1F0E]/60 text-xs font-bold border border-[#3A1F0E]/15 hover:border-[#CA922B] cursor-pointer transition-colors">
                      Get Verified →
                    </span>
                  </Link>
                )}
              </div>
              {eligibility.reasons.map((r, i) => (
                <p key={i} className="text-red-600 text-xs mt-1">{r}</p>
              ))}
              {eligibility.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <p className="text-[#CA922B] text-xs">{w}</p>
                </div>
              ))}
              {eligibility.eligible && eligibility.warnings.length === 0 && (
                <p className="text-[#3A1F0E]/50 text-xs mt-1">
                  Your business meets all eligibility requirements. All promotion types are available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Active campaigns ── */}
        {activePromotions.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#2D7A4F]/30 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 bg-[#2D7A4F]/6 border-b border-[#2D7A4F]/20">
              <span className="px-2 py-0.5 rounded-full bg-[#2D7A4F] text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
              <span className="text-sm font-bold text-[#2D7A4F]">Active Campaigns</span>
            </div>
            <div className="divide-y divide-[#3A1F0E]/6">
              {activePromotions.map((p) => {
                const tool = catalogue.find((t) => t.type === p.type);
                const endsDate = p.endsAt ? new Date(p.endsAt) : null;
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-[#2D7A4F]/10 flex items-center justify-center shrink-0">
                      <ToolIcon icon={tool?.icon ?? "trending-up"} className="w-4 h-4 text-[#2D7A4F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2B1507] text-sm">{tool?.name ?? p.type}</p>
                      {endsDate && <p className="text-[#3A1F0E]/50 text-xs mt-0.5">Expires {endsDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#2D7A4F]/10 text-[#2D7A4F] text-xs font-bold">Active</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pending campaigns ── */}
        {pendingPromotions.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#CA922B]/30 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 bg-[#CA922B]/6 border-b border-[#CA922B]/20">
              <Clock className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#CA922B]">Pending Payment</span>
            </div>
            <div className="divide-y divide-[#3A1F0E]/6">
              {pendingPromotions.map((p) => {
                const tool = catalogue.find((t) => t.type === p.type);
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                      <ToolIcon icon={tool?.icon ?? "clock"} className="w-4 h-4 text-[#CA922B]" />
                    </div>
                    <p className="flex-1 font-bold text-[#2B1507] text-sm">{tool?.name ?? p.type}</p>
                    <span className="px-2.5 py-1 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold">Awaiting Payment</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Launch Package (featured) ── */}
        {launchPackage && (
          <div className="bg-gradient-to-br from-[#CA922B] to-[#B38024] rounded-3xl p-7 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">{launchPackage.name}</p>
                  <p className="text-white/70 text-xs">For new & launching businesses</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30">
                  Best Value
                </span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-5">{launchPackage.description}</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  "30 days featured placement",
                  "Grand Opening badge",
                  "Push notification to nearby members",
                  "Featured in New Businesses",
                  "Social media feature",
                  "Welcome to the community",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/80 shrink-0" />
                    <span className="text-white/80 text-xs">{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-3xl font-serif font-bold">{launchPackage.priceDisplay}</span>
                  <span className="text-white/60 text-sm ml-2">one time · {launchPackage.durationDays} days</span>
                </div>
                <button
                  onClick={() => void handleCheckout(launchPackage.type)}
                  disabled={!!checkoutLoading || !eligibility.eligible}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#CA922B] font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checkoutLoading === launchPackage.type ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                  ) : (
                    <>Launch for {launchPackage.priceDisplay} <ExternalLink className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                <Shield className="w-3.5 h-3.5 text-white/40" />
                <span className="text-white/40 text-xs">Secure checkout via Stripe — payment opens in a new tab</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Campaign categories ── */}
        {CATEGORY_ORDER.filter((cat) => cat !== "special").map((cat) => {
          const tools = grouped[cat];
          if (!tools.length) return null;
          const meta = CATEGORY_META[cat];
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: meta.color }} />
                <div>
                  <p className="font-bold text-[#2B1507] text-lg">{meta.label}</p>
                  <p className="text-[#3A1F0E]/50 text-xs">{meta.sub}</p>
                </div>
              </div>
              <div className="space-y-3">
                {tools.map((tool) => {
                  const isLoading = checkoutLoading === tool.type;
                  const isActive = activePromotions.some((p) => p.type === tool.type);
                  return (
                    <div
                      key={tool.type}
                      className={`bg-white rounded-2xl border p-5 transition-all ${
                        isActive
                          ? "border-[#2D7A4F]/40 bg-[#2D7A4F]/2"
                          : "border-[#3A1F0E]/10 hover:border-[#CA922B]/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: meta.color + "15" }}
                        >
                          <ToolIcon icon={tool.icon} className="w-5 h-5" style={{ color: meta.color } as React.CSSProperties} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-bold text-[#2B1507] text-base">{tool.name}</p>
                              <p className="text-[#3A1F0E]/50 text-xs mt-0.5">{tool.tagline}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-serif font-bold text-[#2B1507]">{tool.priceDisplay}</p>
                              <p className="text-[#3A1F0E]/40 text-xs">one time</p>
                            </div>
                          </div>
                          <p className="text-[#3A1F0E]/60 text-sm leading-relaxed mt-2">{tool.description}</p>

                          {/* Search label preview */}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[#3A1F0E]/40 text-xs">Shows as:</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold border" style={{ color: meta.color, borderColor: meta.color + "40", backgroundColor: meta.color + "10" }}>
                              {tool.searchLabel}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                            {isActive ? (
                              <span className="flex items-center gap-1.5 text-[#2D7A4F] text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Currently Active
                              </span>
                            ) : tool.applicationOnly ? (
                              <button
                                onClick={() => setSpotlightOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#CA922B] text-[#CA922B] text-sm font-bold hover:bg-[#CA922B]/5 transition-colors"
                              >
                                Apply (Free) <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => void handleCheckout(tool.type)}
                                disabled={!!checkoutLoading || !eligibility.eligible}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ backgroundColor: eligibility.eligible ? meta.color : "#ccc" }}
                              >
                                {isLoading ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                                ) : (
                                  <>Activate for {tool.priceDisplay} <ExternalLink className="w-3.5 h-3.5" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* ── Community Spotlight (special) ── */}
        {grouped.special.filter((t) => t.applicationOnly).map((tool) => (
          <div key={tool.type} className="bg-gradient-to-br from-[#1A3B2B] to-[#2D7A4F] rounded-3xl p-7 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-base">{tool.name}</p>
                <p className="text-white/60 text-xs">{tool.tagline}</p>
              </div>
              <span className="ml-auto px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">Free</span>
            </div>
            <p className="text-white/75 text-sm leading-relaxed mb-5">{tool.description}</p>
            <button
              onClick={() => setSpotlightOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#2D7A4F] font-bold text-sm hover:bg-white/90 transition-colors"
            >
              Apply for a Community Spotlight <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* ── Policy footer ── */}
        <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#CA922B]" />
            <p className="font-bold text-[#2B1507]">Our Promotion Policy</p>
          </div>
          <div className="space-y-2 text-sm text-[#3A1F0E]/65 leading-relaxed">
            <p>
              <strong className="text-[#2B1507]">Promotional placement never changes Community Score, Safety Score, or review ranking.</strong>
              {" "}Sponsored businesses are clearly labeled. All trust metrics remain based solely on community feedback, verified participation, and platform policies.
            </p>
            <p>
              Businesses with unresolved severe safety concerns or violations of Community Guidelines may be ineligible for promotion.
            </p>
            <p>
              Payments are processed securely by Stripe and open in a new browser tab — you are never charged inside the app.
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            <Link href="/community-guidelines">
              <span className="text-[#CA922B] font-bold hover:underline cursor-pointer">Community Guidelines</span>
            </Link>
            <Link href="/trust-and-safety">
              <span className="text-[#CA922B] font-bold hover:underline cursor-pointer">Trust & Safety</span>
            </Link>
            <a href="mailto:support@mappingwithmelanin.com" className="text-[#CA922B] font-bold hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
