export interface CanonicalBusinessSearchInput {
  city: string;
  stateCode?: string | null;
  category?: string | null;
  specialty?: string | null;
  ownership?: string | null;
  searchText?: string;
  offset?: number;
  limit?: number;
}

export function buildCanonicalBusinessSearchParams(
  input: CanonicalBusinessSearchInput,
): URLSearchParams {
  const params = new URLSearchParams({
    city: input.city.trim(),
    limit: String(Math.min(200, Math.max(1, input.limit ?? 60))),
    offset: String(Math.max(0, input.offset ?? 0)),
  });
  const state = input.stateCode?.trim();
  const category = input.category?.trim();
  const specialty = input.specialty?.trim();
  const searchText = input.searchText?.trim();
  const ownership = input.ownership?.trim();
  const search = [searchText, specialty].filter(Boolean).join(" ").trim();
  if (state) params.set("state", state.toUpperCase());
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (ownership) params.set("ownership", ownership);
  return params;
}

export function readCanonicalBusinessSearchResponse(value: unknown): {
  businesses: CanonicalBusinessSearchRecord[];
  total: number;
} {
  if (!value || typeof value !== "object") {
    throw new Error("The business directory returned an invalid response.");
  }
  const payload = value as { businesses?: unknown; total?: unknown };
  if (!Array.isArray(payload.businesses)) {
    throw new Error("The business directory returned an invalid response.");
  }
  const businesses = payload.businesses.filter(isCanonicalBusinessSearchRecord);
  return {
    businesses,
    total: typeof payload.total === "number" && Number.isFinite(payload.total)
      ? Math.max(0, payload.total)
      : businesses.length,
  };
}

export interface CanonicalBusinessSearchRecord {
  id: string;
  name: string;
  category?: string | null;
  subcategory?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  website?: string | null;
  listingStatus?: string | null;
  verified?: boolean | null;
  priceRange?: string | null;
  tags?: unknown;
}

function isCanonicalBusinessSearchRecord(value: unknown): value is CanonicalBusinessSearchRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as { id?: unknown; name?: unknown };
  return typeof row.id === "string" && row.id.length > 0
    && typeof row.name === "string" && row.name.trim().length > 0;
}

export function appendUniqueCanonicalBusinesses(
  current: CanonicalBusinessSearchRecord[],
  incoming: CanonicalBusinessSearchRecord[],
): CanonicalBusinessSearchRecord[] {
  const known = new Set(current.map((business) => business.id));
  return [...current, ...incoming.filter((business) => !known.has(business.id))];
}
