import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FALLBACK_DISCLOSURE =
  "My Cultural Journey is private to you. Entries are saved only when you choose a published cultural site, and reflections are saved only when you confirm them. Viewing or revisiting does not send a message to Kinfolk, create private memory, infer identity, trigger a nudge, or share anything. Nothing here is a score, streak, or completion goal.";

type CulturalJourneyEntry = {
  id: string;
  culturalSiteId: string;
  siteName: string;
  sourceLabel: string;
  reflection: string | null;
  createdAt: string;
  updatedAt: string;
};

type CulturalJourneyResponse = {
  disclosure?: string;
  entries?: CulturalJourneyEntry[];
};

function savedOn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved date unavailable";
  return `Saved ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

/**
 * An owner-only reading surface for existing Cultural Journey entries. This is
 * deliberately a view and editor of explicit entries—not activity tracking.
 */
export default function CulturalJourneyPage() {
  const [entries, setEntries] = useState<CulturalJourneyEntry[]>([]);
  const [disclosure, setDisclosure] = useState(FALLBACK_DISCLOSURE);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reflectionConfirmed, setReflectionConfirmed] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const loadJourney = useCallback(async (signal?: AbortSignal) => {
    setState("loading");
    setActionError("");
    try {
      const response = await fetch(`${BASE}/api/cultural-journeys`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Cache-Control": "no-store" },
        signal,
      });
      if (!response.ok) throw new Error("CULTURAL_JOURNEY_UNAVAILABLE");
      const payload = await response.json() as CulturalJourneyResponse;
      setEntries(payload.entries ?? []);
      setDisclosure(payload.disclosure ?? FALLBACK_DISCLOSURE);
      setState("ready");
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadJourney(controller.signal);
    return () => controller.abort();
  }, [loadJourney]);

  function beginReflection(entry: CulturalJourneyEntry) {
    setActionError("");
    setEditingId(entry.id);
    setDraft(entry.reflection ?? "");
    setReflectionConfirmed(false);
  }

  function cancelReflection() {
    setEditingId(null);
    setDraft("");
    setReflectionConfirmed(false);
  }

  async function saveReflection(entry: CulturalJourneyEntry) {
    if (!reflectionConfirmed || savingId) return;
    const nextReflection = draft.trim();
    if (!nextReflection && !entry.reflection) return;

    setSavingId(entry.id);
    setActionError("");
    try {
      const response = await fetch(`${BASE}/api/cultural-journeys/entries/${encodeURIComponent(entry.id)}/reflection`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ memberConfirmed: true, reflection: nextReflection }),
      });
      const payload = await response.json() as { entry?: CulturalJourneyEntry };
      if (!response.ok || !payload.entry) throw new Error("REFLECTION_UNAVAILABLE");
      setEntries((current) => current.map((item) => item.id === entry.id ? payload.entry! : item));
      cancelReflection();
    } catch {
      setActionError("We could not update your reflection. Your Journey is unchanged.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeEntry(entry: CulturalJourneyEntry) {
    if (!window.confirm(`Remove ${entry.siteName} from My Cultural Journey? This removes only your private saved entry.`)) return;

    setRemovingId(entry.id);
    setActionError("");
    try {
      const response = await fetch(`${BASE}/api/cultural-journeys/entries/${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ memberConfirmed: true }),
      });
      if (!response.ok) throw new Error("REMOVE_UNAVAILABLE");
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingId === entry.id) cancelReflection();
    } catch {
      setActionError("We could not remove that entry. Your Journey is unchanged.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[#2B1507]">
      <Link className="text-sm font-semibold text-[#8D5C17] underline" href="/library">
        ← Back to the Library
      </Link>
      <header className="mt-6 rounded-3xl border border-[#CA922B]/35 bg-[#2B1507] px-6 py-8 text-[#FFFDF8] shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F4D58D]">Private member space</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">My Cultural Journey</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#F1DFCC]">
          A quiet place to return to the published cultural sites you deliberately saved and the reflections you chose to keep.
        </p>
      </header>

      <aside className="mt-6 rounded-2xl border border-[#CA922B]/35 bg-[#CA922B]/[0.07] p-5 text-sm leading-6 text-[#3A1F0E]" aria-label="My Cultural Journey privacy boundary">
        {disclosure}
        <p className="mt-3">This view shows only the source-derived site title and category plus what you explicitly wrote. It does not show location, coordinates, raw assets, or provider information.</p>
        <p className="mt-3">Gentle invitations and nudges are not added here.</p>
      </aside>

      {actionError ? <p className="mt-5 rounded-xl border border-[#B95E5E]/40 bg-[#FFF1EF] p-4 text-sm text-[#8A2424]" role="alert">{actionError}</p> : null}

      {state === "loading" ? (
        <section className="mt-8 rounded-2xl border border-[#2B1507]/10 bg-white p-8 text-center text-[#3A1F0E]/65" aria-live="polite">
          Loading your private Journey…
        </section>
      ) : null}

      {state === "error" ? (
        <section className="mt-8 rounded-2xl border border-[#B95E5E]/35 bg-[#FFF1EF] p-6" role="alert">
          <h2 className="font-serif text-xl font-bold">My Cultural Journey is unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/75">Your saved entries have not changed. Try again when you are connected.</p>
          <button className="mt-4 rounded-xl border border-[#8D5C17] px-4 py-2 text-sm font-semibold text-[#8D5C17]" onClick={() => void loadJourney()} type="button">
            Try again
          </button>
        </section>
      ) : null}

      {state === "ready" && entries.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-[#2B1507]/20 bg-white p-8 text-center">
          <h2 className="font-serif text-2xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#3A1F0E]/70">When you choose “Save to My Journey” on a published cultural site, it will appear here. Kinfolk will not add anything automatically.</p>
          <Link className="mt-5 inline-flex rounded-xl bg-[#2B1507] px-4 py-2 text-sm font-semibold text-white" href="/map">Explore published cultural sites</Link>
        </section>
      ) : null}

      {state === "ready" && entries.length > 0 ? (
        <section className="mt-8 space-y-5" aria-label="Saved Cultural Journey entries">
          <p className="text-sm leading-6 text-[#3A1F0E]/65">Your entries are shown from the earliest saved story to the most recent. Revisit is available, but it is not recorded as an activity.</p>
          {[...entries].reverse().map((entry) => {
            const editing = editingId === entry.id;
            const willClear = !draft.trim() && Boolean(entry.reflection);
            return (
              <article className="rounded-2xl border border-[#2B1507]/10 bg-white p-6 shadow-sm" key={entry.id}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8D5C17]">{entry.sourceLabel}</p>
                <h2 className="mt-2 font-serif text-2xl font-bold">{entry.siteName}</h2>
                <p className="mt-2 text-sm text-[#3A1F0E]/60">{savedOn(entry.createdAt)} · Revisit available</p>
                <p className="mt-4 text-sm leading-6 text-[#3A1F0E]/75">Revisiting opens the public site details. It does not mark a visit, change this Journey, or send anything to Kinfolk.</p>

                {entry.reflection ? (
                  <div className="mt-5 rounded-xl border border-[#CA922B]/25 bg-[#CA922B]/[0.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8D5C17]">Your private reflection</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A1F0E]">{entry.reflection}</p>
                  </div>
                ) : <p className="mt-5 text-sm text-[#3A1F0E]/60">No reflection saved.</p>}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="rounded-xl border border-[#8D5C17] px-4 py-2 text-sm font-semibold text-[#8D5C17]" href={`/cultural-sites/${encodeURIComponent(entry.culturalSiteId)}`}>
                    Revisit published site
                  </Link>
                  <button className="rounded-xl border border-[#2B1507]/20 px-4 py-2 text-sm font-semibold text-[#2B1507]" onClick={() => editing ? cancelReflection() : beginReflection(entry)} type="button">
                    {editing ? "Cancel" : entry.reflection ? "Edit reflection" : "Write a reflection"}
                  </button>
                  <button className="rounded-xl border border-[#B95E5E]/45 px-4 py-2 text-sm font-semibold text-[#8A2424] disabled:opacity-60" disabled={removingId === entry.id} onClick={() => void removeEntry(entry)} type="button">
                    {removingId === entry.id ? "Removing…" : "Remove entry"}
                  </button>
                </div>

                {editing ? (
                  <div className="mt-5 rounded-xl border border-[#CA922B]/35 bg-[#CA922B]/[0.05] p-4">
                    <label className="block text-sm font-semibold" htmlFor={`reflection-${entry.id}`}>Your private reflection</label>
                    <textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#2B1507]/15 bg-white p-3 text-sm leading-6 outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/25" id={`reflection-${entry.id}`} maxLength={1200} onChange={(event) => setDraft(event.target.value)} value={draft} />
                    <p className="mt-2 text-xs text-[#3A1F0E]/60">{draft.length}/1200 characters. Clear the text only if you choose to remove this reflection.</p>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6">
                      <input checked={reflectionConfirmed} className="mt-1 size-4 accent-[#8D5C17]" onChange={(event) => setReflectionConfirmed(event.target.checked)} type="checkbox" />
                      <span>I choose to {willClear ? "clear" : "save"} this private reflection in My Cultural Journey.</span>
                    </label>
                    <button className="mt-4 rounded-xl bg-[#2B1507] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!reflectionConfirmed || savingId === entry.id || (!draft.trim() && !entry.reflection)} onClick={() => void saveReflection(entry)} type="button">
                      {savingId === entry.id ? "Saving…" : willClear ? "Clear reflection" : "Save reflection"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
