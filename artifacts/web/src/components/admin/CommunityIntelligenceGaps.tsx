import { useEffect, useState } from "react";
import { BarChart3, EyeOff, RefreshCw, ShieldCheck } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
type Gap = { journeyType: "wedding" | "birthday"; stage: "inspiration"; categoryKey: string; coverage: "enough_community_input"; timeWindow: "last_90_days"; explanation: string };
type Payload = { gaps: Gap[]; coverage: string };

export function CommunityIntelligenceGaps() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/admin/community-intelligence/gaps`, { credentials: "include" });
      if (!response.ok) throw new Error("Community Intelligence aggregates are unavailable.");
      setPayload(await response.json() as Payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Community Intelligence aggregates are unavailable."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-5">
    <div className="rounded-2xl border border-[#2D7A4F]/25 bg-[#F1FAF4] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2D7A4F]" /><div><h2 className="text-lg font-bold text-[#173F2A]">Community Intelligence category gaps</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[#173F2A]/72">This view is intentionally aggregate-only. It does not show members, messages, private journeys, exact locations, raw small-cohort counts, or business listings. Categories appear only after the server’s privacy threshold is satisfied.</p></div></div></div>
    <div className="flex justify-end"><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-xs font-bold text-[#3A1F0E] hover:border-[#CA922B]/45 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
    {!loading && !error && payload?.gaps.length === 0 ? <div className="rounded-2xl border border-dashed border-[#3A1F0E]/20 bg-white p-8 text-center"><EyeOff className="mx-auto h-6 w-6 text-[#3A1F0E]/35" /><p className="mt-3 font-semibold text-[#3A1F0E]">No privacy-safe category gaps to review</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#3A1F0E]/55">This can mean collection is disabled, not enough opted-in feedback exists, or all current categories remain below suppression thresholds.</p></div> : null}
    {!loading && payload?.gaps.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{payload.gaps.map((gap) => <article key={`${gap.journeyType}-${gap.categoryKey}`} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">{gap.journeyType} · {gap.stage}</p><h3 className="mt-1 text-sm font-bold capitalize text-[#2B1507]">{gap.categoryKey.replaceAll("_", " ")}</h3></div><BarChart3 className="h-4 w-4 text-[#2D7A4F]" /></div><p className="mt-3 text-xs leading-5 text-[#3A1F0E]/65">{gap.explanation}</p><p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#3A1F0E]/45">{gap.coverage.replaceAll("_", " ")} · {gap.timeWindow.replaceAll("_", " ")}</p></article>)}</div> : null}
    {payload?.coverage ? <p className="text-xs leading-5 text-[#3A1F0E]/45">{payload.coverage}</p> : null}
  </div>;
}
