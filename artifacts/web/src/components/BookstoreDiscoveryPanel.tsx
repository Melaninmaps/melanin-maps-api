/**
 * BookstoreDiscoveryPanel — location-first bookstore finder.
 *
 * Shown when the directory search query matches bookstore intent.
 * Prompts for browser location, calls the directory API, and shows the single
 * closest verified result (or a controlled online fallback).
 *
 * The directory experience is preserved — this is not a Kinfolk chat screen.
 */
import { useState } from "react";
import { Link } from "wouter";
import { MapPin, ExternalLink } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type Coordinates = { lat: number; lng: number };

type BookstoreDiscoveryResponse = {
  query: string;
  radiusMiles: number;
  locationRequired: boolean;
  closestBookstore: {
    id: string;
    name: string;
    detailUrl: string;
    distanceMiles: number;
    city?: string | null;
    state?: string | null;
    addressLine1?: string | null;
    description?: string | null;
  } | null;
  nearbyResultCount: number;
  onlineRecommendation: {
    name: string;
    url: string;
    description: string;
    reason: string;
  } | null;
  message: string;
};

function isBookstoreQuery(value: string): boolean {
  return /\b(bookstore|book\s*-?\s*store|bookshop)\b/i.test(value.trim());
}

function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser cannot share location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () =>
        reject(
          new Error(
            "Location was not shared. You can try again whenever you are ready.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

async function searchClosestBookstore(
  query: string,
  location: Coordinates | null,
): Promise<BookstoreDiscoveryResponse> {
  const params = new URLSearchParams({ q: query });
  if (location) {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
  }

  const response = await fetch(
    `${API_BASE}/api/directory/bookstores/closest?${params.toString()}`,
    { credentials: "include" },
  );
  const payload = (await response.json()) as BookstoreDiscoveryResponse & {
    error?: string;
  };

  if (!response.ok)
    throw new Error(payload.error ?? "Unable to search the directory.");
  return payload;
}

export default function BookstoreDiscoveryPanel({ query }: { query: string }) {
  const [result, setResult] = useState<BookstoreDiscoveryResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "location" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (!isBookstoreQuery(query)) return null;

  async function runSearch(location: Coordinates | null) {
    try {
      setStatus("loading");
      setError(null);
      setResult(await searchClosestBookstore(query, location));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to search the directory.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function shareLocationAndSearch() {
    try {
      setStatus("location");
      setError(null);
      const location = await getCurrentCoordinates();
      setResult(await searchClosestBookstore(query, location));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to get your location.",
      );
    } finally {
      setStatus("idle");
    }
  }

  // ── No result yet: show prompt ──────────────────────────────────────────────
  if (!result) {
    return (
      <section
        className="mt-6 rounded-2xl border border-[#CA922B]/20 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-[#CA922B]" />
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Find the closest bookstore
          </h2>
        </div>
        <p className="text-sm leading-6 text-[#3A1F0E]/70">
          We use your approximate location only to rank nearby options. We never show
          a nationwide list first.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void shareLocationAndSearch()}
            disabled={status !== "idle"}
            className="rounded-full bg-[#CA922B] px-5 py-2.5 font-semibold text-white text-sm disabled:opacity-60 hover:bg-[#B38024] transition-colors"
          >
            {status === "location"
              ? "Getting your location…"
              : status === "loading"
                ? "Checking directory…"
                : "Share location and find a bookstore"}
          </button>
          <button
            type="button"
            onClick={() => void runSearch(null)}
            disabled={status !== "idle"}
            className="rounded-full border border-[#CA922B]/40 px-5 py-2.5 font-semibold text-[#CA922B] text-sm disabled:opacity-60 hover:bg-[#CA922B]/5 transition-colors"
          >
            Browse without location
          </button>
        </div>
      </section>
    );
  }

  // ── Location required state (browse without location hit) ───────────────────
  if (result.locationRequired) {
    return (
      <section
        className="mt-6 rounded-2xl border border-[#CA922B]/20 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-[#CA922B]" />
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Share your location to find nearby bookstores
          </h2>
        </div>
        <p className="text-sm leading-6 text-[#3A1F0E]/70">{result.message}</p>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void shareLocationAndSearch()}
          disabled={status !== "idle"}
          className="mt-4 rounded-full bg-[#CA922B] px-5 py-2.5 font-semibold text-white text-sm disabled:opacity-60 hover:bg-[#B38024] transition-colors"
        >
          {status !== "idle" ? "Searching…" : "Share location and continue"}
        </button>
      </section>
    );
  }

  // ── Closest result found ────────────────────────────────────────────────────
  if (result.closestBookstore) {
    const store = result.closestBookstore;
    return (
      <section
        className="mt-6 rounded-2xl border border-[#CA922B]/20 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-[#CA922B]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#CA922B]">
            Closest community bookstore
          </p>
        </div>

        <h2 className="font-serif text-2xl font-bold text-[#2B1507]">{store.name}</h2>

        {(store.city || store.addressLine1) && (
          <p className="mt-1 text-sm text-[#3A1F0E]/60">
            {store.addressLine1 ? `${store.addressLine1}` : ""}
            {store.addressLine1 && store.city ? " · " : ""}
            {store.city}
            {store.state ? `, ${store.state}` : ""}
          </p>
        )}

        <p className="mt-1 text-sm font-semibold text-[#CA922B]">
          {store.distanceMiles} miles away
        </p>

        {store.description && (
          <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/80 line-clamp-3">
            {store.description}
          </p>
        )}

        <p className="mt-3 text-xs text-[#3A1F0E]/50 italic">{result.message}</p>

        <Link
          href={store.detailUrl}
          className="mt-4 inline-block rounded-full bg-[#CA922B] px-5 py-2.5 font-semibold text-white text-sm hover:bg-[#B38024] transition-colors"
        >
          View bookstore details →
        </Link>
      </section>
    );
  }

  // ── Online fallback ─────────────────────────────────────────────────────────
  if (result.onlineRecommendation) {
    const rec = result.onlineRecommendation;
    return (
      <section
        className="mt-6 rounded-2xl border border-[#CA922B]/20 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-[#3A1F0E]/30" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#3A1F0E]/50">
            Directory coverage gap
          </p>
        </div>

        <p className="text-sm leading-6 text-[#3A1F0E]/70 mb-4">{rec.reason}</p>

        <div className="rounded-xl border border-[#CA922B]/20 bg-[#FDF8F0] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">
            Verified online option
          </p>
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">{rec.name}</h2>
          <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/70">{rec.description}</p>
          <a
            href={rec.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#CA922B] hover:underline"
          >
            Visit {rec.name} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="mt-3 text-xs text-[#3A1F0E]/40 italic">
          We recorded your search to help improve local bookstore coverage in this area.
          This does not mean no community bookstore exists here.
        </p>
      </section>
    );
  }

  // ── No results, no online fallback ─────────────────────────────────────────
  return (
    <section
      className="mt-6 rounded-2xl border border-[#CA922B]/20 bg-white p-6 shadow-sm"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-[#3A1F0E]/30" />
        <h2 className="font-serif text-xl font-bold text-[#2B1507]">
          No local bookstore found within {result.radiusMiles} miles
        </h2>
      </div>
      <p className="text-sm leading-6 text-[#3A1F0E]/70">{result.message}</p>
    </section>
  );
}
