import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
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

// ── Topic Card ─────────────────────────────────────────────────────────────
function TopicCard({ topic, onToggleFollow }: { topic: Topic; onToggleFollow: (id: string) => void }) {
  const color = catColor(topic.category);
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <BookOpen className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
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
      </div>
      <button onClick={() => onToggleFollow(topic.id)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          topic.isFollowing ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/10 hover:bg-red-50 hover:text-red-600" : "bg-[#CA922B] text-white hover:bg-[#B38024]"
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

  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [feed, setFeed] = useState<Article[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicSearch, setTopicSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSubmitStory, setShowSubmitStory] = useState(false);
  const [digestText, setDigestText] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [topicsRes, feedRes, storiesRes, citiesRes, digestRes] = await Promise.all([
        fetch(`${BASE}api/knowledge/topics`, { credentials: "include" }),
        fetch(`${BASE}api/knowledge/feed`, { credentials: "include" }),
        fetch(`${BASE}api/knowledge/issues`, { credentials: "include" }),
        fetch(`${BASE}api/cities`),
        fetch(`${BASE}api/knowledge/digest`, { credentials: "include" }),
      ]);
      if (topicsRes.ok) { const d = await topicsRes.json(); setTopics(d.topics ?? []); }
      if (feedRes.ok) { const d = await feedRes.json(); setFeed(d.articles ?? d.feed ?? []); }
      if (storiesRes.ok) { const d = await storiesRes.json(); setStories(d.issues ?? d.stories ?? []); }
      if (citiesRes.ok) { const d = await citiesRes.json(); setCities((d.cities ?? []).filter((c: City) => c.has_profile)); }
      if (digestRes.ok) { const d = await digestRes.json(); setDigestText(d.digest ?? d.text ?? ""); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const filteredTopics = topics.filter(t =>
    (selectedCategory === "all" || t.category === selectedCategory) &&
    (!topicSearch || t.topicName.toLowerCase().includes(topicSearch.toLowerCase()))
  );

  const filteredStories = stories.filter(s =>
    !storySearch || s.title.toLowerCase().includes(storySearch.toLowerCase()) || s.summary.toLowerCase().includes(storySearch.toLowerCase())
  );

  const categoryKeys = ["all", ...Array.from(new Set(topics.map(t => t.category)))];

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
                    <p className="text-sm text-[#3A1F0E]/50 font-medium">No articles in your feed yet</p>
                    <button onClick={() => setActiveTab("browse")} className="mt-2 text-sm font-bold text-[#CA922B] hover:underline">
                      Follow topics to customize your feed →
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
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/35" />
                  <input value={topicSearch} onChange={e => setTopicSearch(e.target.value)}
                    placeholder="Search topics…"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#3A1F0E]/10 rounded-2xl text-sm focus:outline-none focus:border-[#CA922B]/50 text-[#3A1F0E]" />
                  {topicSearch && <button onClick={() => setTopicSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-[#3A1F0E]/40" /></button>}
                </div>

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                  {categoryKeys.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                        selectedCategory === cat
                          ? "bg-[#2B1507] text-white border-[#2B1507]"
                          : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
                      }`}
                      style={selectedCategory === cat ? {} : {}}>
                      {cat === "all" ? "All Topics" : catLabel(cat)}
                    </button>
                  ))}
                </div>

                {/* Topics */}
                {filteredTopics.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-8 h-8 text-[#CA922B]/40 mx-auto mb-2" />
                    <p className="text-sm text-[#3A1F0E]/50">No topics found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTopics.map(t => <TopicCard key={t.id} topic={t} onToggleFollow={toggleFollow} />)}
                  </div>
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
    </div>
  );
}
