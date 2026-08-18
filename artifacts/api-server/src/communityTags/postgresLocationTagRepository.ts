import type { Pool } from "pg";

export type LocationCommunityTag = {
  businessId: string;
  locationId: string;
  cityName: string;
  stateCode: string | null;
  neighborhoodName: string | null;
  tagSlug: string;
  tagName: string;
  category: string;
  recommendationScope: "experience" | "service" | "accessibility" | "safety" | "cultural_context";
  confirmedMemberCount: number;
  recentConfirmedMemberCount: number;
  confidence: number;
  lastConfirmedAt: Date | null;
};

export function createPostgresLocationTagRepository(db: Pick<Pool, "query">) {
  return {
    async listApprovedTags(input: {
      cityName: string;
      stateCode: string | null;
      neighborhoodName?: string | null;
      tagSlug?: string | null;
      limit?: number;
    }): Promise<LocationCommunityTag[]> {
      try {
        const { rows } = await db.query<{
          business_id: string;
          location_id: string;
          city_name: string;
          state_code: string | null;
          neighborhood_name: string | null;
          tag_slug: string;
          tag_name: string;
          category: string;
          recommendation_scope: LocationCommunityTag["recommendationScope"];
          confirmed_member_count: number;
          recent_confirmed_member_count: number;
          confidence: number;
          last_confirmed_at: Date | null;
        }>(
          `SELECT *
           FROM approved_location_community_tags
           WHERE LOWER(city_name) = LOWER($1)
             AND ($2::text IS NULL OR UPPER(state_code) = UPPER($2))
             AND ($3::text IS NULL OR LOWER(neighborhood_name) = LOWER($3))
             AND ($4::text IS NULL OR tag_slug = $4)
           ORDER BY confidence DESC, recent_confirmed_member_count DESC, confirmed_member_count DESC
           LIMIT $5`,
          [
            input.cityName,
            input.stateCode,
            input.neighborhoodName ?? null,
            input.tagSlug ?? null,
            Math.min(Math.max(input.limit ?? 25, 1), 100),
          ],
        );
        return rows.map((row) => ({
          businessId: row.business_id,
          locationId: row.location_id,
          cityName: row.city_name,
          stateCode: row.state_code,
          neighborhoodName: row.neighborhood_name,
          tagSlug: row.tag_slug,
          tagName: row.tag_name,
          category: row.category,
          recommendationScope: row.recommendation_scope,
          confirmedMemberCount: Number(row.confirmed_member_count),
          recentConfirmedMemberCount: Number(row.recent_confirmed_member_count),
          confidence: Number(row.confidence),
          lastConfirmedAt: row.last_confirmed_at,
        }));
      } catch (err) {
        // approved_location_community_tags view may not yet be populated — degrade gracefully
        const code = typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
        if (code === "42P01" || code === "42703") return [];
        throw err;
      }
    },
  };
}
