/*
 * One-purpose bootstrap for a disposable Railway staging database.
 *
 * This file exists only on the temporary
 * chore/member-business-staging-bootstrap-20261014 branch. It must never be
 * merged into a product branch. It applies the tracked Drizzle schema and the
 * reviewed member-business source-only migration to the isolated staging
 * DATABASE_URL, then remains alive solely so Railway records successful logs.
 */
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the isolated staging bootstrap.");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  console.log("[isolated-staging-bootstrap] applying tracked Drizzle schema");
  execFileSync(
    "pnpm",
    ["--filter", "@workspace/db", "run", "push-force"],
    { cwd: root, stdio: "inherit", env: process.env },
  );

  const migrationPath = path.join(
    root,
    "artifacts/api-server/migrations/20261014_member_business_owner_source_only.sql",
  );
  const sourceOnlyMigration = readFileSync(migrationPath, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("[isolated-staging-bootstrap] applying reviewed member-business source-only migration");
    await client.query(sourceOnlyMigration);

    if (process.env.ISOLATED_STAGING_SEED_MEMBER_BUSINESS === "true") {
      // Deliberately explicit, synthetic-only staging fixtures. These values
      // are never read from a real member record and this branch is never
      // merged. They enable a browser-level claim lifecycle rehearsal without
      // creating a production owner relationship or touching public listings.
      const members = [
        ["mwm.staging.owner.20261014@example.com", "Staging", "Owner"],
        ["mwm.staging.founder.20261014@example.com", "Staging", "Founder"],
      ];
      for (const [email, firstName, lastName] of members) {
        await client.query(
          `INSERT INTO waitlist_signups
             (email, first_name, last_name, city, state, is_business_owner, status, approved_at, is_synthetic_test, signup_sources)
           VALUES ($1, $2, $3, 'Staging', 'PA', false, 'approved', NOW(), true, 'web')
           ON CONFLICT (email) DO UPDATE
             SET status = 'approved',
                 approved_at = COALESCE(waitlist_signups.approved_at, NOW()),
                 is_synthetic_test = true,
                 signup_sources = 'web'`,
          [email, firstName, lastName],
        );
      }

      await client.query(
        `INSERT INTO businesses
           (id, name, category, subcategory, address, city, state, description,
            status, listing_status, ownership_control_status, publication_status,
            verification_status, website, source_url, data_source)
         VALUES
           ('stg-owner-claim-business-20261014', 'Northstar Studio — Staging Fixture',
            'Professional Services', 'Creative Studio', '100 Staging Way', 'Staging', 'PA',
            'Synthetic staging-only listing used to validate the private ownership claim lifecycle.',
            'active', 'live_unclaimed', 'unclaimed', 'live', 'unverified',
            'https://northstar.example.test', 'https://northstar.example.test', 'isolated_staging_fixture')
         ON CONFLICT (id) DO NOTHING`,
      );
      console.log("[isolated-staging-bootstrap] synthetic member-business fixtures ready");
    }
  } finally {
    await client.end();
  }

  console.log("[isolated-staging-bootstrap] complete; no application traffic is served by this temporary service");
  // Keep the temporary service alive long enough to retain an auditable success
  // log. It is deleted immediately after the API staging service is healthy.
  setInterval(() => undefined, 60_000);
}

main().catch((error) => {
  console.error("[isolated-staging-bootstrap] failed", error);
  process.exit(1);
});
