import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const PLACEHOLDER = "[Sensitive vault record]";

export class SensitiveMemoryEncryptionUnavailableError extends Error {
  constructor() {
    super("Sensitive memory encryption is unavailable.");
    this.name = "SensitiveMemoryEncryptionUnavailableError";
  }
}

export class SensitiveMemoryEncryptionIntegrityError extends Error {
  constructor() {
    super("Sensitive memory encryption integrity check failed.");
    this.name = "SensitiveMemoryEncryptionIntegrityError";
  }
}

function configuredKey(): Buffer {
  const value = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
  if (!value) throw new SensitiveMemoryEncryptionUnavailableError();
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new SensitiveMemoryEncryptionUnavailableError();
  return key;
}

export function sensitiveMemoryEncryptionKeyId(): string {
  const keyId = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID?.trim();
  if (!keyId || keyId.length > 64) throw new SensitiveMemoryEncryptionUnavailableError();
  return keyId;
}

export function sensitiveMemoryStoragePlaceholder(): string {
  return PLACEHOLDER;
}

export function encryptSensitiveMemoryContent(content: string, authenticatedContext?: string): {
  encryptedContent: string;
  encryptionKeyId: string;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, configuredKey(), iv);
  if (authenticatedContext !== undefined) cipher.setAAD(Buffer.from(authenticatedContext, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedContent: [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join("."),
    encryptionKeyId: sensitiveMemoryEncryptionKeyId(),
  };
}

export function decryptSensitiveMemoryContent(
  encryptedContent: string | null | undefined,
  encryptionKeyId: string | null | undefined,
  authenticatedContext?: string,
): string {
  if (!encryptedContent || !encryptionKeyId || encryptionKeyId !== sensitiveMemoryEncryptionKeyId()) {
    throw new SensitiveMemoryEncryptionUnavailableError();
  }
  const [version, ivValue, tagValue, ciphertextValue] = encryptedContent.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) {
    throw new SensitiveMemoryEncryptionIntegrityError();
  }
  const key = configuredKey();
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivValue, "base64url"));
    if (authenticatedContext !== undefined) decipher.setAAD(Buffer.from(authenticatedContext, "utf8"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new SensitiveMemoryEncryptionIntegrityError();
  }
}

/** Internal owner-bound equality token, using a domain-separated subkey. Never expose it. */
export function privateMemoryDuplicateFingerprint(content: string, userId: string): string {
  sensitiveMemoryEncryptionKeyId();
  const subkey = crypto.createHmac("sha256", configuredKey())
    .update("kinfolk-private-memory-duplicate-key-v1").digest();
  return crypto.createHmac("sha256", subkey)
    .update(JSON.stringify(["kinfolk-private-memory-duplicate-v1", userId, content]))
    .digest("hex");
}
