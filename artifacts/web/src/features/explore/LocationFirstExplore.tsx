import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import type { DiscoveryRecord, LocationFirstResponse } from "@/shared/discoveryContracts";

const BASE = import.meta.env.BASE_URL;

const EXPLORE_LENSES = [
  "Heritage & History", "Arts & Culture", "Neighborhoods",
  "HBCUs", "Living Culture", "Family", "Nightlife", "Faith & Community",
];

export function LocationFirstExplore() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [lens, setLens] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState(location.city ?? "");
  const [response, setResponse] = useState<LocationFirstResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      surface: "explore" as const,
      location,
      locationMode: "exact" as const,
      radiusMiles: null,
      filters: {
        recordTypes: ["cultural_site" as const, "community_place" as const, "event" as const],
        category: lens,
        specialty: null,
        ownership: [],
        tagSlugs: [],
        dateRange: null,
      },
      searchText: null,
    }),
    [location, lens],
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
      .catch((e) => { if (e.name !== "AbortError") console.error("Explore discovery failed", e); })
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">Discover with purpose</p>
        <h1 className="mt-3 font-serif text-5xl font-bold">What should you experience here?</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          History, culture, neighborhoods, places that matter, and timely local experiences. Businesses appear as contextual stops, not a duplicate directory.
        </p>
        <p className="mt-5 font-semibold text-[#E5B94B]">{locationLabel || "Choose an area"}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {/* Location setter */}
        {!location.city && (
          <form onSubmit={handleCitySubmit} className="mb-6 flex flex-wrap gap-2 items-center">
            <input
              className="rounded-full border border-[#3A1F0E]/15 bg-white px-5 py-2.5 text-sm w-56"
              placeholder="City, State (e.g. Atlanta, GA)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <button type="submit" className="rounded-full bg-[#3A1F0E] px-5 py-2.5 text-sm font-semibold text-white">
              Explore this area
            </button>
          </form>
        )}

        {/* Lens filters */}
        <div className="flex flex-wrap gap-2">
          {EXPLORE_LENSES.map((item) => (
            <button
              key={item}
              aria-pressed={lens === item}
              type="button"
              onClick={() => setLens(lens === item ? null : item)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                lens === item
                  ? "bg-[#3A1F0E] text-white"
                  : "border border-[#3A1F0E]/15 bg-white text-[#3A1F0E] hover:border-[#CA922B]/40"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* States */}
        {!location.city && (
          <EmptyExplore
            title="Choose a city or neighborhood"
            body="Explore begins with the place you want to understand. Select an area to find local heritage, culture, and community experiences."
          />
        )}
        {loading && <p className="mt-8 text-sm text-[#3A1F0E]/60">Loading local experiences…</p>}
        {!loading && response?.coverageGap && (
          <EmptyExplore
            title="We are still building this local cultural map"
            body="You can expand to a nearby city, browse a guide, or help the community add a place that matters here."
          />
        )}

        {/* Results grid */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {response?.records.map((record) => (
            <ExploreCard key={`${record.recordType}-${record.id}`} record={record} />
          ))}
        </section>
      </section>
    </main>
  );
}

function ExploreCard({ record }: { record: DiscoveryRecord }) {
  return (
    <Link
      href={record.detailUrl}
      className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm transition hover:border-[#CA922B]/60 block"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">
        {record.recordType.replace(/_/g, " ")}
      </p>
      <h2 className="mt-2 text-xl font-bold text-[#2B1507]">{record.name}</h2>
      <p className="mt-2 text-sm text-[#3A1F0E]/70">
        {[record.category, record.neighborhood, record.city].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}

function EmptyExplore({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/30 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">{title}</h2>
      <p className="mt-2 leading-7 text-[#3A1F0E]/70">{body}</p>
    </section>
  );
}
