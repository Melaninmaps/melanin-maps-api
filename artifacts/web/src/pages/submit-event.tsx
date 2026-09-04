import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

const EVENT_CATEGORIES = [
  "Cultural",
  "Business",
  "Beauty",
  "Finance",
  "Health & Wellness",
  "Education",
  "Family",
  "Food & Drink",
  "Music & Arts",
  "Community",
] as const;

type EventForm = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  state: string;
  category: string;
  organizer: string;
  price: string;
  isFree: boolean;
};

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  city: "",
  state: "",
  category: "Cultural",
  organizer: "",
  price: "",
  isFree: true,
};

function localDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SubmitEvent() {
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minimumDate = useMemo(() => localDateInputValue(new Date()), []);

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const eventDate = new Date(`${form.date}T12:00:00`);
      const response = await authenticatedFetch(`${BASE}api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          organizer: form.organizer.trim(),
          price: form.isFree ? "Free" : form.price.trim(),
          dateShort: Number.isNaN(eventDate.getTime())
            ? form.date
            : eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The event could not be submitted.");
      setCreated(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The event could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] px-4 py-16">
        <section className="mx-auto max-w-xl rounded-3xl border border-[#CA922B]/20 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#2D7A4F]" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-[#2B1507]">Event added</h1>
          <p className="mt-2 text-[#3A1F0E]/70">Your event is now available to the community.</p>
          <Link href="/events" className="mt-6 inline-flex rounded-full bg-[#CA922B] px-6 py-3 font-bold text-white">View events</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl border border-[#3A1F0E]/10 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-[#CA922B]/10 p-3"><CalendarDays className="h-6 w-6 text-[#CA922B]" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8D5C17]">Community calendar</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#2B1507]">Add an event</h1>
            <p className="mt-1 text-sm text-[#3A1F0E]/60">Share a real upcoming event. Required details are marked below.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label="Event name *" className="md:col-span-2">
            <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date *"><input required type="date" min={minimumDate} value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} /></Field>
          <Field label="Time"><input value={form.time} onChange={(e) => update("time", e.target.value)} placeholder="6:00 PM – 9:00 PM" className={inputClass} /></Field>
          <Field label="City *"><input required value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} /></Field>
          <Field label="State *"><input required maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="PA" className={inputClass} /></Field>
          <Field label="Venue or location"><input value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass} /></Field>
          <Field label="Organizer"><input value={form.organizer} onChange={(e) => update("organizer", e.target.value)} className={inputClass} /></Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
              {EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
          <Field label="Admission">
            <div className="flex gap-2">
              <button type="button" onClick={() => update("isFree", true)} className={choiceClass(form.isFree)}>Free</button>
              <button type="button" onClick={() => update("isFree", false)} className={choiceClass(!form.isFree)}>Paid</button>
            </div>
          </Field>
          {!form.isFree && <Field label="Price"><input value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="$25" className={inputClass} /></Field>}
          <Field label="Description" className="md:col-span-2">
            <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputClass} resize-y`} />
          </Field>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <button disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-[#CA922B] px-6 py-3 font-bold text-white disabled:opacity-50">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Adding event…" : "Add event"}
          </button>
          <Link href="/events" className="rounded-full border border-[#3A1F0E]/15 px-6 py-3 font-bold text-[#3A1F0E]">Cancel</Link>
        </div>
      </form>
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-[#3A1F0E]/15 bg-[#FAF6EF] px-4 py-3 text-sm text-[#2B1507] outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10";

function choiceClass(active: boolean) {
  return `flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${active ? "border-[#CA922B] bg-[#CA922B]/10 text-[#8D5C17]" : "border-[#3A1F0E]/15 text-[#3A1F0E]/60"}`;
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/55">{label}</span>{children}</label>;
}
