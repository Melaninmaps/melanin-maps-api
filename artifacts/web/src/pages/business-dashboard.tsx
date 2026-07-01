import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft, Star, MessageSquare, Eye, Edit3, Shield, Building2,
  Users, BarChart2, ExternalLink, AlertCircle, Search, MapPin,
  Zap, Calendar, TrendingUp, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;

type BusinessSummary = {
  id: string; name: string; category: string; city: string; state: string;
  verified: boolean; status: string;
};
type Review = { id: string; rating: number; text: string | null; wouldReturnAlone: boolean | null; createdAt: string };
type PromotionType = "priority_search" | "category_featured" | "city_featured" | "cultural_spotlight" | "event_featured";
type Promotion = { id: string; type: PromotionType; status: string; endsAt?: string | null };
type ToolConfig = { type: PromotionType; name: string; description: string; priceCents: number; priceDisplay: string; durationDays: number; icon: string; tagline: string };
type GrowthData = { activePromotions: Promotion[]; pendingPromotions: Promotion[]; catalogue: ToolConfig[] };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search, star: Star, "map-pin": MapPin, zap: Zap, calendar: Calendar,
};

function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const Comp = ICON_MAP[icon] ?? TrendingUp;
  return <Comp className={className} />;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-[#CA922B] fill-[#CA922B]" : "text-[#3A1F0E]/20"}`} />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#3A1F0E]/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-serif font-bold text-[#2B1507]">{value}</p>
    </div>
  );
}

export default function BusinessDashboard() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const justActivated = params.get("growth_tool_activated") === "1";
  const activatedTool = params.get("tool");

  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "promote">(justActivated ? "promote" : "overview");
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}api/auth/user`, { credentials: "include" }).then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => {});
    fetch(`${BASE}api/businesses/mine`, { credentials: "include" }).then((r) => r.json()).then((d) => {
      const list = d.businesses ?? (d.business ? [d.business] : []);
      setBusinesses(list);
      if (list.length) setSelectedId(list[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`${BASE}api/reviews?businessId=${selectedId}`, { credentials: "include" }).then((r) => r.json()).then((d) => setReviews(d.reviews ?? [])).catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    if (activeTab !== "promote" || !selectedId) return;
    setGrowthLoading(true);
    fetch(`${BASE}api/businesses/mine/growth-tools`, { credentials: "include" })
      .then((r) => r.json()).then((d) => setGrowthData(d as GrowthData)).catch(() => {}).finally(() => setGrowthLoading(false));
  }, [activeTab, selectedId]);

  async function handleCheckout(type: PromotionType) {
    setCheckoutLoading(type);
    try {
      const res = await fetch(`${BASE}api/businesses/mine/growth-tools/checkout`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      alert("Could not connect. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-2">Sign In Required</h2>
          <p className="text-[#3A1F0E]/60 mb-6">You need to be signed in to access your business dashboard.</p>
          <Link href="/login"><Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-8">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  const selected = businesses.find((b) => b.id === selectedId);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const returnRate = reviews.filter((r) => r.wouldReturnAlone).length;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="container mx-auto px-4 max-w-5xl py-10">
        <Link href="/profile">
          <button className="flex items-center gap-2 text-[#3A1F0E]/60 hover:text-[#3A1F0E] text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#CA922B]" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#2B1507]">Business Dashboard</h1>
            <p className="text-[#3A1F0E]/50 text-sm">Manage your listings, reviews, and visibility</p>
          </div>
        </div>

        <div className="mt-2 grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: business list */}
          <div className="lg:col-span-1">
            <p className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-3">Your Businesses</p>
            {loading && <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>}
            {!loading && businesses.length === 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#3A1F0E]/10 text-center">
                <Building2 className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-2" />
                <p className="text-[#3A1F0E]/60 text-sm font-medium mb-1">No listings yet</p>
                <p className="text-[#3A1F0E]/40 text-xs mb-4">Submit your business to get started</p>
                <Link href="/for-business-owners">
                  <Button size="sm" className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white text-xs font-bold">List My Business</Button>
                </Link>
              </div>
            )}
            {businesses.slice(0, 10).map((b) => (
              <button key={b.id} onClick={() => setSelectedId(b.id === selectedId ? null : b.id)}
                className={`w-full text-left bg-white rounded-2xl p-5 border mb-3 transition-all ${selectedId === b.id ? "border-[#CA922B] shadow-[0_0_0_2px_rgba(202,146,43,0.2)]" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2B1507] text-sm truncate">{b.name}</p>
                    <p className="text-[#3A1F0E]/50 text-xs mt-0.5">{b.city}, {b.state} · {b.category}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {b.verified && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Verified</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === "active" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{b.status}</span>
                  </div>
                </div>
              </button>
            ))}
            <Link href="/verify-business">
              <Button variant="outline" size="sm" className="w-full rounded-full mt-2 border-[#CA922B]/40 text-[#CA922B] hover:bg-[#CA922B]/5 text-xs font-bold">
                <Shield className="w-3 h-3 mr-1" /> Apply for Verification
              </Button>
            </Link>
          </div>

          {/* Right: detail panel */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-3xl p-12 border border-[#3A1F0E]/10 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                <BarChart2 className="w-12 h-12 text-[#3A1F0E]/20 mb-3" />
                <p className="text-[#3A1F0E]/50 font-medium">Select a business to view its dashboard</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#3A1F0E]/10">
                  {(["overview", "promote"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? "bg-[#CA922B] text-white shadow-sm" : "text-[#3A1F0E]/60 hover:text-[#3A1F0E]"}`}>
                      {tab === "promote" ? "✦ Promote" : "Overview"}
                    </button>
                  ))}
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === "overview" && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <StatCard label="Reviews" value={reviews.length} icon={MessageSquare} color="#CA922B" />
                      <StatCard label="Avg Rating" value={avgRating} icon={Star} color="#CA922B" />
                      <StatCard label="Would Return" value={returnRate} icon={Users} color="#38A169" />
                      <StatCard label="Verified" value={selected.verified ? "✓ Yes" : "Pending"} icon={Shield} color={selected.verified ? "#38A169" : "#CA922B"} />
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-[#3A1F0E]/10">
                      <p className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-3">Quick Actions</p>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/businesses/${selected.id}`}>
                          <Button size="sm" variant="outline" className="rounded-full border-[#3A1F0E]/20 text-[#3A1F0E] text-xs font-bold">
                            <Eye className="w-3 h-3 mr-1" /> View Public Listing
                          </Button>
                        </Link>
                        <Link href={`/for-business-owners?claim=${selected.id}`}>
                          <Button size="sm" variant="outline" className="rounded-full border-[#CA922B]/40 text-[#CA922B] text-xs font-bold">
                            <Edit3 className="w-3 h-3 mr-1" /> Edit Profile
                          </Button>
                        </Link>
                        <button onClick={() => setActiveTab("promote")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2D7A4F]/40 text-[#2D7A4F] text-xs font-bold hover:bg-[#2D7A4F]/5 transition-colors">
                          <TrendingUp className="w-3 h-3" /> Promote My Business
                        </button>
                        {!selected.verified && (
                          <Link href="/verify-business">
                            <Button size="sm" className="rounded-full bg-[#2B1507] text-white text-xs font-bold">
                              <Shield className="w-3 h-3 mr-1" /> Get Verified
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-3">Recent Reviews</p>
                      {reviews.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-[#3A1F0E]/10 text-center">
                          <MessageSquare className="w-8 h-8 text-[#3A1F0E]/20 mx-auto mb-2" />
                          <p className="text-[#3A1F0E]/50 text-sm">No reviews yet for {selected.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {reviews.slice(0, 5).map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl p-5 border border-[#3A1F0E]/10">
                              <div className="flex items-center justify-between mb-2">
                                <StarRating rating={r.rating} />
                                <span className="text-[#3A1F0E]/40 text-xs">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              {r.text && <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{r.text}</p>}
                              {r.wouldReturnAlone !== null && (
                                <p className="text-xs mt-2 text-[#3A1F0E]/40">
                                  Would return alone: <strong className={r.wouldReturnAlone ? "text-green-600" : "text-red-500"}>{r.wouldReturnAlone ? "Yes" : "No"}</strong>
                                </p>
                              )}
                            </div>
                          ))}
                          {reviews.length > 5 && (
                            <Link href={`/businesses/${selected.id}`}>
                              <button className="w-full text-center text-[#CA922B] text-sm font-bold py-3 hover:underline flex items-center justify-center gap-1">
                                View all {reviews.length} reviews <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── Promote Tab ── */}
                {activeTab === "promote" && (
                  <div className="space-y-5">
                    {/* Success banner */}
                    {justActivated && (
                      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-green-800 text-sm">Promotion activated!</p>
                          <p className="text-green-700 text-xs mt-0.5">
                            {activatedTool ? `Your ${activatedTool.replace(/_/g, " ")} boost is now live.` : "Your promotion is now live."} It may take a few minutes to appear in search results.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Intro */}
                    <div className="bg-gradient-to-br from-[#2B1507] to-[#442A19] rounded-2xl p-6 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-[#CA922B]" />
                        <span className="font-bold text-[#CA922B] text-sm uppercase tracking-wider">Growth Tools</span>
                      </div>
                      <h2 className="text-2xl font-serif font-bold mb-2">Get Discovered</h2>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Paid placements that reach community members who are actively searching for businesses like yours — not random ads.
                      </p>
                    </div>

                    {growthLoading && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-[#CA922B] animate-spin" />
                      </div>
                    )}

                    {/* Active promotions */}
                    {growthData && growthData.activePromotions.length > 0 && (
                      <div className="bg-white rounded-2xl border border-[#2D7A4F]/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 bg-[#2D7A4F]/8 border-b border-[#2D7A4F]/20">
                          <span className="px-2 py-0.5 rounded-full bg-[#2D7A4F] text-white text-[10px] font-bold uppercase tracking-wider">Active</span>
                          <span className="text-sm font-bold text-[#2D7A4F]">Running Now</span>
                        </div>
                        <div className="divide-y divide-[#3A1F0E]/8">
                          {growthData.activePromotions.map((promo) => {
                            const tool = growthData.catalogue.find((c) => c.type === promo.type);
                            const endsDate = promo.endsAt ? new Date(promo.endsAt) : null;
                            return (
                              <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-xl bg-[#2D7A4F]/10 flex items-center justify-center shrink-0">
                                  <ToolIcon icon={tool?.icon ?? "trending-up"} className="w-4 h-4 text-[#2D7A4F]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[#2B1507] text-sm">{tool?.name ?? promo.type}</p>
                                  {endsDate && <p className="text-[#3A1F0E]/50 text-xs mt-0.5">Expires {endsDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-[#2D7A4F]/10 text-[#2D7A4F] text-xs font-bold">Live</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pending promotions */}
                    {growthData && growthData.pendingPromotions.length > 0 && (
                      <div className="bg-white rounded-2xl border border-[#CA922B]/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 bg-[#CA922B]/8 border-b border-[#CA922B]/20">
                          <Clock className="w-4 h-4 text-[#CA922B]" />
                          <span className="text-sm font-bold text-[#CA922B]">Pending Payment</span>
                        </div>
                        <div className="divide-y divide-[#3A1F0E]/8">
                          {growthData.pendingPromotions.map((promo) => {
                            const tool = growthData.catalogue.find((c) => c.type === promo.type);
                            return (
                              <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                                  <ToolIcon icon={tool?.icon ?? "trending-up"} className="w-4 h-4 text-[#CA922B]" />
                                </div>
                                <p className="flex-1 font-bold text-[#2B1507] text-sm">{tool?.name ?? promo.type}</p>
                                <span className="px-2.5 py-1 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold">Awaiting Payment</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Promotion catalogue */}
                    {growthData && (
                      <div>
                        <p className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-4">Choose a Boost</p>
                        <div className="space-y-3">
                          {growthData.catalogue.map((tool) => {
                            const isLoading = checkoutLoading === tool.type;
                            const isActive = growthData.activePromotions.some((p) => p.type === tool.type);
                            return (
                              <div key={tool.type} className={`bg-white rounded-2xl border p-5 transition-all ${isActive ? "border-[#2D7A4F]/40 bg-[#2D7A4F]/3" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/40 hover:shadow-sm"}`}>
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                                    <ToolIcon icon={tool.icon} className="w-5 h-5 text-[#CA922B]" />
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
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                      {isActive ? (
                                        <span className="flex items-center gap-1.5 text-[#2D7A4F] text-sm font-bold">
                                          <CheckCircle2 className="w-4 h-4" /> Already active
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => void handleCheckout(tool.type)}
                                          disabled={!!checkoutLoading}
                                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          {isLoading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                                          ) : (
                                            <>Activate for {tool.priceDisplay}</>
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
                        <p className="text-center text-[#3A1F0E]/40 text-xs mt-6">
                          Payments are processed securely by Stripe. Promotions activate within minutes of payment.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
