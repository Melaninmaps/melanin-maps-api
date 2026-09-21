import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import { LocationSearchBar } from "@/features/location/LocationSearchBar";
import { BUSINESS_SPECIALTIES } from "@/shared/discoveryContracts";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { INTERSECTIONAL_SUPPORT_FILTER_OPTIONS } from "@workspace/constants";
import { canDisplayBusinessCover, getBusinessHeroIcon } from "./businessHero";
import {
  appendUniqueCanonicalBusinesses,
  buildCanonicalBusinessSearchParams,
  readCanonicalBusinessSearchResponse,
  type CanonicalBusinessSearchRecord,
} from "./canonicalBusinessSearch";

const BASE = import.meta.env.BASE_URL;
const PAGE_SIZE = 60;
const DIRECTORY_HISTORY_KEY = "mwm_directory_recent_searches";

type DirectoryHistoryEntry = {
  query: string;
  city: string;
  stateCode: string | null;
};

const CATEGORIES = [
  "Food & Drink",
  "Beauty & Personal Care",
  "Health & Wellness",
  "Professional Services",
  "Arts & Culture",
  "Retail & Shopping",
  "Faith & Community",
];

export function LocationFirstBusinessDirectory() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [designationIds, setDesignationIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [records, setRecords] = useState<CanonicalBusinessSearchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [recentSearches, setRecentSearches] = useState<DirectoryHistoryEntry[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DIRECTORY_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((entry): entry is DirectoryHistoryEntry =>
          entry && typeof entry.query === "string" && typeof entry.city === "string",
        ).slice(0, 6));
      }
    } catch {
      // Browser-local history is optional and must never block discovery.
    }
  }, []);

  const saveRecentSearch = useCallback((entry: DirectoryHistoryEntry) => {
    const normalized = `${entry.query.trim().toLowerCase()}|${entry.city.trim().toLowerCase()}|${entry.stateCode ?? ""}`;
    setRecentSearches((current) => {
      const next = [entry, ...current.filter((candidate) =>
        `${candidate.query.trim().toLowerCase()}|${candidate.city.trim().toLowerCase()}|${candidate.stateCode ?? ""}` !== normalized,
      )].slice(0, 6);
      try { window.localStorage.setItem(DIRECTORY_HISTORY_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((entry: DirectoryHistoryEntry) => {
    setRecentSearches((current) => {
      const next = current.filter((candidate) => candidate !== entry);
      try { window.localStorage.setItem(DIRECTORY_HISTORY_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { window.localStorage.removeItem(DIRECTORY_HISTORY_KEY); } catch { /* optional */ }
  }, []);

  const specialtyLabel = useMemo(
    () =>
      BUSINESS_SPECIALTIES.find((item) => item.slug === specialty)?.label ??
      null,
    [specialty],
  );

  const queryParams = useMemo(() => {
    if (!location.city) return null;
    return buildCanonicalBusinessSearchParams({
      city: location.city,
      stateCode: location.stateCode,
      category,
      specialty: specialtyLabel,
      designations: designationIds,
      searchText,
      limit: PAGE_SIZE,
      offset: 0,
    });
  }, [
    category,
    designationIds,
    location.city,
    location.stateCode,
    searchText,
    specialtyLabel,
  ]);

  const queryKey = queryParams?.toString() ?? "no-location";
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  const invalidateRequests = useCallback(() => {
    requestIdRef.current += 1;
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    if (!queryParams) {
      setRecords([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setRecords([]);
    setTotal(0);
    authenticatedFetch(`${BASE}api/businesses?${queryParams.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Business search failed (${response.status})`);
        return readCanonicalBusinessSearchResponse(await response.json());
      })
      .then((result) => {
        if (requestId !== requestIdRef.current || controller.signal.aborted)
          return;
        setRecords(result.businesses);
        setTotal(result.total);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current)
          return;
        setRecords([]);
        setTotal(0);
        setError(
          caught instanceof Error
            ? caught.message
            : "Business search is unavailable right now.",
        );
      })
      .finally(() => {
        if (requestId === requestIdRef.current && !controller.signal.aborted)
          setLoading(false);
      });
    return () => controller.abort();
  }, [queryKey, retryKey]);

  const loadMore = useCallback(async () => {
    if (!queryParams || loadingMore || records.length >= total) return;
    const requestId = requestIdRef.current;
    const requestKey = queryKey;
    const params = new URLSearchParams(queryParams);
    params.set("offset", String(records.length));
    setLoadingMore(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses?${params.toString()}`,
      );
      if (!response.ok)
        throw new Error(`Business search failed (${response.status})`);
      const result = readCanonicalBusinessSearchResponse(await response.json());
      if (
        requestId !== requestIdRef.current ||
        requestKey !== queryKeyRef.current
      )
        return;
      setRecords((current) =>
        appendUniqueCanonicalBusinesses(current, result.businesses),
      );
      setTotal(result.total);
    } catch (caught) {
      if (
        requestId !== requestIdRef.current ||
        requestKey !== queryKeyRef.current
      )
        return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load more businesses right now.",
      );
    } finally {
      if (
        requestId === requestIdRef.current &&
        requestKey === queryKeyRef.current
      )
        setLoadingMore(false);
    }
  }, [loadingMore, queryKey, queryParams, records.length, total]);

  const locationLabel = [
    location.neighborhood,
    location.city,
    location.stateCode,
  ]
    .filter(Boolean)
    .join(", ");
  const countLabel = !location.city
    ? "Choose your area to begin"
    : loading
      ? "Loading…"
      : error && records.length === 0
        ? "We could not load this search"
        : `${total} searchable ${total === 1 ? "business" : "businesses"} in ${locationLabel}`;

  function toggleDesignation(value: string) {
    invalidateRequests();
    setDesignationIds((current) =>
      current.includes(value)
        ? current.filter((id) => id !== value)
        : [...current, value],
    );
  }

  return (
    <main className="bg-[#FBF6EC] pb-16">
      <section className="bg-[#2B1507] px-6 py-14 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">
          Focused business and service finder
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold">
          Find who you need, where you are.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          Search published businesses by name,
          specialty, category, ownership, city, or postal code.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <LocationSearchBar
          queryLabel="What are you looking for?"
          queryPlaceholder="Search bookstore, natural hair, HVAC, CPA, restaurant…"
          areaPlaceholder="City, neighborhood, or ZIP"
          initialQuery={searchText}
          initialAreaLabel={locationLabel}
          submitLabel="Search area"
          onResolved={({ query, area }) => {
            invalidateRequests();
            setSearchText(query);
            saveRecentSearch({
              query,
              city: area.cityName,
              stateCode: area.stateCode ?? null,
            });
            setExplicitLocation({
              city: area.cityName,
              stateCode: area.stateCode ?? null,
              neighborhood: area.neighborhoodName ?? null,
            });
          }}
        />

        {recentSearches.length > 0 && (
          <section className="mt-4" aria-label="Recent directory searches">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8D5C17]">Recent searches</p>
              <button type="button" onClick={clearRecentSearches} className="text-xs font-semibold text-[#8D5C17] hover:underline">Clear all</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentSearches.map((entry) => (
                <div key={`${entry.query}|${entry.city}|${entry.stateCode ?? ""}`} className="inline-flex overflow-hidden rounded-full border border-[#CA922B]/35 bg-white">
                  <button type="button" onClick={() => {
                    invalidateRequests();
                    setSearchText(entry.query);
                    setExplicitLocation({ city: entry.city, stateCode: entry.stateCode, neighborhood: null });
                  }} className="px-3 py-1.5 text-xs font-semibold text-[#3A1F0E] hover:bg-[#CA922B]/10">
                    {[entry.query, entry.city, entry.stateCode].filter(Boolean).join(" · ")}
                  </button>
                  <button type="button" onClick={() => removeRecentSearch(entry)} aria-label={`Remove ${entry.query || entry.city} from recent searches`} className="border-l border-[#CA922B]/25 px-2 text-[#8D5C17] hover:bg-[#CA922B]/10">×</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <p
          className="mt-4 text-sm font-semibold text-[#2B1507]"
          aria-live="polite"
        >
          {countLabel}
        </p>
        <p className="mt-1 text-xs text-[#3A1F0E]/60">
          Listings marked unclaimed are searchable but are not presented as
          verified or owner-controlled.
        </p>
        {location.city && (
          <Link
            href={`/map?area=${encodeURIComponent([location.city, location.stateCode].filter(Boolean).join("-"))}${searchText.trim() ? `&q=${encodeURIComponent(searchText.trim())}` : ""}`}
            className="mt-3 inline-flex rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17] hover:bg-[#CA922B]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B]"
          >
            Open this business search on Map
          </Link>
        )}

        <FilterRow
          label="Category"
          values={CATEGORIES}
          selected={category ? [category] : []}
          onToggle={(value) => {
            invalidateRequests();
            setCategory(category === value ? null : value);
          }}
        />
        <FilterRow
          label="Specialty"
          values={BUSINESS_SPECIALTIES.map((item) => item.label)}
          selected={specialtyLabel ? [specialtyLabel] : []}
          onToggle={(label) => {
            invalidateRequests();
            const slug =
              BUSINESS_SPECIALTIES.find((item) => item.label === label)?.slug ??
              null;
            setSpecialty(slug === specialty ? null : slug);
          }}
        />
        <FilterRow
          label="Support designations"
          values={INTERSECTIONAL_SUPPORT_FILTER_OPTIONS.map(
            (option) => option.label,
          )}
          selected={INTERSECTIONAL_SUPPORT_FILTER_OPTIONS.filter((option) =>
            designationIds.includes(option.id),
          ).map((option) => option.label)}
          onToggle={(label) => {
            const id = INTERSECTIONAL_SUPPORT_FILTER_OPTIONS.find(
              (option) => option.label === label,
            )?.id;
            if (id) toggleDesignation(id);
          }}
        />
        <p className="mt-2 text-xs text-[#3A1F0E]/60">
          Choose one or more labels. When more than one is selected, a listing
          must match <strong>every</strong> selected owner-provided label.
        </p>

        {!location.city && <LocationNeededState />}
        {!loading && error && (
          <section
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <h2 className="font-serif text-2xl font-bold text-[#2B1507]">
              Your search did not load
            </h2>
            <p className="mt-2 leading-7 text-[#3A1F0E]/70">{error}</p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-4 rounded-full bg-[#2B1507] px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </section>
        )}
        {!loading && !error && location.city && records.length === 0 && (
          <DirectoryGapState />
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <BusinessCard key={record.id} record={record} />
          ))}
        </section>

        {!loading && records.length < total && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="rounded-full bg-[#2B1507] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loadingMore
                ? "Loading more…"
                : `Load more (${total - records.length} remaining)`}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function FilterRow({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: readonly string[] | string[];
  selected: string[];
  onToggle(value: string): void;
}) {
  return (
    <section className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8D5C17]">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            aria-pressed={selected.includes(value)}
            type="button"
            onClick={() => onToggle(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected.includes(value)
                ? "bg-[#3A1F0E] text-white"
                : "border border-[#3A1F0E]/15 bg-white text-[#3A1F0E] hover:border-[#CA922B]/40"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}

function BusinessCard({ record }: { record: CanonicalBusinessSearchRecord }) {
  const unclaimed = record.listingStatus === "live_unclaimed";
  const heroIcon = getBusinessHeroIcon(record);
  const fallbackSymbol: Record<ReturnType<typeof getBusinessHeroIcon>, string> = {
    beauty: "✂️", food: "🍽️", health: "✚", professional: "⚖️", arts: "✦",
    retail: "🛍️", faith: "⌂", education: "▣", home: "⌂", travel: "✈️", business: "◆",
  };
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  const hasPin =
    record.latitude != null &&
    record.longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);
  const communityOwnership =
    record.ownershipClaim === "community_reported_minority_owned"
      ? "Community-reported minority-owned · Not verified"
      : record.ownershipClaim === "community_reported_non_minority_owned"
        ? "Community-reported non-minority-owned · Not verified"
        : record.ownershipClaim === "source_reported_ownership_unverified"
          ? "Source-reported ownership · Not owner-verified"
          : record.ownershipClaim === "source_reputable_listing_unverified"
            ? "Published from a reputable source · Ownership not yet verified"
        : null;
  return (
    <Link
      href={`/businesses/${encodeURIComponent(record.id)}`}
      className="block overflow-hidden rounded-2xl border border-[#3A1F0E]/10 bg-white shadow-sm transition hover:border-[#CA922B]/60"
    >
      {canDisplayBusinessCover(record) ? (
        <img src={record.imageUrl!} alt={`${record.name} listing`} className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#F4D98D] via-[#CA922B] to-[#8D5C17] text-4xl" aria-label={`${heroIcon} business category`}>
          <span aria-hidden="true">{fallbackSymbol[heroIcon]}</span>
        </div>
      )}
      <div className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">
        {record.category || "Business"}
        {record.subcategory ? ` · ${record.subcategory}` : ""}
      </p>
      <h2 className="mt-2 text-lg font-bold text-[#2B1507]">{record.name}</h2>
      <p className="mt-1 text-sm text-[#3A1F0E]/70">
        {[record.city, record.state].filter(Boolean).join(", ")}
      </p>
      {record.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#3A1F0E]/65">
          {record.description}
        </p>
      )}
      <p className="mt-4 text-xs font-semibold text-[#8D5C17]">
        {unclaimed
          ? "Unclaimed · Not verified"
          : record.verified
            ? "Verified listing"
            : "Not verified"}
      </p>
      {unclaimed && (
        <p className="mt-1 text-xs text-[#3A1F0E]/65">
          {hasPin
            ? "Precise map pin available"
            : "Searchable by city · Precise map pin pending"}
        </p>
      )}
      {communityOwnership && (
        <p className="mt-1 text-xs font-semibold text-[#6B4A2F]">
          {communityOwnership}
        </p>
      )}
      {record.priceRange && (
        <p className="mt-1 text-xs text-[#3A1F0E]/60">
          Price: {record.priceRange}
        </p>
      )}
      <p className="mt-3 text-xs font-bold text-[#CA922B]">
        View details, Community Says, and{" "}
        {record.website
          ? "website"
          : record.sourceUrl
            ? "supplied source"
            : "available links"}{" "}
        →
      </p>
      </div>
    </Link>
  );
}

function LocationNeededState() {
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/35 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">
        Choose an area to begin
      </h2>
      <p className="mt-2 max-w-xl leading-7 text-[#3A1F0E]/70">
        Enter a city above or use your location to see nearby businesses and
        services.
      </p>
    </section>
  );
}

function DirectoryGapState() {
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/35 bg-[#CA922B]/[0.07] p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">
        No published local match yet.
      </h2>
      <p className="mt-2 leading-7 text-[#3A1F0E]/70">
        Try a broader specialty or category, or add a complete community
        business so it can publish immediately after software checks.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/submit-business"
          className="rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]"
        >
          Add a business
        </Link>
      </div>
    </section>
  );
}
