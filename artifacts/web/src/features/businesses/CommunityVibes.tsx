import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  EXPERIENCE_COMMUNITY_OPTIONS,
  resolveExperienceChoiceLabel,
  type BusinessExperienceChoice,
  type BusinessExperienceKind,
  type BusinessExperiencePolicy,
  type CommunityCode,
} from "@workspace/constants";
import { CheckCircle2, Heart, Loader2, Sparkles, Tag } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

type ExperienceResponse = {
  policy: BusinessExperiencePolicy;
  ownerChoices: { vibes: string[]; price: string | null };
  aggregates: {
    vibeCounts: Record<string, number>;
    reactionCounts: Record<string, number>;
    priceCounts: Record<string, number>;
  };
  viewerSelections: Array<{ kind: BusinessExperienceKind; key: string }>;
};

const WORDING_PREFERENCE_KEY = "mwm_experience_community_wording";

function readCommunityPreference(): CommunityCode {
  try {
    const value = window.localStorage.getItem(WORDING_PREFERENCE_KEY) as CommunityCode | null;
    return EXPERIENCE_COMMUNITY_OPTIONS.some((option) => option.code === value) ? value! : "default";
  } catch {
    return "default";
  }
}

function ChoiceChip({
  choice,
  count,
  selected,
  ownerSelected,
  communityCode,
  loading,
  onToggle,
}: {
  choice: BusinessExperienceChoice;
  count: number;
  selected: boolean;
  ownerSelected: boolean;
  communityCode: CommunityCode;
  loading: boolean;
  onToggle: () => void;
}) {
  const label = resolveExperienceChoiceLabel(choice, communityCode);
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={loading}
      onClick={onToggle}
      title={choice.helperText}
      className={`min-h-11 rounded-full border px-4 py-2 text-left transition-colors ${
        selected
          ? "border-[#CA922B] bg-[#CA922B] text-[#1A1209]"
          : "border-white/15 bg-[#241810] text-white hover:border-[#CA922B]"
      } disabled:cursor-wait disabled:opacity-60`}
    >
      <span className="flex items-center gap-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        <span className="text-sm font-bold">{label}</span>
        {ownerSelected && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Owner</span>}
        {count > 0 && <span className="text-xs opacity-75">{count}</span>}
      </span>
      <span className={`mt-0.5 block text-[11px] ${selected ? "text-[#1A1209]/75" : "text-white/45"}`}>{choice.helperText}</span>
    </button>
  );
}

export function CommunityVibes({
  businessId,
  isAuthenticated,
}: {
  businessId: string;
  isAuthenticated: boolean;
}) {
  const [data, setData] = useState<ExperienceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [communityCode, setCommunityCode] = useState<CommunityCode>(() => readCommunityPreference());

  const selected = useMemo(
    () => new Set((data?.viewerSelections ?? []).map((item) => `${item.kind}:${item.key}`)),
    [data?.viewerSelections],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/businesses/${businessId}/community-feedback`);
      if (!response.ok) throw new Error("Could not load community experience tags.");
      setData(await response.json() as ExperienceResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community experience tags.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [businessId]);

  function changeCommunityCode(value: CommunityCode) {
    setCommunityCode(value);
    try { window.localStorage.setItem(WORDING_PREFERENCE_KEY, value); } catch { /* optional preference */ }
  }

  async function toggle(kind: BusinessExperienceKind, key: string) {
    if (!isAuthenticated) {
      setError("Sign in to add your voice. Reading community feedback stays open to everyone.");
      return;
    }
    const identity = `${kind}:${key}`;
    if (saving) return;
    setSaving(identity);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/businesses/${businessId}/community-feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, key, selected: !selected.has(identity) }),
      });
      const body = await response.json().catch(() => ({})) as ExperienceResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Your selection could not be saved.");
      setData((current) => current ? {
        ...current,
        aggregates: body.aggregates,
        viewerSelections: body.viewerSelections,
      } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your selection could not be saved.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <section id="community-experience" className="rounded-2xl border border-white/10 bg-[#1E1510] p-6 text-white" aria-busy="true">
        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-[#CA922B]" /><span>Loading community experience…</span></div>
      </section>
    );
  }

  if (!data) {
    return (
      <section id="community-experience" className="rounded-2xl border border-white/10 bg-[#1E1510] p-6 text-white">
        <p className="font-bold">Community experience is temporarily unavailable.</p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-bold text-[#CA922B] underline">Try again</button>
      </section>
    );
  }

  const aggregates = data.aggregates;
  const ownerVibes = new Set(data.ownerChoices.vibes);
  const ownerPrice = data.policy.priceChoices.find((choice) => choice.key === data.ownerChoices.price) ?? null;
  const selectedPrice = data.viewerSelections.find((item) => item.kind === "price")?.key;

  function group(
    kind: BusinessExperienceKind,
    title: string,
    description: string,
    choices: BusinessExperienceChoice[],
    icon: ReactNode,
  ) {
    if (choices.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[#CA922B]">{icon}</span>
          <div>
            <h4 className="font-serif text-lg font-bold text-white">{title}</h4>
            <p className="text-xs text-white/50">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <ChoiceChip
              key={`${kind}:${choice.key}`}
              choice={choice}
              count={kind === "vibe"
                ? aggregates.vibeCounts[choice.key] ?? 0
                : kind === "price"
                  ? aggregates.priceCounts[choice.key] ?? 0
                  : aggregates.reactionCounts[choice.key] ?? 0}
              selected={kind === "price" ? selectedPrice === choice.key : selected.has(`${kind}:${choice.key}`)}
              ownerSelected={ownerVibes.has(choice.key)}
              communityCode={communityCode}
              loading={saving === `${kind}:${choice.key}`}
              onToggle={() => void toggle(kind, choice.key)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section id="community-experience" className="scroll-mt-24 space-y-6 rounded-2xl border border-white/10 bg-[#1E1510] p-5 text-white md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#CA922B]" />
            <h3 className="font-serif text-xl font-bold">Share Your Experience</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Choose up to two quick reviews, plus atmosphere tags where they fit. Positive quick tags appear right away and help community search; they do not verify ownership.
          </p>
        </div>
        <label className="text-xs font-semibold text-white/60">
          Wording
          <select
            value={communityCode}
            onChange={(event) => changeCommunityCode(event.target.value as CommunityCode)}
            className="ml-2 min-h-10 rounded-lg border border-white/15 bg-[#2B1A10] px-2 text-xs text-white"
          >
            {EXPERIENCE_COMMUNITY_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {group("vibe", data.policy.atmosphereLabel, "Atmosphere, occasion, and energy — only shown when it fits this business type.", data.policy.vibeChoices, <Sparkles className="h-4 w-4" />)}
      {group("reaction", data.policy.reactionLabel, "Fast, positive feedback tailored to what this kind of business actually does.", data.policy.reactionChoices, <Heart className="h-4 w-4" />)}
      {ownerPrice && (
        <div className="rounded-xl border border-[#CA922B]/30 bg-[#CA922B]/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F0C76D]"><Tag className="h-4 w-4" />Owner-provided price</div>
          <p className="mt-1 text-sm font-semibold text-white">{ownerPrice.label}</p>
          <p className="text-xs text-white/50">Provided by the claimed owner; community estimates are shown separately below.</p>
        </div>
      )}
      {group("price", "Community price estimate", "Community estimates help people plan and may differ from the owner-provided price.", data.policy.priceChoices, <Tag className="h-4 w-4" />)}

      {error && <p role="alert" className="rounded-lg border border-[#CA922B]/30 bg-[#CA922B]/10 px-3 py-2 text-sm text-[#F0C76D]">{error}</p>}
      <p className="text-[11px] text-white/40">Different wording is shown only when you select it. The underlying tag remains the same across languages and communities.</p>
    </section>
  );
}
