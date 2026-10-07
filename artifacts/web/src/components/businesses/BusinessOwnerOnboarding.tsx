import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2, Plus, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Offering = { name: string; detail: string };
type Onboarding = {
  identityReviewed: boolean;
  offerings: Offering[];
  pricing: { model: "not_listed" | "starting_at" | "range" | "contact_for_quote"; detail: string };
  availability: { useWeeklySchedule: boolean; note: string };
  media: { confirmedRights: boolean; confirmedReview: boolean };
  communication: { channels: Array<"email" | "phone" | "website" | "social">; responseWindow: string };
};
type ChecklistItem = { key: string; label: string; complete: boolean; helper: string };

type ApiPayload = {
  onboarding: Onboarding;
  checklist: ChecklistItem[];
  completionPercent: number;
  privacy: {
    autoPublishesBusinessProfile: boolean;
    createsMarketingContent: boolean;
    createsCustomerContact: boolean;
    changesDirectoryEligibility: boolean;
  };
};

const EMPTY: Onboarding = {
  identityReviewed: false,
  offerings: [],
  pricing: { model: "not_listed", detail: "" },
  availability: { useWeeklySchedule: false, note: "" },
  media: { confirmedRights: false, confirmedReview: false },
  communication: { channels: [], responseWindow: "" },
};

export function BusinessOwnerOnboarding() {
  const [onboarding, setOnboarding] = useState<Onboarding>(EMPTY);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOffering, setNewOffering] = useState<Offering>({ name: "", detail: "" });

  const completeCount = useMemo(() => checklist.filter((item) => item.complete).length, [checklist]);

  const applyPayload = (payload: ApiPayload) => {
    setOnboarding(payload.onboarding);
    setChecklist(payload.checklist);
    setCompletionPercent(payload.completionPercent);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${BASE}api/businesses/mine/onboarding`, { credentials: "include" });
        if (!response.ok) throw new Error("Your private owner checklist could not be loaded.");
        const payload = await response.json() as ApiPayload;
        if (!cancelled) applyPayload(payload);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Your private owner checklist could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleChannel = (channel: Onboarding["communication"]["channels"][number]) => {
    setOnboarding((current) => ({
      ...current,
      communication: {
        ...current.communication,
        channels: current.communication.channels.includes(channel)
          ? current.communication.channels.filter((value) => value !== channel)
          : [...current.communication.channels, channel],
      },
    }));
  };

  const addOffering = () => {
    const next = { name: newOffering.name.trim(), detail: newOffering.detail.trim() };
    if (next.name.length < 2 || onboarding.offerings.length >= 12) return;
    setOnboarding((current) => ({ ...current, offerings: [...current.offerings, next] }));
    setNewOffering({ name: "", detail: "" });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/businesses/mine/onboarding`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboarding),
      });
      const payload = await response.json() as ApiPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save your private owner checklist.");
      applyPayload(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your private owner checklist.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-44 items-center justify-center rounded-2xl border border-[#3A1F0E]/10 bg-white"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div>;
  }

  return (
    <section className="rounded-2xl border border-[#2D7A4F]/25 bg-[#2D7A4F]/[0.035] p-5" data-testid="business-owner-onboarding">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#2D7A4F]/10 p-2"><ClipboardCheck className="h-4 w-4 text-[#2D7A4F]" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2B1507]">Owner launch checklist</p>
          <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">Private to approved owners. It never publishes your profile, creates marketing copy, contacts customers, charges money, or changes your directory eligibility.</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#2D7A4F]">{completionPercent}%</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {checklist.map((item) => (
          <div key={item.key} className="flex gap-2 rounded-xl border border-[#2D7A4F]/15 bg-white px-3 py-2.5">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.complete ? "text-[#2D7A4F]" : "text-[#3A1F0E]/20"}`} />
            <div><p className="text-xs font-semibold text-[#2B1507]">{item.label}</p><p className="mt-0.5 text-[11px] leading-4 text-[#3A1F0E]/50">{item.helper}</p></div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4 rounded-xl border border-[#3A1F0E]/10 bg-white p-4">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#2B1507]">
          <input type="checkbox" checked={onboarding.identityReviewed} onChange={(event) => setOnboarding((current) => ({ ...current, identityReviewed: event.target.checked }))} className="mt-1" />
          <span><strong>Identity reviewed</strong><br /><span className="text-xs text-[#3A1F0E]/55">I have checked my existing profile story and contact details.</span></span>
        </label>

        <div>
          <p className="text-sm font-semibold text-[#2B1507]">Offerings</p>
          <p className="mt-1 text-xs text-[#3A1F0E]/55">Owner-written services or products — no auto-generated offers.</p>
          <div className="mt-2 space-y-2">
            {onboarding.offerings.map((offering, index) => (
              <div key={`${offering.name}-${index}`} className="flex items-start gap-2 rounded-lg bg-[#FAF6EF] px-3 py-2">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#2B1507]">{offering.name}</p>{offering.detail && <p className="text-xs text-[#3A1F0E]/55">{offering.detail}</p>}</div>
                <button type="button" aria-label={`Remove ${offering.name}`} onClick={() => setOnboarding((current) => ({ ...current, offerings: current.offerings.filter((_, itemIndex) => itemIndex !== index) }))} className="text-[#3A1F0E]/45 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          {onboarding.offerings.length < 12 && <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><input value={newOffering.name} onChange={(event) => setNewOffering((current) => ({ ...current, name: event.target.value }))} placeholder="Offering name" className="rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><input value={newOffering.detail} onChange={(event) => setNewOffering((current) => ({ ...current, detail: event.target.value }))} placeholder="Short detail (optional)" className="rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><button type="button" onClick={addOffering} disabled={newOffering.name.trim().length < 2} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#2D7A4F] px-3 py-2 text-sm font-bold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add</button></div>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#2B1507]">Pricing guidance<select value={onboarding.pricing.model} onChange={(event) => setOnboarding((current) => ({ ...current, pricing: { ...current.pricing, model: event.target.value as Onboarding["pricing"]["model"] } }))} className="mt-1 block w-full rounded-lg border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm"><option value="not_listed">Not listed</option><option value="starting_at">Starting at</option><option value="range">Range</option><option value="contact_for_quote">Contact for quote</option></select></label>
          <label className="text-sm font-semibold text-[#2B1507]">Pricing detail<input value={onboarding.pricing.detail} onChange={(event) => setOnboarding((current) => ({ ...current, pricing: { ...current.pricing, detail: event.target.value } }))} maxLength={180} placeholder="Owner-written guidance" className="mt-1 block w-full rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#3A1F0E]/10 p-3 text-sm text-[#2B1507]"><input type="checkbox" checked={onboarding.availability.useWeeklySchedule} onChange={(event) => setOnboarding((current) => ({ ...current, availability: { ...current.availability, useWeeklySchedule: event.target.checked } }))} className="mt-1" /><span><strong>Use my existing weekly schedule</strong><br /><span className="text-xs text-[#3A1F0E]/55">This references your schedule; it does not change it.</span></span></label>
          <label className="text-sm font-semibold text-[#2B1507]">Availability note<input value={onboarding.availability.note} onChange={(event) => setOnboarding((current) => ({ ...current, availability: { ...current.availability, note: event.target.value } }))} maxLength={280} placeholder="Owner-written, optional" className="mt-1 block w-full rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#3A1F0E]/10 p-3 text-sm text-[#2B1507]"><input type="checkbox" checked={onboarding.media.confirmedRights} onChange={(event) => setOnboarding((current) => ({ ...current, media: { ...current.media, confirmedRights: event.target.checked } }))} className="mt-1" /><span><strong>I have rights to current media</strong><br /><span className="text-xs text-[#3A1F0E]/55">No media is uploaded or changed here.</span></span></label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#3A1F0E]/10 p-3 text-sm text-[#2B1507]"><input type="checkbox" checked={onboarding.media.confirmedReview} onChange={(event) => setOnboarding((current) => ({ ...current, media: { ...current.media, confirmedReview: event.target.checked } }))} className="mt-1" /><span><strong>I reviewed current media</strong><br /><span className="text-xs text-[#3A1F0E]/55">Existing approval and image-eligibility rules still apply.</span></span></label>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#2B1507]">Communication preference</p>
          <div className="mt-2 flex flex-wrap gap-2">{(["email", "phone", "website", "social"] as const).map((channel) => <label key={channel} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${onboarding.communication.channels.includes(channel) ? "border-[#2D7A4F] bg-[#2D7A4F]/10 text-[#2D7A4F]" : "border-[#3A1F0E]/15 text-[#3A1F0E]/65"}`}><input type="checkbox" className="sr-only" checked={onboarding.communication.channels.includes(channel)} onChange={() => toggleChannel(channel)} />{channel}</label>)}</div>
          <input value={onboarding.communication.responseWindow} onChange={(event) => setOnboarding((current) => ({ ...current, communication: { ...current.communication, responseWindow: event.target.value } }))} maxLength={120} placeholder="e.g. We reply within two business days" className="mt-2 w-full rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-700" role="alert">{error}</p>}
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-[#3A1F0E]/50">{completeCount} of 6 owner-controlled steps complete.</p><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#2D7A4F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save private checklist"}</button></div>
    </section>
  );
}
