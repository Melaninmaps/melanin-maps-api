import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import type { DiscoveryRecord, LocationFirstResponse } from "@/shared/discoveryContracts";

const BASE = import.meta.env.BASE_URL;

type DateRange = "today" | "weekend" | "month" | null;
const TIME_FILTERS: Array<{ id: DateRange; label: string }> = [
  { id: null, label: "All upcoming" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "month", label: "This month" },
];

export function LocationFirstEvents() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [cityInput, setCityInput] = useState(location.city ?? "");
  const [response, setResponse] = useState<LocationFirstResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      surface: "events" as const,
      location,
      locationMode: "exact" as const,
      radiusMiles: null,
      filters: {
        recordTypes: ["event" as const],
        category: null,
        specialty: null,
        ownership: [],
        tagSlugs: [],
        dateRange,
      },
      searchText: null,
    }),
    [location, dateRange],
  );

  useEffect(() => {
    if (!location.city) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`${BASE}api/discovery/query`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    })
      .then((r) => r.json())
      .then(setResponse)
      .catch((e) => { if (e.name !== "AbortError") console.error("Event discovery failed", e); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  const locationLabel = [location.neighborhood, location.city, location.stateCode].filter(Boolean).join(", ");

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    const parts = cityInput.split(",").map((s) => s.trim());
    setExplicitLocation({ city: parts[0] || null, stateCode: parts[1] || null, neighborhood: null });
  }

  return (
    <main className="bg-[#FBF6EC] pb-16">
      <section className="bg-[#2B1507] px-6 py-16 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">Gather and connect</p>
        <h1 className="mt-3 font-serif text-5xl font-bold">Community events</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          What is happening around you, and when?
        </p>
        <p className="mt-5 font-semibold text-[#E5B94B]">{locationLabel || "Choose an area"}</p>

        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          {TIME_FILTERS.map((f) => (
            <button
              key={String(f.id)}
              aria-pressed={dateRange === f.id}
              type="button"
              onClick={() => setDateRange(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                dateRange === f.id
                  ? "bg-[#E5B94B] text-[#2B1507]"
                  : "border border-white/30 text-white hover:border-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {/* Location setter */}
        {!location.city && (
          <form onSubmit={handleCitySubmit} className="mb-6 flex flex-wrap gap-2 items-center">
            <input
              className="rounded-full border border-[#3A1F0E]/15 bg-white px-5 py-2.5 text-sm w-56"
              placeholder="City, State (e.g. Charlotte, NC)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <button type="submit" className="rounded-full bg-[#3A1F0E] px-5 py-2.5 text-sm font-semibold text-white">
              Find events here
            </button>
          </form>
        )}

        {/* States */}
        {!location.city && (
          <EventEmptyState
            title="Choose an area to find what is happening"
            body="Events are local and time-specific. Select a city or neighborhood to see current community events."
          />
        )}
        {loading && <p className="text-sm text-[#3A1F0E]/60">Loading events…</p>}
        {!loading && response?.coverageGap && (
          <EventEmptyState
            title={`Nothing listed${dateRange === "weekend" ? " this weekend" : dateRange === "today" ? " today" : ""} in ${locationLabel || "this area"} yet`}
            body="You can look at a nearby city, browse community happenings, or help add an event. This local event gap is recorded so the platform can improve."
            nearest={response.nearestAvailableLocation?.city ?? null}
          />
        )}

        {/* Results */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {response?.records.map((record) => (
            <EventCard key={record.id} record={record} />
          ))}
        </section>
      </section>
    </main>
  );
}

function EventCard({ record }: { record: DiscoveryRecord }) {
  return (
    <Link
      href={record.detailUrl}
      className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm transition hover:border-[#CA922B]/60 block"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">Event</p>
      <h2 className="mt-2 text-xl font-bold text-[#2B1507]">{record.name}</h2>
      <p className="mt-2 text-sm text-[#3A1F0E]/70">
        {[record.category, record.neighborhood, record.city].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}

function EventEmptyState({
  title, body, nearest,
}: {
  title: string; body: string; nearest?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-[#CA922B]/35 bg-white p-8 text-center">
      <h2 className="font-serif text-3xl font-bold text-[#2B1507]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-[#3A1F0E]/70">{body}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {nearest && (
          <button type="button" className="rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]">
            See events in {nearest}
          </button>
        )}
        <button type="button" className="rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]">
          Browse all cities
        </button>
        <Link href="/events/submit" className="rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]">
          Add an event
        </Link>
      </div>
    </section>
  );
}
