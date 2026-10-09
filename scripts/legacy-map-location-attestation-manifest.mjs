import { createHash } from "node:crypto";

export const LEGACY_MAP_LOCATION_ATTESTATION_MANIFEST_VERSION =
  "mwm-legacy-map-location-attestation-batch/v1";
export const LEGACY_MAP_LOCATION_ATTESTATION_MAX_BATCH_SIZE = 100;
export const LEGACY_MAP_VISIBILITY_BASELINE_SHA =
  "3258408f397dc6bb795c6f7da78570d587f25c58";
export const LEGACY_MAP_RECEIPT_GATE_SHA =
  "0ca51e2cc47997a523efb850bd56b850bb050568";
export const DOCUMENTED_DISCOVERY_POLICY_VERSION =
  "documented_diaspora_discovery_v1";

function fail(message) {
  throw new Error(`Invalid legacy map location attestation manifest: ${message}`);
}
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}
function allowed(record, keys, label) {
  for (const key of Object.keys(record)) if (!keys.has(key)) fail(`${label} contains unsupported key ${JSON.stringify(key)}`);
}
function text(value, label, { min = 1, max = 4000, pattern } = {}) {
  if (typeof value !== "string") fail(`${label} must be text`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) fail(`${label} must be ${min}–${max} characters`);
  if (pattern && !pattern.test(normalized)) fail(`${label} has an invalid format`);
  return normalized;
}
function timestamp(value, label, now, future = false) {
  const normalized = text(value, label, { max: 64 });
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) fail(`${label} must be an ISO timestamp`);
  if (parsed > now.getTime() + 86_400_000) fail(`${label} cannot be more than one day in the future`);
  if (future && parsed <= now.getTime()) fail(`${label} must be in the future`);
  return new Date(parsed).toISOString();
}
function futureEligibilityTimestamp(value, label, now) {
  const normalized = text(value, label, { max: 64 });
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed) || parsed <= now.getTime()) fail(`${label} must be a future ISO timestamp`);
  return new Date(parsed).toISOString();
}
function coordinate(value, label, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) fail(`${label} must be a finite coordinate in range`);
  return value;
}
function nullableText(value, label, max) {
  return value == null ? null : text(value, label, { max });
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
export function legacyMapLocationManifestSha256(manifest) {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

function eligibility(value, label, now) {
  const raw = object(value, label);
  allowed(raw, new Set([
    "eligibilityStatus", "policyVersion", "identityEvidenceId", "ownershipEvidenceId",
    "officialWebsiteEvidenceId", "officialSocialEvidenceId", "ownershipSourceExpiresAt",
    "reviewAfter", "addressEvidenceId", "mapPinEvidenceId",
  ]), label);
  if (raw.eligibilityStatus !== "qualified") fail(`${label}.eligibilityStatus must be qualified`);
  if (raw.policyVersion !== DOCUMENTED_DISCOVERY_POLICY_VERSION) fail(`${label}.policyVersion must be the current documented policy`);
  const identityEvidenceId = text(raw.identityEvidenceId, `${label}.identityEvidenceId`, { max: 255 });
  const ownershipEvidenceId = text(raw.ownershipEvidenceId, `${label}.ownershipEvidenceId`, { max: 255 });
  const officialWebsiteEvidenceId = nullableText(raw.officialWebsiteEvidenceId, `${label}.officialWebsiteEvidenceId`, 255);
  const officialSocialEvidenceId = nullableText(raw.officialSocialEvidenceId, `${label}.officialSocialEvidenceId`, 255);
  if (!officialWebsiteEvidenceId && !officialSocialEvidenceId) fail(`${label} requires an existing official website or social evidence id`);
  if (raw.addressEvidenceId !== null || raw.mapPinEvidenceId !== null) {
    fail(`${label} is limited to the historical no-location-receipt cohort`);
  }
  return {
    eligibilityStatus: "qualified",
    policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
    identityEvidenceId,
    ownershipEvidenceId,
    officialWebsiteEvidenceId,
    officialSocialEvidenceId,
    ownershipSourceExpiresAt: futureEligibilityTimestamp(raw.ownershipSourceExpiresAt, `${label}.ownershipSourceExpiresAt`, now),
    reviewAfter: futureEligibilityTimestamp(raw.reviewAfter, `${label}.reviewAfter`, now),
    addressEvidenceId: null,
    mapPinEvidenceId: null,
  };
}

export function validateLegacyMapLocationAttestationManifest(value, { now = new Date() } = {}) {
  const manifest = object(value, "manifest");
  allowed(manifest, new Set([
    "schemaVersion", "manifestId", "generatedAt", "sourceReleaseSha", "historicalMapBaselineSha",
    "receiptGateSha", "maximumRecords", "entries",
  ]), "manifest");
  if (manifest.schemaVersion !== LEGACY_MAP_LOCATION_ATTESTATION_MANIFEST_VERSION) {
    fail(`schemaVersion must be ${LEGACY_MAP_LOCATION_ATTESTATION_MANIFEST_VERSION}`);
  }
  const manifestId = text(manifest.manifestId, "manifestId", { max: 160, pattern: /^[a-z0-9][a-z0-9-]{2,159}$/ });
  const generatedAt = timestamp(manifest.generatedAt, "generatedAt", now);
  const sourceReleaseSha = text(manifest.sourceReleaseSha, "sourceReleaseSha", { max: 64, pattern: /^[a-f0-9]{7,64}$/i });
  if (manifest.historicalMapBaselineSha !== LEGACY_MAP_VISIBILITY_BASELINE_SHA) fail("historicalMapBaselineSha must use the pre-receipt map baseline");
  if (manifest.receiptGateSha !== LEGACY_MAP_RECEIPT_GATE_SHA) fail("receiptGateSha must name the receipt-gate regression commit");
  if (!Number.isInteger(manifest.maximumRecords) || manifest.maximumRecords < 1 || manifest.maximumRecords > LEGACY_MAP_LOCATION_ATTESTATION_MAX_BATCH_SIZE) {
    fail(`maximumRecords must be 1–${LEGACY_MAP_LOCATION_ATTESTATION_MAX_BATCH_SIZE}`);
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0 || manifest.entries.length > manifest.maximumRecords) {
    fail("entries must be non-empty and no larger than maximumRecords");
  }
  const businessIds = new Set();
  const entries = manifest.entries.map((entry, index) => {
    const label = `entries[${index}]`;
    const raw = object(entry, label);
    allowed(raw, new Set(["businessId", "expected", "decisionReason"]), label);
    const businessId = text(raw.businessId, `${label}.businessId`, { max: 255, pattern: /^[A-Za-z0-9_-]+$/ });
    if (businessIds.has(businessId)) fail(`${label}.businessId is duplicated`);
    businessIds.add(businessId);
    const expectedRaw = object(raw.expected, `${label}.expected`);
    allowed(expectedRaw, new Set([
      "canonicalName", "status", "listingStatus", "address", "city", "state", "country",
      "latitude", "longitude", "businessCreatedAt", "eligibility",
    ]), `${label}.expected`);
    const expected = {
      canonicalName: text(expectedRaw.canonicalName, `${label}.expected.canonicalName`, { max: 500 }),
      status: text(expectedRaw.status, `${label}.expected.status`, { max: 60 }),
      listingStatus: text(expectedRaw.listingStatus, `${label}.expected.listingStatus`, { max: 60 }),
      address: text(expectedRaw.address, `${label}.expected.address`, { max: 300 }),
      city: text(expectedRaw.city, `${label}.expected.city`, { max: 120 }),
      state: text(expectedRaw.state, `${label}.expected.state`, { max: 120 }),
      country: nullableText(expectedRaw.country, `${label}.expected.country`, 120),
      latitude: coordinate(expectedRaw.latitude, `${label}.expected.latitude`, -90, 90),
      longitude: coordinate(expectedRaw.longitude, `${label}.expected.longitude`, -180, 180),
      businessCreatedAt: timestamp(expectedRaw.businessCreatedAt, `${label}.expected.businessCreatedAt`, now),
      eligibility: eligibility(expectedRaw.eligibility, `${label}.expected.eligibility`, now),
    };
    if (!/^\d+[A-Za-z]?\s+\S+/.test(expected.address)) fail(`${label}.expected.address must be a street-numbered location`);
    if (Math.abs(expected.latitude) < 0.001 && Math.abs(expected.longitude) < 0.001) fail(`${label}.expected coordinates must not be zero`);
    const decisionReason = text(raw.decisionReason, `${label}.decisionReason`, { min: 3, max: 4000 });
    if (!decisionReason.includes(manifestId) || !/legacy stored.location attestation/i.test(decisionReason)) {
      fail(`${label}.decisionReason must name manifestId and describe a legacy stored-location attestation`);
    }
    return { businessId, expected, decisionReason };
  });
  return {
    schemaVersion: LEGACY_MAP_LOCATION_ATTESTATION_MANIFEST_VERSION,
    manifestId,
    generatedAt,
    sourceReleaseSha,
    historicalMapBaselineSha: LEGACY_MAP_VISIBILITY_BASELINE_SHA,
    receiptGateSha: LEGACY_MAP_RECEIPT_GATE_SHA,
    maximumRecords: manifest.maximumRecords,
    entries,
  };
}

export function buildLegacyMapLocationAttestationRequest(entry, manifest) {
  return {
    decisionReason: entry.decisionReason,
    batchReference: manifest.manifestId,
    historicalMapBaselineSha: manifest.historicalMapBaselineSha,
    snapshot: {
      address: entry.expected.address,
      city: entry.expected.city,
      state: entry.expected.state,
      country: entry.expected.country,
      latitude: entry.expected.latitude,
      longitude: entry.expected.longitude,
      businessCreatedAt: entry.expected.businessCreatedAt,
    },
  };
}

export function assertLegacyMapLocationExecutionAuthorization(manifestId, suppliedManifestId, environmentValue) {
  if (suppliedManifestId !== manifestId || environmentValue !== manifestId) {
    throw new Error("Execution refused: both --execute-manifest and LEGACY_MAP_LOCATION_ATTESTATION_BATCH_EXECUTION must exactly equal manifestId");
  }
}
