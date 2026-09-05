import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, ShieldCheck } from "lucide-react";
import { OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type IdentityResponse = {
  identity?: {
    ownershipBadges?: string[];
  };
  error?: string;
};

export function BusinessOwnershipEditor({ businessId }: { businessId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    authenticatedFetch(`${BASE}api/businesses/mine/identity?businessId=${encodeURIComponent(businessId)}`)
      .then(async (response) => {
        const body = await response.json() as IdentityResponse;
        if (!response.ok) throw new Error(body.error ?? "Could not load ownership labels.");
        if (active) setSelected(body.identity?.ownershipBadges ?? []);
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load ownership labels.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessId]);

  const choices = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return OWNERSHIP_DESIGNATIONS;
    return OWNERSHIP_DESIGNATIONS.filter((label) => label.toLocaleLowerCase().includes(normalized));
  }, [query]);

  function toggle(label: string) {
    setMessage(null);
    setSelected((current) => {
      if (current.includes(label)) return current.filter((value) => value !== label);
      if (current.length >= 10) {
        setMessage("Choose up to 10 labels that directly apply to this business.");
        return current;
      }
      return [...current, label];
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/mine/identity?businessId=${encodeURIComponent(businessId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownershipBadges: selected }),
        },
      );
      const body = await response.json() as IdentityResponse;
      if (!response.ok) throw new Error(body.error ?? "Could not save ownership labels.");
      setSelected(body.identity?.ownershipBadges ?? selected);
      setMessage("Ownership labels saved. They are shown as owner-provided; verification remains separate.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save ownership labels.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/10">
          <ShieldCheck className="h-4 w-4 text-[#CA922B]" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2B1507]">Ownership & community identity</h3>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/65">
            Optional self-identification. Choose only labels you want shown publicly. These labels are separate from MWM verification.
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
        <div className="flex items-center gap-2 py-4 text-sm text-[#3A1F0E]/55">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading labels…
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3">
          <div className="flex flex-wrap gap-2">
            {choices.map((label) => {
              const active = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(label)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${active
                    ? "border-[#CA922B] bg-[#CA922B] text-white"
                    : "border-[#3A1F0E]/20 bg-white text-[#2B1507] hover:border-[#CA922B]/60"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#3A1F0E]/55">{selected.length}/10 selected</p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save public labels"}
        </button>
      </div>
      {message && <p role="status" className="mt-3 text-sm font-medium text-[#6A3B1E]">{message}</p>}
    </section>
  );
}
