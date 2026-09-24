import { describe, expect, it } from "vitest";
import {
  NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS,
  NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256,
  NATIONAL_MASTER_DIRECTORY_SOURCE,
  assertNationalMasterDirectoryDataset,
  buildNationalMasterDirectoryProfile,
  nationalMasterDirectorySqlPredicate,
} from "../nationalMasterDirectory";

describe("national master directory activation", () => {
  it("accepts only the checksum-locked 18,294-row source dataset", () => {
    const records = assertNationalMasterDirectoryDataset();
    expect(records).toHaveLength(NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS);
  });

  it("creates a stable MWM profile without inventing a location pin or badge", () => {
    const profile = buildNationalMasterDirectoryProfile({
      source_row: 2,
      name: "Example Community Spa",
      city: "Philadelphia",
      state: "PA",
      category: "Beauty & Hair",
      subcategory: "Spa",
      cultural_specialty: "Natural hair care",
      address: "",
      phone: "",
      website: "https://example.org",
      source_url: "https://source.example.org/example",
      source_name: "Example source",
      source_status: "CURRENT_PUBLIC_EVIDENCE_2026",
      ownership_or_identity_evidence: "",
      regulated_profession: "",
      public_display_recommendation: "ELIGIBLE_UNCLAIMED_AFTER_RECONCILIATION",
      notes: "Public directory listing.",
      audit_date: "2026-09-24",
      offline_production_name_match: "NO",
      replit_action: "LIVE_DUPLICATE_CHECK_THEN_CREATE_CANDIDATE",
      price_range: "$$",
      price_basis: "Source",
      price_last_checked: "2026-09-24",
      location_model: "Directory",
      brand_or_franchise: "",
      mobile_route_notes: "",
      nearby_cultural_sites_tags: "",
    });
    expect(profile.id).toMatch(/^national-/);
    expect(profile.address).toBe("");
    expect(profile.ownershipDesignations).toEqual([]);
    expect(profile.ownershipClaim).toBeNull();
  });

  it("keeps an explicitly reported designation distinct from verification", () => {
    const profile = buildNationalMasterDirectoryProfile({
      source_row: 3,
      name: "Example Source-Reported Business",
      city: "Houston",
      state: "TX",
      category: "Food & Drink",
      subcategory: "Restaurant",
      cultural_specialty: "",
      address: "",
      phone: "",
      website: "",
      source_url: "https://source.example.org/example",
      source_name: "Example source",
      source_status: "CURRENT_PUBLIC_EVIDENCE_2026",
      ownership_or_identity_evidence: "Explicit source listing: Black-owned and woman-owned.",
      regulated_profession: "",
      public_display_recommendation: "ELIGIBLE_UNCLAIMED_AFTER_RECONCILIATION",
      notes: "",
      audit_date: "2026-09-24",
      offline_production_name_match: "NO",
      replit_action: "LIVE_DUPLICATE_CHECK_THEN_CREATE_CANDIDATE",
      price_range: "",
      price_basis: "",
      price_last_checked: "",
      location_model: "",
      brand_or_franchise: "",
      mobile_route_notes: "",
      nearby_cultural_sites_tags: "",
    });
    expect(profile.ownershipDesignations).toEqual(["black-owned", "women-owned"]);
    expect(profile.ownershipClaim).toBe("source_reported_designation_unverified");
    expect(profile.blackOwned).toBe(true);
  });

  it("uses the importer-only source marker for ordinary directory discovery", () => {
    expect(nationalMasterDirectorySqlPredicate("b.id")).toContain(NATIONAL_MASTER_DIRECTORY_SOURCE);
    expect(NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256).toHaveLength(64);
  });
});
