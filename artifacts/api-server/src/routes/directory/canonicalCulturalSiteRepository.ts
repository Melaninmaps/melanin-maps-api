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

export class CanonicalCulturalSiteRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<CanonicalCulturalSite | null> {
    const { rows } = await this.pool.query<CanonicalCulturalSite>(
      `SELECT id, slug, name, description, city, state AS "stateCode",
              latitude, longitude, image_url AS "imageUrl",
              COALESCE(website_url, external_url) AS "learnMoreUrl"
       FROM cultural_sites
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Pick<CanonicalCulturalSite, "id" | "slug"> | null> {
    const { rows } = await this.pool.query<Pick<CanonicalCulturalSite, "id" | "slug">>(
      `SELECT id, slug FROM cultural_sites WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async listMapCards(cityId?: string) {
    // cityId filter is optional — when absent returns all geocoded sites.
    // Note: cultural_sites uses a city text column, not a city_id FK in production.
    const { rows } = await this.pool.query<CanonicalCulturalSite>(
      `SELECT id, slug, name, description, city, state AS "stateCode",
              latitude, longitude, image_url AS "imageUrl",
              COALESCE(website_url, external_url) AS "learnMoreUrl"
       FROM cultural_sites
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ORDER BY name ASC`,
    );
    return rows.map((site) => ({ ...site, detailUrl: canonicalCulturalSitePath(site) }));
  }
}
