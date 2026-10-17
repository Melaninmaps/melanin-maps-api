import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import {
  acquireIsolatedStagingAdminBootstrap,
  ensureIsolatedStagingAdminBootstrapGuard,
  isIsolatedStagingAdminBootstrapEnabled,
  isolatedStagingAdminBootstrapEligibility,
  mayBootstrapIsolatedStagingAdmin,
} from "../isolatedStagingAdminBootstrap";

const enabledEnvironment = {
  RAILWAY_ENVIRONMENT_NAME: "staging",
  KINFOLK_MEMORY_STAGING_ISOLATION: "true",
  KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "true",
  ADMIN_EMAILS: "founder@example.test, another-admin@example.test",
};

function guardClient(conflictRows: Array<{ email: string }> = []) {
  const query = vi
    .fn()
    .mockResolvedValue({ rows: [] })
    .mockImplementation(async (statement: string) => {
      if (statement.includes("SELECT email\n      FROM mwm_isolated")) {
        return { rows: conflictRows };
      }
      return { rows: [] };
    });
  const release = vi.fn();
  return { client: { query, release }, query, release };
}

function poolWithRows(rows: Array<{ exists: boolean }>) {
  const guard = guardClient();
  const query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [rows[0] ?? { exists: false }] })
    .mockResolvedValueOnce({ rows: [rows[1] ?? { exists: false }] })
    .mockResolvedValue({ rows: [] });
  const release = vi.fn();
  return {
    pool: {
      connect: vi
        .fn()
        .mockResolvedValueOnce(guard.client)
        .mockResolvedValueOnce({ query, release }),
    } as unknown as Pick<Pool, "connect">,
    guard,
    query,
    release,
  };
}

describe("isolated staging administrator bootstrap", () => {
  it("allows only an allowlisted email when every isolated staging gate is exact", () => {
    expect(
      mayBootstrapIsolatedStagingAdmin(
        " Founder@example.test ",
        enabledEnvironment,
      ),
    ).toBe(true);
    expect(
      mayBootstrapIsolatedStagingAdmin(
        "other@example.test",
        enabledEnvironment,
      ),
    ).toBe(false);
  });

  it("fails closed outside the exact isolated staging bootstrap configuration", () => {
    expect(
      mayBootstrapIsolatedStagingAdmin("founder@example.test", {
        ...enabledEnvironment,
        RAILWAY_ENVIRONMENT_NAME: "production",
      }),
    ).toBe(false);
    expect(
      mayBootstrapIsolatedStagingAdmin("founder@example.test", {
        ...enabledEnvironment,
        KINFOLK_MEMORY_STAGING_ISOLATION: "false",
      }),
    ).toBe(false);
    expect(
      mayBootstrapIsolatedStagingAdmin("founder@example.test", {
        ...enabledEnvironment,
        KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "false",
      }),
    ).toBe(false);
    expect(
      mayBootstrapIsolatedStagingAdmin(undefined, enabledEnvironment),
    ).toBe(false);
  });

  it("reports only a non-secret reason when an exact bootstrap gate is not eligible", () => {
    expect(
      isolatedStagingAdminBootstrapEligibility(undefined, enabledEnvironment),
    ).toBe("missing_email");
    expect(
      isolatedStagingAdminBootstrapEligibility("founder@example.test", {
        ...enabledEnvironment,
        RAILWAY_ENVIRONMENT_NAME: "production",
      }),
    ).toBe("environment_not_staging");
    expect(
      isolatedStagingAdminBootstrapEligibility("founder@example.test", {
        ...enabledEnvironment,
        KINFOLK_MEMORY_STAGING_ISOLATION: "false",
      }),
    ).toBe("staging_isolation_disabled");
    expect(
      isolatedStagingAdminBootstrapEligibility("founder@example.test", {
        ...enabledEnvironment,
        KINFOLK_STAGING_ADMIN_BOOTSTRAP_ENABLED: "false",
      }),
    ).toBe("bootstrap_disabled");
    expect(
      isolatedStagingAdminBootstrapEligibility(
        "other@example.test",
        enabledEnvironment,
      ),
    ).toBe("email_not_allowlisted");
  });

  it("installs the tester exclusion in one transaction before the first bootstrap claim", async () => {
    const { client, query, release } = guardClient();
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pick<Pool, "connect">;

    await expect(
      ensureIsolatedStagingAdminBootstrapGuard(pool, enabledEnvironment),
    ).resolves.toBe(true);

    const calls = query.mock.calls.map(([statement]) => String(statement));
    expect(calls[0]).toBe("BEGIN");
    expect(calls).toContain(
      "LOCK TABLE users, pending_tester_emails IN SHARE ROW EXCLUSIVE MODE",
    );
    expect(
      calls.some((sql) =>
        sql.includes("mwm_isolated_staging_admin_bootstrap_emails"),
      ),
    ).toBe(true);
    expect(
      calls.some((sql) =>
        sql.includes("NEW.role = 'tester' OR NEW.tester_status = 'active'"),
      ),
    ).toBe(true);
    expect(
      calls.some((sql) =>
        sql.includes(
          "mwm_reject_isolated_staging_admin_tester_pending_trigger",
        ),
      ),
    ).toBe(true);
    expect(calls.at(-1)).toBe("COMMIT");
    expect(release).toHaveBeenCalledOnce();

    const outsideQuery = vi.fn();
    const outsidePool = {
      connect: vi
        .fn()
        .mockResolvedValue({ query: outsideQuery, release: vi.fn() }),
    } as unknown as Pick<Pool, "connect">;
    await expect(
      ensureIsolatedStagingAdminBootstrapGuard(outsidePool, {
        ...enabledEnvironment,
        RAILWAY_ENVIRONMENT_NAME: "production",
      }),
    ).resolves.toBe(false);
    expect(outsideQuery).not.toHaveBeenCalled();
    expect(isIsolatedStagingAdminBootstrapEnabled(enabledEnvironment)).toBe(
      true,
    );
  });

  it("rolls back and rejects a pre-existing pending or active tester conflict", async () => {
    const { client, query, release } = guardClient([
      { email: "founder@example.test" },
    ]);
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pick<Pool, "connect">;

    await expect(
      ensureIsolatedStagingAdminBootstrapGuard(pool, enabledEnvironment),
    ).rejects.toThrow("conflicting tester access");
    expect(query.mock.calls.map(([statement]) => String(statement))).toContain(
      "ROLLBACK",
    );
    expect(release).toHaveBeenCalledOnce();
  });

  it("holds a serialized claim until the staging administrator account has been created", async () => {
    const { pool, query, release } = poolWithRows([
      { exists: false },
      { exists: false },
    ]);

    const claim = await acquireIsolatedStagingAdminBootstrap(
      "founder@example.test",
      pool,
      enabledEnvironment,
    );

    expect(claim.status).toBe("granted");
    if (claim.status !== "granted") throw new Error("expected bootstrap claim");
    expect(query.mock.calls[0]?.[0]).toContain("pg_advisory_lock");
    await claim.release();
    expect(query.mock.calls.at(-1)?.[0]).toContain("pg_advisory_unlock");
    expect(release).toHaveBeenCalledOnce();
  });

  it("rejects a previously claimed slot and any pending tester entitlement", async () => {
    const claimed = poolWithRows([{ exists: true }]);
    await expect(
      acquireIsolatedStagingAdminBootstrap(
        "founder@example.test",
        claimed.pool,
        enabledEnvironment,
      ),
    ).resolves.toEqual({ status: "already_claimed" });
    expect(claimed.release).toHaveBeenCalledOnce();

    const testerConflict = poolWithRows([{ exists: false }, { exists: true }]);
    await expect(
      acquireIsolatedStagingAdminBootstrap(
        "founder@example.test",
        testerConflict.pool,
        enabledEnvironment,
      ),
    ).resolves.toEqual({ status: "tester_conflict" });
    expect(testerConflict.release).toHaveBeenCalledOnce();
  });
});
