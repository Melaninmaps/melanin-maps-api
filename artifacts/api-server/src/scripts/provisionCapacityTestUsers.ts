import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import {
  CAPACITY_TEST_CLEANUP_GUARD,
  CAPACITY_TEST_PROVISION_GUARD,
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
  capacityTestEmail,
  isCapacityTestEmail,
} from "../capacity/capacityTestIdentitySpec";

/**
 * Deliberately manual lifecycle utility for a bounded Grafana Cloud capacity test.
 *
 * It never runs from startup migrations and cannot execute a write without the
 * explicit environment guard. The namespace is purpose-specific, idempotent, and
 * separate from existing `mwm-loadtest-*` and `manus.tester.*` accounts.
 */
export {
  CAPACITY_TEST_CLEANUP_GUARD,
  CAPACITY_TEST_PROVISION_GUARD,
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
  capacityTestEmail,
  isCapacityTestEmail,
};

export type CapacityProvisionMode = "verify" | "provision" | "cleanup";

type CapacityAccountRow = {
  email: string;
  isLoadTest: boolean;
};

export function parseCapacityProvisionMode(args: readonly string[]): CapacityProvisionMode {
  const requested = args.find((argument) => argument.startsWith("--mode="))?.slice("--mode=".length) ?? "verify";
  if (requested === "verify" || requested === "provision" || requested === "cleanup") return requested;
  throw new Error("Use --mode=verify, --mode=provision, or --mode=cleanup.");
}

function requireExactEnvironment(name: string, expected: string): void {
  if (process.env[name] !== expected) {
    throw new Error(`${name} must equal ${expected} before this operation can run.`);
  }
}

function capacityAccountSummary(rows: readonly CapacityAccountRow[]) {
  return {
    expectedAccounts: CAPACITY_TEST_USER_COUNT,
    presentAccounts: rows.length,
    loadTestAccounts: rows.filter((row) => row.isLoadTest).length,
    ordinaryAccountCollisions: rows.filter((row) => !row.isLoadTest).length,
  };
}

async function fetchExistingAccounts(client: PoolClient): Promise<CapacityAccountRow[]> {
  const accounts = buildCapacityTestAccounts();
  const result = await client.query<CapacityAccountRow>(
    `SELECT email, COALESCE(is_load_test, false) AS "isLoadTest"
       FROM users
      WHERE email = ANY($1::text[])
      ORDER BY email ASC`,
    [accounts.map((account) => account.email)],
  );
  return result.rows;
}

async function verifyCapacityAccounts(client: PoolClient): Promise<void> {
  const existing = await fetchExistingAccounts(client);
  const summary = capacityAccountSummary(existing);
  if (summary.ordinaryAccountCollisions > 0) {
    throw new Error("Refusing to proceed: a capacity-test email collides with a non-test user.");
  }
  if (summary.presentAccounts !== CAPACITY_TEST_USER_COUNT || summary.loadTestAccounts !== CAPACITY_TEST_USER_COUNT) {
    throw new Error(`Capacity account verification failed: ${JSON.stringify(summary)}.`);
  }
  console.log(JSON.stringify({ mode: "verify", status: "ok", ...summary }));
}

async function provisionCapacityAccounts(client: PoolClient): Promise<void> {
  requireExactEnvironment("CAPACITY_TEST_IDENTITY_WRITE_APPROVED", CAPACITY_TEST_PROVISION_GUARD);
  const password = process.env.CAPACITY_TEST_PASSWORD;
  if (!password || password.length < 16) {
    throw new Error("CAPACITY_TEST_PASSWORD must be a new secret of at least 16 characters.");
  }

  const accounts = buildCapacityTestAccounts();
  const existing = await fetchExistingAccounts(client);
  const preflight = capacityAccountSummary(existing);
  if (preflight.ordinaryAccountCollisions > 0) {
    throw new Error("Refusing to provision: a capacity-test email collides with a non-test user.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await client.query("BEGIN");
  try {
    const sessionCleanup = await client.query(
      `DELETE FROM sessions
        WHERE COALESCE(sess->'user'->>'email', '') = ANY($1::text[])
           OR COALESCE(sess->>'email', '') = ANY($1::text[])`,
      [accounts.map((account) => account.email)],
    );
    let created = 0;
    let retained = 0;
    for (const account of accounts) {
      const result = await client.query<{ inserted: boolean }>(
        `INSERT INTO users (
           email, first_name, last_name, username, home_city, password_hash,
           email_verified, approved, member_type, tester_status,
           tester_access_source, is_load_test, marketing_opt_out,
           created_at, updated_at
         ) VALUES (
           $1, 'Capacity', 'Test', $2, $3, $4,
           true, true, 'free', 'active', 'admin_invite', true, true,
           NOW(), NOW()
         )
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           is_load_test = true,
           marketing_opt_out = true,
           approved = true,
           email_verified = true,
           updated_at = NOW()
         WHERE users.is_load_test = true
         RETURNING (xmax = 0) AS inserted`,
        [account.email, account.username, account.homeCity, passwordHash],
      );
      if (result.rows[0]?.inserted) created += 1;
      else retained += 1;
    }
    await client.query("COMMIT");
    await verifyCapacityAccounts(client);
    console.log(JSON.stringify({
      mode: "provision",
      status: "ok",
      expectedAccounts: CAPACITY_TEST_USER_COUNT,
      created,
      retained,
      revokedPriorSessions: sessionCleanup.rowCount ?? 0,
      credentialsLogged: false,
    }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function cleanupCapacityAccounts(client: PoolClient): Promise<void> {
  requireExactEnvironment("CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED", CAPACITY_TEST_CLEANUP_GUARD);
  const accounts = buildCapacityTestAccounts();
  await client.query("BEGIN");
  try {
    const sessions = await client.query(
      `DELETE FROM sessions
        WHERE COALESCE(sess->'user'->>'email', '') = ANY($1::text[])
           OR COALESCE(sess->>'email', '') = ANY($1::text[])`,
      [accounts.map((account) => account.email)],
    );
    const users = await client.query(
      `DELETE FROM users
        WHERE email = ANY($1::text[])
          AND COALESCE(is_load_test, false) = true`,
      [accounts.map((account) => account.email)],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({
      mode: "cleanup",
      status: "ok",
      deletedSessions: sessions.rowCount ?? 0,
      deletedUsers: users.rowCount ?? 0,
      expectedNamespace: "capacity-test only",
    }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function runCapacityTestIdentityLifecycle(
  mode: CapacityProvisionMode,
): Promise<void> {
  const client = await pool.connect();
  try {
    if (mode === "verify") {
      await verifyCapacityAccounts(client);
      return;
    }
    if (mode === "provision") {
      await provisionCapacityAccounts(client);
      return;
    }
    await cleanupCapacityAccounts(client);
  } finally {
    client.release();
  }
}

const runningAsScript = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (runningAsScript) {
  const mode = parseCapacityProvisionMode(process.argv.slice(2));
  runCapacityTestIdentityLifecycle(mode)
    .then(() => { process.exitCode = 0; })
    .catch((error: unknown) => {
      // Never echo environment variables, a password, or individual test identities.
      console.error(error instanceof Error ? error.message : "Capacity test identity lifecycle failed.");
      process.exitCode = 1;
    });
}
