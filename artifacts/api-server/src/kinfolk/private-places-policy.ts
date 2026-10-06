import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const PRIVATE_PLACES_DISCLOSURE_VERSION = "private-places-google-geocoding-v1";
export const PRIVATE_PLACES_GEOCODING_DISCLOSURE =
  "Your exact address will be sent once to Google Maps only to obtain nearby-search coordinates. MWM encrypts the saved place, never sends it to Kinfolk, and never uses it for chat, model training, analytics, check-ins, or automatic recommendations.";

const ENCRYPTION_KEY_BYTES = 32;
const ENVELOPE_VERSION = "v1";
const MAX_LABEL_LENGTH = 80;
const MAX_ADDRESS_LENGTH = 300;

export type PrivatePlacePayload = Readonly<{
  exactAddress: string;
  latitude: number;
  longitude: number;
  googleFormattedAddress: string;
}>;

type ParsedKey = Readonly<{ version: string; key: Buffer }>;

function canonicalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= max ? normalized : null;
}

/** Labels are display-only; never allow an address-shaped label to leak into ordinary UI. */
export function normalizePrivatePlaceLabel(value: unknown): string | null {
  const label = canonicalText(value, MAX_LABEL_LENGTH);
  if (!label) return null;
  if (/\d/.test(label) || /\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|court|ct\.?)\b/i.test(label)) return null;
  return label;
}

export function normalizePrivatePlaceAddress(value: unknown): string | null {
  return canonicalText(value, MAX_ADDRESS_LENGTH);
}

export function isPrivatePlacesEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.KINFOLK_PRIVATE_PLACES_ENABLED === "true";
}

/**
 * KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS is a comma-delimited rotation ring:
 *   v1:base64-encoded-32-byte-key,v2:base64-encoded-32-byte-key
 * The first key encrypts; any listed version decrypts. There is intentionally
 * no fallback key, generated key, or plaintext compatibility mode.
 */
export function parsePrivatePlaceKeyring(value: string | undefined): ParsedKey[] {
  if (!value?.trim()) return [];
  const versions = new Set<string>();
  const parsed: ParsedKey[] = [];
  for (const part of value.split(",")) {
    const [version, encoded, ...extra] = part.trim().split(":");
    if (!version || !encoded || extra.length || !/^v[1-9][0-9]*$/.test(version) || versions.has(version)) return [];
    let key: Buffer;
    try {
      key = Buffer.from(encoded, "base64");
    } catch {
      return [];
    }
    if (key.length !== ENCRYPTION_KEY_BYTES) return [];
    versions.add(version);
    parsed.push({ version, key });
  }
  return parsed;
}

export function privatePlacesRuntimeState(environment: NodeJS.ProcessEnv = process.env): {
  enabled: boolean;
  encryptionReady: boolean;
  disclosureVersion: string;
  disclosure: string;
} {
  const enabled = isPrivatePlacesEnabled(environment);
  const encryptionReady = parsePrivatePlaceKeyring(environment.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS).length > 0;
  return {
    enabled: enabled && encryptionReady,
    encryptionReady,
    disclosureVersion: PRIVATE_PLACES_DISCLOSURE_VERSION,
    disclosure: PRIVATE_PLACES_GEOCODING_DISCLOSURE,
  };
}

export function sealPrivatePlace(payload: PrivatePlacePayload, environment: NodeJS.ProcessEnv = process.env): {
  encryptedPayload: string;
  encryptionKeyVersion: string;
} {
  const key = parsePrivatePlaceKeyring(environment.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS)[0];
  if (!key) throw new Error("PRIVATE_PLACES_ENCRYPTION_UNAVAILABLE");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key.key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptionKeyVersion: key.version,
    encryptedPayload: [ENVELOPE_VERSION, key.version, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join("."),
  };
}

export function openPrivatePlace(
  encryptedPayload: string,
  expectedKeyVersion: string,
  environment: NodeJS.ProcessEnv = process.env,
): PrivatePlacePayload {
  const [envelopeVersion, version, ivEncoded, tagEncoded, ciphertextEncoded, ...extra] = encryptedPayload.split(".");
  if (envelopeVersion !== ENVELOPE_VERSION || !version || version !== expectedKeyVersion || !ivEncoded || !tagEncoded || !ciphertextEncoded || extra.length) {
    throw new Error("PRIVATE_PLACES_DECRYPTION_INVALID");
  }
  const key = parsePrivatePlaceKeyring(environment.KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS).find((candidate) => candidate.version === version);
  if (!key) throw new Error("PRIVATE_PLACES_DECRYPTION_UNAVAILABLE");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.key, Buffer.from(ivEncoded, "base64"));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64"));
    const parsed = JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, "base64")), decipher.final()]).toString("utf8")) as Partial<PrivatePlacePayload>;
    const exactAddress = normalizePrivatePlaceAddress(parsed.exactAddress);
    const googleFormattedAddress = normalizePrivatePlaceAddress(parsed.googleFormattedAddress);
    const latitude = parsed.latitude;
    const longitude = parsed.longitude;
    if (!exactAddress || !googleFormattedAddress || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === undefined || longitude === undefined || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error("PRIVATE_PLACES_DECRYPTION_INVALID");
    }
    return { exactAddress, googleFormattedAddress, latitude, longitude };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PRIVATE_PLACES_")) throw error;
    throw new Error("PRIVATE_PLACES_DECRYPTION_INVALID");
  }
}
