import { useState, type ReactNode } from "react";
import { Check, Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export type CommunityIntelligenceSuggestion = Readonly<{
  id: string;
  journeyType: "wedding" | "birthday";
  stage: "inspiration";
  intent: "planning";
  categoryKey: string;
  label: string;
  reason: string;
}>;

type SuggestionAction = "helpful" | "not_relevant" | "already_handled";

export function CommunityIntelligenceSuggestions({
  suggestions,
}: Readonly<{ suggestions: readonly CommunityIntelligenceSuggestion[] }>) {
  const [selected, setSelected] = useState<Record<string, SuggestionAction>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  if (suggestions.length === 0) return null;

  const choose = async (suggestionId: string, action: SuggestionAction) => {
    setSelected((current) => ({ ...current, [suggestionId]: action }));
    setSaving(suggestionId);
    setStatus(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/community-intelligence/feedback`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, action }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        recorded?: boolean;
        reason?: "collection_disabled" | "participation_required";
      };
      if (!response.ok) throw new Error("Could not save that selection.");
      if (payload.recorded) {
        setStatus("Saved to your opted-in Community Intelligence feedback. Your chat text is not included.");
      } else if (payload.reason === "collection_disabled") {
        setStatus("Community learning is currently off, so this selection was not collected.");
      } else {
        setStatus("This selection stays private unless you choose Community Intelligence participation in Kinfolk Settings.");
      }
    } catch {
      setStatus("That selection could not be saved. No Community Intelligence feedback was collected.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <aside data-testid="community-intelligence-suggestions" className="mt-3 rounded-2xl border border-[#2D7A4F]/25 bg-[#F1FAF4] p-4">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#2D7A4F]" />
        <div>
          <p className="text-xs font-bold text-[#173F2A]">You might also want to consider…</p>
          <p className="mt-0.5 text-[11px] leading-5 text-[#173F2A]/70">A few planning details Kinfolk can surface from this conversation. These are not business recommendations.</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="rounded-xl border border-[#2D7A4F]/15 bg-white p-3">
            <p className="text-xs font-semibold text-[#173F2A]">{suggestion.label}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#173F2A]/68">{suggestion.reason}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <FeedbackButton label="Helpful" icon={<ThumbsUp className="h-3 w-3" />} active={selected[suggestion.id] === "helpful"} disabled={saving === suggestion.id} onClick={() => void choose(suggestion.id, "helpful")} />
              <FeedbackButton label="Not relevant" icon={<ThumbsDown className="h-3 w-3" />} active={selected[suggestion.id] === "not_relevant"} disabled={saving === suggestion.id} onClick={() => void choose(suggestion.id, "not_relevant")} />
              <FeedbackButton label="Already handled" icon={<Check className="h-3 w-3" />} active={selected[suggestion.id] === "already_handled"} disabled={saving === suggestion.id} onClick={() => void choose(suggestion.id, "already_handled")} />
            </div>
          </div>
        ))}
      </div>
      {status ? <p role="status" className="mt-3 text-[11px] leading-5 text-[#173F2A]/72">{status}</p> : null}
    </aside>
  );
}

function FeedbackButton({ label, icon, active, disabled, onClick }: Readonly<{ label: string; icon: ReactNode; active: boolean; disabled: boolean; onClick: () => void }>) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-55 ${active ? "border-[#2D7A4F] bg-[#2D7A4F] text-white" : "border-[#2D7A4F]/25 bg-white text-[#2D7A4F] hover:bg-[#E6F5EA]"}`}>{icon}{label}</button>;
}
