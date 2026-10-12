import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION = "mwm-persistent-safety-location-v1";
export const PERSISTENT_SAFETY_LOCATION_CONTACT_CONSENT_VERSION = "mwm-persistent-safety-location-family-impact-v1";
export const PERSISTENT_SAFETY_LOCATION_SCOPE = "mwm_private_emergency_assessment_only" as const;
export const PERSISTENT_SAFETY_LOCATION_DISCLOSURE =
  "Allow Mapping with Melanin to use your location to check whether you may be affected by an emergency. Your trusted contacts cannot see your live location. If a qualifying emergency may affect you, Mapping with Melanin may notify the contacts you have separately authorized.";

const ENVELOPE_VERSION = "v1";
const KEY_BYTES = 32;
const MAX_CAPTURE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_CAPTURE_MS = 5 * 60 * 1000;
const MAX_ACCURACY_METERS = 50_000;

type Key = Readonly<{ version: string; key: Buffer }>;

export type PersistentSafetyPlatform = "ios" | "android";
export type PersistentSafetyPermissionState = "granted" | "denied" | "restricted" | "not_requested" | "unknown";

export type PersistentSafetyLocationFix = Readonly<{
  latitude: number;
  longitude: number;
  capturedAt: Date;
  accuracyMeters: number;
  platform: PersistentSafetyPlatform;
  background: boolean;
}>;

export type PersistentSafetyLocationRuntimeState = Readonly<{
  collectionEnabled: boolean;
  encryptionReady: boolean;
  freshnessWindowMs: number | null;
  disclosureVersion: typeof PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION;
  disclosure: typeof PERSISTENT_SAFETY_LOCATION_DISCLOSURE;
}>;

export function parsePersistentSafetyLocationKeyring(value: string | undefined): Key[] {
  if (!value?.trim()) return [];
  const versions = new Set<string>();
  const keys: Key[] = [];
  for (const part of value.split(",")) {
    const [version, encoded, ...rest] = part.trim().split(":");
    if (!version || !encoded || rest.length || !/^v[1-9][0-9]*$/.test(version) || versions.has(version)) return [];
    let key: Buffer;
    try {
      key = Buffer.from(encoded, "base64");
    } catch {
      return [];
    }
    if (key.length !== KEY_BYTES) return [];
    versions.add(version);
    keys.push({ version, key });
  }
  return keys;
}

/**
 * Freshness is an operating-policy decision, not a retention period. A missing
 * or invalid value makes emergency matching fail closed to `location_unknown`.
 */
export function persistentSafetyLocationFreshnessWindowMs(
  environment: NodeJS.ProcessEnv = process.env,
): number | null {
  const seconds = Number(environment.SAFETY_PERSISTENT_LOCATION_MAX_AGE_SECONDS);
  if (!Number.isInteger(seconds) || seconds < 60 || seconds > 24 * 60 * 60) return null;
  return seconds * 1000;
}

export function persistentSafetyLocationRuntimeState(
  environment: NodeJS.ProcessEnv = process.env,
): PersistentSafetyLocationRuntimeState {
  const encryptionReady = parsePersistentSafetyLocationKeyring(
    environment.MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS,
  ).length > 0;
  return {
    collectionEnabled: environment.SAFETY_PERSISTENT_LOCATION_COLLECTION_ENABLED === "true" && encryptionReady,
    encryptionReady,
    freshnessWindowMs: persistentSafetyLocationFreshnessWindowMs(environment),
    disclosureVersion: PERSISTENT_SAFETY_LOCATION_CONSENT_VERSION,
    disclosure: PERSISTENT_SAFETY_LOCATION_DISCLOSURE,
  };
}

function aad(ownerId: string): Buffer {
  return Buffer.from(`mwm-persistent-safety-location:${ownerId}`, "utf8");
}

function validFix(input: PersistentSafetyLocationFix, now = Date.now()): boolean {
  return Number.isFinite(input.latitude) && input.latitude >= -90 && input.latitude <= 90
    && Number.isFinite(input.longitude) && input.longitude >= -180 && input.longitude <= 180
    && Number.isFinite(input.accuracyMeters) && input.accuracyMeters >= 0 && input.accuracyMeters <= MAX_ACCURACY_METERS
    && Number.isFinite(input.capturedAt.getTime())
    && input.capturedAt.getTime() >= now - MAX_CAPTURE_AGE_MS
    && input.capturedAt.getTime() <= now + MAX_FUTURE_CAPTURE_MS
    && (input.platform === "ios" || input.platform === "android");
}

export function parsePersistentSafetyLocationFix(input: unknown, now = Date.now()): PersistentSafetyLocationFix | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const capturedAt = typeof value.capturedAt === "string" ? new Date(value.capturedAt) : null;
  const fix: PersistentSafetyLocationFix | null = typeof value.latitude === "number"
    && typeof value.longitude === "number"
    && typeof value.accuracyMeters === "number"
    && capturedAt
    && (value.platform === "ios" || value.platform === "android")
    && typeof value.background === "boolean"
    ? {
        latitude: value.latitude,
        longitude: value.longitude,
        accuracyMeters: value.accuracyMeters,
        capturedAt,
        platform: value.platform,
        background: value.background,
      }
    : null;
  return fix && validFix(fix, now) ? fix : null;
}

export function sealPersistentSafetyLocation(
  ownerId: string,
  fix: PersistentSafetyLocationFix,
  environment: NodeJS.ProcessEnv = process.env,
): { encryptedPayload: string; encryptionKeyVersion: string } {
  const key = parsePersistentSafetyLocationKeyring(environment.MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS)[0];
  if (!key || !validFix(fix)) throw new Error("PERSISTENT_SAFETY_LOCATION_ENCRYPTION_UNAVAILABLE");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key.key, iv);
  cipher.setAAD(aad(ownerId));
  const plaintext = Buffer.from(JSON.stringify({
    latitude: fix.latitude,
    longitude: fix.longitude,
    capturedAt: fix.capturedAt.toISOString(),
    accuracyMeters: fix.accuracyMeters,
  }), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptionKeyVersion: key.version,
    encryptedPayload: [ENVELOPE_VERSION, key.version, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join("."),
  };
}

export function openPersistentSafetyLocation(
  ownerId: string,
  encryptedPayload: string,
  expectedKeyVersion: string,
  environment: NodeJS.ProcessEnv = process.env,
): Omit<PersistentSafetyLocationFix, "platform" | "background"> {
  const [envelopeVersion, version, ivValue, tagValue, ciphertextValue, ...rest] = encryptedPayload.split(".");
  if (envelopeVersion !== ENVELOPE_VERSION || !version || version !== expectedKeyVersion || !ivValue || !tagValue || !ciphertextValue || rest.length) {
    throw new Error("PERSISTENT_SAFETY_LOCATION_DECRYPTION_INVALID");
  }
  const key = parsePersistentSafetyLocationKeyring(environment.MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS)
    .find((candidate) => candidate.version === version);
  if (!key) throw new Error("PERSISTENT_SAFETY_LOCATION_DECRYPTION_UNAVAILABLE");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.key, Buffer.from(ivValue, "base64url"));
    decipher.setAAD(aad(ownerId));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const parsed = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8")) as Partial<Record<string, unknown>>;
    const capturedAt = typeof parsed.capturedAt === "string" ? new Date(parsed.capturedAt) : null;
    const candidate = capturedAt && typeof parsed.latitude === "number" && typeof parsed.longitude === "number" && typeof parsed.accuracyMeters === "number"
      ? {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          capturedAt,
          accuracyMeters: parsed.accuracyMeters,
          platform: "ios" as const,
          background: false,
        }
      : null;
    if (!candidate || !validFix(candidate)) throw new Error("PERSISTENT_SAFETY_LOCATION_DECRYPTION_INVALID");
    return {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      capturedAt: candidate.capturedAt,
      accuracyMeters: candidate.accuracyMeters,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PERSISTENT_SAFETY_LOCATION_")) throw error;
    throw new Error("PERSISTENT_SAFETY_LOCATION_DECRYPTION_INVALID");
  }
}

export function persistentSafetyLocationIsFresh(
  capturedAt: Date | null | undefined,
  now = Date.now(),
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const freshnessWindowMs = persistentSafetyLocationFreshnessWindowMs(environment);
  if (!freshnessWindowMs || !capturedAt || !Number.isFinite(capturedAt.getTime())) return false;
  const time = capturedAt.getTime();
  return time <= now && now - time <= freshnessWindowMs;
}
