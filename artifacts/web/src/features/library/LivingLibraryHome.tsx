/**
 * LivingLibraryHome — the Library landing page.
 *
 * Shows 8 foundational "Start Here" topic cards with gold-outline icons,
 * readable ivory hero copy, and an honest entry count (or "Explore this foundation"
 * when no entries have been added yet).
 *
 * Visual rules:
 *   • Hero text: #fffdf7 (ivory) — never inherits dark-brown or low-opacity color.
 *   • Supporting copy: #f1dfcc — always legible on the dark hero background.
 *   • Cards: warm-parchment background (#fffdf8) with amber hover border.
 */
import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { MwmTopicIcon } from "@/components/brand/MwmTopicIcon";
import "@/styles/mwm-topic-icons.css";
import "./living-library.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Topic = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconKey: string;
  isFeatured: boolean;
  sortOrder: number;
  entryCount: number;
};

const START_HERE = [
  "housing-home",
  "education-learning",
  "trades-skills-certifications",
  "health-wellness",
  "money-economic-mobility",
  "careers-professional-life",
  "business-entrepreneurship",
  "community-resources-help",
];

export function LivingLibraryHome() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${BASE}/api/library/foundation-topics?featured=true`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("TOPICS_UNAVAILABLE")),
      )
      .then((body: { topics: Topic[] }) => {
        setTopics(body.topics);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term) navigate(`/library/search?q=${encodeURIComponent(term)}`);
  }

  const featured = START_HERE.map((slug) =>
    topics.find((t) => t.slug === slug),
  ).filter(Boolean) as Topic[];

  return (
    <main className="living-library-page mwm-surface-dark">
      <section className="living-library-hero">
        <p className="living-library-eyebrow">Living Library</p>
        <h1>Knowledge that grows with the community.</h1>
        <p className="living-library-introduction">
          Begin with trusted foundations for the diaspora, then follow the connections
          that fit your life, location, goals, and community. Kinfolk adds new,
          source-cited knowledge as the Library grows.
        </p>
        <form className="living-library-search" onSubmit={search}>
          <label className="sr-only" htmlFor="library-search">
            Search the Library
          </label>
          <input
            id="library-search"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics and prior Kinfolk research"
            type="search"
            value={query}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      <section
        aria-labelledby="start-here-heading"
        className="living-library-content"
      >
        <div className="living-library-section-heading">
          <div>
            <p>Start here</p>
            <h2 id="start-here-heading">Foundations for everyday life and possibility</h2>
          </div>
          <Link href="/library/topics">Browse all foundations</Link>
        </div>

        {state === "loading" && (
          <p className="living-library-state">Preparing foundational topics…</p>
        )}
        {state === "error" && (
          <p className="living-library-state living-library-state--error">
            The Library topics are temporarily unavailable. Please try again.
          </p>
        )}
        {state === "ready" && (
          <div className="living-library-topic-grid">
            {featured.map((topic) => (
              <Link
                className="living-library-topic-card"
                href={`/library/topics/${topic.slug}`}
                key={topic.id}
              >
                <MwmTopicIcon decorative size={28} topic={topic.iconKey} />
                <div>
                  <h3>{topic.title}</h3>
                  <p>{topic.summary}</p>
                  <span>
                    {topic.entryCount
                      ? `${topic.entryCount} research ${topic.entryCount === 1 ? "entry" : "entries"}`
                      : "Explore this foundation"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
