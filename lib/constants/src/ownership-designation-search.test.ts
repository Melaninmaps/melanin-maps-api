import { describe, expect, it } from "vitest";
import { OWNERSHIP_DESIGNATIONS } from "./ownership-designations";
import {
  filterOwnershipDesignationSearchOptions,
  matchesOwnershipDesignationSearch,
} from "./ownership-designation-search";

const options = OWNERSHIP_DESIGNATIONS.map((label) => ({ value: label, label }));

describe("ownership designation search", () => {
  it("finds Black and Hispanic canonical choices from the requested short typeahead text", () => {
    expect(filterOwnershipDesignationSearchOptions(options, "BL").map((option) => option.value)).toContain(
      "Black / African American-Owned",
    );
    expect(filterOwnershipDesignationSearchOptions(options, "HIS").map((option) => option.value)).toContain(
      "Latino / Hispanic-Owned",
    );
  });

  it("returns only supplied canonical options and does not turn a query into an ownership assertion", () => {
    expect(matchesOwnershipDesignationSearch(
      { value: "Black / African American-Owned", label: "Black / African American-Owned" },
      "BL",
    )).toBe(true);
    expect(filterOwnershipDesignationSearchOptions(options, "unapproved free text")).toEqual([]);
  });
});
