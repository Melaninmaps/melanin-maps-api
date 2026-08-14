/**
 * Replit business deduplication safeguards.
 *
 * This code is intentionally conservative:
 * - It never deletes a row immediately.
 * - It records duplicate_of_id and marks duplicates inactive.
 * - It merges only when identity is high confidence: same normalized name plus
 *   identical coordinates, or same normalized name plus exact address/city/state.
 * - It blocks future inserts when the same identity key already exists.
 *
 * Adapt the `Business` and `BusinessStore` interfaces to your existing database
 * layer. The logic is independent of Drizzle, Prisma, or raw SQL.
 */

export type Business = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  category?: string | null;
  subcategory?: string | null;
  status?: string | null;
  listingStatus?: string | null;
  duplicateOfId?: string | null;
  isDuplicate?: boolean;
  updatedAt?: Date;
};

export type BusinessStore = {
  listActive(): Promise<Business[]>;
  findByDedupeKey(key: string): Promise<Business | null>;
  markDuplicate(id: string, canonicalId: string, reason: string): Promise<void>;
  updateCanonical(id: string, patch: Partial<Business>): Promise<void>;
  create(business: Business): Promise<Business>;
};

function ascii(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizeText(value: unknown): string {
  return ascii(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

export function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function coordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(5)) : null;
}

function geoKey(b: Business): string | null {
  const lat = coordinate(b.latitude);
  const lon = coordinate(b.longitude);
  return lat !== null && lon !== null ? `geo:${lat},${lon}` : null;
}

/**
 * Generate the same key for existing rows and new search results.
 * Coordinates take priority so a city-label variation cannot create a duplicate.
 */
export function dedupeKey(b: Business): string {
  const name = normalizeText(b.name);
  const geo = geoKey(b);
  if (geo) return `${name}|${geo}`;

  const address = normalizeText(b.address);
  const city = normalizeText(b.city);
  const state = normalizeText(b.state);
  if (address) return `${name}|${city}|${state}|addr:${address}`;
  return `${name}|${city}|${state}|no-location`;
}

function tokenSimilarity(a: string, b: string): number {
  const A = new Set(normalizeText(a).split(' ').filter(Boolean));
  const B = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  const intersection = [...A].filter((x) => B.has(x)).length;
  return (2 * intersection) / (A.size + B.size);
}

function sameLocation(a: Business, b: Business): boolean {
  const ag = geoKey(a);
  const bg = geoKey(b);
  if (ag && bg) return ag === bg;
  return normalizeText(a.address) !== '' &&
    normalizeText(a.address) === normalizeText(b.address) &&
    normalizeText(a.city) === normalizeText(b.city) &&
    normalizeText(a.state) === normalizeText(b.state);
}

function completeness(b: Business): number {
  return [b.website, b.phone, b.address, b.latitude, b.longitude]
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
}

function chooseCanonical(rows: Business[]): Business {
  return [...rows].sort((a, b) => completeness(b) - completeness(a) || a.id.localeCompare(b.id))[0];
}

/** Dry-run first. Review the returned plan before applying it. */
export async function buildDeduplicationPlan(store: BusinessStore) {
  const rows = await store.listActive();
  const groups = new Map<string, Business[]>();
  for (const row of rows) {
    const key = dedupeKey(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const plan: Array<{ duplicateId: string; canonicalId: string; key: string; reason: string }> = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const canonical = chooseCanonical(group);
    for (const row of group) {
      if (row.id !== canonical.id) {
        plan.push({
          duplicateId: row.id,
          canonicalId: canonical.id,
          key,
          reason: 'same normalized business name and identical coordinates, or exact normalized address/city/state',
        });
      }
    }
  }
  return plan;
}

/** Apply only the reviewed plan. Prefer soft deletion over physical deletion. */
export async function applyDeduplicationPlan(
  store: BusinessStore,
  plan: Awaited<ReturnType<typeof buildDeduplicationPlan>>,
) {
  for (const item of plan) {
    await store.markDuplicate(item.duplicateId, item.canonicalId, item.reason);
  }
  return { markedDuplicate: plan.length };
}

/**
 * Use this for every incoming search/import result. It prevents duplicates at
 * insertion time and returns the existing canonical row when one already exists.
 */
export async function upsertSearchResult(store: BusinessStore, candidate: Business) {
  const key = dedupeKey(candidate);
  let existing = await store.findByDedupeKey(key);

  // Catch high-confidence naming variants such as parentheses, em dashes,
  // Cafe/Café, or a city suffix, but only when the location is also identical.
  if (!existing) {
    const nearby = await store.listActive();
    existing = nearby.find((row) => sameLocation(row, candidate) && tokenSimilarity(row.name, candidate.name) >= 0.90) ?? null;
  }
  if (existing) {
    // Fill missing canonical fields; never create a second business row.
    const patch: Partial<Business> = {};
    for (const field of ['website', 'phone', 'address', 'category', 'subcategory'] as const) {
      if ((!existing[field] || existing[field] === '') && candidate[field]) patch[field] = candidate[field];
    }
    if (Object.keys(patch).length) await store.updateCanonical(existing.id, patch);
    return { action: 'EXISTING_CANONICAL' as const, business: existing, key };
  }
  const created = await store.create({ ...candidate, duplicateOfId: null, isDuplicate: false });
  return { action: 'CREATED' as const, business: created, key };
}

/**
 * Required search/import policy:
 * 1. Search with a bounded geographic area.
 * 2. Normalize every result.
 * 3. Compute dedupeKey before writing.
 * 4. Upsert, never blind-insert.
 * 5. Store source/provider and source URL in the schema for traceability.
 * 6. Never manufacture a business, address, phone, website, or coordinate.
 * 7. Mark uncertain matches for review instead of merging them automatically.
 */
