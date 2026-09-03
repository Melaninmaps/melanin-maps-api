import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ExternalLink, Flag, Loader2, MapPin, Plus, Radio, Send, X } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

interface HappeningStory {
  id: string;
  title: string;
  summary: string;
  category: string;
  topicTags?: string[] | null;
  scope: "local" | "state" | "national" | "global";
  city?: string | null;
  state?: string | null;
  country?: string | null;
  sourceUrl?: string | null;
  sourcePublisher?: string | null;
  sourceStatus: string;
  publishedAt?: string | null;
  communityPostId?: string | null;
  submitterName?: string | null;
  status: string;
  confirmCount: number;
  hasConfirmed: boolean;
  isOwnStory: boolean;
  rankingReason?: string;
}

const CATEGORIES = ["politics", "health", "safety", "housing", "education", "economy", "environment", "transportation", "culture", "community", "other"] as const;
const SCOPES = ["local", "state", "national", "global"] as const;

export function HappeningPanel({ isAuthenticated, onDiscuss }: {
  isAuthenticated: boolean;
  onDiscuss: (postId: string, label: string) => void;
}) {
  const [stories, setStories] = useState<HappeningStory[]>([]);
  const [feed, setFeed] = useState<"foryou" | "latest">("foryou");
  const [scope, setScope] = useState<string>("all");
  const [localExpansion, setLocalExpansion] = useState<"state" | null>(null);
  const [stateExpansionAvailable, setStateExpansionAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ feed });
      if (scope !== "all") params.set("scope", scope);
      if (scope === "local" && localExpansion) params.set("localExpansion", localExpansion);
      const response = await authenticatedFetch(`${BASE}api/knowledge/happening-now?${params.toString()}`);
      const body = await response.json().catch(() => ({})) as {
        stories?: HappeningStory[];
        error?: string;
        localExpansion?: { active?: "state" | null; available?: string[] };
      };
      if (!response.ok) throw new Error(body.error ?? "Could not load community updates.");
      setStories(body.stories ?? []);
      setStateExpansionAvailable(body.localExpansion?.available?.includes("state") ?? false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load community updates.");
    } finally {
      setLoading(false);
    }
  }, [feed, scope, localExpansion]);

  useEffect(() => { void load(); }, [load]);

  const toggleConfirm = async (story: HappeningStory) => {
    if (!isAuthenticated || confirming) return;
    setConfirming(story.id);
    try {
      const response = await authenticatedFetch(`${BASE}api/knowledge/happening-now/${encodeURIComponent(story.id)}/confirm`, { method: "POST" });
      const body = await response.json().catch(() => ({})) as { confirmed?: boolean; confirmCount?: number; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update confirmation.");
      setStories((items) => items.map((item) => item.id === story.id ? { ...item, hasConfirmed: !!body.confirmed, confirmCount: body.confirmCount ?? item.confirmCount } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update confirmation.");
    } finally {
      setConfirming(null);
    }
  };

  const report = async (storyId: string) => {
    const response = await authenticatedFetch(`${BASE}api/knowledge/happening-now/${encodeURIComponent(storyId)}/report`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "incorrect_info" }),
    });
    setError(response.ok ? "Thanks. The community desk will review that update." : "Could not send the report.");
  };

  return (
    <section data-testid="community-happening-panel" className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#2B1507] to-[#5A2F13] p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#F3C969]"><Radio className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.18em]">What’s Happening</span></div>
            <h2 className="font-serif text-2xl font-bold">What the community should know</h2>
            <p className="mt-1 max-w-xl text-sm text-white/70">Local impact first, then state, national, and global context—shaped by the topics you choose.</p>
          </div>
          {isAuthenticated && <button data-testid="happening-share-open" onClick={() => setShowForm(true)} className="flex shrink-0 items-center gap-2 rounded-full bg-[#CA922B] px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Share</button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["foryou", "latest"] as const).map((item) => <button key={item} onClick={() => setFeed(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${feed === item ? "bg-[#2B1507] text-white" : "border border-[#3A1F0E]/10 bg-white text-[#3A1F0E]/55"}`}>{item === "foryou" ? "For You" : "Latest"}</button>)}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="happening-feed-scope" className="text-xs font-bold text-[#3A1F0E]">Location scope</label>
          <select
            id="happening-feed-scope"
            value={scope}
            onChange={(event) => { setScope(event.target.value); setLocalExpansion(null); }}
            style={{ color: "#3A1F0E", backgroundColor: "#FFFFFF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }}
            className="rounded-full border border-[#3A1F0E]/20 bg-white px-4 py-2 text-xs font-bold text-[#3A1F0E] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B] focus-visible:ring-offset-2"
          >
            <option value="all">All locations</option>
            {SCOPES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
          </select>
        </div>
        {scope === "local" && stateExpansionAvailable && (
          <button
            type="button"
            data-testid="happening-local-expansion"
            onClick={() => setLocalExpansion((current) => current === "state" ? null : "state")}
            className="rounded-full border border-[#CA922B]/30 bg-[#CA922B]/10 px-4 py-2 text-xs font-bold text-[#8A5A10]"
          >
            {localExpansion === "state" ? "Only my cities" : "Expand to my state"}
          </button>
        )}
      </div>

      {error && <div className={`rounded-2xl border px-4 py-3 text-sm ${error.startsWith("Thanks") ? "border-green-200 bg-green-50 text-green-800" : "border-red-100 bg-red-50 text-red-700"}`}><div className="flex items-center justify-between gap-3"><span>{error}</span><button onClick={() => { setError(null); void load(); }} className="font-bold">Retry</button></div></div>}

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#CA922B]" /></div> : stories.length === 0 ? (
        <div className="rounded-3xl border border-[#3A1F0E]/8 bg-white py-14 text-center"><Radio className="mx-auto mb-3 h-9 w-9 text-[#CA922B]/40" /><p className="font-bold text-[#2B1507]">No approved updates yet</p><p className="mt-1 text-sm text-[#3A1F0E]/50">Share a reliable article or community-impact update for review.</p></div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => <article key={story.id} className="rounded-3xl border border-[#3A1F0E]/8 bg-white p-5" data-testid={`happening-story-${story.id}`}>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full bg-[#CA922B]/10 px-2.5 py-1 text-[#A86F12]">{story.category}</span>
              <span className="rounded-full bg-[#FAF6EF] px-2.5 py-1 text-[#3A1F0E]/45">{story.scope}</span>
              {story.status === "pending" && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Pending review</span>}
              {story.sourceStatus === "verified" && <span className="flex items-center gap-1 text-green-700"><Check className="h-3 w-3" />Verified source</span>}
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold text-[#2B1507]">{story.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#3A1F0E]/75">{story.summary}</p>
            {(story.city || story.state) && <p className="mt-3 flex items-center gap-1 text-xs text-[#3A1F0E]/45"><MapPin className="h-3 w-3" />{[story.city, story.state].filter(Boolean).join(", ")}</p>}
            {story.rankingReason && feed === "foryou" && <p className="mt-3 rounded-xl bg-[#FAF6EF] px-3 py-2 text-xs text-[#3A1F0E]/55"><strong>Why you’re seeing this:</strong> {story.rankingReason}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#3A1F0E]/7 pt-4 text-xs font-bold">
              {story.sourceUrl && <a href={story.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#A86F12] hover:underline">Read source <ExternalLink className="h-3 w-3" /></a>}
              {story.status === "approved" && !story.isOwnStory && <button disabled={confirming === story.id} onClick={() => void toggleConfirm(story)} className={`flex items-center gap-1 ${story.hasConfirmed ? "text-green-700" : "text-[#3A1F0E]/50"}`}><Check className="h-3 w-3" />{story.hasConfirmed ? "Confirmed" : "Confirm"} ({story.confirmCount})</button>}
              {story.communityPostId && <button onClick={() => onDiscuss(story.communityPostId!, story.title)} className="text-[#A86F12] hover:underline">Discuss</button>}
              {isAuthenticated && story.status === "approved" && <button onClick={() => void report(story.id)} className="ml-auto flex items-center gap-1 text-[#3A1F0E]/35 hover:text-red-600"><Flag className="h-3 w-3" />Report</button>}
            </div>
          </article>)}
        </div>
      )}

      {showForm && <HappeningForm onClose={() => setShowForm(false)} onSubmitted={() => { setShowForm(false); void load(); }} />}
    </section>
  );
}

function HappeningForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("community");
  const [scope, setScope] = useState<(typeof SCOPES)[number]>("local");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicTags = useMemo(() => tags.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8), [tags]);
  const canSubmit = title.trim() && summary.trim() && (scope !== "local" || city.trim()) && (scope !== "state" || state.trim());

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/knowledge/happening-now`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, sourceUrl: sourceUrl || undefined, category, scope, city: city || undefined, state: state || undefined, topicTags }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not submit this update.");
      onSubmitted();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit this update."); }
    finally { setSubmitting(false); }
  };

  return <div data-testid="happening-submit-dialog" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="happening-form-title" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="mb-4 flex items-center justify-between"><div><h3 id="happening-form-title" className="font-serif text-xl font-bold text-[#2B1507]">Share what’s happening</h3><p className="text-xs text-[#3A1F0E]/50">Reliable articles and community-impact updates are reviewed before publishing.</p></div><button type="button" onClick={onClose} aria-label="Close share form" className="rounded-full bg-[#FAF6EF] p-2 text-[#3A1F0E]"><X className="h-4 w-4" /></button></header>
      <div className="space-y-3">
        <div>
          <label htmlFor="happening-title" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Headline</label>
          <input id="happening-title" data-testid="happening-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder="Add a clear headline" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" />
        </div>
        <div>
          <label htmlFor="happening-summary" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Community impact</label>
          <textarea id="happening-summary" data-testid="happening-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={3000} rows={5} placeholder="What should the community know, and why does it matter?" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full resize-none rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" />
        </div>
        <div>
          <label htmlFor="happening-source-url" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Source URL <span className="font-normal">(recommended for articles)</span></label>
          <input id="happening-source-url" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/article" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="happening-category" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Category</label>
            <select id="happening-category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]">{CATEGORIES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select>
          </div>
          <div>
            <label htmlFor="happening-scope" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Geographic scope</label>
            <select id="happening-scope" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]">{SCOPES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select>
          </div>
        </div>
        {(scope === "local" || scope === "state") && <div className="grid grid-cols-2 gap-3">
          {scope === "local" && <div><label htmlFor="happening-city" className="mb-1 block text-sm font-bold text-[#3A1F0E]">City</label><input id="happening-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City name" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" /></div>}
          <div><label htmlFor="happening-state" className="mb-1 block text-sm font-bold text-[#3A1F0E]">State</label><input id="happening-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State or territory" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" /></div>
        </div>}
        <div>
          <label htmlFor="happening-topics" className="mb-1 block text-sm font-bold text-[#3A1F0E]">Topics</label>
          <input id="happening-topics" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separate topics with commas" style={{ color: "#3A1F0E", backgroundColor: "#FAF6EF", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E", colorScheme: "light" }} className="w-full rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B]" />
        </div>
        {error && <p className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}
        <button id="happening-submit" type="button" data-testid="happening-submit" onClick={() => void submit()} disabled={!canSubmit || submitting} style={{ color: "#2B1507", backgroundColor: "#CA922B", WebkitTextFillColor: "#2B1507", colorScheme: "light" }} className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-bold text-[#2B1507] disabled:bg-[#E6D9C2] disabled:text-[#574536] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B1507] focus-visible:ring-offset-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit for review</button>
      </div>
    </section>
  </div>;
}
