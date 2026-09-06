import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { ATLANTA_HBCU_SEED } from "./atlantaHbcuSeed";

export const UNIVERSAL_MAP_ENTITY_KINDS = [
  "cultural_site",
  "hbcu",
  "festival",
  "community_event",
  "market",
  "public_art",
  "heritage_marker",
  "travel_destination",
] as const;

export type UniversalMapEntityKind = (typeof UNIVERSAL_MAP_ENTITY_KINDS)[number];

type EntityInput = {
  id: string;
  entityKind: UniversalMapEntityKind;
  title: string;
  slug: string;
  summary: string | null;
  addressLine1: string | null;
  city: string;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  sourceRecordId: string | null;
};

type SourceRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string;
  state: string | null;
  country: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  website?: string | null;
  category?: string | null;
  site_type?: string | null;
  official_url?: string | null;
  accreditation_source_url?: string | null;
};

function coordinate(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type Logger = {
  log: (message: string) => void;
  warn: (message: string) => void;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ATLANTA_HBCU_SLUGS = new Map(
  ATLANTA_HBCU_SEED.map((item) => [item.title.toLowerCase(), item.slug]),
);

function stableUuid(namespace: string): string {
  const hex = createHash("sha1").update(namespace).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function validCoordinates(latitude: unknown, longitude: unknown): { latitude: number; longitude: number } | null {
  const lat = typeof latitude === "number" ? latitude : Number(latitude);
  const lng = typeof longitude === "number" ? longitude : Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function classifyCulturalEntity(siteType: string | null | undefined, title: string): UniversalMapEntityKind {
  const text = `${siteType ?? ""} ${title}`.toLowerCase();
  if (/\bhbcu\b|historically black college/.test(text)) return "hbcu";
  if (/market|farmers/.test(text)) return "market";
  if (/festival|celebration|carnival/.test(text)) return "festival";
  if (/mural|public art|sculpture|artwork/.test(text)) return "public_art";
  if (/marker|memorial|monument/.test(text)) return "heritage_marker";
  return "cultural_site";
}

function classifyEvent(category: string | null | undefined, title: string): UniversalMapEntityKind {
  const text = `${category ?? ""} ${title}`.toLowerCase();
  if (/market|farmers/.test(text)) return "market";
  if (/festival|celebration|carnival/.test(text)) return "festival";
  if (/mural|public art/.test(text)) return "public_art";
  return "community_event";
}

function countryCode(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : "US";
}

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.map_entities (
      id UUID PRIMARY KEY,
      entity_kind TEXT NOT NULL CHECK (entity_kind IN ('cultural_site','hbcu','festival','community_event','market','public_art','heritage_marker','travel_destination')),
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      summary TEXT,
      address_line1 TEXT,
      city TEXT NOT NULL,
      state_region TEXT,
      postal_code TEXT,
      country_code CHAR(2) NOT NULL DEFAULT 'US',
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      website_url TEXT,
      source_url TEXT,
      source_label TEXT,
      source_record_id UUID,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      geocode_status TEXT NOT NULL DEFAULT 'queued' CHECK (geocode_status IN ('queued','resolved','failed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (entity_kind, slug),
      CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
    )
  `);
  await pool.query(`
    DO $migration$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid='public.map_entities'::regclass
          AND conname='map_entities_entity_kind_check'
          AND pg_get_constraintdef(oid) LIKE '%travel_destination%'
      ) THEN
        ALTER TABLE public.map_entities DROP CONSTRAINT IF EXISTS map_entities_entity_kind_check;
        ALTER TABLE public.map_entities ADD CONSTRAINT map_entities_entity_kind_check
          CHECK (entity_kind IN ('cultural_site','hbcu','festival','community_event','market','public_art','heritage_marker','travel_destination'));
      END IF;
    END
    $migration$;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.map_entity_aliases (
      entity_id UUID NOT NULL REFERENCES public.map_entities(id) ON DELETE CASCADE,
      legacy_kind TEXT NOT NULL,
      legacy_slug TEXT NOT NULL,
      legacy_id UUID,
      PRIMARY KEY (entity_id, legacy_kind, legacy_slug)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS map_entities_browse_idx
      ON public.map_entities(entity_kind, city, state_region, published)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS map_entities_coordinates_idx
      ON public.map_entities(latitude, longitude)
      WHERE published AND geocode_status = 'resolved'
  `);
  await pool.query(`
    CREATE OR REPLACE VIEW public.published_map_entities AS
    SELECT id, entity_kind, title, slug, summary, address_line1, city, state_region, postal_code,
           country_code, latitude, longitude, website_url, source_url, source_label,
           '/places/' || id::text || '/' || slug AS detail_url
    FROM public.map_entities
    WHERE published = TRUE
      AND geocode_status = 'resolved'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
  `);
}

async function upsertEntity(pool: Pool, entity: EntityInput): Promise<string> {
  const coordinates = validCoordinates(entity.latitude, entity.longitude);
  const { rows } = await pool.query<{ id: string }>(`
    INSERT INTO public.map_entities (
      id, entity_kind, title, slug, summary, address_line1, city, state_region, postal_code,
      country_code, latitude, longitude, website_url, source_url, source_label, source_record_id,
      published, geocode_status
    ) VALUES (
      $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16::uuid, $17, $18
    )
    ON CONFLICT (entity_kind, slug) DO UPDATE SET
      title = EXCLUDED.title,
      summary = COALESCE(EXCLUDED.summary, map_entities.summary),
      address_line1 = COALESCE(EXCLUDED.address_line1, map_entities.address_line1),
      city = EXCLUDED.city,
      state_region = COALESCE(EXCLUDED.state_region, map_entities.state_region),
      postal_code = COALESCE(EXCLUDED.postal_code, map_entities.postal_code),
      country_code = EXCLUDED.country_code,
      latitude = COALESCE(EXCLUDED.latitude, map_entities.latitude),
      longitude = COALESCE(EXCLUDED.longitude, map_entities.longitude),
      website_url = COALESCE(EXCLUDED.website_url, map_entities.website_url),
      source_url = COALESCE(EXCLUDED.source_url, map_entities.source_url),
      source_label = COALESCE(EXCLUDED.source_label, map_entities.source_label),
      source_record_id = COALESCE(EXCLUDED.source_record_id, map_entities.source_record_id),
      published = map_entities.published OR EXCLUDED.published,
      geocode_status = CASE
        WHEN EXCLUDED.geocode_status = 'resolved' THEN 'resolved'
        ELSE map_entities.geocode_status
      END,
      updated_at = NOW()
    RETURNING id::text
  `, [
    entity.id,
    entity.entityKind,
    entity.title,
    entity.slug,
    entity.summary,
    entity.addressLine1,
    entity.city,
    entity.stateRegion,
    entity.postalCode,
    entity.countryCode,
    coordinates?.latitude ?? null,
    coordinates?.longitude ?? null,
    entity.websiteUrl,
    entity.sourceUrl,
    entity.sourceLabel,
    entity.sourceRecordId && UUID_RE.test(entity.sourceRecordId) ? entity.sourceRecordId : null,
    Boolean(coordinates),
    coordinates ? "resolved" : "queued",
  ]);
  return rows[0]!.id;
}

async function addAlias(
  pool: Pool,
  entityId: string,
  legacyKind: string,
  legacySlug: string,
  legacyId: string | null,
): Promise<void> {
  await pool.query(`
    INSERT INTO public.map_entity_aliases (entity_id, legacy_kind, legacy_slug, legacy_id)
    VALUES ($1::uuid, $2, $3, $4::uuid)
    ON CONFLICT DO NOTHING
  `, [entityId, legacyKind, legacySlug, legacyId && UUID_RE.test(legacyId) ? legacyId : null]);
}

async function importCulturalSites(pool: Pool): Promise<number> {
  const { rows } = await pool.query<SourceRow>(`
    SELECT id::text, name, description, address, city, state, country, latitude, longitude, site_type
    FROM public.tour_cultural_sites
    WHERE is_active = TRUE
      AND city IS NOT NULL
      AND BTRIM(city) <> ''
  `);
  for (const row of rows) {
    const entityId = await upsertEntity(pool, {
      id: row.id,
      entityKind: classifyCulturalEntity(row.site_type, row.name),
      title: row.name,
      slug: slugify(`${row.name}-${row.city}`),
      summary: row.description,
      addressLine1: row.address,
      city: row.city,
      stateRegion: row.state,
      postalCode: null,
      countryCode: countryCode(row.country),
      latitude: coordinate(row.latitude),
      longitude: coordinate(row.longitude),
      websiteUrl: null,
      sourceUrl: null,
      sourceLabel: "Mapping With Melanin cultural record",
      sourceRecordId: row.id,
    });
    await addAlias(pool, entityId, "cultural_site", slugify(row.name), row.id);
  }
  return rows.length;
}

async function importRecurringEvents(pool: Pool): Promise<number> {
  const { rows } = await pool.query<SourceRow>(`
    SELECT id::text, name, description, address, city, state, country, latitude, longitude, category
    FROM public.recurring_events
    WHERE is_active = TRUE
      AND city IS NOT NULL
      AND BTRIM(city) <> ''
      AND (active_until IS NULL OR active_until >= CURRENT_DATE)
  `);
  for (const row of rows) {
    const entityId = await upsertEntity(pool, {
      id: row.id,
      entityKind: classifyEvent(row.category, row.name),
      title: row.name,
      slug: slugify(`${row.name}-${row.city}`),
      summary: row.description,
      addressLine1: row.address,
      city: row.city,
      stateRegion: row.state,
      postalCode: null,
      countryCode: countryCode(row.country),
      latitude: coordinate(row.latitude),
      longitude: coordinate(row.longitude),
      websiteUrl: null,
      sourceUrl: null,
      sourceLabel: "Mapping With Melanin recurring event",
      sourceRecordId: row.id,
    });
    await addAlias(pool, entityId, "recurring_event", slugify(row.name), row.id);
  }
  return rows.length;
}

async function importCommunityOrganizations(pool: Pool): Promise<number> {
  const { rows } = await pool.query<SourceRow>(`
    SELECT id::text, name, mission AS description, address, city, state, country, latitude, longitude, website, category
    FROM public.community_organizations
    WHERE is_active = TRUE
      AND city IS NOT NULL
      AND BTRIM(city) <> ''
  `);
  for (const row of rows) {
    const entityId = await upsertEntity(pool, {
      id: row.id,
      entityKind: classifyCulturalEntity(row.category, row.name),
      title: row.name,
      slug: slugify(`${row.name}-${row.city}`),
      summary: row.description,
      addressLine1: row.address,
      city: row.city,
      stateRegion: row.state,
      postalCode: null,
      countryCode: countryCode(row.country),
      latitude: coordinate(row.latitude),
      longitude: coordinate(row.longitude),
      websiteUrl: row.website ?? null,
      sourceUrl: row.website ?? null,
      sourceLabel: "Community organization",
      sourceRecordId: row.id,
    });
    await addAlias(pool, entityId, "community_organization", slugify(row.name), row.id);
  }
  return rows.length;
}

async function importExistingHbcus(pool: Pool): Promise<number> {
  const { rows } = await pool.query<SourceRow>(`
    SELECT id, name, city, state, country, latitude, longitude, official_url, accreditation_source_url
    FROM public.education_institutions
    WHERE hbcu_status = TRUE
      AND is_active = TRUE
      AND city IS NOT NULL
      AND BTRIM(city) <> ''
  `);
  for (const row of rows) {
    const slug = ATLANTA_HBCU_SLUGS.get(row.name.toLowerCase()) ?? slugify(`${row.name}-${row.city}`);
    const entityId = await upsertEntity(pool, {
      id: stableUuid(`education_institution:${row.id}`),
      entityKind: "hbcu",
      title: row.name,
      slug,
      summary: "Historically Black college or university.",
      addressLine1: null,
      city: row.city,
      stateRegion: row.state,
      postalCode: null,
      countryCode: countryCode(row.country),
      latitude: coordinate(row.latitude),
      longitude: coordinate(row.longitude),
      websiteUrl: row.official_url ?? null,
      sourceUrl: row.accreditation_source_url ?? null,
      sourceLabel: row.accreditation_source_url ? "Institutional accreditation source" : "Institutional record",
      sourceRecordId: null,
    });
    await addAlias(pool, entityId, "hbcu", slugify(row.id), null);
  }
  return rows.length;
}

async function findInstitutionCoordinates(
  pool: Pool,
  name: string,
  city: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const { rows: canonicalRows } = await pool.query<{ latitude: number | string | null; longitude: number | string | null }>(`
    SELECT latitude, longitude
    FROM public.map_entities
    WHERE entity_kind = 'hbcu'
      AND lower(title) = lower($1)
      AND lower(city) = lower($2)
      AND geocode_status = 'resolved'
    LIMIT 1
  `, [name, city]);
  const canonicalCoordinates = canonicalRows[0]
    ? validCoordinates(canonicalRows[0].latitude, canonicalRows[0].longitude)
    : null;
  if (canonicalCoordinates) return canonicalCoordinates;

  const { rows } = await pool.query<{ latitude: number | string | null; longitude: number | string | null }>(`
    SELECT latitude, longitude
    FROM public.education_institutions
    WHERE lower(name) = lower($1)
      AND lower(city) = lower($2)
    LIMIT 1
  `, [name, city]);
  return rows[0] ? validCoordinates(rows[0].latitude, rows[0].longitude) : null;
}

async function geocodeInstitutionAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  // Keep the browser Maps key out of server-side resolution. The dedicated
  // Places server key resolves institution-backed addresses without client
  // involvement or browser-coordinate fallbacks.
  const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY;
  if (apiKey) {
    try {
    // Places API (New) is the preferred server endpoint. It is separately
    // scoped from browser Maps usage and explicitly requests only coordinates.
    const modernResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({ textQuery: address }),
    });
    if (modernResponse.ok) {
      const modernPayload = await modernResponse.json() as {
        places?: Array<{ location?: { latitude?: number; longitude?: number } }>;
      };
      const modernLocation = modernPayload.places?.[0]?.location;
      const modernCoordinates = modernLocation
        ? validCoordinates(modernLocation.latitude, modernLocation.longitude)
        : null;
      if (modernCoordinates) return modernCoordinates;
    }

    // Some existing server keys are still configured for the legacy Places
    // endpoint. Keep it as a compatibility fallback, never a browser call.
    const endpoint = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    endpoint.searchParams.set("query", address);
    endpoint.searchParams.set("key", apiKey);
    const response = await fetch(endpoint);
      if (response.ok) {
        const payload = await response.json() as {
          status?: string;
          results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
        };
        const location = payload.status === "OK" ? payload.results?.[0]?.geometry?.location : null;
        const legacyCoordinates = location ? validCoordinates(location.lat, location.lng) : null;
        if (legacyCoordinates) return legacyCoordinates;
      }
    } catch {
      // Fall through to the low-volume, server-only resolver below.
    }
  }

  // This fallback is restricted to a handful of unresolved,
  // institution-backed seed addresses. It is rate-limited and the successful
  // coordinate persists to the canonical record, preventing repeat requests.
  await new Promise((resolve) => setTimeout(resolve, 1_100));
  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("q", address);
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", "1");
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)" },
    });
    if (!response.ok) return null;
    const candidates = await response.json() as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;
    const candidate = candidates.find((item) => item.display_name?.toLowerCase().includes("atlanta"));
    return candidate ? validCoordinates(candidate.lat, candidate.lon) : null;
  } catch {
    return null;
  }
}

async function ensureAtlantaHbcus(pool: Pool, logger: Logger): Promise<number> {
  let resolved = 0;
  for (const institution of ATLANTA_HBCU_SEED) {
    const existingCoordinates = await findInstitutionCoordinates(pool, institution.title, institution.city);
    const coordinates = existingCoordinates ?? await geocodeInstitutionAddress(
      `${institution.addressLine1}, ${institution.city}, ${institution.stateRegion} ${institution.postalCode}, USA`,
    );
    const entityId = await upsertEntity(pool, {
      id: stableUuid(`atlanta-hbcu:${institution.slug}`),
      entityKind: "hbcu",
      title: institution.title,
      slug: institution.slug,
      summary: "Institution-backed Atlanta HBCU record.",
      addressLine1: institution.addressLine1,
      city: institution.city,
      stateRegion: institution.stateRegion,
      postalCode: institution.postalCode,
      countryCode: "US",
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      websiteUrl: institution.websiteUrl,
      sourceUrl: institution.sourceUrl,
      sourceLabel: institution.sourceLabel,
      sourceRecordId: null,
    });
    await addAlias(pool, entityId, "hbcu", institution.slug, null);
    if (coordinates) resolved++;
  }
  if (resolved < ATLANTA_HBCU_SEED.length) {
    logger.warn(`ensureUniversalMapEntities: ${ATLANTA_HBCU_SEED.length - resolved} Atlanta HBCU records remain unpublished because the server could not validate coordinates`);
  }
  return resolved;
}

export async function ensureUniversalMapEntities(pool: Pool, logger: Logger): Promise<void> {
  try {
    await ensureSchema(pool);
    const [culturalSites, events, organizations, hbcus] = await Promise.all([
      importCulturalSites(pool),
      importRecurringEvents(pool),
      importCommunityOrganizations(pool),
      importExistingHbcus(pool),
    ]);
    const atlantaHbcus = await ensureAtlantaHbcus(pool, logger);
    logger.log(
      `ensureUniversalMapEntities: imported ${culturalSites} cultural, ${events} event, ${organizations} organization, and ${hbcus} HBCU source records; ${atlantaHbcus}/6 Atlanta HBCUs are published`,
    );
  } catch (error: unknown) {
    logger.warn(`ensureUniversalMapEntities failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
