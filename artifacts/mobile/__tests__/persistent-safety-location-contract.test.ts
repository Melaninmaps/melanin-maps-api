import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const settings = source("../app/persistent-safety-location.tsx");
const task = source("../lib/persistentSafetyLocation.ts");
const hub = source("../app/(tabs)/safety-hub.tsx");
const appConfig = source("../app.json");

describe("native Persistent Safety Location contract", () => {
  it("keeps private emergency matching visibly separate from Temporary Trusted Live Sharing", () => {
    expect(hub).toContain('title: "Safety Location"');
    expect(hub).toContain('route: "/persistent-safety-location"');
    expect(settings).toContain("A separate choice from Temporary Trusted Live Sharing");
    expect(settings).toContain("Trusted contacts cannot open a map");
    expect(settings).toContain("Turn off and revoke consent");
    expect(settings).toContain("Delete current location");
  });

  it("requests background permission only after explicit Enable action and does not persist offline coordinates", () => {
    expect(settings).toContain("Enable Safety Location");
    expect(settings).toContain("disclosureAcknowledged: true");
    expect(task).toContain("requestBackgroundPermissionsAsync");
    expect(task).toContain("startLocationUpdatesAsync");
    expect(task).toContain("stopLocationUpdatesAsync");
    expect(task).toContain("No raw location is queued to AsyncStorage or logged");
    expect(task).toContain("TaskManager.defineTask");
  });

  it("declares native permission disclosure and a visible Android foreground service", () => {
    expect(appConfig).toContain("NSLocationAlwaysAndWhenInUseUsageDescription");
    expect(appConfig).toContain("ACCESS_BACKGROUND_LOCATION");
    expect(appConfig).toContain("FOREGROUND_SERVICE_LOCATION");
    expect(appConfig).toContain("isIosBackgroundLocationEnabled");
    expect(appConfig).toContain("isAndroidBackgroundLocationEnabled");
    expect(task).toContain("notificationTitle: \"Safety Location protection is active\"");
  });
});
