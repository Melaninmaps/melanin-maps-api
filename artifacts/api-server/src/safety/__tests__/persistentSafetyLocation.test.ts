import { afterEach, describe, expect, it } from "vitest";
import {
  openPersistentSafetyLocation,
  parsePersistentSafetyLocationFix,
  persistentSafetyLocationCanMatchEmergency,
  persistentSafetyLocationFreshnessWindowMs,
  persistentSafetyLocationIsFresh,
  persistentSafetyLocationRuntimeState,
  sealPersistentSafetyLocation,
} from "../persistentSafetyLocation";

const original = { ...process.env };

function configure(): void {
  process.env.SAFETY_PERSISTENT_LOCATION_COLLECTION_ENABLED = "true";
  process.env.SAFETY_PERSISTENT_LOCATION_MAX_AGE_SECONDS = "600";
  process.env.SAFETY_PERSISTENT_LOCATION_MAX_ACCURACY_METERS = "100";
  process.env.MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS = `v1:${Buffer.alloc(32, 19).toString("base64")}`;
}

afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
});

describe("Persistent Safety Location policy", () => {
  it("seals a current fix with owner-bound authenticated encryption and no plaintext fallback", () => {
    configure();
    const fix = parsePersistentSafetyLocationFix({
      latitude: 39.9526,
      longitude: -75.1652,
      capturedAt: new Date().toISOString(),
      accuracyMeters: 14,
      platform: "ios",
      background: true,
    });
    expect(fix).not.toBeNull();
    const sealed = sealPersistentSafetyLocation("member-a", fix!);
    expect(sealed.encryptedPayload).not.toContain("39.9526");
    expect(sealed.encryptedPayload).not.toContain("-75.1652");
    expect(openPersistentSafetyLocation("member-a", sealed.encryptedPayload, sealed.encryptionKeyVersion)).toMatchObject({
      latitude: 39.9526,
      longitude: -75.1652,
      accuracyMeters: 14,
    });
    expect(() => openPersistentSafetyLocation("member-b", sealed.encryptedPayload, sealed.encryptionKeyVersion)).toThrow("PERSISTENT_SAFETY_LOCATION_DECRYPTION_INVALID");
  });

  it("fails closed when a current-fix freshness policy or encryption key is unavailable", () => {
    delete process.env.MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS;
    delete process.env.SAFETY_PERSISTENT_LOCATION_MAX_AGE_SECONDS;
    delete process.env.SAFETY_PERSISTENT_LOCATION_MAX_ACCURACY_METERS;
    process.env.SAFETY_PERSISTENT_LOCATION_COLLECTION_ENABLED = "true";
    const state = persistentSafetyLocationRuntimeState();
    expect(state.collectionEnabled).toBe(false);
    expect(state.freshnessWindowMs).toBeNull();
    expect(persistentSafetyLocationFreshnessWindowMs()).toBeNull();
    expect(persistentSafetyLocationIsFresh(new Date())).toBe(false);
  });

  it("requires both a configured accuracy threshold and a sufficiently accurate fresh fix for emergency matching", () => {
    configure();
    expect(persistentSafetyLocationCanMatchEmergency(new Date(), 100)).toBe(true);
    expect(persistentSafetyLocationCanMatchEmergency(new Date(), 101)).toBe(false);
    delete process.env.SAFETY_PERSISTENT_LOCATION_MAX_ACCURACY_METERS;
    expect(persistentSafetyLocationRuntimeState().collectionEnabled).toBe(false);
    expect(persistentSafetyLocationCanMatchEmergency(new Date(), 10)).toBe(false);
  });

  it("rejects stale, future, and imprecise unbounded payloads before encryption", () => {
    configure();
    expect(parsePersistentSafetyLocationFix({
      latitude: 39.9526, longitude: -75.1652, capturedAt: new Date(Date.now() - 25 * 60 * 60_000).toISOString(), accuracyMeters: 10, platform: "android", background: true,
    })).toBeNull();
    expect(parsePersistentSafetyLocationFix({
      latitude: 39.9526, longitude: -75.1652, capturedAt: new Date(Date.now() + 6 * 60_000).toISOString(), accuracyMeters: 10, platform: "android", background: true,
    })).toBeNull();
    expect(parsePersistentSafetyLocationFix({
      latitude: 39.9526, longitude: -75.1652, capturedAt: new Date().toISOString(), accuracyMeters: 50_001, platform: "android", background: true,
    })).toBeNull();
  });
});
