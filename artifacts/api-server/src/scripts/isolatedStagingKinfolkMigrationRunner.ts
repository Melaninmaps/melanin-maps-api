import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

/**
 * One-off, source-controlled execution guard for the founder-authorized,
 * isolated Kinfolk staging migration inventory. This module deliberately has
 * no HTTP route, no generic SQL input, and no startup registration.
 */
export const AUTHORIZED_SOURCE_BASE_SHA = "49b7dfbbe454a8f7058be429da938d1c24ed2e0a";

export const ISOLATED_STAGING_TARGET = {
  projectId: "37ed0a9d-a280-43d5-b6ca-885f237b84ea",
  projectName: "mwm-kinfolk-memory-stage",
  environmentId: "62bca1b8-7187-4e16-9c9b-f8885ec7de50",
  environmentName: "staging",
  serviceId: "7c02d801-6273-4e77-aea3-1db8bd86be18",
  serviceName: "kinfolk-memory-api-staging",
} as const;

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MIGRATIONS_DIRECTORY = resolve(SCRIPT_DIRECTORY, "../../migrations");
export const DEFAULT_REPOSITORY_DIRECTORY = resolve(SCRIPT_DIRECTORY, "../../../..");

const ALLOWED_REPAIR_PATHS = new Set([
  "artifacts/api-server/src/scripts/isolatedStagingKinfolkMigrationRunner.ts",
  "artifacts/api-server/src/scripts/__tests__/isolatedStagingKinfolkMigrationRunner.test.ts",
  "docs/runbooks/isolated-staging-kinfolk-migration-runner.md",
]);

export type MigrationMode = "dry-run" | "apply";

type ObjectKind = "table" | "column" | "constraint" | "index" | "function" | "trigger";

export interface ManagedObject {
  kind: ObjectKind;
  name: string;
  relation?: string;
}

export interface ApprovedMigration {
  filename: string;
  sha256: string;
  prerequisites: readonly string[];
}

export interface VerifiedMigration extends ApprovedMigration {
  source: string;
  managedObjects: readonly ManagedObject[];
}

export interface MigrationLedgerRow {
  filename: string;
  checksum: string;
}

export interface SqlClient {
  query<T extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
}

export interface MigrationInspector {
  beginReadOnly(): Promise<void>;
  endReadOnly(): Promise<void>;
  relationExists(name: string): Promise<boolean>;
  objectExists(object: ManagedObject): Promise<boolean>;
  migrationHistory(filenames: readonly string[]): Promise<readonly MigrationLedgerRow[]>;
}

export class IsolatedStagingMigrationRunnerError extends Error {
  constructor(
    public readonly code:
      | "invalid_arguments"
      | "target_mismatch"
      | "database_url_missing"
      | "encryption_configuration_missing"
      | "source_lineage_mismatch"
      | "migration_hash_mismatch"
      | "migration_ledger_missing"
      | "missing_prerequisite"
      | "conflicting_trigger"
      | "unexpected_partial_state"
      | "migration_history_mismatch"
      | "recorded_schema_mismatch"
      | "database_inspection_failed"
      | "migration_apply_failed",
  ) {
    super(code);
    this.name = "IsolatedStagingMigrationRunnerError";
  }
}

/**
 * This is the entire runnable inventory. The runner accepts no user-provided
 * filename, checksum, SQL text, or target identifier.
 */
export const APPROVED_MIGRATIONS: readonly ApprovedMigration[] = [
  {
    filename: "20261014_cultural_passport_moments.sql",
    sha256: "fc488fe54be8199798336b1595859ca4fc8158ba4413e692893a9f81d57a1f08",
    prerequisites: ["users"],
  },
  {
    filename: "20261014_cultural_journey_entries.sql",
    sha256: "a7a10174cb3f3d2c9db3feae11a65b03db57944180d97285185e7b4ce61ffe8f",
    prerequisites: [],
  },
  {
    filename: "20261014_cultural_journey_reflection_encryption.approval-required.sql",
    sha256: "ea7543c9736f73f64ad5e03fcf79bd19f33cd187aee5b9cc70a16f19f79e5b6c",
    prerequisites: ["cultural_journey_entries"],
  },
  {
    filename: "20261014_kinfolk_behavioral_evidence_source_only.sql",
    sha256: "23941a3a027a70ad49e18c31c4163bf48ccc0e1813c38300f717ac6a4ebca6d7",
    prerequisites: ["users"],
  },
  {
    filename: "20261014_kinfolk_curiosity_lists.approval-required.sql",
    sha256: "3839a1a80358fcd9eec4fb4d76822d05dd392066356f4aa6a1d705e1c2d593fb",
    prerequisites: ["users"],
  },
  {
    filename: "20261014_kinfolk_private_availability_blocks.approval-required.sql",
    sha256: "0fe2534c8e65f0fbbe01a8a219a6d6fc12b9978a77b2aa58ecd0e1bf38753cb3",
    prerequisites: ["users"],
  },
  {
    filename: "20261014_kinfolk_trips.approval-required.sql",
    sha256: "446feeb581f293ccc1d188b6b793619543faa86864fb5ae5abebfb28b5ecdb79",
    prerequisites: ["users"],
  },
  {
    filename: "20261014_kinfolk_trip_itinerary_entries.approval-required.sql",
    sha256: "a3507f14e636142c8fe47a411232fbd6fe210c393852b8cecaba5fb44aeb26f0",
    prerequisites: ["users", "kinfolk_trips"],
  },
  {
    filename: "20261014_kinfolk_trip_temporary_stays.approval-required.sql",
    sha256: "50094966a2e63f6f5c120adc560789c80152b54af0222c433dd4cc42bd676e22",
    prerequisites: ["users", "kinfolk_trips", "kinfolk_temporary_stays"],
  },
  {
    filename: "20261014_kinfolk_trip_flights_encryption.approval-required.sql",
    sha256: "86c6bebe65d7548410fa1efa493acef8adeda0b9e507765950e7c385408b0f7c",
    prerequisites: ["travel_flights", "kinfolk_trips"],
  },
  {
    filename: "20261014_business_cultural_teachings.approval-required.sql",
    sha256: "e82970087a659e1a3d06040b6f565f7c638a1539ee99a3183e5c3eaf3807e47a",
    prerequisites: ["users", "businesses"],
  },
] as const;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function objectKey(object: ManagedObject): string {
  return `${object.kind}:${object.relation ?? ""}:${object.name}`;
}

function uniqueObjects(objects: readonly ManagedObject[]): readonly ManagedObject[] {
  const seen = new Set<string>();
  return objects.filter((object) => {
    const key = objectKey(object);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Derive only named postconditions from a source file after its complete file
 * hash is fixed. This detects partial application without accepting input from
 * a caller or attempting to interpret arbitrary SQL.
 */
export function managedObjectsForMigration(source: string): readonly ManagedObject[] {
  const objects: ManagedObject[] = [];
  const tablePattern = /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi;
  const indexPattern = /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi;
  const constraintPattern = /\bCONSTRAINT\s+([a-z_][a-z0-9_]*)/gi;
  const functionPattern = /\bCREATE\s+FUNCTION\s+([a-z_][a-z0-9_]*)\s*\(/gi;
  const triggerPattern = /\bCREATE\s+TRIGGER\s+([a-z_][a-z0-9_]*)[\s\S]{0,400}?\bON\s+([a-z_][a-z0-9_]*)/gi;
  const columnPattern = /\bALTER\s+TABLE\s+([a-z_][a-z0-9_]*)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi;

  for (const match of source.matchAll(tablePattern)) {
    objects.push({ kind: "table", name: match[1]!.toLowerCase() });
  }
  for (const match of source.matchAll(indexPattern)) {
    objects.push({ kind: "index", name: match[1]!.toLowerCase() });
  }
  for (const match of source.matchAll(constraintPattern)) {
    objects.push({ kind: "constraint", name: match[1]!.toLowerCase() });
  }
  for (const match of source.matchAll(functionPattern)) {
    objects.push({ kind: "function", name: match[1]!.toLowerCase() });
  }
  for (const match of source.matchAll(triggerPattern)) {
    objects.push({
      kind: "trigger",
      name: match[1]!.toLowerCase(),
      relation: match[2]!.toLowerCase(),
    });
  }
  for (const match of source.matchAll(columnPattern)) {
    objects.push({
      kind: "column",
      name: match[2]!.toLowerCase(),
      relation: match[1]!.toLowerCase(),
    });
  }

  return uniqueObjects(objects);
}

export function verifyApprovedMigrationSources(
  readSource: (filename: string) => string,
): readonly VerifiedMigration[] {
  return APPROVED_MIGRATIONS.map((migration) => {
    const source = readSource(migration.filename);
    if (sha256(source) !== migration.sha256) {
      throw new IsolatedStagingMigrationRunnerError("migration_hash_mismatch");
    }
    return {
      ...migration,
      source,
      managedObjects: managedObjectsForMigration(source),
    };
  });
}

export function loadVerifiedApprovedMigrations(
  migrationsDirectory = DEFAULT_MIGRATIONS_DIRECTORY,
): readonly VerifiedMigration[] {
  return verifyApprovedMigrationSources((filename) =>
    readFileSync(resolve(migrationsDirectory, filename), "utf8"),
  );
}

export function parseMigrationRunnerArguments(args: readonly string[]): MigrationMode {
  if (args.length === 0) return "dry-run";
  if (args.length === 1 && args[0] === "--apply-authorized-isolated-staging-20261014") {
    return "apply";
  }
  throw new IsolatedStagingMigrationRunnerError("invalid_arguments");
}

export function assertIsolatedStagingTarget(env: NodeJS.ProcessEnv): void {
  // `railway run` injects selected project/environment/service identity, but
  // not its Git-source metadata. Exact source provenance remains separately
  // fail-closed through assertAuthorizedSourceLineage and the fixed manifest.
  const expected: ReadonlyArray<readonly [string, string]> = [
    ["RAILWAY_PROJECT_ID", ISOLATED_STAGING_TARGET.projectId],
    ["RAILWAY_PROJECT_NAME", ISOLATED_STAGING_TARGET.projectName],
    ["RAILWAY_ENVIRONMENT_ID", ISOLATED_STAGING_TARGET.environmentId],
    ["RAILWAY_ENVIRONMENT_NAME", ISOLATED_STAGING_TARGET.environmentName],
    ["RAILWAY_SERVICE_ID", ISOLATED_STAGING_TARGET.serviceId],
    ["RAILWAY_SERVICE_NAME", ISOLATED_STAGING_TARGET.serviceName],
  ];

  if (expected.some(([key, value]) => env[key] !== value)) {
    throw new IsolatedStagingMigrationRunnerError("target_mismatch");
  }
  if (!env.DATABASE_URL?.trim()) {
    throw new IsolatedStagingMigrationRunnerError("database_url_missing");
  }
  if (!env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY?.trim()
    || !env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID?.trim()) {
    throw new IsolatedStagingMigrationRunnerError("encryption_configuration_missing");
  }
}

export interface SourceLineageSnapshot {
  head: string;
  hasAuthorizedBase: boolean;
  changedPaths: readonly string[];
}

export function assertAuthorizedSourceLineage(snapshot: SourceLineageSnapshot): void {
  if (!/^[0-9a-f]{40}$/i.test(snapshot.head)
    || !snapshot.hasAuthorizedBase
    || snapshot.changedPaths.some((path) => !ALLOWED_REPAIR_PATHS.has(path))) {
    throw new IsolatedStagingMigrationRunnerError("source_lineage_mismatch");
  }
}

export function inspectAuthorizedSourceLineage(
  repositoryDirectory = DEFAULT_REPOSITORY_DIRECTORY,
): SourceLineageSnapshot {
  try {
    const runGit = (args: readonly string[]) => execFileSync("git", args, {
      cwd: repositoryDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const head = runGit(["rev-parse", "HEAD"]);
    const mergeBase = runGit(["merge-base", AUTHORIZED_SOURCE_BASE_SHA, "HEAD"]);
    const changedPaths = runGit(["diff", "--name-only", `${AUTHORIZED_SOURCE_BASE_SHA}..HEAD`])
      .split("\n")
      .filter(Boolean);
    return { head, hasAuthorizedBase: mergeBase === AUTHORIZED_SOURCE_BASE_SHA, changedPaths };
  } catch {
    throw new IsolatedStagingMigrationRunnerError("source_lineage_mismatch");
  }
}

export class PostgresMigrationInspector implements MigrationInspector {
  constructor(private readonly client: SqlClient) {}

  async beginReadOnly(): Promise<void> {
    await this.client.query("BEGIN READ ONLY");
  }

  async endReadOnly(): Promise<void> {
    await this.client.query("ROLLBACK");
  }

  async relationExists(name: string): Promise<boolean> {
    const result = await this.client.query<{ exists: boolean }>(
      "SELECT to_regclass($1) IS NOT NULL AS exists",
      [`public.${name}`],
    );
    return result.rows[0]?.exists === true;
  }

  async objectExists(object: ManagedObject): Promise<boolean> {
    let result: { rows: Array<{ exists: boolean }> };
    switch (object.kind) {
      case "table":
        return this.relationExists(object.name);
      case "column":
        result = await this.client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM pg_attribute a
             JOIN pg_class c ON c.oid = a.attrelid
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = $1 AND a.attname = $2
               AND a.attnum > 0 AND NOT a.attisdropped
           ) AS exists`,
          [object.relation!, object.name],
        );
        break;
      case "constraint":
        result = await this.client.query<{ exists: boolean }>(
          "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = $1) AS exists",
          [object.name],
        );
        break;
      case "index":
        result = await this.client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM pg_class i
             JOIN pg_namespace n ON n.oid = i.relnamespace
             WHERE n.nspname = 'public' AND i.relkind = 'i' AND i.relname = $1
           ) AS exists`,
          [object.name],
        );
        break;
      case "function":
        result = await this.client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = $1
           ) AS exists`,
          [object.name],
        );
        break;
      case "trigger":
        result = await this.client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM pg_trigger t
             JOIN pg_class c ON c.oid = t.tgrelid
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = $1 AND t.tgname = $2
               AND NOT t.tgisinternal
           ) AS exists`,
          [object.relation!, object.name],
        );
        break;
    }
    return result.rows[0]?.exists === true;
  }

  async migrationHistory(filenames: readonly string[]): Promise<readonly MigrationLedgerRow[]> {
    const result = await this.client.query<MigrationLedgerRow>(
      "SELECT filename, checksum FROM schema_migrations WHERE filename = ANY($1::text[]) ORDER BY filename",
      [filenames],
    );
    return result.rows;
  }
}

function tableCreatedByPriorMigration(
  migrations: readonly VerifiedMigration[],
  position: number,
  relation: string,
): boolean {
  return migrations.slice(0, position).some((migration) =>
    migration.managedObjects.some((object) => object.kind === "table" && object.name === relation),
  );
}

async function assertBasePrerequisites(
  inspector: MigrationInspector,
  migrations: readonly VerifiedMigration[],
): Promise<void> {
  const required = new Set<string>(["schema_migrations"]);
  for (const [position, migration] of migrations.entries()) {
    for (const relation of migration.prerequisites) {
      if (!tableCreatedByPriorMigration(migrations, position, relation)) required.add(relation);
    }
  }
  for (const relation of required) {
    if (!await inspector.relationExists(relation)) {
      throw new IsolatedStagingMigrationRunnerError(
        relation === "schema_migrations" ? "migration_ledger_missing" : "missing_prerequisite",
      );
    }
  }
}

export interface PreflightMigrationReceipt {
  filename: string;
  sha256: string;
  state: "pending" | "recorded";
}

export interface PreflightReceipt {
  mode: MigrationMode;
  sourceBaseSha: string;
  migrationCount: number;
  migrations: readonly PreflightMigrationReceipt[];
}

async function managedObjectStates(
  inspector: MigrationInspector,
  migration: VerifiedMigration,
): Promise<readonly boolean[]> {
  return Promise.all(migration.managedObjects.map((object) => inspector.objectExists(object)));
}

async function allManagedObjectsExist(
  inspector: MigrationInspector,
  migration: VerifiedMigration,
): Promise<boolean> {
  return (await managedObjectStates(inspector, migration)).every(Boolean);
}

function conflictingTrigger(migration: VerifiedMigration): ManagedObject | undefined {
  return migration.managedObjects.find((object) => object.kind === "trigger");
}

/**
 * Reads only pg_catalog and the migration ledger. A source-hash match plus a
 * complete ledger/postcondition match is required to skip any prior migration.
 * A partial or unrecorded state always fails closed.
 */
export async function preflightApprovedMigrations(
  inspector: MigrationInspector,
  migrations: readonly VerifiedMigration[],
  mode: MigrationMode,
): Promise<PreflightReceipt> {
  await inspector.beginReadOnly();
  try {
    await assertBasePrerequisites(inspector, migrations);
    const history = await inspector.migrationHistory(migrations.map((migration) => migration.filename));
    const recorded = new Map(history.map((row) => [row.filename, row]));
    let pendingSeen = false;
    const receipts: PreflightMigrationReceipt[] = [];

    for (const migration of migrations) {
      const row = recorded.get(migration.filename);
      const trigger = conflictingTrigger(migration);
      const objectStates = await managedObjectStates(inspector, migration);
      const postconditionsExist = objectStates.every(Boolean);
      const anyPostconditionExists = objectStates.some(Boolean);

      if (row) {
        if (row.checksum !== migration.sha256) {
          throw new IsolatedStagingMigrationRunnerError("migration_history_mismatch");
        }
        if (!postconditionsExist) {
          throw new IsolatedStagingMigrationRunnerError("recorded_schema_mismatch");
        }
        if (pendingSeen) {
          throw new IsolatedStagingMigrationRunnerError("migration_history_mismatch");
        }
        receipts.push({ filename: migration.filename, sha256: migration.sha256, state: "recorded" });
        continue;
      }

      pendingSeen = true;
      if (trigger && await inspector.objectExists(trigger)) {
        throw new IsolatedStagingMigrationRunnerError("conflicting_trigger");
      }
      if (anyPostconditionExists) {
        throw new IsolatedStagingMigrationRunnerError("unexpected_partial_state");
      }
      receipts.push({ filename: migration.filename, sha256: migration.sha256, state: "pending" });
    }

    return {
      mode,
      sourceBaseSha: AUTHORIZED_SOURCE_BASE_SHA,
      migrationCount: migrations.length,
      migrations: receipts,
    };
  } catch (error) {
    if (error instanceof IsolatedStagingMigrationRunnerError) throw error;
    throw new IsolatedStagingMigrationRunnerError("database_inspection_failed");
  } finally {
    await inspector.endReadOnly().catch(() => undefined);
  }
}

function stripOuterTransaction(source: string): string {
  const lines = source.split("\n");
  const materialIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0 && !line.startsWith("--"));
  const first = materialIndexes[0];
  const last = materialIndexes.at(-1);
  if (first?.line.toUpperCase() === "BEGIN;" && last?.line.toUpperCase() === "COMMIT;") {
    lines[first.index] = "";
    lines[last.index] = "";
  }
  return lines.join("\n");
}

async function assertExecutionPrerequisites(
  inspector: MigrationInspector,
  migration: VerifiedMigration,
): Promise<void> {
  for (const relation of migration.prerequisites) {
    if (!await inspector.relationExists(relation)) {
      throw new IsolatedStagingMigrationRunnerError("missing_prerequisite");
    }
  }
  const trigger = conflictingTrigger(migration);
  if (trigger && await inspector.objectExists(trigger)) {
    throw new IsolatedStagingMigrationRunnerError("conflicting_trigger");
  }
  if ((await managedObjectStates(inspector, migration)).some(Boolean)) {
    throw new IsolatedStagingMigrationRunnerError("unexpected_partial_state");
  }
}

async function applyMigrationAtomically(
  client: SqlClient,
  migration: VerifiedMigration,
): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(stripOuterTransaction(migration.source));
    await client.query(
      "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)",
      [migration.filename, migration.sha256],
    );
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    throw new IsolatedStagingMigrationRunnerError("migration_apply_failed");
  }
}

/**
 * Applies only the preflight-approved pending entries. Recorded entries are
 * never rerun. Every write is wrapped with its matching ledger receipt.
 */
export async function applyApprovedMigrations(
  client: SqlClient,
  inspector: MigrationInspector,
  migrations: readonly VerifiedMigration[],
  preflight: PreflightReceipt,
): Promise<readonly PreflightMigrationReceipt[]> {
  const receipts: PreflightMigrationReceipt[] = [];
  for (const receipt of preflight.migrations) {
    const migration = migrations.find((candidate) => candidate.filename === receipt.filename);
    if (!migration) throw new IsolatedStagingMigrationRunnerError("migration_history_mismatch");
    if (receipt.state === "recorded") {
      receipts.push(receipt);
      continue;
    }
    await assertExecutionPrerequisites(inspector, migration);
    await applyMigrationAtomically(client, migration);
    if (!await allManagedObjectsExist(inspector, migration)) {
      throw new IsolatedStagingMigrationRunnerError("recorded_schema_mismatch");
    }
    receipts.push({ ...receipt, state: "recorded" });
  }
  return receipts;
}

export async function executeIsolatedStagingMigrationRunner(
  env: NodeJS.ProcessEnv,
  mode: MigrationMode,
  dependencies: {
    migrations?: readonly VerifiedMigration[];
    client?: SqlClient & { end?: () => Promise<void> };
  } = {},
): Promise<PreflightReceipt> {
  assertIsolatedStagingTarget(env);
  const migrations = dependencies.migrations ?? loadVerifiedApprovedMigrations();
  const client = dependencies.client ?? new Client({ connectionString: env.DATABASE_URL });
  const mustEndClient = !dependencies.client;
  try {
    if ("connect" in client && typeof (client as Client).connect === "function") {
      await (client as Client).connect();
    }
    const inspector = new PostgresMigrationInspector(client);
    const preflight = await preflightApprovedMigrations(inspector, migrations, mode);
    if (mode === "apply") {
      await applyApprovedMigrations(client, inspector, migrations, preflight);
    }
    return preflight;
  } finally {
    if (mustEndClient && client.end) await client.end().catch(() => undefined);
  }
}

function sanitizedReceipt(receipt: PreflightReceipt): string {
  return JSON.stringify({
    target: "isolated_staging_only",
    mode: receipt.mode,
    sourceBaseSha: receipt.sourceBaseSha,
    migrationCount: receipt.migrationCount,
    migrations: receipt.migrations.map((migration) => ({
      filename: migration.filename,
      sha256: migration.sha256,
      state: migration.state,
    })),
  });
}

async function main(): Promise<void> {
  const mode = parseMigrationRunnerArguments(process.argv.slice(2));
  assertAuthorizedSourceLineage(inspectAuthorizedSourceLineage());
  const receipt = await executeIsolatedStagingMigrationRunner(process.env, mode);
  console.log(sanitizedReceipt(receipt));
}

const invokedAsScript = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
  main().catch((error: unknown) => {
    const code = error instanceof IsolatedStagingMigrationRunnerError
      ? error.code
      : "database_inspection_failed";
    console.error(JSON.stringify({ target: "isolated_staging_only", status: "stopped", code }));
    process.exitCode = 1;
  });
}
