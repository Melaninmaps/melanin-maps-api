import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const temporaryStaysSource = readFileSync(
  new URL("../app/kinfolk-temporary-stays.tsx", import.meta.url),
  "utf8",
);
const projectionStart = temporaryStaysSource.indexOf("type NearbyDirectoryBusiness");
const projectionEnd = temporaryStaysSource.indexOf("async function memberToken");
const projectionSource = temporaryStaysSource.slice(projectionStart, projectionEnd);
const nearbySearchSource = temporaryStaysSource.slice(
  temporaryStaysSource.indexOf("const nearby = async"),
  temporaryStaysSource.indexOf("const topPad"),
);
const nearbyResultStart = temporaryStaysSource.indexOf(
  '{nearbySearched ? <View testID="temporary-stays-nearby-results"',
);
const temporaryStayFormStart = temporaryStaysSource.indexOf(
  '<Text style={[styles.section, { color: colors.mutedForeground }]}>{editingId ? "EDIT TEMPORARY STAY" : "SAVE A TEMPORARY STAY"}</Text>',
);
const resultSurfaceSource = temporaryStaysSource.slice(
  nearbyResultStart,
  temporaryStayFormStart,
);

describe("mobile Temporary Stays governed nearby results", () => {
  it("projects only an explicit public directory-card allowlist and rounds an optional public distance", () => {
    expect(projectionStart).toBeGreaterThan(-1);
    expect(projectionEnd).toBeGreaterThan(projectionStart);
    for (const safeField of ["id", "name", "category", "city", "stateCode", "listingStatus", "distanceMiles", "verified"]) {
      expect(projectionSource).toContain(safeField);
    }
    expect(projectionSource).toContain("Math.round(result.distanceMiles)");
    expect(projectionSource).toContain('listingStatus: result.verified === true ? "Verified business" : null');
    for (const privateField of ["address", "phone", "website", "latitude", "longitude", "coordinates", "encrypted", "ciphertext", "exactAddress", "provider"]) {
      expect(projectionSource).not.toContain(privateField);
    }
  });

  it("renders a truthful empty state and sends only the public business ID to the public profile route", () => {
    expect(nearbyResultStart).toBeGreaterThan(-1);
    expect(temporaryStayFormStart).toBeGreaterThan(nearbyResultStart);
    expect(resultSurfaceSource).toContain("No public businesses were returned for this search.");
    expect(resultSurfaceSource).toContain("nearbyBusinesses.map((business)");
    expect(resultSurfaceSource).toContain('pathname: "/business/[id]", params: { id: business.id }');
    for (const renderedField of ["business.id", "business.name", "business.category", "business.city", "business.stateCode", "business.listingStatus", "business.distanceMiles"]) {
      expect(resultSurfaceSource).toContain(renderedField);
    }
    expect(resultSurfaceSource).not.toContain("stay.");
  });

  it("keeps nearby lookup an explicit active-stay action on the existing endpoint, never chat", () => {
    expect(temporaryStaysSource).toContain("stay.isActive ? <TouchableOpacity");
    expect(nearbySearchSource).toContain("temporary-stays/${encodeURIComponent(stay.id)}/nearby");
    expect(nearbySearchSource).toContain('method: "POST"');
    expect(nearbySearchSource).toContain("readPublicDirectoryBusinesses(payload)");
    expect(nearbySearchSource).not.toContain("api/kinfolk/chat");
    expect(temporaryStaysSource).not.toContain("api/kinfolk/chat");
  });
});
