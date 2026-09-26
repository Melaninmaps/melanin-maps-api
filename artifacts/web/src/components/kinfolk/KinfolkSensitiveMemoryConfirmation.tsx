import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export function KinfolkSensitiveMemoryConfirmation({
  content,
  purpose,
  sessionId,
  onSaved,
  onDismiss,
}: {
  content: string;
  purpose: string;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setSaving(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/memories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, sensitiveConsent: true, content, purpose, sessionId: sessionId ?? undefined }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not save that sensitive detail.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not save that sensitive detail.");
    } finally { setSaving(false); }
  };

  return <aside data-testid="kinfolk-sensitive-memory-confirmation" className="mx-auto mt-3 max-w-3xl rounded-2xl border border-[#CA922B]/35 bg-[#FFF8EC] p-4">
    <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" /><div><p className="text-sm font-semibold text-[#2B1507]">Save this sensitive detail privately?</p><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">Kinfolk has not saved it. Sensitive details are never retained unless you make this separate choice. You can edit, delete, or turn off memory anytime.</p></div></div>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => void confirm()} disabled={saving} className="flex items-center gap-2 rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{saving ? "Saving…" : "Save privately"}</button><button type="button" onClick={onDismiss} disabled={saving} className="text-xs font-semibold text-[#3A1F0E]/55 hover:text-[#8D5C17]">Do not save</button></div>
  </aside>;
}
