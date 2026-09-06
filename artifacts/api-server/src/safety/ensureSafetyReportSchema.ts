import type { Pool } from "pg";

const REQUIRED_COLUMNS = [
  "encounter_type",
  "incident_city",
  "incident_region",
  "incident_area",
  "incident_location_source",
  "incident_location_precision",
] as const;

const REQUIRED_INCIDENT_COLUMNS = ["region"] as const;

export async function ensureRequiredSafetyReportSchema(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE safety_reports
      ADD COLUMN IF NOT EXISTS encounter_type varchar(50),
      ADD COLUMN IF NOT EXISTS incident_city varchar(100),
      ADD COLUMN IF NOT EXISTS incident_region varchar(100),
      ADD COLUMN IF NOT EXISTS incident_area varchar(255),
      ADD COLUMN IF NOT EXISTS incident_location_source varchar(30),
      ADD COLUMN IF NOT EXISTS incident_location_precision varchar(30);

    UPDATE safety_reports
    SET incident_location_source = COALESCE(incident_location_source, 'legacy_text'),
        incident_location_precision = COALESCE(incident_location_precision, 'unknown')
    WHERE incident_location_source IS NULL
       OR incident_location_precision IS NULL;

    ALTER TABLE safety_reports
      ALTER COLUMN incident_location_source SET DEFAULT 'manual_area',
      ALTER COLUMN incident_location_source SET NOT NULL,
      ALTER COLUMN incident_location_precision SET DEFAULT 'city',
      ALTER COLUMN incident_location_precision SET NOT NULL;

    ALTER TABLE safety_incidents
      ADD COLUMN IF NOT EXISTS region varchar(100);

    CREATE INDEX IF NOT EXISTS safety_incidents_region_identity_idx
      ON safety_incidents (LOWER(city), LOWER(region), category, status, triggered_at DESC);
  `);

  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'safety_reports'
       AND column_name = ANY($1::text[])`,
    [REQUIRED_COLUMNS],
  );
  const ready = new Set(result.rows.map((row) => row.column_name));
  const missing = REQUIRED_COLUMNS.filter((column) => !ready.has(column));
  if (missing.length > 0) {
    throw new Error(`Required safety report schema is incomplete: ${missing.join(", ")}`);
  }

  const incidentResult = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'safety_incidents'
       AND column_name = ANY($1::text[])`,
    [REQUIRED_INCIDENT_COLUMNS],
  );
  const incidentReady = new Set(incidentResult.rows.map((row) => row.column_name));
  const missingIncident = REQUIRED_INCIDENT_COLUMNS.filter((column) => !incidentReady.has(column));
  if (missingIncident.length > 0) {
    throw new Error(`Required safety incident schema is incomplete: ${missingIncident.join(", ")}`);
  }
}
