import type {
  Business,
  CulturalSite,
  DirectoryRepository,
  DirectorySearchSignal,
  OnlineBookstore,
} from "./types";

/** Compatible with `pg.Pool`, a Replit PostgreSQL client, or an existing DB wrapper. */
type Queryable = {
  query<T>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  website_url: string | null;
  is_active: boolean;
};

type OnlineBookstoreRow = {
  id: string;
  name: string;
  url: string;
  description: string;
  priority: number;
  is_verified: boolean;
};

type CulturalSiteRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  summary: string | null;
  description: string | null;
  image_url: string | null;
  website_url: string | null;
  is_published: boolean;
};

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    tags: row.tags,
    latitude: row.latitude,
    longitude: row.longitude,
    addressLine1: row.address_line_1,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    websiteUrl: row.website_url,
    isActive: row.is_active,
  };
}

function mapOnlineBookstore(row: OnlineBookstoreRow): OnlineBookstore {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    priority: row.priority,
    isVerified: row.is_verified,
  };
}

function mapCulturalSite(row: CulturalSiteRow): CulturalSite {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    state: row.state,
    summary: row.summary,
    description: row.description,
    imageUrl: row.image_url,
    websiteUrl: row.website_url,
    isPublished: row.is_published,
  };
}

export function createPostgresDirectoryRepository(db: Queryable): DirectoryRepository {
  return {
    async findActiveBookstores(): Promise<Business[]> {
      const { rows } = await db.query<BusinessRow>(`
        SELECT
          id, name, slug, category, subcategory, description, tags,
          latitude, longitude, address_line_1, city, state, postal_code,
          website_url, is_active
        FROM businesses
        WHERE is_active = TRUE
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
      `);
      return rows.map(mapBusiness);
    },

    async findVerifiedOnlineBookstores(): Promise<OnlineBookstore[]> {
      const { rows } = await db.query<OnlineBookstoreRow>(`
        SELECT id, name, url, description, priority, is_verified
        FROM online_bookstores
        WHERE is_verified = TRUE
        ORDER BY priority ASC, name ASC
      `);
      return rows.map(mapOnlineBookstore);
    },

    async recordDirectorySearchSignal(signal: DirectorySearchSignal): Promise<void> {
      await db.query(
        `INSERT INTO directory_search_signals (
          intent, normalized_query, outcome, location_cell,
          nearest_distance_miles, nearby_result_count, radius_miles, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          signal.intent,
          signal.normalizedQuery,
          signal.outcome,
          signal.locationCell,
          signal.nearestDistanceMiles,
          signal.nearbyResultCount,
          signal.radiusMiles,
          signal.occurredAt,
        ],
      );
    },

    async findPublishedCulturalSiteById(id: string): Promise<CulturalSite | null> {
      const { rows } = await db.query<CulturalSiteRow>(
        `SELECT
          id, slug, name, city, state, summary, description,
          image_url, website_url, is_published
        FROM cultural_sites
        WHERE id = $1 AND is_published = TRUE
        LIMIT 1`,
        [id],
      );
      return rows[0] ? mapCulturalSite(rows[0]) : null;
    },
  };
}
