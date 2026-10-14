import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import { LocationSearchBar } from "@/features/location/LocationSearchBar";
import type { DiscoveryRecord, LocationFirstResponse } from "@/shared/discoveryContracts";
import { readLocationFirstResponse } from "./locationFirstResponse";

const BASE = import.meta.env.BASE_URL;

const EXPLORE_LENSES = [
  "Heritage & History", "Arts & Culture", "Neighborhoods",
  "HBCUs", "Living Culture", "Family", "Nightlife", "Faith & Community",
];

export function safeExploreDetailUrl(value: string): string | null {
  // Discovery detail URLs are internal routes. Never turn malformed or external
  // response data into a navigable destination in the member experience.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const parsed = new URL(value, "https://mappingwithmelanin.invalid");
    return parsed.origin === "https://mappingwithmelanin.invalid" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : null;
  } catch {
    return null;
  }
}

/** Carries only the member-selected public area into the existing Map handoff. */
export function exploreMapUrl(location: {
  city: string | null;
  stateCode: string | null;
}): string | null {
  const city = location.city?.trim();
  const stateCode = location.stateCode?.trim();
  if (!city) return null;
  const area = [city, stateCode].filter(Boolean).join(", ");
  return `/map?${new URLSearchParams({ area }).toString()}`;
}

export function LocationFirstExplore() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [lens, setLens] = useState<string | null>(null);
  const [response, setResponse] = useState<LocationFirstResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestAttempt, setRequestAttempt] = useState(0);

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
    if (!location.city) {
      setResponse(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setResponse(null);
    setError(null);

    void (async () => {
      try {
        const httpResponse = await fetch(`${BASE}api/discovery/query`, {
          method: "POST",
          credentials: "include",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
        });
        const payload: unknown = await httpResponse.json().catch(() => null);
        const result = readLocationFirstResponse(httpResponse, payload);
        if (active) setResponse(result);
      } catch (cause) {
        if (!active || (cause instanceof DOMException && cause.name === "AbortError")) return;
        const message = cause instanceof Error
          ? cause.message
          : "Explore could not load this area. Please try again.";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [query, requestAttempt]);

  const locationLabel = [location.neighborhood, location.city, location.stateCode].filter(Boolean).join(", ");
  const mapUrl = exploreMapUrl(location);


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
        {/* Location — visible input, geolocation, and resolver states from LocationSearchBar */}
        <div className="mb-6">
          <LocationSearchBar
            queryLabel="Explore theme"
            queryPlaceholder=""
            areaPlaceholder="City or neighborhood"
            initialAreaLabel={locationLabel}
            showQuery={false}
            submitLabel="Explore this area"
            onResolved={({ area }) => {
              setExplicitLocation({
                city: area.cityName,
                stateCode: area.stateCode ?? null,
                neighborhood: area.neighborhoodName ?? null,
              });
            }}
          />
        </div>

        {mapUrl && (
          <Link
            href={mapUrl}
            data-testid="explore-map-handoff"
            aria-label={`View ${[location.city, location.stateCode].filter(Boolean).join(", ")} on map`}
            className="mb-6 inline-flex rounded-full border border-[#3A1F0E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#3A1F0E] hover:border-[#CA922B]/60"
          >
            View this area on the map
          </Link>
        )}

        {/* Lens filters */}
        <div role="group" aria-label="Explore themes" className="flex flex-wrap gap-2">
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
        {loading && <p data-testid="explore-loading" role="status" aria-live="polite" aria-atomic="true" className="mt-8 text-sm text-[#3A1F0E]/60">Loading local experiences…</p>}
        {!loading && error && (
          <section data-testid="explore-error" className="mt-8 rounded-2xl border border-[#CA922B]/30 bg-white p-6" role="alert">
            <h2 className="font-serif text-2xl font-bold text-[#2B1507]">Explore could not load this area</h2>
            <p className="mt-2 leading-7 text-[#3A1F0E]/70">{error}</p>
            <button
              type="button"
              className="mt-4 rounded-full bg-[#3A1F0E] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setRequestAttempt((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </section>
        )}
        {!loading && response?.coverageGap && (
          <EmptyExplore
            testId="explore-coverage-gap"
            title="We are still building this local cultural map"
            body="You can expand to a nearby city, browse a guide, or help the community add a place that matters here."
          />
        )}
        {!loading && !error && response && !response.coverageGap && response.records.length === 0 && (
          <EmptyExplore
            testId="explore-empty-results"
            title="No local experiences match this theme yet"
            body="Try another theme or choose a nearby city or neighborhood to continue exploring."
          />
        )}

        {/* Results grid */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(response?.records ?? []).map((record) => (
            <ExploreCard key={`${record.recordType}-${record.id}`} record={record} />
          ))}
        </section>
      </section>
    </main>
  );
}

function ExploreCard({ record }: { record: DiscoveryRecord }) {
  const detailUrl = safeExploreDetailUrl(record.detailUrl);
  const content = <>
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">
      {record.recordType.replace(/_/g, " ")}
    </p>
    <h2 className="mt-2 text-xl font-bold text-[#2B1507]">{record.name}</h2>
    <p className="mt-2 text-sm text-[#3A1F0E]/70">
      {[record.category, record.neighborhood, record.city].filter(Boolean).join(" · ")}
    </p>
  </>;

  if (!detailUrl) {
    return <article data-testid="explore-record-without-detail" className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">{content}</article>;
  }

  return (
    <Link
      href={detailUrl}
      className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm transition hover:border-[#CA922B]/60 block"
    >
      {content}
    </Link>
  );
}

function EmptyExplore({ testId, title, body }: { testId?: string; title: string; body: string }) {
  return (
    <section data-testid={testId} role="status" className="mt-8 rounded-2xl border border-[#CA922B]/30 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">{title}</h2>
      <p className="mt-2 leading-7 text-[#3A1F0E]/70">{body}</p>
    </section>
  );
}
