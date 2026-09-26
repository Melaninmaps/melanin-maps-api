import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export const KINFOLK_CONTINUITY_DISCLOSURE_COPY = "Kinfolk works better when it can remember the things you share—your preferences, plans, and ongoing goals—so you do not have to start over every time. You can review, edit, turn this off, or delete it anytime.";

export function KinfolkContinuityDisclosure({
  visible,
  onChoose,
}: {
  visible: boolean;
  onChoose: (decision: "accepted" | "declined") => Promise<boolean>;
}) {
  const [saving, setSaving] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!visible) return null;

  const choose = async (decision: "accepted" | "declined") => {
    if (saving) return;
    setSaving(decision);
    setError(null);
    const saved = await onChoose(decision);
    if (!saved) setError("Kinfolk could not save your choice. Please try again.");
    setSaving(null);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1D120C]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="kinfolk-continuity-title">
      <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#CA922B]/15"><Lock className="h-5 w-5 text-[#8D5C17]" /></div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Your continuity, your control</p>
        <h2 id="kinfolk-continuity-title" className="mt-2 font-serif text-2xl font-bold text-[#2B1507]">Let Kinfolk remember?</h2>
        <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/70">{KINFOLK_CONTINUITY_DISCLOSURE_COPY}</p>
        <p className="mt-3 text-xs leading-5 text-[#3A1F0E]/55">Sensitive details—including health, exact location, identity, finances, religion, sexuality, and children—always need a separate confirmation before Kinfolk saves them.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void choose("accepted")} disabled={saving !== null} className="flex min-h-12 items-center justify-center rounded-xl bg-[#CA922B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#B38024] disabled:opacity-60">
            {saving === "accepted" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Let Kinfolk remember"}
          </button>
          <button type="button" onClick={() => void choose("declined")} disabled={saving !== null} className="flex min-h-12 items-center justify-center rounded-xl border border-[#3A1F0E]/15 bg-white px-4 py-3 text-sm font-bold text-[#3A1F0E] transition hover:border-[#CA922B]/55 disabled:opacity-60">
            {saving === "declined" ? <Loader2 className="h-4 w-4 animate-spin text-[#8D5C17]" /> : "Keep memory off"}
          </button>
        </div>
      </section>
    </div>
  );
}
