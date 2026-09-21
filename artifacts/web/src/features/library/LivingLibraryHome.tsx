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

const PRIMARY_LIBRARY_COLLECTIONS = [
  { slug: "culture-history-identity", title: "Culture, History & Identity", summary: "Diaspora histories, local Black history, HBCU traditions, heritage sites, language, family stories, and cultural movements.", iconKey: "landmark" },
  { slug: "food-music-culture", title: "Food, Music & Culture", summary: "Regional food traditions, African and Afro-Latino cuisines, books, film, fashion, art, music, and cultural celebrations.", iconKey: "music" },
  { slug: "travel-the-diaspora", title: "Travel the Diaspora", summary: "City orientation, cultural etiquette, travel preparation, multigenerational trips, and places that help people feel represented.", iconKey: "plane" },
  { slug: "money-business-ownership", title: "Money, Business & Ownership", summary: "Banking, credit, homeownership, investing, entrepreneurship, intellectual property, contracts, and generational wealth.", iconKey: "briefcase-business" },
  { slug: "health-wellness-care", title: "Health & Wellness", summary: "Culturally responsive care, reproductive health, mental wellness, nutrition, movement, hair and skin care, disability, and advocacy.", iconKey: "heart-pulse" },
  { slug: "education-careers", title: "Education & Careers", summary: "HBCUs, scholarships, trade schools, certifications, career pathways, technology skills, mentorship, and workplace growth.", iconKey: "graduation-cap" },
  { slug: "family-love-community", title: "Family, Love & Community", summary: "Parenting, relationships, faith, LGBTQ+ life, elder care, friendship, identity, and building community after moving.", iconKey: "users" },
  { slug: "entertainment-whats-happening", title: "Entertainment & What’s Happening", summary: "Festivals, homecomings, nightlife, concerts, exhibits, family activities, and community gatherings.", iconKey: "sparkles" },
  { slug: "life-in-your-city", title: "Life in Your City", summary: "Local history, cultural neighborhoods, organizations, traditions, practical orientation, and guides shaped by real life.", iconKey: "map-pin" },
  { slug: "technology-future", title: "Technology & the Future", summary: "AI, digital skills, online safety, Black innovators, technology careers, and tools for building businesses.", iconKey: "cpu" },
  { slug: "know-your-rights", title: "Know Your Rights", summary: "Clear, source-cited information about discrimination, consumer protection, education, healthcare, work, and public-space rights.", iconKey: "scale" },
  { slug: "resources-support", title: "Resources & Support", summary: "Housing, utility, food, recovery, and urgent resources remain easy to find without defining the Library’s opening identity.", iconKey: "lifebuoy" },
] as const;

export function LivingLibraryHome() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${BASE}/api/library/foundation-topics`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("TOPICS_UNAVAILABLE")),
      )
      .then(() => setState("ready"))
      .catch(() => setState("error"));
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
            {PRIMARY_LIBRARY_COLLECTIONS.map((collection) => (
              <Link
                className="living-library-topic-card"
                href={`/library/topics/${collection.slug}`}
                key={collection.title}
              >
                <MwmTopicIcon decorative size={28} topic={collection.iconKey} />
                <div>
                  <h3>{collection.title}</h3>
                  <p>{collection.summary}</p>
                  <span>Explore this collection</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
