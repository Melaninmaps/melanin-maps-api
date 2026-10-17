import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type FamilyGuidanceSettings = {
  familyModeEnabled: boolean;
};

/**
 * Family Mode has its own safety policy and endpoint so it never changes a
 * member's persisted age assurance, voice, or language preferences. This
 * compact control is intentionally placed in Kinfolk Settings because the
 * override also applies to Kinfolk requests.
 */
export function KinfolkFamilyModeControl() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/family/guidance-settings`,
      );
      const payload = (await response.json().catch(() => ({}))) as {
        settings?: Partial<FamilyGuidanceSettings>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Family Mode could not be loaded.");
      }
      setEnabled(payload.settings?.familyModeEnabled === true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Family Mode could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (saving || loading) return;
    const previous = enabled;
    const next = !previous;
    setEnabled(next);
    setSaving(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/family/guidance-settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyModeEnabled: next }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        settings?: Partial<FamilyGuidanceSettings>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Family Mode could not be saved.");
      }
      setEnabled(payload.settings?.familyModeEnabled === true);
    } catch (cause) {
      setEnabled(previous);
      setError(
        cause instanceof Error
          ? cause.message
          : "Family Mode could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/70 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-amber-950 dark:text-amber-100">
            Family Mode for Kinfolk
          </h3>
          <p className="mt-1 text-sm leading-6 text-amber-900/85 dark:text-amber-100/85">
            When enabled, Kinfolk uses a family-safe, age-appropriate delivery
            profile for every chat and limits local recommendations to all-ages
            options. It does not change your account age, saved Kinfolk voice,
            or language preferences.
          </p>
          <p className="mt-2 text-xs leading-5 text-amber-900/70 dark:text-amber-200/75">
            Adult venues, nightlife, gambling, alcohol-focused suggestions, and
            explicit content are not recommended while this setting is on.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle Family Mode for Kinfolk"
          disabled={loading || saving}
          onClick={() => void toggle()}
          className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-amber-700" : "bg-stone-300 dark:bg-stone-700"
          } ${loading || saving ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {loading && (
        <p className="mt-3 text-xs text-amber-900/70">Loading Family Mode…</p>
      )}
      {saving && (
        <p className="mt-3 text-xs text-amber-900/70">Saving Family Mode…</p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
