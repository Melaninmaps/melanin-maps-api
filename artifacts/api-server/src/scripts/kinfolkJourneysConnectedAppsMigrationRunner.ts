import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

/**
 * Source-controlled runner for exactly the two additive Journeys migrations.
 * It has no HTTP route or startup registration. Dry-run is the default; any
 * staging execution remains subject to a separate founder authorization.
 */
export const JOURNEYS_CONNECTED_APPS_SOURCE_BASE =
  "f818056c93840794ad08c9bb90b68f2500635a25";

export const JOURNEYS_CONNECTED_APPS_STAGING_TARGET = {
  projectId: "35f16a68-36ed-45d7-8b12-cd783d77aedd",
  projectName: "mwm-owner-staging-20261014",
  environmentId: "cdb45132-cd72-4762-8434-d79b3d6441df",
  environmentName: "staging",
  serviceId: "b1add130-798a-49f5-957d-369aee8c3d79",
  serviceName: "Postgres",
} as const;

/** Fixed CLI arguments; callers cannot weaken psql error-stop behavior. */
export const FIXED_JOURNEYS_PSQL_ARGUMENTS = [
  "-X",
  "--no-psqlrc",
  "-v",
  "ON_ERROR_STOP=1",
  "-f",
  "-",
] as const;

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIRECTORY = resolve(
  SCRIPT_DIRECTORY,
  "../../migrations",
);

type ObjectKind = "table" | "constraint" | "index";
export type ManagedObject = Readonly<{
  kind: ObjectKind;
  name: string;
  relation?: string;
  /** Ordered, source-derived structural tokens for catalog definition matching. */
  definitionTokens?: readonly string[];
}>;

export type ApprovedJourneysMigration = Readonly<{
  filename: string;
  sha256: string;
  prerequisites: readonly string[];
}>;

export type VerifiedJourneysMigration = ApprovedJourneysMigration &
  Readonly<{ source: string; managedObjects: readonly ManagedObject[] }>;

/** No caller can extend, substitute, or re-order this two-file inventory. */
export const APPROVED_JOURNEYS_CONNECTED_APPS_MIGRATIONS: readonly ApprovedJourneysMigration[] =
  [
    {
      filename: "20261014_kinfolk_journeys_source_only.sql",
      sha256:
        "7da2c59f18834c85729ede9b1dd242476ee6bdc75fb9cb8f3508e6d78d573d06",
      prerequisites: ["users"],
    },
    {
      filename: "20261014_kinfolk_connected_apps_source_only.sql",
      sha256:
        "1e033c3c30dc090068f9501ac476ea3bdf8e3455476049ceb8da054766e80750",
      prerequisites: ["users"],
    },
  ] as const;

export type JourneysMigrationMode = "dry-run" | "apply";

export class JourneysConnectedAppsMigrationRunnerError extends Error {
  constructor(
    public readonly code:
      | "invalid_arguments"
      | "target_mismatch"
      | "database_url_missing"
      | "encryption_configuration_missing"
      | "migration_hash_mismatch"
      | "migration_ledger_missing"
      | "missing_prerequisite"
      | "unexpected_partial_state"
      | "migration_history_mismatch"
      | "recorded_schema_mismatch"
      | "database_inspection_failed"
      | "migration_apply_failed",
  ) {
    super(code);
    this.name = "JourneysConnectedAppsMigrationRunnerError";
  }
}

export interface SqlClient {
  query<T extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
}

export interface CatalogInspector {
  beginReadOnly(): Promise<void>;
  endReadOnly(): Promise<void>;
  relationExists(name: string): Promise<boolean>;
  objectMatches(object: ManagedObject): Promise<boolean>;
  migrationHistory(
    filenames: readonly string[],
  ): Promise<readonly { filename: string; checksum: string }[]>;
}

function sha256(source: string): string {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function objectKey(object: ManagedObject): string {
  return `${object.kind}:${object.relation ?? ""}:${object.name}`;
}

function definitionTokens(source: string): readonly string[] {
  // PostgreSQL canonicalizes `value IN (...)` as `value = ANY (ARRAY[...])`.
  // Values and their ordered column context remain significant; only `IN` is
  // deliberately omitted so source and pg_get_* definitions compare stably.
  return (
    source.toLowerCase().match(/[a-z_][a-z0-9_]*|'(?:''|[^'])*'|\d+/g) ?? []
  ).filter((token) => token !== "in");
}

/** Parses named source postconditions only after the complete source hash matches. */
export function managedObjectsForJourneysMigration(
  source: string,
): readonly ManagedObject[] {
  const objects: ManagedObject[] = [];
  const tablePattern =
    /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\n\);/gi;
  for (const table of source.matchAll(tablePattern)) {
    const relation = table[1]!.toLowerCase();
    objects.push({ kind: "table", name: relation });
    for (const constraint of table[2]!.matchAll(
      /\bCONSTRAINT\s+([a-z_][a-z0-9_]*)\s+([\s\S]*?)(?=\bCONSTRAINT\s+[a-z_][a-z0-9_]*\b|\s*$)/gi,
    )) {
      objects.push({
        kind: "constraint",
        name: constraint[1]!.toLowerCase(),
        relation,
        definitionTokens: definitionTokens(
          (constraint[2]! as string).replace(/,\s*(?:--[^\n]*\n\s*)*$/, ""),
        ),
      });
    }
  }
  const indexPattern =
    /\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\s+ON\s+([a-z_][a-z0-9_]*)\s+([\s\S]*?);/gi;
  for (const match of source.matchAll(indexPattern)) {
    objects.push({
      kind: "index",
      name: match[2]!.toLowerCase(),
      relation: match[3]!.toLowerCase(),
      definitionTokens: definitionTokens(
        `${match[1] ?? ""}${match[3]} ${match[4]}`,
      ),
    });
  }
  const seen = new Set<string>();
  return objects.filter((object) => {
    const key = objectKey(object);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function loadVerifiedJourneysConnectedAppsMigrations(
  directory = MIGRATIONS_DIRECTORY,
): readonly VerifiedJourneysMigration[] {
  return APPROVED_JOURNEYS_CONNECTED_APPS_MIGRATIONS.map((migration) => {
    const source = readFileSync(resolve(directory, migration.filename), "utf8");
    if (sha256(source) !== migration.sha256) {
      throw new JourneysConnectedAppsMigrationRunnerError(
        "migration_hash_mismatch",
      );
    }
    return {
      ...migration,
      source,
      managedObjects: managedObjectsForJourneysMigration(source),
    };
  });
}

export function parseJourneysMigrationRunnerArguments(
  args: readonly string[],
): JourneysMigrationMode {
  if (args.length === 0) return "dry-run";
  if (
    args.length === 1 &&
    args[0] === "--apply-authorized-journeys-connected-apps-20261018"
  )
    return "apply";
  throw new JourneysConnectedAppsMigrationRunnerError("invalid_arguments");
}

/** Checks the exact isolated target without logging values, URLs, or key material. */
export function assertJourneysConnectedAppsStagingTarget(
  env: NodeJS.ProcessEnv,
): void {
  const expected: ReadonlyArray<readonly [string, string]> = [
    ["RAILWAY_PROJECT_ID", JOURNEYS_CONNECTED_APPS_STAGING_TARGET.projectId],
    [
      "RAILWAY_PROJECT_NAME",
      JOURNEYS_CONNECTED_APPS_STAGING_TARGET.projectName,
    ],
    [
      "RAILWAY_ENVIRONMENT_ID",
      JOURNEYS_CONNECTED_APPS_STAGING_TARGET.environmentId,
    ],
    [
      "RAILWAY_ENVIRONMENT_NAME",
      JOURNEYS_CONNECTED_APPS_STAGING_TARGET.environmentName,
    ],
    ["RAILWAY_SERVICE_ID", JOURNEYS_CONNECTED_APPS_STAGING_TARGET.serviceId],
    [
      "RAILWAY_SERVICE_NAME",
      JOURNEYS_CONNECTED_APPS_STAGING_TARGET.serviceName,
    ],
  ];
  if (expected.some(([key, value]) => env[key] !== value)) {
    throw new JourneysConnectedAppsMigrationRunnerError("target_mismatch");
  }
  if (!env.DATABASE_URL?.trim()) {
    throw new JourneysConnectedAppsMigrationRunnerError("database_url_missing");
  }
  if (
    !env.KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY?.trim() ||
    !env.KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID?.trim() ||
    !env.KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY?.trim()
  ) {
    throw new JourneysConnectedAppsMigrationRunnerError(
      "encryption_configuration_missing",
    );
  }
}

export class PostgresJourneysCatalogInspector implements CatalogInspector {
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

  async objectMatches(object: ManagedObject): Promise<boolean> {
    const queries: Record<ObjectKind, string> = {
      table:
        "SELECT to_regclass($1) IS NOT NULL AS exists, NULL::text AS definition",
      constraint: `SELECT TRUE AS exists, pg_get_constraintdef(constraint_row.oid, true) AS definition
           FROM pg_constraint AS constraint_row
           JOIN pg_class AS relation ON relation.oid = constraint_row.conrelid
           JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname='public'
            AND relation.relname=$1
            AND constraint_row.conname=$2`,
      index: `SELECT TRUE AS exists, pg_get_indexdef(i.oid, 0, true) AS definition
           FROM pg_class i
           JOIN pg_namespace n ON n.oid = i.relnamespace
          WHERE n.nspname='public' AND i.relkind='i' AND i.relname=$1`,
    };
    const values =
      object.kind === "table"
        ? [`public.${object.name}`]
        : object.kind === "constraint"
          ? [object.relation ?? "", object.name]
          : [object.name];
    const result = await this.client.query<{
      exists: boolean;
      definition: string | null;
    }>(queries[object.kind], values);
    const row = result.rows[0];
    if (!row?.exists) return false;
    if (!object.definitionTokens?.length) return true;
    const actual = definitionTokens(row.definition ?? "");
    let nextTokenIndex = 0;
    for (const expected of object.definitionTokens) {
      nextTokenIndex = actual.indexOf(expected, nextTokenIndex);
      if (nextTokenIndex < 0) return false;
      nextTokenIndex += 1;
    }
    return true;
  }

  async migrationHistory(
    filenames: readonly string[],
  ): Promise<readonly { filename: string; checksum: string }[]> {
    const result = await this.client.query<{
      filename: string;
      checksum: string;
    }>(
      "SELECT filename, checksum FROM schema_migrations WHERE filename = ANY($1::text[]) ORDER BY filename",
      [filenames],
    );
    return result.rows;
  }
}

export type JourneysMigrationReceipt = Readonly<{
  filename: string;
  sha256: string;
  state: "pending" | "recorded";
  objectCount: number;
}>;
export type JourneysPreflightReceipt = Readonly<{
  mode: JourneysMigrationMode;
  sourceBaseSha: string;
  migrationCount: number;
  migrations: readonly JourneysMigrationReceipt[];
}>;

/**
 * Catalog preflight reads only the migration ledger and pg_catalog. It rejects
 * partial state, checksum drift, a missing base relation, and any recorded
 * migration whose named postconditions are absent.
 */
export async function preflightJourneysConnectedAppsMigrations(
  inspector: CatalogInspector,
  migrations: readonly VerifiedJourneysMigration[],
  mode: JourneysMigrationMode,
): Promise<JourneysPreflightReceipt> {
  await inspector.beginReadOnly();
  try {
    for (const baseRelation of ["schema_migrations", "users"]) {
      if (!(await inspector.relationExists(baseRelation))) {
        throw new JourneysConnectedAppsMigrationRunnerError(
          baseRelation === "schema_migrations"
            ? "migration_ledger_missing"
            : "missing_prerequisite",
        );
      }
    }
    const history = new Map(
      (
        await inspector.migrationHistory(
          migrations.map((migration) => migration.filename),
        )
      ).map((row) => [row.filename, row.checksum]),
    );
    const receipts: JourneysMigrationReceipt[] = [];
    let pendingSeen = false;
    for (const migration of migrations) {
      // A PostgreSQL Client accepts one active query at a time. Keep this
      // preflight deterministic rather than issuing catalog reads concurrently.
      const objectStates: boolean[] = [];
      for (const object of migration.managedObjects) {
        objectStates.push(await inspector.objectMatches(object));
      }
      const checksum = history.get(migration.filename);
      if (checksum) {
        if (checksum !== migration.sha256 || pendingSeen) {
          throw new JourneysConnectedAppsMigrationRunnerError(
            "migration_history_mismatch",
          );
        }
        if (!objectStates.every(Boolean)) {
          throw new JourneysConnectedAppsMigrationRunnerError(
            "recorded_schema_mismatch",
          );
        }
        receipts.push({
          filename: migration.filename,
          sha256: migration.sha256,
          state: "recorded",
          objectCount: migration.managedObjects.length,
        });
        continue;
      }
      pendingSeen = true;
      if (objectStates.some(Boolean)) {
        throw new JourneysConnectedAppsMigrationRunnerError(
          "unexpected_partial_state",
        );
      }
      receipts.push({
        filename: migration.filename,
        sha256: migration.sha256,
        state: "pending",
        objectCount: migration.managedObjects.length,
      });
    }
    return {
      mode,
      sourceBaseSha: JOURNEYS_CONNECTED_APPS_SOURCE_BASE,
      migrationCount: migrations.length,
      migrations: receipts,
    };
  } catch (error) {
    if (error instanceof JourneysConnectedAppsMigrationRunnerError) throw error;
    throw new JourneysConnectedAppsMigrationRunnerError(
      "database_inspection_failed",
    );
  } finally {
    await inspector.endReadOnly().catch(() => undefined);
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * Emits one fixed psql program: error-stop is set twice (CLI and psql input),
 * all writes share one transaction, and the ledger is updated in that same
 * transaction. There is no caller-provided SQL, filename, or checksum input.
 */
export function buildJourneysConnectedAppsApplyProgram(
  migrations: readonly VerifiedJourneysMigration[],
): string {
  return [
    "\\set ON_ERROR_STOP on",
    "BEGIN;",
    ...migrations.flatMap((migration) => [
      `-- BEGIN ${migration.filename}`,
      migration.source.trim(),
      `INSERT INTO schema_migrations (filename, checksum) VALUES (${sqlLiteral(migration.filename)}, ${sqlLiteral(migration.sha256)});`,
      `-- END ${migration.filename}`,
    ]),
    "COMMIT;",
    "",
  ].join("\n");
}

function psqlEnvironment(databaseUrl: string): NodeJS.ProcessEnv {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new JourneysConnectedAppsMigrationRunnerError("database_url_missing");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new JourneysConnectedAppsMigrationRunnerError("database_url_missing");
  }
  const host = parsed.searchParams.get("host") ?? parsed.hostname;
  const env = { ...process.env };
  delete env.DATABASE_URL;
  return {
    ...env,
    PGHOST: host,
    PGPORT: parsed.searchParams.get("port") ?? (parsed.port || "5432"),
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    PGSSLMODE:
      parsed.searchParams.get("sslmode") ??
      env.PGSSLMODE ??
      (host.startsWith("/") ? "disable" : "require"),
  };
}

/** Applies only the fixed program after an independent read-only preflight. */
export async function applyJourneysConnectedAppsWithPsql(input: {
  databaseUrl: string;
  migrations: readonly VerifiedJourneysMigration[];
}): Promise<void> {
  const program = buildJourneysConnectedAppsApplyProgram(input.migrations);
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn("psql", [...FIXED_JOURNEYS_PSQL_ARGUMENTS], {
      env: psqlEnvironment(input.databaseUrl),
      stdio: ["pipe", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", () =>
      reject(
        new JourneysConnectedAppsMigrationRunnerError("migration_apply_failed"),
      ),
    );
    child.on("exit", (code) => {
      if (code === 0) return resolvePromise();
      // Intentionally do not return provider/database diagnostics: the caller
      // receives a categorical failure and retains no credentials or SQL output.
      void stderr;
      reject(
        new JourneysConnectedAppsMigrationRunnerError("migration_apply_failed"),
      );
    });
    child.stdin.end(program, "utf8");
  });
}

export async function executeJourneysConnectedAppsMigrationRunner(
  env: NodeJS.ProcessEnv,
  mode: JourneysMigrationMode,
  dependencies: {
    migrations?: readonly VerifiedJourneysMigration[];
    client?: SqlClient & {
      connect?: () => Promise<void>;
      end?: () => Promise<void>;
    };
    apply?: typeof applyJourneysConnectedAppsWithPsql;
  } = {},
): Promise<JourneysPreflightReceipt> {
  assertJourneysConnectedAppsStagingTarget(env);
  const migrations =
    dependencies.migrations ?? loadVerifiedJourneysConnectedAppsMigrations();
  const client =
    dependencies.client ?? new Client({ connectionString: env.DATABASE_URL });
  const mustClose = !dependencies.client;
  try {
    if (client.connect) await client.connect();
    const receipt = await preflightJourneysConnectedAppsMigrations(
      new PostgresJourneysCatalogInspector(client),
      migrations,
      mode,
    );
    if (mode === "apply") {
      await (dependencies.apply ?? applyJourneysConnectedAppsWithPsql)({
        databaseUrl: env.DATABASE_URL!,
        migrations,
      });
      // psql owns the apply transaction. Reconnect before checking its commit
      // so postconditions never rely on a client that predates schema DDL.
      const verificationClient = new Client({
        connectionString: env.DATABASE_URL,
      });
      try {
        await verificationClient.connect();
        return await preflightJourneysConnectedAppsMigrations(
          new PostgresJourneysCatalogInspector(verificationClient),
          migrations,
          "apply",
        );
      } finally {
        await verificationClient.end().catch(() => undefined);
      }
    }
    return receipt;
  } finally {
    if (mustClose && client.end) await client.end().catch(() => undefined);
  }
}

function sanitizedReceipt(receipt: JourneysPreflightReceipt): string {
  return JSON.stringify({
    target: "journeys_connected_apps_isolated_staging_only",
    mode: receipt.mode,
    sourceBaseSha: receipt.sourceBaseSha,
    migrationCount: receipt.migrationCount,
    migrations: receipt.migrations.map((migration) => ({
      filename: migration.filename,
      sha256: migration.sha256,
      state: migration.state,
      objectCount: migration.objectCount,
    })),
  });
}

async function main(): Promise<void> {
  const mode = parseJourneysMigrationRunnerArguments(process.argv.slice(2));
  const receipt = await executeJourneysConnectedAppsMigrationRunner(
    process.env,
    mode,
  );
  console.log(sanitizedReceipt(receipt));
}

const invokedAsScript =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  main().catch((error: unknown) => {
    const code =
      error instanceof JourneysConnectedAppsMigrationRunnerError
        ? error.code
        : "database_inspection_failed";
    console.error(
      JSON.stringify({
        target: "journeys_connected_apps_isolated_staging_only",
        status: "stopped",
        code,
      }),
    );
    process.exitCode = 1;
  });
}
