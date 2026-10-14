import {
  encryptOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  readOrdinaryMemoryContent,
} from "./private-memory-encryption";

export const TRIP_STORAGE_PLACEHOLDER = "[Encrypted private memory]";
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Private text only; no raw exact address, location, or coordinate field exists in this aggregate. */
function text(value: unknown, maxLength: number, required: boolean): string | null {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if ((required && !normalized) || normalized.length > maxLength || CONTROL.test(normalized)) return null;
  return normalized;
}

/** A Trip destination is a city/region/country label, never a street address or coordinates. */
function destination(value: unknown): string | null {
  const candidate = text(value, 120, true);
  if (!candidate) return null;
  const coordinates = /[-+]?\d{1,3}(?:\.\d+)?\s*,\s*[-+]?\d{1,3}(?:\.\d+)?/;
  const postalCode = /\b\d{5}(?:-\d{4})?\b/;
  const addressNumber = /\b\d{1,6}\b/;
  const streetSuffix = /\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|parkway|pkwy|place|pl|court|ct)\.?\b/i;
  // City/region/country labels may contain ordinary numbers (for example a
  // district), but never a street number plus a street suffix. ZIP codes are
  // also excluded because they are a narrower location than this Trip model needs.
  if (coordinates.test(candidate) || postalCode.test(candidate) ||
      (addressNumber.test(candidate) && streetSuffix.test(candidate))) return null;
  return candidate;
}

function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}

export type TripInput = { title: string; destination: string; note: string };

/** Every create/update is a deliberate full private-record replacement. */
export function parseTripInput(body: unknown): TripInput | null {
  if (!exactObject(body, ["title", "destination", "note", "memberConfirmed"]) || body.memberConfirmed !== true) return null;
  const title = text(body.title, 120, true);
  const privateDestination = destination(body.destination);
  const note = text(body.note, 1_000, false);
  return title && privateDestination && note !== null ? { title, destination: privateDestination, note } : null;
}

export function parseTripDeleteConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && body.memberConfirmed === true;
}

export function isTripId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export type StoredKinfolkTrip = {
  id: string;
  userId: string;
  title: string;
  encryptedTitle: string;
  titleEncryptionKeyId: string;
  destination: string;
  encryptedDestination: string;
  destinationEncryptionKeyId: string;
  note: string;
  encryptedNote: string;
  noteEncryptionKeyId: string;
  memberConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function purpose(trip: Pick<StoredKinfolkTrip, "id">, field: "title" | "destination" | "note"): string {
  return JSON.stringify(["kinfolk-trip-v1", trip.id, field]);
}

function sealField(value: string, trip: Pick<StoredKinfolkTrip, "id" | "userId">, field: "title" | "destination" | "note") {
  const encrypted = encryptOrdinaryMemoryContent(JSON.stringify({ [field]: value }), trip.userId, purpose(trip, field));
  return { placeholder: encrypted.content, ciphertext: encrypted.encryptedContent, keyId: encrypted.encryptionKeyId };
}

function openField(
  trip: StoredKinfolkTrip,
  owner: string,
  field: "title" | "destination" | "note",
): string {
  const stored = field === "title"
    ? { content: trip.title, encryptedContent: trip.encryptedTitle, encryptionKeyId: trip.titleEncryptionKeyId }
    : field === "destination"
      ? { content: trip.destination, encryptedContent: trip.encryptedDestination, encryptionKeyId: trip.destinationEncryptionKeyId }
      : { content: trip.note, encryptedContent: trip.encryptedNote, encryptionKeyId: trip.noteEncryptionKeyId };
  if (stored.content !== TRIP_STORAGE_PLACEHOLDER || !stored.encryptedContent || !stored.encryptionKeyId) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  const opened = readOrdinaryMemoryContent({ ...stored, purpose: purpose(trip, field) }, owner);
  try {
    const payload = JSON.parse(opened) as Record<string, unknown>;
    const value = field === "destination" ? destination(payload[field]) : text(payload[field], field === "note" ? 1_000 : 120, field !== "note");
    if (value === null) throw new Error();
    return value;
  } catch {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
}

/** Encrypts each member-authored field independently and binds it to owner + Trip ID + field. */
export function sealTrip(input: TripInput, trip: Pick<StoredKinfolkTrip, "id" | "userId">) {
  const title = sealField(input.title, trip, "title");
  const tripDestination = sealField(input.destination, trip, "destination");
  const note = sealField(input.note, trip, "note");
  return {
    title: title.placeholder,
    encryptedTitle: title.ciphertext,
    titleEncryptionKeyId: title.keyId,
    destination: tripDestination.placeholder,
    encryptedDestination: tripDestination.ciphertext,
    destinationEncryptionKeyId: tripDestination.keyId,
    note: note.placeholder,
    encryptedNote: note.ciphertext,
    noteEncryptionKeyId: note.keyId,
  };
}

/** Reads only after an owner-scoped lookup. Any partial/tampered envelope fails closed. */
export function openTrip(trip: StoredKinfolkTrip, owner: string): TripInput {
  if (trip.userId !== owner || !trip.id || !trip.memberConfirmedAt) throw new PrivateMemoryEncryptionIntegrityError();
  return {
    title: openField(trip, owner, "title"),
    destination: openField(trip, owner, "destination"),
    note: openField(trip, owner, "note"),
  };
}

/**
 * Trips are storage-only in this bounded repair. There is deliberately no prompt
 * builder or integration: no automatic Kinfolk chat/memory/profile/discovery,
 * Map/Directory/Community/Safety/provider/analytics/task/reminder/share use.
 */
export const KINFOLK_TRIP_DEFAULT_NON_USE = Object.freeze([
  "No automatic Kinfolk chat or private-memory use.",
  "No profile, discovery, Map, Directory, Community, or Safety use.",
  "No provider, calendar, flight, hotel, event, document, task, reminder, analytics, or sharing integration.",
  "No exact address, location, or coordinates are collected.",
]);
