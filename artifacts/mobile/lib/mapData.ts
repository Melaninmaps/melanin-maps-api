export interface MapRegionBounds {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface NormalizedMapCulturalSite {
  id: string;
  name: string;
  description: string;
  category: string;
  heritageCategory: string;
  subcategory?: string | null;
  city: string;
  state: string;
  address?: string | null;
  latitude: string;
  longitude: string;
  era: string | null;
  significance: string | null;
  externalUrl?: string | null;
  yearEstablished?: number | null;
  visitTip?: string | null;
  contentNote?: string | null;
  pinType?: string | null;
  listingStatus?: string | null;
  culturalCommunity?: string | null;
}

export function validMapCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180
    && (Math.abs(latitude) > 0.001 || Math.abs(longitude) > 0.001);
}

export function isDomesticMapCountry(country?: string): boolean {
  const normalized = (country ?? "United States").trim().toUpperCase();
  return normalized === "" || normalized === "US" || normalized === "USA" || normalized === "UNITED STATES";
}

export function isCoordinateInRegion(
  latitude: number,
  longitude: number,
  region: MapRegionBounds,
): boolean {
  const latitudeMargin = Math.max(region.latitudeDelta * 0.65, 0.04);
  const longitudeMargin = Math.max(region.longitudeDelta * 0.65, 0.04);
  return Math.abs(latitude - region.latitude) <= latitudeMargin
    && Math.abs(longitude - region.longitude) <= longitudeMargin;
}

export function mapPinMatchesQuery(
  pin: { name?: string; category?: string; subcategory?: string; city?: string; state?: string; country?: string },
  query: string,
): boolean {
  const stopWords = new Set(["a", "an", "the", "and", "or", "of", "in", "at", "on", "for", "to", "with", "is", "by", "near", "best", "good", "great"]);
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9'&-]/g, ""))
    .filter((token) => token.length >= 2 && !stopWords.has(token));
  if (tokens.length === 0) return false;
  const haystack = [pin.name, pin.category, pin.subcategory, pin.city, pin.state, pin.country]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(...values: unknown[]): string {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
  return typeof value === "string" ? value.trim() : "";
}

function coordinateValue(value: unknown): number {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "string" && value.trim().length === 0) return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function normalizeMapCulturalSite(value: unknown): NormalizedMapCulturalSite | null {
  const raw = record(value);
  const latitude = coordinateValue(raw.latitude);
  const longitude = coordinateValue(raw.longitude);
  if (!stringValue(raw.id) || !stringValue(raw.name) || !validMapCoordinate(latitude, longitude)) return null;
  return {
    id: stringValue(raw.id),
    name: stringValue(raw.name),
    description: stringValue(raw.description),
    category: stringValue(raw.category, "Heritage"),
    heritageCategory: stringValue(raw.heritageCategory, raw.heritage_category, raw.category, "Cultural Site"),
    subcategory: stringValue(raw.subcategory) || null,
    city: stringValue(raw.city),
    state: stringValue(raw.state, raw.stateCode, raw.state_code),
    address: stringValue(raw.address) || null,
    latitude: String(latitude),
    longitude: String(longitude),
    era: stringValue(raw.era) || null,
    significance: stringValue(raw.significance) || null,
    externalUrl: stringValue(raw.externalUrl, raw.learnMoreUrl, raw.external_url, raw.learn_more_url) || null,
    yearEstablished: Number.isFinite(Number(raw.yearEstablished ?? raw.year_established))
      ? Number(raw.yearEstablished ?? raw.year_established)
      : null,
    visitTip: stringValue(raw.visitTip, raw.visit_tip) || null,
    contentNote: stringValue(raw.contentNote, raw.content_note) || null,
    pinType: stringValue(raw.pinType, raw.pin_type) || null,
    listingStatus: stringValue(raw.listingStatus, raw.listing_status) || null,
    culturalCommunity: stringValue(raw.culturalCommunity, raw.cultural_community) || null,
  };
}
