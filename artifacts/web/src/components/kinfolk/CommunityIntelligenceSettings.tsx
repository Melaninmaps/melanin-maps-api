import { useCallback, useEffect, useState } from "react";
import { Check, Lock, UsersRound } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Preference = { participationEnabled: boolean; collectionEnabled: boolean };

export function CommunityIntelligenceSettings() {
  const [preference, setPreference] = useState<Preference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${BASE}api/kinfolk/community-intelligence/settings`, { credentials: "include" });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as Preference;
      setPreference(payload);
      setError(null);
    } catch {
      setError("Community Intelligence participation could not be loaded.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = async (participationEnabled: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/community-intelligence/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationEnabled }),
      });
      if (!response.ok) throw new Error();
      setPreference(await response.json() as Preference);
    } catch {
      setError("Your participation setting was not changed.");
    } finally {
      setSaving(false);
    }
  };

  const collectionEnabled = preference?.collectionEnabled === true;
  const participationEnabled = preference?.participationEnabled === true;
  return <section data-testid="community-intelligence-settings" className="border-t border-[#3A1F0E]/8 pt-6">
    <div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#2D7A4F]" /><h4 className="text-sm font-bold text-[#2B1507]">Community Intelligence</h4></div>
    <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">If collection is enabled, you may choose whether structured feedback on Kinfolk’s planning suggestions can help improve future category ordering. Kinfolk never uses ordinary chat text, private memory, locations, documents, email, or sensitive information for this.</p>
    <div className="mt-3 rounded-2xl border border-[#2D7A4F]/20 bg-[#F1FAF4] p-4">
      {!preference ? <p className="text-xs text-[#173F2A]/65">Loading participation controls…</p> : !collectionEnabled ? <div className="flex gap-3"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#2D7A4F]" /><div><p className="text-sm font-semibold text-[#173F2A]">Community learning is currently off</p><p className="mt-1 text-xs leading-5 text-[#173F2A]/70">You can still see relevant planning considerations. No feedback is collected or used for learning until this server-controlled feature is enabled.</p></div></div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#173F2A]">Participate in Community Intelligence</p><p className="mt-1 text-xs leading-5 text-[#173F2A]/70">Only the suggestion category and your selected feedback are eligible. Turning this off revokes active eligible events.</p></div><button type="button" disabled={saving} aria-pressed={participationEnabled} onClick={() => void update(!participationEnabled)} className={`inline-flex min-w-28 items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold disabled:opacity-55 ${participationEnabled ? "bg-[#2D7A4F] text-white" : "border border-[#2D7A4F]/35 bg-white text-[#2D7A4F]"}`}>{participationEnabled ? <><Check className="h-3.5 w-3.5" />Participating</> : "Not participating"}</button></div>}
      {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
    </div>
  </section>;
}
