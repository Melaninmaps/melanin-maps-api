import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  encryptOrdinaryMemoryContent,
  matchesPrivateMemoryDuplicate,
  ordinaryMemoryFingerprint,
  ordinaryMemoriesForPrompt,
  privateMemoryOwnerResponse,
  readOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../private-memory-encryption";
import { decryptSensitiveMemoryContent, encryptSensitiveMemoryContent } from "../sensitive-memory-encryption";

beforeEach(() => {
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 19).toString("base64"));
  vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID", "synthetic-ordinary-v1");
});
afterEach(() => vi.unstubAllEnvs());

const content = "I prefer quiet coffee shops for work meetings.";
const owner = "synthetic-owner-a";
const purpose = "preference";
const saved = () => ({ ...encryptOrdinaryMemoryContent(content, owner, purpose), purpose, isSensitive: false });

describe("ordinary private-memory encrypted storage", () => {
  it("stores only a generic placeholder, ciphertext and keyed token, and round-trips with fresh nonces", () => {
    const row = saved();
    expect(row.content).toBe("[Encrypted private memory]");
    expect(JSON.stringify(row)).not.toContain(content);
    expect(row.encryptedContent).not.toBe(saved().encryptedContent);
    expect(readOrdinaryMemoryContent(row, owner)).toBe(content);
    expect(row.encryptionKeyId).toBe("synthetic-ordinary-v1");
  });

  it.each([1, 2, 3])("rejects tampering with envelope component %i without mutating storage", (component) => {
    const row = saved();
    const parts = row.encryptedContent.split(".");
    const bytes = Buffer.from(parts[component], "base64url");
    bytes[0] ^= 1;
    parts[component] = bytes.toString("base64url");
    row.encryptedContent = parts.join(".");
    const before = { ...row };
    expect(() => readOrdinaryMemoryContent(row, owner)).toThrow(PrivateMemoryEncryptionIntegrityError);
    expect(row).toEqual(before);
    expect(ordinaryMemoriesForPrompt([row], owner)).toEqual({ memories: [], unavailable: true });
  });

  it("authenticates owner and purpose and cannot open an ordinary payload through the unbound vault path", () => {
    const row = saved();
    expect(() => readOrdinaryMemoryContent(row, "synthetic-owner-b")).toThrow(PrivateMemoryEncryptionIntegrityError);
    expect(() => readOrdinaryMemoryContent({ ...row, purpose: "goal" }, owner)).toThrow(PrivateMemoryEncryptionIntegrityError);
    expect(() => decryptSensitiveMemoryContent(row.encryptedContent, row.encryptionKeyId)).toThrow();
  });

  it.each(["missing-key", "invalid-key", "missing-id", "wrong-id"])("fails closed for %s, including writes and prompt selection", (failure) => {
    const row = saved();
    if (failure === "missing-key") delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    if (failure === "invalid-key") process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    if (failure === "missing-id") delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;
    if (failure === "wrong-id") process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = "unavailable-old-key";
    expect(() => readOrdinaryMemoryContent(row, owner)).toThrow(PrivateMemoryEncryptionUnavailableError);
    if (failure !== "wrong-id") expect(() => saved()).toThrow(PrivateMemoryEncryptionUnavailableError);
    expect(ordinaryMemoriesForPrompt([row], owner)).toEqual({ memories: [], unavailable: true });
    expect(row.content).not.toBe(content);
  });

  it("reads authorized legacy plaintext without keys or mutation; explicit correction produces encrypted form", () => {
    const legacy = { content, purpose, isSensitive: false, encryptedContent: null, encryptionKeyId: null };
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    expect(readOrdinaryMemoryContent(legacy, owner)).toBe(content);
    expect(legacy.encryptedContent).toBeNull();
    vi.stubEnv("KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY", Buffer.alloc(32, 19).toString("base64"));
    const corrected = { ...legacy, ...encryptOrdinaryMemoryContent("I prefer quiet tea shops.", owner, purpose) };
    expect(readOrdinaryMemoryContent(corrected, owner)).toBe("I prefer quiet tea shops.");
    expect(legacy.content).toBe(content);
  });

  it("never falls back to content for a partial, malformed, missing or substituted encrypted representation", () => {
    const row = saved();
    for (const broken of [
      { ...row, encryptedContent: null },
      { ...row, encryptionKeyId: null },
      { ...row, content },
      { ...row, encryptedContent: row.encryptedContent + ".extra" },
      { content: row.content, purpose, isSensitive: false },
      { content, purpose, isSensitive: false, contentFingerprint: row.contentFingerprint },
    ]) expect(() => readOrdinaryMemoryContent(broken, owner)).toThrow(PrivateMemoryEncryptionIntegrityError);
  });

  it("preserves equality semantics without plaintext hashes and keeps tokens owner-bound and internal", () => {
    const row = saved();
    const token = ordinaryMemoryFingerprint(content, owner);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).toBe(row.contentFingerprint);
    expect(token).not.toBe(ordinaryMemoryFingerprint(content, "synthetic-owner-b"));
    expect(matchesPrivateMemoryDuplicate(row, content, token)).toBe(true);
    expect(matchesPrivateMemoryDuplicate(row, content + " revised", ordinaryMemoryFingerprint(content + " revised", owner))).toBe(false);
    expect(matchesPrivateMemoryDuplicate({ content, purpose }, content, token)).toBe(true);
    expect(matchesPrivateMemoryDuplicate({ content: "[Encrypted private memory]", purpose }, "[Encrypted private memory]", token)).toBe(false);
    const response = privateMemoryOwnerResponse(row, owner);
    expect(response.content).toBe(content);
    expect(response).not.toHaveProperty("encryptedContent");
    expect(response).not.toHaveProperty("encryptionKeyId");
    expect(response).not.toHaveProperty("contentFingerprint");
  });

  it("does not change the existing sensitive cipher representation or open it in regular owner responses", () => {
    const vault = encryptSensitiveMemoryContent("Synthetic sensitive vault detail");
    expect(decryptSensitiveMemoryContent(vault.encryptedContent, vault.encryptionKeyId)).toBe("Synthetic sensitive vault detail");
    expect(privateMemoryOwnerResponse({ content: "[Sensitive vault record]", purpose, isSensitive: true }, owner).content).toBeNull();
  });
});
