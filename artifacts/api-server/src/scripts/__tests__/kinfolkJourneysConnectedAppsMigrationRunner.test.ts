import { describe, expect, it } from "vitest";
import {
  APPROVED_JOURNEYS_CONNECTED_APPS_MIGRATIONS,
  FIXED_JOURNEYS_PSQL_ARGUMENTS,
  JOURNEYS_CONNECTED_APPS_STAGING_TARGET,
  JourneysConnectedAppsMigrationRunnerError,
  assertJourneysConnectedAppsStagingTarget,
  buildJourneysConnectedAppsApplyProgram,
  loadVerifiedJourneysConnectedAppsMigrations,
  parseJourneysMigrationRunnerArguments,
  preflightJourneysConnectedAppsMigrations,
  type CatalogInspector,
  type ManagedObject,
} from "../kinfolkJourneysConnectedAppsMigrationRunner";

function fixtureObjectKey(object: ManagedObject): string {
  return `${object.kind}:${object.relation ?? ""}:${object.name}`;
}

class FixtureInspector implements CatalogInspector {
  readonly relations = new Set(["schema_migrations", "users"]);
  readonly objects = new Set<string>();
  readonly mismatchedObjects = new Set<string>();
  history: Array<{ filename: string; checksum: string }> = [];
  begins = 0;
  ends = 0;

  async beginReadOnly(): Promise<void> {
    this.begins += 1;
  }

  async endReadOnly(): Promise<void> {
    this.ends += 1;
  }

  async relationExists(name: string): Promise<boolean> {
    return this.relations.has(name);
  }

  async objectMatches(object: ManagedObject): Promise<boolean> {
    const key = fixtureObjectKey(object);
    return this.objects.has(key) && !this.mismatchedObjects.has(key);
  }

  async migrationHistory(): Promise<
    readonly { filename: string; checksum: string }[]
  > {
    return this.history;
  }
}

const validEnvironment: NodeJS.ProcessEnv = {
  RAILWAY_PROJECT_ID: JOURNEYS_CONNECTED_APPS_STAGING_TARGET.projectId,
  RAILWAY_PROJECT_NAME: JOURNEYS_CONNECTED_APPS_STAGING_TARGET.projectName,
  RAILWAY_ENVIRONMENT_ID: JOURNEYS_CONNECTED_APPS_STAGING_TARGET.environmentId,
  RAILWAY_ENVIRONMENT_NAME:
    JOURNEYS_CONNECTED_APPS_STAGING_TARGET.environmentName,
  RAILWAY_SERVICE_ID: JOURNEYS_CONNECTED_APPS_STAGING_TARGET.serviceId,
  RAILWAY_SERVICE_NAME: JOURNEYS_CONNECTED_APPS_STAGING_TARGET.serviceName,
  DATABASE_URL: "postgresql://redacted",
  KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY: "configured",
  KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID: "journeys-v1",
  KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY: "configured",
};

describe("Journeys and Connected Apps migration runner", () => {
  it("pins exactly two source-only migrations with verified checksums and named catalog postconditions", () => {
    const migrations = loadVerifiedJourneysConnectedAppsMigrations();
    expect(migrations).toHaveLength(2);
    expect(migrations.map((migration) => migration.filename)).toEqual(
      APPROVED_JOURNEYS_CONNECTED_APPS_MIGRATIONS.map(
        (migration) => migration.filename,
      ),
    );
    expect(
      migrations.every((migration) => /^[a-f0-9]{64}$/.test(migration.sha256)),
    ).toBe(true);
    expect(
      migrations.every((migration) => migration.managedObjects.length > 0),
    ).toBe(true);
    const constraints = migrations.flatMap((migration) =>
      migration.managedObjects.filter((object) => object.kind === "constraint"),
    );
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints.every((constraint) => constraint.relation)).toBe(true);
    expect(
      constraints.every((constraint) => constraint.definitionTokens?.length),
    ).toBe(true);
  });

  it("accepts only dry-run or the one explicit apply authorization switch", () => {
    expect(parseJourneysMigrationRunnerArguments([])).toBe("dry-run");
    expect(
      parseJourneysMigrationRunnerArguments([
        "--apply-authorized-journeys-connected-apps-20261018",
      ]),
    ).toBe("apply");
    expect(() =>
      parseJourneysMigrationRunnerArguments(["--sql", "select 1"]),
    ).toThrow(JourneysConnectedAppsMigrationRunnerError);
  });

  it("fails closed for an incorrect target or incomplete encryption configuration", () => {
    expect(() =>
      assertJourneysConnectedAppsStagingTarget(validEnvironment),
    ).not.toThrow();
    expect(() =>
      assertJourneysConnectedAppsStagingTarget({
        ...validEnvironment,
        RAILWAY_PROJECT_ID: "different-project",
      }),
    ).toThrow(JourneysConnectedAppsMigrationRunnerError);
    expect(() =>
      assertJourneysConnectedAppsStagingTarget({
        ...validEnvironment,
        RAILWAY_ENVIRONMENT_NAME: "production",
      }),
    ).toThrow(JourneysConnectedAppsMigrationRunnerError);
    expect(() =>
      assertJourneysConnectedAppsStagingTarget({
        ...validEnvironment,
        RAILWAY_SERVICE_ID: "different-service",
      }),
    ).toThrow(JourneysConnectedAppsMigrationRunnerError);
    expect(() =>
      assertJourneysConnectedAppsStagingTarget({
        ...validEnvironment,
        KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY: "",
      }),
    ).toThrow(JourneysConnectedAppsMigrationRunnerError);
  });

  it("uses read-only catalog inspection and rejects missing prerequisites, partial state, and checksum drift", async () => {
    const migrations = loadVerifiedJourneysConnectedAppsMigrations();
    const clean = new FixtureInspector();
    const receipt = await preflightJourneysConnectedAppsMigrations(
      clean,
      migrations,
      "dry-run",
    );
    expect(
      receipt.migrations.every((migration) => migration.state === "pending"),
    ).toBe(true);
    expect(clean.begins).toBe(1);
    expect(clean.ends).toBe(1);

    const missingLedger = new FixtureInspector();
    missingLedger.relations.delete("schema_migrations");
    await expect(
      preflightJourneysConnectedAppsMigrations(
        missingLedger,
        migrations,
        "dry-run",
      ),
    ).rejects.toMatchObject({ code: "migration_ledger_missing" });

    const partial = new FixtureInspector();
    const firstObject = migrations[0]!.managedObjects[0]!;
    partial.objects.add(fixtureObjectKey(firstObject));
    await expect(
      preflightJourneysConnectedAppsMigrations(partial, migrations, "dry-run"),
    ).rejects.toMatchObject({ code: "unexpected_partial_state" });

    const recordedDrift = new FixtureInspector();
    recordedDrift.history = [
      { filename: migrations[0]!.filename, checksum: "0".repeat(64) },
    ];
    await expect(
      preflightJourneysConnectedAppsMigrations(
        recordedDrift,
        migrations,
        "dry-run",
      ),
    ).rejects.toMatchObject({ code: "migration_history_mismatch" });

    const recordedDefinitionDrift = new FixtureInspector();
    for (const migration of migrations) {
      recordedDefinitionDrift.history.push({
        filename: migration.filename,
        checksum: migration.sha256,
      });
      for (const object of migration.managedObjects) {
        recordedDefinitionDrift.objects.add(fixtureObjectKey(object));
      }
    }
    recordedDefinitionDrift.mismatchedObjects.add(
      fixtureObjectKey(
        migrations[0]!.managedObjects.find(
          (object) => object.kind === "constraint",
        )!,
      ),
    );
    await expect(
      preflightJourneysConnectedAppsMigrations(
        recordedDefinitionDrift,
        migrations,
        "dry-run",
      ),
    ).rejects.toMatchObject({ code: "recorded_schema_mismatch" });
  });

  it("serializes object-level catalog checks for a single PostgreSQL client", async () => {
    class SerialInspector extends FixtureInspector {
      activeObjectChecks = 0;
      maximumObjectChecks = 0;

      override async objectMatches(object: ManagedObject): Promise<boolean> {
        this.activeObjectChecks += 1;
        this.maximumObjectChecks = Math.max(
          this.maximumObjectChecks,
          this.activeObjectChecks,
        );
        await new Promise<void>((resolve) => queueMicrotask(resolve));
        this.activeObjectChecks -= 1;
        return super.objectMatches(object);
      }
    }
    const inspector = new SerialInspector();
    await preflightJourneysConnectedAppsMigrations(
      inspector,
      loadVerifiedJourneysConnectedAppsMigrations(),
      "dry-run",
    );
    expect(inspector.maximumObjectChecks).toBe(1);
  });

  it("emits only a fixed psql program with ON_ERROR_STOP and one shared transaction", () => {
    const program = buildJourneysConnectedAppsApplyProgram(
      loadVerifiedJourneysConnectedAppsMigrations(),
    );
    expect(program).toContain("\\set ON_ERROR_STOP on");
    expect(FIXED_JOURNEYS_PSQL_ARGUMENTS).toContain("ON_ERROR_STOP=1");
    expect(program.match(/^BEGIN;$/gm)).toHaveLength(1);
    expect(program.match(/^COMMIT;$/gm)).toHaveLength(1);
    expect(program).toContain("20261014_kinfolk_journeys_source_only.sql");
    expect(program).toContain(
      "20261014_kinfolk_connected_apps_source_only.sql",
    );
    expect(program).toContain("INSERT INTO schema_migrations");
    expect(program).not.toContain("--sql");
  });
});
