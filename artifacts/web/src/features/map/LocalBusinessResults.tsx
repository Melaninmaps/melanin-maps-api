/**
 * LocalBusinessResults — fetches up to 2 businesses nearest to a supplied
 * area using the scoped /api/map/local-business-search endpoint.
 *
 * The result set returned by the API is identical to the pin set — the map
 * never shows a business that is absent from this list. Wider radii (10 mi,
 * 25 mi) are only activated after an explicit member click on the expansion
 * button; they never trigger automatically.
 *
 * Each result item carries data-testid="local-search-pin" so regression tests
 * can assert the exact count of locally-scoped pins without inspecting the map
 * canvas.
 */
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Result = {
  id: string;
  name: string;
  city: string | null;
  stateCode: string | null;
  latitude: number;
  longitude: number;
  distanceMi: number;
  detailUrl: string;
};

type SearchResponse = {
  scope: "local" | "expanded";
  radiusMi: number;
  limit: number;
  results: Result[];
  pins: Result[];
  expansion: {
    available: boolean;
    nextRadiusMi: 10 | 25 | null;
    message: string | null;
  };
};

type Area = { latitude: number; longitude: number; label: string };

type Props = {
  query: string;
  area: Area;
  onPinsChange(pins: Result[], area: Area): void;
};

export function LocalBusinessResults({ query, area, onPinsChange }: Props) {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [radiusMi, setRadiusMi] = useState<5 | 10 | 25>(5);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    setStatus("loading");

    const url = `${BASE}/api/map/local-business-search?q=${encodeURIComponent(query)}&lat=${area.latitude}&lng=${area.longitude}&radius=${radiusMi}&expand=${radiusMi > 5 ? 1 : 0}`;

    fetch(url, {
      signal: controller.signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((result) =>
        result.ok
          ? (result.json() as Promise<SearchResponse>)
          : Promise.reject(new Error("LOCAL_SEARCH_FAILED")),
      )
      .then((result: SearchResponse) => {
        setResponse(result);
        setStatus("ready");
        onPinsChange(result.pins, area);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== "AbortError") {
          setStatus("error");
          onPinsChange([], area);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, area.latitude, area.longitude, radiusMi]);

  if (status === "loading") {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-[#3A1F0E]/50">
        <span className="w-4 h-4 block rounded-full border-2 border-[#CA922B]/30 border-t-[#CA922B] animate-spin shrink-0" />
        Finding nearby results…
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="p-4 text-sm text-[#9c1c1c] font-semibold">
        We could not load nearby results. Please try again.
      </p>
    );
  }

  if (!response) return null;

  return (
    <section aria-label="Nearby search results" className="flex flex-col">
      <p className="px-4 py-2 text-xs text-[#3A1F0E]/50 font-medium border-b border-[#3A1F0E]/6">
        {response.results.length}{" "}
        {response.results.length === 1 ? "result" : "results"} within{" "}
        {response.radiusMi} miles of {area.label}.
      </p>

      {response.results.length === 0 ? (
        <p className="p-4 text-sm text-[#3A1F0E]/60">
          No matching places were found nearby.
        </p>
      ) : (
        <ol className="divide-y divide-[#3A1F0E]/6">
          {response.results.map((business) => (
            <li
              key={business.id}
              data-testid="local-search-pin"
              className="p-4 hover:bg-[#FAF6EF] transition-colors"
            >
              <a
                href={business.detailUrl}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <strong className="block font-bold text-sm text-[#2B1507] leading-tight truncate">
                    {business.name}
                  </strong>
                  <span className="block text-xs text-[#3A1F0E]/60 mt-0.5">
                    {[business.city, business.stateCode].filter(Boolean).join(", ")}
                    {" · "}
                    <span className="text-[#CA922B] font-semibold">
                      {business.distanceMi.toFixed(1)} mi away
                    </span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#CA922B] hover:underline shrink-0 mt-0.5">
                  View →
                </span>
              </a>
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
