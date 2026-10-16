import type { PoolClient } from "pg";
import {
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
} from "./capacityTestIdentitySpec";

export type CapacityIdentitySummary = Readonly<{
  expectedAccounts: number;
  presentAccounts: number;
  loadTestAccounts: number;
  ordinaryAccountCollisions: number;
}>;

type CapacityAccountRow = Readonly<{
  email: string;
  isLoadTest: boolean;
}>;

const CAPACITY_IDENTITY_ADVISORY_LOCK = "mwm_capacity_test_identity_lifecycle_v1";

function accountEmails(): readonly string[] {
  return buildCapacityTestAccounts().map((account) => account.email);
}

function summaryFor(rows: readonly CapacityAccountRow[]): CapacityIdentitySummary {
  return {
    expectedAccounts: CAPACITY_TEST_USER_COUNT,
    presentAccounts: rows.length,
    loadTestAccounts: rows.filter((row) => row.isLoadTest).length,
    ordinaryAccountCollisions: rows.filter((row) => !row.isLoadTest).length,
  };
}

async function readCapacityAccounts(client: PoolClient): Promise<CapacityAccountRow[]> {
  const result = await client.query<CapacityAccountRow>(
    `SELECT email, COALESCE(is_load_test, false) AS "isLoadTest"
       FROM users
      WHERE email = ANY($1::text[])
      ORDER BY email ASC`,
    [accountEmails()],
  );
  return result.rows;
}

function assertNoOrdinaryAccountCollision(summary: CapacityIdentitySummary): void {
  if (summary.ordinaryAccountCollisions > 0) {
    throw new Error("Capacity-test namespace collides with an ordinary user; no change was applied.");
  }
}

function isCompleteCapacityCohort(summary: CapacityIdentitySummary): boolean {
  return summary.presentAccounts === CAPACITY_TEST_USER_COUNT
    && summary.loadTestAccounts === CAPACITY_TEST_USER_COUNT
    && summary.ordinaryAccountCollisions === 0;
}

async function lockCapacityIdentityLifecycle(client: PoolClient): Promise<void> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [CAPACITY_IDENTITY_ADVISORY_LOCK]);
}

export async function verifyCapacityTestIdentities(
  client: PoolClient,
): Promise<CapacityIdentitySummary> {
  const summary = summaryFor(await readCapacityAccounts(client));
  assertNoOrdinaryAccountCollision(summary);
  return summary;
}

export async function provisionFreshCapacityTestIdentities(
  client: PoolClient,
  passwordHash: string,
): Promise<CapacityIdentitySummary> {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try {
    await lockCapacityIdentityLifecycle(client);
    const before = await verifyCapacityTestIdentities(client);
    if (before.presentAccounts !== 0) {
      throw new Error(
        `Capacity-test provision requires an empty reserved namespace; found ${before.presentAccounts} existing account(s).`,
      );
    }

    const accounts = buildCapacityTestAccounts();
    const inserted = await client.query<{ email: string }>(
      `INSERT INTO users (
         email, first_name, last_name, username, home_city, password_hash,
         email_verified, approved, member_type, tester_status,
         tester_access_source, is_load_test, marketing_opt_out,
         created_at, updated_at
       )
       SELECT
         entry.email, 'Capacity', 'Test', entry.username, entry.home_city, $1,
         true, true, 'free', 'active', 'admin_invite', true, true,
         NOW(), NOW()
       FROM UNNEST($2::text[], $3::text[], $4::text[]) AS entry(email, username, home_city)
       RETURNING email`,
      [
        passwordHash,
        accounts.map((account) => account.email),
        accounts.map((account) => account.username),
        accounts.map((account) => account.homeCity),
      ],
    );
    if ((inserted.rowCount ?? 0) !== CAPACITY_TEST_USER_COUNT) {
      throw new Error("Capacity-test provision did not insert exactly 200 accounts; transaction rolled back.");
    }

    const after = await verifyCapacityTestIdentities(client);
    if (!isCompleteCapacityCohort(after)) {
      throw new Error("Capacity-test verification did not find exactly 200 isolated accounts; transaction rolled back.");
    }
    await client.query("COMMIT");
    return after;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function cleanupCapacityTestIdentities(
  client: PoolClient,
): Promise<Readonly<{ summaryBefore: CapacityIdentitySummary; deletedUsers: number; deletedSessions: number }>> {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try {
    await lockCapacityIdentityLifecycle(client);
    const before = await verifyCapacityTestIdentities(client);
    if (before.presentAccounts === 0) {
      await client.query("COMMIT");
      return { summaryBefore: before, deletedUsers: 0, deletedSessions: 0 };
    }
    if (!isCompleteCapacityCohort(before)) {
      throw new Error("Capacity-test cleanup requires a complete isolated cohort; transaction rolled back.");
    }

    const emails = accountEmails();
    const sessions = await client.query(
      `DELETE FROM sessions
        WHERE COALESCE(sess->'user'->>'email', '') = ANY($1::text[])
           OR COALESCE(sess->>'email', '') = ANY($1::text[])`,
      [emails],
    );
    const users = await client.query(
      `DELETE FROM users
        WHERE email = ANY($1::text[])
          AND COALESCE(is_load_test, false) = true`,
      [emails],
    );
    if ((users.rowCount ?? 0) !== CAPACITY_TEST_USER_COUNT) {
      throw new Error("Capacity-test cleanup did not remove exactly 200 isolated accounts; transaction rolled back.");
    }
    await client.query("COMMIT");
    return {
      summaryBefore: before,
      deletedUsers: users.rowCount ?? 0,
      deletedSessions: sessions.rowCount ?? 0,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
