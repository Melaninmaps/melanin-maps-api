import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CITY_SAFETY_CITY_CENTERS,
  CITY_SAFETY_SOURCE_REGISTRY,
  citySafetyCityId,
} from "../kinfolk/city-safety-briefing-v1";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const route = readFileSync(`${root}/artifacts/api-server/src/routes/kinfolk.ts`, "utf8");
const cron = readFileSync(`${root}/artifacts/api-server/src/routes/cron.ts`, "utf8");
const settings = readFileSync(`${root}/artifacts/api-server/src/routes/user-settings.ts`, "utf8");
const migrations = readFileSync(`${root}/artifacts/api-server/src/lib/startup-migrations.ts`, "utf8");
const tasks = readFileSync(`${root}/artifacts/api-server/src/routes/kinfolk-tasks.ts`, "utf8");

describe("Kinfolk reminder and arrival awareness contracts", () => {
  it("keeps every reviewed safety source bound to an active city", () => {
    const activeCities = new Set<string>(CITY_SAFETY_CITY_CENTERS.map((city) => city.cityId));
    expect(CITY_SAFETY_SOURCE_REGISTRY.length).toBeGreaterThanOrEqual(45);
    expect(CITY_SAFETY_SOURCE_REGISTRY.every((source) => activeCities.has(source.cityId))).toBe(true);
    expect(citySafetyCityId({ city: "Atlanta", stateCode: "GA" })).toBe("atlanta-ga");
  });

  it("uses the protected, non-persistent arrival awareness boundary", () => {
    expect(route).toContain('router.post("/kinfolk/arrival-awareness"');
    expect(route).toContain("Coordinates are used for this");
    expect(route).toContain("isCitySafetyBriefingV1Enabled()");
    expect(route).toContain("currentCitySafetyBriefing");
    expect(route).not.toMatch(/INSERT\s+INTO\s+user_locations[\s\S]{0,300}arrival-awareness/i);
  });

  it("delivers opted-in reminders exactly once through the protected cron route", () => {
    expect(cron).toContain('router.post("/cron/kinfolk-reminders"');
    expect(cron).toContain("verifyCronSecret(req, res)");
    expect(cron).toContain("reminder_sent_at IS NULL");
    expect(cron).toContain("SET reminder_sent_at = NOW()");
    expect(cron).toContain("sendPushToUser");
    expect(cron).toContain('screen: "kinfolk-tasks"');
  });

  it("keeps reminder and arrival choices explicit and migrated", () => {
    expect(settings).toContain("notifReminders: true");
    expect(settings).toContain("arrivalAwarenessEnabled: false");
    expect(migrations).toContain("notif_reminders BOOLEAN NOT NULL DEFAULT true");
    expect(migrations).toContain("arrival_awareness_enabled BOOLEAN NOT NULL DEFAULT false");
  });

  it("validates and preserves exact member-supplied reminder times", () => {
    expect(tasks).toContain("A reminder date must be valid");
    expect(tasks).toContain("dueAt: parsedDueAt");
    expect(tasks).toContain("dueAt: t.dueAt ? new Date(t.dueAt) : null");
  });
});
