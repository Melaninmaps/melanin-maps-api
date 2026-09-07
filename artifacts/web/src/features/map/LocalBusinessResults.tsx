import { useEffect, useState } from "react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Result = {
  id: string;
  name: string;
  city: string | null;
  stateCode: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMi: number | null;
  detailUrl: string;
};

type SearchResponse = {
  scope: "local" | "expanded";
  radiusMi: number;
  limit: number;
  totalRelevantListings: number;
  pinnableCount: number;
  results: Result[];
  pins: Result[];
  expansion: {
    available: boolean;
    nextRadiusMi: 10 | 25 | null;
    message: string | null;
  };
};

type Area = { latitude: number; longitude: number; label: string; city?: string; stateCode?: string };

type Props = {
  query: string;
  subject?: string;
  area: Area;
  onPinsChange(pins: Array<Result & { latitude: number; longitude: number }>, area: Area): void;
};

export function hasValidLocalResultCoordinates(
  result: Pick<Result, "latitude" | "longitude">,
): result is Result & { latitude: number; longitude: number } {
  const { latitude, longitude } = result;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude! >= -90 && latitude! <= 90
    && longitude! >= -180 && longitude! <= 180
    && !(latitude === 0 && longitude === 0);
}

export function LocalBusinessResults({ query, subject, area, onPinsChange }: Props) {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [radiusMi, setRadiusMi] = useState<5 | 10 | 25>(5);

  useEffect(() => {
    setRadiusMi(5);
  }, [query, subject, area.latitude, area.longitude, area.city, area.stateCode]);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    setStatus("loading");

    const params = new URLSearchParams({
      q: query,
      lat: String(area.latitude),
      lng: String(area.longitude),
      radius: String(radiusMi),
      expand: radiusMi > 5 ? "1" : "0",
      privacy_mode: "discovery_v1",
    });
    if (subject) params.set("subject", subject);
    if (area.city) params.set("city", area.city);
    if (area.stateCode) params.set("stateCode", area.stateCode);

    fetch(`${BASE}/api/map/local-business-search?${params}`, {
      signal: controller.signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((result) =>
        result.ok
          ? (result.json() as Promise<SearchResponse>)
          : Promise.reject(new Error("LOCAL_SEARCH_FAILED")),
      )
      .then((result) => {
        setResponse(result);
        setStatus("ready");
        const listedIds = new Set(result.results.map((business) => business.id));
        onPinsChange(result.pins.filter((pin): pin is Result & { latitude: number; longitude: number } =>
          listedIds.has(pin.id) && hasValidLocalResultCoordinates(pin),
        ), area);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== "AbortError") {
          setStatus("error");
          onPinsChange([], area);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, subject, area.latitude, area.longitude, area.city, area.stateCode, radiusMi]);

  if (status === "loading") {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-[#3A1F0E]/50">
        <span className="w-4 h-4 block rounded-full border-2 border-[#CA922B]/30 border-t-[#CA922B] animate-spin shrink-0" />
        Finding nearby results…
      </div>
    );
  }

  if (status === "error") {
    return <p className="p-4 text-sm text-[#9c1c1c] font-semibold">We could not load nearby results. Please try again.</p>;
  }
  if (!response) return null;

  return (
    <section aria-label="Nearby search results" className="flex flex-col">
      <p data-testid="local-search-counts" className="px-4 py-2 text-xs text-[#3A1F0E]/50 font-medium border-b border-[#3A1F0E]/6">
        <span data-testid="local-search-total-count">{response.totalRelevantListings}</span> relevant {response.totalRelevantListings === 1 ? "listing" : "listings"} within{" "}
        {response.radiusMi} miles of {area.label}; <span data-testid="local-search-pinnable-count">{response.pinnableCount}</span> {response.pinnableCount === 1 ? "has" : "have"} a map pin.
      </p>

      {response.results.length === 0 ? (
        <p className="p-4 text-sm text-[#3A1F0E]/60">No matching places were found nearby.</p>
      ) : (
        <ol className="divide-y divide-[#3A1F0E]/6">
          {response.results.map((business) => (
            <li
              key={business.id}
              data-testid="local-search-result"
              data-business-id={business.id}
              data-pinnable={hasValidLocalResultCoordinates(business) ? "true" : "false"}
              className="p-4 hover:bg-[#FAF6EF] transition-colors"
            >
              <Link href={`/businesses/${encodeURIComponent(business.id)}`} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <strong className="block font-bold text-sm text-[#2B1507] leading-tight truncate">{business.name}</strong>
                  <span className="block text-xs text-[#3A1F0E]/60 mt-0.5">
                    {[business.city, business.stateCode].filter(Boolean).join(", ")}
                    {" · "}
                    <span className="text-[#CA922B] font-semibold">
                      {business.distanceMi === null ? "Location not mapped yet" : `${business.distanceMi.toFixed(1)} mi away`}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#CA922B] hover:underline shrink-0 mt-0.5">View →</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {response.expansion.available && response.expansion.nextRadiusMi ? (
        <div className="px-4 py-3 border-t border-[#3A1F0E]/8 bg-[#FDF8F0]">
          <p className="text-xs text-[#3A1F0E]/60 mb-2">{response.expansion.message}</p>
          <button
            onClick={() => setRadiusMi(response.expansion.nextRadiusMi!)}
            type="button"
            className="text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors"
          >
            Search within {response.expansion.nextRadiusMi} miles
          </button>
        </div>
      ) : null}
    </section>
  );
}
