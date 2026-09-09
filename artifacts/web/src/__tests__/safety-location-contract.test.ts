import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createLatestLocationResolutionGate } from "../features/location/latestLocationResolution";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web Safety location contract", () => {
  const safety = source("../pages/safety.tsx");
  const neighborhood = source("../pages/rate-neighborhood.tsx");
  const picker = source("../features/location/SafetyLocationPicker.tsx");

  it("never assumes Philadelphia for nearby safety alerts", () => {
    expect(safety).not.toContain("lat=39.9526");
    expect(safety).not.toContain("lng=-75.1652");
    expect(safety).not.toContain("All clear nearby");
    expect(safety).toContain("Choose a location to check nearby alerts");
    expect(safety).toContain("No active community alerts found nearby");
  });

  it("queries nearby alerts only from an explicitly resolved area", () => {
    expect(safety).toContain("if (safetyArea?.latitude == null || safetyArea?.longitude == null)");
    expect(safety).toContain("lat=${encodeURIComponent(safetyArea.latitude)}");
    expect(safety).toContain("lng=${encodeURIComponent(safetyArea.longitude)}");
    expect(safety).toContain("radius=16.09");
    expect(safety).toContain("within 10 miles");
  });

  it("provides manual area resolution and user-triggered current location", () => {
    expect(picker).toContain('type="search"');
    expect(picker).toContain("Use this area");
    expect(picker).toContain("Use my location");
    expect(picker).toContain("useBrowserLocation()");
    expect(picker).toContain("onCleared()");
    expect((safety.match(/onCleared=/g) ?? [])).toHaveLength(5);
    expect(neighborhood).toContain("onCleared=");
    expect(picker).not.toContain("useEffect(() => void resolveCurrentArea");
  });

  it("invalidates an in-flight location response when the member edits the query", () => {
    const gate = createLatestLocationResolutionGate();
    const firstRequest = gate.begin();
    expect(gate.isCurrent(firstRequest)).toBe(true);
    gate.invalidate();
    expect(gate.isCurrent(firstRequest)).toBe(false);
  });

  it("accepts only the newest location response after a later lookup begins", () => {
    const gate = createLatestLocationResolutionGate();
    const firstRequest = gate.begin();
    const secondRequest = gate.begin();
    expect(gate.isCurrent(firstRequest)).toBe(false);
    expect(gate.isCurrent(secondRequest)).toBe(true);
  });

  it("uses the location picker for general, Police/ICE, unsafe-space, experience, nearby-alert, and neighborhood flows", () => {
    expect((safety.match(/<SafetyLocationPicker/g) ?? [])).toHaveLength(5);
    expect(neighborhood).toContain("<SafetyLocationPicker");
    expect(safety).toContain('label="Incident location"');
    expect(safety).toContain('label="Encounter location"');
    expect(safety).toContain('label="Unsafe space location"');
    expect(safety).toContain('label="Experience location"');
    expect(safety).toContain('label="Check safety near"');
  });

  it("sends structured, moderated incident areas without raw report coordinates", () => {
    expect(safety).toContain("incidentLocationPayload(resolvedArea, locationSource)");
    expect(safety).toContain("locationId: area.id");
    expect(safety).toContain("isAnonymous: true");
    expect(safety).not.toContain("lat: resolvedArea?.latitude");
    expect(safety).not.toContain("lng: resolvedArea?.longitude");
    expect(safety).not.toContain("api/safety-tips");
    expect(safety).toContain("Shared experiences are reviewed before any community alert");
    expect(safety).not.toContain("navigator.geolocation.getCurrentPosition");
  });
});
