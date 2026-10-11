import { afterEach, describe, expect, it } from "vitest";
import {
  decryptSensitiveMemoryContent,
  encryptSensitiveMemoryContent,
  SensitiveMemoryEncryptionUnavailableError,
} from "../sensitive-memory-encryption";

const originalKey = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
const originalKeyId = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;

function configureTestKey(): void {
  process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = "test-v1";
}

afterEach(() => {
  if (originalKey === undefined) delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
  else process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = originalKey;
  if (originalKeyId === undefined) delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;
  else process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = originalKeyId;
});

describe("sensitive memory encryption", () => {
  it("round-trips AES-GCM ciphertext without retaining plaintext", () => {
    configureTestKey();
    const saved = encryptSensitiveMemoryContent("Synthetic vault detail");
    expect(saved.encryptedContent).not.toContain("Synthetic vault detail");
    expect(saved.encryptionKeyId).toBe("test-v1");
    expect(decryptSensitiveMemoryContent(saved.encryptedContent, saved.encryptionKeyId)).toBe("Synthetic vault detail");
  });

  it("fails closed when server-side key material is unavailable", () => {
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
    delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;
    expect(() => encryptSensitiveMemoryContent("Synthetic vault detail")).toThrow(SensitiveMemoryEncryptionUnavailableError);
  });
});
