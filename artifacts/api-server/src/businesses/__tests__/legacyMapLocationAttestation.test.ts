import { describe, expect, it } from "vitest";
import {
  LEGACY_MAP_VISIBILITY_BASELINE_SHA,
  legacyMapLocationAttestationChecksum,
  legacyMapLocationSnapshotMatchesCurrent,
  validateLegacyMapLocationAttestationInput,
  validateLegacyMapLocationRevocationInput,
} from "../legacyMapLocationAttestation";

const request = {
  decisionReason: "Historical map snapshot was compared to the unchanged canonical stored location.",
  batchReference: "kinfolk-legacy-map-restoration-001",
  historicalMapBaselineSha: LEGACY_MAP_VISIBILITY_BASELINE_SHA,
  snapshot: {
    address: "123 Example Street, Philadelphia, PA 19103",
    city: "Philadelphia",
    state: "PA",
    country: "United States",
    latitude: 39.944,
    longitude: -75.16,
    businessCreatedAt: "2025-01-01T00:00:00.000Z",
  },
};

describe("legacy map location attestation", () => {
  it("accepts only a named pre-receipt baseline and a trustworthy stored physical snapshot", () => {
    const input = validateLegacyMapLocationAttestationInput(request);
    expect(input.historicalMapBaselineSha).toBe(LEGACY_MAP_VISIBILITY_BASELINE_SHA);
    expect(input.snapshot.address).toBe("123 Example Street, Philadelphia, PA 19103");

    expect(() => validateLegacyMapLocationAttestationInput({
      ...request,
      historicalMapBaselineSha: "0ca51e2cc47997a523efb850bd56b850bb050568",
    })).toThrow("approved pre-receipt map baseline");
    expect(() => validateLegacyMapLocationAttestationInput({
      ...request,
      snapshot: { ...request.snapshot, address: "Philadelphia, PA" },
    })).toThrow("street-numbered physical address");
    expect(() => validateLegacyMapLocationAttestationInput({
      ...request,
      snapshot: { ...request.snapshot, latitude: 39.944, longitude: -75.16, city: "Philadelphia", state: "PA" },
    })).not.toThrow();
    expect(() => validateLegacyMapLocationAttestationInput({
      ...request,
      snapshot: { ...request.snapshot, latitude: 39.9526, longitude: -75.1652 },
    })).toThrow("not trustworthy for a business pin");
  });

  it("rejects legacy city-center placeholders and stale/changed current locations", () => {
    expect(() => validateLegacyMapLocationAttestationInput({
      ...request,
      snapshot: { ...request.snapshot, latitude: 39.9526, longitude: -75.1652 },
    })).toThrow("not trustworthy for a business pin");

    const input = validateLegacyMapLocationAttestationInput(request);
    expect(legacyMapLocationSnapshotMatchesCurrent(input, {
      address: "123 Example Street, Philadelphia, PA 19103",
      city: "Philadelphia",
      state: "PA",
      country: "United States",
      latitude: "39.944",
      longitude: "-75.16",
      createdAt: "2025-01-01T00:00:00.000Z",
      serviceArea: null,
      publicLocationKind: "physical",
    })).toBe(true);
    expect(legacyMapLocationSnapshotMatchesCurrent(input, {
      address: "124 Example Street, Philadelphia, PA 19103",
      city: "Philadelphia",
      state: "PA",
      country: "United States",
      latitude: "39.944",
      longitude: "-75.16",
      createdAt: "2025-01-01T00:00:00.000Z",
      serviceArea: null,
      publicLocationKind: "physical",
    })).toBe(false);
    expect(legacyMapLocationSnapshotMatchesCurrent(input, {
      address: "123 Example Street, Philadelphia, PA 19103",
      city: "Philadelphia",
      state: "PA",
      country: "United States",
      latitude: "39.944",
      longitude: "-75.16",
      createdAt: "2025-01-01T00:00:00.000Z",
      serviceArea: "Philadelphia metro area",
      publicLocationKind: "service_area",
    })).toBe(false);
  });

  it("uses an immutable manifest checksum and a separately validated state reason", () => {
    const input = validateLegacyMapLocationAttestationInput(request);
    expect(legacyMapLocationAttestationChecksum("business-1", input))
      .toBe(legacyMapLocationAttestationChecksum("business-1", input));
    expect(legacyMapLocationAttestationChecksum("business-1", input))
      .not.toBe(legacyMapLocationAttestationChecksum("business-2", input));
    expect(validateLegacyMapLocationRevocationInput({ decisionReason: "Coordinate is no longer safe for display." }))
      .toEqual({ decisionReason: "Coordinate is no longer safe for display." });
    expect(() => validateLegacyMapLocationRevocationInput({ decisionReason: "no" })).toThrow("3–4,000");
  });
});
