/**
 * PostgreSQL adapters for the Kinfolk capability and consent layer.
 *
 * Adapted for MWM: businesses use `city TEXT` and `state TEXT` columns
 * directly; users table holds `kinfolk_tone`. City resolution for
 * member context returns null when home city is not yet set.
 */
import type {
  IntentResolution,
  LocalContextRepository,
  ProfessionalDirectoryRepository,
  ToneStyle,
} from "./types";

type Queryable = {
  query<T>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

type CapabilityTurnStore = {
  create(input: { memberId: string; intent: IntentResolution; expiresAt: Date }): Promise<{ id: string }>;
  find(input: { id: string; memberId: string }): Promise<{ intent: IntentResolution } | null>;
};

// ── Local context (place alias lookup) ───────────────────────────────────────

export function createPostgresLocalContextRepository(db: Queryable): LocalContextRepository {
  return {
    async resolvePlacePhrase({ phrase, memberCity, memberStateCode }) {
      if (!memberCity) return null;
      try {
        const { rows } = await db.query<{
          city: string;
          state_code: string;
          neighborhood: string | null;
          place_meaning: string;
          confidence: number;
        }>(
          `SELECT c.name AS city, c.state_code, lpa.neighborhood, lpa.place_meaning, lpa.confidence
           FROM local_place_aliases lpa
           JOIN cities c ON c.id = lpa.city_id
           WHERE LOWER(lpa.phrase) = LOWER($1)
             AND LOWER(c.name) = LOWER($2)
             AND ($3::text IS NULL OR UPPER(c.state_code) = UPPER($3))
           LIMIT 1`,
          [phrase, memberCity, memberStateCode],
        );
        const row = rows[0];
        return row
          ? {
              city: row.city,
              stateCode: row.state_code,
              neighborhood: row.neighborhood,
              placeMeaning: row.place_meaning,
              confidence: Number(row.confidence),
            }
          : null;
      } catch {
        // local_place_aliases table may not exist yet on first deploy; degrade gracefully
        return null;
      }
    },
  };
}

// ── Member context (tone preference + city) ───────────────────────────────────

export function createPostgresMemberContextRepository(db: Queryable) {
  return {
    async getContext(memberId: string): Promise<{
      preferredTone: ToneStyle | null;
      city: string | null;
      stateCode: string | null;
    }> {
      try {
        // MWM stores kinfolk_tone on users; city preference is managed separately.
        // Join cities if home_city_id exists, else fall back to null city.
        const { rows } = await db.query<{
          kinfolk_tone: ToneStyle | null;
          city: string | null;
          state_code: string | null;
        }>(
          `SELECT u.kinfolk_tone,
                  c.name AS city,
                  c.state_code
           FROM users u
           LEFT JOIN cities c ON c.id = u.home_city_id
           WHERE u.id = $1
           LIMIT 1`,
          [memberId],
        );
        const row = rows[0];
        return {
          preferredTone: row?.kinfolk_tone ?? "warm_standard",
          city: row?.city ?? null,
          stateCode: row?.state_code ?? null,
        };
      } catch {
        // home_city_id column may be absent; degrade gracefully
        return { preferredTone: "warm_standard", city: null, stateCode: null };
      }
    },
  };
}

// ── Professional directory (consent-gated) ────────────────────────────────────

export function createPostgresProfessionalDirectoryRepository(
  db: Queryable,
): ProfessionalDirectoryRepository {
  return {
    async findNearestVerifiedProfessionals({ professionalType, location, limit }) {
      const categoryTerms: Record<typeof professionalType, string[]> = {
        attorney: ["attorney", "lawyer", "legal", "law firm"],
        medical_professional: ["doctor", "physician", "medical", "clinic", "therapy", "mental health"],
        plumber: ["plumber", "plumbing"],
        business: [],
      };
      const terms = categoryTerms[professionalType];

      try {
        const { rows } = await db.query<{
          id: string;
          name: string;
          category: string;
          city: string | null;
          state: string | null;
          address: string | null;
        }>(
          `SELECT b.id, b.name, b.category, b.city,
                  COALESCE(b.state, b.country) AS state,
                  b.address
           FROM businesses b
           WHERE b.is_active = TRUE
             AND b.is_verified = TRUE
             AND b.listing_status = 'approved'
             AND ($1::text IS NULL OR LOWER(b.city) = LOWER($1))
             AND (
               cardinality($2::text[]) = 0
               OR LOWER(b.category) = ANY($2::text[])
               OR LOWER(COALESCE(b.subcategory, '')) = ANY($2::text[])
               OR EXISTS (
                 SELECT 1 FROM unnest(COALESCE(b.tags, ARRAY[]::text[])) tag
                 WHERE LOWER(tag) = ANY($2::text[])
               )
             )
           ORDER BY COALESCE(b.curation_score, 0) DESC, b.name ASC
           LIMIT $3`,
          [location.city, terms, Math.min(Math.max(limit, 1), 10)],
        );
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          city: row.city,
          stateCode: row.state,
          addressLine1: row.address,
          distanceMiles: null,
          detailUrl: `/businesses/${encodeURIComponent(row.id)}`,
          isVerified: true,
        }));
      } catch (err) {
        console.error("[postgresCapabilityStores] professional directory query failed", err);
        return [];
      }
    },
  };
}

// ── Consent turn store ────────────────────────────────────────────────────────

export function createPostgresCapabilityTurnStore(db: Queryable): CapabilityTurnStore {
  return {
    async create({ memberId, intent, expiresAt }) {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO kinfolk_capability_turns (member_id, intent, expires_at)
         VALUES ($1, $2::jsonb, $3)
         RETURNING id`,
        [memberId, JSON.stringify(intent), expiresAt],
      );
      return { id: rows[0].id };
    },
    async find({ id, memberId }) {
      const { rows } = await db.query<{ intent: IntentResolution }>(
        `SELECT intent
         FROM kinfolk_capability_turns
         WHERE id = $1 AND member_id = $2 AND expires_at > NOW()
         LIMIT 1`,
        [id, memberId],
      );
      return rows[0] ? { intent: rows[0].intent } : null;
    },
  };
}
