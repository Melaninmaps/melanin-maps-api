import { useEffect, useState } from "react";
import { Loader2, Store } from "lucide-react";
import {
  OWNERSHIP_FILTER_OPTIONS,
  ownershipDesignationFilterId,
  replaceSelectedSupportLensOption,
  selectedSupportLensOption,
  SUPPORT_LENS_PRIMARY_OPTIONS,
  SUPPORT_LENS_SECONDARY_OPTIONS,
} from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type PreferencesResponse = {
  preferences?: { ownershipTypes?: string[] | null; supportLensMode?: string };
  error?: string;
};

export function BusinessSupportPreferences() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"all_businesses" | "strict_documented_designations">("all_businesses");

  useEffect(() => {
    let active = true;
    authenticatedFetch(`${BASE}api/kinfolk/preferences`)
      .then(async (response) => {
        const body = await response.json() as PreferencesResponse;
        if (!response.ok) throw new Error(body.error ?? "Could not load business support choices.");
        if (active) {
          setSelected((body.preferences?.ownershipTypes ?? []).map(ownershipDesignationFilterId));
          setMode(body.preferences?.supportLensMode === "strict_documented_designations"
            ? "strict_documented_designations"
            : "all_businesses");
        }
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load business support choices.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const primaryId = selectedSupportLensOption(selected, SUPPORT_LENS_PRIMARY_OPTIONS);
  const secondaryId = selectedSupportLensOption(selected, SUPPORT_LENS_SECONDARY_OPTIONS);
  const retainedChoices = selected
    .filter((id) => id !== primaryId && id !== secondaryId)
    .map((id) => OWNERSHIP_FILTER_OPTIONS.find((option) => option.id === id)?.label ?? id);

  function replaceChoice(
    options: readonly { id: string; label: string }[],
    nextId: string | null,
  ) {
    setMessage(null);
    setSelected((current) => replaceSelectedSupportLensOption(current, options, nextId));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/kinfolk/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredOwnershipTypes: selected,
          supportLensMode: selected.length > 0 ? "strict_documented_designations" : "all_businesses",
        }),
      });
      const body = await response.json() as PreferencesResponse;
      if (!response.ok) throw new Error(body.error ?? "Could not save business support choices.");
      setMode(selected.length === 0 ? "all_businesses" : "strict_documented_designations");
      setMessage(selected.length === 0
        ? "Cleared. All documented businesses are available."
        : "Saved across the website and app. Strict results match every selected designation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save business support choices.");
    } finally {
      setSaving(false);
    }
  }

  async function clearAndSave() {
    setSelected([]);
    setMode("all_businesses");
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/kinfolk/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredOwnershipTypes: [],
          supportLensMode: "all_businesses",
        }),
      });
      const body = await response.json() as PreferencesResponse;
      if (!response.ok) throw new Error(body.error ?? "Could not clear Support Lens.");
      setMessage("Cleared. All documented businesses are available.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not clear Support Lens.");
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
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">Your Support Lens</h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/65">
            Your Support Lens is optional and private. It helps MWM show documented businesses you intentionally want to support. It does not say who you are, and it never removes anyone from MWM. You can change, clear, or broaden it any time.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[#3A1F0E]/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading choices…</div>
      ) : (
        <div className="space-y-4 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#2B1507]">Primary support choice</span>
            <span className="mb-2 block text-xs leading-5 text-[#3A1F0E]/60">Black / African American-Owned is first, Foundational Black American-Owned is second, and Latino / Hispanic-Owned is third.</span>
            <select
              value={primaryId ?? ""}
              onChange={(event) => replaceChoice(SUPPORT_LENS_PRIMARY_OPTIONS, event.target.value || null)}
              className="min-h-11 w-full rounded-xl border border-[#3A1F0E]/20 bg-white px-3 text-sm font-semibold text-[#2B1507] focus:border-[#CA922B] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/20"
            >
              <option value="">No primary choice</option>
              {SUPPORT_LENS_PRIMARY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#2B1507]">Additional profile badge <span className="font-normal text-[#3A1F0E]/55">optional</span></span>
            <span className="mb-2 block text-xs leading-5 text-[#3A1F0E]/60">Add one secondary criterion, including Divine Nine-Affiliated or Veteran-Owned.</span>
            <select
              value={secondaryId ?? ""}
              onChange={(event) => replaceChoice(SUPPORT_LENS_SECONDARY_OPTIONS, event.target.value || null)}
              className="min-h-11 w-full rounded-xl border border-[#3A1F0E]/20 bg-white px-3 text-sm font-semibold text-[#2B1507] focus:border-[#CA922B] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/20"
            >
              <option value="">No secondary criterion</option>
              {SUPPORT_LENS_SECONDARY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          {retainedChoices.length > 0 ? <p className="text-xs leading-5 text-[#3A1F0E]/55">Other saved support choices remain active to preserve your preferences: {retainedChoices.join(", ")}. Clear the Support Lens below to remove every saved choice.</p> : null}
        </div>
      )}

      <p className="mt-3 text-xs font-semibold text-[#3A1F0E]/60">
        {selected.length > 1 ? "Show businesses that match every selection." : mode === "strict_documented_designations" ? "Strict documented-designation results are active." : "All documented businesses are available."}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#3A1F0E]/55">{selected.length} selected</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void clearAndSave()} disabled={saving} className="min-h-10 rounded-full border border-[#3A1F0E]/20 bg-white px-4 text-sm font-bold text-[#2B1507]">Show all businesses equally</button>
          <button type="button" onClick={() => void clearAndSave()} disabled={saving} className="min-h-10 rounded-full border border-[#3A1F0E]/20 bg-white px-4 text-sm font-bold text-[#2B1507]">Skip for now</button>
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
