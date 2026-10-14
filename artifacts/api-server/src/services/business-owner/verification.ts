import crypto from "node:crypto";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const CLAIM_VERIFICATION_MAX_ATTEMPTS = 5;
export const CLAIM_VERIFICATION_TTL_MINUTES = 15;
export const MANAGER_INVITATION_MAX_ATTEMPTS = 5;
export const MANAGER_INVITATION_TTL_DAYS = 7;

export function normalizePrivateEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
}

export function claimVerificationEmailDeliveryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BUSINESS_CLAIM_VERIFICATION_ENABLED === "true"
    && env.BUSINESS_CLAIM_EMAIL_VERIFICATION_ENABLED === "true"
    && Boolean(env.RESEND_API_KEY)
    && Boolean(env.SESSION_SECRET);
}

export function managerInvitationDeliveryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BUSINESS_MANAGER_INVITATIONS_ENABLED === "true"
    && env.BUSINESS_MANAGER_INVITATIONS_DELIVERY_ENABLED === "true"
    && Boolean(env.RESEND_API_KEY)
    && Boolean(env.SESSION_SECRET);
}

export function createOpaqueCode(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function hashPrivateCode(value: string, secret = process.env.SESSION_SECRET): string {
  if (!secret) throw new Error("SESSION_SECRET is required to hash private verification values");
  return crypto.createHmac("sha256", secret).update(value.trim().toUpperCase()).digest("hex");
}

export function hashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function emailDomainMatchesOfficialUrl(email: string, officialUrl: string): boolean {
  try {
    const emailDomain = normalizePrivateEmail(email)?.split("@")[1];
    const hostname = new URL(officialUrl).hostname.toLowerCase().replace(/^www\./, "");
    if (!emailDomain || !hostname) return false;
    return emailDomain === hostname || emailDomain.endsWith(`.${hostname}`) || hostname.endsWith(`.${emailDomain}`);
  } catch {
    return false;
  }
}
