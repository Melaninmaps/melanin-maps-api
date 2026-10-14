import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const privatePlacesSource = readFileSync(
  new URL("../components/kinfolk/PrivatePlacesSettings.tsx", import.meta.url),
  "utf8",
);
const projectionSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf("type NearbyDirectoryBusiness"),
  privatePlacesSource.indexOf("async function responseMessage"),
);
const nearbySearchSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf("const useForNearbySearch"),
  privatePlacesSource.indexOf("return ("),
);
const resultSurfaceSource = privatePlacesSource.slice(
  privatePlacesSource.indexOf('{nearbySearched ? ('),
  privatePlacesSource.indexOf('<div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-4">'),
);

describe("web Private Places governed nearby results", () => {
  it("renders governed public-business results and navigates with the destination ID only", () => {
    expect(nearbySearchSource).toContain("/nearby");
    expect(nearbySearchSource).toContain("setNearbyBusinesses(readPublicDirectoryBusinesses(payload))");
    expect(resultSurfaceSource).toContain('data-testid="private-places-nearby-results"');
    expect(resultSurfaceSource).toContain("nearbyBusinesses.map((business)");
    expect(resultSurfaceSource).toContain('href={`/businesses/${encodeURIComponent(business.id)}`}');
    expect(resultSurfaceSource).toContain("business.name");
  });

  it("projects an explicit public card allowlist and keeps the nearby presentation away from private data", () => {
    for (const safeField of ["id", "name", "category", "city", "stateCode", "verified"]) {
      expect(projectionSource).toContain(safeField);
    }
    for (const privateField of ["label", "exactAddress", "address", "latitude", "longitude", "ciphertext", "encrypted", "origin"]) {
      expect(projectionSource).not.toContain(privateField);
    }
    for (const privateProperty of ["place.label", "business.address", "business.latitude", "business.longitude", "ciphertext", "encrypted", "origin"]) {
      expect(resultSurfaceSource).not.toContain(privateProperty);
    }
    expect(nearbySearchSource).not.toContain("place.label");
    expect(privatePlacesSource).not.toContain("api/kinfolk/chat");
  });

  it("requires the current disclosure before enabling manual nearby search", () => {
    expect(privatePlacesSource).toContain("disclosureVersion: string");
    expect(privatePlacesSource).toContain("place.disclosureVersion === status.disclosureVersion");
    expect(privatePlacesSource).toContain("Update and re-acknowledge before this place can be used for nearby search");
  });
});
