import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { MwmTopicIcon } from "@/components/brand/MwmTopicIcon";
import { safeLibrarySourceHref } from "./librarySourceUrl";
import "@/styles/mwm-topic-icons.css";
import "./living-library.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type LibrarySourceLink = {
  url: string;
  title: string;
  publisher: string | null;
  whyItMatters?: string | null;
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
  researchLenses: string[];
  sourceCount: number;
  sources: LibrarySourceLink[];
  refreshedAt: string;
};

type SearchResult = TopicResult | EntryResult;
type ProviderStatus = "not_needed" | "available" | "degraded" | "unavailable";

type LibrarySearchResponse = {
  query: string;
  researchLenses: Array<{ tag: string; label: string }>;
  results: SearchResult[];
  total: number;
  nextCursor: string | null;
  searchClarification: {
    kind: "possible_spelling";
    suggestedQuery: string;
    prompt: string;
    source: "returned_catalog_term";
  } | null;
  clarification: {
    prompt: string;
    choices: Array<{ label: string; query: string }>;
  } | null;
  webResearch: { status: ProviderStatus; message: string };
  libraryPurposeConsent?: LibraryPurposeConsent;
};

type LibraryPurposeConsent = {
  granted: boolean;
  purpose: "library_saved_context";
  controlsSavedContextAugmentation: true;
  controlsRankingPersonalization: true;
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

type LibraryResearchScope = {
  domain: "medical" | "legal" | "financial" | "education" | "stem" | "history" | "general";
  sourceStandard: string;
  requestedGroup: string | null;
  groupGuidance: string;
  researchLenses: Array<{ tag: string; label: string }>;
  connectedTopics: Array<{ label: string; href: string }>;
};

type LibraryResearchResponse = {
  answer: ResearchAnswer;
  /** General current information for any reader; mirrors answer for compatibility. */
  foundation?: ResearchAnswer;
  communityContext?: {
    status: "available" | "insufficient" | "operational_failure";
    researchLenses: string[];
    answer?: ResearchAnswer;
    message: string;
    providerStatus: "available" | "degraded" | "unavailable";
    retryable: boolean;
  };
  origin: "internal" | "researched";
  reused: boolean;
  persisted: boolean;
  published: boolean;
  provider: { name: "internal" | "openai" | "tavily"; status: "available" | "degraded"; message: string };
  researchScope: LibraryResearchScope;
  memberContextApplied?: string[];
  libraryPurposeConsent?: LibraryPurposeConsent;
};

type ResearchFailure = {
  code?: string;
  error?: string;
  retryable?: boolean;
  provider?: { name?: string; status?: ProviderStatus };
  researchScope?: LibraryResearchScope;
  libraryPurposeConsent?: LibraryPurposeConsent;
};

const RESEARCH_LENS_OPTIONS = [
  { tag: "#Diaspora", label: "Diaspora" },
  { tag: "#BlackWomen", label: "Black women" },
  { tag: "#BlackMen", label: "Black men & boys" },
  { tag: "#BlackStudents", label: "Black students" },
  { tag: "#HBCUStudents", label: "HBCU students & alumni" },
] as const;

function hasResearchLens(question: string, tag: string): boolean {
  return new RegExp(`(?:^|\\s)${tag.replace("#", "\\#")}\\b`, "i").test(question.normalize("NFKC"));
}

function toggleResearchLens(question: string, tag: string): string {
  const tagPattern = new RegExp(`(?:^|\\s)${tag.replace("#", "\\#")}\\b`, "ig");
  if (hasResearchLens(question, tag)) return question.replace(tagPattern, " ").replace(/\s+/g, " ").trim();
  return `${tag} ${question}`.replace(/\s+/g, " ").trim();
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
    <section className="library-research-source-section" aria-label="Research sources">
      <h3>Sources</h3>
      <ul className="library-research-sources">
        {safeSources.map((source) => (
          <li key={source.href}>
            <a href={source.href} rel="noopener noreferrer" target="_blank">
              {source.title}
            </a>
            {source.publisher ? <span>{source.publisher}</span> : null}
            {source.whyItMatters ? <p className="library-research-source-reason">Why it matters: {source.whyItMatters}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResearchBody({ body, title }: { body: string; title: string }) {
  return (
    <div className="library-research-body">
      {body.split(/\n\s*\n/).map((paragraph, index) => {
        const heading = paragraph.match(/^##\s+(.+)$/);
        return heading ? (
          <h3 key={`${title}-${index}`}>{heading[1]}</h3>
        ) : (
          <p className="library-search-result__body" key={`${title}-${index}`}>{paragraph}</p>
        );
      })}
    </div>
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
  researchScope,
  researchTrack = "foundation",
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
  researchScope?: LibraryResearchScope;
  researchTrack?: "foundation" | "community";
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  return (
    <article className="library-search-result library-research-answer">
      <p className="library-search-result__type">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="library-research-overview">{summary}</p>
      <div hidden={!expanded} id={detailsId}>
        <ResearchBody body={body} title={title} />
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
      {researchScope ? (
        <aside className="library-research-scope" aria-label="Research scope">
          <h3>{researchTrack === "foundation" ? "How the current foundation was researched" : "How this was researched"}</h3>
          {researchTrack === "foundation" ? (
            <p><strong>Current foundation:</strong> Current, authoritative information for any reader. An explicit community lens is researched and shown separately, never substituted for this answer.</p>
          ) : (
            <p><strong>Research lens:</strong> {researchScope.researchLenses.map((lens) => lens.tag).join(" ")}</p>
          )}
          <p><strong>Source standard:</strong> {researchScope.sourceStandard}</p>
          <p>{researchScope.groupGuidance}</p>
          {researchScope.connectedTopics.length > 0 ? (
            <div className="library-research-topic-links">
              <strong>Connected Library topics:</strong>
              {researchScope.connectedTopics.map((topic) => <Link href={topic.href} key={topic.href}>{topic.label}</Link>)}
            </div>
          ) : null}
        </aside>
      ) : null}
      <SourceList sources={sources} />
      <div className="library-search-result__footer">
        <span>{sourceCount} {sourceCount === 1 ? "source" : "sources"}</span>
        <span>{formattedFreshness(refreshedAt)}</span>
      </div>
      {relatedQuestions.length > 0 ? (
        <aside className="library-research-branches" aria-label="Related questions">
          <h3>Related questions and branches</h3>
          <p>People also explore these evidence-led next questions.</p>
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
  const researchOnOpen = params.get("research") === "true";
  const [input, setInput] = useState(routeQuery);
  const [response, setResponse] = useState<LibrarySearchResponse | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [research, setResearch] = useState<LibraryResearchResponse | null>(null);
  const [researchFailure, setResearchFailure] = useState<ResearchFailure | null>(null);
  const [contextConsent, setContextConsent] = useState<LibraryPurposeConsent | null>(null);
  const [contextConsentState, setContextConsentState] = useState<"idle" | "saving" | "error">("idle");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(routeQuery ? "loading" : "idle");
  const [researchState, setResearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [, navigate] = useLocation();
  const activeResearchLensTags = RESEARCH_LENS_OPTIONS.filter((lens) => hasResearchLens(input, lens.tag)).map((lens) => lens.tag);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BASE}/api/library/context-consent`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (request) => {
        if (request.status === 401) return null;
        if (!request.ok) throw new Error("LIBRARY_CONSENT_UNAVAILABLE");
        return request.json() as Promise<LibraryPurposeConsent>;
      })
      .then((consent) => setContextConsent(consent))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setContextConsentState("error");
      });
    return () => controller.abort();
  }, []);

  const updateContextConsent = useCallback(async (granted: boolean) => {
    if (!contextConsent || contextConsentState === "saving") return;
    setContextConsentState("saving");
    try {
      const request = await fetch(`${BASE}/api/library/context-consent`, {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ granted }),
      });
      const body = await request.json() as LibraryPurposeConsent | { error?: string };
      if (!request.ok || !("granted" in body)) throw new Error("LIBRARY_CONSENT_UPDATE_FAILED");
      setContextConsent(body);
      setContextConsentState("idle");
      // Ranking changes only after explicit consent changes; rerun the current
      // approved-index search rather than silently mutating visible ordering.
      if (routeQuery) navigate(`/library/search?q=${encodeURIComponent(routeQuery)}`);
    } catch {
      setContextConsentState("error");
    }
  }, [contextConsent, contextConsentState, navigate, routeQuery]);

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

  const researchCurrentQuestion = useCallback(async () => {
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
  }, [researchState, response?.total, routeQuery]);

  useEffect(() => {
    if (!routeQuery || state !== "ready" || !response || research || researchState !== "idle") return;
    // A close spelling correction is a member choice, not an automatic rewrite.
    // Do not spend a source-governed research request until that choice is made.
    if (response.searchClarification) return;
    const hasPublishedEntry = results.some((result) => result.kind === "entry");
    if (!researchOnOpen && (hasPublishedEntry || response.webResearch.status === "not_needed")) return;
    // A new general Library question does the source-governed work on its first
    // search. The server, not the client, decides whether it is reusable.
    void researchCurrentQuestion();
  }, [research, researchCurrentQuestion, researchOnOpen, researchState, response, results, routeQuery, state]);

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
        <h1>Begin with what the Library knows. Research the next right question.</h1>
        <p className="living-library-introduction">
          Search approved Library knowledge first. When coverage is sparse, request a source-governed brief with a current foundation for everyone and, when selected, a separately labeled community-evidence packet.
        </p>
          <form className="living-library-search" onSubmit={submit}>
          <label className="sr-only" htmlFor="library-result-search">Search the Library</label>
          <input id="library-result-search" maxLength={120} onChange={(event) => setInput(event.target.value)} placeholder="Try HVAC, oldest bookstore in the US, or life after death" required type="search" value={input} />
            <button type="submit">Search</button>
          </form>
          <div className="library-research-lens-filter" aria-label="Library research lens">
            <p>Choose community evidence to add alongside the current foundation. A lens is not saved as your identity.</p>
            <div role="group" aria-label="Research lens choices">
              {RESEARCH_LENS_OPTIONS.map((lens) => {
                const selected = activeResearchLensTags.includes(lens.tag);
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "is-selected" : undefined}
                    key={lens.tag}
                    onClick={() => setInput((current) => toggleResearchLens(current, lens.tag))}
                    type="button"
                  >
                    {lens.label}
                  </button>
                );
              })}
            </div>
          </div>
          {contextConsent ? (
            <label className="library-context-consent">
              <input
                checked={contextConsent.granted}
                disabled={contextConsentState === "saving"}
                onChange={(event) => void updateContextConsent(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>
                <strong>Use my saved context for the Library</strong>
                <small>This one revocable choice controls both optional saved-context community supplements and result ranking. It never changes the general foundation or asserts your identity.</small>
              </span>
            </label>
          ) : null}
          {contextConsentState === "error" ? <p className="library-context-consent-error" role="alert">Library context consent could not be updated. Your current setting is unchanged.</p> : null}
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

        {response?.searchClarification ? (
          <aside className="library-search-intents" aria-live="polite">
            <h2>Possible spelling correction</h2>
            <p>Choose this only if it matches what you meant. The Library will not assume a different topic.</p>
            <div>
              <button onClick={() => navigate(`/library/search?q=${encodeURIComponent(response.searchClarification!.suggestedQuery)}`)} type="button">
                {response.searchClarification.prompt}
              </button>
            </div>
          </aside>
        ) : null}

        {state !== "idle" && response ? (
          <div className="library-search-heading">
            <div>
              <p className="living-library-eyebrow">Approved internal matches</p>
              <h2>Results for “{response.query}”</h2>
              <p className="library-search-provider-note">Research lens: {response.researchLenses.map((lens) => lens.tag).join(" ")}. This scope guides evidence; it does not describe the reader.</p>
            </div>
            <span>{response.total} {response.total === 1 ? "result" : "results"}</span>
          </div>
        ) : null}

        {results.length > 0 ? <div className="library-search-results" aria-label="Library search results">{results.map((result) => <ResultCard key={`${result.kind}-${result.id}`} result={result} />)}</div> : null}
        {response?.nextCursor && state !== "error" ? <button className="library-search-more" disabled={state === "loading"} onClick={() => void loadMore()} type="button">{state === "loading" ? "Loading more…" : "Load more approved results"}</button> : null}

        {state === "ready" && response && !research && !response.searchClarification && response.webResearch.status !== "not_needed" ? (
          <section className="library-search-empty library-research-offer">
            <h2>{researchState === "loading" ? "Researching this question from vetted sources…" : "No approved entry answers this yet."}</h2>
            <p>{researchState === "loading" ? "The first search takes a little longer because the Library is gathering, checking, and summarizing sources before it offers related next questions." : `${response.webResearch.message} Reputable sources depend on the topic: medical research uses clinical and public-health authorities; financial research uses regulators and economic research; other topics use their appropriate public-interest, academic, or archival sources.`}</p>
            <button disabled={researchState === "loading"} onClick={() => void researchCurrentQuestion()} type="button">
              {researchState === "loading" ? "Building your research brief…" : "Research vetted sources"}
            </button>
            <p className="library-research-governance">A general question that clears the source, citation, and provider-health gate becomes a reusable Library brief. Member-specific questions remain private.</p>
          </section>
        ) : null}

        {research ? (
          <>
            <p className={`library-provider-status library-provider-status--${research.provider.status}`} role="status">{research.provider.message}</p>
            {research.memberContextApplied?.length ? (
              <p className="library-search-provider-note">
                <strong>Private default context:</strong> {research.memberContextApplied.join(" ")} was added because the signed-in member chose it in Kinfolk setup. The foundation remains general; “general only” or “this is for a friend” overrides it.
              </p>
            ) : null}
            <ExpandableAnswer
              body={(research.foundation ?? research.answer).body}
              disclaimer={(research.foundation ?? research.answer).disclaimer}
              eyebrow={research.origin === "internal" || research.published ? "Current foundation · Source-governed Library entry" : "Current foundation · Private response"}
              onRelated={(question) => navigate(`/library/search?q=${encodeURIComponent(`${research.researchScope.researchLenses.map((lens) => lens.tag).join(" ")} ${question}`.trim())}`)}
              refreshedAt={(research.foundation ?? research.answer).refreshedAt}
              relatedQuestions={(research.foundation ?? research.answer).relatedQuestions}
              researchScope={research.researchScope}
              researchTrack="foundation"
              sourceCount={(research.foundation ?? research.answer).sourceCount}
              sources={(research.foundation ?? research.answer).sources}
              summary={(research.foundation ?? research.answer).summary}
              title={(research.foundation ?? research.answer).title}
            />
            {research.communityContext?.status === "available" && research.communityContext.answer ? (
              <section className="library-search-results" aria-label="Community-specific research context">
                <p className="living-library-eyebrow">Community context: {research.communityContext.researchLenses.join(" ")}</p>
                <p className="library-search-provider-note">{research.communityContext.message}</p>
                <ExpandableAnswer
                  body={research.communityContext.answer.body}
                  disclaimer={research.communityContext.answer.disclaimer}
                  eyebrow="Directly evidenced community packet"
                  onRelated={(question) => navigate(`/library/search?q=${encodeURIComponent(`${research.communityContext!.researchLenses.join(" ")} ${question}`.trim())}`)}
                  refreshedAt={research.communityContext.answer.refreshedAt}
                  relatedQuestions={research.communityContext.answer.relatedQuestions}
                  researchScope={research.researchScope}
                  researchTrack="community"
                  sourceCount={research.communityContext.answer.sourceCount}
                  sources={research.communityContext.answer.sources}
                  summary={research.communityContext.answer.summary}
                  title={research.communityContext.answer.title}
                />
              </section>
            ) : research.communityContext ? (
              <section className={research.communityContext.status === "operational_failure" ? "library-provider-error" : "library-community-insufficient"} aria-live="polite">
                <h2>{research.communityContext.status === "operational_failure" ? "Community research service is temporarily unavailable" : "Community evidence is insufficient for now"}</h2>
                <p>{research.communityContext.message}</p>
                <p>The current foundation remains complete and separately sourced above.</p>
                {research.communityContext.retryable ? <button onClick={() => void researchCurrentQuestion()} type="button">Retry community research</button> : null}
              </section>
            ) : null}
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
