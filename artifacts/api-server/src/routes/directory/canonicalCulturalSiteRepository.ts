import type { Pool } from "pg";

export type CanonicalCulturalSite = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  stateCode: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  learnMoreUrl: string | null;
};

export function canonicalCulturalSitePath(site: Pick<CanonicalCulturalSite, "id" | "slug">) {
  return `/cultural-sites/${encodeURIComponent(site.id)}/${encodeURIComponent(site.slug)}`;
}

const DERIVED_SLUG_SQL = `COALESCE(
  NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), ''),
  id::text
)`;

export class CanonicalCulturalSiteRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<CanonicalCulturalSite | null> {
    const { rows } = await this.pool.query<CanonicalCulturalSite>(
      `SELECT id, ${DERIVED_SLUG_SQL} AS slug, name, description, city, state AS "stateCode",
              latitude, longitude, image_url AS "imageUrl",
              external_url AS "learnMoreUrl"
       FROM cultural_sites
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Pick<CanonicalCulturalSite, "id" | "slug"> | null> {
    const { rows } = await this.pool.query<Pick<CanonicalCulturalSite, "id" | "slug">>(
      `SELECT id, ${DERIVED_SLUG_SQL} AS slug
       FROM cultural_sites
       WHERE ${DERIVED_SLUG_SQL} = $1
       LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async listMapCards(cityId?: string) {
    // cityId filter is optional — when absent returns all geocoded sites.
    // Note: cultural_sites uses a city text column, not a city_id FK in production.
    void cityId;
    const { rows } = await this.pool.query<CanonicalCulturalSite>(
      `SELECT id, ${DERIVED_SLUG_SQL} AS slug, name, description, city, state AS "stateCode",
              latitude, longitude, image_url AS "imageUrl",
              external_url AS "learnMoreUrl"
       FROM cultural_sites
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ORDER BY name ASC`,
    );
    return rows.map((site) => ({ ...site, detailUrl: canonicalCulturalSitePath(site) }));
  }
}
