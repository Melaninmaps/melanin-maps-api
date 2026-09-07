import { useCallback, useMemo, useState } from "react";
import { Search, Loader2, Map as MapIcon, PlusCircle } from "lucide-react";
import { Link, useSearch } from "wouter";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import UniversalSearchResults, { type UniversalSearchResult } from "@/components/UniversalSearchResults";

const BASE = import.meta.env.BASE_URL;

export default function DiscoverUniversal() {
  const searchString = useSearch();
  const initialQuery = useMemo(() => new URLSearchParams(searchString).get("q")?.trim() ?? "", [searchString]);
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [result, setResult] = useState<UniversalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (override?: string) => {
    const q = (override ?? query).trim();
    if (q.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedQuery(q);
    try {
      const params = new URLSearchParams({
        q,
        surface: "smart_search",
        privacy_mode: "discovery_v1",
        limit: "30",
      });
      const response = await authenticatedFetch(`${BASE}api/search/universal?${params.toString()}`);
      if (!response.ok) throw new Error(`Community search failed (${response.status})`);
      const payload = await response.json() as UniversalSearchResult;
      if (!payload?.results || !Array.isArray(payload.results.businesses)) {
        throw new Error("Community search returned an incomplete response.");
      }
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Community search is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [loading, query]);

  return (
    <main className="min-h-screen bg-[#FAF6EF] pb-16">
      <section className="bg-[#2B1507] px-4 py-14 text-center text-white md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E5B94B]">Discover your community</p>
        <h1 className="mx-auto mt-3 max-w-4xl font-serif text-4xl font-bold md:text-6xl">Businesses, events, culture, knowledge, and community.</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/75">
          Search the full member discovery index. Every result remains subject to its existing publication and privacy rules.
        </p>
        <form
          aria-label="Discover search"
          className="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
          onSubmit={(event) => { event.preventDefault(); void runSearch(); }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Search Discover</span>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3A1F0E]/45" />
            <input
              aria-label="Search Discover"
              autoComplete="off"
              className="h-14 w-full rounded-2xl border border-white/20 bg-white pl-12 pr-4 text-[#2B1507] placeholder:text-[#3A1F0E]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5B94B]"
              data-testid="discover-search-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants, meetings, heritage, Library topics, or organizations"
              type="search"
              value={query}
            />
          </label>
          <button
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#CA922B] px-7 font-bold text-white transition-colors hover:bg-[#B38024] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-testid="discover-search-button"
            disabled={loading || query.trim().length < 2}
            type="submit"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-3">
          <Link href={query.trim() ? `/map?q=${encodeURIComponent(query.trim())}` : "/map"} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-[#E5B94B]">
            <MapIcon className="h-4 w-4" /> Open on Map
          </Link>
          <Link href="/submit-business" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-[#E5B94B]">
            <PlusCircle className="h-4 w-4" /> Submit a Business
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {error && (
          <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-serif text-2xl font-bold text-[#2B1507]">Discover search did not load</h2>
            <p className="mt-2 text-[#3A1F0E]/70">{error}</p>
            <button type="button" onClick={() => void runSearch(searchedQuery)} className="mt-4 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
          </section>
        )}
        {!loading && !error && result && <UniversalSearchResults result={result} surface="Discover" />}
        {!loading && !error && !result && (
          <section className="rounded-3xl border border-[#CA922B]/25 bg-white p-8 text-center md:p-12">
            <h2 className="font-serif text-3xl font-bold text-[#2B1507]">What matters today?</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-[#3A1F0E]/65">Search broadly to see every supported type the existing API returns. Use Businesses when you only need the focused directory.</p>
            <Link href="/businesses" className="mt-6 inline-flex rounded-full border border-[#CA922B] px-5 py-2.5 text-sm font-bold text-[#8D5C17]">Open focused Businesses</Link>
          </section>
        )}
      </section>
    </main>
  );
}
