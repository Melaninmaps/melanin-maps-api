import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const source = (relative: string) => readFileSync(`${root}/${relative}`, "utf8");

describe("optional official recall and health alerts", () => {
  it("defaults to opt-out and exposes only explicit user settings", () => {
    const settings = source("artifacts/api-server/src/routes/user-settings.ts");
    const liveSettings = source("artifacts/api-server/src/routes/users.ts");
    const schema = source("lib/db/src/schema/user-settings.ts");

    expect(settings).toContain("notifProductRecalls: false");
    expect(settings).toContain("notifPublicHealthAlerts: false");
    expect(settings).toContain('"notifProductRecalls", "notifPublicHealthAlerts"');
    expect(liveSettings).toContain("notifProductRecalls: officialAlertSettings?.notifProductRecalls ?? false");
    expect(liveSettings).toContain("notifPublicHealthAlerts: officialAlertSettings?.notifPublicHealthAlerts ?? false");
    expect(liveSettings).toContain(".insert(userSettingsTable)");
    expect(liveSettings).toContain("target: userSettingsTable.userId");
    expect(schema).toContain('boolean("notif_product_recalls").notNull().default(false)');
    expect(schema).toContain('boolean("notif_public_health_alerts").notNull().default(false)');
  });

  it("uses trusted official domains and exactly-once consent-based delivery", () => {
    const alerts = source("artifacts/api-server/src/alerts/officialPublicAlerts.ts");
    const refresh = source("artifacts/api-server/src/alerts/refreshOfficialPublicAlerts.ts");
    const migrations = source("artifacts/api-server/src/lib/startup-migrations.ts");

    expect(alerts).toContain("OFFICIAL_HOSTS");
    expect(alerts).toContain("Official alerts must link to the matching government source.");
    expect(alerts).toContain("ON CONFLICT (alert_id, user_id) DO NOTHING");
    expect(alerts).toContain("notif_product_recalls");
    expect(alerts).toContain("notif_public_health_alerts");
    expect(alerts).toContain("not medical advice");
    expect(migrations).toContain("official_public_alert_deliveries");
    expect(refresh).toContain("OFFICIAL_PUBLIC_ALERTS_ENABLED !== \"1\"");
    expect(refresh).toContain("openFDA dataset");
    expect(refresh).toContain("not used as a public alert trigger");
  });
});
