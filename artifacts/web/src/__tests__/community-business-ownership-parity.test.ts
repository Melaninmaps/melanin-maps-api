import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const submissionSource = source("../pages/submit-business.tsx");
const selectorSource = source("../components/OwnershipDesignationCombobox.tsx");
const designationSearchSource = source("../../../../lib/constants/src/ownership-designation-search.ts");

describe("community business ownership designation parity", () => {
  it("uses the complete canonical taxonomy in the searchable community submission selector", () => {
    expect(submissionSource).toContain('import { OWNERSHIP_DESIGNATIONS } from "@workspace/constants"');
    expect(submissionSource).toContain("OWNERSHIP_DESIGNATIONS.map((label) => ({ value: label, label }))");
    expect(submissionSource).toContain("OwnershipDesignationCombobox");
    expect(submissionSource).toContain("LEGACY_OWNERSHIP_TO_CANONICAL");
    for (const designation of [
      "Black / African American-Owned",
      "Foundational Black American-Owned",
      "Latino / Hispanic-Owned",
      "Ethiopian-Owned",
      "Divine Nine-Affiliated",
    ]) {
      expect(source("../../../../lib/constants/src/ownership-designations.ts")).toContain(designation);
    }
  });

  it("keeps multi-designation community reports distinct from owner verification", () => {
    expect(submissionSource).toContain("communityReportedOwnership");
    expect(submissionSource).toContain("ownershipDesignations");
    expect(submissionSource).toContain("Ownership information is community-reported, never identity verification");
  });

  it("only selects supplied approved values and matches partial typeahead aliases", () => {
    expect(selectorSource).toContain("options.filter((option) => !values.includes(option.value))");
    expect(selectorSource).toContain("filterOwnershipDesignationSearchOptions");
    expect(selectorSource).toContain("Start typing: Black, Hispanic, Ethiopian");
    expect(selectorSource).toContain("No approved designation matches that text.");
    expect(selectorSource).toContain("onChange([...values, value])");
    expect(selectorSource).not.toContain("onChange([...values, query])");
    expect(designationSearchSource).toContain('"bl"');
    expect(designationSearchSource).toContain('"his"');
    expect(designationSearchSource).toContain("DESIGNATION_SEARCH_ALIASES");
  });
});
