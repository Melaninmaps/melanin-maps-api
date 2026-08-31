import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { MwmTopicIcon } from "@/components/brand/MwmTopicIcon";
import "@/styles/mwm-topic-icons.css";
import "./living-library.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type TopicResult = {
  kind: "topic";
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconKey: string | null;
  entryCount: number;
};

type EntryResult = {
  kind: "entry";
  id: string;
  title: string;
  summary: string;
  body: string;
  topicSlug: string;
  topicTitle: string;
  sourceCount: number;
  refreshedAt: string;
};

type SearchResult = TopicResult | EntryResult;

type LibrarySearchResponse = {
  query: string;
  results: SearchResult[];
  total: number;
  nextCursor: string | null;
  clarification: {
    prompt: string;
    choices: Array<{ label: string; query: string }>;
  } | null;
  webResearch: {
    status: "unavailable" | "degraded";
    message: string;
  };
};

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  if (result.kind === "topic") {
    return (
      <article className="library-search-result library-search-result--topic">
        <MwmTopicIcon decorative size={28} topic={result.iconKey ?? "community"} />
        <div>
          <p className="library-search-result__type">Foundation</p>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
          <Link href={`/library/topics/${encodeURIComponent(result.slug)}`}>
            Explore this foundation
          </Link>
          <span className="library-search-result__meta">
            {result.entryCount} approved {result.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="library-search-result" id={`entry-${result.id}`}>
      <p className="library-search-result__type">Approved Library entry</p>
      <h2>{result.title}</h2>
      <p>{result.summary}</p>
      <div hidden={!expanded} id={detailsId}>
        {result.body.split(/\n\s*\n/).map((paragraph, index) => (
          <p className="library-search-result__body" key={`${result.id}-${index}`}>
            {paragraph}
          </p>
        ))}
      </div>
      <button
        aria-controls={detailsId}
        aria-expanded={expanded}
        className="library-search-result__toggle"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        {expanded ? "See Less" : "See More"}
      </button>
      <div className="library-search-result__footer">
        <Link href={`/library/topics/${encodeURIComponent(result.topicSlug)}#entry-${encodeURIComponent(result.id)}`}>
          {result.topicTitle}
        </Link>
        <span>
          {result.sourceCount} {result.sourceCount === 1 ? "source" : "sources"} · Reviewed {new Date(result.refreshedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      </div>
    </article>
  );
}

export function LibrarySearchPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const routeQuery = params.get("q")?.trim() ?? "";
  const [input, setInput] = useState(routeQuery);
  const [response, setResponse] = useState<LibrarySearchResponse | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    routeQuery ? "loading" : "idle",
  );
  const [, navigate] = useLocation();

  useEffect(() => {
    setInput(routeQuery);
    setResults([]);
    setResponse(null);
    if (!routeQuery) {
      setState("idle");
      return;
    }

    const controller = new AbortController();
    setState("loading");
    const query = new URLSearchParams({ q: routeQuery });
    fetch(`${BASE}/api/library/search?${query.toString()}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (request) => {
        const body = await request.json() as LibrarySearchResponse | { error?: string };
        if (!request.ok) {
          throw new Error("error" in body && body.error ? body.error : "LIBRARY_SEARCH_UNAVAILABLE");
        }
        return body as LibrarySearchResponse;
      })
      .then((body) => {
        setResponse(body);
        setResults(body.results);
        setState("ready");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setState("error");
      });

    return () => controller.abort();
  }, [routeQuery]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const query = input.trim();
    if (query) navigate(`/library/search?q=${encodeURIComponent(query)}`);
  }

  async function loadMore() {
    if (!response?.nextCursor) return;
    setState("loading");
    const query = new URLSearchParams({
      q: response.query,
      cursor: response.nextCursor,
    });
    try {
      const request = await fetch(`${BASE}/api/library/search?${query.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!request.ok) throw new Error("LIBRARY_SEARCH_UNAVAILABLE");
      const body = await request.json() as LibrarySearchResponse;
      setResults((current) => [...current, ...body.results]);
      setResponse(body);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="living-library-page library-search-page mwm-surface-dark">
      <section className="living-library-hero library-search-hero">
        <Link className="library-search-back" href="/library">← Living Library</Link>
        <p className="living-library-eyebrow">Internal Library search</p>
        <h1>Find trusted knowledge already in the Library.</h1>
        <p className="living-library-introduction">
          Search reviewed foundations and approved entries first. Live-web research is not used on this page.
        </p>
        <form className="living-library-search" onSubmit={submit}>
          <label className="sr-only" htmlFor="library-result-search">Search the Library</label>
          <input
            id="library-result-search"
            maxLength={120}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Try HVAC, apprenticeships, housing, or wellness"
            required
            type="search"
            value={input}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      <section aria-live="polite" className="living-library-content library-search-content">
        {state === "idle" && (
          <p className="living-library-state">Enter a term to search approved Library content.</p>
        )}
        {state === "loading" && results.length === 0 && (
          <p className="living-library-state">Searching the internal Library…</p>
        )}
        {state === "error" && (
          <p className="living-library-state living-library-state--error" role="alert">
            The Library search is temporarily unavailable. Please try again.
          </p>
        )}

        {response?.clarification && (
          <aside className="library-search-intents" aria-labelledby="library-search-intent-heading">
            <h2 id="library-search-intent-heading">{response.clarification.prompt}</h2>
            <p>Choose one to narrow the results, or keep browsing the matches below.</p>
            <div>
              {response.clarification.choices.map((choice) => (
                <button
                  key={choice.query}
                  onClick={() => navigate(`/library/search?q=${encodeURIComponent(choice.query)}`)}
                  type="button"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </aside>
        )}

        {state !== "idle" && response && (
          <div className="library-search-heading">
            <div>
              <p className="living-library-eyebrow">Approved internal matches</p>
              <h2>Results for “{response.query}”</h2>
            </div>
            <span>{response.total} {response.total === 1 ? "result" : "results"}</span>
          </div>
        )}

        {state === "ready" && response && results.length === 0 && (
          <div className="library-search-empty">
            <h2>No approved Library matches yet.</h2>
            <p>Try a broader term or browse the foundational topics. No live provider was called.</p>
            <Link href="/library">Browse Library foundations</Link>
          </div>
        )}

        {results.length > 0 && (
          <div className="library-search-results" aria-label="Library search results">
            {results.map((result) => <ResultCard key={`${result.kind}-${result.id}`} result={result} />)}
          </div>
        )}

        {response?.nextCursor && state !== "error" && (
          <button
            className="library-search-more"
            disabled={state === "loading"}
            onClick={() => void loadMore()}
            type="button"
          >
            {state === "loading" ? "Loading more…" : "Load more approved results"}
          </button>
        )}

        {response?.webResearch && (
          <p className="library-search-provider-note">{response.webResearch.message}</p>
        )}
      </section>
    </main>
  );
}
