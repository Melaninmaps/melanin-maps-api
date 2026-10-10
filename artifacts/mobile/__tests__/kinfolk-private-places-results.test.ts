import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const privatePlacesSource = readFileSync(
  new URL("../app/kinfolk-private-places.tsx", import.meta.url),
  "utf8",
);
const projectionSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf("type NearbyDirectoryBusiness"),
  privatePlacesSource.indexOf("function apiBase"),
);
const nearbySearchSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf("const nearby = async"),
  privatePlacesSource.indexOf("const topPad"),
);
const resultSurfaceSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf('{nearbySearched ? <View testID="private-places-nearby-results"'),
  privatePlacesSource.indexOf('<Text style={[styles.section, { color: colors.mutedForeground }]}>SAVE A PRIVATE PLACE</Text>'),
);

describe("mobile Private Places governed nearby results", () => {
  it("renders governed public-business cards and passes only the public destination ID to the business route", () => {
    expect(nearbySearchSource).toContain("/nearby");
    expect(nearbySearchSource).toContain("setNearbyBusinesses(readPublicDirectoryBusinesses(payload))");
    expect(resultSurfaceSource).toContain('testID="private-places-nearby-results"');
    expect(resultSurfaceSource).toContain("nearbyBusinesses.map((business)");
    expect(resultSurfaceSource).toContain('pathname: "/business/[id]", params: { id: business.id }');
    expect(resultSurfaceSource).toContain("business.name");
  });

  it("projects an explicit public card allowlist and keeps the nearby presentation away from private data", () => {
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
});
