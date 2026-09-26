import { useState } from "react";
import { Users } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export type KinfolkCompanionMemoryOffer = Readonly<{
  label: string;
  prompt: string;
}>;

export function KinfolkCompanionMemoryOfferCard({
  offer,
  sessionId,
}: {
  offer: KinfolkCompanionMemoryOffer;
  sessionId?: string | null;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensitiveConfirmationRequired, setSensitiveConfirmationRequired] = useState(false);

  if (dismissed) return null;

  const save = async (sensitiveConsent = false) => {
    const trimmed = notes.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          purpose: "companion_context",
          companionLabel: offer.label,
          companionNotes: trimmed,
          sessionId: sessionId ?? undefined,
          sensitiveConsent,
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 409) {
        setSensitiveConfirmationRequired(true);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Could not save that private note.");
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that private note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside data-testid="kinfolk-companion-memory-offer" className="mt-3 rounded-2xl border border-[#CA922B]/35 bg-[#FFF8EC] p-4">
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold text-[#2B1507]">A private note for {offer.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">{offer.prompt}</p>
        </div>
      </div>
      {saved ? (
        <p role="status" className="mt-3 text-xs font-medium text-[#8D5C17]">
          Saved privately. You can forget this companion note any time in What Kinfolk remembers.
        </p>
      ) : (
        <>
          <label className="mt-3 block text-[11px] font-medium text-[#3A1F0E]/70" htmlFor={`kinfolk-companion-${offer.label}`}>
            What should Kinfolk consider about {offer.label}?
          </label>
          <textarea
            id={`kinfolk-companion-${offer.label}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={800}
            rows={3}
            placeholder="For example: accessibility needs, budget, interests, or the kind of outing they enjoy."
            className="mt-1.5 w-full resize-y rounded-xl border border-[#3A1F0E]/12 bg-white px-3 py-2 text-xs leading-5 text-[#2B1507] outline-none placeholder:text-[#3A1F0E]/35 focus:border-[#CA922B]/55"
          />
          <p className="mt-2 text-[10px] leading-4 text-[#3A1F0E]/50">
            Separate from your profile. Kinfolk uses it only when you bring up {offer.label}, and your current request always comes first.
          </p>
          {error && <p role="alert" className="mt-2 text-[11px] text-red-700">{error}</p>}
          {sensitiveConfirmationRequired && <p className="mt-3 text-xs leading-5 text-[#8D5C17]">This note may include a sensitive detail. Kinfolk has not saved it. Choose separately if you want to keep it private.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void save(sensitiveConfirmationRequired)}
              disabled={!notes.trim() || saving}
              className="rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5A3517] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {saving ? "Saving…" : sensitiveConfirmationRequired ? "Save sensitive note privately" : "Save private note"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-xs font-medium text-[#3A1F0E]/50 transition-colors hover:text-[#8D5C17]"
            >
              Not now
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
