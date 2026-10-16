import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { pool } from "@workspace/db";
import {
  CAPACITY_TEST_CLEANUP_GUARD,
  CAPACITY_TEST_PROVISION_GUARD,
  CAPACITY_TEST_USER_COUNT,
  buildCapacityTestAccounts,
  capacityTestEmail,
  isCapacityTestEmail,
} from "../capacity/capacityTestIdentitySpec";
import {
  cleanupCapacityTestIdentities,
  provisionFreshCapacityTestIdentities,
  verifyCapacityTestIdentities,
} from "../capacity/capacityTestIdentityLifecycle";

/**
 * Deliberately manual lifecycle utility for a bounded Grafana Cloud capacity test.
 *
 * It never runs from startup migrations and cannot execute a write without the
 * explicit environment guard. The namespace is purpose-specific and separate
 * from existing `mwm-loadtest-*` and `manus.tester.*` accounts.
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

export async function runCapacityTestIdentityLifecycle(
  mode: CapacityProvisionMode,
): Promise<void> {
  const client = await pool.connect();
  try {
    if (mode === "verify") {
      const summary = await verifyCapacityTestIdentities(client);
      if (
        summary.presentAccounts !== CAPACITY_TEST_USER_COUNT
        || summary.loadTestAccounts !== CAPACITY_TEST_USER_COUNT
      ) {
        throw new Error(`Capacity account verification failed: ${JSON.stringify(summary)}.`);
      }
      console.log(JSON.stringify({ mode, status: "ok", ...summary }));
      return;
    }

    if (mode === "provision") {
      requireExactEnvironment("CAPACITY_TEST_IDENTITY_WRITE_APPROVED", CAPACITY_TEST_PROVISION_GUARD);
      const password = process.env.CAPACITY_TEST_PASSWORD;
      if (!password || password.length < 16) {
        throw new Error("CAPACITY_TEST_PASSWORD must be a new secret of at least 16 characters.");
      }
      const summary = await provisionFreshCapacityTestIdentities(
        client,
        await bcrypt.hash(password, 12),
      );
      console.log(JSON.stringify({ mode, status: "ok", ...summary, credentialsLogged: false }));
      return;
    }

    requireExactEnvironment("CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED", CAPACITY_TEST_CLEANUP_GUARD);
    const result = await cleanupCapacityTestIdentities(client);
    console.log(JSON.stringify({
      mode,
      status: "ok",
      ...result.summaryBefore,
      deletedUsers: result.deletedUsers,
      deletedSessions: result.deletedSessions,
      credentialsLogged: false,
    }));
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
