import {
  decryptSensitiveMemoryContent,
  encryptSensitiveMemoryContent,
  SensitiveMemoryEncryptionUnavailableError,
} from "../kinfolk/sensitive-memory-encryption";

const ENVELOPE_VERSION = 1;
const MAX_VENUE_LENGTH = 240;

export class MeetupPrivateDetailsUnavailableError extends Error {
  constructor() {
    super("Private meetup details are unavailable right now.");
    this.name = "MeetupPrivateDetailsUnavailableError";
  }
}

export function normalizeMeetupVenue(value: unknown): string {
  if (typeof value !== "string") {
    throw new MeetupPrivateDetailsUnavailableError();
  }
  const venue = value.trim().replace(/\s+/g, " ");
  if (!venue || venue.length > MAX_VENUE_LENGTH) {
    throw new MeetupPrivateDetailsUnavailableError();
  }

  // Member-to-member venue sharing must never become a covert live-location or
  // home-address channel. A planned public meeting place is allowed only after
  // both participants independently approve the request.
  if (
    /^[-+]?\d{1,2}\.\d{3,}\s*,\s*[-+]?\d{1,3}\.\d{3,}$/.test(venue)
    || /\b(?:my|our)\s+(?:current\s+)?(?:home|house|apartment|address)\b/i.test(venue)
  ) {
    throw new MeetupPrivateDetailsUnavailableError();
  }
  return venue;
}

type EncryptedMeetupVenue = Readonly<{
  version: number;
  encryptedContent: string;
  encryptionKeyId: string;
}>;

function parseEncryptedVenue(value: string): EncryptedMeetupVenue | null {
  try {
    const parsed = JSON.parse(value) as Partial<EncryptedMeetupVenue>;
    if (
      parsed.version !== ENVELOPE_VERSION
      || typeof parsed.encryptedContent !== "string"
      || typeof parsed.encryptionKeyId !== "string"
      || Object.keys(parsed).length !== 3
    ) {
      return null;
    }
    return {
      version: ENVELOPE_VERSION,
      encryptedContent: parsed.encryptedContent,
      encryptionKeyId: parsed.encryptionKeyId,
    };
  } catch {
    return null;
  }
}

/**
 * Stores the participant-only venue in the existing private vault encryption
 * boundary. It never falls back to plaintext, a generated key, coordinates,
 * or an external maps lookup.
 */
export function sealMeetupVenue(venue: string): string {
  try {
    const encrypted = encryptSensitiveMemoryContent(normalizeMeetupVenue(venue));
    return JSON.stringify({
      version: ENVELOPE_VERSION,
      encryptedContent: encrypted.encryptedContent,
      encryptionKeyId: encrypted.encryptionKeyId,
    } satisfies EncryptedMeetupVenue);
  } catch (error) {
    if (error instanceof SensitiveMemoryEncryptionUnavailableError) {
      throw new MeetupPrivateDetailsUnavailableError();
    }
    throw error;
  }
}

/**
 * Returns null on unavailable or invalid encryption rather than exposing any
 * stored value. Legacy plaintext rows remain redacted by the caller.
 */
export function openMeetupVenue(value: string | null | undefined): string | null {
  if (!value) return null;
  const encrypted = parseEncryptedVenue(value);
  if (!encrypted) return null;
  try {
    return normalizeMeetupVenue(
      decryptSensitiveMemoryContent(encrypted.encryptedContent, encrypted.encryptionKeyId),
    );
  } catch {
    return null;
  }
}
