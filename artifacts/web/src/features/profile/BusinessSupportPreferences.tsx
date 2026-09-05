import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, Store } from "lucide-react";
import {
  OWNERSHIP_FILTER_OPTIONS,
  ownershipDesignationFilterId,
} from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type PreferencesResponse = {
  preferences?: { ownershipTypes?: string[] | null };
  error?: string;
};

export function BusinessSupportPreferences() {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authenticatedFetch(`${BASE}api/kinfolk/preferences`)
      .then(async (response) => {
        const body = await response.json() as PreferencesResponse;
        if (!response.ok) throw new Error(body.error ?? "Could not load business support choices.");
        if (active) {
          setSelected((body.preferences?.ownershipTypes ?? []).map(ownershipDesignationFilterId));
        }
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load business support choices.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return OWNERSHIP_FILTER_OPTIONS;
    return OWNERSHIP_FILTER_OPTIONS.filter((option) => option.label.toLocaleLowerCase().includes(normalized));
  }, [query]);

  function toggle(id: string) {
    setMessage(null);
    setSelected((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/kinfolk/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredOwnershipTypes: selected }),
      });
      const body = await response.json() as PreferencesResponse;
      if (!response.ok) throw new Error(body.error ?? "Could not save business support choices.");
      setMessage(selected.length === 0
        ? "Cleared. All businesses will be ranked equally."
        : "Saved across the website and app. Matching businesses will be prioritized, not exclusively shown.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save business support choices.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/12">
          <Store className="h-5 w-5 text-[#CA922B]" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">Businesses you want to support</h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/65">
            Choose optional owner-provided identities to prioritize. The full directory remains available, and documented verification stays separate.
          </p>
        </div>
      </div>

      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A1F0E]/50" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ownership labels"
          className="w-full rounded-xl border border-[#3A1F0E]/20 bg-white py-2.5 pl-10 pr-3 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/45 focus:border-[#CA922B] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/20"
        />
      </label>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[#3A1F0E]/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading choices…</div>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3">
          <div className="flex flex-wrap gap-2">
            {visible.map((option) => {
              const active = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(option.id)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${active
                    ? "border-[#CA922B] bg-[#CA922B] text-white"
                    : "border-[#3A1F0E]/20 bg-white text-[#2B1507] hover:border-[#CA922B]/60"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#3A1F0E]/55">{selected.length} selected</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setSelected([])} className="min-h-10 rounded-full border border-[#3A1F0E]/20 bg-white px-4 text-sm font-bold text-[#2B1507]">Clear</button>
          <button type="button" onClick={() => void save()} disabled={loading || saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save support choices"}
          </button>
        </div>
      </div>
      {message && <p role="status" className="mt-3 text-sm font-medium text-[#6A3B1E]">{message}</p>}
    </section>
  );
}
