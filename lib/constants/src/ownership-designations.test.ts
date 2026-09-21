import { describe, expect, it } from "vitest";
import {
  extractExplicitOwnershipDesignationFilterIds,
  ownershipDesignationStorageValues,
} from "./ownership-designations";

describe("explicit ownership support requests", () => {
  it("recognizes requested Black/African American support as an exact designation filter", () => {
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "I only want to support African Americans when I buy lunch",
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

  it("maps explicit designation identifiers to documented stored values", () => {
    expect(ownershipDesignationStorageValues("black-african-american").values).toContain(
      "Black / African American-Owned",
    );
    expect(ownershipDesignationStorageValues("guatemalan").values).toContain(
      "Guatemalan-Owned",
    );
  });
});
