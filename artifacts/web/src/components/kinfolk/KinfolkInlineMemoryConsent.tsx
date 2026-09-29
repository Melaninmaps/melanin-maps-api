import { useMemo, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
export type KinfolkInlineMemoryConsentPlan = {
  purpose: string;
  ordinary: Array<{ id: string; kind: "ordinary"; label: string; content: string }>;
  sensitive: Array<{ id: string; kind: "sensitive"; label: string; content: string }>;
};

export function KinfolkInlineMemoryConsent({ message, plan, sessionId, onSaved, onDismiss }: {
  message: string;
  plan: KinfolkInlineMemoryConsentPlan;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const allItems = useMemo(() => [...plan.ordinary, ...plan.sensitive], [plan]);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (ids: string[]) => {
    if (!ids.length) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memory-consent`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, message, selectedIds: ids, sessionId: sessionId ?? undefined }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not save the selected details.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kinfolk could not save the selected details."); }
    finally { setSaving(false); }
  };
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <aside data-testid="kinfolk-inline-memory-consent" className="mt-3 rounded-2xl border border-[#CA922B]/35 bg-[#FFF8EC] p-4">
    <div className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" /><div><p className="text-sm font-semibold text-[#2B1507]">What should Kinfolk remember?</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">Nothing has been saved yet. Preferences can guide relevant searches. Personal details stay private and are used only when relevant—not for promotion, advertising, or community sharing.</p></div></div>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {!choosing ? <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void save(allItems.map((item) => item.id))} disabled={saving} className="rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save all for relevant use"}</button>{plan.ordinary.length > 0 && <button type="button" onClick={() => void save(plan.ordinary.map((item) => item.id))} disabled={saving} className="rounded-full border border-[#CA922B]/45 px-3 py-2 text-xs font-semibold text-[#8D5C17] disabled:opacity-60">Save only preferences and interests</button>}<button type="button" onClick={() => { setChoosing(true); setSelected([]); }} disabled={saving} className="px-2 py-2 text-xs font-semibold text-[#3A1F0E]/55">Choose individually</button><button type="button" onClick={onDismiss} disabled={saving} className="px-2 py-2 text-xs font-semibold text-[#3A1F0E]/55">Don’t save</button></div> : <div className="mt-3 space-y-2">{allItems.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} className="mt-0.5 accent-[#8D5C17]" /><span><span className="block text-xs font-semibold text-[#2B1507]">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[#3A1F0E]/60">{item.kind === "sensitive" ? "Sensitive—used only when it helps with a relevant question." : item.content}</span></span></label>)}<div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void save(selected)} disabled={saving || selected.length === 0} className="rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save selected"}</button><button type="button" onClick={onDismiss} disabled={saving} className="text-xs font-semibold text-[#3A1F0E]/55">Don’t save</button></div></div>}
  </aside>;
}
