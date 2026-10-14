import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  isTripId,
  KINFOLK_TRIP_DEFAULT_NON_USE,
  openTrip,
  parseTripInput,
  sealTrip,
  type StoredKinfolkTrip,
} from "../trip-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../private-memory-encryption";

const id = "10000000-0000-4000-8000-000000000001";
const input = { title: "Synthetic coastal weekend", destination: "New Orleans, Louisiana", note: "Synthetic owner note only." };
const migration = readFileSync(new URL("../../../migrations/20261014_kinfolk_trips.approval-required.sql", import.meta.url), "utf8");

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 53).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-trip-v1");
});
afterEach(() => vi.unstubAllEnvs());

function trip(patch: Partial<StoredKinfolkTrip> = {}): StoredKinfolkTrip {
  const base = { id, userId: "owner-a" };
  return {
    ...base,
    ...sealTrip(input, base),
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"),
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
    ...patch,
  };
}

describe("Kinfolk Trip private encryption policy", () => {
  it("ships only an approval-required additive source migration with no data backfill", () => {
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE");
    expect(migration).toContain("CREATE TABLE kinfolk_trips");
    for (const field of ["encrypted_title", "title_encryption_key_id", "encrypted_destination", "destination_encryption_key_id", "encrypted_note", "note_encryption_key_id"]) {
      expect(migration).toContain(field);
    }
    expect(migration).toContain("CHECK (title = '[Encrypted private memory]')");
    expect(migration).not.toMatch(/\b(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\b/);
  });

  it("stores all member-authored travel fields only as placeholders and authenticated ciphertext", () => {
    const row = trip();
    expect(row.title).toBe("[Encrypted private memory]");
    expect(row.destination).toBe("[Encrypted private memory]");
    expect(row.note).toBe("[Encrypted private memory]");
    expect(JSON.stringify(row)).not.toContain(input.title);
    expect(JSON.stringify(row)).not.toContain(input.destination);
    expect(JSON.stringify(row)).not.toContain(input.note);
    expect(openTrip(row, "owner-a")).toEqual(input);
    expect(() => openTrip(row, "owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("fails closed on per-field tamper, partial envelopes, changed record IDs, and unavailable keys", () => {
    const row = trip();
    for (const changed of [
      { encryptedTitle: `${row.encryptedTitle}.tamper` },
      { destinationEncryptionKeyId: "" },
      { note: "legacy plaintext", encryptedNote: "" },
      { id: "10000000-0000-4000-8000-000000000002" },
    ]) {
      expect(() => openTrip({ ...row, ...changed }, "owner-a")).toThrow(PrivateMemoryEncryptionIntegrityError);
    }
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(() => openTrip(row, "owner-a")).toThrow(PrivateMemoryEncryptionUnavailableError);
    expect(() => sealTrip(input, row)).toThrow(PrivateMemoryEncryptionUnavailableError);
  });

  it("requires confirmation and rejects exact addresses, coordinates, injection fields, and invalid IDs", () => {
    expect(parseTripInput({ ...input, memberConfirmed: false })).toBeNull();
    expect(parseTripInput({ ...input, memberConfirmed: true, userId: "owner-b" })).toBeNull();
    expect(parseTripInput({ ...input, destination: "29.9511, -90.0715", memberConfirmed: true })).toBeNull();
    expect(parseTripInput({ ...input, destination: "123 Main Street", memberConfirmed: true })).toBeNull();
    expect(parseTripInput({ ...input, destination: "Main St., 123", memberConfirmed: true })).toBeNull();
    expect(parseTripInput({ ...input, destination: "Chicago, IL 60601", memberConfirmed: true })).toBeNull();
    expect(parseTripInput({ ...input, memberConfirmed: true })).toEqual(input);
    expect(isTripId(id)).toBe(true);
    expect(isTripId("cross-owner")).toBe(false);
  });

  it("has a default-off contract with no automatic context or sharing use", () => {
    expect(KINFOLK_TRIP_DEFAULT_NON_USE.join(" ")).toMatch(/No automatic Kinfolk chat or private-memory use/);
    for (const excluded of ["profile", "Map", "Directory", "Community", "Safety", "provider", "calendar", "flight", "hotel", "document", "task", "reminder", "analytics", "sharing"]) {
      expect(KINFOLK_TRIP_DEFAULT_NON_USE.join(" ")).toContain(excluded);
    }
  });
});
