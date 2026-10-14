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
  const locationShare = source("../../../mobile/app/location-share.tsx");
  const geoAlert = source("../../../mobile/hooks/useGeoSafeAlert.ts");
  const activityAlert = source("../../../mobile/hooks/useActivityAlerts.ts");
  const webSafety = source("../../../web/src/pages/safety.tsx");

  it("does not request a safety location simply when screens open", () => {
    expect(hub).not.toContain("queueMicrotask(() => { void fetchIntel(); });");
    expect(tip).not.toContain("useEffect(() => {\n    void autoLocate();");
    expect(geoAlert).not.toContain("void Promise.resolve().then(checkCurrentLocation)");
    expect(fullMap).not.toContain("const [locating, setLocating] = useState(true)");
    // The retired alert/proximity hooks are now absent rather than merely disabled.
    expect(mapTab).not.toContain("useActivityAlerts(");
    expect(mapTab).not.toContain("useSafetyProximity(");
    expect(mapTab).not.toContain("expo-location");
  });

  it("isolates trusted foreground sharing behind selected-recipient consent", () => {
    expect(hub).toContain('id: "live-location"');
    expect(hub).toContain('route: "/location-share"');
    expect(hub).toContain('title: "Trusted Live Location"');
    expect(hub).toContain("Voluntarily share a minimized current location");
    expect(hub).not.toContain("expo-location");
    expect(hub).not.toContain("Location.Accuracy.Highest");
    expect(tip).toContain("never collects or shares a member");
    expect(tip).not.toContain("expo-location");
    expect(tip).not.toContain("Location.Accuracy.Highest");
    expect(fullMap).toContain("Use my precise location for nearby businesses");
    expect(fullMap).toContain("Location.Accuracy.Highest");
    expect(locationShare).toContain("recipientTrustedShareId");
    expect(locationShare).toContain("liveLocationConsent");
    expect(locationShare).toContain("requestForegroundPermissionsAsync");
    expect(locationShare).toContain("disabled={creating || !selectedRecipientId || !liveLocationConsent}");
    expect(activityAlert).toContain("coordinate activity alerts are retired");
    expect(activityAlert).not.toContain("expo-location");
    expect(activityAlert).not.toContain("Location.Accuracy.Highest");
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
