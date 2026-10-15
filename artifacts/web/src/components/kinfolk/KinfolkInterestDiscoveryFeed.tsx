import { useCallback, useEffect, useState } from "react";
import { Bookmark, Compass, Share2, ThumbsDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
type Recommendation = {
  id: number;
  resourceType: "business" | "event";
  resource: { id: string; title: string; category: string | null; city: string | null; state: string | null; detailPath: string; startsOn?: string };
  interestLabel: string;
  reason: string;
  actions: Array<"save" | "share" | "not_interested" | "circle">;
};

/** A compact, member-controlled web counterpart to the native For You cards. */
export function KinfolkInterestDiscoveryFeed() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}api/kinfolk/interest-intelligence`, { credentials: "include", cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { recommendations?: Recommendation[] };
      setRecommendations(response.ok && Array.isArray(payload.recommendations) ? payload.recommendations : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("kinfolk-interest-intelligence-updated", refresh);
    return () => window.removeEventListener("kinfolk-interest-intelligence-updated", refresh);
  }, [load]);

  const feedback = async (recommendation: Recommendation, value: "interested" | "not_interested") => {
    setRecommendations((current) => current.filter((item) => item.id !== recommendation.id));
    await fetch(`${BASE}api/kinfolk/interest-intelligence/recommendations/${recommendation.id}/feedback`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedback: value }),
    }).catch(() => undefined);
  };

  const save = async (recommendation: Recommendation) => {
    if (recommendation.resourceType !== "business") return;
    try {
      const result = await fetch(`${BASE}api/saved-places`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: recommendation.resource.id }) });
      if (result.ok) await feedback(recommendation, "interested");
    } catch { /* preserve the card if saving is unavailable */ }
  };

  const share = async (recommendation: Recommendation) => {
    const place = [recommendation.resource.city, recommendation.resource.state].filter(Boolean).join(", ");
    if (navigator.share) await navigator.share({ title: recommendation.resource.title, text: `${recommendation.resource.title}${place ? ` — ${place}` : ""}\n${recommendation.reason}` }).catch(() => undefined);
  };

  if (loading || !recommendations.length) return null;
  return <section className="mb-6 rounded-3xl border border-[#CA922B]/25 bg-gradient-to-br from-[#FFF8EC] to-white p-5" data-testid="kinfolk-interest-discovery-feed">
    <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold text-[#2B1507]"><Compass className="h-4 w-4 text-[#CA922B]" />For You</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">From interests you confirmed or explicitly saved—never raw chat or search text.</p></div><a href="#kinfolk-interest-intelligence-manager" className="shrink-0 text-xs font-bold text-[#8D5C17] hover:underline">Manage</a></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{recommendations.map((recommendation) => <article key={recommendation.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4"><p className="text-sm font-bold text-[#2B1507]">{recommendation.resource.title}</p><p className="mt-1 text-xs text-[#3A1F0E]/55">{[recommendation.resource.category, recommendation.resource.city, recommendation.resource.state].filter(Boolean).join(" · ")}</p><p className="mt-2 text-xs leading-5 text-[#3A1F0E]/65">{recommendation.reason}</p><div className="mt-3 flex flex-wrap items-center gap-3"><a href={recommendation.resource.detailPath} className="rounded-lg bg-[#2B1507] px-3 py-1.5 text-xs font-bold text-white">View</a>{recommendation.actions.includes("save") && <button type="button" onClick={() => void save(recommendation)} className="inline-flex items-center gap-1 text-xs font-bold text-[#8D5C17]"><Bookmark className="h-3.5 w-3.5" />Save</button>}<button type="button" onClick={() => void share(recommendation)} className="inline-flex items-center gap-1 text-xs font-bold text-[#8D5C17]"><Share2 className="h-3.5 w-3.5" />Share</button><button type="button" onClick={() => void feedback(recommendation, "not_interested")} className="inline-flex items-center gap-1 text-xs font-bold text-[#3A1F0E]/55"><ThumbsDown className="h-3.5 w-3.5" />Not interested</button></div></article>)}</div>
  </section>;
}
