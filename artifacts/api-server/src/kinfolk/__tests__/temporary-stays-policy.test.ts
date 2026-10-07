import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openTemporaryStay, normalizeTemporaryStayDates, sealTemporaryStay, TEMPORARY_STAY_PRIVACY_NOTICE } from "../temporary-stays-policy";

const ENV = {
  KINFOLK_PRIVATE_PLACES_ENABLED: "true",
  KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 9).toString("base64")}`,
} as NodeJS.ProcessEnv;
const source = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("Temporary Stays privacy policy", () => {
  it("keeps optional dates inside the encrypted payload and rejects invalid ranges", () => {
    const dates = normalizeTemporaryStayDates({ arrivalDate: "2026-10-10", departureDate: "2026-10-17" });
    expect(dates).toEqual({ arrivalDate: "2026-10-10", departureDate: "2026-10-17" });
    expect(normalizeTemporaryStayDates({ arrivalDate: "2026-10-17", departureDate: "2026-10-10" })).toBeNull();
    const sealed = sealTemporaryStay({ exactAddress: "1234 Example Street, Philadelphia, PA", googleFormattedAddress: "1234 Example Street, Philadelphia, PA, USA", latitude: 39.95, longitude: -75.16, ...dates! }, ENV);
    expect(sealed.encryptedPayload).not.toContain("2026-10-10");
    expect(sealed.encryptedPayload).not.toContain("Example Street");
    expect(openTemporaryStay(sealed.encryptedPayload, sealed.encryptionKeyVersion, ENV)).toMatchObject(dates!);
  });

  it("uses the existing key ring, is fail-closed, and does not auto-delete at checkout", () => {
    const route = source("../../routes/kinfolk-temporary-stays.ts");
    expect(route).toContain("privatePlacesRuntimeState()");
    expect(route).toContain("PRIVATE_PLACES_ENCRYPTION_UNAVAILABLE");
    expect(route).toContain("googleMapsGeocodingConsent === true");
    expect(route).toContain("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2");
    expect(route).not.toContain("business-ingest");
    expect(route).not.toContain("INSERT INTO businesses");
    expect(route).not.toContain("setTimeout");
    expect(TEMPORARY_STAY_PRIVACY_NOTICE).toContain("never deletes it automatically");
  });

  it("never returns address, coordinates, ciphertext, or a Google result from contextual nearby use", () => {
    const route = source("../../routes/kinfolk-temporary-stays.ts");
    const nearbyRoute = route.slice(route.indexOf('router.post("/kinfolk/temporary-stays/:id/nearby"'));
    expect(route).toContain("never exact address, coordinates, encrypted payload, or Google result");
    expect(nearbyRoute).toContain("governedBusinessRepository.findWithinRadius");
    expect(nearbyRoute).toContain("res.json({ stay: safe(stay), radiusMiles, businesses })");
    expect(nearbyRoute).not.toContain("res.json({ location");
  });
});
