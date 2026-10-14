import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CULTURAL_JOURNEY_DISCLOSURE,
  culturalJourneyEntryView,
  openCulturalJourneyReflection,
  sealCulturalJourneyReflection,
  validateCulturalJourneyReflection,
  type StoredCulturalJourneyEntry,
} from "../cultural-journey-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../private-memory-encryption";

const owner = "journey-owner-a";
const reflection = "I chose to keep this private note about the site.";

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 47).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-cultural-journey-v1");
});
afterEach(() => vi.unstubAllEnvs());

function entry(patch: Partial<StoredCulturalJourneyEntry> = {}): StoredCulturalJourneyEntry {
  return {
    id: "journey-entry-a",
    userId: owner,
    culturalSiteId: "site-1",
    siteName: "Example Cultural Site",
    sourceLabel: "Cultural site",
    libraryQuestion: "Example Cultural Site: history, context, and reputable sources",
    reflection: null,
    encryptedReflection: null,
    reflectionEncryptionKeyId: null,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
    ...patch,
  };
}

describe("cultural Journey privacy policy", () => {
  it("requires an explicit confirmation before saving a reflection", () => {
    expect(validateCulturalJourneyReflection({ reflection: "A note I chose to keep." })).toMatchObject({ ok: false });
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "   " })).toEqual({ ok: true, value: null });
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "A note I chose to keep." })).toEqual({
      ok: true,
      value: "A note I chose to keep.",
    });
  });

  it("bounds private reflection text", () => {
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "x".repeat(1_201) })).toMatchObject({ ok: false });
  });

  it("returns only a client-safe owner-scoped entry view", () => {
    const view = culturalJourneyEntryView(entry({ id: "entry-1" }), owner);
    expect(view).toEqual({
      id: "entry-1",
      culturalSiteId: "site-1",
      siteName: "Example Cultural Site",
      sourceLabel: "Cultural site",
      libraryQuestion: "Example Cultural Site: history, context, and reputable sources",
      reflection: null,
      createdAt: "2026-10-14T00:00:00.000Z",
      updatedAt: "2026-10-14T00:00:00.000Z",
    });
    expect(view).not.toHaveProperty("latitude");
    expect(view).not.toHaveProperty("longitude");
    expect(view).not.toHaveProperty("rawAsset");
    expect(view).not.toHaveProperty("provider");
    expect(view).not.toHaveProperty("userId");
    expect(view).not.toHaveProperty("encryptedReflection");
    expect(view).not.toHaveProperty("reflectionEncryptionKeyId");
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/private to you/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/not.*score|score.*not/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/does not send a message to Kinfolk/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/does not.*private memory/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/does not.*infer identity/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/does not.*trigger a nudge/i);
  });

  it("stores a confirmed reflection as a placeholder plus owner-and-entry-bound ciphertext and only returns plaintext to its owner", () => {
    const sealed = sealCulturalJourneyReflection(reflection, entry());
    const encrypted = entry({ ...sealed });
    expect(encrypted.reflection).toBe("[Encrypted private memory]");
    expect(JSON.stringify(encrypted)).not.toContain(reflection);
    expect(encrypted.encryptedReflection).toMatch(/^v1\./);
    expect(openCulturalJourneyReflection(encrypted, owner)).toBe(reflection);
    expect(() => openCulturalJourneyReflection(encrypted, "journey-owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
    expect(() => openCulturalJourneyReflection({ ...encrypted, id: "journey-entry-b" }, owner)).toThrow(PrivateMemoryEncryptionIntegrityError);

    const view = culturalJourneyEntryView(encrypted, owner);
    expect(view.reflection).toBe(reflection);
    expect(JSON.stringify(view)).not.toContain("[Encrypted private memory]");
    expect(view).not.toHaveProperty("userId");
    expect(view).not.toHaveProperty("encryptedReflection");
    expect(view).not.toHaveProperty("reflectionEncryptionKeyId");
  });

  it("allows an owner-scoped legacy read without mutation and encrypts only the next explicit correction", () => {
    const legacy = entry({ reflection, encryptedReflection: null, reflectionEncryptionKeyId: null });
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(openCulturalJourneyReflection(legacy, owner)).toBe(reflection);
    expect(legacy.reflection).toBe(reflection);
    vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 47).toString("base64"));

    const corrected = entry({ ...legacy, ...sealCulturalJourneyReflection("A confirmed correction.", legacy) });
    expect(corrected.reflection).toBe("[Encrypted private memory]");
    expect(openCulturalJourneyReflection(corrected, owner)).toBe("A confirmed correction.");
    expect(legacy.reflection).toBe(reflection);
  });

  it("fails closed for a partial, substituted, or unavailable encrypted representation without plaintext fallback", () => {
    const sealed = sealCulturalJourneyReflection(reflection, entry());
    const encrypted = entry({ ...sealed });
    for (const broken of [
      { ...encrypted, encryptedReflection: null },
      { ...encrypted, reflectionEncryptionKeyId: null },
      { ...encrypted, reflection },
      { ...encrypted, encryptedReflection: `${encrypted.encryptedReflection}.tampered` },
      entry({ reflection: "[Encrypted private memory]" }),
    ]) expect(() => openCulturalJourneyReflection(broken, owner)).toThrow(PrivateMemoryEncryptionIntegrityError);

    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(() => openCulturalJourneyReflection(encrypted, owner)).toThrow(PrivateMemoryEncryptionUnavailableError);
  });
});
