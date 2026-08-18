/**
 * PostgreSQL adapter for the Kinfolk hair-care recommendation repository.
 *
 * Adapted for MWM: businesses use `city TEXT` and `state TEXT` directly,
 * not a cities FK join. The care_provider_profiles + provider_community_signals
 * tables are created via startup migrations.
 */
import type { CareProvider, CommunitySignal, HairCareRepository } from "./types";

type Queryable = {
  query<T>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

type ProviderRow = {
  id: string;
  name: string;
  provider_type: CareProvider["providerType"];
  category: string;
  city: string | null;
  state: string | null;
  address: string | null;
  professional_verification: CareProvider["professionalVerification"];
  signals: CommunitySignal[] | null;
};

export function createPostgresHairCareRepository(db: Queryable): HairCareRepository {
  return {
    async findVerifiedCareProviders({ providerType, city, stateCode, limit }) {
      try {
        const { rows } = await db.query<ProviderRow>(
          `SELECT
            b.id,
            b.name,
            cpp.provider_type,
            COALESCE(b.category, 'Health & Wellness') AS category,
            b.city,
            COALESCE(b.state, b.country) AS state,
            b.address,
            cpp.professional_verification,
            COALESCE(
              json_agg(
                json_build_object(
                  'label', pcs.label,
                  'confirmedMemberCount', pcs.confirmed_member_count,
                  'recentConfirmedMemberCount', pcs.recent_confirmed_member_count,
                  'moderationStatus', pcs.moderation_status
                )
              ) FILTER (WHERE pcs.id IS NOT NULL),
              '[]'::json
            ) AS signals
          FROM businesses b
          JOIN care_provider_profiles cpp ON cpp.business_id = b.id
          LEFT JOIN provider_community_signals pcs ON pcs.business_id = b.id
          WHERE b.is_active = TRUE
            AND b.is_verified = TRUE
            AND cpp.provider_type = $1
            AND ($2::text IS NULL OR LOWER(b.city) = LOWER($2))
            AND ($3::text IS NULL OR UPPER(COALESCE(b.state, '')) = UPPER($3))
          GROUP BY b.id, cpp.provider_type, cpp.professional_verification
          ORDER BY COALESCE(b.curation_score, 0) DESC, b.name ASC
          LIMIT $4`,
          [providerType, city, stateCode, Math.min(Math.max(limit, 1), 25)],
        );
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          providerType: row.provider_type,
          category: row.category,
          city: row.city,
          stateCode: row.state,
          addressLine1: row.address,
          detailUrl: `/businesses/${encodeURIComponent(row.id)}`,
          isVerified: true,
          professionalVerification: row.professional_verification,
          communitySignals: (row.signals as CommunitySignal[]) ?? [],
          distanceMiles: null,
        }));
      } catch (err) {
        // care_provider_profiles table may be new — degrade gracefully
        console.error("[postgresHairCareRepository] query failed", err);
        return [];
      }
    },
  };
}

/** Simple member location repository using session-based city from Kinfolk context. */
export function createPostgresMemberLocationRepository(db: Queryable) {
  return {
    async getLocation(memberId: string): Promise<{ city: string | null; stateCode: string | null }> {
      try {
        const { rows } = await db.query<{ city: string | null; state_code: string | null }>(
          `SELECT c.name AS city, c.state_code
           FROM users u
           LEFT JOIN cities c ON c.id = u.home_city_id
           WHERE u.id = $1 LIMIT 1`,
          [memberId],
        );
        return { city: rows[0]?.city ?? null, stateCode: rows[0]?.state_code ?? null };
      } catch {
        return { city: null, stateCode: null };
      }
    },
  };
}
