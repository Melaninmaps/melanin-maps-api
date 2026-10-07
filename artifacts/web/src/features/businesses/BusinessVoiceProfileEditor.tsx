import { useEffect, useState } from "react";
import { Check, Loader2, Mic2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
const TONES = [
  "warm",
  "direct",
  "celebratory",
  "professional",
  "playful",
  "calm",
] as const;
type Tone = (typeof TONES)[number];

type Profile = {
  tones: Tone[];
  languagePreference: string | null;
  audienceGuidance: string | null;
  wordsToUse: string[];
  wordsToAvoid: string[];
  signaturePhrases: string[];
};

const EMPTY: Profile = {
  tones: [],
  languagePreference: null,
  audienceGuidance: null,
  wordsToUse: [],
  wordsToAvoid: [],
  signaturePhrases: [],
};

function commaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function BusinessVoiceProfileEditor({
  businessId,
}: {
  businessId: string;
}) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draftKind, setDraftKind] = useState("caption");
  const [draftRequest, setDraftRequest] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [editableDraft, setEditableDraft] = useState("");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await authenticatedFetch(
          `${BASE}api/businesses/${businessId}/kinfolk-voice-profile`,
        );
        const payload = (await response.json()) as {
          profile?: Profile | null;
          error?: string;
        };
        if (!response.ok)
          throw new Error(
            payload.error ?? "Could not load Business Voice Profile.",
          );
        if (active && payload.profile)
          setProfile({ ...EMPTY, ...payload.profile });
      } catch (error) {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load Business Voice Profile.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [businessId]);

  function toggleTone(tone: Tone) {
    setProfile((current) => ({
      ...current,
      tones: current.tones.includes(tone)
        ? current.tones.filter((item) => item !== tone)
        : current.tones.length < 3
          ? [...current.tones, tone]
          : current.tones,
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/${businessId}/kinfolk-voice-profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ownerConfirmed: confirmed }),
        },
      );
      const payload = (await response.json()) as {
        profile?: Profile;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Could not save Business Voice Profile.",
        );
      if (payload.profile) setProfile({ ...EMPTY, ...payload.profile });
      setConfirmed(false);
      setMessage(
        "Saved. Kinfolk will use this only for a future business-facing draft you request.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save Business Voice Profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function requestDraft() {
    setDrafting(true);
    setDraftMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/${businessId}/kinfolk-drafts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: draftKind,
            request: draftRequest,
            ownerRequested: true,
          }),
        },
      );
      const payload = (await response.json()) as { draft?: string; error?: string };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not prepare an editable draft.");
      setEditableDraft(payload.draft ?? "");
      setDraftMessage("Editable draft ready. Review and revise it before any use.");
    } catch (error) {
      setDraftMessage(
        error instanceof Error ? error.message : "Could not prepare an editable draft.",
      );
    } finally {
      setDrafting(false);
    }
  }

  if (loading)
    return (
      <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 text-sm text-[#3A1F0E]/60">
        Loading Business Voice Profile…
      </div>
    );

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5E3B87]/12">
          <Mic2 className="h-4 w-4 text-[#5E3B87]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#2B1507]">
            Business Voice Profile
          </h2>
          <p className="mt-1 text-sm text-[#3A1F0E]/60">
            Set the voice for business-facing Kinfolk drafts you request. This
            never changes member chat, reviews, or community language.
          </p>
        </div>
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/55">
        Tone (up to three)
      </p>
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => {
          const active = profile.tones.includes(tone);
          return (
            <button
              key={tone}
              type="button"
              aria-pressed={active}
              onClick={() => toggleTone(tone)}
              className={`min-h-10 rounded-full border px-3 py-2 text-xs font-bold capitalize ${active ? "border-[#5E3B87] bg-[#5E3B87] text-white" : "border-[#3A1F0E]/20 bg-[#FAF6EF] text-[#2B1507]"}`}
            >
              {active && <Check className="mr-1 inline h-3 w-3" />}
              {tone}
            </button>
          );
        })}
      </div>
      <label className="mt-4 block text-sm font-bold text-[#2B1507]">
        Language preference
        <textarea
          value={profile.languagePreference ?? ""}
          maxLength={300}
          onChange={(event) =>
            setProfile((current) => ({
              ...current,
              languagePreference: event.target.value || null,
            }))
          }
          placeholder="Example: Plain, welcoming language; avoid jargon."
          className="mt-1 min-h-20 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
        />
      </label>
      <label className="mt-4 block text-sm font-bold text-[#2B1507]">
        Audience guidance
        <textarea
          value={profile.audienceGuidance ?? ""}
          maxLength={600}
          onChange={(event) =>
            setProfile((current) => ({
              ...current,
              audienceGuidance: event.target.value || null,
            }))
          }
          placeholder="Who the business is speaking to for a requested draft."
          className="mt-1 min-h-20 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-bold text-[#2B1507]">
          Words to use
          <input
            value={profile.wordsToUse.join(", ")}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                wordsToUse: commaList(event.target.value),
              }))
            }
            placeholder="welcoming, local"
            className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
          />
        </label>
        <label className="block text-sm font-bold text-[#2B1507]">
          Words to avoid
          <input
            value={profile.wordsToAvoid.join(", ")}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                wordsToAvoid: commaList(event.target.value),
              }))
            }
            placeholder="salesy, jargon"
            className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
          />
        </label>
        <label className="block text-sm font-bold text-[#2B1507]">
          Signature phrasing
          <input
            value={profile.signaturePhrases.join(", ")}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                signaturePhrases: commaList(event.target.value),
              }))
            }
            placeholder="Made with care"
            className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
          />
        </label>
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3 text-sm text-[#3A1F0E]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          I confirm these are authorized business-provided inputs. They may be
          used only in business-facing drafts I request, not as community
          consensus or member preference.
        </span>
      </label>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm font-medium text-[#6A3B1E]">
          {message}
        </p>
        <button
          type="button"
          disabled={saving || !confirmed}
          onClick={() => void save()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Business Voice Profile"}
        </button>
      </div>
      <section className="mt-6 border-t border-[#3A1F0E]/10 pt-5">
        <h3 className="font-serif text-base font-bold text-[#2B1507]">
          Request an editable draft
        </h3>
        <p className="mt-1 text-sm text-[#3A1F0E]/60">
          Kinfolk uses only your saved Business Voice Profile and this request. It never posts, sends, replies, or changes your business record.
        </p>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">
          Draft type
          <select
            value={draftKind}
            onChange={(event) => setDraftKind(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
          >
            <option value="caption">Caption</option>
            <option value="flyer_copy">Flyer copy</option>
            <option value="review_reply">Review reply</option>
            <option value="customer_message">Customer message</option>
          </select>
        </label>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">
          What should this draft say?
          <textarea
            value={draftRequest}
            maxLength={1200}
            onChange={(event) => setDraftRequest(event.target.value)}
            placeholder="Provide the facts and intent you want in this draft."
            className="mt-1 min-h-24 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
          />
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm font-medium text-[#6A3B1E]">
            {draftMessage}
          </p>
          <button
            type="button"
            disabled={drafting || !draftRequest.trim()}
            onClick={() => void requestDraft()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#5E3B87] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {drafting && <Loader2 className="h-4 w-4 animate-spin" />}
            {drafting ? "Preparing…" : "Prepare editable draft"}
          </button>
        </div>
        {editableDraft && (
          <label className="mt-4 block text-sm font-bold text-[#2B1507]">
            Editable draft — owner review required
            <textarea
              value={editableDraft}
              onChange={(event) => setEditableDraft(event.target.value)}
              className="mt-1 min-h-36 w-full rounded-xl border border-[#5E3B87]/30 bg-[#FAF6EF] p-3 text-sm font-normal"
            />
          </label>
        )}
      </section>
    </section>
  );
}
