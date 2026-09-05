import { useMemo, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import {
  getBusinessExperiencePolicy,
  getOwnerProfileExperienceChoices,
  normalizeOwnerExperienceKey,
} from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

interface BusinessExperienceEditorProps {
  business: {
    id: string;
    category: string;
    subcategory?: string | null;
    vibes?: string[] | null;
    priceRange?: string | null;
  };
}

export function BusinessExperienceEditor({ business }: BusinessExperienceEditorProps) {
  const policy = useMemo(() => getBusinessExperiencePolicy(business.category, business.subcategory), [business.category, business.subcategory]);
  const profileChoices = useMemo(() => getOwnerProfileExperienceChoices(policy), [policy]);
  const [selected, setSelected] = useState<string[]>(() => (business.vibes ?? [])
    .map(normalizeOwnerExperienceKey)
    .filter((key) => profileChoices.some((choice) => choice.key === key))
    .slice(0, 2));
  const [priceKey, setPriceKey] = useState<string | null>(() => policy.priceChoices.find((choice) => choice.label === business.priceRange)?.key ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(key: string) {
    setMessage(null);
    setSelected((current) => current.includes(key)
      ? current.filter((value) => value !== key)
      : current.length < 2 ? [...current, key] : current);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/vibes/businesses/${business.id}/owner-tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibes: selected, priceKey }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save experience details.");
      setMessage("Saved. Your profile now uses these owner-provided tags and price point in search.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save experience details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/12"><Sparkles className="h-4 w-4 text-[#CA922B]" /></div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#2B1507]">Business experience</h2>
          <p className="mt-1 text-sm text-[#3A1F0E]/60">Choose up to two honest profile tags that fit this business type. Restaurants can describe atmosphere; professionals can describe service. Community feedback remains separate.</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/55">{selected.length}/2 owner tags</p>
      <div className="flex flex-wrap gap-2">
        {profileChoices.map((choice) => {
          const active = selected.includes(choice.key);
          return (
            <button key={choice.key} type="button" aria-pressed={active} onClick={() => toggle(choice.key)} className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-[#3A1F0E]/20 bg-[#FAF6EF] text-[#2B1507]"}`}>
              {active && <Check className="mr-1 inline h-3 w-3" />}{choice.label}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/55">Usual price point</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {policy.priceChoices.map((choice) => {
          const active = priceKey === choice.key;
          return (
            <button key={choice.key} type="button" aria-pressed={active} onClick={() => setPriceKey(active ? null : choice.key)} className={`min-h-14 rounded-xl border p-2 text-left ${active ? "border-[#CA922B] bg-[#CA922B]/10" : "border-[#3A1F0E]/15 bg-[#FAF6EF]"}`}>
              <span className="block text-sm font-black text-[#2B1507]">{choice.label}</span>
              <span className="block text-[11px] text-[#3A1F0E]/60">{choice.helperText}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm font-medium text-[#6A3B1E]">{message}</p>
        <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save experience details"}
        </button>
      </div>
    </section>
  );
}
