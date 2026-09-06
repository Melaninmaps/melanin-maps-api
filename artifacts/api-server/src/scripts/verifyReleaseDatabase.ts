import { pool } from "@workspace/db";
import {
  ensureRequiredPublicationSchema,
  runStartupMigrations,
} from "../lib/startup-migrations";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for release database verification");
}

try {
  await runStartupMigrations();
  await ensureRequiredPublicationSchema(false);
  console.log("Release database publication schema verified.");
} finally {
  await pool.end();
}
