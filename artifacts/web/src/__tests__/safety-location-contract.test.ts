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

  it("removes proximity alerts rather than assuming a member location", () => {
    expect(safety).not.toContain("lat=39.9526");
    expect(safety).not.toContain("lng=-75.1652");
    expect(safety).not.toContain("All clear nearby");
    expect(safety).toContain("No member-location safety feed");
    expect(safety).toContain("does not request, retain, display, or use a member");
  });

  it("does not query nearby alerts from a resolved area", () => {
    expect(safety).not.toContain("community-alerts/nearby");
    expect(safety).not.toContain("safetyArea?.latitude");
    expect(safety).not.toContain("radius=16.09");
  });

  it("provides manual general-area resolution without browser location", () => {
    expect(picker).toContain('type="search"');
    expect(picker).toContain("Use this area");
    expect(picker).toContain("City or general neighborhood");
    expect(picker).toContain("Device, street-address, and ZIP location collection is disabled");
    expect(picker).not.toContain("useBrowserLocation()");
    expect(picker).not.toContain("Use my location");
    expect(picker).toContain("onCleared()");
    expect((safety.match(/onCleared=/g) ?? [])).toHaveLength(4);
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

  it("uses the manual picker for reports and keeps community intelligence non-proximity based", () => {
    expect((safety.match(/<SafetyLocationPicker/g) ?? [])).toHaveLength(4);
    expect(neighborhood).toContain("<SafetyLocationPicker");
    expect(safety).toContain('label="Incident location"');
    expect(safety).toContain('label="Encounter location"');
    expect(safety).toContain('label="Unsafe space location"');
    expect(safety).toContain('label="Experience location"');
    expect(safety).not.toContain('label="Check safety near"');
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
