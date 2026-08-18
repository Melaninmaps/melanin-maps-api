/**
 * City-Aware Nightlife Handler
 *
 * Runs BEFORE the generic location guard in the Kinfolk chat handler.
 * If a question contains a nightlife keyword, this module resolves the city
 * from the question and fetches verified directory listings directly.
 *
 * Key rule: only ask for a city when the member genuinely has not provided one.
 * "Charlotte NC night life" already has a city — never prompt again.
 */

import type { Pool } from "pg";

// ── Intent detection ────────────────────────────────────────────────────────

const NIGHTLIFE_PATTERN =
  /\b(night\s*-?\s*life|nightlife|bar s?|bars|club s?|clubs|late\s+night|lounge|lounges|after\s+dark|cocktail\s+bar|speakeasy|rooftop\s+bar|wine\s+bar)\b/i;

export function isNightlifeIntent(question: string): boolean {
  return NIGHTLIFE_PATTERN.test(question);
}

// ── Result types ────────────────────────────────────────────────────────────

export type NightlifeVenue = {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  description: string | null;
  address: string | null;
  city: string;
  neighborhood: string | null;
  website: string | null;
  isVerified: boolean;
  curationScore: number;
};

export type NightlifeAnswer = {
  locationNeeded: boolean;
  resolvedCity: string | null;
  resolvedState: string | null;
  venues: NightlifeVenue[];
  /** Deterministic fallback message — used when no answerWriter is present. */
  fallbackMessage: string;
};

// ── Emoji stripper — Kinfolk responses must not contain Unicode emoji ──────

export function stripAssistantEmoji(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F|\u200D/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Database query ─────────────────────────────────────────────────────────

const NIGHTLIFE_CATEGORY_SQL = `
  SELECT
    id,
    name,
    slug,
    category,
    description,
    address,
    city,
    neighborhood,
    website,
    is_verified,
    COALESCE(curation_score, 0) AS curation_score
  FROM businesses
  WHERE listing_status = 'approved'
    AND LOWER(city) = LOWER($1)
    AND (
      LOWER(category) IN ('nightlife', 'bars & nightlife', 'bar', 'lounge', 'club')
      OR LOWER(COALESCE(subcategory, '')) IN ('nightlife', 'bar', 'lounge', 'club', 'live music', 'cocktail bar')
      OR EXISTS (
        SELECT 1
        FROM unnest(COALESCE(tags, ARRAY[]::text[])) AS tag
        WHERE LOWER(tag) IN ('nightlife', 'bar', 'lounge', 'club', 'late-night', 'live music', 'cocktail bar', 'speakeasy')
      )
    )
  ORDER BY is_verified DESC, COALESCE(curation_score, 0) DESC, name ASC
  LIMIT $2
`;

async function fetchNightlifeVenues(
  city: string,
  pool: Pool,
  limit = 6,
): Promise<NightlifeVenue[]> {
  try {
    const { rows } = await pool.query(NIGHTLIFE_CATEGORY_SQL, [city, limit]);
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: r.slug ? String(r.slug) : null,
      category: String(r.category ?? "Nightlife"),
      description: r.description ? String(r.description) : null,
      address: r.address ? String(r.address) : null,
      city: String(r.city),
      neighborhood: r.neighborhood ? String(r.neighborhood) : null,
      website: r.website ? String(r.website) : null,
      isVerified: Boolean(r.is_verified),
      curationScore: Number(r.curation_score ?? 0),
    }));
  } catch (err) {
    console.error("[cityAwareNightlife] venue query failed", err);
    return [];
  }
}

// ── Retrieval signal logging ────────────────────────────────────────────────

async function recordRetrievalSignal(
  pool: Pool,
  {
    city,
    query,
    resultCount,
  }: { city: string | null; query: string; resultCount: number },
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO kinfolk_retrieval_events (intent, resolved_city, query, result_count, occurred_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ["nightlife", city, query.slice(0, 500), resultCount],
    );
  } catch {
    // Non-critical telemetry — never let this break the request
  }
}

// ── Deterministic fallback text ─────────────────────────────────────────────

function buildFallbackMessage(city: string, state: string | null, venues: NightlifeVenue[]): string {
  const location = state ? `${city}, ${state}` : city;
  if (venues.length === 0) {
    return (
      `For ${location} nightlife, the Mapping With Melanin directory doesn't yet have ` +
      `verified listings to recommend with confidence. Try the map view to explore community spots — ` +
      `or check back as more businesses are added by the community.`
    );
  }
  const names = venues
    .filter((v) => v.isVerified)
    .slice(0, 3)
    .map((v) => v.name);
  const unverified = venues.filter((v) => !v.isVerified).slice(0, 2).map((v) => v.name);
  let msg = `For nightlife in ${location}, here's what the Mapping With Melanin directory has:`;
  if (names.length > 0) {
    msg += `\n\nVerified spots: ${names.join(", ")}.`;
  }
  if (unverified.length > 0) {
    msg += `\n\nCommunity spots (not yet verified): ${unverified.join(", ")}.`;
  }
  msg += `\n\nOpen each listing for current hours and details before heading out.`;
  return msg;
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Resolve a city from a nightlife question and fetch directory listings.
 *
 * Returns `locationNeeded: true` when no city can be resolved — the caller
 * should ask the member which city they have in mind.
 *
 * @param resolvedCity - Already-resolved canonical city name from the chat handler
 *                       (via session or CITY_ALIASES extraction). Never null here
 *                       because the caller already confirmed it.
 * @param resolvedState - Optional state abbreviation from CITY_TO_STATE map.
 * @param question - Original member message (used for telemetry only).
 * @param pool - Live PostgreSQL pool from @workspace/db.
 */
export async function answerNightlifeFromDirectory(
  resolvedCity: string,
  resolvedState: string | null,
  question: string,
  pool: Pool,
): Promise<NightlifeAnswer> {
  const venues = await fetchNightlifeVenues(resolvedCity, pool);

  void recordRetrievalSignal(pool, {
    city: resolvedCity,
    query: question,
    resultCount: venues.length,
  });

  return {
    locationNeeded: false,
    resolvedCity,
    resolvedState,
    venues,
    fallbackMessage: buildFallbackMessage(resolvedCity, resolvedState, venues),
  };
}
