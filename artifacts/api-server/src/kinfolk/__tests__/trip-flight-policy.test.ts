import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FLIGHT_STORAGE_PLACEHOLDER,
  KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE,
  openTripFlight,
  parseFlightAttachInput,
  parseFlightInput,
  sealTripFlight,
  type StoredKinfolkTripFlight,
} from "../trip-flight-policy";
import { PrivateMemoryEncryptionIntegrityError } from "../private-memory-encryption";

const ownerId = "synthetic-owner";
const id = "20000000-0000-4000-8000-000000000001";
const input = {
  flightNumber: "AA1234",
  airline: "Synthetic Air",
  departureDate: "2026-11-12",
  origin: "ATL",
  destination: "ORD",
  notes: "Synthetic private note",
  memberConfirmed: true,
};

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 71).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-flight-policy-v1");
});
afterEach(() => vi.unstubAllEnvs());

function encryptedRow(): StoredKinfolkTripFlight {
  const base = { id, userId: ownerId };
  return {
    ...base,
    tripId: "20000000-0000-4000-8000-000000000002",
    ...sealTripFlight({ ...input }, base),
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"),
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
  };
}

describe("private Trip flight encryption policy", () => {
  it("requires an exact confirmed full private flight and excludes restricted fields", () => {
    expect(parseFlightInput(input)).toMatchObject({ flightNumber: "AA1234", origin: "ATL", destination: "ORD" });
    expect(parseFlightInput({ ...input, memberConfirmed: false })).toBeNull();
    expect(parseFlightInput({ ...input, flightNumber: "not a flight" })).toBeNull();
    expect(parseFlightInput({ ...input, origin: "12345" })).toBeNull();
    expect(parseFlightInput({ ...input, pnr: "disallowed" } as never)).toBeNull();
    expect(parseFlightAttachInput({ memberConfirmed: true })).toEqual({});
    expect(parseFlightAttachInput({ memberConfirmed: true, flight: { ...input } })).toBeNull();
    const { memberConfirmed: _confirmed, ...correction } = input;
    expect(parseFlightAttachInput({ memberConfirmed: true, flight: correction })).toMatchObject({ correction });
  });

  it("encrypts every new field and opens it only for its owner", () => {
    const row = encryptedRow();
    expect(FLIGHT_STORAGE_PLACEHOLDER.length).toBeLessThanOrEqual(10);
    expect(row.flightNumber).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(row.airline).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(row.departureDate).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(row.origin).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(row.destination).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(row.notes).toBe(FLIGHT_STORAGE_PLACEHOLDER);
    expect(JSON.stringify(row)).not.toContain("Synthetic Air");
    const { memberConfirmed: _memberConfirmed, ...expected } = input;
    expect(openTripFlight(row, ownerId)).toEqual(expected);
    expect(() => openTripFlight(row, "synthetic-other-owner")).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("reads a previously sealed long-marker envelope without treating it as plaintext", () => {
    const row = encryptedRow();
    Object.assign(row, {
      flightNumber: "[Encrypted private memory]",
      airline: "[Encrypted private memory]",
      departureDate: "[Encrypted private memory]",
      origin: "[Encrypted private memory]",
      destination: "[Encrypted private memory]",
      notes: "[Encrypted private memory]",
    });
    expect(openTripFlight(row, ownerId)).toMatchObject({ flightNumber: input.flightNumber, origin: input.origin });
  });

  it("permits owner-only legacy reads but fails closed on a partial or tampered envelope", () => {
    const legacy: StoredKinfolkTripFlight = {
      id,
      userId: ownerId,
      tripId: null,
      flightNumber: "DL99",
      encryptedFlightNumber: null,
      flightNumberEncryptionKeyId: null,
      airline: "Synthetic legacy airline",
      encryptedAirline: null,
      airlineEncryptionKeyId: null,
      departureDate: "2026-12-14",
      encryptedDepartureDate: null,
      departureDateEncryptionKeyId: null,
      origin: "JFK",
      encryptedOrigin: null,
      originEncryptionKeyId: null,
      destination: "LAX",
      encryptedDestination: null,
      destinationEncryptionKeyId: null,
      notes: null,
      encryptedNotes: null,
      notesEncryptionKeyId: null,
      memberConfirmedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: null,
    };
    expect(openTripFlight(legacy, ownerId)).toMatchObject({ flightNumber: "DL99", notes: "" });
    expect(() => openTripFlight(legacy, "synthetic-other-owner")).toThrow(PrivateMemoryEncryptionIntegrityError);

    const partial = encryptedRow();
    partial.encryptedFlightNumber = null;
    expect(() => openTripFlight(partial, ownerId)).toThrow(PrivateMemoryEncryptionIntegrityError);
    const tampered = encryptedRow();
    tampered.encryptedNotes += ".tamper";
    expect(() => openTripFlight(tampered, ownerId)).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("states that private flight context has no automatic downstream use", () => {
    expect(KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE.join(" ")).toContain("No automatic Kinfolk chat, memory, recommendations, calendar, reminders, sharing");
    expect(KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE.join(" ")).toContain("Do not store PNRs, booking references, exact addresses, coordinates, or live location.");
  });
});
