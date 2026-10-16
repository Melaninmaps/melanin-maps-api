import { createHash } from "node:crypto";

/**
 * This policy is intentionally narrower than source-backed directory intake.
 * It exists solely for the founder-approved international archive audit: a
 * fixed, reviewed set of restored records may appear in ordinary Directory
 * browse when the record had either a verified official website or a
 * country-consistent existing map pin. It never writes an ownership claim,
 * Kinfolk membership, discovery eligibility, social link, coordinate, or
 * profile field.
 */
export const INTERNATIONAL_DIRECTORY_ONLY_VISIBILITY_POLICY =
  "international_directory_only_visibility_v1" as const;
export const INTERNATIONAL_DIRECTORY_ONLY_SCOPE =
  "international_archived_records_with_verified_website_or_country_consistent_map_pin" as const;
export const INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT = "2026-10-16T07:00:00Z" as const;
export const INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT = 114 as const;
export const INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_SHA256 =
  "9d25b92b42dc494cb666e2955ae507157c7758a0a81f4756c6368aed30a2ec69" as const;
export const INTERNATIONAL_DIRECTORY_ONLY_VALIDITY_DAYS = 180 as const;

const ALLOWED_REASONS = new Set([
  "verified_official_website",
  "country_consistent_map_pin",
]);

export type InternationalDirectoryOnlyRestoreReason =
  | "verified_official_website"
  | "country_consistent_map_pin";

export type InternationalDirectoryOnlyManifestItem = Readonly<{
  id: string;
  name: string;
  country: string;
  expectedListingStatus: "archived";
  expectedAccountStatus: "suspended";
  expectedWebsite: string | null;
  expectedLatitude: number | null;
  expectedLongitude: number | null;
  restoreReasons: readonly InternationalDirectoryOnlyRestoreReason[];
  restoreTo: "live_unclaimed";
  prohibitedChanges: readonly string[];
}>;

export type InternationalDirectoryOnlyManifest = Readonly<{
  scope: typeof INTERNATIONAL_DIRECTORY_ONLY_SCOPE;
  generatedAt: typeof INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT;
  count: typeof INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT;
  items: readonly InternationalDirectoryOnlyManifestItem[];
}>;

function stableValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableValue(entry)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableValue(record[key])}`)
      .join(",")}}`;
  }
  throw new Error("INTERNATIONAL_DIRECTORY_MANIFEST_UNSUPPORTED_VALUE");
}

export function internationalDirectoryOnlyManifestFingerprint(value: unknown): string {
  return createHash("sha256").update(stableValue(value)).digest("hex");
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function boundedText(value: unknown, maximum: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximum
    ? value.trim()
    : null;
}

function nullableHttpsUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  const url = boundedText(value, 2_048);
  if (!url) return undefined;
  try {
    return new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function nullableFiniteCoordinate(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // PostgreSQL CSV/JSON exports preserve some numeric columns as strings. The
  // signed audit artifact is still immutable; normalize only for the exact
  // live-coordinate comparison performed during activation.
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * PostgreSQL's numeric decoder can supply a coordinate as a decimal string,
 * while the signed audit artifact is parsed as a JavaScript number. Normalize
 * only that transport representation before the bounded equality check; this
 * does not alter the immutable evidence or accept non-finite values.
 */
export function matchesInternationalDirectoryOnlyAuditedCoordinate(
  current: unknown,
  expected: number | null,
): boolean {
  const normalizedCurrent = nullableFiniteCoordinate(current);
  return typeof normalizedCurrent === "number"
    && typeof expected === "number"
    && Math.abs(normalizedCurrent - expected) < 0.000_001;
}

function parseItem(value: unknown): InternationalDirectoryOnlyManifestItem | null {
  const candidate = record(value);
  if (!candidate) return null;
  const id = boundedText(candidate.id, 180);
  const name = boundedText(candidate.name, 300);
  const country = boundedText(candidate.country, 160);
  const expectedWebsite = nullableHttpsUrl(candidate.expectedWebsite);
  const expectedLatitude = nullableFiniteCoordinate(candidate.expectedLatitude);
  const expectedLongitude = nullableFiniteCoordinate(candidate.expectedLongitude);
  const rawRestoreReasons = Array.isArray(candidate.restoreReasons) ? candidate.restoreReasons : null;
  const restoreReasons = rawRestoreReasons
    ? rawRestoreReasons.filter((reason): reason is InternationalDirectoryOnlyRestoreReason =>
      typeof reason === "string" && ALLOWED_REASONS.has(reason),
    )
    : [];
  const prohibitedChanges = Array.isArray(candidate.prohibitedChanges)
    ? candidate.prohibitedChanges.filter((change): change is string => typeof change === "string")
    : [];
  const hasWebsiteProof = restoreReasons.includes("verified_official_website")
    && typeof expectedWebsite === "string";
  const hasPinProof = restoreReasons.includes("country_consistent_map_pin")
    && typeof expectedLatitude === "number"
    && typeof expectedLongitude === "number"
    && expectedLatitude >= -90
    && expectedLatitude <= 90
    && expectedLongitude >= -180
    && expectedLongitude <= 180;

  if (
    !id || !name || !country || expectedWebsite === undefined ||
    expectedLatitude === undefined || expectedLongitude === undefined ||
    candidate.expectedListingStatus !== "archived" || candidate.expectedAccountStatus !== "suspended" ||
    candidate.restoreTo !== "live_unclaimed" || !rawRestoreReasons || restoreReasons.length === 0 ||
    restoreReasons.length !== rawRestoreReasons.length ||
    restoreReasons.length !== new Set(restoreReasons).size || prohibitedChanges.length === 0 ||
    !hasWebsiteProof && !hasPinProof
  ) return null;

  return {
    id,
    name,
    country,
    expectedListingStatus: "archived",
    expectedAccountStatus: "suspended",
    expectedWebsite,
    expectedLatitude,
    expectedLongitude,
    restoreReasons,
    restoreTo: "live_unclaimed",
    prohibitedChanges,
  };
}

/**
 * Parse the fixed audit manifest before a privileged activation. The fingerprint
 * is checked separately against the compiled approval hash, so this parser does
 * not make arbitrary international records eligible.
 */
export function parseInternationalDirectoryOnlyManifest(
  value: unknown,
): InternationalDirectoryOnlyManifest | null {
  const candidate = record(value);
  if (
    !candidate || candidate.scope !== INTERNATIONAL_DIRECTORY_ONLY_SCOPE ||
    candidate.generatedAt !== INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT ||
    candidate.count !== INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT ||
    !Array.isArray(candidate.items) || candidate.items.length !== INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT
  ) return null;
  const items = candidate.items.map(parseItem);
  if (items.some((item) => !item)) return null;
  const parsed = items as InternationalDirectoryOnlyManifestItem[];
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) return null;
  return {
    scope: INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
    generatedAt: INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT,
    count: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT,
    items: parsed,
  };
}

export function matchesInternationalDirectoryOnlyManifest(value: unknown): boolean {
  const manifest = parseInternationalDirectoryOnlyManifest(value);
  return Boolean(manifest)
    && internationalDirectoryOnlyManifestFingerprint(value) === INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_SHA256;
}

export function internationalDirectoryOnlyEvidence(item: InternationalDirectoryOnlyManifestItem): Record<string, unknown> {
  return {
    scope: INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
    country: item.country,
    reasons: item.restoreReasons,
    verifiedOfficialWebsite: item.restoreReasons.includes("verified_official_website")
      ? item.expectedWebsite
      : null,
    countryConsistentMapPin: item.restoreReasons.includes("country_consistent_map_pin")
      ? { latitude: item.expectedLatitude, longitude: item.expectedLongitude }
      : null,
    prohibitedChanges: item.prohibitedChanges,
  };
}
