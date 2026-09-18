import type { Pool } from "pg";

export type CanonicalCulturalSite = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  heritageCategory: string | null;
  subcategory: string | null;
  culturalCommunity: string | null;
  visitTip: string | null;
  contentNote: string | null;
  pinType: string | null;
  listingStatus: string | null;
  era: string | null;
  significance: string | null;
  yearEstablished: number | null;
  city: string | null;
  stateCode: string | null;
  address: string | null;
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
      `SELECT id, ${DERIVED_SLUG_SQL} AS slug, name, description, category,
              heritage_category AS "heritageCategory", subcategory,
              cultural_community AS "culturalCommunity", visit_tip AS "visitTip",
              content_note AS "contentNote", pin_type AS "pinType",
              listing_status AS "listingStatus", era, significance,
              year_established AS "yearEstablished", city, state AS "stateCode",
              address, latitude, longitude, image_url AS "imageUrl",
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

  async listMapCards(city?: string, state?: string) {
    // cultural_sites stores city/state text rather than a city FK. Optional
    // filters make local map views locality-first while preserving explicit
    // all-area exploration for callers that omit them.
    const conditions = ["latitude IS NOT NULL", "longitude IS NOT NULL"];
    const params: string[] = [];
    if (city?.trim()) {
      params.push(city.trim());
      conditions.push(`LOWER(city) = LOWER($${params.length})`);
    }
    if (state?.trim()) {
      params.push(state.trim());
      conditions.push(`UPPER(state) = UPPER($${params.length})`);
    }
    const { rows } = await this.pool.query<CanonicalCulturalSite>(
      `SELECT id, ${DERIVED_SLUG_SQL} AS slug, name, description, category,
              heritage_category AS "heritageCategory", subcategory,
              cultural_community AS "culturalCommunity", visit_tip AS "visitTip",
              content_note AS "contentNote", pin_type AS "pinType",
              listing_status AS "listingStatus", era, significance,
              year_established AS "yearEstablished", city, state AS "stateCode",
              address, latitude, longitude, image_url AS "imageUrl",
              external_url AS "learnMoreUrl"
       FROM cultural_sites
       WHERE ${conditions.join(" AND ")}
       ORDER BY name ASC`,
      params,
    );
    return rows.map((site) => ({ ...site, detailUrl: canonicalCulturalSitePath(site) }));
  }
}
