import { sql, type SQL } from "drizzle-orm";

type SqlExecutor = {
  execute(query: SQL): Promise<unknown>;
};

export type KinfolkContinuityDecision = "accepted" | "declined" | null;

export type KinfolkContinuityPersistenceInput = {
  userId: string;
  enabled: boolean;
  decision: KinfolkContinuityDecision;
  disclosureVersion: string | null;
  disclosedAt: Date | null;
  updatedAt: Date;
};

/**
 * Persists the small, stable set of settings that controls Kinfolk continuity.
 *
 * The production database can be intentionally behind the application's broader
 * notification-settings schema while a feature release is in explicit mode. A
 * Drizzle insert of userSettingsTable names every current schema column with a
 * DEFAULT value, which makes a first-use consent choice fail if an unrelated,
 * newer optional column is absent. This statement names only the verified
 * continuity and safety columns required for this member action.
 *
 * Safety alerts always begin off for a new settings row. On conflict, only the
 * member's requested continuity values are updated; existing safety and other
 * preferences are never overwritten.
 */
export async function persistKinfolkContinuitySettings(
  executor: SqlExecutor,
  input: KinfolkContinuityPersistenceInput,
): Promise<void> {
  await executor.execute(sql`
    INSERT INTO user_settings (
      user_id,
      kinfolk_memory_enabled,
      kinfolk_continuity_enabled,
      kinfolk_continuity_updated_at,
      kinfolk_continuity_disclosure_decision,
      kinfolk_continuity_disclosure_version,
      kinfolk_continuity_disclosed_at,
      safety_alert_police,
      safety_alert_ice,
      safety_alert_radius_miles,
      updated_at
    ) VALUES (
      ${input.userId},
      ${input.enabled},
      ${input.enabled},
      ${input.updatedAt},
      ${input.decision},
      ${input.disclosureVersion},
      ${input.disclosedAt},
      false,
      false,
      5,
      ${input.updatedAt}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      kinfolk_memory_enabled = EXCLUDED.kinfolk_memory_enabled,
      kinfolk_continuity_enabled = EXCLUDED.kinfolk_continuity_enabled,
      kinfolk_continuity_updated_at = EXCLUDED.kinfolk_continuity_updated_at,
      kinfolk_continuity_disclosure_decision = EXCLUDED.kinfolk_continuity_disclosure_decision,
      kinfolk_continuity_disclosure_version = EXCLUDED.kinfolk_continuity_disclosure_version,
      kinfolk_continuity_disclosed_at = EXCLUDED.kinfolk_continuity_disclosed_at,
      updated_at = EXCLUDED.updated_at
  `);
}
