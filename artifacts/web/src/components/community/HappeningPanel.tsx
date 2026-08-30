import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ExternalLink, Flag, Loader2, MapPin, Plus, Radio, Send, X } from "lucide-react";

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
      const response = await fetch(`${BASE}api/knowledge/happening-now?${params.toString()}`, { credentials: "include" });
      const body = await response.json().catch(() => ({})) as { stories?: HappeningStory[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load community updates.");
      setStories(body.stories ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load community updates.");
    } finally {
      setLoading(false);
    }
  }, [feed, scope]);

  useEffect(() => { void load(); }, [load]);

  const toggleConfirm = async (story: HappeningStory) => {
    if (!isAuthenticated || confirming) return;
    setConfirming(story.id);
    try {
      const response = await fetch(`${BASE}api/knowledge/happening-now/${encodeURIComponent(story.id)}/confirm`, { method: "POST", credentials: "include" });
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
    const response = await fetch(`${BASE}api/knowledge/happening-now/${encodeURIComponent(storyId)}/report`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
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
        <select aria-label="Community update scope" value={scope} onChange={(event) => setScope(event.target.value)} className="ml-auto rounded-full border border-[#3A1F0E]/10 bg-white px-4 py-2 text-xs font-bold text-[#3A1F0E]/65">
          <option value="all">All locations</option>
          {SCOPES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
        </select>
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
      const response = await fetch(`${BASE}api/knowledge/happening-now`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, sourceUrl: sourceUrl || undefined, category, scope, city: city || undefined, state: state || undefined, topicTags }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not submit this update.");
      onSubmitted();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit this update."); }
    finally { setSubmitting(false); }
  };

  return <div data-testid="happening-submit-dialog" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <section className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="mb-4 flex items-center justify-between"><div><h3 className="font-serif text-xl font-bold text-[#2B1507]">Share what’s happening</h3><p className="text-xs text-[#3A1F0E]/50">Reliable articles and community-impact updates are reviewed before publishing.</p></div><button onClick={onClose} className="rounded-full bg-[#FAF6EF] p-2"><X className="h-4 w-4" /></button></header>
      <div className="space-y-3">
        <input data-testid="happening-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder="Headline" className="w-full rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm outline-none focus:border-[#CA922B]" />
        <textarea data-testid="happening-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={3000} rows={5} placeholder="What should the community know, and why does it matter?" className="w-full resize-none rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm outline-none focus:border-[#CA922B]" />
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Source URL (recommended for articles)" className="w-full rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm outline-none focus:border-[#CA922B]" />
        <div className="grid grid-cols-2 gap-3"><select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm">{CATEGORIES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className="rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm">{SCOPES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
        {(scope === "local" || scope === "state") && <div className="grid grid-cols-2 gap-3">{scope === "local" && <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm" />}<input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm" /></div>}
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Topics, separated by commas" className="w-full rounded-2xl border border-[#3A1F0E]/12 bg-[#FAF6EF] px-4 py-3 text-sm" />
        {error && <p className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}
        <button data-testid="happening-submit" onClick={() => void submit()} disabled={!canSubmit || submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#CA922B] px-5 py-3 font-bold text-white disabled:opacity-40">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit for review</button>
      </div>
    </section>
  </div>;
}
