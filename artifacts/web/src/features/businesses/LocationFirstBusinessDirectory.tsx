import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import { LocationSearchBar } from "@/features/location/LocationSearchBar";
import type { DiscoveryRecord, LocationFirstResponse } from "@/shared/discoveryContracts";
import { BUSINESS_SPECIALTIES } from "@/shared/discoveryContracts";
import { buildBusinessDirectoryQuery } from "./businessDirectoryQuery";

const BASE = import.meta.env.BASE_URL;

const CATEGORIES = [
  "Food & Drink", "Beauty & Personal Care", "Health & Wellness",
  "Professional Services", "Arts & Culture", "Retail & Shopping",
  "Faith & Community",
];
const OWNERSHIP_FILTERS = [
  "Black-Owned", "Women-Owned", "LGBTQIA+-Owned",
  "Latino-Owned", "Indigenous-Owned", "Veteran-Owned",
];

export function LocationFirstBusinessDirectory() {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [ownership, setOwnership] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [response, setResponse] = useState<LocationFirstResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => buildBusinessDirectoryQuery({
      location,
      category,
      specialty,
      ownership,
      searchText,
    }),
    [location, category, specialty, ownership, searchText],
  );

  useEffect(() => {
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
      .catch((e) => { if (e.name !== "AbortError") console.error("Business discovery failed", e); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  const locationLabel = [location.neighborhood, location.city, location.stateCode].filter(Boolean).join(", ");
  const countLabel = !location.city
    ? "Choose your area to begin"
    : loading
    ? "Loading…"
    : `${response?.records.length ?? 0} verified businesses in ${locationLabel}`;

  function toggleOwnership(value: string) {
    setOwnership((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }


  return (
    <main className="bg-[#FBF6EC] pb-16">
      {/* Hero */}
      <section className="bg-[#2B1507] px-6 py-14 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">
          Community business and service finder
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Find who you need, where you are.</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          Businesses, professionals, and organizations with the cultural context that matters — scoped to your location first.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {/* Search + location — single shared control with visible foreground, resolver states, and geolocation */}
        <LocationSearchBar
          queryLabel="What are you looking for?"
          queryPlaceholder="Search barber, OB-GYN, tax attorney, restaurant…"
          areaPlaceholder="City, neighborhood, or ZIP"
          initialQuery={searchText}
          initialAreaLabel={locationLabel}
          submitLabel="Search area"
          onResolved={({ query, area }) => {
            setSearchText(query);
            setExplicitLocation({
              city: area.cityName,
              stateCode: area.stateCode ?? null,
              neighborhood: area.neighborhoodName ?? null,
            });
          }}
        />

        <p className="mt-4 text-sm font-semibold text-[#2B1507]">{countLabel}</p>
        <p className="mt-1 text-xs text-[#3A1F0E]/60">
          Location first. Mapping with Melanin does not substitute a national directory for your local result.
        </p>

        {/* Filters */}
        <FilterRow
          label="Category"
          values={CATEGORIES}
          selected={category ? [category] : []}
          onToggle={(v) => setCategory(category === v ? null : v)}
        />
        <FilterRow
          label="Specialty"
          values={BUSINESS_SPECIALTIES.map((s) => s.label)}
          selected={specialty ? [BUSINESS_SPECIALTIES.find((s) => s.slug === specialty)?.label ?? specialty] : []}
          onToggle={(label) => {
            const slug = BUSINESS_SPECIALTIES.find((s) => s.label === label)?.slug ?? null;
            setSpecialty(slug === specialty ? null : slug);
          }}
        />
        <FilterRow
          label="Ownership"
          values={OWNERSHIP_FILTERS}
          selected={ownership}
          onToggle={toggleOwnership}
        />

        {/* States */}
        {!location.city && <LocationNeededState />}
        {!loading && response?.coverageGap && <DirectoryGapState response={response} />}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {response?.records.map((record) => (
            <BusinessCard key={record.id} record={record} />
          ))}
        </section>
      </section>
    </main>
  );
}

function FilterRow({
  label, values, selected, onToggle,
}: {
  label: string; values: readonly string[] | string[]; selected: string[]; onToggle(v: string): void;
}) {
  return (
    <section className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8D5C17]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            aria-pressed={selected.includes(v)}
            type="button"
            onClick={() => onToggle(v)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected.includes(v)
                ? "bg-[#3A1F0E] text-white"
                : "border border-[#3A1F0E]/15 bg-white text-[#3A1F0E] hover:border-[#CA922B]/40"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </section>
  );
}

function BusinessCard({ record }: { record: DiscoveryRecord }) {
  return (
    <Link
      href={record.detailUrl}
      className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm transition hover:border-[#CA922B]/60 block"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">
        {record.category || "Business"}
        {record.specialty ? ` · ${record.specialty}` : ""}
      </p>
      <h2 className="mt-2 text-lg font-bold text-[#2B1507]">{record.name}</h2>
      <p className="mt-1 text-sm text-[#3A1F0E]/70">
        {[record.neighborhood, record.city].filter(Boolean).join(" · ")}
      </p>
      {record.contextTags.length > 0 && (
        <p className="mt-3 text-xs text-[#8D5C17]">{record.contextTags.map((t) => t.label).join(" · ")}</p>
      )}
    </Link>
  );
}

function LocationNeededState() {
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/35 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">Choose an area to begin</h2>
      <p className="mt-2 max-w-xl leading-7 text-[#3A1F0E]/70">
        Enter a city above or use your location to see nearby businesses and services.
      </p>
    </section>
  );
}

function DirectoryGapState({ response }: { response: LocationFirstResponse }) {
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/35 bg-[#CA922B]/[0.07] p-6">
      <h2 className="font-serif text-2xl font-bold text-[#2B1507]">We do not have that nearby yet.</h2>
      <p className="mt-2 leading-7 text-[#3A1F0E]/70">
        This local need has been recorded so we can improve coverage. You can expand your search, view the nearest available city, or help add a listing.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/businesses/submit" className="rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17]">
          Add a business
        </Link>
      </div>
    </section>
  );
}
