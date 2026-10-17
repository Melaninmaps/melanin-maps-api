import type { Pool } from "pg";

export interface IsolatedStagingAdminBootstrapEnvironment {
  readonly ADMIN_EMAILS?: string;
  readonly KINFOLK_MEMORY_STAGING_ISOLATION?: string;
  readonly KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED?: string;
  readonly RAILWAY_ENVIRONMENT_NAME?: string;
}

export type IsolatedStagingAdminBootstrapClaim =
  | { readonly status: "not_requested" }
  | { readonly status: "already_claimed" }
  | { readonly status: "tester_conflict" }
  | { readonly status: "granted"; readonly release: () => Promise<void> };

const BOOTSTRAP_ADVISORY_LOCK = "mwm:isolated-staging-admin-bootstrap:v1";
const BOOTSTRAP_GUARD_LOCK = "mwm:isolated-staging-admin-bootstrap-guard:v1";

function normalizedAdminEmails(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isIsolatedStagingAdminBootstrapEnabled(
  environment: IsolatedStagingAdminBootstrapEnvironment = process.env,
): boolean {
  return (
    environment.RAILWAY_ENVIRONMENT_NAME === "staging" &&
    environment.KINFOLK_MEMORY_STAGING_ISOLATION === "true" &&
    environment.KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED === "true"
  );
}

/**
 * Allows a bootstrap attempt only in explicitly isolated Railway staging and
 * only for an existing ADMIN_EMAILS allowlist entry. The durable, one-time
 * decision is made by acquireIsolatedStagingAdminBootstrap below.
 */
export function mayBootstrapIsolatedStagingAdmin(
  email: string | null | undefined,
  environment: IsolatedStagingAdminBootstrapEnvironment = process.env,
): boolean {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) return false;

  return (
    isIsolatedStagingAdminBootstrapEnabled(environment) &&
    normalizedAdminEmails(environment.ADMIN_EMAILS).has(normalizedEmail)
  );
}

/**
 * Installs the isolated-staging database boundary atomically. The exact
 * configured ADMIN_EMAILS set is materialized only inside this private staging
 * database, then triggers reject any pending or active tester entitlement for
 * those identities. Existing conflicting tester records abort installation so
 * a bootstrap cannot proceed on ambiguous access state.
 */
export async function ensureIsolatedStagingAdminBootstrapGuard(
  pool: Pick<Pool, "connect">,
  environment: IsolatedStagingAdminBootstrapEnvironment = process.env,
): Promise<boolean> {
  if (!isIsolatedStagingAdminBootstrapEnabled(environment)) return false;

  const allowedEmails = [...normalizedAdminEmails(environment.ADMIN_EMAILS)];
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      BOOTSTRAP_GUARD_LOCK,
    ]);

    // A schema-lagged isolated staging database must not cause the guard to
    // fail open. This matches the existing pending-entitlement schema exactly.
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
      CREATE TABLE IF NOT EXISTS mwm_isolated_staging_admin_bootstrap_emails (
        email VARCHAR(255) PRIMARY KEY
      );
    `);

    // Block entitlement writers while the allowlist, trigger functions, and
    // conflict check are installed. The transaction commits all three together.
    await client.query(
      "LOCK TABLE users, pending_tester_emails IN SHARE ROW EXCLUSIVE MODE",
    );
    await client.query(
      "DELETE FROM mwm_isolated_staging_admin_bootstrap_emails",
    );
    if (allowedEmails.length > 0) {
      await client.query(
        `INSERT INTO mwm_isolated_staging_admin_bootstrap_emails (email)
         SELECT DISTINCT LOWER(TRIM(email))
         FROM unnest($1::text[]) AS allowed(email)`,
        [allowedEmails],
      );
    }

    await client.query(`
      CREATE OR REPLACE FUNCTION public.mwm_reject_isolated_staging_admin_tester_pending()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM mwm_isolated_staging_admin_bootstrap_emails
          WHERE email = LOWER(TRIM(NEW.email))
        ) OR EXISTS (
          SELECT 1
          FROM users
          WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
            AND role = 'admin'
        ) THEN
          RAISE EXCEPTION 'An isolated staging administrator cannot receive a tester entitlement.'
            USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS mwm_reject_isolated_staging_admin_tester_pending_trigger
        ON pending_tester_emails;
      CREATE TRIGGER mwm_reject_isolated_staging_admin_tester_pending_trigger
        BEFORE INSERT OR UPDATE ON pending_tester_emails
        FOR EACH ROW
        EXECUTE FUNCTION public.mwm_reject_isolated_staging_admin_tester_pending();

      CREATE OR REPLACE FUNCTION public.mwm_reject_isolated_staging_admin_tester_status()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM mwm_isolated_staging_admin_bootstrap_emails
          WHERE email = LOWER(TRIM(NEW.email))
        ) AND (NEW.role = 'tester' OR NEW.tester_status = 'active') THEN
          RAISE EXCEPTION 'A configured isolated staging administrator cannot receive tester access.'
            USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.role = 'admin' AND NEW.tester_status = 'active' THEN
          RAISE EXCEPTION 'An isolated staging administrator cannot receive active tester status.'
            USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS mwm_reject_isolated_staging_admin_tester_status_trigger
        ON users;
      CREATE TRIGGER mwm_reject_isolated_staging_admin_tester_status_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION public.mwm_reject_isolated_staging_admin_tester_status();
    `);

    const conflicts = await client.query<{ email: string }>(`
      SELECT email
      FROM mwm_isolated_staging_admin_bootstrap_emails
      WHERE EXISTS (
        SELECT 1
        FROM pending_tester_emails
        WHERE LOWER(TRIM(pending_tester_emails.email)) = mwm_isolated_staging_admin_bootstrap_emails.email
      )
      UNION
      SELECT configured.email
      FROM mwm_isolated_staging_admin_bootstrap_emails AS configured
      JOIN users ON LOWER(TRIM(users.email)) = configured.email
      WHERE users.role = 'tester' OR users.tester_status = 'active'
    `);
    if (conflicts.rows.length > 0) {
      throw new Error(
        "Configured isolated staging administrator has conflicting tester access",
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return true;
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Claims the one isolated-staging administrator bootstrap slot. A session-level
 * advisory lock serializes competing registrations while the caller creates the
 * account. A persisted users.role='admin' row is the durable consumed marker.
 * The database guard independently prevents every tester writer from adding an
 * entitlement before or after a claim has been granted.
 */
export async function acquireIsolatedStagingAdminBootstrap(
  email: string,
  pool: Pick<Pool, "connect">,
  environment: IsolatedStagingAdminBootstrapEnvironment = process.env,
): Promise<IsolatedStagingAdminBootstrapClaim> {
  if (!mayBootstrapIsolatedStagingAdmin(email, environment)) {
    return { status: "not_requested" };
  }

  // Do not grant a bootstrap claim unless the database itself rejects any
  // concurrent or future tester-entitlement write for this administrator.
  await ensureIsolatedStagingAdminBootstrapGuard(pool, environment);

  const client = await pool.connect();
  let lockAcquired = false;
  let released = false;

  const release = async (): Promise<void> => {
    if (released) return;
    released = true;

    let unlockFailed = false;
    if (lockAcquired) {
      try {
        await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
          BOOTSTRAP_ADVISORY_LOCK,
        ]);
      } catch {
        unlockFailed = true;
      }
    }

    // A failed unlock must discard the connection so a pooled session cannot
    // retain the lock and block a later isolated-staging recovery.
    client.release(
      unlockFailed
        ? new Error("staging bootstrap advisory unlock failed")
        : undefined,
    );
  };

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [
      BOOTSTRAP_ADVISORY_LOCK,
    ]);
    lockAcquired = true;

    const existingAdmin = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin') AS exists",
    );
    if (existingAdmin.rows[0]?.exists === true) {
      await release();
      return { status: "already_claimed" };
    }

    const pendingTester = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pending_tester_emails WHERE lower(email) = lower($1)) AS exists",
      [email],
    );
    if (pendingTester.rows[0]?.exists === true) {
      await release();
      return { status: "tester_conflict" };
    }

    return { status: "granted", release };
  } catch (error) {
    await release();
    throw error;
  }
}
