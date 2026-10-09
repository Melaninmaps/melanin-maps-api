import { createHash } from "node:crypto";

export const MAP_ATTACHMENT_BATCH_MANIFEST_VERSION = "mwm-map-attachment-batch/v1";
export const MAX_MAP_ATTACHMENT_BATCH_SIZE = 100;

const APPROVED_GEOCODER_HOSTS = new Set([
  "maps.googleapis.com",
  "nominatim.openstreetmap.org",
  "geocoding.geo.census.gov",
]);
const FIRST_PARTY_SOURCE_KINDS = new Set(["business_official", "owner_official"]);
const IDENTITY_SIGNALS = new Set([
  "business_name",
  "city",
  "phone",
  "address",
  "official_email_domain",
  "owner_name",
  "direct_official_link",
]);

function fail(message) {
  throw new Error(`Invalid audited map-attachment manifest: ${message}`);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function requireAllowedKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${label} contains unsupported key ${JSON.stringify(key)}`);
  }
}

function requireText(value, label, { max = 4000, pattern } = {}) {
  if (typeof value !== "string") fail(`${label} must be text`);
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > max) fail(`${label} must be non-empty and at most ${max} characters`);
  if (pattern && !pattern.test(trimmed)) fail(`${label} has an invalid format`);
  return trimmed;
}

function canonicalText(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function comparableAddress(value) {
  return canonicalText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(n|north)\b/g, "north")
    .replace(/\b(s|south)\b/g, "south")
    .replace(/\b(e|east)\b/g, "east")
    .replace(/\b(w|west)\b/g, "west")
    .replace(/\b(st|street)\b/g, "street")
    .replace(/\b(ave|avenue)\b/g, "avenue")
    .replace(/\b(rd|road)\b/g, "road")
    .replace(/\b(blvd|boulevard)\b/g, "boulevard")
    .replace(/\b(dr|drive)\b/g, "drive")
    .replace(/\b(ln|lane)\b/g, "lane")
    .replace(/\b(ct|court)\b/g, "court")
    .replace(/\b(pl|place)\b/g, "place")
    .replace(/\b(pkwy|parkway)\b/g, "parkway")
    .replace(/\b(ter|terrace)\b/g, "terrace")
    .replace(/\b(hwy|highway)\b/g, "highway")
    .replace(/\b(cir|circle)\b/g, "circle")
    .replace(/\bpa\b/g, "pennsylvania")
    .replace(/\btx\b/g, "texas")
    .replace(/\s+/g, " ")
    .trim();
}

function requireHttpsUrl(value, label) {
  const raw = requireText(value, label, { max: 2048 });
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    fail(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== "https:") fail(`${label} must use HTTPS`);
  parsed.hash = "";
  return parsed;
}

function requireTimestamp(value, label, now) {
  const normalized = requireText(value, label, { max: 64 });
  const time = Date.parse(normalized);
  if (!Number.isFinite(time)) fail(`${label} must be an ISO timestamp`);
  if (time > now.getTime() + 24 * 60 * 60 * 1000) fail(`${label} cannot be more than one day in the future`);
  return new Date(time).toISOString();
}

function requireFiniteCoordinate(value, label, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    fail(`${label} must be a finite coordinate in range`);
  }
  return value;
}

function requireIdentitySignals(value, label) {
  if (!Array.isArray(value)) fail(`${label}.matchingSignals must be an array`);
  const signals = [...new Set(value.filter((signal) => typeof signal === "string")
    .map((signal) => signal.trim())
    .filter((signal) => IDENTITY_SIGNALS.has(signal)))];
  if (signals.length === 0) fail(`${label}.matchingSignals must contain one concrete identity signal`);
  return signals;
}

function requireAddressComponents(value) {
  const components = requireObject(value, "mapPinEvidence.observedValue.addressComponents");
  requireAllowedKeys(components, new Set([
    "houseNumber", "directional", "streetName", "streetType", "city", "state", "postalCode",
  ]), "mapPinEvidence.observedValue.addressComponents");
  for (const key of ["houseNumber", "streetName", "streetType", "city", "state", "postalCode"]) {
    requireText(components[key], `mapPinEvidence.observedValue.addressComponents.${key}`, { max: 160 });
  }
  if (components.directional != null) requireText(components.directional, "mapPinEvidence.observedValue.addressComponents.directional", { max: 16 });
  return components;
}

function validateAddressEvidence(value, expectedAddress, now) {
  const evidence = requireObject(value, "addressEvidence");
  requireAllowedKeys(evidence, new Set([
    "field", "sourceKind", "sourceUrl", "sourceLabel", "observedAt", "sourceExpiresAt", "confidence", "observedValue",
  ]), "addressEvidence");
  if (evidence.field !== "address") fail("addressEvidence.field must be address");
  if (!FIRST_PARTY_SOURCE_KINDS.has(evidence.sourceKind)) fail("addressEvidence.sourceKind must be first-party business or owner controlled");
  const sourceUrl = requireHttpsUrl(evidence.sourceUrl, "addressEvidence.sourceUrl").toString();
  const observedAt = requireTimestamp(evidence.observedAt, "addressEvidence.observedAt", now);
  if (evidence.sourceExpiresAt != null) fail("addressEvidence.sourceExpiresAt is not permitted for an address attachment");
  if (!['high', 'medium', 'low'].includes(evidence.confidence)) fail("addressEvidence.confidence is invalid");
  const observedValue = requireObject(evidence.observedValue, "addressEvidence.observedValue");
  requireAllowedKeys(observedValue, new Set([
    "address", "addressType", "isServiceArea", "identityMatch", "matchingSignals",
  ]), "addressEvidence.observedValue");
  const address = requireText(observedValue.address, "addressEvidence.observedValue.address", { max: 300 });
  if (comparableAddress(address) !== comparableAddress(expectedAddress)) {
    fail("addressEvidence.observedValue.address must match expected.storedAddress before submission");
  }
  if (observedValue.addressType !== "physical" || observedValue.isServiceArea !== false) {
    fail("addressEvidence must describe a non-service-area physical location");
  }
  if (observedValue.identityMatch !== true) fail("addressEvidence must assert exact business identity");
  const matchingSignals = requireIdentitySignals(observedValue.matchingSignals, "addressEvidence.observedValue");
  return {
    field: "address",
    sourceKind: evidence.sourceKind,
    sourceUrl,
    ...(evidence.sourceLabel == null ? {} : { sourceLabel: requireText(evidence.sourceLabel, "addressEvidence.sourceLabel", { max: 255 }) }),
    observedAt,
    confidence: evidence.confidence,
    observedValue: { address, addressType: "physical", isServiceArea: false, identityMatch: true, matchingSignals },
  };
}

function validateMapPinEvidence(value, expectedAddress, now) {
  const evidence = requireObject(value, "mapPinEvidence");
  requireAllowedKeys(evidence, new Set([
    "field", "sourceKind", "sourceUrl", "sourceLabel", "observedAt", "sourceExpiresAt", "confidence", "observedValue",
  ]), "mapPinEvidence");
  if (evidence.field !== "map_pin" || evidence.sourceKind !== "official_geocoder") {
    fail("mapPinEvidence must be an official_geocoder map_pin receipt");
  }
  const parsed = requireHttpsUrl(evidence.sourceUrl, "mapPinEvidence.sourceUrl");
  if (!APPROVED_GEOCODER_HOSTS.has(parsed.hostname.toLocaleLowerCase("en-US"))) {
    fail("mapPinEvidence.sourceUrl must use an approved geocoder host");
  }
  const observedAt = requireTimestamp(evidence.observedAt, "mapPinEvidence.observedAt", now);
  if (evidence.sourceExpiresAt != null) fail("mapPinEvidence.sourceExpiresAt is not permitted for a geocoder attachment");
  if (!['high', 'medium', 'low'].includes(evidence.confidence)) fail("mapPinEvidence.confidence is invalid");
  const observedValue = requireObject(evidence.observedValue, "mapPinEvidence.observedValue");
  requireAllowedKeys(observedValue, new Set([
    "latitude", "longitude", "queryAddress", "formattedAddress", "addressMatch", "addressComponents",
  ]), "mapPinEvidence.observedValue");
  const latitude = requireFiniteCoordinate(observedValue.latitude, "mapPinEvidence.observedValue.latitude", -90, 90);
  const longitude = requireFiniteCoordinate(observedValue.longitude, "mapPinEvidence.observedValue.longitude", -180, 180);
  const queryAddress = requireText(observedValue.queryAddress, "mapPinEvidence.observedValue.queryAddress", { max: 300 });
  const formattedAddress = requireText(observedValue.formattedAddress, "mapPinEvidence.observedValue.formattedAddress", { max: 500 });
  if (comparableAddress(queryAddress) !== comparableAddress(expectedAddress)) {
    fail("mapPinEvidence.observedValue.queryAddress must match expected.storedAddress before submission");
  }
  if (observedValue.addressMatch !== true) fail("mapPinEvidence must assert addressMatch: true");
  const addressComponents = requireAddressComponents(observedValue.addressComponents);
  return {
    field: "map_pin",
    sourceKind: "official_geocoder",
    sourceUrl: parsed.toString(),
    ...(evidence.sourceLabel == null ? {} : { sourceLabel: requireText(evidence.sourceLabel, "mapPinEvidence.sourceLabel", { max: 255 }) }),
    observedAt,
    confidence: evidence.confidence,
    observedValue: { latitude, longitude, queryAddress, formattedAddress, addressMatch: true, addressComponents },
  };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function manifestSha256(manifest) {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

export function validateMapAttachmentBatchManifest(value, { now = new Date() } = {}) {
  const manifest = requireObject(value, "manifest");
  requireAllowedKeys(manifest, new Set([
    "schemaVersion", "manifestId", "generatedAt", "sourceReleaseSha", "maximumRecords", "entries",
  ]), "manifest");
  if (manifest.schemaVersion !== MAP_ATTACHMENT_BATCH_MANIFEST_VERSION) {
    fail(`schemaVersion must be ${MAP_ATTACHMENT_BATCH_MANIFEST_VERSION}`);
  }
  const manifestId = requireText(manifest.manifestId, "manifestId", {
    max: 160,
    pattern: /^[a-z0-9][a-z0-9-]{2,159}$/,
  });
  const generatedAt = requireTimestamp(manifest.generatedAt, "generatedAt", now);
  const sourceReleaseSha = requireText(manifest.sourceReleaseSha, "sourceReleaseSha", { max: 64, pattern: /^[a-f0-9]{7,64}$/i });
  if (!Number.isInteger(manifest.maximumRecords) || manifest.maximumRecords < 1 || manifest.maximumRecords > MAX_MAP_ATTACHMENT_BATCH_SIZE) {
    fail(`maximumRecords must be an integer from 1 to ${MAX_MAP_ATTACHMENT_BATCH_SIZE}`);
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0 || manifest.entries.length > manifest.maximumRecords) {
    fail("entries must be a non-empty list no larger than maximumRecords");
  }
  const ids = new Set();
  const entries = manifest.entries.map((entry, index) => {
    const label = `entries[${index}]`;
    const raw = requireObject(entry, label);
    requireAllowedKeys(raw, new Set([
      "businessId", "expected", "decisionReason", "addressEvidence", "mapPinEvidence",
    ]), label);
    const businessId = requireText(raw.businessId, `${label}.businessId`, { max: 255, pattern: /^[A-Za-z0-9_-]+$/ });
    if (ids.has(businessId)) fail(`entries contains duplicate immutable businessId ${JSON.stringify(businessId)}`);
    ids.add(businessId);
    const expected = requireObject(raw.expected, `${label}.expected`);
    requireAllowedKeys(expected, new Set([
      "canonicalName", "storedAddress", "latitude", "longitude", "readAt",
    ]), `${label}.expected`);
    const canonicalName = requireText(expected.canonicalName, `${label}.expected.canonicalName`, { max: 500 });
    const storedAddress = requireText(expected.storedAddress, `${label}.expected.storedAddress`, { max: 300 });
    const readAt = requireTimestamp(expected.readAt, `${label}.expected.readAt`, now);
    const latitude = expected.latitude == null ? null : requireFiniteCoordinate(expected.latitude, `${label}.expected.latitude`, -90, 90);
    const longitude = expected.longitude == null ? null : requireFiniteCoordinate(expected.longitude, `${label}.expected.longitude`, -180, 180);
    if ((latitude === null) !== (longitude === null)) fail(`${label}.expected coordinates must be both present or both null`);
    const decisionReason = requireText(raw.decisionReason, `${label}.decisionReason`, { max: 4000 });
    if (!decisionReason.includes(manifestId)) fail(`${label}.decisionReason must name manifestId for immutable audit traceability`);
    const addressEvidence = validateAddressEvidence(raw.addressEvidence, storedAddress, now);
    const mapPinEvidence = validateMapPinEvidence(raw.mapPinEvidence, storedAddress, now);
    return {
      businessId,
      expected: { canonicalName, storedAddress, latitude, longitude, readAt },
      decisionReason,
      addressEvidence,
      mapPinEvidence,
    };
  });
  return {
    schemaVersion: MAP_ATTACHMENT_BATCH_MANIFEST_VERSION,
    manifestId,
    generatedAt,
    sourceReleaseSha,
    maximumRecords: manifest.maximumRecords,
    entries,
  };
}

export function buildMapAttachmentRequest(entry) {
  return {
    decisionReason: entry.decisionReason,
    addressEvidence: entry.addressEvidence,
    mapPinEvidence: entry.mapPinEvidence,
  };
}

export function assertExecutionAuthorization(manifestId, suppliedManifestId, environmentValue) {
  if (suppliedManifestId !== manifestId) {
    throw new Error("Execution refused: --execute-manifest must exactly equal manifestId");
  }
  if (environmentValue !== manifestId) {
    throw new Error("Execution refused: MAP_ATTACHMENT_BATCH_EXECUTION must exactly equal manifestId");
  }
}
