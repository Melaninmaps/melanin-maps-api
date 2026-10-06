import { describe, expect, it } from "vitest";
import {
  MAX_ACTIVE_KINFOLK_PRIVATE_NOTES,
  resolvePrivateMemoryCapacity,
  resolvePrivateMemoryState,
} from "../private-memory-policy";

describe("Kinfolk Personal Memory V1 policy", () => {
  it("allows exactly 50 active generic notes while keeping a preferred name outside that limit", () => {
    expect(MAX_ACTIVE_KINFOLK_PRIVATE_NOTES).toBe(50);
    expect(
      resolvePrivateMemoryCapacity({ activeCount: 49, requestedCount: 1 }),
    ).toMatchObject({
      allowed: true,
      activeCount: 49,
      availableSlots: 1,
      limit: 50,
    });
    expect(
      resolvePrivateMemoryCapacity({ activeCount: 50, requestedCount: 1 }),
    ).toMatchObject({
      allowed: false,
      activeCount: 50,
      availableSlots: 0,
      limit: 50,
    });
  });

  it("fails new writes safely for an existing legacy over-limit member without deleting notes", () => {
    expect(
      resolvePrivateMemoryCapacity({ activeCount: 61, requestedCount: 1 }),
    ).toMatchObject({
      allowed: false,
      activeCount: 61,
      availableSlots: 0,
      limit: 50,
    });
  });

  it("keeps pause distinct from member-chosen expiry and revocation", () => {
    const now = new Date("2026-10-06T00:00:00.000Z");
    expect(
      resolvePrivateMemoryState({ revokedAt: null, pausedAt: null, expiresAt: null, now }),
    ).toBe("active");
    expect(
      resolvePrivateMemoryState({
        revokedAt: null,
        pausedAt: new Date("2026-10-05T23:00:00.000Z"),
        expiresAt: null,
        now,
      }),
    ).toBe("paused");
    expect(
      resolvePrivateMemoryState({
        revokedAt: null,
        pausedAt: null,
        expiresAt: new Date("2026-10-05T23:00:00.000Z"),
        now,
      }),
    ).toBe("expired");
    expect(
      resolvePrivateMemoryState({
        revokedAt: new Date("2026-10-05T23:00:00.000Z"),
        pausedAt: null,
        expiresAt: null,
        now,
      }),
    ).toBe("revoked");
  });
});
