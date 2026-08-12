import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearch } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, TrendingUp, Radio, Search, X, Loader2, Star, Clock,
  ChevronRight, AlertCircle, CheckCircle, Users, MapPin, Plus, Eye
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// ── Types ──────────────────────────────────────────────────────────────────
interface Topic {
  id: string;
  topicName: string;
  category: string;
  description?: string | null;
  isFollowing?: boolean;
  newCount?: number;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  topicId?: string | null;
  tier: string;
  readTimeMinutes: number | null;
  authorName: string;
  authorBadge?: string | null;
  publishedAt: string;
  isRead?: boolean;
}

interface Story {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceUrl?: string | null;
  confirmCount: number;
  isAdminPost: boolean;
  createdAt: string;
}

interface City {
  city: string; state: string; slug: string;
  launch_status: string; brief_context: string | null;
  has_profile: boolean; business_count: number;
}

// ── Knowledge Graph types (Layer 2/3 retrieval) ────────────────────────────
interface KGSource {
  id: string;
  authority_tier: "authoritative" | "professional" | "community" | "ambassador";
  source_name: string;
  source_url: string | null;
  claim: string | null;
  evidence_section: string | null;
  confidence: "verified" | "high" | "medium" | "low" | "unverified" | null;
  is_primary: boolean;
  status: string;
}

interface KGEntity {
  entity_id: string;
  entity_type: string;
  entity_label: string | null;
  relevance_weight: number;
  entity_data: {
    name?: string; category?: string; city?: string; state?: string;
    latitude?: number; longitude?: number; description?: string; address?: string;
  } | null;
}

interface KGRelTopic {
  relationship_type: string;
  weight: number;
  topic: { id: string; topic_name: string; category: string; description: string | null };
}

interface GraphData {
  node: { id: string; topic_name: string; node_type: string; category: string; description: string | null };
  sources: KGSource[];
  articles: Array<{ id: string; title: string; summary: string | null; category: string; tier: string; author_name: string | null; read_time_minutes: number | null; published_at: string | null }>;
  connectedEntities: KGEntity[];
  relationships: { parents: KGRelTopic[]; children: KGRelTopic[] };
  geography: { ref: string; subtopics: Array<{ id: string; topic_name: string; category: string }> } | null;
}

// ── Category Meta ──────────────────────────────────────────────────────────
const CAT_META: Record<string, { color: string; label: string }> = {
  health:             { color: "#DC2626", label: "Health" },
  travel:             { color: "#2563EB", label: "Travel" },
  relocation:         { color: "#16A34A", label: "Relocation" },
  careers:            { color: "#059669", label: "Careers" },
  money:              { color: "#D97706", label: "Money" },
  history:            { color: "#7C3AED", label: "History" },
  education:          { color: "#0891B2", label: "Education" },
  food:               { color: "#EA580C", label: "Food" },
  culture:            { color: "#DB2777", label: "Culture" },
  wellness:           { color: "#6D28D9", label: "Wellness" },
  community_culture:  { color: "#9333EA", label: "Community" },
  community:          { color: "#9333EA", label: "Community" },
  skills_trades:      { color: "#78716C", label: "Skills & Trades" },
  home:               { color: "#78716C", label: "Home & Living" },
  safety:             { color: "#DC2626", label: "Safety" },
  business:           { color: "#059669", label: "Business" },
  employment:         { color: "#0891B2", label: "Employment" },
  financial:          { color: "#D97706", label: "Finance" },
  family:             { color: "#16A34A", label: "Family" },
  entertainment:      { color: "#EC4899", label: "Entertainment" },
  technology:         { color: "#3B82F6", label: "Technology" },
  environment:        { color: "#22C55E", label: "Environment" },
  giving:             { color: "#CA922B", label: "Giving Back" },
  government:         { color: "#6B7280", label: "Government" },
  platform:           { color: "#CA922B", label: "MWM Updates" },
  food_lifestyle:     { color: "#EA580C", label: "Food & Lifestyle" },
  health_wellness:    { color: "#DC2626", label: "Health & Wellness" },
  financial_wellness: { color: "#D97706", label: "Financial Wellness" },
};

function catColor(cat: string): string { return CAT_META[cat]?.color ?? "#CA922B"; }
function catLabel(cat: string): string { return CAT_META[cat]?.label ?? cat; }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Request Topic Button ────────────────────────────────────────────────────
function RequestTopicButton({ topicName }: { topicName: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "exists">("idle");
  const { toast } = useToast();

  const handleRequest = async () => {
    setStatus("sending");
    try {
      const res = await fetch(`${BASE}api/knowledge/topics/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: topicName.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.alreadyExists) {
        setStatus("exists");
        toast({ title: `"${topicName}" is already in the review queue`, description: "Check Browse Topics — it may appear under a different name." });
      } else {
        setStatus("done");
        toast({ title: "Topic request submitted!", description: `We'll review "${topicName}" and add it to the library.` });
      }
    } catch {
      setStatus("idle");
      toast({ title: "Could not submit request", variant: "destructive" });
    }
  };

  if (status === "done") return <p className="text-xs text-green-600 font-bold mt-2">✓ Request submitted — thank you!</p>;
  if (status === "exists") return <p className="text-xs text-[#3A1F0E]/50 mt-2">This topic is already in the library or pending review.</p>;

  return (
    <button
      onClick={handleRequest}
      disabled={status === "sending"}
      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#CA922B] text-white rounded-full text-xs font-bold hover:bg-[#b07e24] disabled:opacity-60 transition-colors"
    >
      <Plus className="w-3.5 h-3.5" />
      {status === "sending" ? "Submitting…" : `Request "${topicName}" as a topic`}
    </button>
  );
}

// ── Article Card ───────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const color = catColor(article.category);
  const label = catLabel(article.category);

  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}>
              {label}
            </span>
            {article.tier !== "free" && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Member
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-[#2B1507] leading-snug mb-1">{article.title}</h3>
          <p className="text-xs text-[#3A1F0E]/60 line-clamp-2 leading-relaxed">{article.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-[#3A1F0E]/40">
            <span className="font-medium">{article.authorName}</span>
            {article.authorBadge && <span className="text-[#CA922B] font-bold">{article.authorBadge}</span>}
            {article.readTimeMinutes && (
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{article.readTimeMinutes} min</span>
            )}
            <span>{timeAgo(article.publishedAt)}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
          <BookOpen className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Knowledge Book Panel ───────────────────────────────────────────────────
const TIER_META: Record<string, { label: string; color: string }> = {
  authoritative: { label: "Authoritative Sources", color: "#7C3AED" },
  professional:  { label: "Professional Sources",  color: "#2563EB" },
  community:     { label: "Community Evidence",    color: "#059669" },
  ambassador:    { label: "Ambassador Guides",     color: "#CA922B" },
};
const CONF_META: Record<string, { label: string; color: string }> = {
  verified:   { label: "Direct Citation",     color: "#059669" },
  high:       { label: "Contextual Support",  color: "#2563EB" },
  medium:     { label: "Background Ref",      color: "#D97706" },
  low:        { label: "Background Only",     color: "#9CA3AF" },
  unverified: { label: "Pending Review",      color: "#9CA3AF" },
};
const ALL_TIERS = ["authoritative", "professional", "community", "ambassador"] as const;

function KnowledgeBookPanel({
  topic, isAuthenticated, onClose, onToggleFollow, focusEvidence,
}: {
  topic: Topic; isAuthenticated: boolean;
  onClose: () => void; onToggleFollow: (id: string) => void;
  focusEvidence?: boolean;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<GraphData | null>(null);
  const [gLoading, setGLoading] = useState(true);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contrib, setContrib] = useState({ claimText: "", sourceName: "", sourceUrl: "" });
  // Ref for focus=evidence scroll — attached to the "What We Know" sources heading div
  const evidenceSectionRef = useRef<HTMLDivElement>(null);

  // When the panel is opened from a Kinfolk deep link with focus=evidence,
  // scroll to the sources section after the graph data finishes loading.
  useEffect(() => {
    if (!gLoading && focusEvidence && evidenceSectionRef.current) {
      evidenceSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [gLoading, focusEvidence]);

  useEffect(() => {
    setGLoading(true); setData(null);
    fetch(`${BASE}api/knowledge/graph/${encodeURIComponent(topic.id)}?surface=library`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setGLoading(false));
  }, [topic.id]);

  const submitContrib = async () => {
    if (!contrib.claimText || !contrib.sourceName) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}api/knowledge/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topicId: topic.id, ...contrib }),
      });
      if (r.ok) {
        toast({ title: "Contribution submitted", description: "It will be reviewed before appearing in this Book." });
        setContrib({ claimText: "", sourceName: "", sourceUrl: "" });
        setContributeOpen(false);
      } else {
        const d = await r.json().catch(() => ({}));
        toast({ title: "Could not submit", description: (d as {error?: string}).error, variant: "destructive" });
      }
    } finally { setSubmitting(false); }
  };

  const srcByTier = (tier: string) => (data?.sources ?? []).filter(s => s.authority_tier === tier);
  const hasSources = (data?.sources.length ?? 0) > 0;
  const hasArticles = (data?.articles.length ?? 0) > 0;
  const relTopics = [...(data?.relationships.parents ?? []), ...(data?.relationships.children ?? [])]
    .filter(r => r.weight >= 0.6).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-[#FAF6EF] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF6EF] border-b border-[#3A1F0E]/8 px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: catColor(topic.category) }}>
                {catLabel(topic.category)}
              </span>
              <h2 className="text-base font-bold text-[#2B1507] leading-tight mt-0.5">{topic.topicName}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              <button onClick={() => onToggleFollow(topic.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  topic.isFollowing
                    ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/10"
                    : "bg-[#CA922B] text-white hover:bg-[#B38024]"
                }`}>
                {topic.isFollowing ? "Following" : "Follow"}
              </button>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#3A1F0E]/5 transition-colors">
                <X className="w-4 h-4 text-[#3A1F0E]/50" />
              </button>
            </div>
          </div>
          {topic.description && (
            <p className="text-xs text-[#3A1F0E]/60 mt-2 line-clamp-2">{topic.description}</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {gLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-[#CA922B] animate-spin" />
            </div>
          )}

          {!gLoading && !data && (
            <div className="text-center py-12">
              <AlertCircle className="w-7 h-7 text-[#CA922B]/40 mx-auto mb-2" />
              <p className="text-sm text-[#3A1F0E]/50">Could not load this Book</p>
            </div>
          )}

          {!gLoading && data && (
            <>
              {/* ── Building state (no sources at all) ── */}
              {!hasSources && (
                <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5 text-center">
                  <div className="w-10 h-10 bg-[#CA922B]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <p className="font-bold text-sm text-[#2B1507] mb-1">We're building this Book</p>
                  <p className="text-xs text-[#3A1F0E]/50 leading-relaxed mb-3">
                    No verified sources exist for this topic yet. When they do, they'll appear here — grouped by tier and labeled by how directly they support each claim.
                  </p>
                  {isAuthenticated && (
                    <button onClick={() => setContributeOpen(true)}
                      className="text-xs font-bold text-[#CA922B] hover:underline">
                      Be among the first to contribute →
                    </button>
                  )}
                </div>
              )}

              {/* ── Sources by tier ── */}
              {hasSources && (
                <div ref={evidenceSectionRef} className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40">What We Know</p>
                  {ALL_TIERS.map(tier => {
                    const srcs = srcByTier(tier);
                    const tm = TIER_META[tier];
                    return (
                      <div key={tier}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tm.color }} />
                          <p className="text-xs font-bold" style={{ color: tm.color }}>{tm.label}</p>
                          {srcs.length === 0 && (
                            <span className="text-[10px] text-[#3A1F0E]/30 italic">none yet</span>
                          )}
                        </div>
                        {srcs.map(src => {
                          const cm = src.confidence ? (CONF_META[src.confidence] ?? CONF_META.unverified) : CONF_META.unverified;
                          return (
                            <div key={src.id} className="bg-white rounded-xl border border-[#3A1F0E]/8 p-3.5 mb-2 last:mb-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-bold text-[#2B1507] leading-tight flex-1">{src.source_name}</p>
                                <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ color: cm.color, backgroundColor: `${cm.color}18` }}>
                                  {cm.label}
                                </span>
                              </div>
                              {src.claim && (
                                <p className="text-xs text-[#3A1F0E]/65 mt-1 italic leading-relaxed">"{src.claim}"</p>
                              )}
                              {src.source_url && (
                                <a href={src.source_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#CA922B] hover:underline mt-1.5">
                                  <Eye className="w-3 h-3" /> View Source
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Reading materials (articles) ── */}
              {hasArticles && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40">Reading Materials</p>
                  {(data.articles ?? []).map(article => {
                    const color = catColor(article.category);
                    return (
                      <div key={article.id} className="bg-white rounded-xl border border-[#3A1F0E]/8 p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${color}15` }}>
                            <BookOpen className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2B1507] leading-tight">{article.title}</p>
                            {article.summary && (
                              <p className="text-xs text-[#3A1F0E]/60 mt-1 line-clamp-2 leading-relaxed">{article.summary}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#3A1F0E]/40">
                              {article.author_name && <span>{article.author_name}</span>}
                              {article.read_time_minutes && <span>{article.read_time_minutes} min read</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Connected entities (On the Map) ── */}
              {data.connectedEntities.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-3">On the Map</p>
                  <div className="space-y-2">
                    {data.connectedEntities.map(e => {
                      const name = e.entity_data?.name ?? e.entity_id;
                      const loc = [e.entity_data?.city, e.entity_data?.state].filter(Boolean).join(", ");
                      return (
                        <div key={e.entity_id} className="bg-white rounded-xl border border-[#3A1F0E]/8 p-3.5 flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#CA922B]/10 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[#CA922B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2B1507] truncate">{name}</p>
                            {e.entity_label && (
                              <p className="text-xs text-[#3A1F0E]/50 mt-0.5 italic">"{e.entity_label}"</p>
                            )}
                            {loc && (
                              <p className="text-xs text-[#3A1F0E]/40 mt-0.5">{loc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Geography subtopics ── */}
              {data.geography && data.geography.subtopics.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-3">
                    More Books in {data.geography.ref}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.geography.subtopics.map(st => (
                      <span key={st.id} className="px-3 py-1.5 bg-white border border-[#3A1F0E]/10 rounded-full text-xs text-[#3A1F0E]/65">
                        {st.topic_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Related Books ── */}
              {relTopics.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-3">Related Books</p>
                  <div className="flex flex-wrap gap-2">
                    {relTopics.map((r, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ color: catColor(r.topic.category), backgroundColor: `${catColor(r.topic.category)}12` }}>
                        {r.topic.topic_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Contribute form ── */}
              {isAuthenticated && (
                <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4">
                  <button onClick={() => setContributeOpen(o => !o)}
                    className="w-full flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#2B1507]">Add Community Evidence</p>
                      <p className="text-xs text-[#3A1F0E]/50 mt-0.5">Share a source, story, or local knowledge</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#3A1F0E]/40 transition-transform ${contributeOpen ? "rotate-90" : ""}`} />
                  </button>
                  {contributeOpen && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-[#3A1F0E]/60 block mb-1">What do you know? *</label>
                        <textarea
                          value={contrib.claimText}
                          onChange={e => setContrib(p => ({ ...p, claimText: e.target.value }))}
                          placeholder="Describe what you know about this topic from personal experience or research…"
                          rows={3}
                          className="w-full px-3 py-2.5 text-sm border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50 resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#3A1F0E]/60 block mb-1">Source or evidence *</label>
                        <input
                          value={contrib.sourceName}
                          onChange={e => setContrib(p => ({ ...p, sourceName: e.target.value }))}
                          placeholder="Article title, book, organization, or your own experience"
                          className="w-full px-3 py-2.5 text-sm border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#3A1F0E]/60 block mb-1">Link (optional)</label>
                        <input
                          value={contrib.sourceUrl}
                          onChange={e => setContrib(p => ({ ...p, sourceUrl: e.target.value }))}
                          placeholder="https://…"
                          type="url"
                          className="w-full px-3 py-2.5 text-sm border border-[#3A1F0E]/10 rounded-xl focus:outline-none focus:border-[#CA922B]/50" />
                      </div>
                      <p className="text-[10px] text-[#3A1F0E]/40 italic">
                        Your contribution will be reviewed before appearing in this Book. Community evidence is always kept separate from authoritative and professional sources.
                      </p>
                      <button onClick={submitContrib}
                        disabled={submitting || !contrib.claimText || !contrib.sourceName}
                        className="w-full py-2.5 bg-[#CA922B] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#B38024] transition-colors flex items-center justify-center gap-2">
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {submitting ? "Submitting…" : "Submit Contribution"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Topic Card ─────────────────────────────────────────────────────────────
function TopicCard({
  topic, onToggleFollow, onOpen,
}: {
  topic: Topic; onToggleFollow: (id: string) => void; onOpen: (t: Topic) => void;
}) {
  const color = catColor(topic.category);
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <button onClick={() => onOpen(topic)}
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
        style={{ backgroundColor: `${color}15` }}>
        <BookOpen className="w-5 h-5" style={{ color }} />
      </button>
      <button onClick={() => onOpen(topic)} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-[#2B1507] truncate">{topic.topicName}</p>
          {(topic.newCount ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#CA922B] text-white">
              {topic.newCount}
            </span>
          )}
        </div>
        <p className="text-xs text-[#3A1F0E]/50 mt-0.5" style={{ color }}>{catLabel(topic.category)}</p>
        {topic.description && <p className="text-xs text-[#3A1F0E]/60 mt-1 line-clamp-2">{topic.description}</p>}
      </button>
      <button onClick={() => onToggleFollow(topic.id)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          topic.isFollowing
            ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/10 hover:bg-red-50 hover:text-red-600"
            : "bg-[#CA922B] text-white hover:bg-[#B38024]"
        }`}>
        {topic.isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

// ── Story Card (Happening Now) ─────────────────────────────────────────────
function StoryCard({ story }: { story: Story }) {
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${catColor(story.category)}15`, color: catColor(story.category) }}>
              {catLabel(story.category)}
            </span>
            {story.isAdminPost && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#CA922B]/10 text-[#CA922B]">
                MWM
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-[#2B1507] leading-snug mb-1">{story.title}</h3>
          <p className="text-xs text-[#3A1F0E]/60 line-clamp-2">{story.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-[#3A1F0E]/40">
            <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-green-500" />{story.confirmCount} confirmed</span>
            <span>{timeAgo(story.createdAt)}</span>
            {story.sourceUrl && (
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#CA922B] font-bold hover:underline">Source →</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Submit Story Modal ─────────────────────────────────────────────────────
function SubmitStoryModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("general");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!title.trim() || !summary.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/knowledge/stories`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, category, sourceUrl: sourceUrl || undefined }),
      });
      if (res.ok) { setSuccess(true); setTimeout(onClose, 2000); }
      else toast({ title: "Could not submit story", variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3A1F0E]/8">
          <h2 className="font-serif font-bold text-[#2B1507]">Share a Story</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6EF] flex items-center justify-center">
            <X className="w-4 h-4 text-[#3A1F0E]/60" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-[#2B1507]">Story submitted</p>
              <p className="text-xs text-[#3A1F0E]/60 mt-1">Under review. Thank you.</p>
            </div>
          ) : (
            <>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Headline *"
                className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4}
                placeholder="What happened? What should the community know? *"
                className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] resize-none" />
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] text-[#3A1F0E]">
                {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Source URL (optional)"
                className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
              <button disabled={!title.trim() || !summary.trim() || submitting} onClick={submit}
                className="w-full py-3 bg-[#CA922B] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-[#B38024] flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Submit Story
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Library Page ──────────────────────────────────────────────────────
type Tab = "library" | "browse" | "happeningNow";

export default function Library() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  // Default to Browse Topics so first-time members immediately see real knowledge-graph content.
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [collections, setCollections] = useState<Topic[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Topic | null>(null);
  const [feed, setFeed] = useState<Article[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicSearch, setTopicSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSubmitStory, setShowSubmitStory] = useState(false);
  const [digestText, setDigestText] = useState("");
  const [openBookTopic, setOpenBookTopic] = useState<Topic | null>(null);
  const [deepLinkFocus, setDeepLinkFocus] = useState<string | null>(null);

  // ── Deep-link: /library?topic=<id>&focus=evidence ──────────────────────────
  // useSearch() from wouter 3.x returns the query string (?topic=...&focus=...)
  // reactively — it updates on every SPA navigation including pushState changes,
  // unlike useLocation() which tracks only the pathname.
  const wSearch = useSearch();

  const linkTopicId = useMemo<string | null>(() => {
    const id = new URLSearchParams(wSearch).get("topic") ?? "";
    return id.length >= 8 ? id : null;
  }, [wSearch]);

  const linkFocus = useMemo<string | null>(() => {
    return new URLSearchParams(wSearch).get("focus") ?? null;
  }, [wSearch]);

  // Opens the panel for the matched topic once per navigation.
  // The openBookTopic guard prevents re-opening if the user closes and
  // navigates back without changing the URL (same wLocation value).
  useEffect(() => {
    if (!linkTopicId || topics.length === 0 || openBookTopic) return;
    const match = topics.find(t => t.id === linkTopicId);
    if (match) {
      setActiveTab("browse");
      setOpenBookTopic(match);
      setDeepLinkFocus(linkFocus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkTopicId, linkFocus, topics]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [topicsRes, collectionsRes, feedRes, storiesRes, citiesRes, digestRes] = await Promise.all([
        fetch(`${BASE}api/knowledge/topics?excludeType=collection`, { credentials: "include" }),
        fetch(`${BASE}api/knowledge/topics?topicType=collection`, { credentials: "include" }),
        fetch(`${BASE}api/knowledge/feed`, { credentials: "include" }),
        fetch(`${BASE}api/knowledge/issues`, { credentials: "include" }),
        fetch(`${BASE}api/cities`),
        fetch(`${BASE}api/knowledge/digest`, { credentials: "include" }),
      ]);
      if (topicsRes.ok) { const d = await topicsRes.json(); setTopics(d.topics ?? []); }
      if (collectionsRes.ok) { const d = await collectionsRes.json(); setCollections(d.topics ?? []); }
      if (feedRes.ok) { const d = await feedRes.json(); setFeed(d.articles ?? d.feed ?? []); }
      if (storiesRes.ok) { const d = await storiesRes.json(); setStories(d.issues ?? d.stories ?? []); }
      if (citiesRes.ok) { const d = await citiesRes.json(); setCities((d.cities ?? []).filter((c: City) => c.has_profile)); }
      if (digestRes.ok) { const d = await digestRes.json(); setDigestText(d.digest ?? d.text ?? ""); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Library search signal (fire-and-forget, debounced) ────────────────────
  // When an authenticated user searches the Library, send a sanitized signal
  // via universal search. This lets the Library Growth Engine aggregate demand
  // from explicit topic searches, not just Kinfolk chat.
  useEffect(() => {
    if (!isAuthenticated || topicSearch.length < 3) return;
    const timer = setTimeout(() => {
      fetch(`${BASE}api/search/universal?q=${encodeURIComponent(topicSearch)}&surface=library&resultTypes=library_topics`, {
        credentials: "include",
      }).catch(() => { /* non-fatal — never block or surface errors from signal capture */ });
    }, 800);
    return () => clearTimeout(timer);
  }, [topicSearch, isAuthenticated]);

  const toggleFollow = async (topicId: string) => {
    if (!isAuthenticated) { toast({ title: "Sign in to follow topics" }); return; }
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    const method = topic.isFollowing ? "DELETE" : "POST";
    try {
      await fetch(`${BASE}api/knowledge/topics/${topicId}/follow`, { method, credentials: "include" });
      setTopics(ts => ts.map(t => t.id === topicId ? { ...t, isFollowing: !t.isFollowing } : t));
    } catch { toast({ title: "Could not update", variant: "destructive" }); }
  };

  // When a collection is selected, filter topics to that collection's category.
  // When searching, show all matching topics regardless of collection.
  const browseTopics = topics.filter(t => {
    if (topicSearch) return t.topicName.toLowerCase().includes(topicSearch.toLowerCase());
    if (selectedCollection) return t.category === selectedCollection.category;
    return selectedCategory === "all" || t.category === selectedCategory;
  });

  const filteredTopics = browseTopics;

  const filteredStories = stories.filter(s =>
    !storySearch || s.title.toLowerCase().includes(storySearch.toLowerCase()) || s.summary.toLowerCase().includes(storySearch.toLowerCase())
  );

  const categoryKeys = ["all", ...Array.from(new Set(topics.map(t => t.category)))];

  // Collection icon mapping (emoji fallback — clean and reliable across browsers)
  const COLLECTION_ICONS: Record<string, string> = {
    "Places": "📍",
    "Culture & Community": "🌍",
    "History": "📖",
    "Health": "❤️",
    "Faith & Spirituality": "✨",
    "Careers & Professional": "💼",
    "Travel": "✈️",
    "Community": "🤝",
    "Education": "🎓",
    "Business": "📊",
    "Divine Nine": "🔱",
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">The Library</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Knowledge for the community</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowSubmitStory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition-colors">
                <Plus className="w-4 h-4" />
                Share
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/8 rounded-2xl p-1 mb-0">
            {([["library", "Feed"], ["browse", "Browse Topics"], ["happeningNow", "Happening Now"]] as [Tab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === id ? "bg-white text-[#2B1507] shadow-sm" : "text-white/70 hover:text-white"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" /></div>
        ) : (
          <>
            {/* ── Library Feed ── */}
            {activeTab === "library" && (
              <div className="space-y-5">
                {/* Digest */}
                {digestText && (
                  <div className="bg-[#2B1507] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-[#CA922B]" />
                      <span className="text-xs font-bold text-[#CA922B] uppercase tracking-wider">Community Digest</span>
                    </div>
                    <p className="text-sm text-[#F5EBD8]/90 leading-relaxed">{digestText.slice(0, 400)}{digestText.length > 400 ? "…" : ""}</p>
                  </div>
                )}

                {/* City Stories horizontal scroll */}
                {cities.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Living Legacy</p>
                      <Link href="/cities"><span className="text-xs font-bold text-[#CA922B] cursor-pointer hover:underline">All cities →</span></Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                      {cities.map(c => (
                        <Link key={c.slug} href={`/city-story/${c.slug}`}>
                          <div className="w-44 shrink-0 bg-white rounded-2xl border border-[#CA922B]/20 border-t-4 p-3 cursor-pointer hover:shadow-sm transition-shadow" style={{ borderTopColor: "#CA922B" }}>
                            {c.launch_status === "live" && (
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[8px] font-bold text-green-600 uppercase tracking-wider">Live</span>
                              </div>
                            )}
                            <p className="font-bold text-sm text-[#2B1507]">{c.city}</p>
                            <p className="text-xs text-[#CA922B] font-bold">{c.state}</p>
                            {c.brief_context && <p className="text-[10px] text-[#3A1F0E]/50 mt-1 line-clamp-2">{c.brief_context}</p>}
                            <p className="text-[10px] text-[#CA922B] font-bold mt-2">Read Story →</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Article Feed */}
                {feed.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
                    <p className="text-sm text-[#3A1F0E]/60 font-semibold mb-1">Articles coming soon</p>
                    <p className="text-xs text-[#3A1F0E]/40 mb-3 max-w-xs mx-auto leading-relaxed">
                      The Library is building its article collection. The KinfolkAI digest below is available now — follow topics to activate it.
                    </p>
                    <button onClick={() => setActiveTab("browse")} className="text-sm font-bold text-[#CA922B] hover:underline">
                      Browse & follow topics →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Latest Articles</p>
                    {feed.map(a => <ArticleCard key={a.id} article={a} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Browse Topics ── */}
            {activeTab === "browse" && (
              <div className="space-y-4">
                {/* Search — always visible */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/35" />
                  <input value={topicSearch} onChange={e => { setTopicSearch(e.target.value); if (e.target.value) setSelectedCollection(null); }}
                    placeholder={selectedCollection ? `Search in ${selectedCollection.topicName}…` : "Search the Library…"}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#3A1F0E]/10 rounded-2xl text-sm focus:outline-none focus:border-[#CA922B]/50 text-[#3A1F0E]" />
                  {topicSearch && <button onClick={() => setTopicSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-[#3A1F0E]/40" /></button>}
                </div>

                {/* ── Collection Grid (top-level view) ── */}
                {collections.length > 0 && !selectedCollection && !topicSearch && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-3">Browse by</p>
                    <div className="grid grid-cols-2 gap-3">
                      {collections.map(col => {
                        const icon = COLLECTION_ICONS[col.topicName] ?? "📚";
                        const topicCount = topics.filter(t => t.category === col.category).length;
                        return (
                          <button key={col.id} onClick={() => setSelectedCollection(col)}
                            className="text-left bg-[#2B1507] rounded-2xl p-4 hover:bg-[#3A1F0E] transition-colors group border border-transparent hover:border-[#CA922B]/40">
                            <span className="text-2xl mb-2 block">{icon}</span>
                            <p className="font-bold text-white text-sm leading-tight mb-1">{col.topicName}</p>
                            {topicCount > 0 && (
                              <p className="text-[10px] text-[#CA922B]/70 font-semibold">{topicCount} topic{topicCount !== 1 ? "s" : ""}</p>
                            )}
                            {col.description && (
                              <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed hidden group-hover:block">{col.description}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Collection drilldown header ── */}
                {selectedCollection && !topicSearch && (
                  <div>
                    <button onClick={() => setSelectedCollection(null)}
                      className="flex items-center gap-2 text-sm font-bold text-[#CA922B] hover:underline mb-3">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      {selectedCollection.topicName}
                    </button>
                    {selectedCollection.description && (
                      <p className="text-xs text-[#3A1F0E]/50 mb-3 leading-relaxed">{selectedCollection.description}</p>
                    )}
                  </div>
                )}

                {/* ── Flat category chips (fallback when no collections, or when collection selected) ── */}
                {(collections.length === 0 || selectedCollection || topicSearch) && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                    {categoryKeys.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                          selectedCategory === cat
                            ? "bg-[#2B1507] text-white border-[#2B1507]"
                            : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
                        }`}>
                        {cat === "all" ? "All Topics" : catLabel(cat)}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Topic list (shown when collection selected, searching, or no collections) ── */}
                {(selectedCollection || topicSearch || collections.length === 0) && (
                  <>
                    {filteredTopics.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-8 h-8 text-[#CA922B]/40 mx-auto mb-2" />
                        <p className="text-sm text-[#3A1F0E]/50 mb-1">No topics found</p>
                        {topicSearch && isAuthenticated && (
                          <RequestTopicButton topicName={topicSearch} />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredTopics.map(t => (
                          <TopicCard
                            key={t.id}
                            topic={t}
                            onToggleFollow={toggleFollow}
                            onOpen={setOpenBookTopic}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Happening Now ── */}
            {activeTab === "happeningNow" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/35" />
                  <input value={storySearch} onChange={e => setStorySearch(e.target.value)}
                    placeholder="Search stories…"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#3A1F0E]/10 rounded-2xl text-sm focus:outline-none focus:border-[#CA922B]/50 text-[#3A1F0E]" />
                  {storySearch && <button onClick={() => setStorySearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-[#3A1F0E]/40" /></button>}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Community Stories</p>
                  {isAuthenticated && (
                    <button onClick={() => setShowSubmitStory(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Submit Story
                    </button>
                  )}
                </div>

                {filteredStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Radio className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
                    <p className="text-sm text-[#3A1F0E]/50 font-medium">No stories yet</p>
                    {isAuthenticated && (
                      <button onClick={() => setShowSubmitStory(true)} className="mt-2 text-sm font-bold text-[#CA922B] hover:underline">
                        Be the first to share →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStories.map(s => <StoryCard key={s.id} story={s} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showSubmitStory && <SubmitStoryModal onClose={() => setShowSubmitStory(false)} />}

      {openBookTopic && (
        <KnowledgeBookPanel
          topic={openBookTopic}
          isAuthenticated={isAuthenticated}
          focusEvidence={deepLinkFocus === "evidence"}
          onClose={() => { setOpenBookTopic(null); setDeepLinkFocus(null); }}
          onToggleFollow={(id) => {
            toggleFollow(id);
            setOpenBookTopic(prev => prev?.id === id ? { ...prev, isFollowing: !prev.isFollowing } : prev);
          }}
        />
      )}
    </div>
  );
}
