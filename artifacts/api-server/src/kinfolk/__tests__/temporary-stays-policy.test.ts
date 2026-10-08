import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isTemporaryStayExpired,
  normalizeTemporaryStayDates,
  normalizeTemporaryStayExtension,
  openTemporaryStay,
  sealTemporaryStay,
  temporaryStayExpiresAt,
  TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS,
  TEMPORARY_STAY_PRIVACY_NOTICE,
} from "../temporary-stays-policy";

const ENV = {
  KINFOLK_PRIVATE_PLACES_ENABLED: "true",
  KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 9).toString("base64")}`,
} as NodeJS.ProcessEnv;
const source = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("Temporary Stays privacy policy", () => {
  it("keeps required dates inside the encrypted payload and rejects missing or invalid ranges", () => {
    const dates = normalizeTemporaryStayDates({ arrivalDate: "2026-10-10", departureDate: "2026-10-17" });
    expect(dates).toEqual({ arrivalDate: "2026-10-10", departureDate: "2026-10-17" });
    expect(normalizeTemporaryStayDates({ arrivalDate: "2026-10-17", departureDate: "2026-10-10" })).toBeNull();
    expect(normalizeTemporaryStayDates({ arrivalDate: "2026-10-10" })).toBeNull();
    const sealed = sealTemporaryStay({ exactAddress: "1234 Example Street, Philadelphia, PA", googleFormattedAddress: "1234 Example Street, Philadelphia, PA, USA", latitude: 39.95, longitude: -75.16, ...dates! }, ENV);
    expect(sealed.encryptedPayload).not.toContain("2026-10-10");
    expect(sealed.encryptedPayload).not.toContain("Example Street");
    expect(openTemporaryStay(sealed.encryptedPayload, sealed.encryptionKeyVersion, ENV)).toMatchObject(dates!);
  });

  it("sets a bounded post-departure grace window and only permits a later extension before expiry", () => {
    const payload = { departureDate: "2026-10-17" };
    const expiresAt = temporaryStayExpiresAt(payload);
    expect(expiresAt.toISOString()).toBe("2026-10-24T23:59:59.999Z");
    expect(TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS).toBe(7);
    expect(isTemporaryStayExpired(payload, new Date("2026-10-24T23:59:59.998Z"))).toBe(false);
    expect(isTemporaryStayExpired(payload, new Date("2026-10-25T00:00:00.000Z"))).toBe(true);
    expect(normalizeTemporaryStayExtension({ arrivalDate: "2026-10-10", currentDepartureDate: "2026-10-17", departureDate: "2026-10-22" })).toEqual({ arrivalDate: "2026-10-10", departureDate: "2026-10-22" });
    expect(normalizeTemporaryStayExtension({ arrivalDate: "2026-10-10", currentDepartureDate: "2026-10-17", departureDate: "2026-10-17" })).toBeNull();
  });

  it("uses the existing key ring, is fail-closed, and retains only until the visible grace window", () => {
    const route = source("../../routes/kinfolk-temporary-stays.ts");
    const retention = source("../temporary-stay-retention.ts");
    expect(route).toContain("privatePlacesRuntimeState()");
    expect(route).toContain("PRIVATE_PLACES_ENCRYPTION_UNAVAILABLE");
    expect(route).toContain("googleMapsGeocodingConsent === true");
    expect(route).toContain('router.put("/kinfolk/temporary-stays/:id"');
    expect(route).toContain('router.post("/kinfolk/temporary-stays/:id/extend"');
    expect(route).toContain('router.patch("/kinfolk/temporary-stays/:id/active"');
    expect(route).toContain("purgeOwnerExpiredStays(userId)");
    expect(route).toContain("TEMPORARY_STAY_EXPIRED");
    expect(route).toContain("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2");
    expect(retention).toContain("isTemporaryStayExpired(payload, now)");
    expect(retention).toContain("Temporary Stay retention cleanup completed");
    expect(route).not.toContain("business-ingest");
    expect(route).not.toContain("INSERT INTO businesses");
    expect(TEMPORARY_STAY_PRIVACY_NOTICE).toContain("seven days after its departure date");
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
