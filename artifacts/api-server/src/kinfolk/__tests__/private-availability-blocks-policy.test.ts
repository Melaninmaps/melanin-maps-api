import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  KINFOLK_PRIVATE_AVAILABILITY_DEFAULT_NON_USE,
  openPrivateAvailabilityBlock,
  parsePrivateAvailabilityBlockInput,
  parsePrivateAvailabilityPreviewInput,
  privateAvailabilityConflicts,
  sealPrivateAvailabilityBlock,
  type PrivateAvailabilityBlockInput,
  type StoredPrivateAvailabilityBlock,
} from "../private-availability-blocks-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../private-memory-encryption";

const id = "10000000-0000-4000-8000-000000000101";
const input: PrivateAvailabilityBlockInput = {
  label: "Synthetic private commitment",
  startAt: "2026-10-20T09:00",
  endAt: "2026-10-20T10:00",
  timeZone: "America/New_York",
  planningOptIn: true,
};
const migration = readFileSync(new URL("../../../migrations/20261014_kinfolk_private_availability_blocks.approval-required.sql", import.meta.url), "utf8");

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 73).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-availability-v1");
});
afterEach(() => vi.unstubAllEnvs());

function block(patch: Partial<StoredPrivateAvailabilityBlock> = {}): StoredPrivateAvailabilityBlock {
  const base = { id, userId: "owner-a" };
  return {
    ...base,
    ...sealPrivateAvailabilityBlock(input, base),
    memberConfirmedAt: new Date("2026-10-14T00:00:00Z"),
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
    ...patch,
  };
}

describe("private Availability Block encryption and preview policy", () => {
  it("ships an approval-required additive encrypted schema with no data work", () => {
    expect(migration).toContain("APPROVAL REQUIRED — SOURCE ONLY. DO NOT EXECUTE");
    expect(migration).toContain("CREATE TABLE kinfolk_private_availability_blocks");
    for (const field of ["encrypted_label", "encrypted_start_at", "encrypted_end_at", "encrypted_time_zone"]) {
      expect(migration).toContain(field);
    }
    for (const field of ["label", "start_at", "end_at", "time_zone"]) {
      expect(migration).toContain(`CHECK (${field} = '[Encrypted private memory]')`);
    }
    expect(migration).toContain("planning_opt_in BOOLEAN NOT NULL DEFAULT FALSE");
    expect(migration).not.toMatch(/\b(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE)\b/);
  });

  it("stores every member-entered label and time detail as a placeholder plus authenticated ciphertext", () => {
    const row = block();
    for (const field of ["label", "startAt", "endAt", "timeZone"] as const) {
      expect(row[field]).toBe("[Encrypted private memory]");
      expect(JSON.stringify(row)).not.toContain(input[field]);
    }
    expect(openPrivateAvailabilityBlock(row, "owner-a")).toEqual(input);
    expect(() => openPrivateAvailabilityBlock(row, "owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("requires confirmed canonical IANA intervals, rejects invalid/ambiguous local time, and isolates opt-in conflict checks", () => {
    expect(parsePrivateAvailabilityBlockInput({ ...input, memberConfirmed: false })).toBeNull();
    expect(parsePrivateAvailabilityBlockInput({ ...input, memberConfirmed: true, provider: "never" })).toBeNull();
    expect(parsePrivateAvailabilityBlockInput({ ...input, timeZone: "UTC", memberConfirmed: true })).toBeNull();
    expect(parsePrivateAvailabilityBlockInput({ ...input, startAt: "2026-10-20T10:00", endAt: "2026-10-20T09:00", memberConfirmed: true })).toBeNull();
    expect(parsePrivateAvailabilityBlockInput({ ...input, startAt: "2026-03-08T02:30", endAt: "2026-03-08T03:30", memberConfirmed: true })).toBeNull();
    expect(parsePrivateAvailabilityPreviewInput({ startAt: input.startAt, endAt: input.endAt, timeZone: input.timeZone, memberConfirmed: true })).toEqual({ startAt: input.startAt, endAt: input.endAt, timeZone: input.timeZone });
    expect(privateAvailabilityConflicts(
      { startAt: "2026-10-20T09:30", endAt: "2026-10-20T09:45", timeZone: input.timeZone },
      [input, { ...input, planningOptIn: false }],
    )).toBe(1);
  });

  it("fails closed on tamper, partial envelopes, changed identity, and unavailable keys", () => {
    const row = block();
    for (const changed of [
      { encryptedLabel: `${row.encryptedLabel}.tamper` },
      { startAtEncryptionKeyId: "" },
      { endAt: "legacy plaintext", encryptedEndAt: "" },
      { id: "10000000-0000-4000-8000-000000000102" },
    ]) {
      expect(() => openPrivateAvailabilityBlock({ ...row, ...changed }, "owner-a")).toThrow(PrivateMemoryEncryptionIntegrityError);
    }
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(() => openPrivateAvailabilityBlock(row, "owner-a")).toThrow(PrivateMemoryEncryptionUnavailableError);
    expect(() => sealPrivateAvailabilityBlock(input, row)).toThrow(PrivateMemoryEncryptionUnavailableError);
  });

  it("is manual private storage only, with no external-calendar or automatic Kinfolk use", () => {
    const boundary = KINFOLK_PRIVATE_AVAILABILITY_DEFAULT_NON_USE.join(" ");
    for (const excluded of ["external calendar", "read", "connected", "synced", "blocked", "automatic Kinfolk chat or memory", "Map", "Directory", "Community", "Safety", "provider", "reminder", "notification", "sharing", "analytics", "future approval gate"]) {
      expect(boundary).toContain(excluded);
    }
  });
});
