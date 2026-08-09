/**
 * Migration: Tester Entitlement System
 *
 * Adds tester entitlement columns to users table and creates
 * the pending_tester_emails table for pre-approved email list management.
 *
 * Run: npx tsx scripts/migrate-tester-entitlement.ts
 */
import { Pool } from "pg";

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Applying tester entitlement migration...");

    await client.query(`
      -- Add tester entitlement columns to users table (idempotent)
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS tester_status VARCHAR(20) CHECK (tester_status IN ('active', 'inactive')),
        ADD COLUMN IF NOT EXISTS tester_access_source VARCHAR(30) CHECK (tester_access_source IN ('testflight', 'android_test', 'admin_invite', 'website_test')),
        ADD COLUMN IF NOT EXISTS tester_granted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS tester_granted_by VARCHAR(255),
        ADD COLUMN IF NOT EXISTS testing_entitlement_ends_at TIMESTAMPTZ;
    `);
    console.log("✓ Added tester columns to users table");

    await client.query(`
      -- Create pending_tester_emails table (idempotent)
      CREATE TABLE IF NOT EXISTS pending_tester_emails (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL UNIQUE,
        tester_access_source VARCHAR(30) NOT NULL DEFAULT 'admin_invite'
          CHECK (tester_access_source IN ('testflight', 'android_test', 'admin_invite', 'website_test')),
        granted_by VARCHAR(255),
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        entitlement_ends_at TIMESTAMPTZ,
        applied_at TIMESTAMPTZ,
        applied_to_user_id VARCHAR(255)
      );
    `);
    console.log("✓ Created pending_tester_emails table");

    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_pending_tester_emails_email
        ON pending_tester_emails (email);
    `);
    console.log("✓ Created index on pending_tester_emails.email");

    console.log("Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
