import { createHash, randomBytes } from "crypto";
import { pool } from "@workspace/db";

export const MEMBER_ACTIVATION_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type MemberActivationInvitationStatus =
  | "pending_delivery"
  | "sent"
  | "failed_delivery"
  | "activated"
  | "revoked"
  | "expired";

export type ActivationInvitationValidation =
  | { valid: true }
  | { valid: false; code: "ACTIVATION_INVITATION_INVALID" | "ACTIVATION_INVITATION_EXPIRED" | "ACTIVATION_INVITATION_REVOKED" };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function providerReceiptFingerprint(receipt: string | null | undefined): string | null {
  if (!receipt) return null;
  return createHash("sha256").update(receipt).digest("hex");
}

export function buildMemberActivationUrl(token: string): string {
  return `https://mappingwithmelanin.com/signup?invite=${encodeURIComponent(token)}`;
}

export function buildMemberActivationDeepLink(token: string): string {
  return `mappingwithmelanin://signup?invite=${encodeURIComponent(token)}`;
}

/**
 * Creates a fresh, email-bound activation capability after revoking any unused
 * predecessor. The plaintext token is returned only to the caller so it can be
 * handed to the transactional-email provider; the database stores a hash only.
 */
export async function createMemberActivationInvitation(email: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const normalizedEmail = normalizeEmail(email);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MEMBER_ACTIVATION_INVITATION_TTL_MS);

  await pool.query(
    `UPDATE member_activation_invitations
        SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
      WHERE email = $1
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND status IN ('pending_delivery', 'sent', 'failed_delivery')`,
    [normalizedEmail],
  );
  await pool.query(
    `INSERT INTO member_activation_invitations
       (email, token_hash, status, expires_at)
     VALUES ($1, $2, 'pending_delivery', $3)`,
    [normalizedEmail, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

export async function recordMemberActivationInvitationDelivery(
  email: string,
  token: string,
  outcome: { accepted: boolean; providerReceiptId?: string | null; failureCode?: string | null },
): Promise<void> {
  await pool.query(
    `UPDATE member_activation_invitations
        SET status = $3,
            provider = 'resend',
            provider_receipt_fingerprint = $4,
            delivery_failure_code = $5,
            delivery_attempted_at = NOW(),
            -- Keep the boolean separate from the lifecycle enum parameter.
            -- Reusing $3 here makes PostgreSQL infer one parameter as both
            -- the enum and text, failing delivery with a 500 before Resend.
            delivery_accepted_at = CASE WHEN $6::boolean THEN NOW() ELSE NULL END,
            updated_at = NOW()
      WHERE email = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND revoked_at IS NULL`,
    [
      normalizeEmail(email),
      hashToken(token),
      outcome.accepted ? "sent" : "failed_delivery",
      providerReceiptFingerprint(outcome.providerReceiptId),
      outcome.accepted ? null : (outcome.failureCode ?? "provider_send_failed").slice(0, 80),
      outcome.accepted,
    ],
  );
}

export async function validateMemberActivationInvitation(
  email: string,
  token: string,
): Promise<ActivationInvitationValidation> {
  const { rows } = await pool.query<{
    status: MemberActivationInvitationStatus;
    expires_at: Date;
    revoked_at: Date | null;
    used_at: Date | null;
  }>(
    `SELECT status, expires_at, revoked_at, used_at
       FROM member_activation_invitations
      WHERE email = $1 AND token_hash = $2
      ORDER BY created_at DESC
      LIMIT 1`,
    [normalizeEmail(email), hashToken(token)],
  );
  const invitation = rows[0];
  if (!invitation) return { valid: false, code: "ACTIVATION_INVITATION_INVALID" };
  if (invitation.revoked_at || invitation.status === "revoked") {
    return { valid: false, code: "ACTIVATION_INVITATION_REVOKED" };
  }
  if (invitation.used_at || invitation.status === "activated" || invitation.expires_at <= new Date()) {
    return { valid: false, code: "ACTIVATION_INVITATION_EXPIRED" };
  }
  return { valid: true };
}

/**
 * A legacy approved waitlist row may predate activation invitations entirely,
 * but once an invitation has been issued its lifecycle is authoritative. In
 * particular, expiry, revocation, or a provider delivery failure must never
 * reopen direct registration for that email.
 */
export async function hasMemberActivationInvitationHistory(email: string): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM member_activation_invitations
        WHERE email = $1
     ) AS exists`,
    [normalizeEmail(email)],
  );
  return rows[0]?.exists === true;
}

/** Returns true only when a current invitation exists, so legacy approvals stay usable. */
export async function hasCurrentMemberActivationInvitation(email: string): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM member_activation_invitations
        WHERE email = $1
          AND used_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > NOW()
          AND status IN ('pending_delivery', 'sent', 'failed_delivery')
     ) AS exists`,
    [normalizeEmail(email)],
  );
  return rows[0]?.exists === true;
}

/**
 * Consumption happens only after account creation succeeds. The boolean result
 * allows registration to fail closed if an administrator revokes the capability
 * between validation and consumption.
 */
export async function consumeMemberActivationInvitation(email: string, token: string): Promise<boolean> {
  const result = await pool.query<{ id: string }>(
    `UPDATE member_activation_invitations
        SET status = 'activated', used_at = NOW(), updated_at = NOW()
      WHERE email = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND status IN ('pending_delivery', 'sent', 'failed_delivery')`,
    [normalizeEmail(email), hashToken(token)],
  );
  return (result.rowCount ?? 0) === 1;
}

export async function revokeMemberActivationInvitations(email: string): Promise<void> {
  await pool.query(
    `UPDATE member_activation_invitations
        SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
      WHERE email = $1
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND status IN ('pending_delivery', 'sent', 'failed_delivery')`,
    [normalizeEmail(email)],
  );
}
