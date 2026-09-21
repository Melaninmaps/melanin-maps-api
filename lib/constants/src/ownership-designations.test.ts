import { describe, expect, it } from "vitest";
import {
  extractExplicitOwnershipDesignationFilterIds,
  normalizeOwnershipDesignationFilterIds,
  normalizeSupportLensMode,
  ownershipDesignationStorageValues,
} from "./ownership-designations";

describe("explicit ownership support requests", () => {
  it("recognizes requested Black/African American support as an exact designation filter", () => {
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "I only want to support African American businesses when I buy lunch",
      ),
    ).toEqual(["black-african-american"]);
  });

  it("recognizes documented Asian and Guatemalan support requests without treating cuisine as evidence", () => {
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "Show me Asian-owned bookstores near me",
      ),
    ).toEqual(["asian-american"]);
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "I only want to support Guatemalan business owners",
      ),
    ).toEqual(["guatemalan"]);
  });

  it("does not infer ownership from cuisine, geography, language, or a business name", () => {
    for (const decoy of [
      "Find businesses in a Black neighborhood",
      "Find shops near a Latino cultural center",
      "Find African food businesses",
      "Find Spanish-speaking businesses",
      "Find a restaurant named Black Star",
      "Show businesses in Africa with Black imagery",
      "Support Black artists",
      "Support Latino neighborhoods",
      "Support women in tech",
    ]) {
      expect(extractExplicitOwnershipDesignationFilterIds(decoy)).toEqual([]);
    }
  });

  it("accepts construction-specific support and ownership syntax", () => {
    expect(extractExplicitOwnershipDesignationFilterIds("Black-owned businesses")).toEqual(["black-african-american"]);
    expect(extractExplicitOwnershipDesignationFilterIds("businesses owned by Black people")).toEqual(["black-african-american"]);
    expect(extractExplicitOwnershipDesignationFilterIds("support Black businesses")).toEqual(["black-african-american"]);
  });

  it("maps explicit designation identifiers to documented stored values", () => {
    expect(ownershipDesignationStorageValues("black-african-american").values).toContain(
      "Black / African American-Owned",
    );
    expect(ownershipDesignationStorageValues("guatemalan").values).toContain(
      "Guatemalan-Owned",
    );
  });

  it("normalizes legacy aliases, applies all-of inputs independently, and defaults empty lenses to all businesses", () => {
    expect(
      normalizeOwnershipDesignationFilterIds(["Black-owned", "women-owned"]),
    ).toEqual(["black-african-american", "woman"]);
    expect(
      normalizeSupportLensMode(
        "strict_documented_designations",
        ["black-african-american", "woman"],
      ),
    ).toBe("strict_documented_designations");
    expect(normalizeSupportLensMode("strict_documented_designations", [])).toBe(
      "all_businesses",
    );
  });
});
