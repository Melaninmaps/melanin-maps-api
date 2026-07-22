import crypto from "crypto";
import jwt from "jsonwebtoken";

// ── AES-256-GCM encryption for Apple refresh tokens ───────────────────────────
// Tokens are stored as "<iv_hex>.<ciphertext_hex>.<authtag_hex>".
// The key is a 64-char hex string (32 bytes) held in APPLE_TOKEN_ENCRYPTION_KEY.
// Never log credential values — only boolean audit flags.

export function encryptToken(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${ct.toString("hex")}.${tag.toString("hex")}`;
}

export function decryptToken(encrypted: string, keyHex: string): string {
  const parts = encrypted.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(parts[0]!, "hex");
  const ct = Buffer.from(parts[1]!, "hex");
  const tag = Buffer.from(parts[2]!, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// ── Apple client_secret JWT ────────────────────────────────────────────────────
// Apple requires a short-lived ES256-signed JWT for server-to-server calls.
// The private key is the .p8 content stored in APPLE_PRIVATE_KEY.
// Newlines stored as literal \n in env vars are normalised before signing.

export function generateClientSecret(
  teamId: string,
  keyId: string,
  privateKeyPem: string,
  clientId: string,
): string {
  const key = privateKeyPem.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp: now + 3600,
      aud: "https://appleid.apple.com",
      sub: clientId,
    },
    key,
    { algorithm: "ES256", keyid: keyId },
  );
}

// ── Apple token endpoint — exchange authorization code for refresh token ───────
// The authorization code is one-time; it must be exchanged immediately after
// the client sends it. Never log the code, access token, or refresh token.

export async function exchangeAuthCode(
  authorizationCode: string,
  clientId: string,
  clientSecret: string,
): Promise<{ refreshToken: string }> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: "authorization_code",
  });

  const resp = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new Error(`Apple token exchange failed: HTTP ${resp.status}`);
  }

  const data = (await resp.json()) as { refresh_token?: string; error?: string };
  if (!data.refresh_token) {
    throw new Error("Apple token exchange: no refresh_token in response");
  }

  return { refreshToken: data.refresh_token };
}

// ── Apple revocation endpoint ─────────────────────────────────────────────────
// Called during account deletion. Throws if Apple's API rejects the request.
// Per TN3194, a failed revocation must not block local account deletion.

export async function revokeAppleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<void> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    token: refreshToken,
    token_type_hint: "refresh_token",
  });

  const resp = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new Error(`Apple token revocation failed: HTTP ${resp.status}`);
  }
}
