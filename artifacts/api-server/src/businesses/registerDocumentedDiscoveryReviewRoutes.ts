import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { DIASPORA_OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import { isAdmin } from "../lib/adminAuth";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "./documentedDiscoveryEligibility";
import { assessMapReadiness, type MapReadinessCandidate } from "./mapReadinessCrosswalk";
import {
  LEGACY_MAP_RECEIPT_GATE_SHA,
  legacyMapLocationAttestationChecksum,
  legacyMapLocationSnapshotMatchesCurrent,
  validateLegacyMapLocationAttestationInput,
  validateLegacyMapLocationRevocationInput,
} from "./legacyMapLocationAttestation";
import {
  type DirectoryReconciliationAction,
  type DirectoryReconciliationOwnershipStatus,
  type DirectoryReconciliationPresenceStatus,
  type DirectoryReconciliationReasonCode,
  type DirectoryReconciliationState,
  isDirectoryReconciliationReasonCode,
} from "./directoryReconciliationPolicy";

type EvidenceField =
  | "identity"
  | "ownership"
  | "official_website"
  | "official_social"
  | "address"
  | "map_pin";
type EvidenceSourceKind =
  | "business_official"
  | "owner_official"
  | "approved_public"
  | "founder_directory"
  | "official_geocoder";
type EligibilityStatus = "qualified" | "direct_name_only" | "review_hold" | "revoked";
type WebsiteCleanupStatus = "identity_mismatch" | "unsafe_spam" | "inactive_broken";

type WebsiteCleanupInput = Readonly<{
  status: WebsiteCleanupStatus;
  originalWebsite: string;
  finalDestination: string | null;
  evidenceSourceUrl: string;
  evidenceSummary: string;
  checkedAt: string;
}>;

type EvidenceInput = Readonly<{
  field: EvidenceField;
  sourceKind: EvidenceSourceKind;
  sourceUrl: string;
  sourceLabel?: string | null;
  observedAt: string;
  sourceExpiresAt?: string | null;
  confidence: "high" | "medium" | "low";
  observedValue?: Record<string, unknown>;
}>;

type ReviewInput = Readonly<{
  eligibilityStatus: EligibilityStatus;
  decisionReason: string;
  reconciliationReasonCode: DirectoryReconciliationReasonCode;
  batchReference?: string;
  ownershipDesignations?: string[];
  ownershipSourceExpiresAt?: string;
  reviewAfter?: string;
  evidence?: EvidenceInput[];
  websiteCleanup?: WebsiteCleanupInput;
}>;

type MapPinEvidenceReviewInput = Readonly<{
  decisionReason: string;
  addressEvidence: EvidenceInput;
  mapPinEvidence: EvidenceInput;
}>;
type StoredAddressReconciliationInput = Readonly<{
  expectedStoredAddress: string | null;
  decisionReason: string;
  addressEvidence: EvidenceInput;
}>;

const OFFICIAL_SOCIAL_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "tiktok.com",
  "www.tiktok.com",
  "linkedin.com",
  "www.linkedin.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "threads.net",
  "www.threads.net",
  "pinterest.com",
  "www.pinterest.com",
  "bsky.app",
]);
const NON_OFFICIAL_WEBSITE_HOSTS = [
  "yelp.", "yellowpages.", "google.", "g.page", "bing.", "tripadvisor.",
  "foursquare.", "mapquest.", "doordash.", "ubereats.", "grubhub.", "opentable.",
  "etsy.", "amazon.", "facebook.com/marketplace",
];
const EVIDENCE_FIELDS = new Set<EvidenceField>([
  "identity", "ownership", "official_website", "official_social", "address", "map_pin",
]);
const SOURCE_KINDS = new Set<EvidenceSourceKind>([
  "business_official", "owner_official", "approved_public", "founder_directory", "official_geocoder",
]);
const ELIGIBILITY_STATUSES = new Set<EligibilityStatus>([
  "qualified", "direct_name_only", "review_hold", "revoked",
]);
const WEBSITE_CLEANUP_STATUSES = new Set<WebsiteCleanupStatus>([
  "identity_mismatch", "unsafe_spam", "inactive_broken",
]);
const DESIGNATIONS = new Set(DIASPORA_OWNERSHIP_DESIGNATIONS.map((item) => item.toLocaleLowerCase("en-US")));
const OFFICIAL_PRESENCE_SOURCE_KINDS = new Set<EvidenceSourceKind>([
  "business_official", "owner_official",
]);
const IDENTITY_MATCHING_SIGNALS = new Set([
  "business_name", "city", "phone", "address", "official_email_domain", "owner_name", "direct_official_link",
]);
const APPROVED_GEOCODER_HOSTS = new Set([
  "maps.googleapis.com",
  "nominatim.openstreetmap.org",
  "geocoding.geo.census.gov",
]);

function safeHttpsUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS`);
  parsed.hash = "";
  return parsed.toString();
}

function safeHttpUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${label} must use HTTP(S)`);
  parsed.hash = "";
  return parsed.toString();
}

function hostOf(value: string): string {
  return new URL(value).hostname.toLocaleLowerCase("en-US");
}

function isDirectoryOrMarketplaceUrl(value: string): boolean {
  const normalized = `${hostOf(value)}${new URL(value).pathname}`.toLocaleLowerCase("en-US");
  return NON_OFFICIAL_WEBSITE_HOSTS.some((fragment) => normalized.includes(fragment));
}

function asTimestamp(value: unknown, label: string, now: Date, maxFutureDays = 366): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${label} must be an ISO timestamp`);
  if (date.getTime() > now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000) {
    throw new Error(`${label} is implausibly far in the future`);
  }
  return date.toISOString();
}

function futureTimestamp(value: unknown, label: string, now: Date): string {
  const timestamp = asTimestamp(value, label, now);
  if (Date.parse(timestamp) <= now.getTime()) throw new Error(`${label} must be in the future`);
  return timestamp;
}

function normalizedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim().replace(/\s+/g, " ");
  return result ? result.slice(0, maxLength) : null;
}

function normalizedAddress(value: unknown): string | null {
  const text = normalizedText(value, 300);
  return text?.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim() ?? null;
}

type PhysicalAddressComponents = Readonly<{
  houseNumber: string;
  directional: string | null;
  streetName: string;
  streetType: string;
  city: string;
  state: string;
  postalCode: string;
}>;

const DIRECTIONAL_ALIASES: Record<string, string> = {
  n: "north", north: "north", s: "south", south: "south",
  e: "east", east: "east", w: "west", west: "west",
};
const STREET_TYPE_ALIASES: Record<string, string> = {
  st: "street", street: "street", ave: "avenue", avenue: "avenue",
  rd: "road", road: "road", blvd: "boulevard", boulevard: "boulevard",
  dr: "drive", drive: "drive", ln: "lane", lane: "lane",
  ct: "court", court: "court", pl: "place", place: "place",
  pkwy: "parkway", parkway: "parkway", ter: "terrace", terrace: "terrace",
  hwy: "highway", highway: "highway", cir: "circle", circle: "circle",
};
const STATE_ALIASES: Record<string, string> = {
  al: "alabama", ak: "alaska", az: "arizona", ar: "arkansas", ca: "california",
  co: "colorado", ct: "connecticut", de: "delaware", fl: "florida", ga: "georgia",
  hi: "hawaii", id: "idaho", il: "illinois", in: "indiana", ia: "iowa",
  ks: "kansas", ky: "kentucky", la: "louisiana", me: "maine", md: "maryland",
  ma: "massachusetts", mi: "michigan", mn: "minnesota", ms: "mississippi", mo: "missouri",
  mt: "montana", ne: "nebraska", nv: "nevada", nh: "new hampshire", nj: "new jersey",
  nm: "new mexico", ny: "new york", nc: "north carolina", nd: "north dakota", oh: "ohio",
  ok: "oklahoma", or: "oregon", pa: "pennsylvania", ri: "rhode island", sc: "south carolina",
  sd: "south dakota", tn: "tennessee", tx: "texas", ut: "utah", vt: "vermont",
  va: "virginia", wa: "washington", wv: "west virginia", wi: "wisconsin", wy: "wyoming",
};

function componentText(value: unknown): string | null {
  return normalizedText(value, 160)?.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim() ?? null;
}

function canonicalState(value: unknown): string | null {
  const normalized = componentText(value);
  if (!normalized) return null;
  return STATE_ALIASES[normalized] ?? Object.entries(STATE_ALIASES).find(([, state]) => state === normalized)?.[1] ?? null;
}

function canonicalDirectional(value: unknown): string | null {
  const normalized = componentText(value);
  if (normalized == null || normalized === "") return null;
  return DIRECTIONAL_ALIASES[normalized] ?? null;
}

function canonicalStreetType(value: unknown): string | null {
  const normalized = componentText(value);
  return normalized ? STREET_TYPE_ALIASES[normalized] ?? null : null;
}

function normalizePhysicalAddressComponents(value: unknown): PhysicalAddressComponents | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const houseNumber = componentText(raw.houseNumber);
  const hasDirectional = raw.directional != null;
  const directional = hasDirectional ? canonicalDirectional(raw.directional) : null;
  if (hasDirectional && directional === null) return null;
  const streetName = componentText(raw.streetName);
  const streetType = canonicalStreetType(raw.streetType);
  const city = componentText(raw.city);
  const state = canonicalState(raw.state);
  const postalCode = normalizedText(raw.postalCode, 10)?.replace(/\s/g, "") ?? null;
  if (!houseNumber || !streetName || !streetType || !city || !state || !postalCode || !/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    return null;
  }
  return { houseNumber, directional, streetName, streetType, city, state, postalCode };
}

function parseCompleteUsStreetAddress(value: unknown): PhysicalAddressComponents | null {
  const text = normalizedText(value, 300);
  if (!text) return null;
  const match = text.match(/^\s*(\d+[A-Za-z]?)\s+(?:(N(?:orth)?|S(?:outh)?|E(?:ast)?|W(?:est)?)\.?\s+)?(.+?)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy|Circle|Cir)\.?\s*,\s*([^,]+?)\s*,\s*([A-Za-z]{2}|[A-Za-z ]+)\s+(\d{5}(?:-\d{4})?)\s*$/i);
  if (!match) return null;
  return normalizePhysicalAddressComponents({
    houseNumber: match[1], directional: match[2] ?? null, streetName: match[3], streetType: match[4],
    city: match[5], state: match[6], postalCode: match[7],
  });
}

function samePhysicalAddress(left: PhysicalAddressComponents, right: PhysicalAddressComponents): boolean {
  return left.houseNumber === right.houseNumber
    && left.directional === right.directional
    && left.streetName === right.streetName
    && left.streetType === right.streetType
    && left.city === right.city
    && left.state === right.state
    && left.postalCode === right.postalCode;
}

type IncompletePhysicalAddressComponents = Readonly<{
  houseNumber: string;
  directional: string | null;
  streetName: string;
  streetType: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}>;

/**
 * This deliberately accepts only a complete street core (number, direction,
 * name, and type). A missing direction or street type can identify a different
 * street, so it must remain in review rather than be "completed" from a page.
 */
function parseIncompleteUsStreetAddress(value: unknown): IncompletePhysicalAddressComponents | null {
  const text = normalizedText(value, 300);
  if (!text || /\b(?:p\.?\s*o\.?\s*box|suite|ste\.?|unit|floor|#)\b/i.test(text)) return null;
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return null;
  const street = parts[0].match(/^\s*(\d+[A-Za-z]?)\s+(?:(N(?:orth)?|S(?:outh)?|E(?:ast)?|W(?:est)?)\.?\s+)?(.+?)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy|Circle|Cir)\.?\s*$/i);
  if (!street) return null;
  let city: string | null = null;
  let state: string | null = null;
  let postalCode: string | null = null;
  if (parts.length === 2) {
    const statePart = parts[1].match(/^(.+?)(?:\s+(\d{5}(?:-\d{4})?))?$/);
    const maybeState = canonicalState(statePart?.[1]);
    if (maybeState) {
      state = maybeState;
      postalCode = statePart?.[2] ?? null;
    } else {
      city = componentText(parts[1]);
    }
  }
  if (parts.length === 3) {
    city = componentText(parts[1]);
    const statePart = parts[2].match(/^(.+?)(?:\s+(\d{5}(?:-\d{4})?))?$/);
    state = canonicalState(statePart?.[1]);
    postalCode = statePart?.[2] ?? null;
    if (!state) return null;
  }
  const houseNumber = componentText(street[1]);
  const directional = street[2] == null ? null : canonicalDirectional(street[2]);
  const streetName = componentText(street[3]);
  const streetType = canonicalStreetType(street[4]);
  if (!houseNumber || (street[2] != null && !directional) || !streetName || !streetType) return null;
  return { houseNumber, directional, streetName, streetType, city, state, postalCode };
}

/**
 * A controlled stored-address reconciliation may only add missing locality
 * components to the very same, unambiguous street core. It never rewrites an
 * already-complete address, fills an ambiguous street core, or treats a unit,
 * P.O. box, or service area as a public location.
 */
export function canSafelyCompleteStoredAddress(
  storedAddress: unknown,
  evidencedAddress: unknown,
): boolean {
  const evidenced = parseCompleteUsStreetAddress(evidencedAddress);
  if (!evidenced) return false;
  // A deliberately supplied null stored address is a separate absence case:
  // it may be set only from the complete first-party receipt validated above.
  // It never retains coordinates and never creates a map pin.
  if (normalizedText(storedAddress, 300) == null) return true;
  if (parseCompleteUsStreetAddress(storedAddress)) return false;
  const stored = parseIncompleteUsStreetAddress(storedAddress);
  if (!stored) return false;
  if (stored.houseNumber !== evidenced.houseNumber
      || stored.directional !== evidenced.directional
      || stored.streetName !== evidenced.streetName
      || stored.streetType !== evidenced.streetType) return false;
  if ((stored.city != null && stored.city !== evidenced.city)
      || (stored.state != null && stored.state !== evidenced.state)
      || (stored.postalCode != null && stored.postalCode !== evidenced.postalCode)) return false;
  return stored.city == null || stored.state == null || stored.postalCode == null;
}

function exactMapEvidenceAddressMatch(addressEvidence: EvidenceInput, mapPinEvidence: EvidenceInput): boolean {
  const firstParty = parseCompleteUsStreetAddress(addressEvidence.observedValue?.address);
  const query = parseCompleteUsStreetAddress(mapPinEvidence.observedValue?.queryAddress);
  const geocoder = normalizePhysicalAddressComponents(mapPinEvidence.observedValue?.addressComponents);
  if (mapPinEvidence.observedValue?.addressComponents != null) {
    if (!firstParty || !query || !geocoder) return false;
    return samePhysicalAddress(firstParty, query) && samePhysicalAddress(firstParty, geocoder);
  }
  const address = normalizedAddress(addressEvidence.observedValue?.address);
  const geocodedAddress = normalizedAddress(mapPinEvidence.observedValue?.formattedAddress);
  const queryAddress = normalizedAddress(mapPinEvidence.observedValue?.queryAddress);
  return Boolean(address && geocodedAddress && queryAddress && geocodedAddress === address && queryAddress === address);
}

function requireFiniteCoordinate(value: unknown, label: "latitude" | "longitude", minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`map pin evidence requires a finite numeric observedValue.${label}`);
  }
  return value;
}

function requireOfficialPresenceIdentity(
  observedValue: Record<string, unknown>,
  field: "official website" | "official social" | "address",
): void {
  const matchingSignals = Array.isArray(observedValue.matchingSignals)
    ? [...new Set(observedValue.matchingSignals.filter((value): value is string => typeof value === "string")
      .map((value) => value.trim()).filter((value) => IDENTITY_MATCHING_SIGNALS.has(value)))]
    : [];
  if (observedValue.identityMatch !== true || matchingSignals.length === 0) {
    throw new Error(`${field} evidence requires identityMatch: true and at least one concrete matching signal`);
  }
}

function validateEvidence(value: unknown, now: Date): EvidenceInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("evidence entries must be objects");
  }
  const raw = value as Record<string, unknown>;
  if (!EVIDENCE_FIELDS.has(raw.field as EvidenceField)) throw new Error("evidence field is invalid");
  if (!SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) throw new Error("evidence sourceKind is invalid");
  if (!["high", "medium", "low"].includes(raw.confidence as string)) throw new Error("evidence confidence is invalid");
  const sourceUrl = safeHttpsUrl(raw.sourceUrl, "evidence sourceUrl");
  const sourceLabel = normalizedText(raw.sourceLabel, 255);
  const observedAt = asTimestamp(raw.observedAt, "evidence observedAt", now, 1);
  const sourceExpiresAt = raw.sourceExpiresAt == null
    ? null
    : futureTimestamp(raw.sourceExpiresAt, "evidence sourceExpiresAt", now);
  const observedValue = raw.observedValue && typeof raw.observedValue === "object" && !Array.isArray(raw.observedValue)
    ? raw.observedValue as Record<string, unknown>
    : {};
  if (JSON.stringify(observedValue).length > 16_000) throw new Error("evidence observedValue is too large");

  if (raw.field === "official_website") {
    if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) {
      throw new Error("official website evidence must be captured from the business or owner-controlled presence");
    }
    const websiteUrl = safeHttpsUrl(observedValue.websiteUrl, "official website URL");
    if (isDirectoryOrMarketplaceUrl(websiteUrl) || OFFICIAL_SOCIAL_HOSTS.has(hostOf(websiteUrl))) {
      throw new Error("official website may not be a directory, marketplace, or social profile");
    }
    requireOfficialPresenceIdentity(observedValue, "official website");
  }
  if (raw.field === "official_social") {
    if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) {
      throw new Error("official social evidence must be captured from the business or owner-controlled social profile");
    }
    const profileUrl = safeHttpsUrl(observedValue.profileUrl, "official social profile URL");
    if (!OFFICIAL_SOCIAL_HOSTS.has(hostOf(profileUrl))) {
      throw new Error("official social profile must use an approved business-controlled social host");
    }
    if (isDirectoryOrMarketplaceUrl(sourceUrl)) {
      throw new Error("official social evidence may not use a directory or marketplace URL as its proof source");
    }
    // The social profile itself is valid evidence when its identity is checked;
    // social-first businesses are not required to maintain a separate domain.
    requireOfficialPresenceIdentity(observedValue, "official social");
  }
  if (raw.field === "address") {
    const address = normalizedText(observedValue.address, 300);
    if (!address) throw new Error("address evidence requires observedValue.address");
  }
  if (raw.field === "map_pin") {
    const latitude = Number(observedValue.latitude);
    const longitude = Number(observedValue.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("map pin evidence requires finite observedValue.latitude and observedValue.longitude");
    }
  }
  if (raw.field === "ownership" && raw.sourceKind === "official_geocoder") {
    throw new Error("ownership evidence may not use an official geocoder source");
  }
  if (raw.field === "map_pin" && raw.sourceKind !== "official_geocoder") {
    throw new Error("map pin evidence must use the approved geocoder source");
  }

  return {
    field: raw.field as EvidenceField,
    sourceKind: raw.sourceKind as EvidenceSourceKind,
    sourceUrl,
    sourceLabel,
    observedAt,
    sourceExpiresAt,
    confidence: raw.confidence as EvidenceInput["confidence"],
    observedValue,
  };
}

/**
 * Accepts only a map attachment that is anchored to an unchanged stored
 * address, a first-party address page, and an approved geocoder result for
 * that exact address. It deliberately cannot alter identity, ownership,
 * lifecycle, or recommendation eligibility.
 */
export function validateMapPinEvidenceReviewInput(value: unknown, now: Date): MapPinEvidenceReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("request body must be an object");
  const raw = value as Record<string, unknown>;
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) throw new Error("A 3–4,000 character decisionReason is required");
  const addressEvidence = validateEvidence(raw.addressEvidence, now);
  const mapPinEvidence = validateEvidence(raw.mapPinEvidence, now);
  if (addressEvidence.field !== "address") throw new Error("addressEvidence must document the address field");
  if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(addressEvidence.sourceKind)) {
    throw new Error("address evidence must be captured from the business or owner-controlled presence");
  }
  requireOfficialPresenceIdentity(addressEvidence.observedValue ?? {}, "address");
  if (mapPinEvidence.field !== "map_pin" || mapPinEvidence.sourceKind !== "official_geocoder") {
    throw new Error("mapPinEvidence must be an official-geocoder map pin receipt");
  }
  if (!APPROVED_GEOCODER_HOSTS.has(hostOf(mapPinEvidence.sourceUrl))) {
    throw new Error("map pin evidence must use an approved geocoder endpoint");
  }
  if (addressEvidence.observedValue?.addressType !== "physical" || addressEvidence.observedValue?.isServiceArea !== false) {
    throw new Error("address evidence must explicitly document a physical street address, not a service area");
  }
  requireFiniteCoordinate(mapPinEvidence.observedValue?.latitude, "latitude", -90, 90);
  requireFiniteCoordinate(mapPinEvidence.observedValue?.longitude, "longitude", -180, 180);
  if (mapPinEvidence.observedValue?.addressMatch !== true
      || !exactMapEvidenceAddressMatch(addressEvidence, mapPinEvidence)) {
    throw new Error("map pin evidence must record an exact approved-geocoder address match");
  }
  return {
    decisionReason,
    addressEvidence,
    mapPinEvidence,
  };
}

/**
 * This route is intentionally not a map action. It may complete a current
 * stored address only from an identity-matched first-party page, clears any
 * legacy coordinate pair, and leaves map/geocoder evidence absent for a later
 * independent review.
 */
export function validateStoredAddressReconciliationInput(
  value: unknown,
  now: Date,
): StoredAddressReconciliationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("request body must be an object");
  const raw = value as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(raw, "expectedStoredAddress")) {
    throw new Error("expectedStoredAddress is required for a fresh address reconciliation guard");
  }
  const expectedStoredAddress = raw.expectedStoredAddress === null
    ? null
    : normalizedText(raw.expectedStoredAddress, 300);
  if (raw.expectedStoredAddress !== null && !expectedStoredAddress) {
    throw new Error("expectedStoredAddress must be a non-empty stored address or explicit null");
  }
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) throw new Error("A 3–4,000 character decisionReason is required");
  const addressEvidence = validateEvidence(raw.addressEvidence, now);
  if (addressEvidence.field !== "address") throw new Error("addressEvidence must document the address field");
  if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(addressEvidence.sourceKind)) {
    throw new Error("address evidence must be captured from the business or owner-controlled presence");
  }
  requireOfficialPresenceIdentity(addressEvidence.observedValue ?? {}, "address");
  if (addressEvidence.observedValue?.addressType !== "physical" || addressEvidence.observedValue?.isServiceArea !== false) {
    throw new Error("address evidence must explicitly document a physical street address, not a service area");
  }
  if (!parseCompleteUsStreetAddress(addressEvidence.observedValue?.address)) {
    throw new Error("address reconciliation requires a complete US street address with city, state, and postal code");
  }
  return { expectedStoredAddress, decisionReason, addressEvidence };
}

export function storedAddressMatchesMapEvidence(storedAddress: unknown, input: MapPinEvidenceReviewInput): boolean {
  const stored = normalizedAddress(storedAddress);
  const evidenced = normalizedAddress(input.addressEvidence.observedValue?.address);
  const storedComponents = parseCompleteUsStreetAddress(storedAddress);
  if (!storedComponents) return false;
  if (stored && evidenced && stored === evidenced) return true;
  const evidencedComponents = parseCompleteUsStreetAddress(input.addressEvidence.observedValue?.address);
  return Boolean(storedComponents && evidencedComponents && samePhysicalAddress(storedComponents, evidencedComponents));
}

export function mapPinOnlyPatch(
  input: MapPinEvidenceReviewInput,
  addressEvidenceId: string,
  mapPinEvidenceId: string,
): Readonly<{ latitude: number; longitude: number; addressEvidenceId: string; mapPinEvidenceId: string }> {
  return Object.freeze({
    latitude: input.mapPinEvidence.observedValue?.latitude as number,
    longitude: input.mapPinEvidence.observedValue?.longitude as number,
    addressEvidenceId,
    mapPinEvidenceId,
  });
}

export function storedAddressOnlyPatch(
  input: StoredAddressReconciliationInput,
  addressEvidenceId: string,
): Readonly<{ address: string; addressEvidenceId: string }> {
  return Object.freeze({
    address: input.addressEvidence.observedValue?.address as string,
    addressEvidenceId,
  });
}

function validateWebsiteCleanup(value: unknown, now: Date): WebsiteCleanupInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("websiteCleanup must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (!WEBSITE_CLEANUP_STATUSES.has(raw.status as WebsiteCleanupStatus)) {
    throw new Error("websiteCleanup status is invalid");
  }
  const originalWebsite = safeHttpUrl(raw.originalWebsite, "websiteCleanup originalWebsite");
  const finalDestination = raw.finalDestination == null || raw.finalDestination === ""
    ? null
    : safeHttpUrl(raw.finalDestination, "websiteCleanup finalDestination");
  const evidenceSourceUrl = safeHttpsUrl(raw.evidenceSourceUrl, "websiteCleanup evidenceSourceUrl");
  const evidenceSummary = normalizedText(raw.evidenceSummary, 4_000);
  if (!evidenceSummary || evidenceSummary.length < 3) {
    throw new Error("websiteCleanup evidenceSummary is required");
  }
  return {
    status: raw.status as WebsiteCleanupStatus,
    originalWebsite,
    finalDestination,
    evidenceSourceUrl,
    evidenceSummary,
    checkedAt: asTimestamp(raw.checkedAt, "websiteCleanup checkedAt", now, 1),
  };
}

export function validateDocumentedDiscoveryReviewInput(value: unknown, now: Date): ReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("request body must be an object");
  const raw = value as Record<string, unknown>;
  if (!ELIGIBILITY_STATUSES.has(raw.eligibilityStatus as EligibilityStatus)) {
    throw new Error("eligibilityStatus is invalid");
  }
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) throw new Error("A 3–4,000 character decisionReason is required");
  const ownershipDesignations = Array.isArray(raw.ownershipDesignations)
    ? [...new Set(raw.ownershipDesignations.filter((value): value is string => typeof value === "string")
      .map((value) => value.trim()).filter(Boolean))]
    : [];
  if (ownershipDesignations.some((value) => !DESIGNATIONS.has(value.toLocaleLowerCase("en-US")))) {
    throw new Error("ownershipDesignations must use approved documented diaspora designations");
  }
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.map((item) => validateEvidence(item, now))
    : [];
  const websiteCleanup = raw.websiteCleanup == null
    ? undefined
    : validateWebsiteCleanup(raw.websiteCleanup, now);
  const counts = new Map<EvidenceField, number>();
  for (const item of evidence) counts.set(item.field, (counts.get(item.field) ?? 0) + 1);
  if ([...counts.values()].some((count) => count > 1)) throw new Error("submit at most one receipt per evidence field per decision");
  if (counts.has("map_pin")) {
    throw new Error("map pin evidence must use the dedicated audited map-evidence attachment route");
  }
  const eligibilityStatus = raw.eligibilityStatus as EligibilityStatus;
  const ownershipSourceExpiresAt = raw.ownershipSourceExpiresAt == null
    ? undefined
    : futureTimestamp(raw.ownershipSourceExpiresAt, "ownershipSourceExpiresAt", now);
  const reviewAfter = raw.reviewAfter == null
    ? undefined
    : futureTimestamp(raw.reviewAfter, "reviewAfter", now);
  const defaultReasonCode: DirectoryReconciliationReasonCode = eligibilityStatus === "qualified"
    ? websiteCleanup
      ? (`website_removed_${websiteCleanup.status}` as DirectoryReconciliationReasonCode)
      : counts.has("official_social") && !counts.has("official_website")
        ? "social_only_public_business"
        : "source_ownership_and_official_presence_verified"
    : "official_presence_unverified";
  const reconciliationReasonCode = raw.reconciliationReasonCode == null
    ? defaultReasonCode
    : String(raw.reconciliationReasonCode).trim();
  if (!isDirectoryReconciliationReasonCode(reconciliationReasonCode)) {
    throw new Error("reconciliationReasonCode is invalid");
  }
  const batchReference = normalizedText(raw.batchReference, 160) ?? undefined;

  if (eligibilityStatus === "qualified") {
    if (!counts.has("ownership") || (!counts.has("official_website") && !counts.has("official_social"))) {
      throw new Error("qualified eligibility requires ownership plus an official website or official social receipt");
    }
    if (ownershipDesignations.length === 0) throw new Error("qualified eligibility requires a documented ownership designation");
    if (!ownershipSourceExpiresAt || !reviewAfter) {
      throw new Error("qualified eligibility requires ownershipSourceExpiresAt and reviewAfter");
    }
    if (counts.has("map_pin") && !counts.has("address")) {
      throw new Error("map pin qualification requires a documented physical-address receipt");
    }
  } else if ((evidence.length > 0 || ownershipDesignations.length > 0 || ownershipSourceExpiresAt || reviewAfter) && !websiteCleanup) {
    throw new Error("non-qualified decisions retain no active recommendation receipts; submit the review state only");
  }

  return {
    eligibilityStatus,
    decisionReason,
    reconciliationReasonCode,
    batchReference,
    ownershipDesignations,
    ownershipSourceExpiresAt,
    reviewAfter,
    evidence,
    websiteCleanup,
  };
}

function directoryReconciliationOutcome(input: ReviewInput): Readonly<{
  state: DirectoryReconciliationState;
  reasonCode: DirectoryReconciliationReasonCode;
  presenceStatus: DirectoryReconciliationPresenceStatus;
  ownershipStatus: DirectoryReconciliationOwnershipStatus;
  recommendedAction: DirectoryReconciliationAction;
}> {
  const evidenceByField = new Map((input.evidence ?? []).map((evidence) => [evidence.field, evidence]));
  const hasWebsite = evidenceByField.has("official_website");
  const hasSocial = evidenceByField.has("official_social");
  const presenceStatus: DirectoryReconciliationPresenceStatus = hasWebsite && hasSocial
    ? "valid_website_and_social"
    : hasWebsite
      ? "valid_website"
      : hasSocial
        ? "valid_social"
        : input.websiteCleanup
          ? (`website_removed_${input.websiteCleanup.status}` as DirectoryReconciliationPresenceStatus)
          : "official_presence_unverified";
  const ownershipEvidence = evidenceByField.get("ownership");
  const ownershipStatus: DirectoryReconciliationOwnershipStatus = input.eligibilityStatus === "qualified"
    ? (ownershipEvidence?.sourceKind === "business_official" || ownershipEvidence?.sourceKind === "owner_official")
      ? "officially_stated"
      : "source_documented"
    : input.reconciliationReasonCode === "identity_conflict"
      ? "ownership_conflict"
      : "ownership_unverified";
  if (input.eligibilityStatus === "qualified") {
    return {
      state: "reviewed_qualified",
      reasonCode: input.reconciliationReasonCode,
      presenceStatus,
      ownershipStatus,
      recommendedAction: "qualify_kinfolk_current",
    };
  }
  const archiveActionByReason: Partial<Record<DirectoryReconciliationReasonCode, DirectoryReconciliationAction>> = {
    confirmed_closed: "archive_confirmed_closed",
    confirmed_duplicate: "archive_confirmed_duplicate",
    confirmed_fraud_or_unsafe: "archive_confirmed_fraud_or_unsafe",
    documented_safety_or_legal_removal: "archive_documented_safety_or_legal",
  };
  const archiveAction = archiveActionByReason[input.reconciliationReasonCode];
  return {
    state: archiveAction ? "reversible_public_hold" : "requires_reconciliation",
    reasonCode: input.reconciliationReasonCode,
    presenceStatus,
    ownershipStatus,
    recommendedAction: archiveAction ?? "reconcile",
  };
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    return false;
  }
  return true;
}

export function registerDocumentedDiscoveryReviewRoutes(app: Express): void {
  /** Admin-only review queue; this is evidence work, never a public catalogue read. */
  app.get("/api/admin/business-discovery/review-queue", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const state = typeof req.query.state === "string" ? req.query.state.trim().toUpperCase() : "";
    const limit = Math.min(250, Math.max(1, Number.parseInt(String(req.query.limit ?? "100"), 10) || 100));
    const params: unknown[] = [];
    const conditions = ["b.status NOT IN ('removed', 'deleted')"];
    if (city) { params.push(city); conditions.push(`LOWER(BTRIM(COALESCE(b.city, ''))) = LOWER(BTRIM($${params.length}))`); }
    if (state) { params.push(state); conditions.push(`UPPER(BTRIM(COALESCE(b.state, ''))) = $${params.length}`); }
    params.push(limit);
    try {
      const { rows } = await pool.query(
        `SELECT b.id, b.name, b.city, b.state, b.website, b.instagram, b.facebook, b.tiktok,
                b.address, b.latitude, b.longitude, b.ownership_designations, b.research_source_url,
                b.research_source_label, b.listing_status, b.status,
                e.eligibility_status, e.ownership_source_expires_at, e.review_after, e.updated_at
           FROM businesses b
           LEFT JOIN business_discovery_eligibility e ON e.business_id::text = b.id::text
          WHERE ${conditions.join(" AND ")}
          ORDER BY CASE WHEN e.eligibility_status = 'qualified' THEN 1 ELSE 0 END,
                   b.city ASC NULLS LAST, b.name ASC
          LIMIT $${params.length}`,
        params,
      );
      res.json({ policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION, records: rows });
    } catch (error) {
      req.log.error({ error }, "Failed to load documented discovery review queue");
      res.status(500).json({ error: "Failed to load review queue" });
    }
  });

  /**
   * Read-only, paginated evidence crosswalk for the current public population.
   * It never upgrades eligibility or creates a pin; it names each missing
   * map-only receipt/linkage condition for auditable pilot preparation.
   */
  app.get("/api/admin/business-map-readiness-crosswalk", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const state = typeof req.query.state === "string" ? req.query.state.trim().toUpperCase() : "";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
    const limit = Math.min(500, Math.max(1, Number.parseInt(String(req.query.limit ?? "250"), 10) || 250));
    const params: unknown[] = [];
    const conditions = ["TRUE"];
    if (city) { params.push(city); conditions.push(`LOWER(BTRIM(COALESCE(b.city, ''))) = LOWER(BTRIM($${params.length}))`); }
    if (state) { params.push(state); conditions.push(`UPPER(BTRIM(COALESCE(b.state, ''))) = $${params.length}`); }
    if (cursor) { params.push(cursor); conditions.push(`b.id > $${params.length}`); }
    params.push(limit + 1);
    try {
      const { rows } = await pool.query<Record<string, unknown>>(
        `SELECT b.id, b.name, b.city, b.state, b.status, b.listing_status,
                COALESCE(b.is_duplicate, false) AS is_duplicate, b.duplicate_of_id,
                b.address, b.latitude, b.longitude,
                to_jsonb(b)->>'country' AS country,
                to_jsonb(b)->>'created_at' AS business_created_at,
                to_jsonb(b)->>'service_area' AS service_area,
                to_jsonb(b)->>'public_location_kind' AS public_location_kind,
                EXISTS (
                  SELECT 1 FROM business_duplicate_resolutions resolution
                   WHERE resolution.superseded_business_id = b.id
                ) AS is_superseded,
                e.eligibility_status, e.policy_version, e.identity_evidence_id,
                e.ownership_evidence_id, e.official_website_evidence_id,
                e.official_social_evidence_id, e.address_evidence_id,
                e.map_pin_evidence_id, e.ownership_source_expires_at, e.review_after,
                e.decision_reason AS eligibility_decision_reason,
                ledger.reconciliation_state, ledger.reason_code AS reconciliation_reason_code,
                ledger.recommended_action AS reconciliation_recommended_action,
                EXISTS (
                  SELECT 1
                    FROM business_legacy_map_location_attestations legacy_location
                   WHERE legacy_location.business_id::text = b.id::text
                     AND COALESCE((
                       SELECT legacy_event.action
                         FROM business_legacy_map_location_attestation_events legacy_event
                        WHERE legacy_event.attestation_id = legacy_location.id
                        ORDER BY legacy_event.created_at DESC, legacy_event.id DESC
                        LIMIT 1
                     ), 'active') <> 'revoked'
                ) AS legacy_map_location_attested,
                ownership_receipt.source_url AS ownership_source_url,
                official_website_receipt.source_url AS official_website_source_url,
                official_social_receipt.source_url AS official_social_source_url,
                address_receipt.source_url AS address_source_url,
                map_receipt.source_url AS map_source_url
           FROM public.public_businesses b
           LEFT JOIN business_discovery_eligibility e ON e.business_id::text = b.id::text
           LEFT JOIN business_directory_reconciliation_ledger ledger ON ledger.business_id::text = b.id::text
           LEFT JOIN business_profile_evidence_receipts ownership_receipt ON ownership_receipt.id = e.ownership_evidence_id
           LEFT JOIN business_profile_evidence_receipts official_website_receipt ON official_website_receipt.id = e.official_website_evidence_id
           LEFT JOIN business_profile_evidence_receipts official_social_receipt ON official_social_receipt.id = e.official_social_evidence_id
           LEFT JOIN business_profile_evidence_receipts address_receipt ON address_receipt.id = e.address_evidence_id
           LEFT JOIN business_profile_evidence_receipts map_receipt ON map_receipt.id = e.map_pin_evidence_id
          WHERE ${conditions.join(" AND ")}
          ORDER BY b.id ASC
          LIMIT $${params.length}`,
        params,
      );
      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);
      const records = page.map((row) => {
        const candidate: MapReadinessCandidate = {
          id: String(row.id), name: String(row.name ?? ""), city: row.city as string | null,
          state: row.state as string | null, status: row.status as string | null,
          listingStatus: row.listing_status as string | null, isDuplicate: Boolean(row.is_duplicate),
          duplicateOfId: row.duplicate_of_id as string | null, isSuperseded: Boolean(row.is_superseded),
          address: row.address as string | null, serviceArea: row.service_area as string | null,
          publicLocationKind: row.public_location_kind as string | null,
          latitude: row.latitude as string | number | null, longitude: row.longitude as string | number | null,
          eligibilityStatus: row.eligibility_status as string | null, policyVersion: row.policy_version as string | null,
          identityEvidenceId: row.identity_evidence_id as string | null,
          ownershipEvidenceId: row.ownership_evidence_id as string | null,
          officialWebsiteEvidenceId: row.official_website_evidence_id as string | null,
          officialSocialEvidenceId: row.official_social_evidence_id as string | null,
          addressEvidenceId: row.address_evidence_id as string | null,
          mapPinEvidenceId: row.map_pin_evidence_id as string | null,
          legacyMapLocationAttested: Boolean(row.legacy_map_location_attested),
          ownershipSourceExpiresAt: row.ownership_source_expires_at as string | null,
          reviewAfter: row.review_after as string | null,
          eligibilityDecisionReason: row.eligibility_decision_reason as string | null,
          reconciliationState: row.reconciliation_state as string | null,
          reconciliationReasonCode: row.reconciliation_reason_code as string | null,
          reconciliationRecommendedAction: row.reconciliation_recommended_action as string | null,
        };
        return {
          ...candidate,
          country: typeof row.country === "string" ? row.country : null,
          businessCreatedAt: typeof row.business_created_at === "string" ? row.business_created_at : null,
          assessment: assessMapReadiness(candidate),
          evidenceReferences: {
            ownership: { id: candidate.ownershipEvidenceId, sourceUrl: row.ownership_source_url ?? null },
            officialWebsite: { id: candidate.officialWebsiteEvidenceId, sourceUrl: row.official_website_source_url ?? null },
            officialSocial: { id: candidate.officialSocialEvidenceId, sourceUrl: row.official_social_source_url ?? null },
            address: { id: candidate.addressEvidenceId, sourceUrl: row.address_source_url ?? null },
            mapPin: { id: candidate.mapPinEvidenceId, sourceUrl: row.map_source_url ?? null },
          },
        };
      });
      res.json({
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        scope: "current_public_businesses",
        records,
        nextCursor: hasMore ? String(page.at(-1)?.id ?? "") : null,
      });
    } catch (error) {
      req.log.error({ error }, "Failed to load map readiness crosswalk");
      res.status(500).json({ error: "Failed to load map readiness crosswalk" });
    }
  });

  /**
   * Sole mutation path for the eligibility gate. It preserves raw receipts and
   * an immutable before/after audit event. On qualification it enriches only
   * the official website/social and sourced address fields named in the new
   * evidence; it never infers ownership, changes map coordinates, claim state,
   * or listing lifecycle.
   */
  app.put("/api/admin/businesses/:id/documented-discovery-eligibility", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: ReviewInput;
    try {
      input = validateDocumentedDiscoveryReviewInput(req.body, new Date());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid review request" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingBusiness = await client.query<{ id: string; name: string; website: string | null }>(
        `SELECT id, name, website FROM businesses
          WHERE id = $1 AND status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      if (input.websiteCleanup) {
        const storedWebsite = existingBusiness.rows[0].website?.trim() ?? "";
        const submittedWebsite = input.websiteCleanup.originalWebsite.trim();
        const normalize = (value: string) => value.replace(/\/$/, "").toLocaleLowerCase("en-US");
        if (!storedWebsite || normalize(storedWebsite) !== normalize(submittedWebsite)) {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "websiteCleanup originalWebsite does not match the currently stored public website" });
          return;
        }
      }
      const prior = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(e) AS state FROM business_discovery_eligibility e WHERE e.business_id = $1`,
        [businessId],
      );
      const priorReconciliation = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(ledger) AS state
           FROM business_directory_reconciliation_ledger ledger
          WHERE ledger.business_id = $1
          FOR UPDATE`,
        [businessId],
      );
      const evidenceIds = new Map<EvidenceField, string>();
      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      for (const evidence of input.evidence ?? []) {
        const id = randomUUID();
        evidenceIds.set(evidence.field, id);
        await client.query(
          `INSERT INTO business_profile_evidence_receipts (
             id, business_id, field_name, source_kind, source_url, source_label,
             observed_at, source_expires_at, confidence, observed_value, captured_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb, $11)`,
          [
            id, businessId, evidence.field, evidence.sourceKind, evidence.sourceUrl, evidence.sourceLabel,
            evidence.observedAt, evidence.sourceExpiresAt ?? null, evidence.confidence,
            JSON.stringify(evidence.observedValue ?? {}), actorId,
          ],
        );
      }
      // Enrich only fields that the active review receipt expressly supports.
      // This replaces an old directory/marketplace website with an official
      // domain and never guesses a social handle, address, or ownership label.
      if (input.eligibilityStatus === "qualified" || input.websiteCleanup) {
        const evidenceByField = new Map((input.evidence ?? []).map((evidence) => [evidence.field, evidence]));
        const officialWebsite = evidenceByField.get("official_website")?.observedValue?.websiteUrl;
        const officialSocial = evidenceByField.get("official_social")?.observedValue?.profileUrl;
        const sourceAddress = evidenceByField.get("address")?.observedValue?.address;
        const profilePatch: Record<string, string | null> = {
          website: typeof officialWebsite === "string" ? officialWebsite : null,
          instagram: null,
          facebook: null,
          tiktok: null,
          address: typeof sourceAddress === "string" ? sourceAddress.trim() : null,
        };
        if (typeof officialSocial === "string") {
          const host = hostOf(officialSocial);
          if (host.endsWith("instagram.com")) profilePatch.instagram = officialSocial;
          if (host.endsWith("facebook.com")) profilePatch.facebook = officialSocial;
          if (host.endsWith("tiktok.com")) profilePatch.tiktok = officialSocial;
          // LinkedIn, YouTube, and other approved social receipts remain in the
          // immutable eligibility evidence even though the legacy profile table
          // has no matching URL columns. They are still complete presence proof.
        }
        await client.query(
          `UPDATE businesses
              SET website = CASE WHEN $2 THEN $3 ELSE COALESCE($3, website) END,
                  instagram = COALESCE($4, instagram),
                  facebook = COALESCE($5, facebook),
                  tiktok = COALESCE($6, tiktok),
                  address = COALESCE($7, address),
                  latitude = CASE WHEN $8 THEN NULL ELSE latitude END,
                  longitude = CASE WHEN $8 THEN NULL ELSE longitude END,
                  website_cleanup_status = CASE WHEN $2 THEN $9 ELSE website_cleanup_status END,
                  website_cleanup_at = CASE WHEN $2 THEN now() ELSE website_cleanup_at END,
                  updated_at = now()
            WHERE id = $1`,
          [
            businessId,
            Boolean(input.websiteCleanup),
            profilePatch.website,
            profilePatch.instagram,
            profilePatch.facebook,
            profilePatch.tiktok,
            profilePatch.address,
            profilePatch.address !== null,
            input.websiteCleanup?.status ?? null,
          ],
        );
      }
      if (input.websiteCleanup) {
        await client.query(
          `INSERT INTO business_website_cleanup_audit_events (
             id, business_id, original_website, final_destination, cleanup_status,
             reason, evidence_source_url, evidence_summary, checked_at, actor_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10)`,
          [
            randomUUID(), businessId, input.websiteCleanup.originalWebsite,
            input.websiteCleanup.finalDestination, input.websiteCleanup.status,
            input.decisionReason, input.websiteCleanup.evidenceSourceUrl,
            JSON.stringify({ summary: input.websiteCleanup.evidenceSummary }),
            input.websiteCleanup.checkedAt, actorId,
          ],
        );
      }
      const existing = prior.rows[0]?.state ?? {};
      const retainedId = (column: string) => typeof existing[column] === "string" ? existing[column] : null;
      const next = await client.query<{ state: Record<string, unknown> }>(
        `INSERT INTO business_discovery_eligibility (
           business_id, eligibility_status, policy_version, identity_evidence_id,
           ownership_evidence_id, official_website_evidence_id, official_social_evidence_id,
           address_evidence_id, map_pin_evidence_id, ownership_designations,
           ownership_source_expires_at, review_after, decision_reason, decided_by, decided_at, updated_at
         ) VALUES (
           $1, $2, $3, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8::uuid, $9::uuid,
           $10::jsonb, $11::timestamptz, $12::timestamptz, $13, $14, now(), now()
         ) ON CONFLICT (business_id) DO UPDATE SET
           eligibility_status = EXCLUDED.eligibility_status,
           policy_version = EXCLUDED.policy_version,
           identity_evidence_id = EXCLUDED.identity_evidence_id,
           ownership_evidence_id = EXCLUDED.ownership_evidence_id,
           official_website_evidence_id = EXCLUDED.official_website_evidence_id,
           official_social_evidence_id = EXCLUDED.official_social_evidence_id,
           address_evidence_id = EXCLUDED.address_evidence_id,
           map_pin_evidence_id = EXCLUDED.map_pin_evidence_id,
           ownership_designations = EXCLUDED.ownership_designations,
           ownership_source_expires_at = EXCLUDED.ownership_source_expires_at,
           review_after = EXCLUDED.review_after,
           decision_reason = EXCLUDED.decision_reason,
           decided_by = EXCLUDED.decided_by,
           decided_at = now(),
           updated_at = now()
         RETURNING to_jsonb(business_discovery_eligibility) AS state`,
        [
          businessId,
          input.eligibilityStatus,
          DOCUMENTED_DISCOVERY_POLICY_VERSION,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("identity") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("ownership") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("official_website") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("official_social") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("address") ?? null : null,
          input.eligibilityStatus === "qualified"
            ? (evidenceIds.get("address") ? null : retainedId("map_pin_evidence_id"))
            : null,
          JSON.stringify(input.eligibilityStatus === "qualified" ? input.ownershipDesignations ?? [] : []),
          input.eligibilityStatus === "qualified" ? input.ownershipSourceExpiresAt : null,
          input.eligibilityStatus === "qualified" ? input.reviewAfter : null,
          input.decisionReason,
          actorId,
        ],
      );
      const action = input.eligibilityStatus === "qualified" && existing.eligibility_status === "qualified"
        ? "requalified"
        : input.eligibilityStatus;
      await client.query(
        `INSERT INTO business_discovery_eligibility_audit_events (
           id, business_id, action, actor_id, reason, before_state, after_state
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(), businessId, action, actorId, input.decisionReason,
          JSON.stringify(existing), JSON.stringify(next.rows[0]?.state ?? {}),
        ],
      );
      const reconciliation = directoryReconciliationOutcome(input);
      const reconciliationEvidenceIds = [...evidenceIds.values()];
      const reconciliationNext = await client.query<{ state: Record<string, unknown> }>(
        `INSERT INTO business_directory_reconciliation_ledger (
           business_id, reconciliation_state, reason_code, presence_status,
           ownership_status, recommended_action, evidence_receipt_ids,
           batch_reference, reviewed_at, reviewed_by, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7::jsonb, $8, now(), $9, now()
         ) ON CONFLICT (business_id) DO UPDATE SET
           reconciliation_state = EXCLUDED.reconciliation_state,
           reason_code = EXCLUDED.reason_code,
           presence_status = EXCLUDED.presence_status,
           ownership_status = EXCLUDED.ownership_status,
           recommended_action = EXCLUDED.recommended_action,
           evidence_receipt_ids = EXCLUDED.evidence_receipt_ids,
           batch_reference = EXCLUDED.batch_reference,
           reviewed_at = now(),
           reviewed_by = EXCLUDED.reviewed_by,
           updated_at = now()
         RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
        [
          businessId, reconciliation.state, reconciliation.reasonCode,
          reconciliation.presenceStatus, reconciliation.ownershipStatus,
          reconciliation.recommendedAction, JSON.stringify(reconciliationEvidenceIds),
          input.batchReference ?? null, actorId,
        ],
      );
      await client.query(
        `INSERT INTO business_directory_reconciliation_audit_events (
           id, business_id, action, actor_user_id, reason_code, reason,
           evidence_receipt_ids, before_state, after_state
         ) VALUES ($1, $2, 'review', $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)`,
        [
          randomUUID(), businessId, actorId, reconciliation.reasonCode,
          input.decisionReason, JSON.stringify(reconciliationEvidenceIds),
          JSON.stringify(priorReconciliation.rows[0]?.state ?? {}),
          JSON.stringify(reconciliationNext.rows[0]?.state ?? {}),
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        eligibility: next.rows[0]?.state ?? null,
        reconciliation: reconciliationNext.rows[0]?.state ?? null,
        message: input.eligibilityStatus === "qualified"
          ? "Profile is qualified for documented recommendation surfaces until its next evidence review."
          : "Profile is retained for direct named lookup and excluded from ordinary recommendation surfaces.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to record documented discovery eligibility");
      res.status(500).json({ error: "Failed to record discovery review" });
    } finally {
      client.release();
    }
  });

  /**
   * Address-only control path for legitimate records whose historical stored
   * address lacks locality components. It is deliberately separate from the
   * map route: it adds one first-party address receipt, clears imported
   * coordinates, and leaves map evidence empty for a later geocoder review.
   */
  app.put("/api/admin/businesses/:id/stored-address-evidence", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: StoredAddressReconciliationInput;
    try {
      input = validateStoredAddressReconciliationInput(req.body, new Date());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid stored-address reconciliation request" });
      return;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingBusiness = await client.query<{
        id: string;
        name: string;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
        is_duplicate: boolean;
        duplicate_of_id: string | null;
        is_superseded: boolean;
      }>(
        `SELECT b.id, b.name, b.address, b.latitude, b.longitude,
                COALESCE(b.is_duplicate, false) AS is_duplicate,
                b.duplicate_of_id,
                EXISTS (
                  SELECT 1 FROM business_duplicate_resolutions duplicate_resolution
                   WHERE duplicate_resolution.superseded_business_id = b.id
                ) AS is_superseded
           FROM businesses b
          WHERE b.id = $1 AND b.status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      const business = existingBusiness.rows[0];
      if (business.is_duplicate || business.duplicate_of_id || business.is_superseded) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Stored address evidence may be reconciled only on the existing canonical business record" });
        return;
      }
      if (normalizedAddress(business.address) !== normalizedAddress(input.expectedStoredAddress)) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The stored address changed after the supplied read-before-write snapshot; refresh before reconciliation" });
        return;
      }
      if (!canSafelyCompleteStoredAddress(business.address, input.addressEvidence.observedValue?.address)) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The first-party address may only complete the same incomplete stored street core; conflicting or already-complete addresses require separate review" });
        return;
      }
      const activeEligibility = await client.query<{
        state: Record<string, unknown>;
        map_pin_evidence_id: string | null;
      }>(
        `SELECT to_jsonb(e) AS state, e.map_pin_evidence_id::text
           FROM business_discovery_eligibility e
          WHERE e.business_id = $1
            AND e.eligibility_status = 'qualified'
            AND e.identity_evidence_id IS NOT NULL
            AND e.ownership_evidence_id IS NOT NULL
            AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
            AND e.ownership_source_expires_at > now()
            AND e.review_after > now()
          FOR UPDATE`,
        [businessId],
      );
      if (activeEligibility.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "An active documented eligibility record is required before stored-address reconciliation" });
        return;
      }
      if (activeEligibility.rows[0].map_pin_evidence_id) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "A record with audited map evidence cannot use stored-address reconciliation; address corrections require a separate review" });
        return;
      }
      const priorLedger = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(ledger) AS state
           FROM business_directory_reconciliation_ledger ledger
          WHERE ledger.business_id = $1
          FOR UPDATE`,
        [businessId],
      );
      if (priorLedger.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "A reconciliation ledger record is required before stored-address reconciliation" });
        return;
      }
      const addressAuditSchema = await client.query<{ ready: boolean }>(
        `SELECT EXISTS (
           SELECT 1
             FROM pg_constraint constraint_record
            WHERE constraint_record.conrelid = 'business_discovery_eligibility_audit_events'::regclass
              AND constraint_record.contype = 'c'
              AND pg_get_constraintdef(constraint_record.oid) LIKE '%address_reconciled%'
         ) AS ready`,
      );
      if (!addressAuditSchema.rows[0]?.ready) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Stored-address reconciliation is unavailable until the separately reviewed immutable audit-schema migration is applied" });
        return;
      }
      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      const addressEvidenceId = randomUUID();
      const patch = storedAddressOnlyPatch(input, addressEvidenceId);
      await client.query(
        `INSERT INTO business_profile_evidence_receipts (
           id, business_id, field_name, source_kind, source_url, source_label,
           observed_at, source_expires_at, confidence, observed_value, captured_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb, $11)`,
        [
          addressEvidenceId, businessId, input.addressEvidence.field, input.addressEvidence.sourceKind,
          input.addressEvidence.sourceUrl, input.addressEvidence.sourceLabel, input.addressEvidence.observedAt,
          input.addressEvidence.sourceExpiresAt ?? null, input.addressEvidence.confidence,
          JSON.stringify(input.addressEvidence.observedValue ?? {}), actorId,
        ],
      );
      const nextBusiness = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE businesses
            SET address = $2,
                latitude = NULL,
                longitude = NULL
          WHERE id = $1
            AND address IS NOT DISTINCT FROM $3
          RETURNING to_jsonb(businesses) AS state`,
        [businessId, patch.address, business.address],
      );
      if (nextBusiness.rows.length !== 1) throw new Error("stored-address compare-and-set guard failed");
      const nextEligibility = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_discovery_eligibility
            SET address_evidence_id = $2::uuid
          WHERE business_id = $1
          RETURNING to_jsonb(business_discovery_eligibility) AS state`,
        [businessId, patch.addressEvidenceId],
      );
      await client.query(
        `INSERT INTO business_discovery_eligibility_audit_events (
           id, business_id, action, actor_id, reason, before_state, after_state
         ) VALUES ($1, $2, 'address_reconciled', $3, $4, $5::jsonb, $6::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason,
          JSON.stringify({ business, eligibility: activeEligibility.rows[0].state }),
          JSON.stringify({ business: nextBusiness.rows[0].state, eligibility: nextEligibility.rows[0]?.state ?? {} }),
        ],
      );
      const nextLedger = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_directory_reconciliation_ledger
            SET evidence_receipt_ids = evidence_receipt_ids || $2::jsonb
          WHERE business_id = $1
          RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
        [businessId, JSON.stringify([addressEvidenceId])],
      );
      await client.query(
        `INSERT INTO business_directory_reconciliation_audit_events (
           id, business_id, action, actor_user_id, reason_code, reason,
           evidence_receipt_ids, before_state, after_state
         ) VALUES ($1, $2, 'review', $3, 'address_reconciled_first_party', $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason, JSON.stringify([addressEvidenceId]),
          JSON.stringify(priorLedger.rows[0].state), JSON.stringify(nextLedger.rows[0]?.state ?? {}),
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        addressEvidence: { addressEvidenceId },
        message: "First-party stored address reconciled; imported coordinates were cleared and no map pin was created.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to reconcile stored business address");
      res.status(500).json({ error: "Failed to reconcile stored business address" });
    } finally {
      client.release();
    }
  });

  /**
   * Map-only control path. It is intentionally separate from eligibility
   * review so an address/geocode repair cannot requalify a business, change a
   * public profile field, or carry identity/contact evidence across records.
   */
  app.put("/api/admin/businesses/:id/map-pin-evidence", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: MapPinEvidenceReviewInput;
    try {
      input = validateMapPinEvidenceReviewInput(req.body, new Date());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid map evidence request" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingBusiness = await client.query<{
        id: string;
        name: string;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
        is_duplicate: boolean;
        duplicate_of_id: string | null;
        is_superseded: boolean;
      }>(
        `SELECT b.id, b.name, b.address, b.latitude, b.longitude,
                COALESCE(b.is_duplicate, false) AS is_duplicate,
                b.duplicate_of_id,
                EXISTS (
                  SELECT 1 FROM business_duplicate_resolutions duplicate_resolution
                   WHERE duplicate_resolution.superseded_business_id = b.id
                ) AS is_superseded
           FROM businesses b
          WHERE b.id = $1 AND b.status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      if (existingBusiness.rows[0].is_duplicate || existingBusiness.rows[0].duplicate_of_id || existingBusiness.rows[0].is_superseded) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Map evidence may be attached only to the existing canonical business record" });
        return;
      }
      const activeEligibility = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(e) AS state
           FROM business_discovery_eligibility e
          WHERE e.business_id = $1
            AND e.eligibility_status = 'qualified'
            AND e.identity_evidence_id IS NOT NULL
            AND e.ownership_evidence_id IS NOT NULL
            AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
            AND e.ownership_source_expires_at > now()
            AND e.review_after > now()
          FOR UPDATE`,
        [businessId],
      );
      if (activeEligibility.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "An active documented eligibility record is required before a map pin can be attached" });
        return;
      }
      if (!storedAddressMatchesMapEvidence(existingBusiness.rows[0].address, input)) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The evidenced physical address must exactly match the currently stored business address; address changes require separate review" });
        return;
      }
      const priorLedger = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(ledger) AS state
           FROM business_directory_reconciliation_ledger ledger
          WHERE ledger.business_id = $1
          FOR UPDATE`,
        [businessId],
      );
      if (priorLedger.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "A reconciliation ledger record is required before a map pin can be attached" });
        return;
      }
      // Explicit feature-release mode intentionally does not run startup
      // migrations. Do not write a map coordinate unless the immutable audit
      // schema has already been deliberately applied by an authorized release.
      const mapAuditSchema = await client.query<{ ready: boolean }>(
        `SELECT EXISTS (
           SELECT 1
             FROM pg_constraint constraint_record
            WHERE constraint_record.conrelid = 'business_discovery_eligibility_audit_events'::regclass
              AND constraint_record.contype = 'c'
              AND pg_get_constraintdef(constraint_record.oid) LIKE '%map_pin_attached%'
         ) AS ready`,
      );
      if (!mapAuditSchema.rows[0]?.ready) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Audited map evidence is unavailable until the separately reviewed audit-schema migration is applied" });
        return;
      }

      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      const addressEvidenceId = randomUUID();
      const mapPinEvidenceId = randomUUID();
      const patch = mapPinOnlyPatch(input, addressEvidenceId, mapPinEvidenceId);
      for (const [id, evidence] of [[addressEvidenceId, input.addressEvidence], [mapPinEvidenceId, input.mapPinEvidence]] as const) {
        await client.query(
          `INSERT INTO business_profile_evidence_receipts (
             id, business_id, field_name, source_kind, source_url, source_label,
             observed_at, source_expires_at, confidence, observed_value, captured_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb, $11)`,
          [
            id, businessId, evidence.field, evidence.sourceKind, evidence.sourceUrl, evidence.sourceLabel,
            evidence.observedAt, evidence.sourceExpiresAt ?? null, evidence.confidence,
            JSON.stringify(evidence.observedValue ?? {}), actorId,
          ],
        );
      }
      await client.query(
        `UPDATE businesses
            SET latitude = $2::numeric,
                longitude = $3::numeric
          WHERE id = $1`,
        [businessId, String(patch.latitude), String(patch.longitude)],
      );
      const nextEligibility = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_discovery_eligibility
            SET address_evidence_id = $2::uuid,
                map_pin_evidence_id = $3::uuid
          WHERE business_id = $1
          RETURNING to_jsonb(business_discovery_eligibility) AS state`,
        [businessId, patch.addressEvidenceId, patch.mapPinEvidenceId],
      );
      await client.query(
        `INSERT INTO business_discovery_eligibility_audit_events (
           id, business_id, action, actor_id, reason, before_state, after_state
         ) VALUES ($1, $2, 'map_pin_attached', $3, $4, $5::jsonb, $6::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason,
          JSON.stringify(activeEligibility.rows[0].state), JSON.stringify(nextEligibility.rows[0]?.state ?? {}),
        ],
      );
      const nextLedger = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_directory_reconciliation_ledger
            SET evidence_receipt_ids = evidence_receipt_ids || $2::jsonb
          WHERE business_id = $1
          RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
        [businessId, JSON.stringify([addressEvidenceId, mapPinEvidenceId])],
      );
      await client.query(
        `INSERT INTO business_directory_reconciliation_audit_events (
           id, business_id, action, actor_user_id, reason_code, reason,
           evidence_receipt_ids, before_state, after_state
         ) VALUES ($1, $2, 'review', $3, 'source_ownership_and_official_presence_verified', $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason,
          JSON.stringify([addressEvidenceId, mapPinEvidenceId]),
          JSON.stringify(priorLedger.rows[0].state), JSON.stringify(nextLedger.rows[0]?.state ?? {}),
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        mapEvidence: { addressEvidenceId, mapPinEvidenceId },
        message: "Audited map evidence attached without changing eligibility, ownership, lifecycle, contacts, or address.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to attach audited map pin evidence");
      res.status(500).json({ error: "Failed to attach audited map pin evidence" });
    } finally {
      client.release();
    }
  });

  /**
   * Controlled restoration for a location that was structurally mappable before
   * the documented map-receipt gate. This deliberately writes no profile field,
   * ownership evidence, eligibility field, ordinary map receipt, or coordinate.
   * Its only output is an immutable statement that the stored snapshot was
   * reviewed for one named manifest row; it can later be revoked or restored.
   */
  app.put("/api/admin/businesses/:id/legacy-map-location-attestation", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: ReturnType<typeof validateLegacyMapLocationAttestationInput>;
    try {
      input = validateLegacyMapLocationAttestationInput(req.body);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid legacy map location attestation" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const currentBusiness = await client.query<{
        id: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        latitude: string | number | null;
        longitude: string | number | null;
        created_at: Date | null;
        service_area: string | null;
        public_location_kind: string | null;
      }>(
        `SELECT b.id, b.address, b.city, b.state, b.country, b.latitude, b.longitude, b.created_at,
                to_jsonb(b)->>'service_area' AS service_area,
                to_jsonb(b)->>'public_location_kind' AS public_location_kind
           FROM businesses b
          WHERE b.id = $1
          FOR UPDATE`,
        [businessId],
      );
      const current = currentBusiness.rows[0];
      if (!current) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      const publicCanonical = await client.query<{ id: string }>(
        `SELECT id FROM public.public_businesses WHERE id = $1`,
        [businessId],
      );
      if (publicCanonical.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Legacy map restoration is available only to the current canonical public business" });
        return;
      }
      const activeEligibility = await client.query<{ business_id: string }>(
        `SELECT e.business_id
           FROM business_discovery_eligibility e
          WHERE e.business_id = $1
            AND e.eligibility_status = 'qualified'
            AND e.policy_version = $2
            AND e.ownership_evidence_id IS NOT NULL
            AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
            AND e.ownership_source_expires_at > now()
            AND e.review_after > now()
          FOR UPDATE`,
        [businessId, DOCUMENTED_DISCOVERY_POLICY_VERSION],
      );
      if (activeEligibility.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "A current documented Kinfolk eligibility record is required before a legacy map location can be restored" });
        return;
      }
      if (!legacyMapLocationSnapshotMatchesCurrent(input, {
        address: current.address,
        city: current.city,
        state: current.state,
        country: current.country,
        latitude: current.latitude,
        longitude: current.longitude,
        createdAt: current.created_at,
        serviceArea: current.service_area,
        publicLocationKind: current.public_location_kind,
      })) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The immutable manifest snapshot no longer matches the current usable canonical location" });
        return;
      }
      const schema = await client.query<{ ready: boolean }>(
        `SELECT to_regclass('public.business_legacy_map_location_attestations') IS NOT NULL
                AND to_regclass('public.business_legacy_map_location_attestation_events') IS NOT NULL AS ready`,
      );
      if (!schema.rows[0]?.ready) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Legacy map restoration is unavailable until its separately reviewed immutable schema migration is applied" });
        return;
      }
      const prior = await client.query<{
        id: string;
        manifest_row_checksum: string;
        latest_action: "revoked" | "restored" | null;
      }>(
        `SELECT attestation.id::text, attestation.manifest_row_checksum,
                latest_event.action AS latest_action
           FROM business_legacy_map_location_attestations attestation
           LEFT JOIN LATERAL (
             SELECT event.action
               FROM business_legacy_map_location_attestation_events event
              WHERE event.attestation_id = attestation.id
              ORDER BY event.created_at DESC, event.id DESC
              LIMIT 1
           ) latest_event ON TRUE
          WHERE attestation.business_id = $1
          FOR UPDATE OF attestation`,
        [businessId],
      );
      const checksum = legacyMapLocationAttestationChecksum(businessId, input);
      const existing = prior.rows[0];
      if (existing) {
        if (existing.manifest_row_checksum === checksum && existing.latest_action !== "revoked") {
          await client.query("COMMIT");
          res.json({
            ok: true,
            replayed: true,
            businessId,
            attestationId: existing.id,
            message: "Exact legacy map restoration replayed without changing business data or audit history.",
          });
          return;
        }
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The canonical business already has an immutable legacy location attestation; use its revocation/restoration history instead of overwriting it" });
        return;
      }
      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      const attestationId = randomUUID();
      await client.query(
        `INSERT INTO business_legacy_map_location_attestations (
           id, business_id, historical_baseline_sha, receipt_gate_sha,
           address_snapshot, city_snapshot, state_snapshot, country_snapshot,
           latitude_snapshot, longitude_snapshot, business_created_at,
           batch_reference, decision_reason, manifest_row_checksum, attested_by
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9::numeric, $10::numeric, $11::timestamptz,
           $12, $13, $14, $15
         )`,
        [
          attestationId, businessId, input.historicalMapBaselineSha, LEGACY_MAP_RECEIPT_GATE_SHA,
          input.snapshot.address, input.snapshot.city, input.snapshot.state, input.snapshot.country,
          String(input.snapshot.latitude), String(input.snapshot.longitude), input.snapshot.businessCreatedAt,
          input.batchReference, input.decisionReason, checksum, actorId,
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        attestationId,
        historicalMapBaselineSha: input.historicalMapBaselineSha,
        message: "Legacy stored location attested without creating a first-party receipt or changing business, eligibility, ownership, lifecycle, or coordinate fields.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to attest a legacy map location");
      res.status(500).json({ error: "Failed to attest legacy map location" });
    } finally {
      client.release();
    }
  });

  /** A revocation immediately removes only this legacy restoration from map eligibility. */
  app.post("/api/admin/businesses/:id/legacy-map-location-attestation/state", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    const action = typeof req.body?.action === "string" ? req.body.action.trim() : "";
    if (!businessId || businessId.length > 255 || !["revoke", "restore"].includes(action)) {
      res.status(400).json({ error: "A valid business id and state action of revoke or restore are required" });
      return;
    }
    let input: ReturnType<typeof validateLegacyMapLocationRevocationInput>;
    try {
      input = validateLegacyMapLocationRevocationInput(req.body);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid legacy map location state request" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const attestation = await client.query<{
        id: string;
        historical_baseline_sha: string;
        batch_reference: string;
        decision_reason: string;
        address_snapshot: string;
        city_snapshot: string;
        state_snapshot: string;
        country_snapshot: string | null;
        latitude_snapshot: string | number;
        longitude_snapshot: string | number;
        business_created_at: Date | string;
        latest_action: "revoked" | "restored" | null;
      }>(
        `SELECT attestation.id::text, attestation.historical_baseline_sha, attestation.batch_reference,
                attestation.decision_reason, attestation.address_snapshot, attestation.city_snapshot,
                attestation.state_snapshot, attestation.country_snapshot, attestation.latitude_snapshot,
                attestation.longitude_snapshot, attestation.business_created_at,
                latest_event.action AS latest_action
           FROM business_legacy_map_location_attestations attestation
           LEFT JOIN LATERAL (
             SELECT event.action
               FROM business_legacy_map_location_attestation_events event
              WHERE event.attestation_id = attestation.id
              ORDER BY event.created_at DESC, event.id DESC
              LIMIT 1
           ) latest_event ON TRUE
          WHERE attestation.business_id = $1
          FOR UPDATE OF attestation`,
        [businessId],
      );
      const currentAttestation = attestation.rows[0];
      if (!currentAttestation) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Legacy map location attestation not found" });
        return;
      }
      if (action === "revoke" && currentAttestation.latest_action === "revoked") {
        await client.query("COMMIT");
        res.json({ ok: true, replayed: true, businessId, attestationId: currentAttestation.id, state: "revoked" });
        return;
      }
      if (action === "restore") {
        if (currentAttestation.latest_action !== "revoked") {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "Only a currently revoked legacy location attestation can be restored" });
          return;
        }
        const currentBusiness = await client.query<{
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          latitude: string | number | null;
          longitude: string | number | null;
          created_at: Date | null;
          service_area: string | null;
          public_location_kind: string | null;
        }>(
          `SELECT b.address, b.city, b.state, b.country, b.latitude, b.longitude, b.created_at,
                  to_jsonb(b)->>'service_area' AS service_area,
                  to_jsonb(b)->>'public_location_kind' AS public_location_kind
             FROM businesses b
            WHERE b.id = $1
            FOR UPDATE`,
          [businessId],
        );
        const current = currentBusiness.rows[0];
        const publicCanonical = await client.query<{ id: string }>(
          `SELECT id FROM public.public_businesses WHERE id = $1`,
          [businessId],
        );
        const activeEligibility = await client.query<{ business_id: string }>(
          `SELECT e.business_id
             FROM business_discovery_eligibility e
           WHERE e.business_id = $1
              AND e.eligibility_status = 'qualified'
              AND e.policy_version = $2
              AND e.ownership_evidence_id IS NOT NULL
              AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
              AND e.ownership_source_expires_at > now()
              AND e.review_after > now()
            FOR UPDATE`,
          [businessId, DOCUMENTED_DISCOVERY_POLICY_VERSION],
        );
        const frozenSnapshot = validateLegacyMapLocationAttestationInput({
          decisionReason: currentAttestation.decision_reason,
          batchReference: currentAttestation.batch_reference,
          historicalMapBaselineSha: currentAttestation.historical_baseline_sha,
          snapshot: {
            address: currentAttestation.address_snapshot,
            city: currentAttestation.city_snapshot,
            state: currentAttestation.state_snapshot,
            country: currentAttestation.country_snapshot,
            latitude: Number(currentAttestation.latitude_snapshot),
            longitude: Number(currentAttestation.longitude_snapshot),
            businessCreatedAt: new Date(currentAttestation.business_created_at).toISOString(),
          },
        });
        if (!current || publicCanonical.rows.length === 0 || activeEligibility.rows.length === 0
            || !legacyMapLocationSnapshotMatchesCurrent(frozenSnapshot, {
              address: current.address,
              city: current.city,
              state: current.state,
              country: current.country,
              latitude: current.latitude,
              longitude: current.longitude,
              createdAt: current.created_at,
              serviceArea: current.service_area,
              publicLocationKind: current.public_location_kind,
            })) {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "The original legacy location snapshot no longer matches a current canonical Kinfolk-eligible business; create no replacement attestation automatically" });
          return;
        }
      }
      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      const nextAction = action === "revoke" ? "revoked" : "restored";
      await client.query(
        `INSERT INTO business_legacy_map_location_attestation_events (
           id, attestation_id, action, reason, actor_id
         ) VALUES ($1, $2::uuid, $3, $4, $5)`,
        [randomUUID(), currentAttestation.id, nextAction, input.decisionReason, actorId],
      );
      await client.query("COMMIT");
      res.json({ ok: true, businessId, attestationId: currentAttestation.id, state: nextAction });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId, action }, "Failed to change legacy map location attestation state");
      res.status(500).json({ error: "Failed to change legacy map location attestation state" });
    } finally {
      client.release();
    }
  });
}
