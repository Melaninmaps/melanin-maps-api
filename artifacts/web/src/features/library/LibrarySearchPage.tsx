import { type FormEvent, useEffect, useId, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { MwmTopicIcon } from "@/components/brand/MwmTopicIcon";
import "@/styles/mwm-topic-icons.css";
import "./living-library.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type LibrarySourceLink = {
  url: string;
  title: string;
  publisher: string | null;
};

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
  sources: LibrarySourceLink[];
  refreshedAt: string;
};

type SearchResult = TopicResult | EntryResult;
type ProviderStatus = "not_needed" | "available" | "degraded" | "unavailable";

type LibrarySearchResponse = {
  query: string;
  results: SearchResult[];
  total: number;
  nextCursor: string | null;
  clarification: {
    prompt: string;
    choices: Array<{ label: string; query: string }>;
  } | null;
  webResearch: { status: ProviderStatus; message: string };
};

type ResearchAnswer = {
  id: string;
  title: string;
  summary: string;
  body: string;
  disclaimer: string | null;
  sourceCount: number;
  sources: Array<LibrarySourceLink & { retrievedAt: string; publishedAt: string | null }>;
  relatedQuestions: string[];
  refreshedAt: string;
  publicationStatus: "published" | "pending";
};

type LibraryResearchResponse = {
  answer: ResearchAnswer;
  origin: "internal" | "researched";
  reused: boolean;
  persisted: boolean;
  published: boolean;
  provider: { name: "internal" | "openai" | "tavily"; status: "available" | "degraded"; message: string };
};

type ResearchFailure = {
  code?: string;
  error?: string;
  retryable?: boolean;
  provider?: { name?: string; status?: ProviderStatus };
};

/** Only visible HTTPS links leave the app; unsafe schemes and credentials are rejected. */
export function safeLibrarySourceHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function formattedFreshness(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Freshness unavailable"
    : `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function SourceList({ sources }: { sources: LibrarySourceLink[] }) {
  const safeSources = sources
    .map((source) => ({ ...source, href: safeLibrarySourceHref(source.url) }))
    .filter((source): source is LibrarySourceLink & { href: string } => Boolean(source.href));
  if (safeSources.length === 0) return null;
  return (
    <ul className="library-research-sources" aria-label="Research sources">
      {safeSources.map((source) => (
        <li key={source.href}>
          <a href={source.href} rel="noopener noreferrer" target="_blank">
            {source.title}
          </a>
          {source.publisher ? <span>{source.publisher}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function ExpandableAnswer({
  title,
  summary,
  body,
  sourceCount,
  sources,
  refreshedAt,
  eyebrow,
  disclaimer,
  relatedQuestions = [],
  onRelated,
}: {
  title: string;
  summary: string;
  body: string;
  sourceCount: number;
  sources: LibrarySourceLink[];
  refreshedAt: string;
  eyebrow: string;
  disclaimer?: string | null;
  relatedQuestions?: string[];
  onRelated?: (question: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  return (
    <article className="library-search-result library-research-answer">
      <p className="library-search-result__type">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="library-research-overview">{summary}</p>
      <div hidden={!expanded} id={detailsId}>
        {body.split(/\n\s*\n/).map((paragraph, index) => (
          <p className="library-search-result__body" key={`${title}-${index}`}>{paragraph}</p>
        ))}
        {disclaimer ? <p className="library-research-disclaimer">{disclaimer}</p> : null}
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
      <SourceList sources={sources} />
      <div className="library-search-result__footer">
        <span>{sourceCount} {sourceCount === 1 ? "source" : "sources"}</span>
        <span>{formattedFreshness(refreshedAt)}</span>
      </div>
      {relatedQuestions.length > 0 ? (
        <aside className="library-research-branches" aria-label="Related questions">
          <h3>Related questions and branches</h3>
          <div>
            {relatedQuestions.map((question) => (
              <button key={question} onClick={() => onRelated?.(question)} type="button">{question}</button>
            ))}
          </div>
        </aside>
      ) : null}
    </article>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  if (result.kind === "topic") {
    return (
      <article className="library-search-result library-search-result--topic">
        <MwmTopicIcon decorative size={28} topic={result.iconKey ?? "community"} />
        <div>
          <p className="library-search-result__type">Foundation</p>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
          <Link href={`/library/topics/${encodeURIComponent(result.slug)}`}>Explore this foundation</Link>
          <span className="library-search-result__meta">
            {result.entryCount} approved {result.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      </article>
    );
  }
  return (
    <ExpandableAnswer
      body={result.body}
      eyebrow="Approved Library entry"
      refreshedAt={result.refreshedAt}
      sourceCount={result.sourceCount}
      sources={result.sources}
      summary={result.summary}
      title={result.title}
    />
  );
}

export function LibrarySearchPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const routeQuery = params.get("q")?.trim() ?? "";
  const [input, setInput] = useState(routeQuery);
  const [response, setResponse] = useState<LibrarySearchResponse | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [research, setResearch] = useState<LibraryResearchResponse | null>(null);
  const [researchFailure, setResearchFailure] = useState<ResearchFailure | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(routeQuery ? "loading" : "idle");
  const [researchState, setResearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [, navigate] = useLocation();

  useEffect(() => {
    setInput(routeQuery);
    setResults([]);
    setResponse(null);
    setResearch(null);
    setResearchFailure(null);
    setResearchState("idle");
    if (!routeQuery) { setState("idle"); return; }
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
        if (!request.ok) throw new Error("error" in body && body.error ? body.error : "LIBRARY_SEARCH_UNAVAILABLE");
        return body as LibrarySearchResponse;
      })
      .then((body) => { setResponse(body); setResults(body.results); setState("ready"); })
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

  async function researchCurrentQuestion() {
    if (!routeQuery || researchState === "loading") return;
    setResearchState("loading");
    setResearchFailure(null);
    try {
      const request = await fetch(`${BASE}/api/library/research`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ question: routeQuery, internalResultCount: response?.total ?? 0 }),
      });
      const body = await request.json() as LibraryResearchResponse | ResearchFailure;
      if (!request.ok || !("answer" in body)) {
        setResearchFailure(body as ResearchFailure);
        setResearchState("error");
        return;
      }
      setResearch(body);
      setResearchState("ready");
    } catch {
      setResearchFailure({
        code: "LIBRARY_RESEARCH_PROVIDER_UNAVAILABLE",
        error: "Live research is temporarily unavailable. Please retry.",
        retryable: true,
        provider: { name: "none", status: "unavailable" },
      });
      setResearchState("error");
    }
  }

  async function loadMore() {
    if (!response?.nextCursor) return;
    setState("loading");
    const query = new URLSearchParams({ q: response.query, cursor: response.nextCursor });
    try {
      const request = await fetch(`${BASE}/api/library/search?${query.toString()}`, { credentials: "include", headers: { Accept: "application/json" } });
      if (!request.ok) throw new Error("LIBRARY_SEARCH_UNAVAILABLE");
      const body = await request.json() as LibrarySearchResponse;
      setResults((current) => [...current, ...body.results]);
      setResponse(body);
      setState("ready");
    } catch { setState("error"); }
  }

  return (
    <main className="living-library-page library-search-page mwm-surface-dark">
      <section className="living-library-hero library-search-hero">
        <Link className="library-search-back" href="/library">← Living Library</Link>
        <p className="living-library-eyebrow">Diaspora-centered knowledge</p>
        <h1>Begin with what the Library knows. Research what it does not.</h1>
        <p className="living-library-introduction">
          Approved entries are reused first. When coverage is sparse, signed-in members can request current, source-cited research that remains pending review rather than auto-publishing.
        </p>
        <form className="living-library-search" onSubmit={submit}>
          <label className="sr-only" htmlFor="library-result-search">Search the Library</label>
          <input id="library-result-search" maxLength={120} onChange={(event) => setInput(event.target.value)} placeholder="Try HVAC, oldest bookstore in the US, or life after death" required type="search" value={input} />
          <button type="submit">Search</button>
        </form>
      </section>

      <section aria-live="polite" className="living-library-content library-search-content">
        {state === "idle" ? <p className="living-library-state">Ask a question or search approved Library knowledge.</p> : null}
        {state === "loading" && results.length === 0 ? <p className="living-library-state">Searching approved Library knowledge first…</p> : null}
        {state === "error" ? <p className="living-library-state living-library-state--error" role="alert">The Library index is temporarily unavailable. Please try again.</p> : null}

        {response?.clarification ? (
          <aside className="library-search-intents" aria-labelledby="library-search-intent-heading">
            <h2 id="library-search-intent-heading">{response.clarification.prompt}</h2>
            <p>Choose a branch to narrow the question, or continue below.</p>
            <div>{response.clarification.choices.map((choice) => <button key={choice.query} onClick={() => navigate(`/library/search?q=${encodeURIComponent(choice.query)}`)} type="button">{choice.label}</button>)}</div>
          </aside>
        ) : null}

        {state !== "idle" && response ? (
          <div className="library-search-heading">
            <div><p className="living-library-eyebrow">Approved internal matches</p><h2>Results for “{response.query}”</h2></div>
            <span>{response.total} {response.total === 1 ? "result" : "results"}</span>
          </div>
        ) : null}

        {results.length > 0 ? <div className="library-search-results" aria-label="Library search results">{results.map((result) => <ResultCard key={`${result.kind}-${result.id}`} result={result} />)}</div> : null}
        {response?.nextCursor && state !== "error" ? <button className="library-search-more" disabled={state === "loading"} onClick={() => void loadMore()} type="button">{state === "loading" ? "Loading more…" : "Load more approved results"}</button> : null}

        {state === "ready" && response && !research && response.webResearch.status !== "not_needed" ? (
          <section className="library-search-empty library-research-offer">
            <h2>No approved entry answers this yet.</h2>
            <p>{response.webResearch.message}</p>
            <button disabled={researchState === "loading"} onClick={() => void researchCurrentQuestion()} type="button">
              {researchState === "loading" ? "Researching current sources…" : "Research this question"}
            </button>
            <p className="library-research-governance">Live research is private to this response and saved only as a governed pending candidate—not approved Library content.</p>
          </section>
        ) : null}

        {research ? (
          <>
            <p className={`library-provider-status library-provider-status--${research.provider.status}`} role="status">{research.provider.message}</p>
            <ExpandableAnswer
              body={research.answer.body}
              disclaimer={research.answer.disclaimer}
              eyebrow={research.origin === "internal" ? "Approved Library entry" : "Current research · Pending review"}
              onRelated={(question) => navigate(`/library/search?q=${encodeURIComponent(question)}`)}
              refreshedAt={research.answer.refreshedAt}
              relatedQuestions={research.answer.relatedQuestions}
              sourceCount={research.answer.sourceCount}
              sources={research.answer.sources}
              summary={research.answer.summary}
              title={research.answer.title}
            />
          </>
        ) : null}

        {researchState === "error" && researchFailure ? (
          <section className="library-provider-error" role="alert">
            <h2>{researchFailure.code === "LIBRARY_RESEARCH_INSUFFICIENT_EVIDENCE" ? "Not enough reliable evidence yet" : "Live research is temporarily unavailable"}</h2>
            <p>{researchFailure.error}</p>
            {researchFailure.retryable ? <button onClick={() => void researchCurrentQuestion()} type="button">Retry research</button> : null}
            <p>Provider status: {researchFailure.provider?.status ?? "unavailable"}. This is not a zero-result Library answer.</p>
          </section>
        ) : null}

        {response?.webResearch ? <p className="library-search-provider-note">Research status: {response.webResearch.status.replace("_", " ")}.</p> : null}
      </section>
    </main>
  );
}
