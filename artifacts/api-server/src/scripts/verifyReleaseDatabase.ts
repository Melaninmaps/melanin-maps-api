import { applyReleaseGateDatabaseUrl } from "../lib/releaseDbGate";

// This must run before either dynamic import can initialize a database pool.
applyReleaseGateDatabaseUrl(process.env);

const { pool } = await import("@workspace/db");
const { ensureRequiredPublicationSchema, runStartupMigrations } = await import(
  "../lib/startup-migrations"
);

try {
  await runStartupMigrations();
  await ensureRequiredPublicationSchema(false);
  console.log("Release database publication schema verified.");
} finally {
  await pool.end();
}
