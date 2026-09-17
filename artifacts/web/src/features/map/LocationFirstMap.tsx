import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDiscoveryLocation } from "@/features/discovery/LocationContext";
import type {
  CanonicalRecordType,
  DiscoveryRecord,
  LocationFirstResponse,
} from "@/shared/discoveryContracts";
import { BUSINESS_SPECIALTIES } from "@/shared/discoveryContracts";
import { Link } from "wouter";
import { LocationSearchBar } from "@/features/location/LocationSearchBar";
import { INTERSECTIONAL_SUPPORT_FILTER_OPTIONS } from "@workspace/constants";

const BASE = import.meta.env.BASE_URL;

type Layer = { id: CanonicalRecordType; label: string };
const LAYERS: Layer[] = [
  { id: "business", label: "Businesses" },
  { id: "cultural_site", label: "Cultural Sites" },
  { id: "event", label: "Events" },
  { id: "community_place", label: "Community" },
];

export function LocationFirstMap({
  renderMap,
}: {
  renderMap: (
    records: DiscoveryRecord[],
    selectedLayer: CanonicalRecordType,
  ) => ReactNode;
}) {
  const { location, setExplicitLocation } = useDiscoveryLocation();
  const [selectedLayer, setSelectedLayer] =
    useState<CanonicalRecordType>("business");
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [designationIds, setDesignationIds] = useState<string[]>([]);
  const [response, setResponse] = useState<LocationFirstResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      surface: "map" as const,
      location,
      locationMode: "exact" as const,
      radiusMiles: null,
      filters: {
        recordTypes: [selectedLayer],
        category: null,
        specialty,
        ownership: designationIds,
        tagSlugs: [],
        dateRange: null,
      },
      searchText: null,
    }),
    [designationIds, location, selectedLayer, specialty],
  );

  useEffect(() => {
    if (!location.city) return; // don't fire without a location
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
      .catch((e) => {
        if (e.name !== "AbortError") console.error("Map discovery failed", e);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  const records = response?.records ?? [];
  const locationLabel = [
    location.neighborhood,
    location.city,
    location.stateCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="grid min-h-[680px] grid-cols-[340px_1fr] bg-[#FBF6EC]">
      <aside className="border-r border-[#3A1F0E]/10 bg-white overflow-hidden flex flex-col">
        <header className="border-b border-[#3A1F0E]/10 p-5 shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8D5C17]">
            Around you
          </p>
          <h1 className="mt-1 font-serif text-xl font-bold text-[#2B1507]">
            {locationLabel || "Choose an area"}
          </h1>
          {!location.city && (
            <LocationSearchBar
              queryLabel="Map search"
              queryPlaceholder=""
              areaPlaceholder="City, State (e.g. Philadelphia, PA)"
              showQuery={false}
              submitLabel="Go"
              onResolved={({ area }) => {
                setExplicitLocation({
                  city: area.cityName,
                  stateCode: area.stateCode,
                  neighborhood: area.neighborhoodName,
                });
              }}
            />
          )}
        </header>

        {/* Layer selector */}
        <nav
          className="flex flex-wrap gap-2 p-4 shrink-0 border-b border-[#3A1F0E]/10"
          aria-label="Map layers"
        >
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              aria-pressed={selectedLayer === layer.id}
              type="button"
              onClick={() => {
                setSelectedLayer(layer.id);
                setSpecialty(null);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                selectedLayer === layer.id
                  ? "bg-[#3A1F0E] text-white"
                  : "border border-[#3A1F0E]/15 text-[#3A1F0E] hover:border-[#CA922B]/40"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </nav>

        {/* Specialty chips — Businesses only */}
        {selectedLayer === "business" && (
          <div className="border-b border-[#3A1F0E]/10 px-4 pb-3 pt-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {BUSINESS_SPECIALTIES.map((s) => (
                <button
                  key={s.slug}
                  aria-pressed={specialty === s.slug}
                  type="button"
                  onClick={() =>
                    setSpecialty(specialty === s.slug ? null : s.slug)
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    specialty === s.slug
                      ? "bg-[#CA922B]/20 text-[#8D5C17] border border-[#CA922B]/40"
                      : "border border-[#CA922B]/30 text-[#8D5C17] hover:bg-[#CA922B]/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-[#8D5C17]">
                Support designations
                {designationIds.length ? ` (${designationIds.length})` : ""}
              </summary>
              <p className="mt-2 text-xs leading-5 text-[#3A1F0E]/60">
                Every selected owner-provided label must match. Clear a label to
                broaden the map.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERSECTIONAL_SUPPORT_FILTER_OPTIONS.map((option) => {
                  const selected = designationIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setDesignationIds((current) =>
                          selected
                            ? current.filter((id) => id !== option.id)
                            : [...current, option.id],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        selected
                          ? "border-[#2B1507] bg-[#2B1507] text-white"
                          : "border-[#CA922B]/30 text-[#8D5C17] hover:bg-[#CA922B]/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto" aria-live="polite">
          {!location.city && (
            <p className="p-5 text-sm leading-6 text-[#3A1F0E]/70">
              Enter a city above to see what Mapping with Melanin has nearby. A
              national list is never substituted for a local result.
            </p>
          )}
          {loading && (
            <p className="p-5 text-sm text-[#3A1F0E]/60">
              Updating the local map…
            </p>
          )}
          {!loading &&
            records.map((record) => (
              <Link
                key={`${record.recordType}-${record.id}`}
                href={record.detailUrl}
                className="block border-b border-[#3A1F0E]/8 p-4 hover:bg-[#CA922B]/[0.06] transition-colors"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8D5C17]">
                  {record.recordType.replace(/_/g, " ")}
                </p>
                <h2 className="mt-0.5 font-semibold text-[#2B1507] text-sm">
                  {record.name}
                </h2>
                <p className="mt-0.5 text-xs text-[#3A1F0E]/60">
                  {[record.specialty, record.category, record.neighborhood]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            ))}
          {!loading && response?.coverageGap && (
            <CoverageGapPanel response={response} />
          )}
          {!loading &&
            location.city &&
            response &&
            !response.requiresLocation &&
            !response.coverageGap &&
            !records.length && (
              <p className="p-5 text-sm text-[#3A1F0E]/60">
                No matching local places listed yet.
              </p>
            )}
        </div>
      </aside>

      {/* Map canvas — passed in by the parent page */}
      <div className="relative">{renderMap(records, selectedLayer)}</div>
    </section>
  );
}

function CoverageGapPanel({ response }: { response: LocationFirstResponse }) {
  return (
    <section className="m-4 rounded-xl border border-[#CA922B]/35 bg-[#CA922B]/[0.07] p-4">
      <p className="font-semibold text-sm text-[#2B1507]">
        Nothing matching this selection is listed nearby yet.
      </p>
      <p className="mt-2 text-xs leading-5 text-[#3A1F0E]/70">
        This local need has been recorded so the community can grow coverage —
        we never show a distant listing as local.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/submit-business"
          className="rounded-full border border-[#CA922B] px-3 py-1.5 text-xs font-semibold text-[#8D5C17]"
        >
          Add a listing
        </Link>
      </div>
    </section>
  );
}
