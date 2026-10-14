import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const privatePlacesSource = readFileSync(
  new URL("../app/kinfolk-private-places.tsx", import.meta.url),
  "utf8",
);
const projectionStart = privatePlacesSource.indexOf("type NearbyDirectoryBusiness");
const projectionEnd = privatePlacesSource.indexOf("async function memberToken");
const projectionSource = privatePlacesSource.slice(
  projectionStart,
  projectionEnd,
);
const nearbySearchSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf("const nearby = async"),
  privatePlacesSource.indexOf("const topPad"),
);
const nearbyResultStart = privatePlacesSource.indexOf(
  '{nearbySearched ? <View testID="private-places-nearby-results"',
);
const privatePlaceFormStart = privatePlacesSource.indexOf(
  '<Text style={[styles.section, { color: colors.mutedForeground }]}>{editingPlace ? "UPDATE A PRIVATE PLACE" : "SAVE A PRIVATE PLACE"}</Text>',
);
const resultSurfaceSource = privatePlacesSource.slice(
  nearbyResultStart,
  privatePlaceFormStart,
);

describe("mobile Private Places governed nearby results", () => {
  it("renders governed public-business cards and passes only the public destination ID to the business route", () => {
    expect(nearbyResultStart).toBeGreaterThan(-1);
    expect(privatePlaceFormStart).toBeGreaterThan(nearbyResultStart);
    expect(nearbySearchSource).toContain("/nearby");
    expect(nearbySearchSource).toContain("setNearbyBusinesses(readPublicDirectoryBusinesses(payload))");
    expect(resultSurfaceSource).toContain('testID="private-places-nearby-results"');
    expect(resultSurfaceSource).toContain("nearbyBusinesses.map((business)");
    expect(resultSurfaceSource).toContain('pathname: "/business/[id]", params: { id: business.id }');
    expect(resultSurfaceSource).toContain("business.name");
  });

  it("projects an explicit public card allowlist and keeps the nearby presentation away from private data", () => {
    expect(projectionStart).toBeGreaterThan(-1);
    expect(projectionEnd).toBeGreaterThan(projectionStart);
    for (const safeField of ["id", "name", "category", "city", "stateCode", "verified"]) {
      expect(projectionSource).toContain(safeField);
    }
    for (const privateField of ["label", "exactAddress", "address", "latitude", "longitude", "ciphertext", "encrypted", "origin"]) {
      expect(projectionSource).not.toContain(privateField);
      expect(resultSurfaceSource).not.toContain(privateField);
    }
    expect(nearbySearchSource).not.toContain("place.label");
    expect(privatePlacesSource).not.toContain("/api/kinfolk/chat");
  });

  it("requires the current disclosure before enabling manual nearby search", () => {
    expect(privatePlacesSource).toContain("disclosureVersion: string");
    expect(privatePlacesSource).toContain("place.disclosureVersion === status.disclosureVersion");
    expect(privatePlacesSource).toContain("Update and re-acknowledge before this place can be used for nearby search");
  });
});
