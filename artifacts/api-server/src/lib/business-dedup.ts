/**
 * Business deduplication safeguards — MWM
 *
 * Conservative rules:
 * - Never deletes a row immediately; soft-marks only.
 * - Merges only when identity is high-confidence: same normalized name +
 *   identical coordinates (5dp), OR same normalized name + exact address/city/state.
 * - Catches high-confidence naming variants (Cafe/Café, em dashes, parenthetical
 *   city labels) when location is also identical.
 * - Blocks future inserts when the same identity key already exists.
 */

export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function coord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(5)) : null;
}

function geoKey(lat: unknown, lon: unknown): string | null {
  const la = coord(lat);
  const lo = coord(lon);
  return la !== null && lo !== null ? `geo:${la},${lo}` : null;
}

export function dedupeKey(b: {
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}): string {
  const name = normalizeText(b.name);
  const geo = geoKey(b.latitude, b.longitude);
  if (geo) return `${name}|${geo}`;
  const address = normalizeText(b.address);
  const city = normalizeText(b.city);
  const state = normalizeText(b.state);
  if (address) return `${name}|${city}|${state}|addr:${address}`;
  return `${name}|${city}|${state}|no-location`;
}

export function tokenSimilarity(a: string, b: string): number {
  const A = new Set(normalizeText(a).split(" ").filter(Boolean));
  const B = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  const intersection = [...A].filter((x) => B.has(x)).length;
  return (2 * intersection) / (A.size + B.size);
}

export function sameLocation(
  a: { latitude?: number | string | null; longitude?: number | string | null; address?: string | null; city?: string | null; state?: string | null },
  b: { latitude?: number | string | null; longitude?: number | string | null; address?: string | null; city?: string | null; state?: string | null },
): boolean {
  const ag = geoKey(a.latitude, a.longitude);
  const bg = geoKey(b.latitude, b.longitude);
  if (ag && bg) return ag === bg;
  const na = normalizeText(a.address);
  return (
    na !== "" &&
    na === normalizeText(b.address) &&
    normalizeText(a.city) === normalizeText(b.city) &&
    normalizeText(a.state) === normalizeText(b.state)
  );
}

export function evidenceScore(c: {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sourceTypes?: string[];
}): number {
  const sources = new Set(c.sourceTypes ?? []);
  let score = 0;
  if (c.name) score += 15;
  if (c.address && c.city && c.state) score += 20;
  if (c.website) score += 10;
  if (c.phone) score += 10;
  if (c.latitude !== undefined && c.longitude !== undefined) score += 10;
  if (sources.has("maps")) score += 15;
  if (sources.has("official_website")) score += 15;
  if (sources.has("directory") || sources.has("web_search")) score += 5;
  return Math.min(score, 100);
}
