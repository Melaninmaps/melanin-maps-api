import {
  encryptOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  readOrdinaryMemoryContent,
} from "./private-memory-encryption";
import { isTripId, TRIP_STORAGE_PLACEHOLDER } from "./trip-policy";

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
const FLIGHT_NUMBER = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/;
const IATA = /^[A-Z]{3}$/;

type FlightField = "flightNumber" | "airline" | "departureDate" | "origin" | "destination" | "notes";
const fields: readonly FlightField[] = ["flightNumber", "airline", "departureDate", "origin", "destination", "notes"];

function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}

function normalizedText(value: unknown, maximum: number, required: boolean): string | null {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if ((required && !normalized) || normalized.length > maximum || CONTROL.test(normalized)) return null;
  return normalized;
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year!, month! - 1, day!));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month! - 1 && candidate.getUTCDate() === day
    ? value
    : null;
}

function airport(value: unknown): string | null {
  const candidate = normalizedText(value, 3, true)?.toUpperCase();
  return candidate && IATA.test(candidate) ? candidate : null;
}

function flightNumber(value: unknown): string | null {
  const candidate = normalizedText(value, 12, true)?.toUpperCase().replace(/\s+/g, "");
  return candidate && FLIGHT_NUMBER.test(candidate) ? candidate : null;
}

function airline(value: unknown): string | null {
  const candidate = normalizedText(value, 100, true);
  return candidate && /^[\p{L}\p{N} .,'&()/-]+$/u.test(candidate) ? candidate : null;
}

export type FlightInput = Readonly<{
  flightNumber: string;
  airline: string;
  departureDate: string;
  origin: string;
  destination: string;
  notes: string;
}>;

function parseFields(body: Record<string, unknown>): FlightInput | null {
  const parsedFlightNumber = flightNumber(body.flightNumber);
  const parsedAirline = airline(body.airline);
  const parsedDepartureDate = isoDate(body.departureDate);
  const parsedOrigin = airport(body.origin);
  const parsedDestination = airport(body.destination);
  const parsedNotes = normalizedText(body.notes, 1_000, false);
  return parsedFlightNumber && parsedAirline && parsedDepartureDate && parsedOrigin && parsedDestination && parsedNotes !== null
    ? { flightNumber: parsedFlightNumber, airline: parsedAirline, departureDate: parsedDepartureDate, origin: parsedOrigin, destination: parsedDestination, notes: parsedNotes }
    : null;
}

/** New or corrected flight content is always a complete, deliberate replacement. */
export function parseFlightInput(body: unknown): FlightInput | null {
  if (!exactObject(body, ["flightNumber", "airline", "departureDate", "origin", "destination", "notes", "memberConfirmed"]) || body.memberConfirmed !== true) return null;
  return parseFields(body);
}

export function parseFlightDeleteConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && body.memberConfirmed === true;
}

export type FlightAttachInput = Readonly<{ correction?: FlightInput }>;

/** Attaching without a correction preserves a legacy row; attaching with one seals every authored field. */
export function parseFlightAttachInput(body: unknown): FlightAttachInput | null {
  if (!exactObject(body, ["memberConfirmed", "flight"]) || body.memberConfirmed !== true) return null;
  if (body.flight === undefined) return {};
  if (!body.flight || typeof body.flight !== "object" || Array.isArray(body.flight) ||
      !exactObject(body.flight, ["flightNumber", "airline", "departureDate", "origin", "destination", "notes"])) return null;
  const correction = parseFields(body.flight);
  return correction ? { correction } : null;
}

export function isFlightId(value: unknown): value is string {
  return isTripId(value);
}

export type StoredKinfolkTripFlight = {
  id: string;
  userId: string;
  tripId: string | null;
  flightNumber: string;
  encryptedFlightNumber: string | null;
  flightNumberEncryptionKeyId: string | null;
  airline: string | null;
  encryptedAirline: string | null;
  airlineEncryptionKeyId: string | null;
  departureDate: string;
  encryptedDepartureDate: string | null;
  departureDateEncryptionKeyId: string | null;
  origin: string | null;
  encryptedOrigin: string | null;
  originEncryptionKeyId: string | null;
  destination: string | null;
  encryptedDestination: string | null;
  destinationEncryptionKeyId: string | null;
  notes: string | null;
  encryptedNotes: string | null;
  notesEncryptionKeyId: string | null;
  memberConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
};

type FlightIdentity = Pick<StoredKinfolkTripFlight, "id" | "userId">;

/** A field cannot be replayed to a different owner, flight record, or logical field. */
function purpose(flight: FlightIdentity, field: FlightField): string {
  return JSON.stringify(["kinfolk-trip-flight-v1", flight.userId, flight.id, field]);
}

function storage(flight: StoredKinfolkTripFlight, field: FlightField) {
  switch (field) {
    case "flightNumber": return { content: flight.flightNumber, encryptedContent: flight.encryptedFlightNumber, encryptionKeyId: flight.flightNumberEncryptionKeyId };
    case "airline": return { content: flight.airline, encryptedContent: flight.encryptedAirline, encryptionKeyId: flight.airlineEncryptionKeyId };
    case "departureDate": return { content: flight.departureDate, encryptedContent: flight.encryptedDepartureDate, encryptionKeyId: flight.departureDateEncryptionKeyId };
    case "origin": return { content: flight.origin, encryptedContent: flight.encryptedOrigin, encryptionKeyId: flight.originEncryptionKeyId };
    case "destination": return { content: flight.destination, encryptedContent: flight.encryptedDestination, encryptionKeyId: flight.destinationEncryptionKeyId };
    case "notes": return { content: flight.notes, encryptedContent: flight.encryptedNotes, encryptionKeyId: flight.notesEncryptionKeyId };
  }
}

function encryptedEnvelopeState(flight: StoredKinfolkTripFlight): "legacy" | "encrypted" {
  const values = fields.flatMap((field) => {
    const value = storage(flight, field);
    return [value.encryptedContent, value.encryptionKeyId];
  });
  if (values.every((value) => value == null)) {
    // A placeholder-only legacy row is neither readable plaintext nor a valid vault envelope.
    if (fields.some((field) => storage(flight, field).content === TRIP_STORAGE_PLACEHOLDER)) {
      throw new PrivateMemoryEncryptionIntegrityError();
    }
    return "legacy";
  }
  if (values.some((value) => !value)) throw new PrivateMemoryEncryptionIntegrityError();
  if (fields.some((field) => storage(flight, field).content !== TRIP_STORAGE_PLACEHOLDER)) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  return "encrypted";
}

function legacyField(flight: StoredKinfolkTripFlight, field: FlightField): string {
  const value = storage(flight, field).content;
  if (typeof value === "string") return value;
  // Historic airline/airport/note fields were nullable. Preserve that owner-only
  // compatibility without treating missing required flight/date values as valid.
  if (value == null && (field === "airline" || field === "origin" || field === "destination" || field === "notes")) return "";
  throw new PrivateMemoryEncryptionIntegrityError();
}

function openEncryptedField(flight: StoredKinfolkTripFlight, ownerId: string, field: FlightField): string {
  const value = storage(flight, field);
  if (value.content !== TRIP_STORAGE_PLACEHOLDER || !value.encryptedContent || !value.encryptionKeyId) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  // Build a complete typed envelope after the fail-closed validation above; do
  // not pass nullable legacy fields to the decryptor or permit a fallback.
  const opened = readOrdinaryMemoryContent({
    content: TRIP_STORAGE_PLACEHOLDER,
    encryptedContent: value.encryptedContent,
    encryptionKeyId: value.encryptionKeyId,
    purpose: purpose(flight, field),
  }, ownerId);
  try {
    const payload = JSON.parse(opened) as Record<string, unknown>;
    const parsed = field === "flightNumber" ? flightNumber(payload[field])
      : field === "airline" ? airline(payload[field])
        : field === "departureDate" ? isoDate(payload[field])
          : field === "origin" || field === "destination" ? airport(payload[field])
            : normalizedText(payload[field], 1_000, false);
    if (parsed === null) throw new Error();
    return parsed;
  } catch {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
}

/** Opens only after an owner-scoped query. Complete envelopes fail closed; legacy rows remain owner-readable. */
export function openTripFlight(flight: StoredKinfolkTripFlight, ownerId: string): FlightInput {
  if (flight.userId !== ownerId || !isFlightId(flight.id)) throw new PrivateMemoryEncryptionIntegrityError();
  const state = encryptedEnvelopeState(flight);
  if (state === "legacy") {
    // Legacy content is intentionally not normalized, rewritten, or exposed outside this owner response.
    return {
      flightNumber: legacyField(flight, "flightNumber"),
      airline: legacyField(flight, "airline"),
      departureDate: legacyField(flight, "departureDate"),
      origin: legacyField(flight, "origin"),
      destination: legacyField(flight, "destination"),
      notes: legacyField(flight, "notes"),
    };
  }
  return {
    flightNumber: openEncryptedField(flight, ownerId, "flightNumber"),
    airline: openEncryptedField(flight, ownerId, "airline"),
    departureDate: openEncryptedField(flight, ownerId, "departureDate"),
    origin: openEncryptedField(flight, ownerId, "origin"),
    destination: openEncryptedField(flight, ownerId, "destination"),
    notes: openEncryptedField(flight, ownerId, "notes"),
  };
}

function sealField(value: string, flight: FlightIdentity, field: FlightField) {
  // Do not persist the helper's transient duplicate fingerprint: flights have no plaintext hash or fingerprint column.
  const { content, encryptedContent, encryptionKeyId } = encryptOrdinaryMemoryContent(
    JSON.stringify({ [field]: value }), flight.userId, purpose(flight, field),
  );
  return { placeholder: content, ciphertext: encryptedContent, keyId: encryptionKeyId };
}

/** Every newly authored/corrected field is independently AES-GCM sealed. */
export function sealTripFlight(input: FlightInput, flight: FlightIdentity) {
  const flightNumber = sealField(input.flightNumber, flight, "flightNumber");
  const airline = sealField(input.airline, flight, "airline");
  const departureDate = sealField(input.departureDate, flight, "departureDate");
  const origin = sealField(input.origin, flight, "origin");
  const destination = sealField(input.destination, flight, "destination");
  const notes = sealField(input.notes, flight, "notes");
  return {
    flightNumber: flightNumber.placeholder, encryptedFlightNumber: flightNumber.ciphertext, flightNumberEncryptionKeyId: flightNumber.keyId,
    airline: airline.placeholder, encryptedAirline: airline.ciphertext, airlineEncryptionKeyId: airline.keyId,
    departureDate: departureDate.placeholder, encryptedDepartureDate: departureDate.ciphertext, departureDateEncryptionKeyId: departureDate.keyId,
    origin: origin.placeholder, encryptedOrigin: origin.ciphertext, originEncryptionKeyId: origin.keyId,
    destination: destination.placeholder, encryptedDestination: destination.ciphertext, destinationEncryptionKeyId: destination.keyId,
    notes: notes.placeholder, encryptedNotes: notes.ciphertext, notesEncryptionKeyId: notes.keyId,
  };
}

/** This bounded context never becomes chat/memory, provider tracking, calendar, sharing, or analytics input. */
export const KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE = Object.freeze([
  "Private flight context only; linking does not activate status tracking, booking, or provider use.",
  "No automatic Kinfolk chat, memory, recommendations, calendar, reminders, sharing, Directory, Map, Community, Safety, or analytics use.",
  "Do not store PNRs, booking references, exact addresses, coordinates, or live location.",
]);
