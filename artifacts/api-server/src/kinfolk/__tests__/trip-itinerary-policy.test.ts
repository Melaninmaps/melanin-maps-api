import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  KINFOLK_TRIP_ITINERARY_DEFAULT_NON_USE,
  openTripItineraryEntry,
  parseTripItineraryInput,
  parseTripItineraryOrderInput,
  sealTripItineraryEntry,
  type StoredKinfolkTripItineraryEntry,
} from "../trip-itinerary-policy";
import { PrivateMemoryEncryptionIntegrityError, PrivateMemoryEncryptionUnavailableError } from "../private-memory-encryption";

const tripId = "10000000-0000-4000-8000-000000000001";
const entryId = "10000000-0000-4000-8000-000000000002";
const input = {
  dayLabel: "Day 1", dayOrder: 1, startTimeLabel: "9:00 AM", endTimeLabel: "10:30 AM",
  title: "Synthetic museum morning", note: "Synthetic private note only.",
};
const migration = readFileSync(new URL("../../../migrations/20261014_kinfolk_trip_itinerary_entries.approval-required.sql", import.meta.url), "utf8");

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 61).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-itinerary-v1");
});
afterEach(() => vi.unstubAllEnvs());

function entry(patch: Partial<StoredKinfolkTripItineraryEntry> = {}): StoredKinfolkTripItineraryEntry {
  const base = { id: entryId, tripId, userId: "owner-a" };
  return {
    ...base,
    ...sealTripItineraryEntry(input, base),
    dayOrder: 1,
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"),
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
    ...patch,
  };
}

describe("Kinfolk Trip itinerary private encryption policy", () => {
  it("ships only a conspicuously approval-required additive schema migration with no data work", () => {
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE");
    expect(migration).toContain("CREATE TABLE kinfolk_trip_itinerary_entries");
    expect(migration).toContain("FOREIGN KEY (trip_id, user_id) REFERENCES kinfolk_trips (id, user_id)");
    expect(migration).toContain("UNIQUE (trip_id, day_order)");
    for (const field of ["encrypted_day_label", "encrypted_start_time_label", "encrypted_end_time_label", "encrypted_title", "encrypted_note"]) {
      expect(migration).toContain(field);
    }
    expect(migration).not.toMatch(/\b(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\b/);
    expect(migration).toContain("No backfill or migration of AsyncStorage or other local entries.");
  });

  it("stores every member-authored itinerary field only as a placeholder and authenticated ciphertext", () => {
    const row = entry();
    for (const field of ["dayLabel", "startTimeLabel", "endTimeLabel", "title", "note"] as const) {
      expect(row[field]).toBe("[Encrypted private memory]");
      expect(JSON.stringify(row)).not.toContain(input[field]);
    }
    expect(openTripItineraryEntry(row, "owner-a")).toEqual(input);
    expect(() => openTripItineraryEntry(row, "owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("binds owner, Trip, entry, and field context and fails closed on partial or tampered crypto", () => {
    const row = entry();
    for (const changed of [
      { encryptedDayLabel: `${row.encryptedDayLabel}.tamper` },
      { startTimeLabelEncryptionKeyId: "" },
      { note: "legacy plaintext", encryptedNote: "" },
      { tripId: "10000000-0000-4000-8000-000000000003" },
      { id: "10000000-0000-4000-8000-000000000003" },
    ]) {
      expect(() => openTripItineraryEntry({ ...row, ...changed }, "owner-a")).toThrow(PrivateMemoryEncryptionIntegrityError);
    }
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(() => openTripItineraryEntry(row, "owner-a")).toThrow(PrivateMemoryEncryptionUnavailableError);
    expect(() => sealTripItineraryEntry(input, row)).toThrow(PrivateMemoryEncryptionUnavailableError);
  });

  it("requires confirmation and strictly validates free-form labels, title, note, and full ordering", () => {
    expect(parseTripItineraryInput({ ...input, memberConfirmed: false })).toBeNull();
    expect(parseTripItineraryInput({ ...input, memberConfirmed: true, address: "never accepted" })).toBeNull();
    expect(parseTripItineraryInput({ ...input, memberConfirmed: true, title: "bad\u0000value" })).toBeNull();
    expect(parseTripItineraryInput({ ...input, memberConfirmed: true, note: "x".repeat(2_001) })).toBeNull();
    expect(parseTripItineraryInput({ ...input, memberConfirmed: true, dayOrder: 0 })).toBeNull();
    expect(parseTripItineraryInput({ ...input, memberConfirmed: true })).toEqual(input);
    expect(parseTripItineraryOrderInput({ entryIds: [entryId], memberConfirmed: true })).toEqual([entryId]);
    expect(parseTripItineraryOrderInput({ entryIds: [entryId, entryId], memberConfirmed: true })).toBeNull();
  });

  it("is a manual private organizer with no automatic service or location fields", () => {
    const boundary = KINFOLK_TRIP_ITINERARY_DEFAULT_NON_USE.join(" ");
    for (const excluded of ["schedule", "book", "notify", "share", "automatic", "calendar", "flight", "hotel", "event", "document", "task", "reminder", "analytics", "address", "coordinates"]) {
      expect(boundary).toContain(excluded);
    }
  });
});
