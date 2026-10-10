import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_MAP_RESTORATION_POLICY_VERSION,
  matchingCensusLocation,
  parseCompleteStoredPhysicalAddress,
} from "../mapRestorationWorker";

const source = readFileSync(
  fileURLToPath(new URL("../mapRestorationWorker.ts", import.meta.url)),
  "utf8",
);

describe("founder map restoration", () => {
  it("accepts a stored U.S. physical address with every map-identifying component", () => {
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "business-1",
        name: "Example Shop",
        address: "1226 N. 52nd Street, Suite 4",
        city: "Philadelphia",
        state: "PA",
        country: "United States",
        postalCode: "19131",
      }),
    ).toMatchObject({
      houseNumber: "1226",
      directional: "north",
      streetName: "52nd",
      streetType: "street",
      city: "philadelphia",
      state: "pennsylvania",
      postalCode: "19131",
    });
  });

  it("uses a complete address already stored in one field when legacy city columns are absent", () => {
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "business-legacy",
        name: "Example Shop",
        address: "100 Main Street, Phoenix, AZ 85001",
        city: null,
        state: null,
        country: "United States",
        postalCode: null,
      }),
    ).toMatchObject({
      houseNumber: "100",
      streetName: "main",
      city: "phoenix",
      state: "arizona",
      postalCode: "85001",
    });
  });

  it("accepts a street-number, street, city, and state without a ZIP while preserving exact Census component matching", () => {
    const expected = parseCompleteStoredPhysicalAddress({
      id: "business-no-zip",
      name: "Example Shop",
      address: "4600 Silver Hill Road",
      city: "Washington",
      state: "DC",
      country: "United States",
      postalCode: null,
    });
    expect(expected).toMatchObject({
      houseNumber: "4600",
      streetName: "silver hill",
      streetType: "road",
      city: "washington",
      state: "district of columbia",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(expected!, {
        matchedAddress: "4600 SILVER HILL RD, WASHINGTON, DC, 20233",
        coordinates: { x: -76.9274872, y: 38.8460162 },
        addressComponents: {
          fromAddress: "4600",
          streetName: "SILVER HILL",
          suffixType: "RD",
          city: "WASHINGTON",
          state: "DC",
          zip: "20233",
        },
      }),
    ).toMatchObject({ latitude: 38.8460162, longitude: -76.9274872 });
    expect(
      matchingCensusLocation(expected!, {
        matchedAddress: "4600 SILVER HILL RD, ARLINGTON, VA, 22201",
        coordinates: { x: -77.0, y: 38.8 },
        addressComponents: {
          fromAddress: "4600",
          streetName: "SILVER HILL",
          suffixType: "RD",
          city: "ARLINGTON",
          state: "VA",
          zip: "22201",
        },
      }),
    ).toBeNull();
  });

  it("normalizes documented directional and street-type abbreviations without requiring a ZIP", () => {
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "business-abbreviated",
        name: "Example Shop",
        address: "101 W Magnolia Ave",
        city: "Orlando",
        state: "Florida",
        country: "United States",
        postalCode: null,
      }),
    ).toMatchObject({
      houseNumber: "101",
      directional: "west",
      streetName: "magnolia",
      streetType: "avenue",
      city: "orlando",
      state: "florida",
      postalCode: null,
    });
  });

  it("records an exception rather than guessing when a stored address is incomplete", () => {
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "business-2",
        name: "Example Shop",
        address: "52nd Street",
        city: "Philadelphia",
        state: "PA",
        country: "United States",
        postalCode: null,
      }),
    ).toBeNull();
  });

  it("accepts a Census coordinate only after every map-identifying address component matches", () => {
    const expected = parseCompleteStoredPhysicalAddress({
      id: "business-census",
      name: "Example Shop",
      address: "1226 N. 52nd Street, Suite 4",
      city: "Philadelphia",
      state: "PA",
      country: "United States",
      postalCode: "19131",
    });
    expect(expected).not.toBeNull();
    expect(
      matchingCensusLocation(expected!, {
        matchedAddress: "1226 N 52ND ST, PHILADELPHIA, PA, 19131",
        coordinates: { x: -75.2199, y: 39.9891 },
        addressComponents: {
          fromAddress: "1226",
          preDirection: "N",
          streetName: "52ND",
          suffixType: "ST",
          city: "PHILADELPHIA",
          state: "PA",
          zip: "19131",
        },
      }),
    ).toMatchObject({
      latitude: 39.9891,
      longitude: -75.2199,
      locationType: "CENSUS_ADDRESS_RANGE_INTERPOLATED",
    });
    expect(
      matchingCensusLocation(expected!, {
        matchedAddress: "1228 N 52ND ST, PHILADELPHIA, PA, 19131",
        coordinates: { x: -75.2199, y: 39.9891 },
        addressComponents: {
          fromAddress: "1228",
          preDirection: "N",
          streetName: "52ND",
          suffixType: "ST",
          city: "PHILADELPHIA",
          state: "PA",
          zip: "19131",
        },
      }),
    ).toBeNull();
  });

  it("keeps the write scope to coordinates plus required map receipts and audits", () => {
    expect(FOUNDER_MAP_RESTORATION_POLICY_VERSION).toBe(
      "founder-map-restoration-v3-no-zip",
    );
    expect(source).toContain(
      "Census Geocoder exact match for stored physical address",
    );
    expect(source).toContain("CENSUS_ADDRESS_RANGE_INTERPOLATED");
    expect(source).not.toContain("GOOGLE_MAPS_API_KEY");
    expect(source).toContain("e.map_pin_evidence_id IS NULL");
    expect(source).not.toContain("e.identity_evidence_id IS NOT NULL");
    expect(source).toContain("AND b.latitude IS NULL");
    expect(source).toContain("AND b.longitude IS NULL");
    expect(source).toContain("business_legacy_map_location_attestations");
    expect(source).toContain('COUNT(*) FILTER (WHERE e.map_pin_evidence_id IS NOT NULL OR EXISTS');
    expect(source).toContain("UPDATE businesses\n        SET latitude");
    expect(source).toContain("business_discovery_eligibility_audit_events");
    expect(source).toContain("business_directory_reconciliation_audit_events");
    expect(source).toContain(
      "WHERE business_map_restoration_outcomes.outcome <> 'published'",
    );
    expect(source).toContain("currentEligibleOutcomes");
    expect(source).toContain("unmappedCurrentEligibleOutcomes");
    expect(source).toContain("outcomesOutsideCurrentPopulation");
    expect(source).toContain("explicitly_nonphysical_location");
    expect(source).toContain("ZIP when present");
    expect(source).toContain("JOIN public.business_discovery_eligibility e ON e.business_id::text = b.id::text");
    expect(source).not.toContain("SET ownership_designations");
    expect(source).not.toContain("SET website =");
  });
});
