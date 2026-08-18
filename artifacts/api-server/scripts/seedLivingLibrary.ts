/**
 * Living Library recovery command.
 *
 * Usage:
 *   pnpm tsx scripts/seedLivingLibrary.ts           # seed/restore 28 topics
 *   pnpm tsx scripts/seedLivingLibrary.ts --verify  # verify without writing
 *
 * The seed is idempotent. It restores the canonical foundation but does not
 * delete Kinfolk's source-cited entries. Safe to run after any migration,
 * restore, reset, or new-environment deployment.
 *
 * Required output on success:
 *   { ok: true, expectedTopicCount: 28, missing: [], missingFeatured: [] }
 *
 * Exit code 1 if verification fails — use as a release gate:
 *   pnpm db:migrate && pnpm tsx scripts/seedLivingLibrary.ts && \
 *     pnpm tsx scripts/seedLivingLibrary.ts --verify && pnpm build && pnpm start
 */
import { Pool } from "pg";
import { seedFoundationalTopics, verifyFoundationalTopics } from "../src/library/seedFoundationalTopics";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const mode = process.argv.includes("--verify") ? "verify" : "seed";
    const result =
      mode === "seed"
        ? await seedFoundationalTopics(pool)
        : await verifyFoundationalTopics(pool);
    console.log(JSON.stringify({ mode, ...result }, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("living-library-seed-failed", {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
