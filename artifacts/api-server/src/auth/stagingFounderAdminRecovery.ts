import { createHash, randomBytes, randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db, memberAgreementsTable, pool, usersTable } from "@workspace/db";
import { createSession, type SessionData } from "../lib/auth";
import { sendEmail } from "../lib/email";
import { isFounderOwnerEmail } from "../lib/protectedAdminAccess";

const RECOVERY_ADVISORY_LOCK = "mwm:staging-founder-admin-recovery:v1";
const RECOVERY_GUARD_ADVISORY_LOCK =
  "mwm:staging-founder-admin-recovery-guard:v1";
const STAGING_PROJECT_ID = "37ed0a9d-a280-43d5-b6ca-885f237b84ea";
const STAGING_SERVICE_ID = "7c02d801-6273-4e77-aea3-1db8bd86be18";
const STAGING_PUBLIC_ORIGIN =
  "https://kinfolk-memory-api-staging-staging.up.railway.app";
const RECOVERY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type RecoveryState =
  | "pending_delivery"
  | "sent"
  | "failed_delivery"
  | "activated"
  | "revoked";

export interface StagingFounderAdminRecoveryEnvironment {
  readonly ADMIN_EMAILS?: string;
  readonly KINFOLK_MEMORY_STAGING_ISOLATION?: string;
  readonly KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED?: string;
  readonly KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED?: string;
  readonly KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_REISSUE_ENABLED?: string;
  readonly KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_TARGET_EMAIL?: string;
  readonly MWM_EXPLICIT_FEATURE_RELEASE_MODE?: string;
  readonly RAILWAY_ENVIRONMENT_NAME?: string;
  readonly RAILWAY_PROJECT_ID?: string;
  readonly RAILWAY_SERVICE_ID?: string;
  readonly RESEND_API_KEY?: string;
}

export type StagingFounderAdminRecoveryIneligibility =
  | "environment_not_staging"
  | "staging_isolation_disabled"
  | "feature_release_mode_disabled"
  | "project_not_isolated_target"
  | "service_not_isolated_target"
  | "bootstrap_not_disabled"
  | "recovery_disabled"
  | "target_missing_or_ambiguous"
  | "target_not_allowlisted"
  | "target_not_founder"
  | "request_not_target";

export type StagingFounderAdminRecoveryEligibility =
  | "eligible"
  | StagingFounderAdminRecoveryIneligibility;

export type StagingFounderAdminRecoveryIssueResult =
  | {
      readonly status: "not_requested";
      readonly reason: StagingFounderAdminRecoveryIneligibility;
    }
  | { readonly status: "issued" }
  | { readonly status: "already_recorded" }
  | { readonly status: "blocked" };

export type StagingFounderAdminRecoveryCompletion =
  | { readonly status: "not_requested" }
  | { readonly status: "not_completed" }
  | {
      readonly status: "completed";
      readonly sid: string;
      readonly user: {
        readonly id: string;
        readonly firstName: string | null;
        readonly username: string | null;
      };
    };

export interface CompleteStagingFounderAdminRecoveryInput {
  readonly activationToken: string | undefined;
  readonly dateOfBirth: Date;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly passwordHash: string;
  readonly platform: string;
  readonly username: string;
}

function normalizeEmail(email: string | undefined | null): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizedAdminEmails(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

function configuredRecoveryTarget(
  environment: StagingFounderAdminRecoveryEnvironment,
): string | null {
  const raw = environment.KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_TARGET_EMAIL;
  if (!raw || raw.includes(",")) return null;
  const target = normalizeEmail(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) ? target : null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function receiptFingerprint(receipt: string | null | undefined): string | null {
  return receipt ? createHash("sha256").update(receipt).digest("hex") : null;
}

/**
 * The recovery route is intentionally unavailable unless every deployment,
 * isolation, and founder-identity condition is explicit. This is independent
 * of (and mutually exclusive with) the prior global bootstrap claim.
 */
export function stagingFounderAdminRecoveryEligibility(
  requestEmail: string | undefined | null,
  environment: StagingFounderAdminRecoveryEnvironment = process.env,
): StagingFounderAdminRecoveryEligibility {
  if (environment.RAILWAY_ENVIRONMENT_NAME !== "staging") {
    return "environment_not_staging";
  }
  if (environment.KINFOLK_MEMORY_STAGING_ISOLATION !== "true") {
    return "staging_isolation_disabled";
  }
  if (environment.MWM_EXPLICIT_FEATURE_RELEASE_MODE !== "true") {
    return "feature_release_mode_disabled";
  }
  if (environment.RAILWAY_PROJECT_ID !== STAGING_PROJECT_ID) {
    return "project_not_isolated_target";
  }
  if (environment.RAILWAY_SERVICE_ID !== STAGING_SERVICE_ID) {
    return "service_not_isolated_target";
  }
  if (environment.KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED !== "false") {
    return "bootstrap_not_disabled";
  }
  if (environment.KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_ENABLED !== "true") {
    return "recovery_disabled";
  }
  const target = configuredRecoveryTarget(environment);
  if (!target) return "target_missing_or_ambiguous";
  if (!normalizedAdminEmails(environment.ADMIN_EMAILS).has(target)) {
    return "target_not_allowlisted";
  }
  if (!isFounderOwnerEmail(target)) return "target_not_founder";
  if (requestEmail !== undefined && normalizeEmail(requestEmail) !== target) {
    return "request_not_target";
  }
  return "eligible";
}

function recoveryActivationUrl(token: string): string {
  return `${STAGING_PUBLIC_ORIGIN}/signup?invite=${encodeURIComponent(token)}`;
}

/**
 * Reissue is deliberately a second, default-off operator decision. A sent,
 * unexpired capability is never replaced because it may still be in transit.
 * A pending-delivery capability is safe to supersede: it is not redeemable.
 */
export function mayReissueStagingFounderAdminRecovery(
  state: RecoveryState,
  expiresAt: Date,
  environment: StagingFounderAdminRecoveryEnvironment = process.env,
): boolean {
  if (
    environment.KINFOLK_STAGING_FOUNDER_ADMIN_RECOVERY_REISSUE_ENABLED !==
    "true"
  ) {
    return false;
  }
  if (state === "activated") return false;
  return state !== "sent" || expiresAt <= new Date();
}

/**
 * A narrow, additive schema gate. It does not issue a capability, create a
 * user, change a role, or touch the historical administrator. It runs only
 * while the distinct recovery flag is explicitly enabled.
 */
export async function ensureStagingFounderAdminRecoverySchema(
  log: (message: string) => void = () => undefined,
  warn: (message: string) => void = () => undefined,
  environment: StagingFounderAdminRecoveryEnvironment = process.env,
): Promise<boolean> {
  if (
    stagingFounderAdminRecoveryEligibility(undefined, environment) !==
    "eligible"
  ) {
    return false;
  }
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      RECOVERY_GUARD_ADVISORY_LOCK,
    ]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_tester_emails (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        tester_access_source VARCHAR NOT NULL DEFAULT 'admin_invite',
        granted_by VARCHAR,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        entitlement_ends_at TIMESTAMPTZ,
        applied_at TIMESTAMPTZ,
        applied_to_user_id VARCHAR
      );
      CREATE TABLE IF NOT EXISTS staging_founder_admin_recovery (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        is_current BOOLEAN NOT NULL DEFAULT TRUE,
        email TEXT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        state TEXT NOT NULL CHECK (state IN ('pending_delivery', 'sent', 'failed_delivery', 'activated', 'revoked')),
        expires_at TIMESTAMPTZ NOT NULL,
        provider_receipt_fingerprint CHAR(64),
        delivery_failure_code TEXT,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        delivery_attempted_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        activated_user_id VARCHAR(255) REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS staging_founder_admin_recovery_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recovery_id UUID NOT NULL REFERENCES staging_founder_admin_recovery(id),
        event_type TEXT NOT NULL CHECK (event_type IN ('issued', 'delivery_accepted', 'delivery_failed', 'activated', 'pending_revoked', 'superseded', 'activated_suspended')),
        actor TEXT NOT NULL,
        user_id VARCHAR(255) REFERENCES users(id),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_account_lifecycle_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id),
        actor_user_id VARCHAR(255),
        prior_status VARCHAR(20) NOT NULL,
        next_status VARCHAR(20) NOT NULL,
        reason VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS staging_founder_admin_recovery_events_recovery_created_idx
        ON staging_founder_admin_recovery_events (recovery_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS staging_founder_admin_recovery_one_current_idx
        ON staging_founder_admin_recovery (is_current) WHERE is_current;
      CREATE INDEX IF NOT EXISTS staging_founder_admin_recovery_email_idx
        ON staging_founder_admin_recovery (email);
    `);
    await client.query(
      `SELECT id, email, first_name, last_name, username, password_hash,
              email_verified, approved, role, member_type, account_status,
              tester_status, must_change_password
         FROM users
        LIMIT 0`,
    );
    await client.query(
      `SELECT id, is_current, email, token_hash, state, expires_at,
              provider_receipt_fingerprint, delivery_failure_code,
              issued_at, delivery_attempted_at, delivered_at, used_at,
              revoked_at, activated_user_id, created_at, updated_at
         FROM staging_founder_admin_recovery
        LIMIT 0`,
    );
    await client.query("SELECT sid, sess, expire FROM sessions LIMIT 0");
    await client.query(
      "SELECT id, user_id, agreement_version, platform, active FROM member_agreements LIMIT 0",
    );
    await client.query(`
      CREATE OR REPLACE FUNCTION public.mwm_reject_staging_founder_recovery_event_mutation()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'Staging founder recovery audit events are append-only.' USING ERRCODE = 'check_violation';
      END;
      $$;
      DROP TRIGGER IF EXISTS mwm_reject_staging_founder_recovery_event_update
        ON staging_founder_admin_recovery_events;
      CREATE TRIGGER mwm_reject_staging_founder_recovery_event_update
        BEFORE UPDATE OR DELETE ON staging_founder_admin_recovery_events
        FOR EACH ROW EXECUTE FUNCTION public.mwm_reject_staging_founder_recovery_event_mutation();
      CREATE OR REPLACE FUNCTION public.mwm_reject_staging_founder_recovery_tester_access()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM staging_founder_admin_recovery
          WHERE email = LOWER(TRIM(NEW.email))
        ) AND (NEW.role = 'tester' OR NEW.tester_status = 'active') THEN
          RAISE EXCEPTION 'The staging founder recovery account cannot receive tester access.'
            USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
      END;
      $$;
      DROP TRIGGER IF EXISTS mwm_reject_staging_founder_recovery_tester_status
        ON users;
      CREATE TRIGGER mwm_reject_staging_founder_recovery_tester_status
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION public.mwm_reject_staging_founder_recovery_tester_access();
      CREATE OR REPLACE FUNCTION public.mwm_reject_staging_founder_recovery_pending_tester()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM staging_founder_admin_recovery
          WHERE email = LOWER(TRIM(NEW.email))
        ) THEN
          RAISE EXCEPTION 'The staging founder recovery account cannot receive a pending tester entitlement.'
            USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
      END;
      $$;
      DROP TRIGGER IF EXISTS mwm_reject_staging_founder_recovery_pending_tester_trigger
        ON pending_tester_emails;
      CREATE TRIGGER mwm_reject_staging_founder_recovery_pending_tester_trigger
        BEFORE INSERT OR UPDATE ON pending_tester_emails
        FOR EACH ROW EXECUTE FUNCTION public.mwm_reject_staging_founder_recovery_pending_tester();
    `);
    await client.query("COMMIT");
    transactionStarted = false;
    log("Staging founder recovery schema is ready before traffic acceptance");
    return true;
  } catch (error) {
    if (transactionStarted)
      await client.query("ROLLBACK").catch(() => undefined);
    warn(
      "Staging founder recovery schema is unavailable; recovery stays disabled",
    );
    throw error;
  } finally {
    client.release();
  }
}

async function recoveryPreflight(
  client: { query: typeof pool.query },
  targetEmail: string,
): Promise<boolean> {
  const [target, historicalAdmins, pendingTester] = await Promise.all([
    client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1) AS exists",
      [targetEmail],
    ),
    client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
         FROM users
        WHERE role = 'admin' AND LOWER(TRIM(email)) <> $1`,
      [targetEmail],
    ),
    client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pending_tester_emails WHERE LOWER(TRIM(email)) = $1) AS exists",
      [targetEmail],
    ),
  ]);
  return (
    target.rows[0]?.exists !== true &&
    historicalAdmins.rows[0]?.count === 1 &&
    pendingTester.rows[0]?.exists !== true
  );
}

/**
 * Issues one dedicated email-bound recovery capability after every invariant is
 * checked under a recovery-specific lock. No account, session, role, tester
 * entitlement, or ordinary activation invitation is created here.
 */
export async function issueStagingFounderAdminRecovery(
  environment: StagingFounderAdminRecoveryEnvironment = process.env,
): Promise<StagingFounderAdminRecoveryIssueResult> {
  const eligibility = stagingFounderAdminRecoveryEligibility(
    undefined,
    environment,
  );
  if (eligibility !== "eligible") {
    return { status: "not_requested", reason: eligibility };
  }
  if (!environment.RESEND_API_KEY?.trim()) return { status: "blocked" };
  const targetEmail = configuredRecoveryTarget(environment);
  if (!targetEmail) return { status: "blocked" };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RECOVERY_TTL_MS);
  const client = await pool.connect();
  let issued: { id: string } | null = null;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      RECOVERY_ADVISORY_LOCK,
    ]);
    const existing = await client.query<{
      id: string;
      state: RecoveryState;
      expires_at: Date;
    }>(
      `SELECT id, state, expires_at
         FROM staging_founder_admin_recovery
        WHERE is_current = TRUE
        FOR UPDATE`,
    );
    const currentRecovery = existing.rows[0];
    if (
      currentRecovery &&
      !mayReissueStagingFounderAdminRecovery(
        currentRecovery.state,
        currentRecovery.expires_at,
        environment,
      )
    ) {
      await client.query("COMMIT");
      return { status: "already_recorded" };
    }
    if (!(await recoveryPreflight(client, targetEmail))) {
      await client.query("ROLLBACK");
      return { status: "blocked" };
    }
    if (currentRecovery) {
      await client.query(
        `UPDATE staging_founder_admin_recovery
            SET is_current = FALSE, state = 'revoked',
                revoked_at = COALESCE(revoked_at, NOW()), updated_at = NOW()
          WHERE id = $1 AND is_current = TRUE`,
        [currentRecovery.id],
      );
      await client.query(
        `INSERT INTO staging_founder_admin_recovery_events
           (recovery_id, event_type, actor, metadata)
         VALUES ($1, 'superseded', 'system:staging_founder_admin_recovery_v1',
                 jsonb_build_object('priorState', $2::text))`,
        [currentRecovery.id, currentRecovery.state],
      );
    }
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO staging_founder_admin_recovery
         (is_current, email, token_hash, state, expires_at)
       VALUES (TRUE, $1, $2, 'pending_delivery', $3)
       RETURNING id`,
      [targetEmail, hashToken(token), expiresAt],
    );
    issued = inserted.rows[0] ?? null;
    if (!issued)
      throw new Error("Staging founder recovery issuance was not persisted");
    await client.query(
      `INSERT INTO staging_founder_admin_recovery_events
         (recovery_id, event_type, actor, metadata)
       VALUES ($1, 'issued', 'system:staging_founder_admin_recovery_v1', '{}'::jsonb)`,
      [issued.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  try {
    const receipt = await sendEmail({
      from: "Mapping With Melanin™ <hello@mappingwithmelanin.com>",
      to: targetEmail,
      subject: "Staging administrator account recovery",
      html: `<p>A secure, one-time staging administrator account recovery link was requested.</p><p><a href="${recoveryActivationUrl(token)}">Create your staging administrator account</a></p><p>This link expires in seven days and should not be forwarded.</p>`,
    });
    const clientForDelivery = await pool.connect();
    let deliveryTransactionStarted = false;
    try {
      await clientForDelivery.query("BEGIN");
      deliveryTransactionStarted = true;
      await clientForDelivery.query(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        [RECOVERY_ADVISORY_LOCK],
      );
      const deliveryUpdate = await clientForDelivery.query(
        `UPDATE staging_founder_admin_recovery
            SET state = 'sent', delivery_attempted_at = NOW(), delivered_at = NOW(),
                provider_receipt_fingerprint = $2, updated_at = NOW()
          WHERE id = $1 AND state = 'pending_delivery'`,
        [issued.id, receiptFingerprint(receipt?.id)],
      );
      if ((deliveryUpdate.rowCount ?? 0) !== 1) {
        throw new Error(
          "Staging founder recovery delivery state was not updated",
        );
      }
      await clientForDelivery.query(
        `INSERT INTO staging_founder_admin_recovery_events
           (recovery_id, event_type, actor, metadata)
         VALUES ($1, 'delivery_accepted', 'system:staging_founder_admin_recovery_v1', '{}'::jsonb)`,
        [issued.id],
      );
      await clientForDelivery.query("COMMIT");
      deliveryTransactionStarted = false;
    } catch (error) {
      if (deliveryTransactionStarted) {
        await clientForDelivery.query("ROLLBACK").catch(() => undefined);
      }
      throw error;
    } finally {
      clientForDelivery.release();
    }
  } catch {
    const clientForFailure = await pool.connect();
    let failureTransactionStarted = false;
    try {
      await clientForFailure.query("BEGIN");
      failureTransactionStarted = true;
      await clientForFailure.query(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        [RECOVERY_ADVISORY_LOCK],
      );
      const failureUpdate = await clientForFailure.query(
        `UPDATE staging_founder_admin_recovery
            SET state = 'failed_delivery', revoked_at = NOW(), delivery_attempted_at = NOW(),
                delivery_failure_code = 'provider_send_failed', updated_at = NOW()
          WHERE id = $1 AND state = 'pending_delivery'`,
        [issued.id],
      );
      if ((failureUpdate.rowCount ?? 0) !== 1) {
        throw new Error(
          "Staging founder recovery delivery failure was not revoked",
        );
      }
      await clientForFailure.query(
        `INSERT INTO staging_founder_admin_recovery_events
           (recovery_id, event_type, actor, metadata)
         VALUES ($1, 'delivery_failed', 'system:staging_founder_admin_recovery_v1',
                 jsonb_build_object('failure', 'provider_send_failed'))`,
        [issued.id],
      );
      await clientForFailure.query("COMMIT");
      failureTransactionStarted = false;
    } catch (error) {
      if (failureTransactionStarted) {
        await clientForFailure.query("ROLLBACK").catch(() => undefined);
      }
      throw error;
    } finally {
      clientForFailure.release();
    }
    return { status: "blocked" };
  }
  return { status: "issued" };
}

/**
 * Atomically consumes only the dedicated recovery capability and creates the
 * one permitted staging founder administrator. Ordinary activation invitations,
 * bootstrap claims, tester grants, and historical admin records are untouched.
 */
export async function completeStagingFounderAdminRecovery(
  input: CompleteStagingFounderAdminRecoveryInput,
  environment: StagingFounderAdminRecoveryEnvironment = process.env,
): Promise<StagingFounderAdminRecoveryCompletion> {
  if (
    stagingFounderAdminRecoveryEligibility(input.email, environment) !==
    "eligible"
  ) {
    return { status: "not_requested" };
  }
  const token = input.activationToken?.trim();
  if (!token) return { status: "not_completed" };
  const tokenHash = hashToken(token);
  const cleanEmail = normalizeEmail(input.email);

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${RECOVERY_ADVISORY_LOCK}))`,
    );
    const recovery = await tx.execute<{
      id: string;
      email: string;
      token_hash: string;
      state: RecoveryState;
      expires_at: Date;
    }>(sql`
      SELECT id, email, token_hash, state, expires_at
        FROM staging_founder_admin_recovery
       WHERE is_current = TRUE
       FOR UPDATE
    `);
    const record = recovery.rows[0];
    if (
      !record ||
      record.email !== cleanEmail ||
      record.token_hash !== tokenHash ||
      record.state !== "sent" ||
      record.expires_at <= new Date()
    ) {
      return { status: "not_completed" } as const;
    }

    const [existingUser, historicalAdminCount, pendingTester] =
      await Promise.all([
        tx
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, cleanEmail))
          .limit(1),
        tx.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
          FROM users
         WHERE role = 'admin' AND LOWER(TRIM(email)) <> ${cleanEmail}
      `),
        tx.execute<{ exists: boolean }>(sql`
        SELECT EXISTS(
          SELECT 1 FROM pending_tester_emails
           WHERE LOWER(TRIM(email)) = ${cleanEmail}
        ) AS exists
      `),
      ]);
    if (
      existingUser[0] ||
      historicalAdminCount.rows[0]?.count !== 1 ||
      pendingTester.rows[0]?.exists === true
    ) {
      return { status: "not_completed" } as const;
    }

    const referralCode = randomBytes(4).toString("hex").toUpperCase();
    const [user] = await tx
      .insert(usersTable)
      .values({
        email: cleanEmail,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        username: input.username.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        emailVerified: true,
        approved: true,
        agreeToTerms: true,
        dateOfBirth: input.dateOfBirth,
        referralCode,
        role: "admin",
        memberType: "founding",
        accountStatus: "active",
        testerStatus: "inactive",
        mustChangePassword: false,
      })
      .returning();
    if (!user) throw new Error("Staging founder recovery user was not created");

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        approved: user.approved,
        role: "admin",
      },
      access_token: "",
    };
    const sid = await createSession(sessionData, tx);
    await tx.insert(memberAgreementsTable).values({
      id: randomUUID(),
      userId: user.id,
      agreementVersion: "v1",
      platform: input.platform,
      active: true,
    });
    await tx.execute(sql`
      UPDATE staging_founder_admin_recovery
         SET state = 'activated', used_at = NOW(), activated_user_id = ${user.id}, updated_at = NOW()
       WHERE id = ${record.id} AND state = 'sent'
    `);
    await tx.execute(sql`
      INSERT INTO staging_founder_admin_recovery_events
        (recovery_id, event_type, actor, user_id, metadata)
      VALUES (
        ${record.id},
        'activated',
        'system:staging_founder_admin_recovery_v1',
        ${user.id},
        jsonb_build_object('role', 'admin', 'testerStatus', 'inactive')
      )
    `);
    await tx.execute(sql`
      INSERT INTO admin_account_lifecycle_events
        (user_id, actor_user_id, prior_status, next_status, reason)
      VALUES (
        ${user.id},
        NULL,
        'absent',
        'active',
        'Isolated staging founder administrator recovery'
      )
    `);
    return {
      status: "completed" as const,
      sid,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
      },
    };
  });
}
