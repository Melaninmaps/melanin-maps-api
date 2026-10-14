import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import {
  BEAUTY_OPTIONS, BUDGET_OPTIONS, COMPANION_OPTIONS, INTEREST_OPTIONS,
  PURPOSE_OPTIONS, RESPONSE_OPTIONS, TRIP_OPTIONS, buildOnboardingPayload,
  buildOnboardingSteps, completeOnboarding, emptyOnboardingDraft, skipOnboardingPrompt,
  type OnboardingDraft, type OnboardingPreferences, type OnboardingStep,
} from "@/lib/kinfolk-onboarding";

const BASE = import.meta.env.BASE_URL;

interface Props {
  firstName?: string | null;
  onComplete: () => void;
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
        selected
          ? "bg-[#CA922B] text-white border-[#CA922B]"
          : "bg-white text-[#2B1507] border-[#E8DDD0] hover:border-[#CA922B]/60"
      }`}
    >
      {label}
    </button>
  );
}

function CardOption({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
        selected
          ? "border-[#CA922B] bg-[#CA922B]/8"
          : "border-[#E8DDD0] bg-white hover:border-[#CA922B]/40"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-[#CA922B] bg-[#CA922B]" : "border-[#E8DDD0]"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div>
        <p className="font-semibold text-[#2B1507] text-sm">{label}</p>
        {sub && <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

export function KinfolkOnboarding({ firstName, onComplete }: Props) {
  const [draft, setDraft] = useState(emptyOnboardingDraft);
  const [stepId, setStepId] = useState<OnboardingStep>("welcome");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryFullSkip, setRetryFullSkip] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => { if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  useEffect(() => { headingRef.current?.focus(); }, [stepId]);

  const steps = buildOnboardingSteps(draft);
  const step = steps.indexOf(stepId);
  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;
  const change = (patch: Partial<OnboardingDraft>) => setDraft(current => ({ ...current, ...patch }));
  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];

  async function savePreferences(payload: OnboardingPreferences): Promise<boolean> {
    const preferencesResponse = await fetch(`${BASE}api/kinfolk/preferences`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!preferencesResponse.ok) throw new Error("PREFERENCE_SAVE_FAILED");
    return true;
  }

  async function confirmCompletion(): Promise<boolean> {
    const profileResponse = await fetch(`${BASE}api/auth/user/setup`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileSetupComplete: true }),
    });
    if (!profileResponse.ok) throw new Error("PROFILE_SAVE_FAILED");
    return true;
  }

  async function finish(currentDraft: OnboardingDraft, fullSkip = false) {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setRetryFullSkip(fullSkip);
    const saved = await completeOnboarding(buildOnboardingPayload(currentDraft), savePreferences, confirmCompletion);
    setSaving(false);
    if (saved) onComplete();
    else setSaveError("Kinfolk could not finish setup. Nothing was marked complete; please try again. Your draft is still here.");
  }

  // Full skip confirms profile completion only; it cannot clear saved preferences.
  const skipAll = () => void finish(emptyOnboardingDraft(), true);

  function advance(skip = false) {
    const nextDraft = skip ? skipOnboardingPrompt(draft, stepId) : draft;
    setDraft(nextDraft);
    const nextSteps = buildOnboardingSteps(nextDraft);
    const index = nextSteps.indexOf(stepId);
    if (index >= nextSteps.length - 1) void finish(nextDraft);
    else setStepId(nextSteps[index + 1]);
  }

  function chips<T extends string>(items: readonly { value: T; label: string }[], selected: readonly string[], onSelect: (value: T) => void) {
    return <div className="flex flex-wrap gap-2">{items.map(option => <Chip key={option.value} label={option.label} selected={selected.includes(option.value)} onClick={() => onSelect(option.value)} />)}</div>;
  }
  function cards<T extends string>(items: readonly { value: T; label: string; sub?: string }[], selected: readonly string[], onSelect: (value: T) => void) {
    return <div className="flex flex-col gap-3">{items.map(option => <CardOption key={option.value} label={option.label} sub={option.sub} selected={selected.includes(option.value)} onClick={() => onSelect(option.value)} />)}</div>;
  }

  const titles: Record<OnboardingStep, string> = {
    welcome: `Welcome${firstName ? `, ${firstName}` : ""}`, interests: "What do you like to discover?",
    use_cases: "What would you like help finding?", budget: "What's your budget vibe?",
    response_style: "How should Kinfolk respond?", beauty_services: "Which beauty services interest you?",
    travel_style: "How would you like to explore?", family_planning: "Family-friendly planning?",
    ready: "You're ready to ask Kinfolk",
  };

  function content() {
    switch (stepId) {
      case "welcome": return <div className="flex flex-col items-center gap-5 py-4">
        <div className="w-20 h-20 rounded-full bg-[#CA922B]/15 flex items-center justify-center"><span className="text-4xl" aria-hidden="true">✦</span></div>
        <p className="text-sm text-[#3A1F0E]/60 text-center">A few taps can help with recommendations. Share only ordinary preferences you want to use.</p>
      </div>;
      case "interests": return chips(INTEREST_OPTIONS.map(value => ({ value, label: value })), draft.interests, value => change({ interests: toggle(draft.interests, value) }));
      case "use_cases": return chips(PURPOSE_OPTIONS.map(value => ({ value, label: value })), draft.purposes, value => change({ purposes: toggle(draft.purposes, value) }));
      case "budget": return cards(BUDGET_OPTIONS, [draft.budget], value => change({ budget: value }));
      case "response_style": return cards(RESPONSE_OPTIONS, [draft.responseStyle], value => change({ responseStyle: value }));
      case "beauty_services": return chips(BEAUTY_OPTIONS, draft.beautyServices, value => change({ beautyServices: toggle(draft.beautyServices, value) }));
      case "travel_style": return <div className="space-y-4">
        <p className="text-sm font-semibold text-[#2B1507]">Trip style — choose any</p>
        {chips(TRIP_OPTIONS, draft.tripStyles, value => change({ tripStyles: toggle(draft.tripStyles, value) }))}
        <p className="text-sm font-semibold text-[#2B1507]">Preferred company — optional</p>
        {chips(COMPANION_OPTIONS, [draft.travelCompanion], value => change({ travelCompanion: value }))}
      </div>;
      case "family_planning": return <div className="space-y-4">
        <p className="text-sm text-[#3A1F0E]/60">This is only a planning preference, not a statement about your family or whether you have children.</p>
        {chips([{ value: "family", label: "Include family-friendly options" }], draft.familyFriendly ? ["family"] : [], () => change({ familyFriendly: !draft.familyFriendly }))}
        <p className="text-sm font-semibold text-[#2B1507]">Preferred company — optional</p>
        {draft.travelCompanion ? <p className="text-xs text-[#3A1F0E]/60">Choosing company here replaces the earlier company preference. Skip to keep that choice.</p> : null}
        {chips(COMPANION_OPTIONS, [draft.familyCompanion], value => change({ familyCompanion: value }))}
      </div>;
      case "ready": return <p className="text-sm text-[#3A1F0E]/60">Start with a local find or a place to explore whenever you're ready. No location is needed in this setup.</p>;
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#2B1507]/85 backdrop-blur-sm p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="kinfolk-setup-title"
        onKeyDown={event => {
          if (event.key !== "Tab") return;
          const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
        className="w-full max-w-lg bg-[#FAF6EF] rounded-3xl shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <p className="text-xs font-bold text-[#2B1507]">Optional Kinfolk setup</p>
          <p className="text-xs text-[#3A1F0E]/60 mt-2">Every prompt is optional and editable later in Kinfolk Settings and Taste Profile. Skipping keeps your existing preferences.</p>
          <p className="text-xs text-[#3A1F0E]/60 mt-2">No sensitive or current-life details are requested here. Kinfolk does not infer identity or life status from your answers or activity. These preferences are not public profile information.</p>
          <div className="flex items-center gap-3 my-4">
            <div role="progressbar" aria-label="Kinfolk setup progress" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={step + 1} aria-valuetext={`${step + 1} of ${totalSteps}`} className="flex-1 h-1.5 bg-[#E8DDD0] rounded-full overflow-hidden">
              <div className="h-full bg-[#CA922B] rounded-full transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
            </div>
            <span aria-live="polite" className="text-xs font-bold text-[#3A1F0E]/50">{step + 1} of {totalSteps}</span>
            <button type="button" onClick={skipAll} disabled={saving} className="text-xs text-[#3A1F0E]/60 font-medium">Skip all</button>
          </div>
          <h2 ref={headingRef} tabIndex={-1} id="kinfolk-setup-title" className="font-serif font-bold text-xl text-[#2B1507] leading-snug">{titles[stepId]}</h2>
        </div>
        <fieldset disabled={saving} aria-label={titles[stepId]} className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">{content()}</fieldset>
        {saveError && <div role="alert" className="mx-6 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
          <button type="button" disabled={saving} onClick={() => void finish(retryFullSkip ? emptyOnboardingDraft() : draft, retryFullSkip)} className="block mt-2 font-bold underline">Retry</button>
        </div>}
        <div className="px-6 py-5 shrink-0 border-t border-[#E8DDD0]/60 flex items-center gap-3">
          <button type="button" onClick={() => setStepId(steps[step - 1])} disabled={saving || step === 0} className="flex items-center gap-1 px-4 py-3 rounded-full border border-[#E8DDD0] text-[#2B1507] text-sm font-semibold disabled:opacity-40"><ChevronLeft className="w-4 h-4" aria-hidden="true" />Back</button>
          <div className="flex-1" />
          <button type="button" onClick={() => advance(true)} disabled={saving} className="text-sm text-[#3A1F0E]/60 font-medium">Skip for now</button>
          <button type="button" onClick={() => advance()} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold text-sm hover:bg-[#B38024] disabled:opacity-50">
            {saving ? "Saving…" : isLast ? <><Check className="w-4 h-4" aria-hidden="true" />Save setup</> : <>Continue<ChevronRight className="w-4 h-4" aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
