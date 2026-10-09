import { createHash } from "crypto";
import { hasTrustworthyMapCoordinate } from "./mapCoordinateIntegrity";

/**
 * The last map implementation before the documented map-receipt gate. This is
 * historical implementation provenance, not a claim that an address was
 * observed on an official website.
 */
export const LEGACY_MAP_VISIBILITY_BASELINE_SHA =
  "3258408f397dc6bb795c6f7da78570d587f25c58" as const;
export const LEGACY_MAP_RECEIPT_GATE_SHA =
  "0ca51e2cc47997a523efb850bd56b850bb050568" as const;

export type LegacyMapLocationSnapshot = Readonly<{
  address: string;
  city: string;
  state: string;
  country: string | null;
  latitude: number;
  longitude: number;
  businessCreatedAt: string;
}>;

export type LegacyMapLocationAttestationInput = Readonly<{
  decisionReason: string;
  batchReference: string;
  historicalMapBaselineSha: typeof LEGACY_MAP_VISIBILITY_BASELINE_SHA;
  snapshot: LegacyMapLocationSnapshot;
}>;

export type CurrentLegacyMapLocation = Readonly<{
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  createdAt: string | Date | null;
  serviceArea: string | null;
  publicLocationKind: string | null;
}>;

function normalizedText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= maximum ? normalized : null;
}

function timestamp(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`${label} must be an ISO timestamp`);
  return parsed.toISOString();
}

function finiteCoordinate(value: unknown, label: "latitude" | "longitude", minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`legacy map location ${label} must be a finite number in range`);
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function isoTimestampOrNull(value: string | Date | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

export function hasUsableStoredLegacyStreetLocation(record: CurrentLegacyMapLocation): boolean {
  const address = normalizedText(record.address, 300);
  const city = normalizedText(record.city, 120);
  const state = normalizedText(record.state, 120);
  const kind = normalizedText(record.publicLocationKind, 80)?.toLocaleLowerCase("en-US") ?? "";
  const serviceArea = normalizedText(record.serviceArea, 300);
  if (!address || !city || !state || serviceArea) return false;
  if (["online", "online_only", "service_area", "private", "private_residence", "home_based"].includes(kind)) {
    return false;
  }
  // This lane never repairs an address. It requires a street-numbered stored
  // location, city, and state; a weaker city-only/service-area location stays
  // outside the map until separately evidenced.
  return /^\d+[A-Za-z]?\s+\S+/.test(address);
}

export function validateLegacyMapLocationAttestationInput(value: unknown): LegacyMapLocationAttestationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("legacy map location attestation must be an object");
  }
  const raw = value as Record<string, unknown>;
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) {
    throw new Error("A 3–4,000 character decisionReason is required");
  }
  const batchReference = normalizedText(raw.batchReference, 160);
  if (!batchReference || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/.test(batchReference)) {
    throw new Error("batchReference must be a stable 3–160 character manifest identifier");
  }
  if (raw.historicalMapBaselineSha !== LEGACY_MAP_VISIBILITY_BASELINE_SHA) {
    throw new Error("historicalMapBaselineSha must name the approved pre-receipt map baseline");
  }
  if (!raw.snapshot || typeof raw.snapshot !== "object" || Array.isArray(raw.snapshot)) {
    throw new Error("legacy map location snapshot is required");
  }
  const snapshotRaw = raw.snapshot as Record<string, unknown>;
  const address = normalizedText(snapshotRaw.address, 300);
  const city = normalizedText(snapshotRaw.city, 120);
  const state = normalizedText(snapshotRaw.state, 120);
  const country = snapshotRaw.country == null ? null : normalizedText(snapshotRaw.country, 120);
  if (!address || !city || !state) {
    throw new Error("legacy map location snapshot requires address, city, and state");
  }
  if (!/^\d+[A-Za-z]?\s+\S+/.test(address)) {
    throw new Error("legacy map location snapshot requires a street-numbered physical address");
  }
  const latitude = finiteCoordinate(snapshotRaw.latitude, "latitude", -90, 90);
  const longitude = finiteCoordinate(snapshotRaw.longitude, "longitude", -180, 180);
  if (!hasTrustworthyMapCoordinate({ city, stateCode: state, latitude, longitude })) {
    throw new Error("legacy map location snapshot coordinates are not trustworthy for a business pin");
  }
  return {
    decisionReason,
    batchReference,
    historicalMapBaselineSha: LEGACY_MAP_VISIBILITY_BASELINE_SHA,
    snapshot: {
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      businessCreatedAt: timestamp(snapshotRaw.businessCreatedAt, "snapshot.businessCreatedAt"),
    },
  };
}

/** A stale or changed business snapshot must be re-read and re-manifested. */
export function legacyMapLocationSnapshotMatchesCurrent(
  input: LegacyMapLocationAttestationInput,
  current: CurrentLegacyMapLocation,
): boolean {
  if (!hasUsableStoredLegacyStreetLocation(current)) return false;
  const latitude = numberOrNull(current.latitude);
  const longitude = numberOrNull(current.longitude);
  if (latitude === null || longitude === null) return false;
  const currentAddress = normalizedText(current.address, 300);
  const currentCity = normalizedText(current.city, 120);
  const currentState = normalizedText(current.state, 120);
  const currentCountry = current.country == null ? null : normalizedText(current.country, 120);
  return currentAddress === input.snapshot.address
    && currentCity === input.snapshot.city
    && currentState === input.snapshot.state
    && currentCountry === input.snapshot.country
    && latitude === input.snapshot.latitude
    && longitude === input.snapshot.longitude
    && isoTimestampOrNull(current.createdAt) === input.snapshot.businessCreatedAt;
}

/** Stable idempotency guard; the actor identity is deliberately excluded. */
export function legacyMapLocationAttestationChecksum(
  businessId: string,
  input: LegacyMapLocationAttestationInput,
): string {
  return createHash("sha256").update(canonicalJson({
    businessId,
    baseline: input.historicalMapBaselineSha,
    batchReference: input.batchReference,
    decisionReason: input.decisionReason,
    snapshot: input.snapshot,
  })).digest("hex");
}

export function validateLegacyMapLocationRevocationInput(value: unknown): Readonly<{ decisionReason: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("legacy map location revocation must be an object");
  }
  const decisionReason = normalizedText((value as Record<string, unknown>).decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) {
    throw new Error("A 3–4,000 character decisionReason is required");
  }
  return { decisionReason };
}
