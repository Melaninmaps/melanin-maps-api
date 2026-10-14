import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_MAP_RESTORATION_POLICY_VERSION,
  isFounderMapRestorationV4Candidate,
  matchingCensusLocation,
  parseCompleteStoredPhysicalAddress,
  startFounderMapRestorationWorker,
} from "../mapRestorationWorker";

const source = readFileSync(
  fileURLToPath(new URL("../mapRestorationWorker.ts", import.meta.url)),
  "utf8",
);

describe("founder map restoration", () => {
  it("never starts the map worker in explicitly isolated Kinfolk-memory staging", () => {
    expect(
      startFounderMapRestorationWorker(
        {} as never,
        {} as never,
        {
          MAP_RESTORATION_WORKER_ENABLED: "1",
          KINFOLK_MEMORY_STAGING_ISOLATION: "1",
        },
      ),
    ).toBeNull();
  });

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

  it("normalizes terminal ZIP tokens held in the street field when city and state are stored separately", () => {
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "cohort-1dbe1d2d4111f27dc02f1684",
        name: "Hourigan Construction",
        address: "411 E. Franklin Street, Suite 400 23219",
        city: "Richmond",
        state: "VA",
        country: "US",
        postalCode: null,
      }),
    ).toMatchObject({
      queryAddress: "411 E. Franklin Street, Suite 400, Richmond, VA 23219",
      houseNumber: "411",
      directional: "east",
      postalCode: "23219",
    });
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "cohort-1f364139f5c15179c7618504",
        name: "Velocity Systems AI",
        address: "9021 Patterson Ave 23229",
        city: "Richmond",
        state: "VA",
        country: "US",
        postalCode: null,
      }),
    ).toMatchObject({
      queryAddress: "9021 Patterson Ave, Richmond, VA 23229",
      houseNumber: "9021",
      directional: null,
      postalCode: "23229",
    });
    expect(
      parseCompleteStoredPhysicalAddress({
        id: "cohort-25d7fee5dbd96fc6729db3ed",
        name: "ColonialWebb",
        address: "1920 E Parham Rd 23228",
        city: "Richmond",
        state: "VA",
        country: "US",
        postalCode: null,
      }),
    ).toMatchObject({
      queryAddress: "1920 E Parham Rd, Richmond, VA 23228",
      houseNumber: "1920",
      directional: "east",
      postalCode: "23228",
    });
  });

  it("uses the Census matched house number rather than the range start and retains directional safety", () => {
    const hourigan = parseCompleteStoredPhysicalAddress({
      id: "cohort-1dbe1d2d4111f27dc02f1684",
      name: "Hourigan Construction",
      address: "411 E. Franklin Street, Suite 400 23219",
      city: "Richmond",
      state: "VA",
      country: "US",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(hourigan!, {
        matchedAddress: "411 E FRANKLIN ST, RICHMOND, VA, 23219",
        coordinates: { x: -77.439884584772, y: 37.541631012405 },
        addressComponents: {
          fromAddress: "401",
          preDirection: "E",
          streetName: "FRANKLIN",
          suffixType: "ST",
          city: "RICHMOND",
          state: "VA",
          zip: "23219",
        },
      }),
    ).toMatchObject({
      latitude: 37.541631012405,
      longitude: -77.439884584772,
      components: { houseNumber: "411" },
    });

    const julia = parseCompleteStoredPhysicalAddress({
      id: "cohort-10bcaf2f0a8eb2977e7df14b",
      name: "Julia de Burgos Bookstore at Taller Puertorriqueño",
      address: "2600 N. 5th Street, Philadelphia, PA",
      city: "Philadelphia",
      state: "PA",
      country: "US",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(julia!, {
        matchedAddress: "2600 N 5TH ST, PHILADELPHIA, PA, 19133",
        coordinates: { x: -75.140604466051, y: 39.990563944951 },
        addressComponents: {
          fromAddress: "2600",
          preDirection: "N",
          streetName: "5TH",
          suffixType: "ST",
          city: "PHILADELPHIA",
          state: "PA",
          zip: "19133",
        },
      }),
    ).toMatchObject({ components: { houseNumber: "2600" } });

    const velocity = parseCompleteStoredPhysicalAddress({
      id: "cohort-1f364139f5c15179c7618504",
      name: "Velocity Systems AI",
      address: "9021 Patterson Ave 23229",
      city: "Richmond",
      state: "VA",
      country: "US",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(velocity!, {
        matchedAddress: "9021 PATTERSON AVE, RICHMOND, VA, 23229",
        coordinates: { x: -77.576356025638, y: 37.595116939437 },
        addressComponents: {
          fromAddress: "8933",
          streetName: "PATTERSON",
          suffixType: "AVE",
          city: "RICHMOND",
          state: "VA",
          zip: "23229",
        },
      }),
    ).toMatchObject({ components: { houseNumber: "9021" } });

    const colonialWebb = parseCompleteStoredPhysicalAddress({
      id: "cohort-25d7fee5dbd96fc6729db3ed",
      name: "ColonialWebb",
      address: "1920 E Parham Rd 23228",
      city: "Richmond",
      state: "VA",
      country: "US",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(colonialWebb!, {
        matchedAddress: "1920 E PARHAM RD, RICHMOND, VA, 23228",
        coordinates: { x: -77.482856947124, y: 37.638860273872 },
        addressComponents: {
          fromAddress: "1900",
          preDirection: "E",
          streetName: "PARHAM",
          suffixType: "RD",
          city: "RICHMOND",
          state: "VA",
          zip: "23228",
        },
      }),
    ).toMatchObject({ components: { houseNumber: "1920" } });

    const nemi = parseCompleteStoredPhysicalAddress({
      id: "cohort-0f7f9a5100265004210efbaf",
      name: "Nemi",
      address: "2636 Ann Street",
      city: "Philadelphia",
      state: "PA",
      country: "US",
      postalCode: null,
    });
    expect(
      matchingCensusLocation(nemi!, {
        matchedAddress: "2636 E ANN ST, PHILADELPHIA, PA, 19134",
        coordinates: { x: -75.10893026842, y: 39.981693504284 },
        addressComponents: {
          fromAddress: "2620",
          preDirection: "E",
          streetName: "ANN",
          suffixType: "ST",
          city: "PHILADELPHIA",
          state: "PA",
          zip: "19134",
        },
      }),
    ).toBeNull();
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

  it("scopes v4 writes to parser-ready records and prior exact-geocoder exceptions", () => {
    const base = {
      id: "scoped-business",
      name: "Scoped Business",
      address: "4600 Silver Hill Road",
      city: "Washington",
      state: "DC",
      country: "US",
      postalCode: null,
    } as const;
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      priorOutcome: "missing_complete_stored_address",
    })).toBe(true);
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      priorOutcome: "geocoder_no_exact_match",
    })).toBe(true);
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      priorOutcome: "geocoder_error",
    })).toBe(true);
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      address: "Silver Hill Road",
      priorOutcome: "missing_complete_stored_address",
    })).toBe(false);
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      priorOutcome: "geocoder_unavailable",
    })).toBe(false);
    expect(isFounderMapRestorationV4Candidate({
      ...base,
      publicLocationKind: "service_area",
      priorOutcome: "geocoder_no_exact_match",
    })).toBe(false);
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
      "founder-map-restoration-v4-parser-comparator",
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
    expect(source).toContain("matchedHouseNumber");
    expect(source).toContain("splitTerminalEmbeddedPostalCode");
    expect(source).toContain("JOIN public.business_discovery_eligibility e ON e.business_id::text = b.id::text");
    expect(source).toContain("o.outcome IN (");
    expect(source).toContain("isFounderMapRestorationV4Candidate");
    expect(source).toContain('"missing_complete_stored_address"');
    expect(source).toContain('"geocoder_no_exact_match"');
    expect(source).toContain('"geocoder_error"');
    expect(source).toContain("Scoped map restoration queue is empty; worker stopped");
    expect(source).not.toContain("SET ownership_designations");
    expect(source).not.toContain("SET website =");
  });
});
