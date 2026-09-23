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
import {
  governedLibraryResearchHref,
  loadLibraryResearchPathManifest,
  type LibraryResearchCollection,
} from "./libraryResearchPaths";
import "@/styles/mwm-topic-icons.css";
import "./living-library.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function LivingLibraryHome() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [collections, setCollections] = useState<LibraryResearchCollection[]>([]);
  const [, navigate] = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${BASE}/api/library/foundation-topics`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then((response) => response.ok
        ? response.json()
        : Promise.reject(new Error("TOPICS_UNAVAILABLE"))),
      loadLibraryResearchPathManifest(controller.signal),
    ])
      .then(([, manifest]) => {
        setCollections(manifest.collections);
        setState("ready");
      })
      .catch(() => setState("error"));
    return () => controller.abort();
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term) navigate(`/library/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <main className="living-library-page mwm-surface-dark">
      <section className="living-library-hero">
          <p className="living-library-eyebrow">The MWM Library</p>
          <h1>Our culture. Our knowledge. Our everyday lives.</h1>
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
            <p>Begin with our complete lives</p>
            <h2 id="start-here-heading">Culture, opportunity, wellness, and everyday life</h2>
          </div>
          <Link href="/library">Browse all foundations</Link>
        </div>

        {state === "loading" && (
          <p className="living-library-state">Preparing foundational topics…</p>
        )}
        {state === "error" && (
          <p className="living-library-state living-library-state--error">
            The Library topics are temporarily unavailable. Please try again.
          </p>
        )}
        {state !== "loading" && (
          <div className="living-library-topic-grid">
            {collections.map((collection) => (
              <Link
                className="living-library-topic-card"
                href={governedLibraryResearchHref(collection.defaultQuestion)}
                key={collection.title}
              >
                <MwmTopicIcon decorative size={28} topic={collection.iconKey} />
                <div>
                  <h3>{collection.title}</h3>
                  <p>{collection.summary}</p>
                  <span>Research this collection</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
