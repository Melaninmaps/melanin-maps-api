import {
  encryptOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  readOrdinaryMemoryContent,
} from "./private-memory-encryption";
import { isTripId, TRIP_STORAGE_PLACEHOLDER } from "./trip-policy";

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

type ItineraryField = "dayLabel" | "startTimeLabel" | "endTimeLabel" | "title" | "note";

function text(value: unknown, maxLength: number, required: boolean): string | null {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if ((required && !normalized) || normalized.length > maxLength || CONTROL.test(normalized)) return null;
  return normalized;
}

function positiveOrder(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 200) return null;
  return value;
}

function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}

export type TripItineraryInput = {
  dayLabel: string;
  dayOrder: number;
  startTimeLabel: string;
  endTimeLabel: string;
  title: string;
  note: string;
};

/** A deliberate private item replacement; the only scheduling metadata is the owner-selected display order. */
export function parseTripItineraryInput(body: unknown): TripItineraryInput | null {
  if (!exactObject(body, ["dayLabel", "dayOrder", "startTimeLabel", "endTimeLabel", "title", "note", "memberConfirmed"]) ||
      body.memberConfirmed !== true) return null;
  const dayLabel = text(body.dayLabel, 80, true);
  const dayOrder = positiveOrder(body.dayOrder);
  const startTimeLabel = text(body.startTimeLabel, 32, false);
  const endTimeLabel = text(body.endTimeLabel, 32, false);
  const title = text(body.title, 160, true);
  const note = text(body.note, 2_000, false);
  return dayLabel && dayOrder && startTimeLabel !== null && endTimeLabel !== null && title && note !== null
    ? { dayLabel, dayOrder, startTimeLabel, endTimeLabel, title, note }
    : null;
}

export function parseTripItineraryDeleteConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && body.memberConfirmed === true;
}

export function parseTripItineraryOrderInput(body: unknown): string[] | null {
  if (!exactObject(body, ["entryIds", "memberConfirmed"]) || body.memberConfirmed !== true ||
      !Array.isArray(body.entryIds) || body.entryIds.length < 1 || body.entryIds.length > 200 ||
      body.entryIds.some((id) => !isTripId(id)) || new Set(body.entryIds).size !== body.entryIds.length) return null;
  return body.entryIds as string[];
}

export type StoredKinfolkTripItineraryEntry = {
  id: string;
  tripId: string;
  userId: string;
  dayLabel: string;
  encryptedDayLabel: string;
  dayLabelEncryptionKeyId: string;
  dayOrder: number;
  startTimeLabel: string;
  encryptedStartTimeLabel: string;
  startTimeLabelEncryptionKeyId: string;
  endTimeLabel: string;
  encryptedEndTimeLabel: string;
  endTimeLabelEncryptionKeyId: string;
  title: string;
  encryptedTitle: string;
  titleEncryptionKeyId: string;
  note: string;
  encryptedNote: string;
  noteEncryptionKeyId: string;
  memberConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type EntryIdentity = Pick<StoredKinfolkTripItineraryEntry, "id" | "tripId" | "userId">;

/** Domain separation makes a field ciphertext unusable for another owner, Trip, entry, or field. */
function purpose(entry: EntryIdentity, field: ItineraryField): string {
  return JSON.stringify(["kinfolk-trip-itinerary-v1", entry.userId, entry.tripId, entry.id, field]);
}

function sealField(value: string, entry: EntryIdentity, field: ItineraryField) {
  const encrypted = encryptOrdinaryMemoryContent(JSON.stringify({ [field]: value }), entry.userId, purpose(entry, field));
  return { placeholder: encrypted.content, ciphertext: encrypted.encryptedContent, keyId: encrypted.encryptionKeyId };
}

function fieldStorage(entry: StoredKinfolkTripItineraryEntry, field: ItineraryField) {
  switch (field) {
    case "dayLabel": return { content: entry.dayLabel, encryptedContent: entry.encryptedDayLabel, encryptionKeyId: entry.dayLabelEncryptionKeyId };
    case "startTimeLabel": return { content: entry.startTimeLabel, encryptedContent: entry.encryptedStartTimeLabel, encryptionKeyId: entry.startTimeLabelEncryptionKeyId };
    case "endTimeLabel": return { content: entry.endTimeLabel, encryptedContent: entry.encryptedEndTimeLabel, encryptionKeyId: entry.endTimeLabelEncryptionKeyId };
    case "title": return { content: entry.title, encryptedContent: entry.encryptedTitle, encryptionKeyId: entry.titleEncryptionKeyId };
    case "note": return { content: entry.note, encryptedContent: entry.encryptedNote, encryptionKeyId: entry.noteEncryptionKeyId };
  }
}

function openField(entry: StoredKinfolkTripItineraryEntry, owner: string, field: ItineraryField): string {
  const stored = fieldStorage(entry, field);
  if (stored.content !== TRIP_STORAGE_PLACEHOLDER || !stored.encryptedContent || !stored.encryptionKeyId) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  const opened = readOrdinaryMemoryContent({ ...stored, purpose: purpose(entry, field) }, owner);
  const max = field === "note" ? 2_000 : field === "title" ? 160 : field === "dayLabel" ? 80 : 32;
  try {
    const value = text((JSON.parse(opened) as Record<string, unknown>)[field], max, field === "dayLabel" || field === "title");
    if (value === null) throw new Error();
    return value;
  } catch {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
}

export function sealTripItineraryEntry(input: TripItineraryInput, entry: EntryIdentity) {
  const dayLabel = sealField(input.dayLabel, entry, "dayLabel");
  const startTimeLabel = sealField(input.startTimeLabel, entry, "startTimeLabel");
  const endTimeLabel = sealField(input.endTimeLabel, entry, "endTimeLabel");
  const title = sealField(input.title, entry, "title");
  const note = sealField(input.note, entry, "note");
  return {
    dayLabel: dayLabel.placeholder,
    encryptedDayLabel: dayLabel.ciphertext,
    dayLabelEncryptionKeyId: dayLabel.keyId,
    startTimeLabel: startTimeLabel.placeholder,
    encryptedStartTimeLabel: startTimeLabel.ciphertext,
    startTimeLabelEncryptionKeyId: startTimeLabel.keyId,
    endTimeLabel: endTimeLabel.placeholder,
    encryptedEndTimeLabel: endTimeLabel.ciphertext,
    endTimeLabelEncryptionKeyId: endTimeLabel.keyId,
    title: title.placeholder,
    encryptedTitle: title.ciphertext,
    titleEncryptionKeyId: title.keyId,
    note: note.placeholder,
    encryptedNote: note.ciphertext,
    noteEncryptionKeyId: note.keyId,
  };
}

/** Opens a complete owner-scoped envelope only; no partial or legacy plaintext fallback exists. */
export function openTripItineraryEntry(entry: StoredKinfolkTripItineraryEntry, owner: string): TripItineraryInput {
  if (entry.userId !== owner || !isTripId(entry.id) || !isTripId(entry.tripId) || !entry.memberConfirmedAt || !positiveOrder(entry.dayOrder)) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  return {
    dayLabel: openField(entry, owner, "dayLabel"),
    dayOrder: entry.dayOrder,
    startTimeLabel: openField(entry, owner, "startTimeLabel"),
    endTimeLabel: openField(entry, owner, "endTimeLabel"),
    title: openField(entry, owner, "title"),
    note: openField(entry, owner, "note"),
  };
}

/** Manual private organizer only: no scheduling, booking, notification, sharing, or automatic service use. */
export const KINFOLK_TRIP_ITINERARY_DEFAULT_NON_USE = Object.freeze([
  "Private manual itinerary only; it does not schedule, book, notify, share, or automatically use any service.",
  "No automatic Kinfolk chat, memory, profile, discovery, Map, Directory, Community, or Safety use.",
  "No provider, calendar, flight, hotel, event, document, task, reminder, analytics, or recipient-sharing integration.",
  "No address, location, or coordinates fields exist.",
]);
