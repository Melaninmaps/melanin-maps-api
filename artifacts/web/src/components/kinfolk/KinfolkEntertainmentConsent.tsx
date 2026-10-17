import { useState } from "react";
import { Check, Lock, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export type KinfolkEntertainmentConsentPlan = {
  operation: "add" | "remove" | "replace" | "set_cost_policy";
  add: string[];
  remove: string[];
  costPolicy: "any" | "included_only" | null;
  summary: string;
};

export function KinfolkEntertainmentConsent({
  plan,
  onSaved,
  onDismiss,
}: {
  plan: KinfolkEntertainmentConsentPlan;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/entertainment/consent`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, ...plan }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ??
            "Kinfolk could not save this entertainment preference.",
        );
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kinfolk could not save this entertainment preference.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <aside
      data-testid="kinfolk-entertainment-consent"
      className="mt-3 rounded-2xl border border-[#CA922B]/35 bg-[#FFF8EC] p-4"
    >
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" />
        <div>
          <p className="text-sm font-semibold text-[#2B1507]">
            Save an entertainment preference?
          </p>
          <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">
            {plan.summary} Kinfolk will use it only for relevant entertainment
            choices. It does not prove live availability, change a subscription,
            or make a purchase.
          </p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void confirm()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save privately"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#3A1F0E]/55"
        >
          <X className="h-3.5 w-3.5" />
          Don’t save
        </button>
      </div>
    </aside>
  );
}
