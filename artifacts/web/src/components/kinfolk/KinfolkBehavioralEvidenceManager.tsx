import { useCallback, useEffect, useState } from "react";
import { Check, Eye, ShieldAlert, Trash2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
type LearningMode = "off" | "review" | "on";
type Evidence = {
  id: string;
  signalKey: string;
  stance: "helpful" | "not_helpful";
  count: number;
  status: "pending" | "active";
  firstObservedAt: string;
  lastObservedAt: string;
  approvedAt: string | null;
  updatedAt: string;
};
type View = { mode: LearningMode; evidence: Evidence[]; disclosure?: string };

const MODE_COPY: Array<{ mode: LearningMode; label: string; detail: string }> = [
  { mode: "off", label: "Off", detail: "Default. Kinfolk does not collect or use behavioral evidence." },
  { mode: "review", label: "Review first", detail: "Safe broad feedback patterns wait for your approval before use." },
  { mode: "on", label: "On", detail: "Use only safe broad feedback patterns; review or delete them any time." },
];

function categoryLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function unavailableMessage(payload: unknown): string {
  const code = typeof payload === "object" && payload !== null && "error" in payload
    ? (payload as { error?: unknown }).error
    : undefined;
  return code === "KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE"
    ? "Behavioral evidence needs its approved service migration before it is available. No behavioral evidence was changed or used."
    : "Behavioral evidence could not be updated. Nothing was claimed as saved.";
}

export function KinfolkBehavioralEvidenceManager() {
  const [view, setView] = useState<View>({ mode: "off", evidence: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}api/kinfolk/behavioral-evidence`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(unavailableMessage(payload));
      const data = payload as Partial<View>;
      setView({
        mode: data.mode === "review" || data.mode === "on" ? data.mode : "off",
        evidence: Array.isArray(data.evidence) ? data.evidence as Evidence[] : [],
        disclosure: typeof data.disclosure === "string" ? data.disclosure : undefined,
      });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Behavioral evidence could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const request = async (path: string, method: "PUT" | "PATCH" | "DELETE", body?: unknown) => {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/behavioral-evidence${path}`, {
        method,
        credentials: "include",
        cache: "no-store",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(unavailableMessage(payload));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Behavioral evidence could not be updated. Nothing was claimed as saved.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="border-t border-[#3A1F0E]/8 pt-6" data-testid="kinfolk-behavioral-evidence-manager">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-[#CA922B]" />
        <h4 className="text-sm font-bold text-[#2B1507]">Reviewable interaction patterns</h4>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
        {view.disclosure ?? "A separate layer for reviewable, broad Kinfolk feedback patterns — never a saved memory, preference, or Current Chapter."}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#3A1F0E]/55">
        It never infers identity, health, legal or immigration status, financial status, relationship, safety status, or a sensitive life circumstance. V1 considers only your explicit helpful or not helpful response feedback in a small set of broad, non-sensitive Kinfolk categories.
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-[#3A1F0E]/50">Loading reviewable interaction patterns…</p> : <>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {MODE_COPY.map((choice) => {
            const selected = view.mode === choice.mode;
            return <button
              key={choice.mode}
              type="button"
              disabled={working}
              aria-pressed={selected}
              data-testid={`kinfolk-behavioral-mode-${choice.mode}`}
              onClick={() => void request("/mode", "PUT", { mode: choice.mode })}
              className={`rounded-2xl border p-3 text-left disabled:opacity-55 ${selected ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/45"}`}
            >
              <span className="flex items-center justify-between text-sm font-bold text-[#2B1507]">{choice.label}{selected && <Check className="h-4 w-4 text-[#CA922B]" />}</span>
              <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/55">{choice.detail}</span>
            </button>;
          })}
        </div>
        {view.mode === "off" && <p className="mt-3 text-xs leading-5 text-[#3A1F0E]/55">Off takes effect immediately: Kinfolk will not collect or use this layer.</p>}
        <div className="mt-4 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#2B1507]">Your review list</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">Only a category, helpful or not helpful stance, count, and review state appear here — never feedback text, chat, places, or other activity.</p></div>{view.evidence.length > 0 && <button type="button" disabled={working} onClick={() => void request("", "DELETE")} data-testid="kinfolk-behavioral-clear-all" className="shrink-0 text-xs font-bold text-red-700 disabled:opacity-55">Clear all</button>}</div>
          {view.evidence.length === 0 ? <p className="mt-3 text-xs text-[#3A1F0E]/55">No reviewable interaction patterns are saved.</p> : <ul className="mt-3 space-y-2">{view.evidence.map((evidence) => <li key={evidence.id} className="rounded-xl border border-[#3A1F0E]/10 bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold capitalize text-[#2B1507]">{categoryLabel(evidence.signalKey)} · {evidence.stance === "helpful" ? "helpful" : "not helpful"}</p><p className="mt-1 text-xs text-[#3A1F0E]/55">{evidence.count} explicit response-feedback signal{evidence.count === 1 ? "" : "s"} · {evidence.status === "pending" ? "Awaiting your approval" : "Active only for directly matching Kinfolk conversations"}</p></div><div className="flex items-center gap-3">{evidence.status === "pending" && <button type="button" disabled={working} onClick={() => void request(`/${encodeURIComponent(evidence.id)}/approve`, "PATCH", {})} data-testid={`kinfolk-behavioral-approve-${evidence.id}`} className="text-xs font-bold text-[#8D5C17] disabled:opacity-55">Approve use</button>}<button type="button" disabled={working} onClick={() => void request(`/${encodeURIComponent(evidence.id)}`, "DELETE")} data-testid={`kinfolk-behavioral-remove-${evidence.id}`} aria-label={`Remove ${categoryLabel(evidence.signalKey)} behavioral evidence`} className="inline-flex items-center gap-1 text-xs font-bold text-red-700 disabled:opacity-55"><Trash2 className="h-3.5 w-3.5" />Remove</button></div></div></li>)}</ul>}
        </div>
      </>}
      <p className="mt-3 flex gap-2 text-xs leading-5 text-[#3A1F0E]/55"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Removing or clearing an item immediately prevents its future use. This layer never ranks or determines Directory or Map eligibility.</p>
    </section>
  );
}
