/**
 * Living Library — community knowledge that grows with every Kinfolk question.
 *
 * Routes:
 *   /library              → LibraryHomePage  (topic grid + search)
 *   /library/topics/:slug → LibraryTopicPage (entries + read more/less)
 *
 * Adapted for wouter (Link href=, useSearch, useParams, useLocation).
 * No react-router-dom dependencies.
 */
import { useEffect, useState } from "react";
import { Link, useSearch, useParams, useLocation } from "wouter";
import { GoldFeatherMark, GoldFeatherBadge } from "@/components/brand/GoldFeatherMark";

const BASE = import.meta.env.BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

type LibraryTopic = {
  id: string;
  slug: string;
  title: string;
  domain: string;
  isFollowed: boolean;
  entryCount: number;
  newestEntryAt: string | null;
};

type KnowledgeSource = {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  excerpt: string;
  sourceTier: "primary" | "public-service" | "community-expert";
};

type LibraryEntry = {
  id: string;
  title: string;
  summary: string;
  body: string;
  question: string;
  locationLabel: string | null;
  disclaimer: string | null;
  sourceCount: number;
  refreshedAt: string;
  sources: KnowledgeSource[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripMwmEmoji(value: string): string {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F|\u200D/g, "")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .trim();
}

const TIER_LABELS: Record<KnowledgeSource["sourceTier"], string> = {
  primary: "Primary source",
  "public-service": "Public-service source",
  "community-expert": "Community expert",
};

// ── Entry card (expandable) ───────────────────────────────────────────────────

function EntryCard({ entry }: { entry: LibraryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-6 shadow-sm"
      id={`entry-${entry.id}`}
    >
      {entry.locationLabel ? (
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#CA922B]/10 px-3 py-1 text-xs font-semibold text-[#8D5C17]">
          <GoldFeatherMark size={12} />
          {entry.locationLabel}
        </span>
      ) : null}
      <h3 className="mt-1 font-serif text-xl font-bold text-[#2B1507]">
        {stripMwmEmoji(entry.title)}
      </h3>
      <p className="mt-3 leading-7 text-[#3A1F0E]/80">{stripMwmEmoji(entry.summary)}</p>

      {expanded ? (
        <>
          <div className="prose prose-sm mt-4 max-w-none text-[#3A1F0E]">
            {entry.body.split("\n\n").map((para, i) => (
              <p className="mt-3 leading-7" key={i}>
                {stripMwmEmoji(para)}
              </p>
            ))}
          </div>
          {entry.disclaimer ? (
            <aside className="mt-4 rounded-xl border border-[#CA922B]/30 bg-[#CA922B]/[0.06] p-4 text-sm leading-6 text-[#3A1F0E]/75">
              <strong className="font-semibold text-[#2B1507]">Please note: </strong>
              {entry.disclaimer}
            </aside>
          ) : null}
          {entry.sources.length > 0 ? (
            <section className="mt-5" aria-label="Sources">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">
                <GoldFeatherMark size={14} />
                Sources
              </h4>
              <ul className="mt-2 space-y-2">
                {entry.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      className="text-sm font-semibold text-[#8D5C17] underline"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                    {source.publisher ? (
                      <span className="ml-2 text-xs text-[#3A1F0E]/50">{source.publisher}</span>
                    ) : null}
                    <span className="ml-2 text-xs italic text-[#3A1F0E]/40">
                      {TIER_LABELS[source.sourceTier]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <button
            className="mt-4 text-sm font-semibold text-[#8D5C17] underline"
            onClick={() => setExpanded(false)}
            type="button"
          >
            Read less
          </button>
        </>
      ) : (
        <button
          className="mt-3 text-sm font-semibold text-[#8D5C17] underline"
          onClick={() => setExpanded(true)}
          type="button"
        >
          Read the full source-cited entry
        </button>
      )}
      <p className="mt-3 text-xs text-[#3A1F0E]/40">
        Researched{" "}
        {new Date(entry.refreshedAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
        {entry.sourceCount > 0 ? ` · ${entry.sourceCount} source${entry.sourceCount !== 1 ? "s" : ""}` : ""}
      </p>
    </article>
  );
}

// ── Library Home ──────────────────────────────────────────────────────────────

export function LibraryHomePage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const query = params.get("q") ?? "";
  const [topics, setTopics] = useState<LibraryTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    setLoading(true);
    fetch(`${BASE}api/library/topics?${qs.toString()}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((payload: { topics?: LibraryTopic[] }) => setTopics(payload.topics ?? []))
      .catch((caught: unknown) => {
        const err = caught as { name?: string };
        if (err.name !== "AbortError") console.error("Unable to load Library topics", caught);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <GoldFeatherBadge label="Living Library" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#CA922B]">
            Living Library
          </p>
        </div>
        <h1 className="mt-4 font-serif text-4xl font-bold text-[#2B1507]">
          Knowledge that grows with the community
        </h1>
        <p className="mt-3 leading-7 text-[#3A1F0E]/75">
          Each topic is a living book built from source-cited Kinfolk research. Explore an existing
          book or ask Kinfolk a new question to add a verified entry.
        </p>
      </header>

      <form action="/library" className="mt-8 flex gap-3">
        <label className="sr-only" htmlFor="library-search">
          Search the Library
        </label>
        <input
          defaultValue={query}
          id="library-search"
          name="q"
          placeholder="Search topics and prior Kinfolk research"
          className="min-w-0 flex-1 rounded-xl border border-[#3A1F0E]/15 bg-white px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40"
        />
        <button
          className="rounded-xl bg-[#2B1507] px-5 py-3 font-semibold text-white hover:bg-[#3A1F0E]"
          type="submit"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="mt-12 text-center text-[#3A1F0E]/50">Loading topics…</div>
      ) : (
        <section aria-label="Library topics" className="mt-8 grid gap-4 sm:grid-cols-2">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/library/topics/${encodeURIComponent(topic.slug)}`}
                className="group rounded-2xl bg-[#2B1507] p-5 text-white transition hover:-translate-y-0.5 hover:bg-[#3A1F0E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA922B]"
              >
                <GoldFeatherMark label={`${topic.title} topic`} size={22} />
                <h2 className="mt-3 text-xl font-bold">{topic.title}</h2>
                <p className="mt-1 text-sm text-[#F5EBD8]/75">
                  {topic.entryCount} research{" "}
                  {topic.entryCount === 1 ? "entry" : "entries"}
                </p>
                {topic.isFollowed ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#CA922B]">
                    <GoldFeatherMark size={11} /> Following
                  </span>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="col-span-2 rounded-xl border border-dashed border-[#3A1F0E]/20 p-6 text-center text-[#3A1F0E]/60">
              {query
                ? `No Library topics matched "${query}". Try a broader term.`
                : "Library topics are being set up. Ask Kinfolk a research question to add the first entry."}
            </p>
          )}
        </section>
      )}
    </main>
  );
}

// ── Library Topic Page ────────────────────────────────────────────────────────

export function LibraryTopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState<LibraryTopic | null>(null);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BASE}api/library/topics/${encodeURIComponent(slug)}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) { navigate("/library"); return null; }
        return r.json();
      })
      .then((payload: { topic: LibraryTopic; entries: LibraryEntry[] } | null) => {
        if (!payload) return;
        setTopic(payload.topic);
        setEntries(payload.entries ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  async function setFollow(following: boolean) {
    if (!topic) return;
    const response = await fetch(`${BASE}api/library/topics/${topic.id}/follow`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following }),
    });
    if (response.ok) setTopic({ ...topic, isFollowed: following });
  }

  if (loading) {
    return <main className="p-10 text-center text-[#3A1F0E]/50">Loading this living book…</main>;
  }
  if (!topic) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link className="text-sm font-semibold text-[#8D5C17] underline" href="/library">
        ← All topics
      </Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <GoldFeatherBadge label={`${topic.title} living book`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#CA922B]">
              Living book
            </p>
            <h1 className="mt-1 font-serif text-4xl font-bold text-[#2B1507]">{topic.title}</h1>
          </div>
        </div>
        <button
          className="rounded-full border border-[#CA922B] px-4 py-2 font-semibold text-[#8D5C17] hover:bg-[#CA922B]/10"
          onClick={() => void setFollow(!topic.isFollowed)}
          type="button"
        >
          {topic.isFollowed ? "Following" : "Follow this topic"}
        </button>
      </header>

      <p className="mt-4 max-w-2xl leading-7 text-[#3A1F0E]/75">
        This book brings together source-cited Kinfolk research. New questions become new entries,
        including location-specific entries such as "STEM in Charlotte." The whole STEM book stays
        in one place — national guidance, Charlotte research, Atlanta research, and more.
      </p>

      <section
        aria-label={`${topic.title} research entries`}
        className="mt-8 space-y-5"
      >
        {entries.length > 0 ? (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        ) : (
          <p className="rounded-xl border border-dashed border-[#3A1F0E]/20 p-6 text-[#3A1F0E]/70">
            This book is ready for its first source-cited Kinfolk research entry. Ask Kinfolk about{" "}
            {topic.title.toLowerCase()} to add the first entry.
          </p>
        )}
      </section>
    </main>
  );
}

// ── Default export (home page, kept for backward-compat import) ───────────────
export default LibraryHomePage;
