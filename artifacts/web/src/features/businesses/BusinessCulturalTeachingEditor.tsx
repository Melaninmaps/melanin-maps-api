import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
const MAX_WORDS = 90;

type OwnerTeaching = {
  title: string;
  text: string;
  active: boolean;
};

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function BusinessCulturalTeachingEditor({ businessId }: { businessId: string }) {
  const [title, setTitle] = useState("");
  const [teaching, setTeaching] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const words = useMemo(() => countWords(teaching), [teaching]);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/${encodeURIComponent(businessId)}/cultural-teaching/owner`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        teaching?: OwnerTeaching | null;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not load the teaching.");
      if (payload.teaching) {
        setTitle(payload.teaching.title);
        setTeaching(payload.teaching.text);
        setSaved(payload.teaching.active === true);
      } else {
        setTitle("");
        setTeaching("");
        setSaved(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the teaching.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // This editor is isolated to the selected business and never reads member activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function save() {
    if (!confirmed || words > MAX_WORDS) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/${encodeURIComponent(businessId)}/cultural-teaching/owner`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, teaching, ownerConfirmed: true }),
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        teaching?: OwnerTeaching;
        error?: string;
      };
      if (!response.ok || !payload.teaching) {
        throw new Error(payload.error ?? "Could not save the teaching.");
      }
      setTitle(payload.teaching.title);
      setTeaching(payload.teaching.text);
      setSaved(true);
      setConfirmed(false);
      setMessage("Saved. It is available only on this business’s detail page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the teaching.");
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    setWithdrawing(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/${encodeURIComponent(businessId)}/cultural-teaching/owner`,
        { method: "DELETE", cache: "no-store" },
      );
      if (!response.ok) throw new Error("Could not withdraw the teaching.");
      setSaved(false);
      setConfirmed(false);
      setMessage("Withdrawn. It is no longer available to members.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not withdraw the teaching.");
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 text-sm text-[#3A1F0E]/60">Loading optional cultural teaching…</div>;
  }

  const canSave = confirmed && title.trim().length >= 2 && teaching.trim().length > 0 && words <= MAX_WORDS;
  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5" data-testid="business-cultural-teaching-editor">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D7A4F]/10">
          <BookOpen className="h-4 w-4 text-[#2D7A4F]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#2B1507]">Optional Cultural Teaching</h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/60">
            Offer a short voluntary point-of-visit teaching in this business’s own words. It is never a culture label, rating, or automatic member prompt.
          </p>
        </div>
      </div>

      <label className="mt-4 block text-sm font-bold text-[#2B1507]">
        Short title
        <input
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="A small welcome"
          className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
        />
      </label>
      <label className="mt-4 block text-sm font-bold text-[#2B1507]">
        Teaching in your own words
        <textarea
          value={teaching}
          maxLength={700}
          onChange={(event) => setTeaching(event.target.value)}
          placeholder="Share one short thing a visitor may choose to read while they are here."
          className="mt-1 min-h-28 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal"
        />
        <span className={`mt-1 block text-xs font-normal ${words > MAX_WORDS ? "text-red-700" : "text-[#3A1F0E]/50"}`}>
          {words}/{MAX_WORDS} words · up to 700 characters
        </span>
      </label>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3 text-sm text-[#3A1F0E]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          I confirm this is a voluntary teaching from this business, in our own words. It does not speak for, rank, or represent a culture, and members may choose not to read it.
        </span>
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm font-medium text-[#6A3B1E]">{message}</p>
        <div className="flex flex-wrap gap-2">
          {saved ? (
            <button
              type="button"
              disabled={withdrawing || saving}
              onClick={() => void withdraw()}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#9B2C2C]/35 px-4 text-sm font-bold text-[#9B2C2C] disabled:opacity-50"
            >
              {withdrawing ? "Withdrawing…" : "Withdraw teaching"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canSave || saving || withdrawing}
            onClick={() => void save()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : saved ? "Update teaching" : "Save optional teaching"}
          </button>
        </div>
      </div>
    </section>
  );
}
