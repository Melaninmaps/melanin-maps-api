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

  it("defaults sensitive alerts off and persists both opt-in and the selected radius", () => {
    const profile = source("../app/(tabs)/profile.tsx");
    expect(profile).toContain("const [alertPolice, setAlertPolice] = useState(false)");
    expect(profile).toContain("const [alertIce, setAlertIce] = useState(false)");
    expect(profile).toContain("save({ safetyAlertPolice: next })");
    expect(profile).toContain("save({ safetyAlertIce: next })");
    expect(profile).toContain("save({ safetyAlertRadiusMiles: r })");
    expect(profile).toContain("not official confirmation");
    expect(profile).toContain("Alerts name only a general city area and expire.");
  });

  it("does not use the immediate map-alert path for Police, ICE, or checkpoints", () => {
    const mapTab = source("../components/MapTabView.tsx");
    expect(mapTab).toContain('["police", "ice", "checkpoint"].includes(reportingType)');
    expect(mapTab).toContain('router.push("/report-police")');
    expect(mapTab).toContain("They never send an immediate alert.");
    expect(mapTab).toContain("not verified threats at intake");
  });
});
