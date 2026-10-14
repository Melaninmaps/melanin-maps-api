import {
  decryptSensitiveMemoryContent,
  encryptSensitiveMemoryContent,
  privateMemoryDuplicateFingerprint,
  sensitiveMemoryStoragePlaceholder,
  SensitiveMemoryEncryptionIntegrityError,
  SensitiveMemoryEncryptionUnavailableError,
} from "./sensitive-memory-encryption";

const PLACEHOLDER = "[Encrypted private memory]";

export class PrivateMemoryEncryptionUnavailableError extends Error {
  constructor() {
    super("Private memory encryption is unavailable. Please retry when secure access is restored.");
    this.name = "PrivateMemoryEncryptionUnavailableError";
  }
}

export class PrivateMemoryEncryptionIntegrityError extends Error {
  constructor() {
    super("Private memory could not be securely opened. The stored record was not changed.");
    this.name = "PrivateMemoryEncryptionIntegrityError";
  }
}

function withPrivateMemoryCrypto<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof SensitiveMemoryEncryptionUnavailableError) {
      throw new PrivateMemoryEncryptionUnavailableError();
    }
    if (error instanceof SensitiveMemoryEncryptionIntegrityError) {
      throw new PrivateMemoryEncryptionIntegrityError();
    }
    throw error;
  }
}

function authenticatedContext(userId: string, purpose: string): string {
  return JSON.stringify(["kinfolk-ordinary-private-memory-v1", userId, purpose]);
}

export function ordinaryMemoryFingerprint(content: string, userId: string): string {
  return withPrivateMemoryCrypto(() => privateMemoryDuplicateFingerprint(content, userId));
}

export function encryptOrdinaryMemoryContent(content: string, userId: string, purpose: string) {
  return withPrivateMemoryCrypto(() => ({
    content: PLACEHOLDER,
    ...encryptSensitiveMemoryContent(content, authenticatedContext(userId, purpose)),
    contentFingerprint: ordinaryMemoryFingerprint(content, userId),
  }));
}

export type StoredOrdinaryMemory = {
  content: string;
  purpose: string;
  encryptedContent?: string | null;
  encryptionKeyId?: string | null;
  contentFingerprint?: string | null;
};

/** Only call AFTER an authenticated owner-scoped query. Reads never rewrite a row. */
export function readOrdinaryMemoryContent(memory: StoredOrdinaryMemory, userId: string): string {
  const hasEncryptedRepresentation = memory.encryptedContent != null ||
    memory.encryptionKeyId != null || memory.contentFingerprint != null;
  if (!hasEncryptedRepresentation) {
    // An absent/partial ciphertext must never turn a storage placeholder into a legacy fallback.
    if (memory.content === PLACEHOLDER || memory.content === sensitiveMemoryStoragePlaceholder()) {
      throw new PrivateMemoryEncryptionIntegrityError();
    }
    return memory.content;
  }
  if (!memory.encryptedContent || !memory.encryptionKeyId || memory.content !== PLACEHOLDER ||
      !/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$/.test(memory.encryptedContent) ||
      memory.encryptedContent.split(".").slice(1).some((part) =>
        Buffer.from(part, "base64url").toString("base64url") !== part)) {
    throw new PrivateMemoryEncryptionIntegrityError();
  }
  return withPrivateMemoryCrypto(() => decryptSensitiveMemoryContent(
    memory.encryptedContent,
    memory.encryptionKeyId,
    authenticatedContext(userId, memory.purpose),
  ));
}

/** Strip internal crypto fields; regular owner responses never open the sensitive vault. */
export function privateMemoryOwnerResponse<T extends StoredOrdinaryMemory & { isSensitive: boolean }>(
  memory: T,
  userId: string,
) {
  const { encryptedContent: _ciphertext, encryptionKeyId: _keyId, contentFingerprint: _fingerprint, ...publicMemory } = memory;
  return {
    ...publicMemory,
    content: memory.isSensitive ? null : readOrdinaryMemoryContent(memory, userId),
  };
}

/** Bounded transient Kinfolk selection only. No writes/logs, and no plaintext fallback on failure. */
export function ordinaryMemoriesForPrompt<T extends StoredOrdinaryMemory & { isSensitive: boolean }>(
  memories: readonly T[],
  userId: string,
): { memories: Array<T & { content: string }>; unavailable: boolean } {
  let unavailable = false;
  const opened = memories.flatMap((memory) => {
    // Preserve the existing sensitive selection/consent path; never decrypt it here.
    if (memory.isSensitive) return [memory];
    try {
      return [{ ...memory, content: readOrdinaryMemoryContent(memory, userId) }];
    } catch {
      unavailable = true;
      return [];
    }
  });
  return { memories: opened, unavailable };
}

/** Encrypted equality is keyed, not a plaintext hash; legacy comparison is owner-local and transient. */
export function matchesPrivateMemoryDuplicate(
  memory: StoredOrdinaryMemory,
  content: string,
  fingerprint: string,
): boolean {
  if (memory.encryptedContent != null || memory.encryptionKeyId != null || memory.contentFingerprint != null) {
    return memory.contentFingerprint === fingerprint;
  }
  return memory.content !== PLACEHOLDER && memory.content !== sensitiveMemoryStoragePlaceholder() &&
    memory.content === content;
}
