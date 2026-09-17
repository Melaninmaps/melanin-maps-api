import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("explicit safety location consent", () => {
  const hub = source("../../../mobile/app/(tabs)/safety-hub.tsx");
  const tip = source("../../../mobile/app/safety-tip.tsx");
  const fullMap = source("../../../mobile/components/FullMapView.tsx");
  const mapTab = source("../../../mobile/components/MapTabView.tsx");
  const geoAlert = source("../../../mobile/hooks/useGeoSafeAlert.ts");
  const activityAlert = source("../../../mobile/hooks/useActivityAlerts.ts");
  const webSafety = source("../../../web/src/pages/safety.tsx");

  it("does not request a safety location simply when screens open", () => {
    expect(hub).not.toContain("queueMicrotask(() => { void fetchIntel(); });");
    expect(tip).not.toContain("useEffect(() => {\n    void autoLocate();");
    expect(geoAlert).not.toContain("void Promise.resolve().then(checkCurrentLocation)");
    expect(fullMap).not.toContain("const [locating, setLocating] = useState(true)");
    expect(mapTab).toContain("useActivityAlerts({ enabled: false })");
    expect(mapTab).toContain("useSafetyProximity({ enabled: false })");
  });

  it("uses precise location only after a clearly labelled member action", () => {
    expect(hub).toContain("Check nearby uses your device&apos;s precise location only after you tap this button.");
    expect(hub).toContain("Location.Accuracy.Highest");
    expect(tip).toContain("Tap to use my precise current location");
    expect(tip).toContain("Location.Accuracy.Highest");
    expect(fullMap).toContain("Use my precise location for nearby businesses");
    expect(fullMap).toContain("Location.Accuracy.Highest");
    expect(activityAlert).toContain("Reporting a nearby activity is an explicit member action");
    expect(activityAlert).toContain("Location.Accuracy.Highest");
  });

  it("keeps public safety wording clear and moves heritage discovery out of Safety", () => {
    expect(hub).not.toContain('id: "cultural-heritage"');
    expect(hub).toContain('title: "Report a Safety Concern"');
    expect(hub).toContain('title: "Report an Unsafe Space"');
    expect(webSafety).not.toContain('label: "Cultural Heritage Map"');
    expect(webSafety).toContain('label: "Report a Safety Concern"');
    expect(webSafety).toContain('label: "Report an Unsafe Space"');
  });
});
