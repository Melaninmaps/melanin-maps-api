import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPROVED_MIGRATIONS,
  DEFAULT_MIGRATIONS_DIRECTORY,
  ISOLATED_STAGING_TARGET,
  IsolatedStagingMigrationRunnerError,
  assertAuthorizedSourceLineage,
  assertIsolatedStagingTarget,
  loadVerifiedApprovedMigrations,
  parseMigrationRunnerArguments,
  preflightApprovedMigrations,
  verifyApprovedMigrationSources,
  type ManagedObject,
  type MigrationInspector,
  type MigrationLedgerRow,
} from "../isolatedStagingKinfolkMigrationRunner";

class FixtureInspector implements MigrationInspector {
  readonly existingRelations = new Set<string>([
    "schema_migrations",
    "users",
    "kinfolk_temporary_stays",
    "travel_flights",
    "businesses",
  ]);
  readonly existingObjects = new Set<string>();
  history: readonly MigrationLedgerRow[] = [];
  readOnlyBegins = 0;
  readOnlyEnds = 0;

  async beginReadOnly(): Promise<void> {
    this.readOnlyBegins += 1;
  }

  async endReadOnly(): Promise<void> {
    this.readOnlyEnds += 1;
  }

  async relationExists(name: string): Promise<boolean> {
    return this.existingRelations.has(name);
  }

  async objectExists(object: ManagedObject): Promise<boolean> {
    return this.existingObjects.has(`${object.kind}:${object.relation ?? ""}:${object.name}`);
  }

  async migrationHistory(): Promise<readonly MigrationLedgerRow[]> {
    return this.history;
  }
}

const validEnvironment: NodeJS.ProcessEnv = {
  RAILWAY_PROJECT_ID: ISOLATED_STAGING_TARGET.projectId,
  RAILWAY_PROJECT_NAME: ISOLATED_STAGING_TARGET.projectName,
  RAILWAY_ENVIRONMENT_ID: ISOLATED_STAGING_TARGET.environmentId,
  RAILWAY_ENVIRONMENT_NAME: ISOLATED_STAGING_TARGET.environmentName,
  RAILWAY_SERVICE_ID: ISOLATED_STAGING_TARGET.serviceId,
  RAILWAY_SERVICE_NAME: ISOLATED_STAGING_TARGET.serviceName,
  DATABASE_URL: "postgresql://redacted",
  KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY: "configured",
  KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID: "configured-key-id",
};

function errorCode(error: unknown): string | undefined {
  return error instanceof IsolatedStagingMigrationRunnerError ? error.code : undefined;
}

describe("isolated staging Kinfolk migration runner", () => {
  it("keeps a fixed eleven-file, SHA-verified migration manifest", () => {
    const migrations = loadVerifiedApprovedMigrations();
    expect(migrations).toHaveLength(11);
    expect(migrations.map((migration) => migration.filename)).toEqual(
      APPROVED_MIGRATIONS.map((migration) => migration.filename),
    );
    expect(migrations.every((migration) => /^[a-f0-9]{64}$/.test(migration.sha256))).toBe(true);
    expect(migrations.every((migration) => migration.managedObjects.length > 0)).toBe(true);
  });

  it("rejects altered approved migration content before any inspection or execution", () => {
    const first = APPROVED_MIGRATIONS[0]!;
    expect(() => verifyApprovedMigrationSources((filename) => {
      const source = readFileSync(resolve(DEFAULT_MIGRATIONS_DIRECTORY, filename), "utf8");
      return filename === first.filename ? `${source}\n-- altered` : source;
    })).toThrowError(IsolatedStagingMigrationRunnerError);

    try {
      verifyApprovedMigrationSources((filename) => {
        const source = readFileSync(resolve(DEFAULT_MIGRATIONS_DIRECTORY, filename), "utf8");
        return filename === first.filename ? `${source}\n-- altered` : source;
      });
    } catch (error) {
      expect(errorCode(error)).toBe("migration_hash_mismatch");
    }
  });

  it("rejects every CLI input except dry-run or the single explicit apply switch", () => {
    expect(parseMigrationRunnerArguments([])).toBe("dry-run");
    expect(parseMigrationRunnerArguments(["--apply-authorized-isolated-staging-20261014"])).toBe("apply");
    expect(() => parseMigrationRunnerArguments(["--sql", "SELECT 1"])).toThrowError(IsolatedStagingMigrationRunnerError);
    expect(() => parseMigrationRunnerArguments(["--migration", "other.sql"])).toThrowError(IsolatedStagingMigrationRunnerError);
  });

  it("accepts Railway CLI's service identity without unavailable Git metadata", () => {
    assertIsolatedStagingTarget(validEnvironment);
  });

  it("rejects production, unknown, missing-key, and non-authorized source targets", () => {
    expect(() => assertIsolatedStagingTarget({
      ...validEnvironment,
      RAILWAY_ENVIRONMENT_NAME: "production",
    })).toThrowError(IsolatedStagingMigrationRunnerError);
    expect(() => assertIsolatedStagingTarget({
      ...validEnvironment,
      KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY: "",
    })).toThrowError(IsolatedStagingMigrationRunnerError);
    expect(() => assertAuthorizedSourceLineage({
      head: "a".repeat(40),
      hasAuthorizedBase: true,
      changedPaths: ["artifacts/api-server/src/routes/kinfolk.ts"],
    })).toThrowError(IsolatedStagingMigrationRunnerError);
  });

  it("performs dry-run preflight through read-only inspection only", async () => {
    const inspector = new FixtureInspector();
    const receipt = await preflightApprovedMigrations(
      inspector,
      loadVerifiedApprovedMigrations(),
      "dry-run",
    );
    expect(receipt.migrationCount).toBe(11);
    expect(receipt.migrations.every((migration) => migration.state === "pending")).toBe(true);
    expect(inspector.readOnlyBegins).toBe(1);
    expect(inspector.readOnlyEnds).toBe(1);
  });

  it("fails closed for missing prerequisites, existing conflicting triggers, and unrecorded partial state", async () => {
    const migrations = loadVerifiedApprovedMigrations();

    const missingPrerequisite = new FixtureInspector();
    missingPrerequisite.existingRelations.delete("users");
    await expect(preflightApprovedMigrations(missingPrerequisite, migrations, "dry-run"))
      .rejects.toMatchObject({ code: "missing_prerequisite" });

    const conflictingTrigger = new FixtureInspector();
    const journeyGuard = migrations[2]!.managedObjects.find((object) => object.kind === "trigger");
    conflictingTrigger.existingObjects.add(`${journeyGuard!.kind}:${journeyGuard!.relation ?? ""}:${journeyGuard!.name}`);
    await expect(preflightApprovedMigrations(conflictingTrigger, migrations, "dry-run"))
      .rejects.toMatchObject({ code: "conflicting_trigger" });

    const partialState = new FixtureInspector();
    const firstTable = migrations[0]!.managedObjects.find((object) => object.kind === "table");
    partialState.existingObjects.add(`${firstTable!.kind}:${firstTable!.relation ?? ""}:${firstTable!.name}`);
    await expect(preflightApprovedMigrations(partialState, migrations, "dry-run"))
      .rejects.toMatchObject({ code: "unexpected_partial_state" });
  });

  it("rejects altered history and recorded migrations whose postconditions no longer match", async () => {
    const migrations = loadVerifiedApprovedMigrations();
    const alteredHistory = new FixtureInspector();
    alteredHistory.history = [{ filename: migrations[0]!.filename, checksum: "0".repeat(64) }];
    await expect(preflightApprovedMigrations(alteredHistory, migrations, "dry-run"))
      .rejects.toMatchObject({ code: "migration_history_mismatch" });

    const missingRecordedObjects = new FixtureInspector();
    missingRecordedObjects.history = [{ filename: migrations[0]!.filename, checksum: migrations[0]!.sha256 }];
    await expect(preflightApprovedMigrations(missingRecordedObjects, migrations, "dry-run"))
      .rejects.toMatchObject({ code: "recorded_schema_mismatch" });
  });
});
