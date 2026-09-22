import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("mobile map essential services availability layer", () => {
  it("requires an explicit nearby request and visually separates public facilities", () => {
    expect(mapSource).toContain('testID="essential-services-card"');
    expect(mapSource).toContain("/api/map/essential-services?");
    expect(mapSource).toContain('SecureStore.getItemAsync("auth_session_token")');
    expect(mapSource).toContain("MAP_ESSENTIAL_SERVICE_CATEGORIES");
    expect(mapSource).toContain('pinColor="#0F766E"');
    expect(mapSource).toContain("Public service · Google Maps");
    expect(mapSource).toContain("This is not an MWM listing, ownership designation, safety rating, or recommendation.");
  });

  it("clears location-specific availability data instead of reusing it after a move", () => {
    expect(mapSource).toContain("A changed device coordinate invalidates old availability data");
    expect(mapSource).toContain("clearEssentialServices();");
    expect(mapSource).toContain("setSubmittedBusinessSearch(query)");
  });
});
