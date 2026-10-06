import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PRIVATE_PLACES_DISCLOSURE_VERSION,
  normalizePrivatePlaceLabel,
  openPrivatePlace,
  parsePrivatePlaceKeyring,
  privatePlacesRuntimeState,
  sealPrivatePlace,
} from "../private-places-policy";

const ENCRYPTION_ENV = {
  KINFOLK_PRIVATE_PLACES_ENABLED: "true",
  KINFOLK_PRIVATE_PLACES_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 7).toString("base64")}`,
} as NodeJS.ProcessEnv;

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Kinfolk Private Places privacy policy", () => {
  it("is disabled by default and refuses to invent an encryption fallback", () => {
    expect(privatePlacesRuntimeState({})).toMatchObject({ enabled: false, encryptionReady: false });
    expect(privatePlacesRuntimeState({ KINFOLK_PRIVATE_PLACES_ENABLED: "true" })).toMatchObject({ enabled: false, encryptionReady: false });
    expect(parsePrivatePlaceKeyring("v1:not-a-32-byte-key")).toEqual([]);
  });

  it("uses an explicit versioned encryption ring and keeps raw place values out of ciphertext", () => {
    const sealed = sealPrivatePlace({
      exactAddress: "1234 Private Lane, Philadelphia, PA 19103",
      latitude: 39.9526,
      longitude: -75.1652,
      googleFormattedAddress: "1234 Private Lane, Philadelphia, PA 19103, USA",
    }, ENCRYPTION_ENV);
    expect(sealed.encryptionKeyVersion).toBe("v1");
    expect(sealed.encryptedPayload).not.toContain("Private Lane");
    expect(openPrivatePlace(sealed.encryptedPayload, sealed.encryptionKeyVersion, ENCRYPTION_ENV)).toEqual({
      exactAddress: "1234 Private Lane, Philadelphia, PA 19103",
      latitude: 39.9526,
      longitude: -75.1652,
      googleFormattedAddress: "1234 Private Lane, Philadelphia, PA 19103, USA",
    });
  });

  it("rejects address-shaped labels so ordinary settings views do not display a home address", () => {
    expect(normalizePrivatePlaceLabel("Mom's house")).toBe("Mom's house");
    expect(normalizePrivatePlaceLabel("1234 Private Lane")).toBeNull();
    expect(normalizePrivatePlaceLabel("Main Street home")).toBeNull();
  });

  it("requires the selected Google geocoding disclosure and keeps private places outside chat", () => {
    const route = source("../../routes/kinfolk-private-places.ts");
    const chat = source("../../routes/kinfolk.ts");
    const schema = source("../../../../../lib/db/src/schema/kinfolk-private-places.ts");
    expect(route).toContain("googleMapsGeocodingConsent === true");
    expect(route).toContain("body.disclosureVersion === PRIVATE_PLACES_DISCLOSURE_VERSION");
    expect(route).toContain("maps.googleapis.com/maps/api/geocode/json");
    expect(route).toContain("id = $1 AND user_id = $2");
    expect(route).toContain("is_active = true");
    expect(route).toContain("createGovernedKinfolkBusinessRepository");
    expect(route).not.toContain("router.post(\"/kinfolk/chat");
    expect(chat).not.toContain("kinfolk-private-places");
    expect(schema).toContain("encryptedPayload");
    expect(schema).not.toContain('varchar("address"');
    expect(schema).not.toContain('text("address"');
    expect(schema).not.toContain('doublePrecision("latitude"');
    expect(schema).not.toContain('doublePrecision("longitude"');
    expect(PRIVATE_PLACES_DISCLOSURE_VERSION).toBe("private-places-google-geocoding-v1");
  });
});
