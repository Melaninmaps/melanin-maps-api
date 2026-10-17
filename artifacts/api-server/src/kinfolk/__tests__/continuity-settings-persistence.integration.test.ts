import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { persistKinfolkContinuitySettings } from "../continuity-settings-persistence";

const databaseUrl = process.env.KINFOLK_CONTINUITY_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

type SettingsRow = {
  user_id: string;
  kinfolk_memory_enabled: boolean;
  kinfolk_continuity_enabled: boolean;
  kinfolk_continuity_disclosure_decision: "accepted" | "declined" | null;
  kinfolk_continuity_disclosure_version: string | null;
  safety_alert_police: boolean;
  safety_alert_ice: boolean;
  safety_alert_radius_miles: number;
};

describeWithDatabase(
  "Kinfolk continuity persistence against a production-compatible schema",
  () => {
    const client = new Client({ connectionString: databaseUrl });
    const database = drizzle(client);

    async function createProductionCompatibleSettingsTable(options?: {
      includeSafetyIce?: boolean;
    }) {
      const includeSafetyIce = options?.includeSafetyIce ?? true;
      await client.query("DROP TABLE IF EXISTS user_settings");
      await client.query(`
      CREATE TABLE user_settings (
        user_id varchar PRIMARY KEY,
        kinfolk_memory_enabled boolean NOT NULL DEFAULT true,
        kinfolk_continuity_enabled boolean NOT NULL DEFAULT false,
        kinfolk_continuity_updated_at timestamptz,
        kinfolk_continuity_disclosure_decision varchar(16),
        kinfolk_continuity_disclosure_version varchar(32),
        kinfolk_continuity_disclosed_at timestamptz,
        safety_alert_police boolean NOT NULL DEFAULT true,
        ${includeSafetyIce ? "safety_alert_ice boolean NOT NULL DEFAULT true," : ""}
        safety_alert_radius_miles integer NOT NULL DEFAULT 5,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    }

    async function rowFor(userId: string): Promise<SettingsRow | undefined> {
      const result = await client.query<SettingsRow>(
        "SELECT user_id, kinfolk_memory_enabled, kinfolk_continuity_enabled, kinfolk_continuity_disclosure_decision, kinfolk_continuity_disclosure_version, safety_alert_police, safety_alert_ice, safety_alert_radius_miles FROM user_settings WHERE user_id = $1",
        [userId],
      );
      return result.rows[0];
    }

    beforeAll(async () => {
      await client.connect();
    });

    beforeEach(async () => {
      // Deliberately omit notif_reminders and arrival_awareness_enabled. This is
      // the production schema shape that rejected the ORM's all-column insert.
      await createProductionCompatibleSettingsTable();
    });

    afterAll(async () => {
      await client
        .query("DROP TABLE IF EXISTS user_settings")
        .catch(() => undefined);
      await client.end().catch(() => undefined);
    });

    it("saves an accepted first-use choice when newer optional settings columns are absent", async () => {
      const missingOptionalColumn = await client.query<{
        column_name: string;
      }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_settings' AND column_name = 'notif_reminders'
    `);
      expect(missingOptionalColumn.rows).toHaveLength(0);

      const now = new Date("2026-10-17T01:45:00.000Z");
      await persistKinfolkContinuitySettings(database, {
        userId: "first-use-accepted",
        enabled: true,
        decision: "accepted",
        disclosureVersion: "v2",
        disclosedAt: now,
        updatedAt: now,
      });

      expect(await rowFor("first-use-accepted")).toMatchObject({
        user_id: "first-use-accepted",
        kinfolk_memory_enabled: true,
        kinfolk_continuity_enabled: true,
        kinfolk_continuity_disclosure_decision: "accepted",
        kinfolk_continuity_disclosure_version: "v2",
        safety_alert_police: false,
        safety_alert_ice: false,
        safety_alert_radius_miles: 5,
      });
    });

    it("saves a declined first-use choice without turning continuity on", async () => {
      const now = new Date("2026-10-17T01:46:00.000Z");
      await persistKinfolkContinuitySettings(database, {
        userId: "first-use-declined",
        enabled: false,
        decision: "declined",
        disclosureVersion: "v2",
        disclosedAt: now,
        updatedAt: now,
      });

      expect(await rowFor("first-use-declined")).toMatchObject({
        kinfolk_memory_enabled: false,
        kinfolk_continuity_enabled: false,
        kinfolk_continuity_disclosure_decision: "declined",
        safety_alert_police: false,
        safety_alert_ice: false,
      });
    });

    it("updates a legacy settings row and preserves its unrelated safety preferences", async () => {
      await client.query(`
      INSERT INTO user_settings (
        user_id, kinfolk_memory_enabled, kinfolk_continuity_enabled,
        safety_alert_police, safety_alert_ice, safety_alert_radius_miles
      ) VALUES ('legacy-member', false, false, true, true, 25)
    `);
      const now = new Date("2026-10-17T01:47:00.000Z");

      await persistKinfolkContinuitySettings(database, {
        userId: "legacy-member",
        enabled: true,
        decision: "accepted",
        disclosureVersion: "v2",
        disclosedAt: now,
        updatedAt: now,
      });

      expect(await rowFor("legacy-member")).toMatchObject({
        kinfolk_memory_enabled: true,
        kinfolk_continuity_enabled: true,
        kinfolk_continuity_disclosure_decision: "accepted",
        safety_alert_police: true,
        safety_alert_ice: true,
        safety_alert_radius_miles: 25,
      });
    });

    it("is idempotent across repeated submissions and persists across a new session", async () => {
      const now = new Date("2026-10-17T01:48:00.000Z");
      const input = {
        userId: "repeat-member",
        enabled: true,
        decision: "accepted" as const,
        disclosureVersion: "v2",
        disclosedAt: now,
        updatedAt: now,
      };
      await persistKinfolkContinuitySettings(database, input);
      await persistKinfolkContinuitySettings(database, input);

      const count = await client.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM user_settings WHERE user_id = $1",
        [input.userId],
      );
      expect(count.rows[0]?.count).toBe("1");

      const reopenedClient = new Client({ connectionString: databaseUrl });
      await reopenedClient.connect();
      const reopened = await reopenedClient.query<SettingsRow>(
        "SELECT user_id, kinfolk_memory_enabled, kinfolk_continuity_enabled, kinfolk_continuity_disclosure_decision, kinfolk_continuity_disclosure_version, safety_alert_police, safety_alert_ice, safety_alert_radius_miles FROM user_settings WHERE user_id = $1",
        [input.userId],
      );
      await reopenedClient.end();

      expect(reopened.rows[0]).toMatchObject({
        user_id: input.userId,
        kinfolk_continuity_enabled: true,
        kinfolk_continuity_disclosure_decision: "accepted",
      });
    });

    it("fails atomically if a required continuity/safety column is missing", async () => {
      await createProductionCompatibleSettingsTable({
        includeSafetyIce: false,
      });
      const now = new Date("2026-10-17T01:49:00.000Z");

      await expect(
        persistKinfolkContinuitySettings(database, {
          userId: "schema-failure-member",
          enabled: true,
          decision: "accepted",
          disclosureVersion: "v2",
          disclosedAt: now,
          updatedAt: now,
        }),
      ).rejects.toThrow(/safety_alert_ice/);

      const count = await client.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM user_settings WHERE user_id = $1",
        ["schema-failure-member"],
      );
      expect(count.rows[0]?.count).toBe("0");
    });
  },
);
