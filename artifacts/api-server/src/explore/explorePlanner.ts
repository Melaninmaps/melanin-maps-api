import { pool } from "@workspace/db";

export type ExploreCandidate = {
  id: string;
  kind: "business" | "cultural-site" | "event" | "safety-note";
  title: string;
  description: string;
  detailUrl: string | null;
  relevanceScore: number;
};

export type ExplorePlan = {
  locationLabel: string | null;
  title: string;
  introduction: string;
  stops: ExploreCandidate[];
};

// ── City resolution from prompt ───────────────────────────────────────────────

async function resolveCityFromPrompt(prompt: string): Promise<{
  label: string;
  cityName: string;
} | null> {
  // Resolve against cities in MWM's database using the prompt text
  const { rows } = await pool.query<{ name: string; state_code: string }>(
    `SELECT name, state_code
     FROM cities
     WHERE $1 ILIKE '%' || LOWER(name) || '%'
       AND is_active = TRUE
     ORDER BY is_featured DESC, name ASC
     LIMIT 1`,
    [prompt.toLowerCase()],
  );
  if (!rows[0]) return null;
  return {
    label: `${rows[0].name}, ${rows[0].state_code}`,
    cityName: rows[0].name,
  };
}

// ── Candidate fetchers ────────────────────────────────────────────────────────

async function findBusinessCandidates(
  cityName: string | null,
  prompt: string,
  max: number,
): Promise<ExploreCandidate[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    description: string | null;
    slug: string | null;
    curation_score: number;
  }>(
    `SELECT id, name, description, slug, COALESCE(curation_score, 0) AS curation_score
     FROM businesses
     WHERE is_active = TRUE
       AND listing_status = 'approved'
       AND ($1::text IS NULL OR LOWER(city) = LOWER($1))
       AND (
         to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, ''))
         @@ plainto_tsquery('english', $2)
         OR LOWER(category) ILIKE '%' || LOWER($2) || '%'
       )
     ORDER BY curation_score DESC, name ASC
     LIMIT $3`,
    [cityName, prompt.slice(0, 200), max * 2],
  );
  return rows.slice(0, max).map((r) => ({
    id: r.id,
    kind: "business" as const,
    title: r.name,
    description: r.description?.slice(0, 200) ?? "Community business",
    detailUrl: r.slug ? `/businesses/${r.slug}` : `/businesses/${r.id}`,
    relevanceScore: Number(r.curation_score),
  }));
}

async function findCulturalSiteCandidates(
  cityName: string | null,
  max: number,
): Promise<ExploreCandidate[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    description: string | null;
    slug: string | null;
    is_featured: boolean;
  }>(
    `SELECT id, name, description, slug, is_featured
     FROM tour_cultural_sites
     WHERE is_active = TRUE
       AND ($1::text IS NULL OR LOWER(city) = LOWER($1))
     ORDER BY is_featured DESC, name ASC
     LIMIT $2`,
    [cityName, max],
  );
  return rows.map((r, i) => ({
    id: r.id,
    kind: "cultural-site" as const,
    title: r.name,
    description: r.description?.slice(0, 200) ?? "Cultural and historical site",
    detailUrl: r.slug ? `/cultural-sites/${r.id}/${r.slug}` : `/sites/${r.id}`,
    relevanceScore: r.is_featured ? 10 - i : 5 - i,
  }));
}

async function findEventCandidates(
  cityName: string | null,
  max: number,
): Promise<ExploreCandidate[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    description: string | null;
    start_date: Date | null;
  }>(
    `SELECT id, name, description, start_date
     FROM recurring_events
     WHERE is_active = TRUE
       AND ($1::text IS NULL OR LOWER(city) = LOWER($1))
       AND (start_date IS NULL OR start_date >= NOW())
     ORDER BY start_date ASC NULLS LAST
     LIMIT $2`,
    [cityName, max],
  );
  return rows.map((r, i) => ({
    id: r.id,
    kind: "event" as const,
    title: r.name,
    description: r.description?.slice(0, 200) ?? "Community event",
    detailUrl: null,
    relevanceScore: 8 - i,
  }));
}

// ── Main planner ─────────────────────────────────────────────────────────────

/**
 * Explore is intentionally limited to a few mixed stops. A complete list of
 * businesses belongs to the Business Directory, not this experience planner.
 */
export async function buildPurposefulExplorePlan(prompt: string): Promise<ExplorePlan> {
  const location = await resolveCityFromPrompt(prompt);
  const cityName = location?.cityName ?? null;

  const [businesses, culturalSites, events] = await Promise.all([
    findBusinessCandidates(cityName, prompt, 2),
    findCulturalSiteCandidates(cityName, 2),
    findEventCandidates(cityName, 2),
  ]);

  // Sequence: cultural grounding → community happening → business stops
  const stops: ExploreCandidate[] = [
    ...culturalSites.slice(0, 1),
    ...events.slice(0, 1),
    ...businesses.slice(0, 2),
  ];

  return {
    locationLabel: location?.label ?? null,
    title: location
      ? `A purposeful way to explore ${location.label}`
      : "A purposeful way to explore",
    introduction: location
      ? "This plan pairs a few relevant places and community experiences. Open any stop for verified details, and use the Business Directory when you need a comprehensive service search."
      : "Add a city or area to receive a location-specific plan. Until then, these are the strongest available discovery paths rather than a complete business list.",
    stops,
  };
}
