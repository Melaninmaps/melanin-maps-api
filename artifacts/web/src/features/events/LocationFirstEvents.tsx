import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, Clock3, MapPin, Plus } from "lucide-react";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import { LocationSearchBar } from "@/features/location/LocationSearchBar";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type DateRange = "today" | "weekend" | "month" | null;
type EventRecord = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  dateShort?: string | null;
  time?: string | null;
  location?: string | null;
  city: string;
  state: string;
  category: string;
  organizer?: string | null;
  price?: string | null;
  isFree?: boolean;
};

const TIME_FILTERS: Array<{ id: DateRange; label: string }> = [
  { id: null, label: "All upcoming" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "month", label: "Next 30 days" },
];

const EVENT_CATEGORIES = [
  "All",
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

function eventDate(value: string): Date | null {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inSelectedRange(value: string, range: DateRange): boolean {
  if (!range) return true;
  const date = eventDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (range === "today") return target.getTime() === today.getTime();
  if (range === "month") {
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    return target >= today && target < end;
  }

  const saturday = new Date(today);
  const dayOfWeek = saturday.getDay();
  saturday.setDate(saturday.getDate() + (dayOfWeek === 0 ? -1 : (6 - dayOfWeek + 7) % 7));
  const monday = new Date(saturday);
  monday.setDate(monday.getDate() + 2);
  return target >= saturday && target < monday;
}

export function LocationFirstEvents() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [category, setCategory] = useState<(typeof EVENT_CATEGORIES)[number]>("All");
  const [searchText, setSearchText] = useState("");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationLabel = [location.neighborhood, location.city, location.stateCode].filter(Boolean).join(", ");

  useEffect(() => {
    if (!location.city) {
      setEvents([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ city: location.city });
    if (location.stateCode) params.set("state", location.stateCode);
    if (category !== "All") params.set("category", category);
    if (searchText.trim()) params.set("search", searchText.trim());

    setLoading(true);
    setError(null);
    authenticatedFetch(`${BASE}api/events?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { events?: unknown; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || "Events are unavailable right now.");
        if (!payload || !Array.isArray(payload.events)) throw new Error("Events returned an incomplete response.");
        return payload.events as EventRecord[];
      })
      .then(setEvents)
      .catch((caught: unknown) => {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setEvents([]);
        setError(caught instanceof Error ? caught.message : "Events are unavailable right now.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [location.city, location.stateCode, category, searchText]);

  const visibleEvents = useMemo(
    () => events.filter((event) => inSelectedRange(event.date, dateRange)),
    [events, dateRange],
  );

  return (
    <main className="bg-[#FBF6EC] pb-16">
      <section className="bg-[#2B1507] px-6 py-14 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">Gather and connect</p>
        <h1 className="mt-3 font-serif text-5xl font-bold">Community events</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">Real events added by community members, with the date and place visible up front.</p>
        <p className="mt-5 font-semibold text-[#E5B94B]">{locationLabel || "Choose an area"}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TIME_FILTERS.map((filter) => (
            <button key={String(filter.id)} aria-pressed={dateRange === filter.id} type="button" onClick={() => setDateRange(filter.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${dateRange === filter.id ? "bg-[#E5B94B] text-[#2B1507]" : "border border-white/30 text-white hover:border-white/60"}`}>
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <LocationSearchBar
            queryLabel="Find an event"
            queryPlaceholder="Search workshops, festivals, finance, music…"
            areaPlaceholder="City or neighborhood"
            initialQuery={searchText}
            initialAreaLabel={locationLabel}
            submitLabel="Show events"
            onResolved={({ query, area }) => {
              setSearchText(query);
              setExplicitLocation({ city: area.cityName, stateCode: area.stateCode ?? null, neighborhood: area.neighborhoodName ?? null });
            }}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2" aria-label="Event categories">
          {EVENT_CATEGORIES.map((value) => (
            <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === value ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-[#3A1F0E]/15 bg-white text-[#3A1F0E]/70"}`}>
              {value}
            </button>
          ))}
        </div>

        <div className="mb-6 flex justify-end">
          <Link href="/events/submit" className="inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add an event</Link>
        </div>

        {!location.city && <EventEmptyState title="Choose an area to find what is happening" body="Select a city or neighborhood to see current community events." />}
        {loading && <p className="text-sm text-[#3A1F0E]/60">Loading events…</p>}
        {!loading && error && <EventEmptyState title="Events did not load" body={error} />}
        {!loading && !error && location.city && visibleEvents.length === 0 && (
          <EventEmptyState title={`No member-added events found in ${locationLabel || "this area"}`} body="Nothing verified matches this search yet. Add a real event when you know one the community should see." />
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event) => <EventCard key={event.id} event={event} />)}
        </section>
      </section>
    </main>
  );
}

function EventCard({ event }: { event: EventRecord }) {
  const date = eventDate(event.date);
  const dateLabel = event.dateShort || (date ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : event.date);
  return (
    <article className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">{event.category || "Event"}</p>
      <h2 className="mt-2 text-xl font-bold text-[#2B1507]">{event.title}</h2>
      <div className="mt-4 space-y-2 text-sm text-[#3A1F0E]/70">
        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#CA922B]" /> <span>{dateLabel}</span></p>
        {event.time && <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#CA922B]" /> <span>{event.time}</span></p>}
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#CA922B]" /> <span>{[event.location, event.city, event.state].filter(Boolean).join(" · ")}</span></p>
      </div>
      {event.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#3A1F0E]/65">{event.description}</p>}
      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#8D5C17]">
        <span>{event.isFree ? "Free" : event.price || "See organizer"}</span>
        {event.organizer && <span className="max-w-[60%] truncate">{event.organizer}</span>}
      </div>
    </article>
  );
}

function EventEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-[#CA922B]/35 bg-white p-8 text-center">
      <h2 className="font-serif text-3xl font-bold text-[#2B1507]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-[#3A1F0E]/70">{body}</p>
      <Link href="/events/submit" className="mt-5 inline-flex rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]">Add an event</Link>
    </section>
  );
}
