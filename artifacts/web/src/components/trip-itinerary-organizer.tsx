import { ArrowDown, ArrowUp, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

type Entry = Readonly<{
  id: string;
  dayLabel: string;
  dayOrder: number;
  startTimeLabel: string;
  endTimeLabel: string;
  title: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}>;

type EntryForm = { dayLabel: string; dayOrder: number; startTimeLabel: string; endTimeLabel: string; title: string; note: string };
const emptyEntry = (dayOrder: number): EntryForm => ({ dayLabel: `Day ${dayOrder}`, dayOrder, startTimeLabel: "", endTimeLabel: "", title: "", note: "" });

async function message(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

/** Private manual organizer only: it never schedules, books, notifies, shares, or auto-uses a service. */
export default function TripItineraryOrganizer({ tripId, tripTitle }: Readonly<{ tripId: string; tripTitle: string }>) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryForm, setEntryForm] = useState<EntryForm>(() => emptyEntry(1));
  const [editing, setEditing] = useState<Entry | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = `${BASE}api/kinfolk/trips/${encodeURIComponent(tripId)}/itinerary`;
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(await message(response, "This private itinerary could not be loaded."));
      const payload = await response.json() as { entries?: Entry[] };
      setEntries(Array.isArray(payload.entries) ? payload.entries : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private itinerary could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  const startCreate = () => {
    setEditing(null);
    setEntryForm(emptyEntry(entries.length + 1));
    setConfirmed(false);
    setError(null);
  };

  const startEdit = (entry: Entry) => {
    setEditing(entry);
    setEntryForm({ dayLabel: entry.dayLabel, dayOrder: entry.dayOrder, startTimeLabel: entry.startTimeLabel, endTimeLabel: entry.endTimeLabel, title: entry.title, note: entry.note });
    setConfirmed(false);
    setError(null);
  };

  const cancel = () => {
    setEditing(null);
    setEntryForm(emptyEntry(entries.length + 1));
    setConfirmed(false);
  };

  const save = async () => {
    if (!confirmed || !entryForm.dayLabel.trim() || !entryForm.title.trim() || !Number.isInteger(entryForm.dayOrder) || entryForm.dayOrder < 1 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(editing ? `${endpoint}/${encodeURIComponent(editing.id)}` : endpoint, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entryForm, memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This private itinerary item could not be saved."));
      cancel();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private itinerary item could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry: Entry) => {
    if (!window.confirm(`Delete “${entry.title}”? This requires your confirmation.`)) return;
    setError(null);
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(entry.id)}`, {
        method: "DELETE", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This private itinerary item could not be deleted."));
      if (editing?.id === entry.id) cancel();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private itinerary item could not be deleted.");
    }
  };

  const move = async (entry: Entry, direction: -1 | 1) => {
    const index = entries.findIndex((current) => current.id === entry.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= entries.length) return;
    if (!window.confirm("Reposition this private itinerary item? This requires your confirmation.")) return;
    const reordered = [...entries];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/order`, {
        method: "PUT", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds: reordered.map((current) => current.id), memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This private itinerary could not be reordered."));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This private itinerary could not be reordered.");
    } finally {
      setSaving(false);
    }
  };

  const invalid = !confirmed || !entryForm.dayLabel.trim() || !entryForm.title.trim() || !Number.isInteger(entryForm.dayOrder) || entryForm.dayOrder < 1 || entryForm.dayOrder > entries.length + (editing ? 0 : 1) || saving;
  return (
    <section className="mt-6 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] p-5" aria-labelledby="trip-itinerary-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Private manual organizer</p>
          <h2 id="trip-itinerary-title" className="mt-1 font-serif text-xl font-bold text-[#2B1507]">Day-by-day itinerary for {tripTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A1F0E]/70">Private, manual itinerary items do not schedule, book, notify, share, or automatically use any service. They are not sent to Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety, providers, calendars, flights, hotels, events, documents, tasks, reminders, or analytics.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl border border-[#8D5C17]/30 bg-white px-3 py-2 text-sm font-bold text-[#2B1507]"><Plus className="h-4 w-4" />Add day item</button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 rounded-xl border border-[#3A1F0E]/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[#2B1507]">{editing ? `Edit ${editing.title}` : "Add a private day item"}</h3>{editing ? <button type="button" onClick={cancel} className="text-sm font-bold text-[#8D5C17]">Cancel edit</button> : null}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
          <label className="block text-sm font-bold text-[#2B1507]">Day label<input aria-label="Itinerary day label" value={entryForm.dayLabel} maxLength={80} onChange={(event) => setEntryForm({ ...entryForm, dayLabel: event.target.value })} placeholder="Day 1" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-bold text-[#2B1507]">Order<input aria-label="Itinerary day order" type="number" min={1} max={entries.length + (editing ? 0 : 1)} value={entryForm.dayOrder || ""} onChange={(event) => setEntryForm({ ...entryForm, dayOrder: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-[#2B1507]">Optional start time label<input aria-label="Itinerary start time label" value={entryForm.startTimeLabel} maxLength={32} onChange={(event) => setEntryForm({ ...entryForm, startTimeLabel: event.target.value })} placeholder="9:00 AM" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-bold text-[#2B1507]">Optional end time label<input aria-label="Itinerary end time label" value={entryForm.endTimeLabel} maxLength={32} onChange={(event) => setEntryForm({ ...entryForm, endTimeLabel: event.target.value })} placeholder="10:30 AM" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        </div>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Item title<input aria-label="Itinerary item title" value={entryForm.title} maxLength={160} onChange={(event) => setEntryForm({ ...entryForm, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Optional private note<textarea aria-label="Itinerary item note" value={entryForm.note} maxLength={2000} onChange={(event) => setEntryForm({ ...entryForm, note: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" /></label>
        <label className="mt-4 flex items-start gap-2 text-sm leading-5 text-[#3A1F0E]/70"><input aria-label="Confirm private itinerary save" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>I confirm that I want to {editing ? "replace" : "save"} this private manual itinerary item now.</span></label>
        <button type="button" disabled={invalid} onClick={() => void save()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? "Saving…" : editing ? "Confirm and update item" : "Confirm and save item"}</button>
      </div>

      {loading ? <p className="mt-4 text-sm text-[#3A1F0E]/55">Opening your private day items…</p> : null}
      {!loading && entries.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[#3A1F0E]/15 bg-white p-4 text-sm text-[#3A1F0E]/60">No private day items yet. Add one manually when you choose.</p> : null}
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => (
          <article key={entry.id} className="rounded-xl border border-[#3A1F0E]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3"><button type="button" onClick={() => startEdit(entry)} className="min-w-0 text-left"><span className="block text-xs font-bold uppercase tracking-wide text-[#8D5C17]">{entry.dayLabel} · item {entry.dayOrder}</span><span className="mt-1 block font-bold text-[#2B1507]">{entry.title}</span>{entry.startTimeLabel || entry.endTimeLabel ? <span className="mt-1 block text-sm text-[#3A1F0E]/60">{[entry.startTimeLabel, entry.endTimeLabel].filter(Boolean).join(" – ")}</span> : null}{entry.note ? <span className="mt-2 block text-sm leading-5 text-[#3A1F0E]/70">{entry.note}</span> : null}</button><div className="flex shrink-0 items-center gap-1"><button type="button" disabled={saving || index === 0} onClick={() => void move(entry, -1)} aria-label={`Move ${entry.title} up`} className="rounded-lg p-2 text-[#8D5C17] disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={saving || index === entries.length - 1} onClick={() => void move(entry, 1)} aria-label={`Move ${entry.title} down`} className="rounded-lg p-2 text-[#8D5C17] disabled:opacity-35"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => startEdit(entry)} aria-label={`Edit ${entry.title}`} className="rounded-lg p-2 text-[#8D5C17]"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(entry)} aria-label={`Delete ${entry.title}`} className="rounded-lg p-2 text-red-700"><Trash2 className="h-4 w-4" /></button></div></div>
          </article>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-[#3A1F0E]/50"><ShieldCheck className="h-4 w-4 text-[#8D5C17]" />This owner organizer never receives ciphertext, encryption key IDs, fingerprints, another member&apos;s items, or a public share link.</p>
    </section>
  );
}
