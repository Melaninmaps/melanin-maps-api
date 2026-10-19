import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export type JourneyTokenPurpose =
  | "oauth_pending"
  | "provider_connection"
  | "journey_item";

/**
 * Authenticated encryption is bound to the owning member and its exact Journey
 * object. The context is never stored as cleartext; only its digest is retained
 * in the envelope so a copied ciphertext cannot be replayed for another owner.
 */
export type JourneyTokenContext = Readonly<{
  purpose: JourneyTokenPurpose;
  memberId: string;
  provider?: string;
  connectionId?: string;
  journeyId?: string;
  itemId?: string;
}>;

export type JourneyReferenceKind = "provider_account" | "calendar";

export type JourneyTokenEnvelope = Readonly<{
  version: 2;
  algorithm: "aes-256-gcm";
  keyId: string;
  contextHash: string;
  iv: string;
  ciphertext: string;
  tag: string;
}>;

export class JourneyTokenVaultError extends Error {}

function requiredBase64Key(name: string): Buffer {
  const raw = process.env[name]?.trim();
  if (!raw)
    throw new JourneyTokenVaultError(
      "Journey token storage is not configured.",
    );
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32)
    throw new JourneyTokenVaultError("Journey token storage key is invalid.");
  return key;
}

function getTokenKey(): Buffer {
  return requiredBase64Key("KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY");
}

function getReferenceKey(): Buffer {
  return requiredBase64Key("KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY");
}

function getKeyId(): string {
  const keyId = process.env.KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID?.trim();
  if (!keyId || !/^[A-Za-z0-9_-]{4,64}$/.test(keyId))
    throw new JourneyTokenVaultError(
      "Journey token storage key identifier is invalid.",
    );
  return keyId;
}

function canonicalContext(context: JourneyTokenContext): string {
  if (!context.memberId.trim())
    throw new JourneyTokenVaultError("Journey token context is invalid.");
  if (
    (context.purpose === "oauth_pending" ||
      context.purpose === "provider_connection") &&
    (!context.provider?.trim() || !context.connectionId?.trim())
  )
    throw new JourneyTokenVaultError("Journey token context is invalid.");
  if (
    context.purpose === "journey_item" &&
    (!context.journeyId?.trim() || !context.itemId?.trim())
  )
    throw new JourneyTokenVaultError("Journey token context is invalid.");
  return JSON.stringify({
    version: 1,
    purpose: context.purpose,
    memberId: context.memberId,
    provider: context.provider ?? null,
    connectionId: context.connectionId ?? null,
    journeyId: context.journeyId ?? null,
    itemId: context.itemId ?? null,
  });
}

function digestContext(context: JourneyTokenContext): string {
  return createHash("sha256")
    .update(canonicalContext(context))
    .digest("base64url");
}

function matchesContextHash(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

/** This reports configuration state only and never returns key material. */
export function journeyTokenVaultReadiness(): {
  tokenEncryptionConfigured: boolean;
  referenceHmacConfigured: boolean;
} {
  try {
    getTokenKey();
    getKeyId();
  } catch {
    return { tokenEncryptionConfigured: false, referenceHmacConfigured: false };
  }
  try {
    getReferenceKey();
    return { tokenEncryptionConfigured: true, referenceHmacConfigured: true };
  } catch {
    return { tokenEncryptionConfigured: true, referenceHmacConfigured: false };
  }
}

/**
 * Creates a stable owner-scoped opaque reference. Raw provider account and
 * calendar IDs are never stored in ordinary columns, route responses, or audit
 * metadata. A dedicated HMAC key permits rotation independently of token keys.
 */
export function opaqueJourneyReference(input: {
  memberId: string;
  provider: string;
  kind: JourneyReferenceKind;
  value: string;
}): string {
  if (!input.memberId.trim() || !input.provider.trim() || !input.value.trim())
    throw new JourneyTokenVaultError("Journey reference input is invalid.");
  const value = createHmac("sha256", getReferenceKey())
    .update(
      `journey-reference-v1\u0000${input.memberId}\u0000${input.provider}\u0000${input.kind}\u0000${input.value}`,
      "utf8",
    )
    .digest("base64url");
  return `journey_ref_v1_${value}`;
}

export function sealJourneyToken(
  value: Record<string, unknown>,
  context: JourneyTokenContext,
): string {
  const key = getTokenKey();
  const serializedContext = canonicalContext(context);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(serializedContext, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const envelope: JourneyTokenEnvelope = {
    version: 2,
    algorithm: "aes-256-gcm",
    keyId: getKeyId(),
    contextHash: digestContext(context),
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
}

export function openJourneyToken(
  sealed: string,
  context: JourneyTokenContext,
): Record<string, unknown> {
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
    envelope.version !== 2 ||
    envelope.algorithm !== "aes-256-gcm" ||
    envelope.keyId !== getKeyId() ||
    !matchesContextHash(envelope.contextHash, digestContext(context))
  ) {
    throw new JourneyTokenVaultError(
      "Journey connection data requires a secure reconnection.",
    );
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getTokenKey(),
      Buffer.from(envelope.iv, "base64url"),
    );
    decipher.setAAD(Buffer.from(canonicalContext(context), "utf8"));
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
