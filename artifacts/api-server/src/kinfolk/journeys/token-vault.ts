import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type JourneyTokenEnvelope = Readonly<{
  version: 1;
  algorithm: "aes-256-gcm";
  keyId: string;
  iv: string;
  ciphertext: string;
  tag: string;
}>;

export class JourneyTokenVaultError extends Error {}

function getKey(): Buffer {
  const raw = process.env.KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw)
    throw new JourneyTokenVaultError(
      "Journey token storage is not configured.",
    );
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32)
    throw new JourneyTokenVaultError("Journey token storage key is invalid.");
  return key;
}

function getKeyId(): string {
  const raw = process.env.KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY?.trim() ?? "";
  return createHash("sha256").update(raw).digest("hex").slice(0, 12);
}

export function sealJourneyToken(value: Record<string, unknown>): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const envelope: JourneyTokenEnvelope = {
    version: 1,
    algorithm: "aes-256-gcm",
    keyId: getKeyId(),
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
}

export function openJourneyToken(sealed: string): Record<string, unknown> {
  const serialized = Buffer.from(sealed, "base64url").toString("utf8");
  let envelope: JourneyTokenEnvelope;
  try {
    envelope = JSON.parse(serialized) as JourneyTokenEnvelope;
  } catch {
    throw new JourneyTokenVaultError(
      "Journey connection data could not be read.",
    );
  }
  if (
    envelope.version !== 1 ||
    envelope.algorithm !== "aes-256-gcm" ||
    envelope.keyId !== getKeyId()
  ) {
    throw new JourneyTokenVaultError(
      "Journey connection data requires a secure reconnection.",
    );
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(envelope.iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const result = JSON.parse(plaintext);
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new Error("invalid payload");
    return result as Record<string, unknown>;
  } catch {
    throw new JourneyTokenVaultError(
      "Journey connection data could not be read.",
    );
  }
}

/** Never include a token envelope in a route response, log, exception, or audit record. */
export function redactedConnectionState(input: {
  provider: string;
  status: string;
  expiresAt?: Date | null;
  scopes?: readonly string[];
}): Record<string, unknown> {
  return {
    provider: input.provider,
    status: input.status,
    expiresAt: input.expiresAt?.toISOString() ?? null,
    scopes: input.scopes ?? [],
    tokenPresent: false,
  };
}
