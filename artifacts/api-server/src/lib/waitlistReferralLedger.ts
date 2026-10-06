import { randomBytes } from "node:crypto";
import { pool } from "@workspace/db";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_CODE_LENGTH = 10;
const MIN_CODE_LENGTH = 3;

const RESERVED_CODES = new Set([
  "ADMIN",
  "API",
  "APP",
  "HELP",
  "INVITE",
  "KINFOLK",
  "MELANIN",
  "MOD",
  "MODERATOR",
  "MWM",
  "NULL",
  "REFERRAL",
  "ROOT",
  "STAFF",
  "SUPPORT",
  "SYSTEM",
  "UNDEFINED",
  "WAITLIST",
]);

// Exact matches only: a moderation block must never accidentally reject an
// otherwise ordinary code merely because it contains a short word fragment.
const MODERATION_PROHIBITED_CODES = new Set([
  "BITCH",
  "CUNT",
  "FAG",
  "FUCK",
  "KILL",
  "NIGGER",
  "RAPE",
  "SHIT",
]);

export type ReferralCodeValidation =
  | { ok: true; displayCode: string; normalizedCode: string }
  | { ok: false; reason: "format" | "reserved" | "moderation" };

export type ReferralProfile = {
  referralCode: string;
  referralCount: number;
  referralUrl: string;
};

export class ReferralCodeUnavailableError extends Error {
  constructor() {
    super("That code is already taken. Try a different one.");
    this.name = "ReferralCodeUnavailableError";
  }
}

export class ReferralCodeValidationError extends Error {
  constructor(public readonly validation: Exclude<ReferralCodeValidation, { ok: true }>) {
    super(
      validation.reason === "format"
        ? "Use 3–10 letters, numbers, or hyphens; begin and end with a letter or number."
        : "That referral code is unavailable. Try a different one.",
    );
    this.name = "ReferralCodeValidationError";
  }
}

type Queryable = {
  query: <Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ) => Promise<{ rows: Row[] }>;
};

type ReferralCodeRow = {
  id: string;
  display_code: string;
  normalized_code: string;
  owner_email_lower: string;
  owner_user_id: string | null;
  owner_waitlist_signup_id: string | null;
  status: "active" | "retired" | "blocked";
};

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505";
}

function normalizedEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function referralUrl(code: string): string {
  return `https://mappingwithmelanin.com/?ref=${encodeURIComponent(code)}`;
}

/**
 * Existing shared links remain recognizable even if their historical code is
 * longer than the current creation limit. This parser is lookup-only: it does
 * not make a reserved or legacy code available for a new claim.
 */
export function normalizeReferralCodeForLookup(raw: unknown): ReferralCodeValidation {
  if (typeof raw !== "string") return { ok: false, reason: "format" };
  const normalizedCode = raw.normalize("NFKC").trim().toUpperCase();
  if (
    normalizedCode.length < MIN_CODE_LENGTH ||
    normalizedCode.length > 64 ||
    !/^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/.test(normalizedCode)
  ) {
    return { ok: false, reason: "format" };
  }
  return { ok: true, displayCode: normalizedCode, normalizedCode };
}

export function validateReferralCode(raw: unknown): ReferralCodeValidation {
  const parsed = normalizeReferralCodeForLookup(raw);
  if (!parsed.ok || parsed.normalizedCode.length > MAX_CODE_LENGTH) return { ok: false, reason: "format" };
  const { normalizedCode } = parsed;
  if (RESERVED_CODES.has(normalizedCode)) return { ok: false, reason: "reserved" };
  if (MODERATION_PROHIBITED_CODES.has(normalizedCode)) return { ok: false, reason: "moderation" };
  return { ok: true, displayCode: normalizedCode, normalizedCode };
}

function generatedCode(): string {
  let suffix = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `MWM-${suffix}`;
}

async function confirmedReferralCount(queryable: Queryable, ownerEmail: string): Promise<number> {
  const result = await queryable.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
       FROM waitlist_referral_attributions attribution
       JOIN waitlist_referral_codes code ON code.id = attribution.referral_code_id
      WHERE code.owner_email_lower = $1
        AND attribution.confirmed_at IS NOT NULL`,
    [ownerEmail],
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function activeCodeForOwner(queryable: Queryable, ownerEmail: string): Promise<ReferralCodeRow | null> {
  const result = await queryable.query<ReferralCodeRow>(
    `SELECT id, display_code, normalized_code, owner_email_lower, owner_user_id,
            owner_waitlist_signup_id, status
       FROM waitlist_referral_codes
      WHERE owner_email_lower = $1
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1`,
    [ownerEmail],
  );
  return result.rows[0] ?? null;
}

async function waitlistSignupIdForEmail(queryable: Queryable, ownerEmail: string): Promise<string | null> {
  const result = await queryable.query<{ id: string }>(
    `SELECT id FROM waitlist_signups WHERE lower(trim(email)) = $1 LIMIT 1`,
    [ownerEmail],
  );
  return result.rows[0]?.id ?? null;
}

async function createGeneratedActiveCode(input: {
  queryable: Queryable;
  ownerEmail: string;
  ownerUserId: string | null;
  ownerWaitlistSignupId: string | null;
}): Promise<ReferralCodeRow> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generatedCode();
    try {
      const inserted = await input.queryable.query<ReferralCodeRow>(
        `INSERT INTO waitlist_referral_codes
           (normalized_code, display_code, owner_email_lower, owner_user_id, owner_waitlist_signup_id, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING id, display_code, normalized_code, owner_email_lower, owner_user_id,
                   owner_waitlist_signup_id, status`,
        [code, code, input.ownerEmail, input.ownerUserId, input.ownerWaitlistSignupId],
      );
      return inserted.rows[0];
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Unable to allocate a unique referral code");
}

async function profileForCode(queryable: Queryable, code: ReferralCodeRow): Promise<ReferralProfile> {
  return {
    referralCode: code.display_code,
    referralCount: await confirmedReferralCount(queryable, code.owner_email_lower),
    referralUrl: referralUrl(code.display_code),
  };
}

/**
 * Returns one active code for a signed-in member. Existing historical codes are
 * first linked to the signed-in account by normalized email; a new code is
 * created only when no active historical code exists.
 */
export async function getOrCreateMemberReferralProfile(input: {
  userId: string;
  email: string;
}): Promise<ReferralProfile> {
  const ownerEmail = normalizedEmail(input.email);
  if (!ownerEmail) throw new Error("Member email is required for referral codes");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const waitlistSignupId = await waitlistSignupIdForEmail(client, ownerEmail);
    await client.query(
      `UPDATE waitlist_referral_codes
          SET owner_user_id = COALESCE(owner_user_id, $1),
              owner_waitlist_signup_id = COALESCE(owner_waitlist_signup_id, $2)
        WHERE owner_email_lower = $3
          AND status = 'active'`,
      [input.userId, waitlistSignupId, ownerEmail],
    );

    let active = await activeCodeForOwner(client, ownerEmail);
    if (!active) {
      active = await createGeneratedActiveCode({
        queryable: client,
        ownerEmail,
        ownerUserId: input.userId,
        ownerWaitlistSignupId: waitlistSignupId,
      });
    }

    // Keep the legacy column synchronized for installed clients that already
    // read it, but make the immutable ledger the source of uniqueness and count.
    await client.query(
      `UPDATE users SET referral_code = $1 WHERE id = $2`,
      [active.display_code, input.userId],
    );
    await client.query("COMMIT");
    return profileForCode(pool, active);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Creates a server-owned code immediately after a successful waitlist signup. */
export async function getOrCreateWaitlistReferralProfile(input: {
  waitlistSignupId: string;
  email: string;
}): Promise<ReferralProfile> {
  const ownerEmail = normalizedEmail(input.email);
  if (!ownerEmail) throw new Error("Waitlist email is required for referral codes");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let active = await activeCodeForOwner(client, ownerEmail);
    if (active) {
      await client.query(
        `UPDATE waitlist_referral_codes
            SET owner_waitlist_signup_id = COALESCE(owner_waitlist_signup_id, $1)
          WHERE id = $2`,
        [input.waitlistSignupId, active.id],
      );
      active = { ...active, owner_waitlist_signup_id: active.owner_waitlist_signup_id ?? input.waitlistSignupId };
    } else {
      active = await createGeneratedActiveCode({
        queryable: client,
        ownerEmail,
        ownerUserId: null,
        ownerWaitlistSignupId: input.waitlistSignupId,
      });
    }
    await client.query(
      `UPDATE waitlist_signups
          SET referral_code = $1
        WHERE id = $2
          AND (referral_code IS NULL OR referral_code = '')`,
      [active.display_code, input.waitlistSignupId],
    );
    await client.query("COMMIT");
    return profileForCode(pool, active);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkReferralCodeAvailability(input: {
  rawCode: unknown;
  userId: string;
  email: string;
}): Promise<{ available: boolean; reason?: string }> {
  const validation = validateReferralCode(input.rawCode);
  if (!validation.ok) return { available: false, reason: validation.reason };
  const ownerEmail = normalizedEmail(input.email);
  const result = await pool.query<ReferralCodeRow>(
    `SELECT id, display_code, normalized_code, owner_email_lower, owner_user_id,
            owner_waitlist_signup_id, status
       FROM waitlist_referral_codes
      WHERE normalized_code = $1
      LIMIT 1`,
    [validation.normalizedCode],
  );
  const existing = result.rows[0];
  if (!existing) return { available: true };
  const isCurrentActiveCode = existing.status === "active" && (
    existing.owner_user_id === input.userId || existing.owner_email_lower === ownerEmail
  );
  return isCurrentActiveCode ? { available: true } : { available: false, reason: "taken" };
}

/** Validates a submitted invite code before a new waitlist record is created. */
export async function assertActiveReferralCodeForWaitlistSignup(input: {
  rawCode: unknown;
  referredEmail: string;
}): Promise<void> {
  const validation = normalizeReferralCodeForLookup(input.rawCode);
  if (!validation.ok) throw new ReferralCodeValidationError(validation);
  const result = await pool.query<ReferralCodeRow>(
    `SELECT id, display_code, normalized_code, owner_email_lower, owner_user_id,
            owner_waitlist_signup_id, status
       FROM waitlist_referral_codes
      WHERE normalized_code = $1
        AND status = 'active'
      LIMIT 1`,
    [validation.normalizedCode],
  );
  const code = result.rows[0];
  if (!code || code.owner_email_lower === normalizedEmail(input.referredEmail)) {
    throw new ReferralCodeUnavailableError();
  }
}

/**
 * Retires the current code and inserts the replacement in one database
 * transaction. The database unique index remains the final concurrency guard.
 */
export async function setMemberReferralCode(input: {
  rawCode: unknown;
  userId: string;
  email: string;
}): Promise<ReferralProfile> {
  const validation = validateReferralCode(input.rawCode);
  if (!validation.ok) throw new ReferralCodeValidationError(validation);
  const ownerEmail = normalizedEmail(input.email);
  if (!ownerEmail) throw new Error("Member email is required for referral codes");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingResult = await client.query<ReferralCodeRow>(
      `SELECT id, display_code, normalized_code, owner_email_lower, owner_user_id,
              owner_waitlist_signup_id, status
         FROM waitlist_referral_codes
        WHERE normalized_code = $1
        FOR UPDATE`,
      [validation.normalizedCode],
    );
    const existing = existingResult.rows[0];
    const isOwnActive = existing?.status === "active" && (
      existing.owner_user_id === input.userId || existing.owner_email_lower === ownerEmail
    );
    if (existing && !isOwnActive) throw new ReferralCodeUnavailableError();

    let active: ReferralCodeRow;
    if (isOwnActive && existing) {
      const waitlistSignupId = await waitlistSignupIdForEmail(client, ownerEmail);
      const linked = await client.query<ReferralCodeRow>(
        `UPDATE waitlist_referral_codes
            SET owner_user_id = COALESCE(owner_user_id, $1),
                owner_waitlist_signup_id = COALESCE(owner_waitlist_signup_id, $2)
          WHERE id = $3
          RETURNING id, display_code, normalized_code, owner_email_lower, owner_user_id,
                    owner_waitlist_signup_id, status`,
        [input.userId, waitlistSignupId, existing.id],
      );
      active = linked.rows[0] ?? existing;
    } else {
      const waitlistSignupId = await waitlistSignupIdForEmail(client, ownerEmail);
      await client.query(
        `UPDATE waitlist_referral_codes
            SET status = 'retired', retired_at = NOW()
          WHERE owner_email_lower = $1
            AND status = 'active'`,
        [ownerEmail],
      );
      try {
        const inserted = await client.query<ReferralCodeRow>(
          `INSERT INTO waitlist_referral_codes
             (normalized_code, display_code, owner_email_lower, owner_user_id, owner_waitlist_signup_id, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           RETURNING id, display_code, normalized_code, owner_email_lower, owner_user_id,
                     owner_waitlist_signup_id, status`,
          [validation.normalizedCode, validation.displayCode, ownerEmail, input.userId, waitlistSignupId],
        );
        active = inserted.rows[0];
      } catch (error) {
        if (isUniqueViolation(error)) throw new ReferralCodeUnavailableError();
        throw error;
      }
    }

    await client.query(
      `UPDATE users SET referral_code = $1 WHERE id = $2`,
      [active.display_code, input.userId],
    );
    if (active.owner_waitlist_signup_id) {
      await client.query(
        `UPDATE waitlist_signups SET referral_code = $1 WHERE id = $2`,
        [active.display_code, active.owner_waitlist_signup_id],
      );
    }
    await client.query("COMMIT");
    return profileForCode(pool, active);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Records a successful distinct waitlist signup against an active code. A
 * row-level uniqueness constraint protects against duplicate submits, and the
 * five-member milestone is idempotently recorded with its notification.
 */
export async function attributeConfirmedWaitlistReferral(input: {
  rawCode: unknown;
  referredWaitlistSignupId: string;
  referredEmail: string;
}): Promise<{
  referralCode: string;
  milestoneReached: boolean;
  milestoneOwnerEmail: string | null;
  confirmedCount: number;
} | null> {
  const validation = normalizeReferralCodeForLookup(input.rawCode);
  if (!validation.ok) throw new ReferralCodeValidationError(validation);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const codeResult = await client.query<ReferralCodeRow>(
      `SELECT id, display_code, normalized_code, owner_email_lower, owner_user_id,
              owner_waitlist_signup_id, status
         FROM waitlist_referral_codes
        WHERE normalized_code = $1
          AND status = 'active'
        FOR UPDATE`,
      [validation.normalizedCode],
    );
    const code = codeResult.rows[0];
    if (!code || code.owner_email_lower === normalizedEmail(input.referredEmail)) {
      throw new ReferralCodeUnavailableError();
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO waitlist_referral_attributions
         (referral_code_id, referred_waitlist_signup_id, confirmed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (referred_waitlist_signup_id) DO NOTHING
       RETURNING id`,
      [code.id, input.referredWaitlistSignupId],
    );
    if (inserted.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }

    await client.query(
      `UPDATE waitlist_signups SET referred_by = $1 WHERE id = $2`,
      [code.display_code, input.referredWaitlistSignupId],
    );

    const codeCount = await client.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM waitlist_referral_attributions
        WHERE referral_code_id = $1
          AND confirmed_at IS NOT NULL`,
      [code.id],
    );
    const count = Number(codeCount.rows[0]?.total ?? 0);
    let milestoneReached = false;
    if (count >= 5) {
      const milestone = await client.query<{ referral_code_id: string }>(
        `INSERT INTO waitlist_referral_milestones (referral_code_id, milestone, reached_at)
         VALUES ($1, 5, NOW())
         ON CONFLICT (referral_code_id, milestone) DO NOTHING
         RETURNING referral_code_id`,
        [code.id],
      );
      milestoneReached = milestone.rows.length > 0;
      if (milestoneReached && code.owner_user_id) {
        await client.query(
          `INSERT INTO notifications
             (user_id, type, title, body, entity_id, entity_type, data)
           VALUES ($1, 'system', 'Your referral code reached five',
                   'Five people joined the waitlist with your referral code.',
                   $2, 'waitlist_referral', $3::jsonb)`,
          [
            code.owner_user_id,
            code.id,
            JSON.stringify({ milestone: 5, referralCode: code.display_code }),
          ],
        );
      }
    }
    await client.query("COMMIT");
    return {
      referralCode: code.display_code,
      milestoneReached,
      milestoneOwnerEmail: milestoneReached ? code.owner_email_lower : null,
      confirmedCount: count,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
