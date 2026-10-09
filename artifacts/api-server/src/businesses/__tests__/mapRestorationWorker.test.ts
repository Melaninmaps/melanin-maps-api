import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FOUNDER_MAP_RESTORATION_POLICY_VERSION,
  parseCompleteStoredPhysicalAddress,
} from "../mapRestorationWorker";

const source = readFileSync(
  fileURLToPath(new URL("../mapRestorationWorker.ts", import.meta.url)),
  "utf8",
);

describe("founder map restoration", () => {
  it("accepts only a complete stored U.S. physical address with every map-identifying component", () => {
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

  it("keeps the write scope to coordinates plus required map receipts and audits", () => {
    expect(FOUNDER_MAP_RESTORATION_POLICY_VERSION).toBe(
      "founder-map-restoration-v1",
    );
    expect(source).toContain(
      "Google Geocoding exact match for stored physical address",
    );
    expect(source).toContain("e.map_pin_evidence_id IS NULL");
    expect(source).toContain("UPDATE businesses\n        SET latitude");
    expect(source).toContain("business_discovery_eligibility_audit_events");
    expect(source).toContain("business_directory_reconciliation_audit_events");
    expect(source).toContain(
      "WHERE business_map_restoration_outcomes.outcome <> 'published'",
    );
    expect(source).not.toContain("SET ownership_designations");
    expect(source).not.toContain("SET website =");
  });
});
