import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Police/ICE P0 mobile safeguards", () => {
  it("cannot submit an observation until the member gives the informed consent", () => {
    const report = source("../app/report-police.tsx");
    expect(report).toContain("reportingConsent: false");
    expect(report).toContain("accessibilityRole=\"checkbox\"");
    expect(report).toContain("not a verified threat");
    expect(report).toContain("reportingConsent: form.reportingConsent");
    expect(report).toContain('reportingConsentVersion: "police-ice-p0-v1"');
    expect(report).toContain("form.description.trim().length > 10 && form.reportingConsent");
  });

  it("keeps the Police/ICE payload anonymous and city-only even on the negative location path", () => {
    const report = source("../app/report-police.tsx");
    const payload = report.slice(report.indexOf("body: JSON.stringify"), report.indexOf("if (!res.ok)"));
    expect(payload).toContain('category: "police"');
    expect(payload).toContain('precision: "city"');
    expect(payload).toContain("isAnonymous: true");
    expect(payload).not.toContain("latitude");
    expect(payload).not.toContain("longitude");
    expect(payload).not.toContain("area: form");
  });

  it("defaults sensitive alerts off and persists opt-in, a chosen coarse area, and the selected radius", () => {
    const profile = source("../app/(tabs)/profile.tsx");
    const notificationSettings = source("../app/notifications-settings.tsx");
    expect(profile).toContain("const [alertPolice, setAlertPolice] = useState(false)");
    expect(profile).toContain("const [alertIce, setAlertIce] = useState(false)");
    expect(profile).toContain("save({ safetyAlertPolice: next })");
    expect(profile).toContain("save({ safetyAlertIce: next })");
    expect(profile).toContain("save({ safetyAlertRadiusMiles: r })");
    expect(profile).toContain("safetyAlertAreaCity");
    expect(profile).toContain("safetyAlertAreaState");
    expect(profile).toContain("Save Safety Alert awareness area");
    expect(profile).toContain("Choose and save a Safety Alert city and state before turning on Police or ICE alerts.");
    expect(profile).toContain("not official confirmation");
    expect(profile).toContain("Applied around the selected city’s public center.");
    expect(profile).toContain("Safety Alert setting did not change");
    expect(profile).toContain("never reads or retains your device location");
    expect(profile).toContain("Alerts never disclose your coordinates, a reporter, a street, or a visit history.");
    expect(profile).toContain('throw new Error(body.error ?? "Safety alert preference was not saved")');
    expect(profile).toContain('accessibilityRole="alert"');
    expect(notificationSettings).toContain("City/state Police and ICE awareness is optional and managed in Profile.");
    expect(notificationSettings).toContain("city/state Police and ICE awareness remains separately optional");
  });

  it("does not use the immediate map-alert path for Police, ICE, or checkpoints", () => {
    const mapTab = source("../components/MapTabView.tsx");
    expect(mapTab).toContain("Police / ICE awareness uses the explicit city-region flow");
    expect(mapTab).toContain('router.push("/report-police")');
    expect(mapTab).not.toContain("reportAlert(");
    expect(mapTab).not.toContain("Report Nearby Activity");
    expect(mapTab).not.toContain("community-alerts/");
  });
});
