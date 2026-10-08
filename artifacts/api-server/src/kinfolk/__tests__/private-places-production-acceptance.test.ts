import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
  PRIVATE_PLACES_FICTIONAL_QA_PROVIDER,
  fictionalPrivatePlacesQaGeocode,
  isPrivatePlacesFictionalQaAddress,
  shouldRunPrivatePlacesSyntheticQaAcceptance,
} from "../private-places-fictional-qa";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Private Places production fictional QA acceptance", () => {
  it("recognizes only one non-address fixture and never resolves a real address", () => {
    expect(isPrivatePlacesFictionalQaAddress(PRIVATE_PLACES_FICTIONAL_QA_ADDRESS)).toBe(true);
    expect(isPrivatePlacesFictionalQaAddress("100 Real Street, Philadelphia, PA")).toBe(false);
    expect(fictionalPrivatePlacesQaGeocode(PRIVATE_PLACES_FICTIONAL_QA_ADDRESS)).toEqual({
      latitude: 0,
      longitude: 0,
      formattedAddress: PRIVATE_PLACES_FICTIONAL_QA_ADDRESS,
      provider: PRIVATE_PLACES_FICTIONAL_QA_PROVIDER,
    });
    expect(fictionalPrivatePlacesQaGeocode("100 Real Street, Philadelphia, PA")).toBeNull();
  });

  it("requires an explicit production-only non-secret acceptance switch", () => {
    expect(shouldRunPrivatePlacesSyntheticQaAcceptance({ NODE_ENV: "production", KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE: "true" })).toBe(true);
    expect(shouldRunPrivatePlacesSyntheticQaAcceptance({ NODE_ENV: "production", KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE: "false" })).toBe(false);
    expect(shouldRunPrivatePlacesSyntheticQaAcceptance({ NODE_ENV: "test", KINFOLK_PRIVATE_PLACES_SYNTHETIC_QA_ACCEPTANCE: "true" })).toBe(false);
  });

  it("keeps the production harness loopback-only, transactional, and free of real addresses", () => {
    const harness = source("../private-places-production-acceptance.ts");
    expect(harness).toContain('server!.listen(0, "127.0.0.1"');
    expect(harness).toContain('await client.query("BEGIN")');
    expect(harness).toContain('await client.query("ROLLBACK")');
    expect(harness).toContain('process.env.KINFOLK_PRIVATE_PLACES_ENABLED = "true"');
    expect(harness).toContain("process.env.KINFOLK_PRIVATE_PLACES_ENABLED = priorEnabled");
    expect(harness).toContain("synthetic QA identities must not persist after rollback");
    expect(harness).toContain("fixture-only provider-independent geocoding");
    expect(harness).not.toContain("maps.googleapis.com");
    expect(harness).not.toContain("100 Real Street");
  });

  it("keeps fixture nearby lookup empty and out of directory/model paths", () => {
    const privateRoute = source("../../routes/kinfolk-private-places.ts");
    const staysRoute = source("../../routes/kinfolk-temporary-stays.ts");
    const kinfolkRoute = source("../../routes/kinfolk.ts");
    expect(privateRoute).toContain("isPrivatePlacesFictionalQaProvider");
    expect(staysRoute).toContain("isPrivatePlacesFictionalQaProvider");
    expect(staysRoute).toContain("createKinfolkTemporaryStaysRouter");
    expect(privateRoute).toContain("businesses: []");
    expect(staysRoute).toContain("businesses: []");
    expect(kinfolkRoute).not.toContain("private-places-fictional-qa");
    expect(kinfolkRoute).not.toContain("kinfolk-private-places");
  });

  it("runs the explicit production acceptance before accepting traffic", () => {
    const startup = source("../../index.ts");
    expect(startup).toContain("shouldRunPrivatePlacesSyntheticQaAcceptance");
    expect(startup).toContain("runPrivatePlacesProductionSyntheticAcceptance");
    expect(startup).toContain("Private Places synthetic acceptance passed before traffic");
    expect(startup).toContain("kinfolk_private_places_synthetic_acceptance_failed");
  });
});
