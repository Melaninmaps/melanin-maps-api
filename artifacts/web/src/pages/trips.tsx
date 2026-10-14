import { MapPin, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import TripItineraryOrganizer from "@/components/trip-itinerary-organizer";

const BASE = import.meta.env.BASE_URL;

type Trip = Readonly<{
  id: string;
  title: string;
  destination: string;
  note: string;
  memberConfirmedAt: string;
  createdAt: string;
  updatedAt: string;
}>;

type TripForm = { title: string; destination: string; note: string };
const emptyForm: TripForm = { title: "", destination: "", note: "" };

async function message(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

/**
 * Owner-only Trip storage. This page deliberately has no share or auto-save path:
 * it does not pass Trip data to chat, memory, profile, discovery, Map, Directory,
 * Community, Safety, provider, analytics, reminders, or any other integration.
 */
export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/trips`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(await message(response, "Trips could not be loaded."));
      const payload = await response.json() as { trips?: Trip[] };
      setTrips(Array.isArray(payload.trips) ? payload.trips : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Trips could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const inspect = async (id: string) => {
    setError(null);
    try {
      // A direct authenticated owner read keeps inspection separate from list state.
      const response = await fetch(`${BASE}api/kinfolk/trips/${encodeURIComponent(id)}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(await message(response, "This Trip could not be opened."));
      const payload = await response.json() as { trip?: Trip };
      if (!payload.trip) throw new Error("This Trip could not be opened.");
      setSelected(payload.trip);
      setForm({ title: payload.trip.title, destination: payload.trip.destination, note: payload.trip.note });
      setConfirmed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This Trip could not be opened.");
    }
  };

  const save = async () => {
    if (!confirmed || !form.title.trim() || !form.destination.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        selected ? `${BASE}api/kinfolk/trips/${encodeURIComponent(selected.id)}` : `${BASE}api/kinfolk/trips`,
        {
          method: selected ? "PUT" : "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, memberConfirmed: true }),
        },
      );
      if (!response.ok) throw new Error(await message(response, "This Trip could not be saved."));
      setSelected(null);
      setForm(emptyForm);
      setConfirmed(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This Trip could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trip: Trip) => {
    if (!window.confirm(`Delete “${trip.title}”? This requires your confirmation.`)) return;
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/trips/${encodeURIComponent(trip.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberConfirmed: true }),
      });
      if (!response.ok) throw new Error(await message(response, "This Trip could not be deleted."));
      if (selected?.id === trip.id) {
        setSelected(null);
        setForm(emptyForm);
        setConfirmed(false);
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This Trip could not be deleted.");
    }
  };

  const editing = selected !== null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-labelledby="trips-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Private member storage</p>
          <h1 id="trips-title" className="mt-1 font-serif text-3xl font-bold text-[#2B1507]">My Trips</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A1F0E]/65">
            Save a private Trip title, city/region/country destination, and optional note. Fields are encrypted at rest and shown only to the signed-in owner.
          </p>
        </div>
        <Link href="/travel" className="rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm font-bold text-[#2B1507] hover:border-[#CA922B]">Back to Kinfolk</Link>
      </div>

      <section aria-label="Trip privacy boundary" className="mt-6 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] p-4 text-sm leading-6 text-[#3A1F0E]/70">
        <strong className="text-[#2B1507]">Private by default.</strong> Trips are not automatically used in Kinfolk chat or memory, your profile, discovery, Map, Directory, Community, Safety, providers, analytics, tasks, reminders, or sharing. No exact address, location, or coordinates are collected. Flights, hotels, events, documents, calendars, and sharing are not part of this Trip record.
      </section>

      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-[#3A1F0E]/10 bg-white p-5" aria-labelledby="trip-form-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="trip-form-title" className="font-serif text-xl font-bold text-[#2B1507]">{editing ? `Edit ${selected.title}` : "Create a private Trip"}</h2>
          {editing ? <button type="button" onClick={() => { setSelected(null); setForm(emptyForm); setConfirmed(false); }} className="text-sm font-bold text-[#8D5C17]">Cancel edit</button> : null}
        </div>
        <label className="mt-4 block text-sm font-bold text-[#2B1507]">Trip title
          <input aria-label="Trip title" value={form.title} maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Weekend in New Orleans" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
        </label>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Destination
          <input aria-label="Trip destination" value={form.destination} maxLength={120} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="City, region, or country only" className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
          <span className="mt-1 block text-xs font-normal text-[#3A1F0E]/55">Do not enter an exact address or coordinates.</span>
        </label>
        <label className="mt-3 block text-sm font-bold text-[#2B1507]">Optional note
          <textarea aria-label="Trip note" value={form.note} maxLength={1000} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
        </label>
        <label className="mt-4 flex items-start gap-2 text-sm leading-5 text-[#3A1F0E]/70">
          <input aria-label="Confirm private Trip save" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
          <span>I confirm that I want to {editing ? "replace" : "save"} this private Trip now.</span>
        </label>
        <button type="button" disabled={!confirmed || !form.title.trim() || !form.destination.trim() || saving} onClick={() => void save()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? "Saving…" : editing ? "Confirm and update Trip" : "Confirm and save Trip"}
        </button>
      </section>

      {selected ? <TripItineraryOrganizer tripId={selected.id} tripTitle={selected.title} /> : null}

      <section className="mt-7" aria-labelledby="saved-trips-title">
        <h2 id="saved-trips-title" className="font-serif text-xl font-bold text-[#2B1507]">Saved private Trips</h2>
        {loading ? <p className="mt-3 text-sm text-[#3A1F0E]/55">Opening your private Trips…</p> : null}
        {!loading && trips.length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-[#3A1F0E]/15 p-5 text-sm text-[#3A1F0E]/60">No private Trips yet. Create one when you choose.</p> : null}
        <div className="mt-3 space-y-3">
          {trips.map((trip) => (
            <article key={trip.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => void inspect(trip.id)} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B]">
                  <span className="flex items-center gap-2 font-bold text-[#2B1507]"><MapPin className="h-4 w-4 shrink-0 text-[#CA922B]" />{trip.title}</span>
                  <span className="mt-1 block text-sm text-[#3A1F0E]/60">{trip.destination}</span>
                  {trip.note ? <span className="mt-2 block text-sm leading-5 text-[#3A1F0E]/70">{trip.note}</span> : null}
                  <span className="mt-2 block text-xs text-[#3A1F0E]/45">Select to inspect or edit</span>
                </button>
                <button type="button" onClick={() => void remove(trip)} aria-label={`Delete ${trip.title}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <p className="mt-8 flex items-center gap-2 text-xs leading-5 text-[#3A1F0E]/50"><ShieldCheck className="h-4 w-4 text-[#8D5C17]" />This owner view never receives ciphertext, encryption key IDs, fingerprints, or another member&apos;s Trip.</p>
    </main>
  );
}
